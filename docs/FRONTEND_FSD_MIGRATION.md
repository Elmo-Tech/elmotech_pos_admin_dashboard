# Frontend FSD migration

Completed 18 November 2026. Baseline: commit `d17674a8e5eccf9a5e9c8731f9284ece34bb2317` plus the existing uncommitted Plans pilot. The starting working tree, including the original audit and pilot reports, was independently copied before migration. See [source hashes](fsd-migration/source-before.json), [migration map](fsd-migration/migration-map.json), [file/export map](fsd-migration/path-map.json) and [verification results](fsd-migration/evidence.json).

The full frontend now uses FSD responsibility owners. Supabase remains the live backend. Auth/session handling, role policies, data queries, RPCs, Edge Functions and licensing file protocol were retained. Laravel, MySQL, API contract design, identity/data migration, new state libraries and unrelated behavior fixes are outside this change.

## Architecture and public APIs

```text
src/app                         Next routing, layouts, loading/error states,
                                access-denied composition and locale cookie endpoint
src/proxy.ts                    Next session refresh and pathname forwarding
src/fsd/pages/<screen>          server-only screen compositions and page-local reads
src/widgets/dashboard-shell    shell, header, sidebar and navigation model
src/features/<interaction>     operator UI, local state and server operations
src/entities/session           verified identity, RBAC and authorized read access
src/entities/license           reusable license relationships, code generation/display
src/shared                     UI primitives, i18n, configuration, Supabase transport,
                                database type facade, formatting and HTTP helpers
```

Dependency direction is App → Pages → Widgets → Features → Entities → Shared. There are no same-layer business-slice imports, upward imports or static internal import cycles in the final graph. App and Shared are sliceless; their internal modules are public by responsibility. Page-local aggregation stays with its screen, even when it joins several database tables.

Slice `index.ts` files expose UI or screen APIs. Privileged APIs use a separate `server.ts`; page entries and server-only services retain the `server-only` sentinel. The session client entry exports RBAC models only, while its server entry exports identity and authorization gates. The license client entry exports the one-time code display; its server entry exports relationship/code helpers. UI barrels do not export privileged implementations.

Server Action implementation modules own `"use server"`. Their public entries re-export the action references without repeating that directive: the installed Next compiler rejected directive-only re-export modules. The initial failing build and corrected result are both retained. Client import traversal stops at actual Server Action implementation boundaries, and emitted client artifacts were checked separately.

## Routing convention and complete map

The Plans convention is retained: FSD Pages live in **`src/fsd/pages`**, outside Next's special `src/pages` directory. Explicit `src/app` wrappers forward the same promised `params` and `searchParams`. No `pageExtensions`, alias, Next configuration, route group, proxy matcher or URL changes were needed. All 18 application URL/method surfaces remain, plus the unchanged framework favicon/error/not-found entries.

All page slice paths below are relative to `src/fsd/pages`; dashboard wrappers remain beneath `src/app/(dashboard)`.

| URL / method | Owner | Explicit framework entry / preserved inputs |
| --- | --- | --- |
| `/` GET | App redirect, no screen | `src/app/page.tsx`; redirects to `/dashboard`. |
| `/login` GET | `login` page + `sign-in` feature | `src/app/login/page.tsx`; promised `searchParams`, including `next`. |
| `/dashboard` GET | `overview` page | `dashboard/page.tsx`; overview aggregates/charts stay page-local. |
| `/plans` GET | `plans` page + `manage-plan` feature | `plans/page.tsx`; `page`, `enabled`, `lifetime`. Existing pilot retained. |
| `/subscriptions` GET | `subscriptions` page | `subscriptions/page.tsx`; `page`, `status`, `plan`. |
| `/customers` GET | `customers` page + `create-customer` feature | `customers/page.tsx`; `page`, `search`, `status`. |
| `/customers/[customerId]` GET | `customer-details` page + provisioning/renewal features | `customers/[customerId]/page.tsx`; promised `params.customerId`. Profile header, tabs, subscription summary and cross-domain read model are page-local. |
| `/licenses` GET | `licenses` page | `licenses/page.tsx`; `page`, `search`, `status`. |
| `/licenses/[licenseId]` GET | `license-details` page + `rotate-license-code` feature | `licenses/[licenseId]/page.tsx`; promised `params.licenseId`. |
| `/devices` GET | `devices` page | `devices/page.tsx`; `page`, `status`. |
| `/issuances` GET | `issuances` page | `issuances/page.tsx`; `page`, `reason`. |
| `/audit-logs` GET | `audit-logs` page | `audit-logs/page.tsx`; `page`, `action`. |
| `/settings` GET | `settings` page | `settings/page.tsx`; existing informational content. |
| `/activation-requests` GET | `activation-requests` page + `activate-license` feature | `activation-requests/page.tsx`; `page`, `status`. Guide/list remain page-local. |
| `/api/activation/verify` POST | `activate-license` server API | `src/app/api/activation/verify/route.ts`; Node runtime, multipart upload, exact bytes, same-origin/RBAC and existing outcomes. |
| `/api/activation/issue` POST | `activate-license` server API | `src/app/api/activation/issue/route.ts`; Node runtime, `{requestId}`, exact binary attachment. |
| `/api/renewal/issue` POST | `renew-subscription` server API | `src/app/api/renewal/issue/route.ts`; Node runtime, license/plan/operation IDs, verified actor, exact binary/expiry headers. |
| `/api/locale` POST | App cookie integration + Shared i18n | `src/app/api/locale/route.ts`; existing locale JSON/cookie behavior. |

Root/dashboard layouts, dashboard loading/error boundary, global error and favicon remain framework-owned App files. The access-denied screen is App-local composition (`src/app/_ui/access-denied.tsx`), combining sign-out and the environment badge. It is not an entity that imports higher layers.

## Interaction and infrastructure ownership

| Responsibility | Final owner |
| --- | --- |
| Plan create/edit | `features/manage-plan`; original pilot implementation and local state. |
| Customer creation | `features/create-customer`; form/dialog/action/types. |
| Atomic initial subscription + one-time code | `features/provision-subscription`; original RPC, validation, collisions, date normalization and revalidation. |
| Strictly unused license-code rotation | `features/rotate-license-code`; confirmation/action and existing eligibility/outcomes. |
| Password login | `features/sign-in`; existing form and cookie-aware Server Action. |
| Logout | `features/sign-out`; original provider sign-out and redirect. |
| File activation | `features/activate-license`; UI state machine, verification context loader, Edge adapters and HTTP handlers. |
| Same-device renewal | `features/renew-subscription`; preview/UI, retry state, Edge adapter and HTTP handler. |
| Verified session and role gates | `entities/session/api`; React request memoization retained. |
| Shared license relationships | `entities/license/api/load-license-customer-maps.ts`; callers retain their existing authorization before passing the guarded client. |
| License code entropy, encoding and hashing | `entities/license/lib/license-code.ts`; server-only, same 20 random bytes/Crockford/SHA-256 behavior. |
| One-time code warning/copy display | `entities/license/ui/one-time-code.tsx`; shared by provisioning and rotation. |
| Supabase cookie/private/browser constructors | `shared/api/supabase`; no changes to credentials, schema or client options. |
| Database facade | `shared/api/supabase/schema.ts`; same handwritten read/RPC types, not a new backend contract. |
| Environment, origin, locale and formatting | Separate `shared/config`, `shared/http`, `shared/i18n`, `shared/lib` modules. |
| Navigation and shell | `widgets/dashboard-shell`; all 10 existing navigation entries/groups retained. |
| UI primitives | Individual `shared/ui/*` modules, avoiding a mixed server/client UI barrel. |

The commercial mega-module was split by interaction. Small action parsers/feedback stay inside their interaction rather than introducing peer-feature dependencies. The overview, customers, licenses, operations and history "feature" query folders were superseded by page-local reads. No old import-path shims remain.

## CLI generation and batches

Verified installed CLI: **2.8.0**; Next.js **16.3.4**, React **19.2.8**. No packages were installed and no CLI config/ownership manifest was manufactured. Structure-only mode generated missing segments and public APIs, preserving existing files. Application implementations were then moved/adapted manually. Empty generated Shared barrels without callers were removed once individual module APIs were established.

Commands used:

```sh
# Batch 1
fsd -g shared --segments ui,lib,api,config,i18n,http,model
fsd -g entity session --segments api,model
fsd -g widget dashboard-shell --segments ui,model
# Batch 2
fsd -g page overview subscriptions devices issuances audit-logs settings --segments ui,api --root src/fsd
fsd -g entity license --segments api,ui,model
# Batch 3
fsd -g page customers customer-details licenses license-details --segments ui,api --root src/fsd
fsd -g feature create-customer provision-subscription rotate-license-code --segments ui,api,model
fsd -g entity license --segments lib
# Batch 4
fsd -g page login activation-requests --segments ui,api --root src/fsd
fsd -g feature sign-in sign-out activate-license renew-subscription --segments ui,api,model
```

Per-batch source snapshots, exit codes and logs are identified by `docs/fsd-migration/batch-*-results.json`; CLI output is in `batch-*-cli.log`. These are review checkpoints, not commits or deployments. Baseline snapshots preserved the existing uncommitted pilot and unrelated reports; no reset/stash was used.

| Batch | Scope | Final checkpoint checks | Routes/proxy |
| --- | --- | --- | --- |
| 1 | Shared, session foundation, shell/navigation | lint/types pass; 39 regression cases; webpack pass | Unchanged. |
| 2 | Overview, subscriptions, devices, issuances, audit logs, settings | lint/types pass; 41 cases; webpack pass | Unchanged. |
| 3 | Customers/licenses list/detail and commercial actions | lint/types pass; 41 cases; webpack pass; additional UI/workflow checks added before final workflow move | Unchanged. |
| 4 | Login, sign-out, activation, renewal and API wrappers | lint/types pass; 47 cases; corrected webpack build passes | Unchanged. |
| Final | Cleanup, full boundary and session-plumbing checks | **50/50**, lint/types pass, **webpack and Turbopack both pass** | Both bundlers match baseline; complete raw proxy manifests also identical. |

The first batch-4 webpack attempt rejected `"use server"` on a re-export-only public entry. The implementation directives were retained and public re-exports corrected; see `batch-4-webpack-first.log` and the passing `batch-4-webpack.log`. No lint/type rules or framework settings were weakened.

The earlier Plans pilot encountered Turbopack worker restrictions. This phase separately retried the default tool in the credential-free final snapshot: **`npm run build` passed with Turbopack** (`final-turbopack.log`). Webpack was independently verified via `npm run build -- --webpack` (`final-webpack.log`). Neither result is used as a substitute for the other.

## Behavioral preservation evidence

- **50 focused checks:** original 14 Plans cases plus auth/login/logout, verified-subject RBAC, commercial roles/RPC payloads, collision retries and one-time hashes, 11 read loaders and relationship/filter/error paths, HTTP origin/role/input gates, exact activation/issuance bytes, renewal actor/operation IDs, UI workflow events, proxy/SSR cookie plumbing, environment failures and architecture rules.
- **218 source fingerprints retained**, including 170 original top-level function bodies. This covers page JSX/classes, field/date logic, query construction, authorization, error outcomes, binary handling and retry handlers. Function names/bodies and constant initializers remain represented after moves. Import paths and type-only signatures/exports were adapted. These fingerprints are characterization evidence, not a proof of arbitrary runtime behavior.
- **16 controlled bilingual markup hashes match:** shell, login form, customer creation, provisioning, one-time code, rotation confirmation, activation and open renewal UI in Arabic and English. Shared CSS and dictionary payload checks pass. Fonts and root layout bodies retain their source fingerprints.
- **Full manifests captured**, including all app-paths, pages, static/dynamic route records, rewrites/redirects/header configuration and proxy matchers. Complete raw proxy manifests also compare equal for both build tools. See `final-{webpack,turbopack}-routes.json`, `proxy-before.json`, `proxy-after-*.json` and comparison logs.
- **Import enforcement:** the custom TypeScript-AST check resolves literal internal imports/re-exports, verifies layer direction and peer isolation, checks cross-slice public APIs, detects static cycles and follows client runtime imports until explicit Server Actions. `server-only` page entries and absence of the legacy source trees are asserted.
- **Emitted client JS checked for scoped implementation markers:** no private Supabase-key name, actor/RPC implementation markers or Node crypto import in static JS for either build. This complements the import check; it is not a general security scan.
- Package manifest/lockfile, Next/TS/ESLint/PostCSS configuration, AGENTS instructions, original audit and Plans report hashes are unchanged. Only active README/auth/environment source pointers were updated for the new ownership.

Every protected entry retains its original guard: layouts verify identity and admin status; loaders use authorized data access (overview retains its explicit check); commercial commands enforce owner/admin; activation adapters and HTTP handlers enforce operator roles; renewal checks commercial role and actor identity. The original live Supabase behavior is not replaced by the test doubles.

## Tooling limits and remaining legacy dependencies

`fsd check --architecture` exits 1 before import lint: its inferred Next configuration expects `src/pages`, whereas this migration deliberately uses `src/fsd/pages`. See `steiger-check.log`. Creating a dummy `src/pages` directory would hide the convention mismatch and could change routing. No Steiger pass is claimed; the repository's passing `tests/fsd-boundaries.test.mjs` enforces the chosen physical layout. Native CLI page generation and managed upgrades must not be run against this layout without reviewing their output.

No application imports remain from `src/components`, `src/server`, `src/lib`, `src/types`, `src/i18n` or the old query/commercial feature directories; those superseded trees are removed. Remaining dependencies are intentional:

| Retained implementation | Reason |
| --- | --- |
| Supabase SDK, private schema facade and privileged adapters | The live backend and its security/behavior boundary are explicitly retained. Backend/type-generation work is deferred. |
| Next App layouts/proxy and locale cookie endpoint | Framework initialization, request handling and route discovery belong in App; these are not unmigrated screens. |
| Unused drawer, placeholder, table skeleton, commercial title primitive | Relocated intact after caller inspection; deleting unused product UI is outside this behavior-preserving refactor. |
| Unused browser Supabase constructor and navigation types | Relocated to Shared/widget ownership without inventing consumers or changing auth. A separate cleanup can remove them after team review. |
| Existing correctness/scale/accessibility limitations | Subscription selection, fetch row caps, malformed-price normalization, pagination edge cases, generic errors and keyboard gaps remain unchanged. This phase does not fix those audit findings. |

## Runtime and visual verification gaps

Tests run actual source with controlled Supabase/auth/Next responses and hook/DOM fixtures. They do not establish real JWT verification against Supabase, deployed RLS/grants, actual RPC transactions, Edge signing behavior, browser hydration/Server Action transport or POS file import acceptance. Read-model fixtures record filters/relationships but do not emulate the full PostgreSQL/PostgREST engine.

No checked-in authenticated local/staging fixture environment, seed database or fixture accounts was available. `.env.local` was not read or copied, no production queries/writes were made, and no existing live session was treated as a fixture. Consequently **Arabic/English desktop/mobile authenticated screenshots and live browser acceptance were not performed**. Controlled markup equality is not pixel or accessibility acceptance. No production performance, deployment or capacity claim follows from these checks.

Builds use independent source copies with installed dependencies copied locally, no `.env*` files and Supabase/APP_ENV variables removed from child environments. `workspace.json` locates temporary checkpoints while they remain available; retained logs/manifests/hashes provide the durable local evidence. Nothing was committed, pushed or deployed.

Repeat repository checks:

```sh
npm run lint
./node_modules/.bin/tsc --noEmit --incremental false
node --test tests/*.test.mjs
npm run build                  # Turbopack
npm run build -- --webpack     # independent webpack result
```

The migration evidence runner `node scripts/verify-fsd-batch.mjs final` repeats lint/types/tests and an isolated credential-free webpack build, then compares the complete route/proxy configuration. It uses the recorded workspace location and installed dependencies; on this macOS host dependency copies use filesystem cloning. An authorized fixture environment is still needed for browser/session/persistence and visual acceptance before production release.
