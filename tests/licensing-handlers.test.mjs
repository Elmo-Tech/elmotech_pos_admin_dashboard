import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harness, ids } from './helpers/source.mjs';
const origin = 'https://fixture.invalid';
const bytes = new Uint8Array([0,255,13,10,128,1]);
function routeHarness(options = {}) {
  const calls = [];
  const edge = {
    ELMOREQ_MAX_BYTES: 65536,
    verifyActivationRequest: async input => { calls.push(['verify',input]); return { outcome: options.outcome || 'verifiedAndRecorded', requestId: ids.request }; },
    issueInitialLicense: async requestId => { calls.push(['issue',requestId]); return { ok: true, bytes: bytes.buffer, filename: 'signed.elmolic' }; },
    renewSameDeviceLicense: async input => { calls.push(['renew',input]); return { ok: true, bytes: bytes.buffer, filename: 'renew.elmolic', expiresAt: '2027-02-01T00:00:00Z' }; },
  };
  const context = { getActivationRequestContext: async () => ({ request: { request_id: ids.request }, license: { id: ids.license }, customer: { id: ids.customer }, device: null }) };
  const h = harness({ ...options, mocks: {
    '@/features/activation/server/edge-functions': edge,
    '@/features/activate-license/api/edge-functions': edge,
    '@/features/renew-subscription/api/edge-functions': edge,
    '@/features/operations/server/queries': context,
    '@/features/activate-license/api/get-request-context': context,
  } });
  return { h, calls };
}
function jsonRequest(url, body, headers = {}) { return new Request(origin+url, { method: 'POST', headers: { origin, 'content-type':'application/json', ...headers }, body: JSON.stringify(body) }); }
function uploadRequest(content, name = 'fixture.elmoreq') {
  const data = new FormData();data.set('file',new File([content],name,{type:'application/octet-stream'}));
  return new Request(origin+'/api/activation/verify',{method:'POST',headers:{origin},body:data});
}
test('HTTP activation verification: multipart exact bytes, repeat outcomes and joined context', async () => {
  for (const outcome of ['verifiedAndRecorded','alreadyRecorded','alreadyActivated']) {
    const { h, calls } = routeHarness({ role:'support',outcome });
    const content = ' \n{ "format": "ELMOREQ", "preserve": "spacing" }\r\n';
    const response = await h.load('src/app/api/activation/verify/route.ts').POST(uploadRequest(content));
    assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
    assert.deepEqual(calls[0],['verify',new TextEncoder().encode(content)]);
    const result=await response.json();assert.equal(result.outcome,outcome);assert.equal(result.context.request.request_id,ids.request);
  }
});
test('HTTP entry points: origin, viewer/support role and malformed input gates precede mutations', async () => {
  for (const [url,file,payload] of [
    ['/api/activation/issue','src/app/api/activation/issue/route.ts',{requestId:ids.request}],
    ['/api/renewal/issue','src/app/api/renewal/issue/route.ts',{licenseId:ids.license,planId:ids.plan,operationId:ids.operation}],
  ]) {
    for(const role of ['viewer',...(url.includes('renewal')?['support']:[])]) {
      const {h,calls}=routeHarness({role});assert.equal((await h.load(file).POST(jsonRequest(url,payload))).status,403);assert.equal(calls.length,0);
    }
    const {h,calls}=routeHarness();
    assert.equal((await h.load(file).POST(jsonRequest(url,payload,{origin:'https://outside.invalid'}))).status,403);
    assert.equal((await h.load(file).POST(jsonRequest(url,{bad:true}))).status,400);
    assert.equal(calls.length,0);
  }
  const {h,calls}=routeHarness();
  const handler=h.load('src/app/api/activation/verify/route.ts').POST;
  assert.equal((await handler(uploadRequest('not JSON'))).status,400);
  assert.equal((await handler(uploadRequest('{"format":"ELMOREQ"}','bad.txt'))).status,400);
  assert.equal((await handler(uploadRequest('x'.repeat(65537)))).status,400);
  assert.equal(calls.length,0);
});
test('HTTP issuance and renewal preserve attachment bytes/headers and verified actor, operation ID', async () => {
  for(const renewal of [false,true]) {
    const {h,calls}=routeHarness();const path=renewal?'renewal/issue':'activation/issue';
    const payload=renewal?{licenseId:ids.license,planId:ids.plan,operationId:ids.operation}:{requestId:ids.request};
    const response=await h.load(`src/app/api/${path}/route.ts`).POST(jsonRequest('/api/'+path,payload));
    assert.equal(response.status,200);assert.deepEqual(new Uint8Array(await response.arrayBuffer()),bytes);
    assert.equal(response.headers.get('content-type'),'application/octet-stream');assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.match(response.headers.get('content-disposition'),/\.elmolic/);
    if(renewal){assert.deepEqual(calls[0],['renew',{...payload,actorUserId:'verified-actor'}]);assert.equal(response.headers.get('x-license-expires-at'),'2027-02-01T00:00:00Z');}
  }
});
