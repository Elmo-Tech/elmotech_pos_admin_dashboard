# Elmodeer dashboard UI/UX refactor

Implemented 2026-11-18. This is a frontend redesign of the existing FSD dashboard; Laravel/MySQL remain its runtime backend. No deployment, database migration, permission expansion, dependency upgrade, or backend signing change was performed.

## Design reference and system

Reference: [Elmodeer landing page](https://elmodeer-landing-v1.elmotechsoft.online/), its public `/css/styles.css` and `/assets/brand/` assets, inspected in the browser and downloaded directly. The source CSS hash is recorded in `uiux-refactor/style-contract.json`.

The reference supplies navy `#101D56`, night `#070B2A`, stamp red `#D7372E`, pale indigo surfaces and IBM Plex Arabic. The workspace adapts these to a stable, readable operational surface. Primary actions use a slightly darker red `#CF342B` for contrast. Marketing scroll effects and changing sky colors are not appropriate for long-running forms and tables, so the workspace keeps a stable palette. The two actual Elmodeer wordmarks are stored locally under `public/brand/`; no remote image connection is needed at runtime.

`src/app/globals.css` owns semantic design tokens, typography, focus treatments, 44px form controls, surfaces, shell, dialogs, responsive table cards and reduced-motion handling. Decorative Calistoga headings were removed; Arabic and English use the existing Plex families. CSS was formatted with the already-installed PostCSS parser and its semantic AST was compared before/after formatting.

Measured token contrast against their surfaces: body 15.76:1, muted text 5.45:1, primary action 5.02:1, sidebar secondary text 9.02:1, focus indicator 6.34:1 and input boundary 3.11:1. These are focused token checks, not a claim of a complete WCAG certification or screen-reader audit.

## Interaction and information design

- The shared shell has a compact desktop sidebar, original wordmark, route-aware breadcrumbs, localized environment indicator, account/logout disclosure and a skip-to-content link. Mobile navigation uses a native modal with focus containment, Escape dismissal, scroll locking and closing on navigation or desktop resize.
- Navigation search supports Arabic/English names and route paths, Cmd/Ctrl K, ArrowUp/ArrowDown, Enter and Escape. It searches only known screens; it does not pretend to search customer data or expose privileged APIs to the browser.
- Overview prioritizes an attention queue linked to actual activation/expiring/expired views, live metrics and activity. It adds no synthetic growth percentages or revenue. Empty subscription health uses an em dash instead of implying an observed active percentage.
- Lists use concise headings, visible filter labels, GET search parameters, consistent reset/apply controls, clear counts, linked metrics and numbered pagination. Mobile tables retain field labels as cards and contextual record links. Filtering and pagination remain server-owned.
- Plan and customer forms are grouped into numbered fieldsets. Focus opens on the first field. Save/cancel controls remain outside the scrolling field area at mobile heights. Lifetime duration controls stay mounted and disabled with their existing required/reset behavior; the original field names and payloads remain intact.
- Login has a brand introduction, language switch, pending spinner, password reveal, associated error messages and email retention after a rejected login. No password is persisted or logged.
- Customer tabs support roving focus, Home/End and RTL-aware arrow keys. Their sticky position clears the shared header. Details retain the existing commercial and licensing actions and contextual links.
- Renewal uses a native, scrollable modal with focus containment and Escape handling. Closing is blocked while a request is pending. Explicit retry retains the original operation ID and locks plan selection after error. Issuance bytes and download implementation were preserved.
- Loading skeletons expose busy/status semantics. Data failures include a refresh-based retry. Empty states use one consistent illustration, hierarchy and contextual descriptions.

## Route coverage and FSD ownership

Existing Next.js wrappers and route groups are unchanged. Shared UI lives in `src/shared/ui`; shell/navigation live in `src/widgets/dashboard-shell`; compositions stay under `src/fsd/pages`; mutation UI stays under its existing `src/features` owner. No new runtime libraries were introduced.

| Route | Page owner | Redesign coverage |
| --- | --- | --- |
| `/` | App entry | Existing redirect preserved; root fonts/tokens apply |
| `/login` | `fsd/pages/login` + `features/sign-in` | Brand layout, locale, validation feedback, password reveal, pending state |
| `/dashboard` | `fsd/pages/overview` | Operational summary, attention queue, metrics, accessible growth values and empty health |
| `/customers` | `fsd/pages/customers` | Shared directory/filter/table/pagination system; grouped create-customer dialog |
| `/customers/[customerId]` | `fsd/pages/customer-details` | Brand profile, responsive details, keyboard tabs, subscription/licensing/history and dialogs |
| `/plans` | `fsd/pages/plans` + `features/manage-plan` | Concise catalog, semantic metrics, filters, pagination, grouped create/edit and fixed footer |
| `/subscriptions` | `fsd/pages/subscriptions` | Portfolio-focused heading, linked metrics, validity context and reusable list controls |
| `/licenses` | `fsd/pages/licenses` | Shared list/filter/table/empty/error/pagination system |
| `/licenses/[licenseId]` | `fsd/pages/license-details` | Shared heading, labeled detail grid, section navigation, tables and existing code-rotation warning |
| `/devices` | `fsd/pages/devices` | Shared operational list and mobile record cards |
| `/activation-requests` | `fsd/pages/activation-requests` + `features/activate-license` | Compact introduction, existing three-step workflow, branded upload/review states, guide and request history |
| `/issuances` | `fsd/pages/issuances` | Shared traceable history/filter/table/pagination system |
| `/audit-logs` | `fsd/pages/audit-logs` | Shared searchable history and mobile record cards |
| `/settings` | `fsd/pages/settings` | Current verified identity, localized role/environment, accurate read/operational/commercial capabilities |
| `/api/locale` | Existing App handler | Existing locale endpoint reused; contract unchanged |
| `/api/activation/verify`, `/api/activation/issue`, `/api/renewal/issue` | Existing feature server APIs | Handlers, authorization and protocol unchanged; workflow UI redesigned around them |

The 33 modified pre-existing UI files are enumerated in `uiux-refactor/changed-ui-files.json`. New UI modules: `widgets/dashboard-shell/ui/quick-navigation.tsx`, `fsd/pages/login/ui/login-language.tsx`, and `shared/ui/retry-button.tsx`. Existing shared primitives propagate the redesign to screens whose own composition files did not need modification.

## Verification

| Check | Result | Evidence / scope |
| --- | --- | --- |
| ESLint | PASS | `uiux-refactor/lint.log` |
| Typecheck and Next route type generation | PASS | `uiux-refactor/typecheck.log` |
| Node tests | PASS | `uiux-refactor/tests.log`; existing behavior tests plus seven focused UI interaction/contrast tests |
| FSD ownership/import direction/client-server boundaries | PASS | Included in Node suite; no client path reaches a server-only implementation |
| Default `npm run build` / Turbopack | BLOCKED | `uiux-refactor/build-default.log`: subprocess cannot bind its internal port (`Operation not permitted`). Retried with elevated execution; same host restriction. Not represented as a code/build success. |
| `npm run build -- --webpack` | PASS | `uiux-refactor/build-webpack.log`; production standalone output used for browser review |
| Full route comparison | PASS | `uiux-refactor/route-comparison.json`: full routes/app-paths JSON match; all proxy routes/functions/matchers match. Generated proxy bundle filenames are excluded from the semantic comparison. |
| Arabic/English desktop/mobile rendering | PASS, controlled fixture | `uiux-refactor/browser-results.json`: 12 authenticated screens × 2 languages × 2 viewports = 48 renders; 1440×1000 and 390×844; no horizontal overflow. Four plan-dialog geometries confirm visible footer actions. |
| Plans create/edit/finite-to-lifetime/reload | PASS, controlled fixture | Browser-verified against disposable in-memory transport; values 750/6 persisted on reload, then lifetime state persisted on the second reload. Not a MySQL persistence claim. |
| Filter/reset/page 2, empty state, data-error retry | PASS, controlled fixture | Actual UI interactions; page 2 showed 21–26 of 26; injected mock 503 recovered using retry |
| Role-gated controls | PASS, controlled fixture + server unit tests | Admin displayed create/edit, support/viewer displayed neither; owner create/edit verified. Existing server RBAC tests cover all roles. |
| Login error/logout/protected redirect | PASS, controlled fixture | Retained email, cleared password, localized feedback and `/login?next=%2Fplans` after logout |
| Navigation search / keyboard / mobile Escape | PASS | Browser interactions and focused Node tests |
| Renewal dialog and error | PASS, controlled rejection | Mobile modal shown; failed request leaves plan locked and explicit retry available; stable retry ID/download-byte behavior covered by existing workflow/handler tests |
| File-upload browser interaction | BLOCKED | Browser file-upload permission was declined. No bypass or alternative upload was attempted. Invalid file/client/server protocol characterization tests remain in the passing Node suite. |
| Real Laravel signing/activation/renewal download acceptance | BLOCKED | Preview does not implement cryptographic issuance. The pre-existing original POS signing/protocol limitation is not resolved by this UI refactor. No production fixture writes were made. |
| Hosted deployment / GitHub CI | NOT RUN | Work is local; no commit, push or Coolify deployment performed for this redesign |

Before/after source and route records are retained. Legacy FSD pixel/markup preservation tests were intentionally updated for this user-authorized redesign: original artifacts remain under `docs/fsd-migration`; exact changed UI declaration fingerprints and new markup snapshots live in `uiux-refactor`. The exemption list rejects non-UI/API/business files, and all existing mutation, RBAC, protocol, byte-preservation and retry tests remain active.

A preliminary preview failed because its issuance fixtures lacked `reason`, `revision` and `key_id`. The fixture was corrected, not the application's read or protocol code. All final 48 screen checks used the complete fixture and production build. An early mobile review also found save controls below the scrolling fields; splitting the footer from the scroll area fixed it, and all four final dialog viewport checks passed.

Screenshots include `dashboard-{ar,en}-{desktop,mobile}.jpg`, `plans-*`, `activation-requests-*`, `settings-*`, `plan-dialog-*`, `login-*`, navigation, empty, read-error and renewal-error captures. All contain disposable preview records, not production customer data.

## Local preview and operational boundaries

A standalone production preview runs at `http://127.0.0.1:4340/dashboard`, using a loopback-only disposable transport at `127.0.0.1:8340`. The user's pre-existing server on port 3000 was left untouched. Preview data resets when its process stops and must not be treated as Laravel/MySQL acceptance.

To reproduce with an already-built standalone output:

```sh
node scripts/uiux-preview-fixture.mjs
```

In a separate terminal, after copying `public` and `.next/static` into the standalone output as for a normal standalone distribution:

```sh
APP_ENV=staging DATA_PROVIDER=laravel \
LARAVEL_API_URL=http://127.0.0.1:8340/api/v1 \
HOSTNAME=127.0.0.1 PORT=4340 node .next/standalone/server.js
```

The fixture exposes only fake accounts (`owner`, `admin`, `support`, `viewer` at `uiux.invalid`, password `preview-only`) and in-memory records. It reads no environment files, credentials or database. Its rejection of issuance is intentional. Never configure this fixture URL in Coolify or use it as a backend replacement.

The working tree already contained the earlier login diagnostic fix before this task: `features/sign-in/api/actions.ts`, `features/sign-in/model/types.ts`, `shared/api/laravel/server.ts`, `shared/api/laravel/auth-error.ts`, `tests/login-failures.test.mjs`, and its declaration log. Those changes were preserved; they are not a new auth migration. Only the login form's presentation and interaction were extended here.
