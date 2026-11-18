# Laravel/MySQL connection verification

18 November 2026. This is a local, authenticated verification against the
new Laravel backend and isolated MySQL database. It does not describe a
production cutover or successful new POS signing/renewal.

## Recorded result

| Check | Result | Evidence |
|---|---|---|
| Full connection run | PASS | 40 flow checks; 26 authenticated SSR page renders across Arabic/English |
| Outgoing Next server requests | PASS | 348 observed requests; 346 domain requests, all to 127.0.0.1:8000 |
| Browser network | PASS | 609 observed page requests across owner/admin/support/viewer contexts |
| Supabase requests or attempts | PASS | **0 server / 0 browser**; raw trace and browser destination files retained |
| Real MySQL persistence | PASS | database dashboard, MySQL 8.4.11; plan price, customer creation, subscription/license creation and hash rotation verified directly |
| ESLint / typecheck | PASS | lint.log and typecheck.log |
| Frontend regression suite | PASS | 67 Node tests, including FSD boundaries and Laravel-only networking contracts |
| Laravel tests on MySQL | PASS | 12 tests / 91 assertions against isolated dashboard_test |
| Webpack production build | PASS | Used for this instrumented run; complete route manifests unchanged |
| Client bundle scan | PASS | No Supabase URLs, secret-key references or network-client factories found |
| New POS verification/signing/renewal functionality | BLOCKED | Connected to Laravel, but verified implementation/keys/fixtures are missing; no Supabase fallback |
| Temporary service shutdown | PASS | Neither 4320 nor8000 remains listening; MySQL was left unchanged |

Full results and request traces are under [laravel-connections](laravel-connections/results.json).
The default Turbopack build was not rerun here; its previously documented internal
port-binding environment blocker remains unresolved. This run's passing build
is specifically Webpack. The connection run adds no authenticated baseline
Supabase visual-parity or production-deployment claim.

## Current runtime policy

Laravel is the only supported provider. Supabase cannot be selected, including
with DATA_PROVIDER=supabase. Unknown providers fail closed. Supabase SSR/browser
clients and configuration entry points throw before client initialization or
credential reads. The formerly Supabase-named privileged client is only a
compatibility alias returning the Laravel adapter.

Authentication, logout, role verification and every domain-data operation use
server-side Laravel HTTP requests. The proxy only forwards pathname information;
there is no Supabase session refresh. Laravel verifies tokens, active status and
roles again at protected HTTP endpoints. MySQL owns identities, tokens, licensing
tables and commercial transactions.

Supabase contract types and an inert HTTP-error class remain as compatibility
imports. There are no Supabase network factory imports/calls in application
source; a dedicated architecture test enforces that. The Laravel HTTP boundary
also rejects known Supabase hosts and disallows redirects. Old environment keys
are not needed or read. No remote Supabase project, identity or data was changed.

## Complete page/route map

The runner renders every route below through authenticated HTTP in **both Arabic
and English**, checks its HTML lang/dir and successful status, and associates
server-side HTTP traces with each render. Every protected render must call
Laravel auth/me. Every data screen must additionally call a Laravel data endpoint
with HTTP200. Browser form tests separately exercise mutations and session flow.

| Route | FSD owner | Laravel/MySQL path |
|---|---|---|
| / | Existing root redirect | /dashboard, authenticated Laravel reads |
| /login | login + sign-in | auth/login; verified identity via auth/me |
| /dashboard | overview | customers, subscriptions, licenses, devices and requests through data queries |
| /plans | plans + manage-plan | data/plans/query, POST plans, PATCH plans/{id} |
| /customers | customers + create-customer | customer/subscription queries; POST customers |
| /customers/[customerId] | customer-details | customer, subscription, plan, license, device, request, issuance and audit queries |
| /licenses | licenses | license, customer, subscription, device and plan queries |
| /licenses/[licenseId] | license-details | related licensing queries; licenses/{id}/rotate-code |
| /subscriptions | subscriptions | subscription, plan and customer queries |
| /devices | devices | device, license and customer queries |
| /activation-requests | activation-requests | request, device, license and customer queries |
| /issuances | issuances | issuance, license and customer queries |
| /audit-logs | audit-logs | audit, license and customer queries |
| /settings | settings | auth/me; environment/role presentation has no separate settings database operation |

The sign-out Server Action calls Laravel auth/logout. Existing URLs, dynamic
parameter names, query parameters and route groups are retained. Loading/error
components and favicon are presentation/static resources, not database entry
points.

## All Next HTTP APIs

| Next route | Owner/destination | Connection vs functionality |
|---|---|---|
| POST /api/locale | Next.js HttpOnly locale cookie | Local UI preference; intentionally no backend/database call |
| POST /api/activation/verify | activate-license → Laravel activation/verify | Connected; verification unavailable (Laravel503 → existing Next422 protocolNotConfigured) |
| POST /api/activation/issue | activate-license → Laravel activation/issue | Existing stored document replay succeeds; new signing remains unavailable |
| POST /api/renewal/issue | renew-subscription → Laravel renewal/issue | Connected; renewal unavailable (Laravel503 → existing Next422); retry reuses operation ID without fallback |

The file routes retain same-origin, shape, byte-size and role guards. The
business Server Actions use explicit Laravel plans/customers/provision/rotation
routes, never remote RPCs. Compatibility method names such as `.rpc()` or
`.functions.invoke()` are local adapter methods mapping to those Laravel paths.

## Fixes found by this audit

1. The locale API compared Origin only to Next's internal localhost URL. A
   legitimate request from 127.0.0.1 was rejected with403. It now uses the existing
   same-origin helper, recognizing the public Host while retaining foreign-origin
   rejection, validation, and HttpOnly cookie behavior. Regression coverage added.
2. Successful provisioning updated the customer's eligibility, unmounting the
   dialog and discarding its one-time code. The dialog now stays mounted through
   revalidation; only its trigger disappears when provisioning becomes ineligible.
   The existing success state remains visible until the operator closes it.
   No code is persisted in browser storage or added to logs. A regression test
   and the actual Laravel/MySQL browser workflow cover this behavior.

The React review checked stable component identity, unconditional hooks, dialog
cleanup/accessibility and server authorization. These changes add no state or UI
library. All other styling, translations and existing characterized markup stay
under the preservation tests; deliberate changes have explicit fingerprints.

## Evidence and reproduction

- `laravel-connections/results.json`: per-flow status and associated Laravel
  requests, including 26 authenticated root/dashboard renders across two locales.
- `laravel-connections/server-network.jsonl`: Next.js outgoing fetch/HTTP(S)
  destinations and response statuses. No headers, credentials or bodies recorded.
- `laravel-connections/browser-network.json`: browser page destinations for all four role contexts.
- `laravel-connections/network-summary.json`: request counts, forbidden-host
  attempt counts, observed domain destinations and direct MySQL persistence proof.
- `laravel-connections/shutdown.json`: both temporary application ports closed.
- Frontend unit/regression tests include no-Supabase source/client/host guards,
  Laravel request/redirect boundaries, locale-origin checks and code-result state.

Run lint, typecheck and npm test without live credentials. To repeat the optional
local acceptance run, build Next.js and supply an authorized local MySQL/Laravel
fixture setup plus the generated protected .runtime account files described in
the backend docs. The runner refuses occupied application ports, creates only new
QA records and never edits imported historical licenses. The MySQL persistence
check uses the isolated instance's private mysql-admin.cnf; passwords are not
passed in arguments or recorded in evidence.

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
PLAYWRIGHT_EXECUTABLE_PATH=/absolute/path/to/chrome-headless-shell \
node scripts/verify-laravel-connections.mjs
```

The runner temporarily starts Laravel8000 and Next4320, instruments server
fetch/HTTP(S) requests and browser page requests, and stops its owned process
groups even after failure. The pre-existing MySQL service is not stopped. It
checks real form submissions, directly queries MySQL for saved records, exercises
all API wrappers and permissions, and compares replayed document hashes.

## Remaining functional gap

New activation verification, new signed issuance and same-device renewal are
**BLOCKED** pending the original POS protocol/signing implementation and fixtures.
Their request routing to Laravel is verified; they do not silently call Supabase.
Stored signed files can be replayed unchanged. No signature validity, successful
new renewal, full production parity or authenticated Supabase-baseline visual
comparison is claimed by these connection tests.
