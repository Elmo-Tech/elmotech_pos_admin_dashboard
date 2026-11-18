# Supabase disabled: Laravel-only runtime

Laravel is now the **only** runtime backend. DATA_PROVIDER may be absent, empty,
or `laravel`. `DATA_PROVIDER=supabase` and unknown values fail closed. There is
no legacy opt-in and no fallback to Supabase when Laravel is unavailable.

This supersedes the earlier deprecation-only phase, which still allowed an
explicit legacy selection. See [connection verification](LARAVEL_CONNECTION_VERIFICATION.md)
for the complete page/API map and measured network evidence.

## Enforced boundaries

- Login/logout and current identity use Laravel. Active status and role come
  from Laravel's verified `auth/me` response; backend HTTP endpoints independently
  enforce token validity and RBAC.
- Proxy only forwards the pathname. It never refreshes or reads Supabase sessions.
- Historical Supabase SSR/browser/config entry points throw before creating
  clients or reading credentials, even if old Supabase environment variables exist.
- The compatibility-named `getPrivilegedLicensingClient()` always returns the
  Laravel transport. Page loaders and commercial actions cannot select Supabase.
- No application source imports a Supabase network-client factory. Tests enforce
  this boundary. Supabase contract types and the inert FunctionsHttpError class
  remain for the existing fluent adapter's compatibility; they create no clients.
- Laravel HTTP transport rejects known Supabase service domains before fetching
  and uses `redirect: error`, so it cannot follow a backend redirect to Supabase.

Use server-side LARAVEL_API_URL for your authorized Laravel installation. No
Supabase key is needed. Existing Supabase remote projects, data and credentials
were not modified or deleted. Retained filenames/types do not indicate a network
connection. Dependency removal and provider-neutral type cleanup can be reviewed
separately; the frontend lockfile is unchanged.

The original architecture/source-preservation test now records the deliberate
retirement of Supabase project-selection helpers and fingerprints the disabled
legacy entry points. New tests replace obsolete live-Supabase authentication
expectations with the Laravel identity and disabled-client contracts.

New POS activation verification/signing and renewal remain unavailable until the
verified protocol/signing implementation is provided. A Laravel connection is
not a claim that those cryptographic workflows are implemented.
