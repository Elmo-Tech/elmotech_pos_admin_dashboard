import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness, ids, fixedNow } from './helpers/source.mjs';

const customer = { id: ids.customer, business_name: 'Fixture', customer_code: 'C1', owner_name: 'Owner', email: null, phone: '123', status: 'active', created_at: fixedNow };
const license = { id: ids.license, customer_id: ids.customer, subscription_id: ids.subscription, status: 'active', highest_issued_revision: 1 };
const fixtures = {
  customers: [customer], licenses: [license],
  plans: [{ id: ids.plan, name: 'Quarterly', code: 'Q', is_enabled: true, duration_unit: 'months', duration_value: 3, is_lifetime: false }],
  subscriptions: [{ id: ids.subscription, customer_id: ids.customer, plan_id: ids.plan, status: 'active', starts_at: '2026-10-01T00:00:00Z', expires_at: '2027-01-01T00:00:00Z', is_lifetime: false }],
  device_activations: [{ id: ids.device, license_id: ids.license, status: 'active', activated_at: fixedNow }],
  activation_requests: [{ request_id: ids.request, license_id: ids.license, device_activation_id: ids.device, status: 'validated', received_at: fixedNow }],
  license_issuances: [{ id: 'issuance', license_id: ids.license, reason: 'activation', revision: 1 }],
  audit_logs: [{ id: 'audit', license_id: ids.license, customer_id: ids.customer, action: 'license.issued', metadata: {}, created_at: fixedNow }],
};
function database({ error = false, empty = false } = {}) {
  const traces = [];
  return { traces, from(table) {
    let rows = empty ? [] : structuredClone(fixtures[table] || []), head = false, single = false;
    const trace = [table]; traces.push(trace);
    const query = {};
    for (const op of ['select','eq','in','order','range','limit','gte','lte','gt','or','ilike']) query[op] = (...args) => {
      trace.push([op, ...args]);
      if (op === 'select') head = args[1]?.head;
      if (op === 'eq') rows = rows.filter(row => row[args[0]] === args[1]);
      if (op === 'in') rows = rows.filter(row => args[1].includes(row[args[0]]));
      return query;
    };
    query.maybeSingle = () => { single = true; return query; };
    query.then = (resolve, reject) => Promise.resolve({ data: head ? null : single ? rows[0] || null : rows, count: rows.length, error: error ? { message: 'fixture unavailable' } : null }).then(resolve, reject);
    return query;
  } };
}
const cases = [
  ['src/features/overview/server/get-overview-data.ts','getOverviewData', undefined],
  ['src/features/subscriptions/server/queries.ts','getSubscriptions',{ page: 2, status: 'active', planId: ids.plan }],
  ['src/features/operations/server/queries.ts','getDevices',{ page: 2, status: 'active' }],
  ['src/features/operations/server/queries.ts','getActivationRequests',{ page: 2, status: 'validated' }],
  ['src/features/history/server/queries.ts','getIssuances',{ page: 2, reason: 'activation' }],
  ['src/features/history/server/queries.ts','getAuditLogs',{ page: 2, action: 'license issued' }],
  ['src/features/customers/server/queries.ts','getCustomers',{ page: 2, search: 'Fixture,(bad)', status: 'active' }],
  ['src/features/customers/server/queries.ts','getCustomerDetail',ids.customer],
  ['src/features/licenses/server/queries.ts','getLicenses',{ page: 2, search: 'Fixture', status: 'active' }],
  ['src/features/licenses/server/queries.ts','getLicenseDetail',ids.license],
  ['src/features/operations/server/queries.ts','getActivationRequestContext',ids.request],
];
for (const [source, symbol, input] of cases) test(`read model: ${symbol} joins, scope, filters and failure contract`, async () => {
  const db = database(); const h = harness({ client: db });
  const result = await h.exported(source, symbol)(input);
  assert.ok(result); assert.ok(db.traces.length > 0);
  if (input?.page) assert.ok(db.traces.some(trace => trace.some(op => Array.isArray(op) && op[0] === 'range' && op[1] === 20 && op[2] === 39)));
  if (symbol === 'getDevices') { assert.equal(result.rows[0].customer.id, ids.customer); assert.equal(result.rows[0].license.id, ids.license); }
  if (symbol === 'getCustomerDetail') { assert.equal(result.customer.id, ids.customer); assert.equal(result.referenceNow, fixedNow); assert.equal(result.subscriptions[0].plan.id, ids.plan); }
  if (symbol === 'getActivationRequestContext') assert.equal(result.device.id, ids.device);
  if (symbol === 'getOverviewData') { assert.equal(result.metrics.customers, 1); assert.equal(result.customerGrowth.length, 6); assert.equal(result.recentActivationRequests[0].customer.id, ids.customer); }
  if (symbol === 'getAuditLogs') assert.ok(db.traces.some(trace => trace.some(op => Array.isArray(op) && op[0] === 'ilike' && op[2] === '%license_issued%')));
  if (symbol === 'getCustomers') assert.ok(db.traces.some(trace => trace.some(op => Array.isArray(op) && op[0] === 'or' && !op[1].includes('(bad)'))));
  const failed = harness({ client: database({ error: true }) });
  await assert.rejects(failed.exported(source, symbol)(input), /could not be loaded/);
  const denied = harness({ access: { authorized: false, reason: 'not_authorized' } });
  await assert.rejects(denied.exported(source, symbol)(input), /authorization/);
});
test('detail loaders retain invalid UUID/missing-record null behavior', async () => {
  for (const [source,symbol,id] of cases.filter(item => ['getCustomerDetail','getLicenseDetail','getActivationRequestContext'].includes(item[1]))) {
    const h = harness({ client: database({ empty: true }) });
    assert.equal(await h.exported(source,symbol)('invalid'), null);
    assert.equal(await h.exported(source,symbol)(id), null);
  }
});
