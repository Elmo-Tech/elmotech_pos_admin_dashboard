import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
const repo = fileURLToPath(new URL('../..', import.meta.url));
const dependencies = createRequire(import.meta.url);
export const root = process.env.FSD_TEST_ROOT || repo;
export const ids = { customer: '11111111-1111-4111-8111-111111111111', plan: '22222222-2222-4222-8222-222222222222', license: '33333333-3333-4333-8333-333333333333', request: '44444444-4444-4444-8444-444444444444', subscription: '55555555-5555-4555-8555-555555555555', operation: '66666666-6666-4666-8666-666666666666', device: '77777777-7777-4777-8777-777777777777' };
export const fixedNow = '2026-11-18T10:00:00.000Z';
export class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : [fixedNow])); } static now() { return new Date(fixedNow).getTime(); } }
export function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(item => nodes(item, predicate));
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}
export function harness(options = {}) {
  const sourceRoot = options.root || root;
  const cache = new Map(), calls = [], revalidated = [], effects = [], slots = [], refs = [];
  let cursor = 0, refCursor = 0, currentState = { status: 'idle' }, pending = false;
  const role = options.role || 'owner';
  const access = options.access || { authorized: true, context: { userId: 'verified-actor', email: 'fixture@example.invalid', role } };
  const client = options.client || { from() { throw new Error('Unexpected database access'); } };
  const identity = {
    requireAdminAccess: async () => access,
    getCurrentUser: async () => access.authorized ? { sub: 'verified-actor', email: 'fixture@example.invalid' } : null,
    getAuthorizedLicensingClient: async () => {
      if (!access.authorized) throw new Error('Admin authorization is required for licensing data.');
      return client;
    },
  };
  const auth = options.auth || { signInWithPassword: async () => ({ error: null }), signOut: async () => ({ error: null }), getClaims: async () => ({ data: { claims: { sub: 'verified-actor' } }, error: null }) };
  const react = { ...React, cache: fn => fn,
    useState(initial) { const n = cursor++; if (!(n in slots)) slots[n] = initial; return [slots[n], value => { slots[n] = typeof value === 'function' ? value(slots[n]) : value; }]; },
    useActionState: () => [currentState, () => {}],
    useMemo: fn => fn(), useRef(initial) { const n = refCursor++; return refs[n] ??= { current: initial }; },
    useId: () => 'fixture-id', useEffect: fn => effects.push(fn),
  };
  const mocks = {
    'server-only': {}, react, 'react-dom': { useFormStatus: () => ({ pending }) },
    'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
    'next/navigation': { redirect: url => { throw new Error(`REDIRECT:${url}`); }, notFound: () => { throw new Error('NOT_FOUND'); }, usePathname: () => '/plans', useRouter: () => ({ refresh: () => calls.push(['refresh']) }) },
    'next/cache': { revalidatePath: path => revalidated.push(path) },
    '@/shared/api/laravel/server': {
      usesLaravel: () => true,
      backendIdentity: async () => access.authorized ? { id: access.context.userId, email: access.context.email, role: access.context.role, is_active: true } : null,
      backendSignIn: async (email, password) => { const result = await auth.signInWithPassword({ email, password }); return !result.error; },
      backendSignOut: async () => auth.signOut(),
    },
    '@/server/auth/require-admin-access': identity,
    '@/server/auth/current-user': identity,
    '@/server/data/authorized-licensing-client': identity,
    '@/entities/session/server': identity,
    '@/server/env': { getServerEnvironment: () => 'staging' },
    '@/shared/config/server': { getServerEnvironment: () => 'staging' },
    '@/server/i18n/get-locale': { getLocale: async () => options.locale || 'en' },
    '@/shared/i18n/server': { getLocale: async () => options.locale || 'en' },
    '@/server/supabase/server': { getSupabaseServerClient: async () => ({ auth }) },
    '@/shared/api/supabase/server': { getSupabaseServerClient: async () => ({ auth }) },
    '@/server/supabase/privileged-client': { getPrivilegedLicensingClient: () => client },
    '@/shared/api/supabase/privileged-client': { getPrivilegedLicensingClient: () => client },
    ...options.mocks,
  };
  function load(file) {
    let filename = path.isAbsolute(file) ? file : path.join(sourceRoot, file);
    filename = [filename, `${filename}.ts`, `${filename}.tsx`, `${filename}/index.ts`].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!filename) throw new Error(`Cannot load ${file}`);
    if (cache.has(filename)) return cache.get(filename).exports;
    const evaluated = { exports: {} }; cache.set(filename, evaluated);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: filename }).outputText;
    const resolve = spec => {
      if (Object.hasOwn(mocks, spec)) return mocks[spec];
      if (spec.startsWith('@/')) return load(`src/${spec.slice(2)}`);
      if (spec.startsWith('.')) {
        const target = path.resolve(path.dirname(filename), spec);
        const alias = '@/'+path.relative(path.join(sourceRoot, 'src'), target).replace(/\.tsx?$/, '');
        if (Object.hasOwn(mocks, alias)) return mocks[alias];
        return load(target);
      }
      return dependencies(spec);
    };
    // All application fixtures use Laravel; transport contracts are mocked at the HTTP boundary.
    const bindings = { Date: FixedDate, process: { ...process, env: { ...process.env, DATA_PROVIDER: "laravel" } }, ...(options.globals || {}) };
    vm.runInThisContext(`(function(require,module,exports,${Object.keys(bindings).join(',')}){${source}\n})`, { filename })(resolve, evaluated, evaluated.exports, ...Object.values(bindings));
    return evaluated.exports;
  }
  function exported(oldPath, symbol) {
    if (fs.existsSync(path.join(sourceRoot, oldPath))) {
      const value = load(oldPath)[symbol];
      if (value !== undefined) return value;
    }
    const map = JSON.parse(fs.readFileSync(path.join(repo, 'docs/fsd-migration/path-map.json'), 'utf8'));
    const target = map[`${oldPath}#${symbol}`] || map[oldPath];
    if (!target) throw new Error(`No migration mapping for ${oldPath}#${symbol}`);
    return load(target)[symbol];
  }
  return { load, exported, mocks, client, calls, revalidated, effects,
    render(component, props) { cursor = 0; refCursor = 0; return component(props); },
    actionState(state, isPending = false) { currentState = state; pending = isPending; },
  };
}
export function form(values) { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; }
