import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness, form } from './helpers/source.mjs';

test('backend defaults to Laravel and rejects Supabase even when explicitly selected', () => {
  const resolve = harness().load('src/shared/config/backend.ts').resolveDataProvider;
  for (const value of [undefined, '', 'laravel']) assert.equal(resolve(value), 'laravel');
  assert.throws(() => resolve('supabase'), /disabled/);
  for (const value of ['typo', 'Laravel', ' supabase ']) assert.throws(() => resolve(value), /Invalid DATA_PROVIDER/);
});

test('default Laravel session lookup never reads legacy Supabase auth', async () => {
  let calls = 0;
  const h = harness({ globals: { process: { env: {} } }, auth: { getClaims: async () => { calls++; throw Error('Legacy auth called'); } }, mocks: {
    'next/headers': { cookies: async () => ({ has: () => false }) },
  } });
  delete h.mocks['@/shared/api/laravel/server'];
  assert.equal(await h.load('src/entities/session/api/current-user.ts').getCurrentUser(), null);
  assert.deepEqual(await h.load('src/entities/session/api/require-admin-access.ts').requireAdminAccess(), { authorized: false, reason: 'unauthenticated' });
  assert.equal(calls, 0);
});

test('default proxy forwards pathname without refreshing deprecated Supabase cookies', async () => {
  const h = harness({ globals: { process: { env: {} } }, mocks: {
    'next/server': { NextResponse: { next: ({ request }) => ({ headers: request.headers }) } },
    '@supabase/ssr': { createServerClient: () => { throw Error('Legacy refresh called'); } },
  } });
  const response = await h.load('src/proxy.ts').proxy({ headers: new Headers(), nextUrl: { pathname: '/plans' } });
  assert.equal(response.headers.get('x-pathname'), '/plans');
});

test('provider-aware environment validation keeps disabled-provider and production guards', () => {
  function env(values) { return harness({ globals: { process: { env: values } } }).load('src/shared/config/server.ts'); }
  assert.equal(env({ APP_ENV: 'staging', NEXT_PUBLIC_SUPABASE_URL: 'https://unused.invalid' }).getServerEnvironment(), 'staging');
  assert.throws(() => env({ DATA_PROVIDER: 'supabase', APP_ENV: 'staging', NEXT_PUBLIC_SUPABASE_URL: 'https://unused.invalid' }).getServerEnvironment(), /disabled/);
  assert.throws(() => env({ APP_ENV: 'production', NODE_ENV: 'development' }).getServerEnvironment(), /not allowed/);
  assert.throws(() => env({ DATA_PROVIDER: 'typo' }).getServerEnvironment(), /Invalid DATA_PROVIDER/);
});

test('missing Laravel configuration fails without falling back to Supabase password login', async () => {
  let legacyCalls = 0;
  const h = harness({ globals: { process: { env: {} } }, auth: { signInWithPassword: async () => { legacyCalls++; return { error: null }; } } });
  delete h.mocks['@/shared/api/laravel/server'];
  const result = await h.load('src/features/sign-in/api/actions.ts').signInAction({}, form({ email: 'owner@example.test', password: 'fixture' }));
  assert.deepEqual(result, { error: 'not_configured' });
  assert.equal(legacyCalls, 0);
});
