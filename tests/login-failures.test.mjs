import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness, form } from './helpers/source.mjs';

function loginHarness(respond) {
  const written = [];
  const h = harness({ globals: {
    process: { env: { DATA_PROVIDER: 'laravel', LARAVEL_API_URL: 'https://fixture.example/api/v1' } },
    fetch: respond,
  }, mocks: { 'next/headers': { cookies: async () => ({ get: () => undefined, set: (...args) => written.push(args) }) } } });
  delete h.mocks['@/shared/api/laravel/server'];
  return { h, written, login: h.load('src/shared/api/laravel/server.ts').backendSignIn };
}

test('only Laravel credential validation is classified as invalid credentials', async () => {
  const { login, written } = loginHarness(async () => Response.json({ errors: { email: ['Invalid credentials.'] } }, { status: 422 }));
  assert.equal(await login('fixture@example.test', 'fixture-password'), false);
  assert.equal(written.length, 0);
});

test('proxy/server failures, rate limits and malformed success cannot become wrong-password messages', async () => {
  for (const status of [401, 403, 404, 419, 429, 500, 502, 503]) {
    const { login, written } = loginHarness(async () => Response.json({ message: 'fixture' }, { status }));
    await assert.rejects(login('fixture@example.test', 'fixture-password'), error => error.name === 'BackendSignInError' && error.reason === (status === 429 ? 'rate_limited' : 'backend_unavailable') && error.status === status);
    assert.equal(written.length, 0);
  }
  for (const respond of [async () => new Response('<html>Proxy page</html>'), async () => new Response('Proxy rejection', { status: 422 }), async () => Response.json({}), async () => { throw Error('fixture network failure'); }]) {
    const { login, written } = loginHarness(respond);
    await assert.rejects(login('fixture@example.test', 'fixture-password'), error => error.reason === 'backend_unavailable');
    assert.equal(written.length, 0);
  }
});

test('valid Laravel login sets only the server-managed session cookie', async () => {
  const { login, written } = loginHarness(async () => Response.json({ token: 'fixture-sanctum-token' }));
  assert.equal(await login('fixture@example.test', 'fixture-password'), true);
  assert.equal(written[0][0], 'elmotech_backend_session');
  assert.equal(written[0][2].httpOnly, true);
});

test('the Server Action exposes safe categories and never logs credentials or response bodies', async () => {
  const logs = [];
  const h = harness({ globals: { console: { error: (...args) => logs.push(args) } } });
  const { BackendSignInError } = h.load('src/shared/api/laravel/auth-error.ts');
  for (const [reason, status] of [['rate_limited', 429], ['backend_unavailable', 500]]) {
    h.mocks['@/shared/api/laravel/server'].backendSignIn = async () => { throw new BackendSignInError(reason, status); };
    assert.deepEqual(await h.load('src/features/sign-in/api/actions.ts').signInAction({}, form({ email: 'private@example.test', password: 'private-fixture' })), { error: reason });
  }
  assert.ok(!JSON.stringify(logs).includes('private'));
  assert.deepEqual(logs[1][1], { reason: 'backend_unavailable', status: 500 });
});

test('Arabic and English login feedback distinguish unavailable service and rate limiting', () => {
  for (const locale of ['ar', 'en']) {
    for (const error of ['backend_unavailable', 'rate_limited']) {
      const h = harness(); h.actionState({ error });
      const component = h.load('src/features/sign-in/ui/login-form.tsx').LoginForm;
      const tree = h.render(component, { locale, next: '/dashboard' });
      const find = node => {
        if (!node || typeof node !== 'object') return [];
        if (Array.isArray(node)) return node.flatMap(find);
        return [...(node.props?.role === 'alert' ? [node.props.children] : []), ...find(node.props?.children)];
      };
      const messages = find(tree);
      assert.equal(messages.length, 1);
      assert.ok(!/Invalid email|غير صحيحة/.test(messages[0]));
      assert.match(messages[0], error === 'rate_limited' ? /Wait a minute|انتظر دقيقة/ : /service is unavailable|تعذر التواصل/);
    }
  }
});
