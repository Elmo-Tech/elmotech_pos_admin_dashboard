# Supabase deprecation

Supabase is deprecated in the dashboard. Laravel is the default backend when
DATA_PROVIDER is absent, empty, or `laravel`. There is no automatic fallback to
Supabase if Laravel is unavailable. Invalid provider names fail closed.

Use `DATA_PROVIDER=laravel` and the server-only `LARAVEL_API_URL`; see
[the integration report](laravel-integration/REPORT.md) and the backend README
for local setup. No Supabase credentials are needed for this configuration.

The existing Supabase implementation is retained solely for an explicit legacy
opt-in (`DATA_PROVIDER=supabase`). Its project allowlist, environment validation,
verified identity, active-role authorization and server-only secret boundary
remain enforced. This opt-in is not selected implicitly by missing Laravel
configuration or by old Supabase environment variables.

## Remaining compatibility code

- `src/shared/api/supabase/server.ts` and `client.ts`: deprecated auth clients,
  marked with JSDoc annotations.
- `src/shared/api/supabase/privileged-client.ts`: existing compatibility entry
  point used by page loaders; dispatches to Laravel by default. Only its legacy
  branch constructs a Supabase data client.
- `src/shared/api/supabase/schema.ts`: legacy contract types used by the narrow
  Laravel read/RPC adapter. Retained until those callers use provider-neutral
  types directly.
- `src/shared/config/public.ts` and the Supabase project validation in
  `server.ts`: legacy-only configuration.
- Supabase npm packages remain because legacy clients and the current adapter's
  compatibility types / function-error handling still import them. Removing
  packages before those imports are replaced would break the application.

Do not add new Supabase queries, auth integrations, RPCs or Edge Functions to
this frontend. New backend work belongs to Laravel. No Supabase files, projects,
remote data, or credentials were deleted by this change. Existing local services
remain stopped; this change does not restart them.

Laravel's new activation verification, new issuance and renewal are still
unavailable pending the verified POS protocol/signing implementation. Deprecation
does not remove that limitation or establish production migration readiness.

Historical architecture/audit reports describe their original verification
state. Use this document for the current provider policy. Legacy regression
fixtures explicitly select Supabase; default-provider tests separately verify
Laravel selection, no silent fallback, proxy behavior and configuration guards.

## Verification

Lint, typecheck, all 61 Node tests and the Webpack production build passed after
this change. The complete route manifests remain unchanged. See
`docs/laravel-integration/supabase-deprecation-checks.json` for the recorded
results. The previously documented default Turbopack environment blocker has
not been reclassified as a pass. No application server was started for these
checks.
