import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness, form } from './helpers/source.mjs';

function adapter(respond = async () => Response.json({ data: [], count: 0 })) {
  const calls = [];
  const h = harness({ mocks: { '@/shared/api/laravel/server': {
    usesLaravel: () => true,
    backendRequest: async (path, options) => { calls.push({ path, options, body: typeof options.body === 'string' ? JSON.parse(options.body) : options.body }); return respond(path, options); },
  } } });
  return { client: h.load('src/shared/api/laravel/licensing-client.ts').getLaravelLicensingClient(), calls };
}
test('Laravel transport preserves filters, exact count, range, ordering and single-record cardinality', async () => {
  const { client, calls } = adapter(async () => Response.json({ data: [{ id: 'one' }], count: 26 }));
  const result = await client.from('plans').select('id', { count: 'exact' }).eq('is_enabled', true).in('id', ['one']).gte('created_at', '2026-01-01').or('name.ilike.%QA%').order('created_at', { ascending: false }).range(25, 49);
  assert.deepEqual(result, { data: [{ id: 'one' }], count: 26, error: null });
  assert.equal(calls[0].path, 'data/plans/query');
  assert.equal(calls[0].body.offset, 25); assert.equal(calls[0].body.limit, 25);
  assert.deepEqual(calls[0].body.orders, [{ column: 'created_at', ascending: false }]);
  assert.deepEqual(calls[0].body.filters[0], { column: 'is_enabled', operator: 'eq', value: true });
  assert.deepEqual((await client.from('plans').select('id').maybeSingle()).data, { id: 'one' });
  const multi = adapter(async () => Response.json({ data: [{ id: 'one' }, { id: 'two' }], count: 2 }));
  assert.ok((await multi.client.from('plans').select('id').maybeSingle()).error);
});
test('Laravel commercial mapping uses explicit APIs and never sends client actor authority', async () => {
  const { client, calls } = adapter(async () => Response.json({ outcome: 'created' }));
  await client.rpc('update_plan', { p_plan_id: 'plan', p_name: 'QA', p_actor_user_id: 'forged' });
  assert.equal(calls[0].options.method, 'PATCH'); assert.equal(calls[0].path, 'plans/plan');
  assert.deepEqual(calls[0].body, { name: 'QA' });
  await client.rpc('provision_initial_subscription', { p_customer_id: 'customer', p_plan_id: 'plan', p_actor_user_id: 'forged' });
  assert.deepEqual(calls[1].body, { customer_id: 'customer', plan_id: 'plan' });
  await client.rpc('rotate_unused_license_key_hash', { p_license_id: 'license', p_new_license_key_hash: 'hash' });
  assert.deepEqual(calls[2].body, { license_key_hash: 'hash' });
});
test('Laravel licensing transport preserves exact binary request and signed download bytes', async () => {
  const exact = Uint8Array.from([0,255,13,10,65]).buffer;
  const { client, calls } = adapter(async () => new Response(exact, { headers: { 'content-type': 'application/octet-stream', 'content-disposition': 'attachment; filename="fixture.elmolic"' } }));
  const result = await client.functions.invoke('verify-activation-request', { body: exact });
  assert.equal(calls[0].body, exact); assert.equal(calls[0].options.headers['content-type'], 'application/octet-stream');
  assert.deepEqual(new Uint8Array(await result.data.arrayBuffer()), new Uint8Array(exact));
  assert.match(result.response.headers.get('content-disposition'), /fixture.elmolic/);
});
test('Laravel transport surfaces unavailable protocol and read failures without fake success', async () => {
  const { client } = adapter(async () => Response.json({ outcome: 'protocolNotConfigured' }, { status: 503 }));
  const result = await client.functions.invoke('renew-same-device-license', { body: { operationId: 'same-on-retry' } });
  assert.equal(result.data, null); assert.equal((await result.error.context.json()).outcome, 'protocolNotConfigured');
  assert.ok((await client.from('plans').select('id')).error);
});
test('Laravel session action branches retain validation, redirect safety, and sign-out ordering', async () => {
  const calls = [];
  const h = harness({ mocks: { '@/shared/api/laravel/server': { usesLaravel: () => true, backendSignIn: async (...args) => { calls.push(args); return true; }, backendSignOut: async () => calls.push('out') } } });
  const signIn = h.load('src/features/sign-in/api/actions.ts').signInAction;
  assert.deepEqual(await signIn({}, form({})), { error: 'missing_credentials' });
  await assert.rejects(signIn({}, form({ email: ' owner@example.test ', password: 'secret', next: '//bad.test' })), /REDIRECT:\/dashboard/);
  assert.deepEqual(calls[0], ['owner@example.test', 'secret']);
  await assert.rejects(h.load('src/features/sign-out/api/actions.ts').signOutAction(), /REDIRECT:\/login/);
  assert.equal(calls[1], 'out');
});
test('Laravel authorization trusts only the revalidated active server identity and recognized role', async () => {
  for (const [identity, authorized] of [[null,false], [{ id:'uuid',email:'x',role:'viewer',is_active:true },true], [{ id:'uuid',email:'x',role:'owner',is_active:false },false], [{ id:'uuid',email:'x',role:'invented',is_active:true },false]]) {
    const h = harness({ mocks: { '@/shared/api/laravel/server': { usesLaravel: () => true, backendIdentity: async () => identity } } });
    assert.equal((await h.load('src/entities/session/api/require-admin-access.ts').requireAdminAccess()).authorized, authorized);
  }
});
