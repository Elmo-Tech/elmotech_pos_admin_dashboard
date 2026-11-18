# Plans FSD pilot

Implemented on 18 November 2026 against commit `d17674a8e5eccf9a5e9c8731f9284ece34bb2317`. Existing untracked `docs/DASHBOARD_ARCHITECTURE_AUDIT.md` was preserved byte-for-byte. No Laravel, identity, schema, configuration, dependency or lockfile changes.

## Verified audit findings

- **A01:** Plans still depends on `create_plan` / `update_plan`. Their SQL implementations are absent here. This pilot retains both RPCs and existing authorization; no claim of live backend parity.
- **A02:** No prior tests or test script existed. Added a dependency-free Node test harness using the already-installed TypeScript/React packages. It characterizes actual source with controlled auth/Supabase/Next adapters rather than contacting a backend.
- **A03:** Installed FSD CLI **2.8.0** was checked with `fsd --version` / `--help`. In an isolated source-root fixture, native `fsd -g page plans` generated `src/pages/plans/{index.ts,ui/plans-page.tsx}` and `src/app/plans/page.route.tsx`. The generated wrapper neither forwards searchParams nor uses `(dashboard)`; this is unsuitable for this pilot. See `generator-native*.log`.
- **A05:** The per-plan subscription aggregation still counts fetched rows; no pagination or backend aggregates were introduced.
- **A06/A14:** The page-local Supabase read facade and plan interaction now have separate owners. Existing broad backend outcome strings are retained. Legacy infrastructure/public UI are transitional dependencies; this is not whole-repository FSD compliance.
- **A10:** Invalid/nonfinite price can normalize to null in the current action. A characterization test preserves that existing behavior; no validation fix is included.

## Chosen routing convention

Keep ordinary Next App Router filenames and all existing route wrappers. The `/plans` wrapper stays at `src/app/(dashboard)/plans/page.tsx`, consumes the generated `PageProps<"/plans">` promise and forwards `searchParams` unchanged.

The FSD **page slice is `src/fsd/pages/plans`**, not Next's special `src/pages`. `@/*` already resolves the path, so no alias, `pageExtensions`, proxy or route-group change is required. The feature slice uses the established `src/features` layer at `src/features/manage-plan`. This mixed legacy/FSD layout is intentionally incremental; native page generators must not be run blindly into the default root.

A repo-wide route-suffix conversion is outside scope. Native page registration also hardcodes `src/app`; a custom root must not be assumed to relocate that wrapper. Use the structure-only CLI mode and keep explicit framework wrappers during this migration.

Before moving application code, CLI-generated directories plus a JSX probe under `src/fsd/pages/plans/ui` were built in scratch. The complete `app-paths`, `pages` and `routes` manifests matched the clean baseline, demonstrating no accidental route discovery. See `route-discovery-build.log` and `route-discovery-comparison.log`. The probe was never added to the repository.

Applied scaffold commands (installed CLI, no download/install/config initialization):

```sh
fsd -g page plans --segments ui,api --root src/fsd
fsd -g feature manage-plan --segments ui,api,model
```

These commands created directories and empty public APIs only. Application code, type definitions, wrappers and API contents were then moved/adapted manually. No CLI ownership manifest was manufactured.

## Changed source files

| Source | Change |
| --- | --- |
| `src/app/(dashboard)/plans/page.tsx` | Thin wrapper; same URL, route group and searchParams. |
| `src/fsd/pages/plans/index.ts` | Server-only page public API. |
| `src/fsd/pages/plans/ui/plans-page.tsx` | Existing complete page composition/copy/columns/filters/metrics; imports plan interaction through its public API. |
| `src/fsd/pages/plans/api/get-plans.ts` | Page-local read model; byte-identical to the old Plans query module. |
| `src/features/manage-plan/index.ts` | Client public API exports only `PlanDialog`, not privileged data or action implementations. |
| `src/features/manage-plan/ui/plan-form.tsx` | Existing PlanForm/PlanDialog, exact relevant bilingual copy, pending/feedback behavior, finite/lifetime interaction and defaults. |
| `src/features/manage-plan/model/types.ts` | Plan form value and plan action result types; no unrelated license-code state. |
| `src/features/manage-plan/api/save-plan.ts` | Existing plan server command, helper parsing and authorization; private within the slice. `"use server"` keeps the client import a Next Server Action reference. |
| `src/components/commercial/commercial-forms.tsx` | Removed only plan form/dialog/type and action import; all remaining functions unchanged. Existing shared copy/helpers are retained for other forms. |
| `src/features/commercial/server/actions.ts` | Removed only plan action and its exclusively used number parser; remaining functions unchanged. |
| `src/features/plans/server/queries.ts` | Removed after moving the sole caller and loader; empty old directories removed. |
| `tests/plans-pilot.test.mjs` | Repeatable baseline/post-move characterization checks. No package script or dependency added. |

This folder contains the migration map, source hashes, route manifests, sanitized logs and verification evidence. `workspace.json` identifies the temporary source snapshots; it contains no secrets. The original audit remains historical, with old source references; this note records the pilot's new ownership.

## Behavior characterized before moving

All **14** checks passed before extraction and afterward:

1. Page 2, fixed 20-row pagination, exact filtered total, four independent global summary counts, and batched per-plan subscription counts.
2. Enabled/lifetime filters compose; unrecognized filter values retain existing ignore behavior; empty and query-failure paths.
3. Owner read/create/edit control visibility and server mutation permission.
4. Admin read/create/edit control visibility and server mutation permission.
5. Support read access with create/edit controls absent and direct mutation denied.
6. Viewer read access with create/edit controls absent and direct mutation denied.
7. Create vs update RPC names/arguments, verified actor, normalized fields and `/plans` + `/customers` revalidation.
8. Lifetime/null/disabled semantics, input limits, invalid duration/price/currency and existing malformed-price normalization.
9. Missing authorization, transport failure and domain failure outcomes do not revalidate.
10. Edit defaults, lifetime toggle clearing and disabling finite fields, toggling back, pending and feedback rendering.
11. Both locales render expected catalog markup, GET filter controls, plan/subscription links and pagination.
12. Pagination retains both filters; applying/resetting filters omits the old page parameter.
13. New finite defaults and lifetime edit defaults.
14. Page-level backend error UI and empty filtered-page UI.

Fixtures have 25 plans and 4 subscription associations. The tests execute actual loaders/actions/page/form source with in-memory Supabase responses and injected identity; they are **not** authentication, RLS, remote SQL, browser hydration or Server Action transport acceptance. Hook state is controlled by the harness to inspect field transitions; native dialog/focus, mobile layout and DOM lifecycle are not simulated.

Arabic and English controlled server-rendered markup matched **byte-for-byte** before/after (`markup-comparison.json`). This includes page text, classes, table/filter/pagination structures and create/edit form markup, with mocked hooks and Next adapters. It does not establish pixel equivalence or browser RSC hydration.

No checked-in authenticated local fixture environment, seed database, test accounts or backend emulator was found. Real `.env.local` was not read or used. **Arabic/English desktop/mobile authenticated screenshots were therefore not captured.** No production queries or writes were performed.

## Verification results

| Check | Result / evidence |
| --- | --- |
| Baseline lint | Pass, exit 0 (`before-lint.log`). |
| Baseline TypeScript | Pass, exit 0; `tsc --noEmit --incremental false` (`before-typecheck.log`). |
| Baseline characterization | 14/14, exit 0 (`before-regression.log`). |
| Default baseline build | Blocked, exit 1: Google Fonts network request failure (`before-build.log`). |
| Default build retry with network permission | Blocked, exit 1: Turbopack CSS worker attempted local port binding, rejected with `Operation not permitted` (`before-build-retry.log`). This was an execution-environment failure, not an approval-review rejection. |
| Baseline supported webpack build | Pass, exit 0: `npm run build -- --webpack` (`before-build-webpack.log`). No repository config change. |
| Chosen FSD-root scratch build | Pass, exit 0; full manifest comparison identical before any code move (`route-discovery-*.log`). |
| Post-move lint | Pass, exit 0 (`after-lint.log`). Initial harness CJS imports hit existing ESLint rules; converted harness to ESM, preserving rules/config. Initial diagnostics retained in `after-lint-first.log`. |
| Post-move TypeScript | Pass, exit 0 (`after-typecheck.log`); clean-copy Next build also generates/checks route types. |
| Post-move characterization | 14/14, exit 0 (`after-regression.log`). |
| Post-move production build | Pass, exit 0, webpack (`after-build-webpack.log`). Default Turbopack remains unverified after its environment blocker; do not interpret webpack success as a Turbopack pass. |
| Full route manifests | All app-paths/pages/routes entries and proxy matchers unchanged (`routes-before.json`, `routes-after.json`, `route-comparison.log`). `/plans` remains under `/(dashboard)/plans/page`; all listed application routes remain dynamic. Framework favicon/not-found/global-error entries are included in the raw manifest. |
| Source preservation/imports | Plan query byte-identical; action/form/dialog declarations unchanged except local state/type names; every remaining non-plan function in touched legacy modules byte-identical. All literal internal TS imports resolve; no cycles across 93 TS/TSX files (`source-boundaries.log`). |
| Client boundary | Client dependency walk stops at `"use server"`; no `server-only` or `src/server` implementation in remaining client closure. No secret-key/RPC implementation markers in emitted static JS (`source-boundaries.log`, `client-bundle.log`). This is a scoped implementation-boundary check, not a general security audit. |
| React review | Existing hook order/local state preserved; native dialog and pending controls preserved; page remains server-rendered; props serializable; no new provider or browser data-access path. No unrelated accessibility/performance fixes. |
| Scope | Package, lockfile, Next/TS config unchanged; original audit hash unchanged; all other tracked source untouched. |

Builds ran from isolated copies without `.env*` files, with installed dependencies copied locally. Shell application environment variable presence was checked without reading values; all Supabase/APP_ENV variables were absent. No credentials or font mocks were introduced. Raw build logs record actual bundlers/results. `workspace.json` locates the scratch baseline and final copies for independent comparison while those temporary directories exist.

Repeat current checks from repository root:

```sh
node --test tests/plans-pilot.test.mjs
npm run lint
./node_modules/.bin/tsc --noEmit --incremental false
npm run build
# Supported fallback when this environment blocks Turbopack:
npm run build -- --webpack
```

To rerun the same test suite against a source snapshot, set `PILOT_ROOT=/absolute/path/to/snapshot`. It selects original vs migrated source locations by the presence of the moved page implementation. The checked-in harness shares one installed React instance across snapshots to avoid duplicate-React artifacts.

Remaining acceptance: an authorized local/staging fixture should verify real login/session/RBAC, actual create/edit persistence and RPC outcomes, Next Server Action transport, revalidation after writes, finite/lifetime toggles in the browser, dialog focus/pending behavior and Arabic/English desktop/mobile screenshots. Existing row-limit, malformed-price, pagination and unrelated audit findings remain outside this architectural pilot.
