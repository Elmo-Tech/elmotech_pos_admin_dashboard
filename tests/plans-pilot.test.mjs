// Controlled source-level characterization, not Supabase/Next browser acceptance.
// PILOT_ROOT can point at a byte snapshot to run the same checks before a move.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const root = path.resolve(process.env.PILOT_ROOT || fileURLToPath(new URL('..', import.meta.url)));
const modern = fs.existsSync(path.join(root, 'src/fsd/pages/plans/ui/plans-page.tsx'));
const locations = modern ? {
  page: 'src/fsd/pages/plans/ui/plans-page.tsx',
  query: 'src/fsd/pages/plans/api/get-plans.ts',
  action: 'src/features/manage-plan/api/save-plan.ts',
  form: 'src/features/manage-plan/ui/plan-form.tsx',
} : {
  page: 'src/app/(dashboard)/plans/page.tsx',
  query: 'src/features/plans/server/queries.ts',
  action: 'src/features/commercial/server/actions.ts',
  form: 'src/components/commercial/commercial-forms.tsx',
};
const plans = Array.from({ length: 25 }, (_, n) => ({
  id: `p${n + 1}`, name: `Plan ${String(n + 1).padStart(2, '0')}`, code: `CODE${n + 1}`,
  is_enabled: (n + 1) % 2 === 0, is_lifetime: (n + 1) % 3 === 0, is_trial: false,
  duration_value: (n + 1) % 3 === 0 ? null : 3,
  duration_unit: (n + 1) % 3 === 0 ? null : 'months',
  price: n === 0 ? null : 125, currency: n === 0 ? null : 'EGP', notes: null,
  created_at: '2026-01-01T00:00:00Z',
}));
const subscriptions = [{ plan_id: 'p1' }, { plan_id: 'p1' }, { plan_id: 'p2' }, { plan_id: 'p25' }];

function harness({ role = 'owner', authorized = true, fail = false, outcome = 'created', rpcError = false } = {}) {
  const calls = [], revalidated = [], cache = new Map();
  let hooks, cursor = 0, actionState = { status: 'idle' }, pending = false;
  const client = {
    from(table) {
      let rows = structuredClone(table === 'plans' ? plans : subscriptions), head = false, range;
      const query = {
        select(_fields, options) { head = options?.head; return this; },
        eq(key, value) { rows = rows.filter(row => row[key] === value); return this; },
        in(key, values) { rows = rows.filter(row => values.includes(row[key])); return this; },
        order(key) { rows.sort((a, b) => String(a[key]).localeCompare(String(b[key]))); return this; },
        range(from, to) { range = [from, to]; return this; },
        then(resolve, reject) {
          const count = rows.length;
          return Promise.resolve({ data: head ? null : range ? rows.slice(range[0], range[1] + 1) : rows,
            count, error: fail ? { message: 'fixture failure' } : null }).then(resolve, reject);
        },
      };
      return query;
    },
    async rpc(name, args) {
      calls.push({ name, args });
      return { data: { outcome, planId: 'saved-plan' }, error: rpcError ? { message: 'fixture failure' } : null };
    },
  };
  const localRequire = createRequire(import.meta.url);
  const mocks = {
    'server-only': {},
    react: { ...React,
      useState(initial) {
        if (!hooks) return [initial, () => {}];
        const i = cursor++;
        if (!(i in hooks)) hooks[i] = initial;
        return [hooks[i], value => { hooks[i] = typeof value === 'function' ? value(hooks[i]) : value; }];
      },
      useActionState: () => [actionState, () => {}],
      useTransition: () => [false, fn=>fn()],
      useRef: () => ({ current: null }), useId: () => 'fixture-dialog', useEffect: () => {},
    },
    'react-dom': { useFormStatus: () => ({ pending }) },
    'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
    'next/navigation': { useRouter: () => ({refresh:()=>{}}) },
    'next/cache': { revalidatePath: value => revalidated.push(value) },
    '@/server/data/authorized-licensing-client': {
      getAuthorizedLicensingClient: async () => {
        if (!authorized) throw new Error('denied');
        return client;
      },
    },
    '@/server/auth/require-admin-access': {
      requireAdminAccess: async () => authorized
        ? { authorized: true, context: { userId: 'verified-actor', role } }
        : { authorized: false, reason: 'not_authorized' },
    },
    '@/server/env': { getServerEnvironment: () => 'staging' },
    '@/server/i18n/get-locale': { getLocale: async () => locale },
  };
  mocks['@/entities/session/server'] = {
    ...mocks['@/server/data/authorized-licensing-client'],
    ...mocks['@/server/auth/require-admin-access'],
  };
  mocks['@/shared/config/server'] = mocks['@/server/env'];
  mocks['@/shared/i18n/server'] = mocks['@/server/i18n/get-locale'];
  let locale = 'en';
  function load(file) {
    let filename = path.resolve(root, file);
    filename = [filename, `${filename}.ts`, `${filename}.tsx`, `${filename}/index.ts`].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
    assert.ok(filename, `Module exists: ${file}`);
    if (cache.has(filename)) return cache.get(filename).exports;
    const evaluatedModule = { exports: {} }; cache.set(filename, evaluatedModule);
    const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
    }, fileName: filename }).outputText;
    const requireModule = spec => {
      if (Object.hasOwn(mocks, spec)) return mocks[spec];
      if (spec.startsWith('@/')) return load(`src/${spec.slice(2)}`);
      if (spec.startsWith('.')) return load(path.resolve(path.dirname(filename), spec));
      return localRequire(spec);
    };
    vm.runInThisContext(`(function(require,module,exports){${js}\n})`, { filename })(requireModule, evaluatedModule, evaluatedModule.exports);
    return evaluatedModule.exports;
  }
  return { load, calls, revalidated, setLocale: value => { locale = value; },
    formState(state, isPending = false) { actionState = state; pending = isPending; },
    renderForm(props, reset = false) {
      if (reset || !hooks) hooks = [];
      cursor = 0;
      return load(locations.form).PlanForm(props);
    },
  };
}
function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, predicate));
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate), ...nodes(tree.props?.actions, predicate)];
}
function field(tree, name) { return nodes(tree, node => node.props?.name === name)[0]; }
function input(values = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ name: '  Quarterly  ', durationValue: '3', durationUnit: 'months', price: '125.50', currency: 'egp', isEnabled: 'on', notes: ' note ', ...values })) form.set(key, value);
  return form;
}

test('read: page 2, exact totals, global summaries and batched subscription counts', async () => {
  const h = harness(); const get = h.load(locations.query).getPlans;
  const second = await get({ page: 2, enabled: '', lifetime: '' });
  assert.equal(second.total, 25); assert.deepEqual(second.rows.map(row => row.id), ['p21','p22','p23','p24','p25']);
  assert.deepEqual(second.summary, { all: 25, enabled: 12, lifetime: 8, subscriptions: 4 });
  assert.equal(second.rows.at(-1).subscriptionCount, 1);
  const first = await get({ page: 1, enabled: '', lifetime: '' });
  assert.equal(first.rows[0].subscriptionCount, 2);
});
test('read: boolean filters compose; unknown values are ignored; empty/error states', async () => {
  const h = harness(); const get = h.load(locations.query).getPlans;
  const result = await get({ page: 1, enabled: 'true', lifetime: 'false' });
  assert.deepEqual(result.rows.map(row => row.id), ['p2','p4','p8','p10','p14','p16','p20','p22']);
  assert.equal(result.total, 8); assert.equal(result.summary.all, 25);
  assert.equal((await get({ page: 1, enabled: 'other', lifetime: 'other' })).total, 25);
  assert.equal((await get({ page: 9, enabled: '', lifetime: '' })).rows.length, 0);
  await assert.rejects(harness({ fail: true }).load(locations.query).getPlans({ page: 1, enabled: '', lifetime: '' }), /could not be loaded/);
});
for (const role of ['owner', 'admin', 'support', 'viewer']) {
  test(`page/actions: ${role} permission contract`, async () => {
    const h = harness({ role });
    const page = h.load(locations.page);
    const tree = await (page.PlansPage || page.default)({ searchParams: Promise.resolve({ page: ['2','1'], enabled: 'true', lifetime: 'false' }) });
    const tables = nodes(tree, node => node.type?.name === 'DataTable');
    assert.equal(tables.length, 1);
    assert.equal(tables[0].props.columns.some(column => column.key === 'edit'), ['owner','admin'].includes(role));
    assert.equal(nodes(tree, node => node.type?.name === 'PlanDialog').length, ['owner','admin'].includes(role) ? 1 : 0);
    const result = await h.load(locations.action).savePlanAction({ status: 'idle' }, input());
    assert.equal(result.status, ['owner','admin'].includes(role) ? 'success' : 'error');
    assert.equal(h.calls.length, ['owner','admin'].includes(role) ? 1 : 0);
    if (['support','viewer'].includes(role)) assert.equal(result.code, 'forbidden');
  });
}
test('write: create/edit RPC payload, actor, normalized fields, revalidation', async () => {
  for (const edit of [false, true]) {
    const h = harness({ outcome: edit ? 'updated' : 'created' });
    const result = await h.load(locations.action).savePlanAction({ status: 'idle' }, input(edit ? { planId: 'existing-plan' } : {}));
    assert.deepEqual(result, { status: 'success', code: edit ? 'updated' : 'created', entityId: 'saved-plan' });
    assert.deepEqual(h.calls, [{ name: edit ? 'update_plan' : 'create_plan', args: {
      ...(edit ? { p_plan_id: 'existing-plan' } : {}), p_name: 'Quarterly', p_duration_value: 3,
      p_duration_unit: 'months', p_is_lifetime: false, p_price: 125.5, p_currency: 'EGP',
      p_is_enabled: true, p_notes: 'note', p_actor_user_id: 'verified-actor',
    } }]);
    assert.deepEqual(h.revalidated, ['/plans','/customers']);
  }
});
test('write: lifetime/null semantics and validation including existing malformed-price behavior', async () => {
  const h = harness(); const save = h.load(locations.action).savePlanAction;
  const result = await save({}, input({ isLifetime: 'on', durationValue: '', durationUnit: '', price: '', currency: '', isEnabled: '', notes: '' }));
  assert.equal(result.status, 'success');
  assert.deepEqual(h.calls[0].args, { p_name: 'Quarterly', p_duration_value: null, p_duration_unit: null,
    p_is_lifetime: true, p_price: null, p_currency: null, p_is_enabled: false, p_notes: null, p_actor_user_id: 'verified-actor' });
  for (const invalid of [{ name: '' }, { durationValue: '0' }, { durationValue: '1.5' }, { durationUnit: 'years' }, { isLifetime: 'on' }, { price: '-1' }, { currency: 'xx' }, { notes: 'x'.repeat(2001) }]) {
    assert.deepEqual(await save({}, input(invalid)), { status: 'error', code: 'invalidInput' });
  }
  // Characterize A10 without fixing it during the architecture pilot.
  await save({}, input({ price: 'abc' }));
  assert.equal(h.calls.at(-1).args.p_price, null);
});
test('write: denied identity, RPC failure and backend domain outcomes do not revalidate', async () => {
  for (const [options, code] of [[{ authorized: false }, 'forbidden'], [{ rpcError: true }, 'unavailable'], [{ outcome: 'planDisabled' }, 'planDisabled']]) {
    const h = harness(options);
    assert.deepEqual(await h.load(locations.action).savePlanAction({}, input()), { status: 'error', code });
    assert.deepEqual(h.revalidated, []);
  }
});
test('form: edit defaults, finite/lifetime toggle, fields and pending/feedback', () => {
  const h = harness(); const props = { locale: 'en', plan: plans[1], embedded: true };
  let tree = h.renderForm(props, true);
  assert.equal(field(tree, 'planId').props.value, 'p2');
  assert.equal(field(tree, 'name').props.defaultValue, 'Plan 02');
  assert.equal(field(tree, 'durationValue').props.value, '3');
  assert.equal(field(tree, 'durationValue').props.required, true);
  field(tree, 'isLifetime').props.onChange({ target: { checked: true } });
  tree = h.renderForm(props);
  assert.equal(field(tree, 'durationValue').props.value, '');
  assert.equal(field(tree, 'durationValue').props.disabled, true);
  assert.equal(field(tree, 'durationUnit').props.disabled, true);
  field(tree, 'isLifetime').props.onChange({ target: { checked: false } });
  tree = h.renderForm(props);
  assert.equal(field(tree, 'durationValue').props.disabled, false);
  assert.equal(field(tree, 'durationValue').props.value, '');
  h.formState({ status: 'success', code: 'updated' }, true);
  const markup = renderToStaticMarkup(h.renderForm(props));
  assert.match(markup, /role="status"/); assert.match(markup, /disabled=""/);
});
test('page: filters, pagination query links and Arabic/English source-rendered markup', async () => {
  const captures = {};
  for (const locale of ['ar','en']) {
    const h = harness(); h.setLocale(locale);
    const page = h.load(locations.page);
    const tree = await (page.PlansPage || page.default)({ searchParams: Promise.resolve({ page: '1', enabled: 'false', lifetime: 'false' }) });
    const markup = renderToStaticMarkup(tree);
    assert.match(markup, /action="\/plans" method="get"/);
    assert.match(markup, /name="enabled"/); assert.match(markup, /name="lifetime"/);
    assert.match(markup, /Plan 01/); assert.match(markup, /\/subscriptions\?plan=p1/);
    assert.match(markup, locale === 'ar' ? /كتالوج الخطط/ : /Plans catalog/);
    captures[locale] = markup;
    const unfiltered = await (page.PlansPage || page.default)({ searchParams: Promise.resolve({ page: '1', enabled: '', lifetime: '' }) });
    assert.match(renderToStaticMarkup(unfiltered), /href="\/plans\?page=2"/);
  }
  if (process.env.PILOT_CAPTURE) fs.writeFileSync(process.env.PILOT_CAPTURE, JSON.stringify(captures, null, 2) + '\n');
});

test('pagination preserves both filters; filter submit/reset starts at first page', () => {
  const h = harness();
  const { Pagination } = h.load(fs.existsSync(path.join(root, 'src/shared/ui/pagination.tsx')) ? 'src/shared/ui/pagination.tsx' : 'src/components/ui/pagination.tsx');
  const markup = renderToStaticMarkup(React.createElement(Pagination, {
    basePath: '/plans', page: 2, pageSize: 20, total: 60,
    query: { enabled: 'false', lifetime: 'true' }, locale: 'en',
  }));
  assert.match(markup, /href="\/plans\?enabled=false&amp;lifetime=true"/);
  assert.match(markup, /href="\/plans\?enabled=false&amp;lifetime=true&amp;page=3"/);
  const { ListFilterForm } = h.load(fs.existsSync(path.join(root, 'src/shared/ui/filter-controls.tsx')) ? 'src/shared/ui/filter-controls.tsx' : 'src/components/ui/filter-controls.tsx');
  const filters = renderToStaticMarkup(React.createElement(ListFilterForm, { action: '/plans', locale: 'en' }, 'filters'));
  assert.match(filters, /href="\/plans"/);
  assert.doesNotMatch(filters, /name="page"/);
});
test('form: new finite defaults and lifetime edit defaults are preserved', () => {
  const h = harness();
  const fresh = h.renderForm({ locale: 'en' }, true);
  assert.equal(field(fresh, 'planId'), undefined);
  assert.equal(field(fresh, 'durationUnit').props.defaultValue, 'months');
  assert.equal(field(fresh, 'currency').props.defaultValue, 'EGP');
  assert.equal(field(fresh, 'isEnabled').props.defaultChecked, true);
  const lifetime = h.renderForm({ locale: 'ar', plan: plans[2] }, true);
  assert.equal(field(lifetime, 'isLifetime').props.checked, true);
  assert.equal(field(lifetime, 'durationValue').props.disabled, true);
  assert.equal(field(lifetime, 'durationUnit').props.required, false);
});
test('page: backend failure renders module error and empty filtered page renders empty state', async () => {
  for (const [options, pageNumber, expected] of [[{ fail: true }, '1', /could not be loaded/], [{}, '99', /No plans/]]) {
    const h = harness(options); const page = h.load(locations.page);
    const tree = await (page.PlansPage || page.default)({ searchParams: Promise.resolve({ page: pageNumber }) });
    assert.match(renderToStaticMarkup(tree), expected);
  }
});
