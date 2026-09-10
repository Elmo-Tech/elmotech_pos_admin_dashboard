# Elmo POS Licensing Admin Dashboard

Internal web application used by Elmotech to operate and support the Elmo
POS licensing backend. This is **LC-9** in the Elmo POS licensing roadmap.

This is a separate repository/application from the Flutter POS app
(`elmotech_pos`). Dashboard UI and server code live here; backend-owned
licensing migrations, database tests, and Edge Functions live in the POS repo.

## Purpose

The licensing backend (Supabase) is already live — initial Production
activation is operational. This dashboard is the internal tool for staff to
manage customers, plans, subscriptions, and the offline activation workflow,
while keeping technical license, device, issuance, and audit records available
contextually without exposing the database as the product interface.

## Architecture

Next.js App Router project, TypeScript in strict mode, Tailwind CSS.

```
src/
  app/
    layout.tsx             root layout (html/body, fonts, global styles)
    page.tsx                redirects "/" -> "/dashboard"
    global-error.tsx        catches fail-closed config errors (see below)
    login/page.tsx           /login — outside the dashboard shell, no sidebar
    (dashboard)/            route group: everything behind the sidebar shell
      layout.tsx             enforces identity + database-backed admin RBAC
                             before rendering the dashboard shell
      loading.tsx / error.tsx    shared loading & error states for the group
      dashboard/             Overview
      customers/, plans/, subscriptions/, licenses/,
      activation-requests/, devices/, issuances/, audit-logs/,
      settings/             Administration
  components/
    auth/                   LoginForm, AuthNotConfigured
    layout/                 Sidebar, Header, DashboardShell, EnvironmentBadge
    ui/                     PageHeader, PageSection, StatusBadge, EmptyState,
                            StatCard, DataTable, ModulePlaceholder,
                            TableSkeleton, FilterBar, EntityLink, DetailDrawer
  features/                 reserved for module-specific components/hooks
                            once a module moves past its placeholder page
  lib/                      browser-safe shared code
    env.ts                  browser-safe Supabase URL/key lookup
    navigation.ts            six-item operator navigation shared by desktop
                            and mobile; technical routes stay contextual
    redirect-target.ts       sanitizeRedirectTarget() — the only place a
                            post-login redirect target is trusted from
    supabase/client.ts       browser Supabase client (publishable key only)
  server/                   server-only code, never bundled for the browser
    env.ts                  getServerEnvironment() — authoritative,
                            fail-closed environment/project-ref validation
    supabase/
      server.ts              server Supabase client (cookie-based session)
      privileged-client.ts   server-only, Staging-only licensing client
    auth/
      current-user.ts        getCurrentUser() — identity lookup
      require-user.ts        requireUser() — the dashboard's auth gate
      require-admin-access.ts  real fail-closed licensing.admin_users RBAC
      actions.ts              signInAction / signOutAction (Server Actions)
  types/                    shared TypeScript types
    environment.ts           AppEnvironment
    navigation.ts             NavItem, NavSection
    rbac.ts                   Role, labels, admin context, authorization result
    database.ts               typed dashboard read surface for licensing
  proxy.ts                   session-cookie refresh + pathname forwarding
                             only (Next.js 16 proxy/middleware convention)
docs/
  AUTH_ARCHITECTURE.md       identity vs. authorization, login/logout flow,
                             proxy responsibility, RBAC contract
  ENVIRONMENT_SECURITY.md    environment fail-closed rules, licensing
                             data-access boundary
```

Arabic is the default locale. The language preference is stored in the
server-readable `elmo_admin_locale` cookie so the root document renders the
correct `lang` and `dir` before hydration; English remains available from the
header without locale-prefixed routes.

The `lib/` vs `server/` split is deliberate and enforces the security
boundary below: anything importable from a Client Component lives in
`lib/`; anything that must never reach the browser lives in `server/` and
imports the `server-only` package so an accidental client import fails at
build time.

## Environment model

There are **two separate Supabase projects**. This dashboard connects to
exactly one at a time, chosen by environment configuration — never
hardcoded.

| Environment | Project | Ref |
|---|---|---|
| Staging | `elmotech-pos-licensing-staging` | `sweezvyqlmerlcxjkair` |
| Production | `elmotech-pos-licensing-prod` | `lhfvlczfqltvwydfaeod` |

- **`APP_ENV`** (server-only, no `NEXT_PUBLIC_` prefix) is the single,
  authoritative source of environment identity, resolved by
  `src/server/env.ts` and passed down through the server-rendered layout
  as a prop — never re-derived in the browser. It defaults to `staging`
  when unset.
- `getServerEnvironment()` validates `APP_ENV` against the configured
  `NEXT_PUBLIC_SUPABASE_URL`'s project ref and **fails closed** (throws)
  on any mismatch, and also fails closed if `APP_ENV=production` is set
  while `NODE_ENV` is not `production` (blocking `next dev` from ever
  targeting Production). Full rules and examples:
  [`docs/ENVIRONMENT_SECURITY.md`](docs/ENVIRONMENT_SECURITY.md).
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

Only publishable/browser-safe configuration may be prefixed
`NEXT_PUBLIC_*`. The privileged licensing client in
`src/server/supabase/privileged-client.ts` reads `SUPABASE_SECRET_KEY` only on
the server, is stateless, and targets the validated Staging project only. It
must continue to:

- live under `src/server/`, guarded by the `server-only` package
- never be reachable from a Client Component, a `NEXT_PUBLIC_*` variable,
  or a Server Action that a browser can call without a server-side
  authorization check passing first

No signing private key has been requested, retrieved, or inspected as part
of this or the prior task.

### Licensing data-access boundary

`anon` and `authenticated` Supabase roles have **no access** to the
licensing tables (`customers`, `plans`, `subscriptions`, `licenses`,
`activation_requests`, `device_activations`, `license_issuances`,
`audit_logs`) — RLS and FORCE RLS are enabled with no permissive
browser-facing policies, and nothing in this repository adds, loosens, or
works around that. The implemented Overview data path is:

```
Browser -> authenticated session -> Next.js server -> server-side
authorization -> server-only privileged data access -> licensing schema
```

not a direct authenticated-client query against those tables. Details:
[`docs/ENVIRONMENT_SECURITY.md`](docs/ENVIRONMENT_SECURITY.md).

## Authentication & authorization

Authentication and database-backed authorization are implemented. Supabase
Auth verifies identity with `getClaims()`, then `requireAdminAccess()` reads the
matching `licensing.admin_users` row through the privileged server client. Only
active `owner`, `admin`, `support`, and `viewer` rows are admitted. Full design:
[`docs/AUTH_ARCHITECTURE.md`](docs/AUTH_ARCHITECTURE.md).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in both Staging key placeholders locally
npm run dev
```

```bash
npm run lint
npm run build
npx tsc --noEmit
```

The app builds and lints without real Supabase credentials. Runtime Auth needs
the Staging publishable key, and authorized licensing reads additionally need
the Staging server secret (see `docs/ENVIRONMENT_SECURITY.md`).

## Currently supported licensing capabilities

Reflects what the backend (already live) supports today:

- Customers, Plans, Subscriptions, Licenses
- Activation Requests, Device Activations
- Initial (revision-1) License Issuances
- Audit Logs
- Offline initial activation
- Plan creation/editing, customer creation, and subscription assignment
- Atomic initial draft-license provisioning with one-time License Code display
- Safe generation of a new License Code for a strictly unused license
- Arabic/RTL default with English/LTR support

## Explicitly not supported yet

Do not build UI that implies these exist — they belong to later licensing
work (LC-8C and beyond):

- Renewal / revision 2+ issuance
- Device replacement workflow
- Revocation workflow
- Full key rotation workflow

## Current phase

All core modules are connected to live Staging data: Overview,
Customers and Customer 360, Subscriptions, Licenses and License 360, Devices,
Activation Requests, Issuances, Audit Logs, and Plans. The primary navigation is
limited to Overview, Customers, Activation Requests, Subscriptions, Plans, and
Settings. Lists use server-side filters and pagination with batched relationship
lookups.

Commercial onboarding is implemented and accepted on Staging: authorized
Owner/Admin operators can create/edit plans, create customers, assign a plan,
and atomically provision the subscription plus initial draft license. The
plaintext License Code is generated server-side, displayed once through
transient action state, and copied on demand; only its SHA-256 hash is sent to
and stored by PostgreSQL. A lost code can be replaced only while the license is
strictly unused. This does not implement device replacement.

The initial offline activation workflow is implemented through authorized
Next.js route handlers. The server validates and forwards the exact `.elmoreq`
bytes to the Staging `verify-activation-request` function, then invokes
`issue-initial-license` with the verified request ID and returns the exact
`.elmolic` response for download. A real Staging onboarding and activation E2E
passed through Dashboard verification/issuance and successful POS import.
Viewer accounts cannot run these operations.

Production was not migrated or modified for this Dashboard batch, and
Production Dashboard acceptance has not been performed. Renewal/revision 2+,
device replacement, revocation operations, full signing-key rotation, and
admin-user management remain later work.
