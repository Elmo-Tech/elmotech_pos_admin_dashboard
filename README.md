# Elmo POS Licensing Admin Dashboard

Internal web application used by Elmotech to operate and support the Elmo
POS licensing backend. This is **LC-9** in the Elmo POS licensing roadmap.

This is a separate repository/application from the Flutter POS app
(`elmotech_pos`). Dashboard UI and server code live here; backend-owned
licensing migrations, database tests, and Edge Functions live in the POS repo.

## Backend status

**Laravel is the only runtime backend. Supabase connections are disabled**,
including explicit `DATA_PROVIDER=supabase`. New work uses Laravel. See [Supabase deprecation](docs/SUPABASE_DEPRECATION.md) and the
[Laravel integration report](docs/laravel-integration/REPORT.md). New POS
activation/signing and renewal still require the original protocol implementation.

## Purpose

The existing production licensing backend uses Supabase. The local dashboard
now defaults to Laravel; no production cutover is implied. Staff use it to
manage customers, plans, subscriptions, and the offline activation workflow,
while keeping technical license, device, issuance, and audit records available
contextually without exposing the database as the product interface.

## Architecture

Next.js 16 App Router, strict TypeScript, Tailwind CSS and Feature-Sliced Design.
Laravel provides authentication, licensing reads and commercial actions. The
Supabase network implementation is disabled; only compatibility types and
fail-closed legacy entry points remain. The completed migration and per-batch verification are documented in
[Frontend FSD migration](docs/FRONTEND_FSD_MIGRATION.md).

```text
src/
  app/                    Next layouts, explicit route wrappers, cookie endpoint
    (dashboard)/          protected route group; all existing URLs retained
    api/activation/       Node Route Handler wrappers for activation features
    api/renewal/          Node Route Handler wrapper for renewal feature
  proxy.ts                session-cookie refresh and pathname forwarding
  fsd/pages/              server-only screen compositions and page-local reads
  widgets/dashboard-shell/ shell, header, sidebar and navigation model
  features/               manage-plan, create-customer, provision-subscription,
                          rotate-license-code, sign-in, sign-out,
                          activate-license, renew-subscription
  entities/session/       verified identity, database RBAC, authorized read gate
  entities/license/       shared license context, code generation and display
  shared/
    ui/                   reusable presentation primitives
    lib/                  formatting, query/redirect helpers and utilities
    i18n/                 Arabic/English copy; separate server locale entry
    config/               separate public and server environment modules
    api/laravel/          default server-only authentication and API transport
    api/supabase/         deprecated clients and retained compatibility types
    http/                 same-origin request policy
    model/                environment type
```

FSD Pages live under `src/fsd/pages`, keeping them outside Next's Pages Router.
`src/app/**/page.tsx` wrappers preserve route groups, dynamic params and promised
searchParams. Cross-slice imports use narrow public APIs. Client UI entry points
are separate from server-only entries and Server Action implementations.

Arabic remains the default, with `elmo_admin_locale` resolved on the server to
render `lang` and `dir` before hydration. English uses the same URLs. Existing
CSS, fonts, text and interaction bodies were preserved. Auth/session and licensing
entry points retain their authorization checks; local Laravel integration is
documented separately from the historical FSD migration.

## Historical Supabase environments (runtime disabled)

The following project references document the previous backend. They cannot be
selected by this application. Laravel uses server-side `LARAVEL_API_URL` instead.
There were **two separate Supabase projects**:

| Environment | Project | Ref |
|---|---|---|
| Staging | `elmotech-pos-licensing-staging` | `sweezvyqlmerlcxjkair` |
| Production | `elmotech-pos-licensing-prod` | `lhfvlczfqltvwydfaeod` |

- **`APP_ENV`** (server-only, no `NEXT_PUBLIC_` prefix) is the single,
  authoritative source of environment identity, resolved by
  `src/shared/config/server.ts` and passed down through the server-rendered layout
  as a prop — never re-derived in the browser. It defaults to `staging`
  when unset.
- `getServerEnvironment()` validates APP_ENV and rejects any provider other than
  Laravel. APP_ENV=production is rejected outside NODE_ENV=production.
- Old Supabase URL/key variables are not read by the runtime.
- The header renders a persistent Staging/Production badge
  (`EnvironmentBadge`), fed exclusively by that server-validated value.
- **Local development must use Staging.** Production cannot be targeted
  locally even if misconfigured — see above.

See [`.env.example`](.env.example) for the exact variables.

## Security boundary

The browser must never receive:

- `sb_secret_*` or `service_role` Supabase keys
- The Production or Staging license signing private keys
  (`ELMO_LICENSE_SIGNING_PRIVATE_KEY_PKCS8_B64URL`)

Only browser-safe values may be prefixed NEXT_PUBLIC_*. Laravel requests run
server-side with a verified HttpOnly session token. Database credentials stay in
Laravel. Every protected backend HTTP endpoint verifies identity and role again.
The compatibility entry in `src/shared/api/supabase/privileged-client.ts` returns
only the Laravel transport; retired Supabase auth clients throw without creating
connections. See [connection verification](docs/LARAVEL_CONNECTION_VERIFICATION.md).

## Authentication & authorization

Laravel authentication validates active staff through the API and stores its
token in a server-managed HttpOnly cookie. See the integration report.

The former Supabase auth design is retained only as historical documentation in
`docs/AUTH_ARCHITECTURE.md`; it is not an enabled runtime path.

## Coolify VPS deployment

Use the repository-root `docker-compose.yaml` and `Dockerfile`. The Laravel
repository has a separate Compose stack with persistent MySQL. Follow
[Coolify deployment](docs/COOLIFY_DEPLOYMENT.md) for both resources, environment
variables, initial migrations and account provisioning.

## Local development

```bash
npm install
cp .env.example .env.local   # configure the Laravel API URL; start Laravel separately
npm run dev
```

```bash
npm run lint
npm run build
npx tsc --noEmit
```

The app builds and lints without Supabase credentials. Runtime authentication
and reads use the configured Laravel API. Supabase credentials are neither required nor read by the application. Production must use `NODE_ENV=production` and
`APP_ENV=production`, built with `npm run build` and run with `npm run start`.

## Historical Supabase production acceptance

Final Production acceptance passed on 14 September 2026 against
`elmotech-pos-licensing-prod` (`lhfvlczfqltvwydfaeod`). The accepted Dashboard
was built and started locally as a production-mode Next.js process with
`NODE_ENV=production` and `APP_ENV=production`; this acceptance does not claim
public/cloud hosting or a deployed Production domain.

Human browser acceptance passed for the Production warning banner and
environment badge, the active Owner identity and role, Overview, Customers,
Activation, Subscriptions, Plans, and Settings. The server-authorized
Production read path displayed the existing commissioning data correctly, and
authenticated connectivity to the accepted licensing Edge Functions passed.
No business mutation or renewal issuance was created during final acceptance.
Permanent hosting and domain deployment remain a separate operational
follow-up, not a Licensing V1 blocker.

## Currently supported licensing capabilities

Reflects what the backend (already live) supports today:

- Customers, Plans, Subscriptions, Licenses
- Activation Requests, Device Activations
- Initial (revision-1) and simple same-device renewal (revision-2+) License
  Issuances
- Audit Logs
- Offline initial activation
- `.elmoreq` upload/verification and initial `.elmolic` issuance/download
- Plan creation/editing, customer creation, and subscription assignment
- Atomic initial draft-license provisioning with one-time License Code display
- Safe generation of a new License Code for a strictly unused license
- Simple same-device subscription renewal with signed revision-2+ `.elmolic`
  download
- Arabic/RTL default with English/LTR support

## Explicitly not supported yet

Do not build UI that implies these exist — they belong to later licensing
work beyond the accepted simple V1 scope:

- Device replacement workflow
- Revocation workflow
- Suspension workflow
- Advanced or multi-device renewal workflow
- Full key rotation workflow
- Broader LC-10/LC-11 workflow and hardening coverage

## Current phase

All core modules are connected to live data from the validated environment: Overview,
Customers and Customer 360, Subscriptions, Licenses and License 360, Devices,
Activation Requests, Issuances, Audit Logs, and Plans. The sidebar retains all workspace, operations and settings links, including
licenses, devices, issuances and audit logs. Lists use server-side filters and pagination with batched relationship
lookups.

Commercial onboarding was first accepted on Staging and is now accepted for the
chosen Production V1 scope. Authorized Owner/Admin operators can create/edit
plans, create customers, assign a plan, and atomically provision the
subscription plus initial draft license. The plaintext License Code is
generated server-side, displayed once through transient action state, and
copied on demand; only its SHA-256 hash is sent to and stored by PostgreSQL. A
lost code can be replaced only while the license is strictly unused. This does
not implement device replacement.

The initial offline activation workflow is implemented through authorized
Next.js route handlers. The server validates and forwards the exact `.elmoreq`
bytes to the validated environment's `verify-activation-request` function, then invokes
`issue-initial-license` with the verified request ID and returns the exact
`.elmolic` response for download. The complete workflow passed a real Staging
onboarding and activation E2E before Production promotion; the Production
Dashboard path and authenticated Edge Function connectivity subsequently
passed final acceptance. Viewer accounts cannot run these operations.

Simple same-device subscription renewal is implemented for authorized
Owner/Admin operators. A real Staging acceptance renewed an existing finite
subscription to 5 September 2028, downloaded the signed renewal `.elmolic`,
advanced revision 1 -> 2, imported it into the Staging Windows POS, and verified
that both licensed state and updated validity persisted after restart. The
accepted renewal migration and Edge Function are now in Production; the final
authenticated negative probe passed without creating a renewal issuance.

Production environment support, active Owner RBAC, the Dashboard read path, and
authenticated Edge Function connectivity are accepted for the chosen V1 scope.
Device replacement, revocation, suspension, advanced/multi-device renewal, the
full key-rotation operational workflow, admin-user management, the broader
LC-10 matrix, and consolidated LC-11 hardening remain deferred; they do not
block the chosen simple V1 scope.
