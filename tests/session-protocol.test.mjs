import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { harness, ids, form } from './helpers/source.mjs';

const commercial = 'src/features/commercial/server/actions.ts';
const authActions = 'src/server/auth/actions.ts';
const edge = 'src/features/activation/server/edge-functions.ts';

test('session: password login preserves validation, Laravel calls and redirect targets', async () => {
  const credentials = [];
  const h = harness({ auth: { signInWithPassword: async value => { credentials.push(value); return { error: null }; } } });
  const signIn = h.exported(authActions, 'signInAction');
  assert.deepEqual(await signIn({}, form({ email: '', password: '' })), { error: 'missing_credentials' });
  await assert.rejects(signIn({}, form({ email: ' staff@example.invalid ', password: ' fixture ', next: '/plans?enabled=true' })), /REDIRECT:\/plans\?enabled=true/);
  assert.deepEqual(credentials, [{ email: 'staff@example.invalid', password: ' fixture ' }]);
  await assert.rejects(signIn({}, form({ email: 'x', password: 'x', next: '//outside.invalid' })), /REDIRECT:\/dashboard/);
  const invalid = harness({ auth: { signInWithPassword: async () => ({ error: {} }) } });
  assert.deepEqual(await invalid.exported(authActions, 'signInAction')({}, form({ email: 'x', password: 'x' })), { error: 'invalid_credentials' });
});
test('session: sign-out calls provider before redirect', async () => {
  let signedOut = false;
  const h = harness({ auth: { signOut: async () => { signedOut = true; return { error: null }; } } });
  await assert.rejects(h.exported(authActions, 'signOutAction')(), /REDIRECT:\/login/);
  assert.equal(signedOut, true);
});
test('session: Laravel verified identity and active role remain authoritative and fail closed', async () => {
  for (const [user, expected] of [
    [{ id: 'verified-actor', email: 'fixture@example.invalid', role: 'owner', is_active: true }, true],
    [{ id: 'verified-actor', email: 'fixture@example.invalid', role: 'viewer', is_active: true }, true],
    [{ id: 'verified-actor', email: 'fixture@example.invalid', role: 'admin', is_active: false }, false],
    [{ id: 'verified-actor', email: 'fixture@example.invalid', role: 'unknown', is_active: true }, false],
    [null, false],
  ]) {
    let checks = 0;
    const h = harness({ mocks: { '@/shared/api/laravel/server': { backendIdentity: async () => { checks++; return user; } } } });
    const access = await h.load('src/entities/session/api/require-admin-access.ts').requireAdminAccess();
    assert.equal(access.authorized, expected);
    assert.equal(checks, 1);
    if (expected) assert.equal(access.context.userId, user.id);
  }
  const offline = harness({ mocks: { '@/shared/api/laravel/server': { backendIdentity: async () => { throw Error('offline'); } } } });
  assert.deepEqual(await offline.load('src/entities/session/api/require-admin-access.ts').requireAdminAccess(), { authorized: false, reason: 'authorization_unavailable' });
});
for (const role of ['owner','admin','support','viewer']) {
  test(`commercial: ${role} create/provision/rotation gates and existing RPCs`, async () => {
    const calls = [];
    const h = harness({ role, client: { rpc: async (name, args) => {
      calls.push({ name, args });
      return { error: null, data: name === 'create_customer' ? { outcome: 'created', customerId: ids.customer }
        : name === 'provision_initial_subscription' ? { outcome: 'provisioned', subscriptionId: ids.subscription }
          : { outcome: 'rotated' } };
    } } });
    const inputs = [
      ['createCustomerAction', { businessName: ' Fixture ', ownerName: ' Owner ', phone: ' 123 ', status: 'active' }],
      ['provisionSubscriptionAction', { customerId: ids.customer, planId: ids.plan, startDate: '2026-11-18' }],
      ['rotateLicenseCodeAction', { licenseId: ids.license }],
    ];
    const allowed = ['owner','admin'].includes(role);
    for (const [name, values] of inputs) {
      const result = await h.exported(commercial, name)({ status: 'idle' }, form(values));
      assert.equal(result.status, allowed ? 'success' : 'error');
      if (!allowed) assert.equal(result.code, 'forbidden');
      if (allowed && result.licenseCode) {
        assert.match(result.licenseCode, /^ELMO-(?:[0-9A-HJKMNP-TV-Z]{4}-){7}[0-9A-HJKMNP-TV-Z]{4}$/);
        const args = calls.at(-1).args;
        assert.equal(args.p_license_key_hash || args.p_new_license_key_hash, createHash('sha256').update(result.licenseCode).digest('hex'));
        assert.ok(!JSON.stringify(args).includes(result.licenseCode));
      }
    }
    assert.equal(calls.length, allowed ? 3 : 0);
    if (allowed) {
      assert.deepEqual(calls.map(call => call.name), ['create_customer','provision_initial_subscription','rotate_unused_license_key_hash']);
      assert.ok(calls.every(call => call.args.p_actor_user_id === 'verified-actor'));
      assert.equal(calls[1].args.p_starts_at, '2026-11-18T00:00:00.000Z');
      assert.deepEqual(h.revalidated, ['/customers','/dashboard',`/customers/${ids.customer}`,'/customers','/subscriptions','/dashboard',`/licenses/${ids.license}`,'/licenses']);
    }
  });
}
test('commercial: collisions retry three times and invalid inputs do not call RPC', async () => {
  let count = 0;
  const h = harness({ client: { rpc: async () => { count++; return { data: { outcome: 'licenseCodeConflict' }, error: null }; } } });
  const provision = h.exported(commercial, 'provisionSubscriptionAction');
  assert.deepEqual(await provision({}, form({ customerId: ids.customer, planId: ids.plan, startDate: '2026-02-30' })), { status: 'error', code: 'invalidInput' });
  assert.equal(count, 0);
  assert.deepEqual(await provision({}, form({ customerId: ids.customer, planId: ids.plan, startDate: '2026-11-18' })), { status: 'error', code: 'unavailable' });
  assert.equal(count, 3); assert.deepEqual(h.revalidated, []);
});
test('Edge adapters: verification preserves exact bytes and initial issuance preserves binary/document headers', async () => {
  const bytes = new Uint8Array([32,123,10,34,255,0,13]);
  const document = new Uint8Array([0,255,1,13,10,128]);
  const invocations = [];
  const h = harness({ role: 'support', client: { functions: { invoke: async (name, options) => {
    invocations.push([name, options]);
    return name === 'verify-activation-request'
      ? { data: { outcome: 'alreadyRecorded', requestId: ids.request }, error: null }
      : { data: new Blob([document]), error: null, response: new Response(null, { headers: { 'content-disposition': 'attachment; filename="signed.elmolic"' } }) };
  } } } });
  const verified = await h.exported(edge, 'verifyActivationRequest')(bytes.subarray(1,6));
  assert.equal(verified.outcome, 'alreadyRecorded');
  assert.deepEqual(new Uint8Array(invocations[0][1].body), bytes.subarray(1,6));
  assert.equal(invocations[0][1].headers['content-type'], 'application/octet-stream');
  const issued = await h.exported(edge, 'issueInitialLicense')(ids.request);
  assert.equal(issued.ok, true); assert.deepEqual(new Uint8Array(issued.bytes), document);
  assert.equal(issued.filename, 'signed.elmolic');
  assert.deepEqual(invocations[1], ['issue-initial-license', { body: { requestId: ids.request } }]);
});
test('Edge adapters: viewer operations and mismatched renewal actors are rejected before invocation', async () => {
  let calls = 0;
  for (const role of ['viewer','support']) {
    const h = harness({ role, client: { functions: { invoke: async () => { calls++; } } } });
    if (role === 'viewer') await assert.rejects(h.exported(edge, 'verifyActivationRequest')(new Uint8Array([1])), /authorization/);
    await assert.rejects(h.exported(edge, 'renewSameDeviceLicense')({ actorUserId: 'verified-actor' }), /authorization/);
  }
  const owner = harness();
  await assert.rejects(owner.exported(edge, 'renewSameDeviceLicense')({ actorUserId: 'other-actor' }), /authorization/);
  assert.equal(calls, 0);
});
