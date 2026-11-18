# Laravel/MySQL integration verification — 18 November 2026

The new backend lives in `../backend elmoetch pos_admin_dashboard`. Laravel 13.43.0, Sanctum 4.5.0, PHP 8.5.4 and an isolated MySQL 8.4.11 instance were used. This is a local implementation and acceptance run. It does **not** establish production readiness or complete POS cryptographic migration.

## Delivered and connected

- Controllers delegate to application services; read access goes through a column/operator allowlisted repository. FormRequests validate commercial inputs. Sanctum authenticates every protected endpoint; active status and role authorization are independently enforced by Laravel.
- Plans, customers, subscription provisioning, draft commercial-code rotation, domain list/detail reads and audit records are connected to the existing FSD UI. Transactions bind commercial writes and audit records; plaintext commercial codes are never stored.
- New Laravel staff credentials are generated locally. Supabase passwords were not present in the export and have not been migrated. Historical admin rows grant no Laravel access.
- The supplied CSV was previewed and imported into the new local database: 32 rows across nine tables, retaining UUIDs and all three signed document strings. No live Supabase mutation was performed.
- Explicit `DATA_PROVIDER=laravel` selects the server-only Laravel transport. Existing Supabase mode remains the default and is covered by the original session tests. `.env.local` selects Laravel on this machine. The frontend npm lockfile and dependency audit threshold were preserved.

## Results

| Check / flow | Result | Evidence and precise scope |
|---|---|---|
| Frontend ESLint | PASS | `lint.log`; includes new adapter, tests and acceptance driver |
| Frontend typecheck | PASS | `typecheck.log`; next typegen + tsc |
| Frontend regression tests | PASS | `tests.log`: 56 tests, including original 50 and six Laravel transport/session tests; FSD layer/client-server boundary checks pass |
| Backend tests, SQLite | PASS | `backend-tests-sqlite.json`: 12 tests, 91 assertions (10 domain tests plus two Laravel skeleton checks) |
| Backend tests, real MySQL | PASS | `backend-tests-mysql.json`: same suite, isolated dashboard_test database |
| PHP formatting and Composer metadata | PASS | Laravel Pint applied; composer validate --strict |
| Composer dependency audit | PASS | `composer-audit.json`: no advisories or abandoned packages at run time |
| Default production build (Turbopack) | BLOCKED | `build-turbopack.log`: subprocess port binding denied with EPERM. Earlier sandbox attempt also could not fetch Google Fonts. This is not reported as a passing default build |
| Alternative production build (Webpack) | PASS | `build-webpack.log`: `npm run build -- --webpack`; the actual browser run used this production output |
| Complete route manifest comparison | PASS | All fields of app-paths, pages and routes manifests plus captured legacy proxyMatch equal `docs/dependency-remediation/routes-after.json`. `routes-after.json` stores the result |
| Proxy discovery/configuration | PASS | Exported proxy config matches HEAD exactly. Node proxy compiled matcher captured in `proxy-config-after.json`; the older proxyMatch baseline was empty, so compiled-regexp equality to a prior node matcher cannot be asserted |
| Login, invalid credentials, logout, protected redirect | PASS | `browser-results.json`; new local Laravel accounts, Arabic/English at 1440×1000 and 390×844 |
| Role-gated controls | PASS | Browser Owner/Admin can see plan controls; Support/Viewer cannot. Backend tests independently cover all four roles at read/commercial/activation/renewal entry points |
| Plans create/edit and refresh persistence | PASS | Real browser form submission: finite plan created, price edited, converted to lifetime, reloaded and fields rechecked against MySQL-backed API |
| Plans filters, pagination and dialogs | PASS | Enabled filter + page 2, create dialog in four locale/viewport contexts. Query transport and backend tests additionally verify exact totals, range, booleans and invalid operators |
| Dashboard and remaining screen reads | PASS | Browser HTTP200 and absence of module-unavailable error for overview, customers, licenses, subscriptions, devices, activation requests, issuances, audit logs, settings and a disposable customer detail. Other screens' individual filter permutations are covered by controlled Node read-model tests, not exhaustive browser interaction |
| Historical .elmolic download and initial replay | PASS | `document-integrity.json`: all three 881-byte documents match export SHA-256 and exact bytes through real API GET + issue replay. Backend tests cover owner/admin/support versus viewer |
| New .elmoreq verification, new issuance and renewal | BLOCKED | Original Edge Function/RPC source, request fixtures and compatible signing configuration are absent. API returns 503 protocolNotConfigured before mutation. No signature or successful renewal is invented |
| Historical customer/license details | PASS | `detail-browser-results.json`: real imported relationships read successfully under owner, admin, support and viewer; no historical writes |
| Browser JS errors | PASS | Zero recorded page errors in four locale/viewport contexts |
| Authenticated before/after Supabase vs Laravel visual parity | BLOCKED | No authorized authenticated baseline Supabase fixtures or equivalent rendered baseline. Current screenshots are evidence of this local Laravel branch only, not a parity claim |
| GitHub Actions and production deployment | NOT RUN | No remote push/PR run or production cutover was part of this backend implementation |

Screenshots: `login`, `login-error`, `plans`, `plan-dialog` × `{ar,en}` × `{desktop,mobile}`. Arabic RTL and English LTR were checked. The Arabic mobile dialog and English login-error images were visually inspected. Existing form reset after an invalid login is retained. Browser-driver retries initially failed due to redirect glob matching, form reset assumptions and hidden React streaming tables; the corrected driver completed successfully. These were test harness corrections, not product behavior changes.

## Frontend routing/ownership

All existing route groups, dynamic parameter names, searchParams and URLs remain intact. No App Router wrapper moved. FSD owners are unchanged from the completed migration map.

| URL | Existing FSD owner / transport |
|---|---|
| / | Existing redirect to /dashboard |
| /login | Login page; sign-in/sign-out features branch to Laravel server auth |
| /dashboard | Overview page; authorized read API |
| /plans | Plans page + manage-plan feature; query, create, update APIs |
| /customers | Customers page + create-customer feature |
| /customers/[customerId] | Customer-details page + provision-subscription feature |
| /licenses | Licenses page + rotate-license-code feature |
| /licenses/[licenseId] | License-details page; reads and existing activation/renewal controls |
| /subscriptions | Subscriptions page; authorized reads |
| /devices | Devices page; authorized reads |
| /activation-requests | Activation-requests page + activate-license feature |
| /issuances | Issuances page; metadata reads |
| /audit-logs | Audit-logs page; authorized reads |
| /settings | Settings page; existing environment/role UI |
| /api/activation/verify | Existing Next handler, same multipart/role gates; Laravel raw-byte verification endpoint currently unavailable |
| /api/activation/issue | Existing Next handler, same origin/role gates; Laravel existing-document replay or unavailable outcome |
| /api/renewal/issue | Existing Next handler, same origin/manager/operation-ID gates; new Laravel renewal unavailable |
| /api/locale | Existing locale-cookie endpoint |

Seven declarations deliberately gained a Laravel provider branch. `declaration-changes.json` pairs the immutable pre-FSD fingerprints with the exact new fingerprints. The preservation test accepts only those explicit changes; all other declarations, CSS, localization and UI payloads retain the baseline checks. This is an authorized backend integration change, not an architecture-only move.

## Reproduce the browser run

Start the local Laravel API on 127.0.0.1:8000 and build the frontend. The driver creates disposable QA plans/customers in the local database and starts/stops a Next production server on port4320. It never targets a staging/production hostname. It reads protected generated account files under backend/.runtime; create these roles/accounts first as described in backend docs. Owner locale fixtures use owner-en-mobile, owner-ar-desktop, owner-ar-mobile email local-parts, all @elmotech.local. Keep their command outputs in corresponding .runtime/*-account.txt files; main owner output is local-account.txt. Admin/support/viewer outputs follow role-account.txt. This keeps normal login throttling enabled.

```sh
# Playwright is an optional acceptance runner, not a new runtime dependency.
# Use a locally authorized Playwright installation and compatible browser:
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
PLAYWRIGHT_EXECUTABLE_PATH=/absolute/path/to/chrome-headless-shell \
node scripts/laravel-acceptance.mjs
```

Backend setup, API field rules, data relationships, operations, import safety and protocol prerequisites are documented in that project's README and docs folder. Original RPC definitions are still needed to establish exact behavioral parity for all commercial edge cases, especially date calculations and concurrent writes. Keep production on its existing backend until those decisions and cryptographic acceptance are completed.
