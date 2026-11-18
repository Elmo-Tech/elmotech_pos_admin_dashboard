// Opt-in verification preload. Records destinations/statuses, never headers or bodies.
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { syncBuiltinESMExports } from 'node:module';

const output = process.env.CONNECTION_AUDIT_TRACE;
const isSupabase = hostname => /(^|\.)supabase\.(co|com|in)$/i.test(hostname);
function record(url, transport, status, error) {
  if (!output) return;
  fs.appendFileSync(output, JSON.stringify({ transport, hostname: url.hostname, port: url.port, path: url.pathname, status, ...(error ? { error } : {}) }) + '\n');
}
function guard(url, transport) {
  if (isSupabase(url.hostname)) {
    record(url, transport, null, 'SUPABASE_BLOCKED');
    throw new Error('Connection audit blocked a Supabase request.');
  }
}
if (output) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, options) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    guard(url, 'fetch');
    try {
      const response = await originalFetch(input, options);
      record(url, 'fetch', response.status);
      return response;
    } catch (error) {
      record(url, 'fetch', null, error.code ?? error.name);
      throw error;
    }
  };
  for (const [module, protocol] of [[http, 'http:'], [https, 'https:']]) {
    const originalRequest = module.request;
    module.request = function (...args) {
      const first = args[0];
      const url = typeof first === 'string' || first instanceof URL
        ? new URL(first)
        : new URL(`${first?.protocol ?? protocol}//${first?.hostname ?? first?.host ?? 'localhost'}${first?.port ? ':' + first.port : ''}${first?.path ?? '/'}`);
      guard(url, protocol);
      const request = originalRequest.apply(this, args);
      request.once('response', response => record(url, protocol, response.statusCode));
      request.once('error', error => record(url, protocol, null, error.code ?? error.name));
      return request;
    };
    module.get = function (...args) { const request = module.request(...args); request.end(); return request; };
  }
  syncBuiltinESMExports();
}
