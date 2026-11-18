import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { harness } from './helpers/source.mjs';

function files(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]); }

test('application source cannot construct Supabase clients or import its network transports', () => {
  for (const file of files('src').filter(file => /\.tsx?$/.test(file))) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isImportDeclaration(node) && node.moduleSpecifier.text.startsWith('@supabase/')) {
        assert.equal(node.moduleSpecifier.text, '@supabase/supabase-js', file);
        const clause = node.importClause;
        if (!clause?.isTypeOnly) {
          assert.ok(!clause?.name && clause?.namedBindings && ts.isNamedImports(clause.namedBindings), file);
          for (const element of clause.namedBindings.elements) assert.ok(element.isTypeOnly || (element.propertyName ?? element.name).text === 'FunctionsHttpError', file);
        }
      }
      if (ts.isCallExpression(node)) assert.ok(!/^(createClient|createServerClient|createBrowserClient)$/.test(node.expression.getText(source)), file);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
});

test('Laravel HTTP transport rejects Supabase hosts and provider selection before fetch', async () => {
  let calls = 0;
  for (const [provider, url] of [
    ['supabase', 'http://127.0.0.1:8000/api/v1'],
    ['laravel', 'https://project.supabase.co/api/v1'],
    ['laravel', 'https://SUPABASE.COM/api/v1'],
    ['laravel', 'https://project.supabase.in/api/v1'],
  ]) {
    const h = harness({ globals: { process: { env: { DATA_PROVIDER: provider, LARAVEL_API_URL: url } }, fetch: async () => { calls++; throw Error('Network attempted'); } } });
    delete h.mocks['@/shared/api/laravel/server'];
    await assert.rejects(h.load('src/shared/api/laravel/server.ts').backendRequest('auth/login'), /disabled/);
  }
  assert.equal(calls, 0);
});

test('Laravel HTTP requests use only the configured API and cannot follow redirects to another backend', async () => {
  const calls = [];
  const h = harness({ globals: {
    process: { env: { DATA_PROVIDER: 'laravel', LARAVEL_API_URL: 'http://127.0.0.1:8000/api/v1', SUPABASE_SECRET_KEY: 'unused-legacy-placeholder' } },
    fetch: async (...args) => { calls.push(args); return Response.json({ user: null }); },
  }, mocks: { 'next/headers': { cookies: async () => ({ get: () => ({ value: 'laravel-token-fixture' }) }) } } });
  delete h.mocks['@/shared/api/laravel/server'];
  await h.load('src/shared/api/laravel/server.ts').backendRequest('auth/me');
  assert.equal(calls[0][0], 'http://127.0.0.1:8000/api/v1/auth/me');
  assert.equal(calls[0][1].redirect, 'error');
  assert.equal(calls[0][1].headers.get('authorization'), 'Bearer laravel-token-fixture');
  assert.equal(calls[0][1].headers.has('apikey'), false);
});

test('all domain HTTP route wrappers delegate to the existing Laravel-backed feature handlers', () => {
  const expected = {
    'activation/verify': '@/features/activate-license/server',
    'activation/issue': '@/features/activate-license/server',
    'renewal/issue': '@/features/renew-subscription/server',
  };
  const actual = files('src/app/api').filter(file => file.endsWith('/route.ts')).map(file => file.replace('src/app/api/', '').replace('/route.ts', '')).sort();
  assert.deepEqual(actual, [...Object.keys(expected), 'locale'].sort());
  for (const [route, owner] of Object.entries(expected)) assert.ok(fs.readFileSync(`src/app/api/${route}/route.ts`, 'utf8').includes(owner));
});

test('locale API recognizes the public origin behind Next internal routing and rejects foreign origins', async () => {
  const writes = [];
  const h = harness({ mocks: { 'next/headers': { cookies: async () => ({ set: (...args) => writes.push(args) }) } } });
  const post = h.load('src/app/api/locale/route.ts').POST;
  const request = (origin, locale = 'ar') => new Request('http://localhost:4320/api/locale', { method: 'POST', headers: { 'content-type': 'application/json', host: '127.0.0.1:4320', ...(origin ? { origin } : {}) }, body: JSON.stringify({ locale }) });
  assert.equal((await post(request('http://127.0.0.1:4320'))).status, 200);
  assert.equal(writes[0][0], 'elmo_admin_locale'); assert.equal(writes[0][1], 'ar'); assert.equal(writes[0][2].httpOnly, true);
  assert.equal((await post(request('https://untrusted.invalid'))).status, 403);
  assert.equal((await post(request('http://127.0.0.1:4320', 'invalid'))).status, 400);
  assert.equal(writes.length, 1);
  assert.equal((await post(request(null, 'en'))).status, 200);
});

test('subscription result remains mounted after revalidation disables further provisioning', () => {
  const h = harness();
  const { AddSubscriptionDialog, AddSubscriptionForm } = h.load('src/features/provision-subscription/ui/provision-subscription.tsx');
  const props = { locale: 'en', customerId: 'fixture', plans: [], canProvision: false };
  const dialog = h.render(AddSubscriptionDialog, props);
  assert.ok(dialog); assert.equal(dialog.props.hideTrigger, true);
  h.actionState({ status: 'success', licenseCode: 'ELMO-DISPOSABLE-UI-FIXTURE' });
  const result = h.render(AddSubscriptionForm, props);
  assert.equal(result.props.licenseCode, 'ELMO-DISPOSABLE-UI-FIXTURE');
  const { ActionDialog } = h.load('src/shared/ui/action-dialog.tsx');
  const hidden = h.render(ActionDialog, { triggerLabel: 'Add subscription', title: 'Subscription', hideTrigger: true, children: 'result' });
  const visible = h.render(ActionDialog, { triggerLabel: 'Add subscription', title: 'Subscription', children: 'result' });
  assert.equal(hidden.props.children[0], null);
  assert.equal(hidden.props.children[1].type, 'dialog');
  assert.equal(visible.props.children[0].type, 'button');
  assert.equal(visible.props.children[1].type, 'dialog');
});
