import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { spawn, execFileSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backend = process.env.LARAVEL_BACKEND_DIR || path.resolve(root, '../backend elmoetch pos_admin_dashboard');
const output = path.join(root, 'docs/laravel-connections');
fs.mkdirSync(output, { recursive: true });
const traceFile = path.join(output, 'server-network.jsonl');
const frontend = 'http://127.0.0.1:4320';
const api = 'http://127.0.0.1:8000/api/v1';
const results = [], browserRequests = [], children = [], logs = [];
const forbidden = hostname => /(^|\.)supabase\.(co|com|in)$/i.test(hostname);
const trace = () => fs.readFileSync(traceFile, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function credentials(role) {
  const text = fs.readFileSync(path.join(backend, '.runtime', role === 'owner' ? 'local-account.txt' : `${role}-account.txt`), 'utf8');
  return { email: /Email: (.+)/.exec(text)[1], password: /Password: (.+)/.exec(text)[1] };
}
function portOpen(port) {
  return new Promise(resolve => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
  });
}
async function ready(url) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(url)).ok) return; } catch { /* server starting */ }
    await sleep(500);
  }
  throw Error(`Server did not start: ${url}`);
}
function start(command, args, cwd, extraEnv = {}) {
  const log = fs.openSync(path.join(output, command === 'php' ? 'laravel-runtime.log' : 'next-runtime.log'), 'w');
  logs.push(log);
  const child = spawn(command, args, { cwd, detached: true, stdio: ['ignore', log, log], env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1', ...extraEnv } });
  children.push(child);
}
async function jsonRequest(token, route, body, method = 'POST') {
  const response = await fetch(`${api}/${route}`, { method, headers: { accept: 'application/json', 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), redirect: 'error' });
  return { response, data: await response.json().catch(() => null) };
}
function mysqlRows(sql) {
  return execFileSync('mysql', [`--defaults-extra-file=${path.join(backend, '.runtime/mysql-admin.cnf')}`, '--batch', '--skip-column-names', 'dashboard', '-e', sql], { encoding: 'utf8' }).trim();
}
async function step(name, action) {
  const start = trace().length;
  const evidence = await action();
  await sleep(75);
  const requests = trace().slice(start).filter(row => row.path.startsWith('/api/v1/'));
  if (name.startsWith('page ')) {
    assert.ok(requests.some(row => row.path === '/api/v1/auth/me'), `${name}: no Laravel identity verification`);
    assert.ok(requests.every(row => row.status === 200), `${name}: Laravel query failed`);
    if (!name.startsWith('page /settings ')) assert.ok(requests.some(row => row.path.startsWith('/api/v1/data/')), `${name}: no Laravel data request`);
  }
  results.push({ flow: name, status: 'PASS', ...evidence, backendRequests: requests });
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2) + '\n');
  console.log('PASS '+name);
}
let browser, token;
try {
  assert.equal(await portOpen(4320), false, 'Frontend port must be free; existing servers are never stopped by this runner.');
  assert.equal(await portOpen(8000), false, 'Laravel port must be free.');
  fs.writeFileSync(traceFile, '');
  start('php', ['artisan', 'serve', '--host=127.0.0.1', '--port=8000'], backend);
  await ready('http://127.0.0.1:8000/up');
  start(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', '4320'], root, {
    NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --import=${pathToFileURL(path.join(root, 'scripts/lib/connection-trace.mjs')).href}`.trim(),
    CONNECTION_AUDIT_TRACE: traceFile, DATA_PROVIDER: 'laravel', LARAVEL_API_URL: api,
  });
  await ready(frontend + '/login');
  const auth = await jsonRequest(null, 'auth/login', credentials('owner'));
  assert.equal(auth.response.status, 200); token = auth.data.token;
  const query = async (resource, columns, filters = []) => {
    const response = await jsonRequest(token, `data/${resource}/query`, { columns, filters, limit: 1000 });
    assert.equal(response.response.status, 200); return response.data.data;
  };
  const historical = (await query('license_issuances', 'id,license_id,request_id,license_document_sha256'))[0];
  const historicalLicense = (await query('licenses', 'id,customer_id', [{ column: 'id', operator: 'eq', value: historical.license_id }]))[0];
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
  browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  context.setDefaultTimeout(15000);
  await context.addCookies([{ name: 'elmo_admin_locale', value: 'en', url: frontend }]);
  async function auditBrowserRoute(route) {
    const request = route.request(), url = new URL(request.url());
    browserRequests.push({ hostname: url.hostname, path: url.pathname, method: request.method() });
    if (forbidden(url.hostname)) { await route.abort(); return; }
    if (request.headers()['next-router-prefetch']) { await route.abort(); return; }
    await route.continue();
  }
  await context.route('**/*', auditBrowserRoute);
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await step('Laravel login through the Next.js Server Action', async () => {
    await page.goto(frontend + '/login');
    const user = credentials('owner');
    await page.locator('[name=email]').fill(user.email); await page.locator('[name=password]').fill(user.password);
    await Promise.all([page.waitForURL(url => url.pathname === '/dashboard'), page.locator('button[type=submit]').click()]);
    return { authenticated: true };
  });
  const routes = ['/', '/dashboard', '/plans', '/customers', `/customers/${historicalLicense.customer_id}`, '/licenses', `/licenses/${historical.license_id}`, '/subscriptions', '/devices', '/activation-requests', '/issuances', '/audit-logs', '/settings'];
  for (const locale of ['en', 'ar']) {
    const localeResponse = await context.request.post(frontend + '/api/locale', { headers: { origin: frontend }, data: { locale } });
    assert.equal(localeResponse.status(), 200);
    results.push({ flow: '/api/locale', locale, status: 'PASS', owner: 'Next.js HttpOnly locale cookie; intentionally no database call' });
    for (const route of routes) {
      await step(`page ${route.replace(historicalLicense.customer_id, '[customerId]').replace(historical.license_id, '[licenseId]')} ${locale}`, async () => {
        const response = await context.request.get(frontend + route);
        assert.equal(response.status(), 200);
        const html = await response.text();
        assert.ok(html.includes(`lang="${locale}"`), route);
        assert.ok(html.includes(`dir="${locale === 'ar' ? 'rtl' : 'ltr'}"`), route);
        assert.match(html, /<h1\b/);
        assert.ok(!/<p[^>]*>(Staging data is unavailable|بيانات بيئة الاختبار غير متاحة)<\/p>/.test(html), route);
        return { locale, httpStatus: response.status(), verification: 'authenticated SSR HTTP render with traced Laravel requests' };
      });
    }
  }
  await context.request.post(frontend + '/api/locale', { headers: { origin: frontend }, data: { locale: 'en' } });
  const fixture = `A Connection QA ${Date.now()}`;
  let planId, customerId, licenseId;
  await step('Plan create/edit Server Actions persist in MySQL', async () => {
    await page.goto(frontend + '/plans');
    await page.getByRole('button', { name: 'Create plan', exact: true }).click();
    let dialog = page.locator('dialog[open]');
    await dialog.locator('[name=name]').fill(fixture); await dialog.locator('[name=durationValue]').fill('30');
    await dialog.locator('[name=durationUnit]').selectOption('days'); await dialog.locator('[name=price]').fill('12.50');
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    await dialog.getByRole('status').filter({ hasText: 'Created successfully.' }).waitFor();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    planId = (await query('plans', 'id', [{ column: 'name', operator: 'eq', value: fixture }]))[0].id;
    await page.reload(); const row = page.locator('tr:visible').filter({ hasText: fixture });
    await row.getByRole('button', { name: 'Edit plan', exact: true }).click(); dialog = page.locator('dialog[open]');
    await dialog.locator('[name=price]').fill('19.75'); await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    await dialog.getByRole('status').filter({ hasText: 'Updated successfully.' }).waitFor();
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.match(planId, /^[a-f0-9-]{36}$/); assert.equal(mysqlRows(`SELECT price FROM plans WHERE id='${planId}'`), '19.75');
    return { mysqlPersisted: true, price: '19.75' };
  });
  await step('Customer creation Server Action persists in MySQL', async () => {
    await page.goto(frontend + '/customers'); await page.getByRole('button', { name: 'Create customer', exact: true }).click();
    const dialog = page.locator('dialog[open]');
    await dialog.locator('[name=businessName]').fill(fixture); await dialog.locator('[name=ownerName]').fill('Disposable connection QA'); await dialog.locator('[name=phone]').fill('01000000000');
    await dialog.getByRole('button', { name: 'Create customer', exact: true }).click();
    await dialog.getByRole('status').filter({ hasText: 'Created successfully.' }).waitFor();
    customerId = (await query('customers', 'id', [{ column: 'business_name', operator: 'eq', value: fixture }]))[0].id;
    assert.match(customerId, /^[a-f0-9-]{36}$/); assert.equal(mysqlRows(`SELECT COUNT(*) FROM customers WHERE id='${customerId}'`), '1');
    return { mysqlPersisted: true };
  });
  await step('Subscription provisioning and commercial code rotation use Laravel/MySQL', async () => {
    await page.goto(`${frontend}/customers/${customerId}`);
    await page.getByRole('tab', { name: 'Subscription', exact: true }).click();
    await page.getByRole('button', { name: 'Add subscription and initial license', exact: true }).click();
    const dialog = page.locator('dialog[open]'); await dialog.locator('[name=planId]').selectOption(planId);
    await dialog.getByRole('button', { name: 'Create subscription and license', exact: true }).click();
    await dialog.locator('code').waitFor();
    licenseId = (await query('licenses', 'id', [{ column: 'customer_id', operator: 'eq', value: customerId }]))[0].id;
    assert.match(licenseId, /^[a-f0-9-]{36}$/);
    const beforeHash = mysqlRows(`SELECT license_key_hash FROM licenses WHERE id='${licenseId}'`);
    await page.goto(`${frontend}/licenses/${licenseId}`);
    await page.getByRole('button', { name: 'Generate New License Code', exact: true }).click();
    await page.getByRole('button', { name: 'Generate and replace code', exact: true }).click();
    await page.locator('code').waitFor();
    const afterHash = mysqlRows(`SELECT license_key_hash FROM licenses WHERE id='${licenseId}'`);
    assert.notEqual(beforeHash, afterHash); assert.match(afterHash, /^[a-f0-9]{64}$/);
    return { mysqlPersisted: true, commercialHashChanged: true, plaintextCodeLogged: false };
  });
  await step('List filters and pagination use Laravel queries', async () => {
    for (const route of ['/plans?enabled=true&page=2', '/customers?search=Connection&status=active', '/licenses?status=draft', '/subscriptions?status=active']) {
      const response = await page.goto(frontend + route, { waitUntil: 'networkidle' }); assert.equal(response.status(), 200);
      assert.ok(!/Staging data is unavailable/.test(await page.locator('body').innerText()));
    }
    return { filteredPages: 4 };
  });
  await step('Existing .elmolic bytes travel through Next → Laravel → MySQL', async () => {
    const response = await context.request.post(frontend + '/api/activation/issue', { headers: { origin: frontend }, data: { requestId: historical.request_id } });
    assert.equal(response.status(), 200); const bytes = await response.body();
    assert.equal(createHash('sha256').update(bytes).digest('hex'), historical.license_document_sha256);
    assert.match(response.headers()['content-disposition'], /\.elmolic/);
    return { httpStatus: 200, documentHashMatchesMySQL: true };
  });
  await step('Activation verification reaches Laravel and reports the protocol blocker', async () => {
    const response = await context.request.post(frontend + '/api/activation/verify', { headers: { origin: frontend }, multipart: { file: { name: 'disposable.elmoreq', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ format: 'ELMOREQ', fixture: randomUUID() })) } } });
    assert.equal(response.status(), 422); assert.equal((await response.json()).outcome, 'protocolNotConfigured');
    return { functionality: 'BLOCKED: missing POS verification implementation', nextStatus: 422, laravelStatus: 503 };
  });
  await step('Renewal and same-operation retry reach Laravel without Supabase fallback', async () => {
    const data = { licenseId, planId, operationId: randomUUID() };
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await context.request.post(frontend + '/api/renewal/issue', { headers: { origin: frontend }, data });
      assert.equal(response.status(), 422); assert.equal((await response.json()).outcome, 'protocolNotConfigured');
    }
    return { functionality: 'BLOCKED: missing POS signing/renewal implementation', attempts: 2, sameOperationId: true };
  });
  for (const role of ['admin', 'support', 'viewer']) {
    await step(`Role ${role} identity and API permission gates`, async () => {
      const auth = await jsonRequest(null, 'auth/login', credentials(role)); assert.equal(auth.response.status, 200); assert.equal(auth.data.user.role, role);
      const staff = await browser.newContext(); await staff.route('**/*', auditBrowserRoute); await staff.addCookies([{ name: 'elmotech_backend_session', value: auth.data.token, httpOnly: true, sameSite: 'Lax', url: frontend }, { name: 'elmo_admin_locale', value: 'en', url: frontend }]);
      const p = await staff.newPage(); await p.goto(frontend + '/plans'); await p.locator('table:visible').waitFor(); assert.equal(await p.locator('html').getAttribute('lang'), 'en');
      assert.equal(await p.getByRole('button', { name: 'Create plan', exact: true }).count(), role === 'admin' ? 1 : 0);
      const issuance = await staff.request.post(frontend + '/api/activation/issue', { headers: { origin: frontend }, data: { requestId: historical.request_id } });
      assert.equal(issuance.status(), role === 'viewer' ? 403 : 200);
      const renewal = await staff.request.post(frontend + '/api/renewal/issue', { headers: { origin: frontend }, data: { licenseId, planId, operationId: randomUUID() } });
      assert.equal(renewal.status(), role === 'admin' ? 422 : 403);
      await jsonRequest(auth.data.token, 'auth/logout'); await staff.close();
      return { role, issuanceStatus: issuance.status(), renewalStatus: renewal.status() };
    });
  }
  await step('Logout revokes Laravel session and protected pages redirect to login', async () => {
    await page.getByRole('button', { name: 'Sign out', exact: true }).click(); await page.waitForURL(url => url.pathname === '/login');
    await page.goto(frontend + '/plans'); await page.waitForURL(url => url.pathname === '/login');
    return { protectedRedirect: true };
  });
  assert.deepEqual(errors, []);
  const outbound = trace(); assert.ok(outbound.length > 0);
  assert.equal(outbound.filter(row => forbidden(row.hostname)).length, 0);
  assert.equal(browserRequests.filter(row => forbidden(row.hostname)).length, 0);
  const domainRequests = outbound.filter(row => row.path.startsWith('/api/v1/'));
  assert.ok(domainRequests.length > 0); assert.ok(domainRequests.every(row => row.hostname === '127.0.0.1' && row.port === '8000'));
  for (const endpoint of ['/auth/login', '/auth/me', '/auth/logout', '/plans', '/customers', '/subscriptions/provision', '/activation/verify', '/activation/issue', '/renewal/issue']) assert.ok(domainRequests.some(row => row.path === '/api/v1' + endpoint), endpoint);
  assert.ok(domainRequests.some(row => /\/licenses\/[^/]+\/rotate-code$/.test(row.path)));
  fs.writeFileSync(path.join(output, 'browser-network.json'), JSON.stringify(browserRequests, null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'network-summary.json'), JSON.stringify({ status: 'PASS', serverRequests: outbound.length, domainRequests: domainRequests.length, browserRequests: browserRequests.length, observedBrowserContexts: ['owner', 'admin', 'support', 'viewer'], supabaseServerAttempts: 0, supabaseBrowserAttempts: 0, domainDestinations: [...new Set(domainRequests.map(row => `${row.hostname}:${row.port}`))], mysql: { database: mysqlRows('SELECT DATABASE()'), version: mysqlRows('SELECT VERSION()'), persistenceChecked: true }, pageErrors: errors }, null, 2) + '\n');
  await context.close();
} catch (error) {
  results.push({ flow: 'Verification run', status: 'FAIL', error: error.stack });
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (token) await jsonRequest(token, 'auth/logout').catch(() => {});
  for (const child of children.reverse()) { try { process.kill(-child.pid, 'SIGTERM'); } catch { /* already stopped */ } }
  for (const log of logs) fs.closeSync(log);
  await sleep(300);
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2) + '\n');
  if (children.length) {
    const ports = { frontendOpen: await portOpen(4320), laravelOpen: await portOpen(8000) };
    fs.writeFileSync(path.join(output, 'shutdown.json'), JSON.stringify(ports, null, 2) + '\n');
    if (ports.frontendOpen || ports.laravelOpen) { console.error('Owned local service did not stop.'); process.exitCode = 1; }
  }
}
