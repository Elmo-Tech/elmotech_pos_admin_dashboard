> Historical Supabase design. The current runtime is Laravel-only; Supabase connections are disabled. See [current verification](LARAVEL_CONNECTION_VERIFICATION.md).

# Authentication & Authorization Architecture

The dashboard separates identity from authorization and enforces both on the
server.

## Identity

- `/login` uses Supabase email/password Auth through a Server Action.
- `getCurrentUser()` verifies the current JWT with `auth.getClaims()`; it does
  not trust cookie presence or `getSession()` data for identity.
- `src/proxy.ts` only refreshes session cookies and forwards the requested path.
  It does not make authorization decisions.
- Unauthenticated dashboard requests are redirected server-side to `/login`
  with a sanitized, same-origin `next` path.

## Database-backed admin authorization

`requireAdminAccess()` is the authoritative application gate. For each request
it:

1. verifies identity through `getCurrentUser()`;
2. extracts the verified `sub` claim;
3. uses the server-only privileged client for the validated environment;
4. selects `role,status` from `licensing.admin_users` where `user_id = sub`;
5. authorizes only an `active` row whose role is `owner`, `admin`, `support`, or
   `viewer`.

A missing row, disabled row, unknown role, query failure, configuration failure,
or missing identity all fail closed. Authorization never uses email,
`user_metadata`, or the fact that a user is merely authenticated.

The successful result is a typed server-side context containing `userId`,
`email`, and `role`. React request memoization avoids repeating the identity and
role lookup when the dashboard layout and a server data loader both enforce the
boundary during one render.

## Route and data enforcement

`src/app/(dashboard)/layout.tsx` requires the authorization result before it
renders the dashboard shell. Unauthenticated users go to `/login`; authenticated
users who cannot be authorized receive the same controlled access-denied screen,
without revealing whether an authorization row exists.

The Overview data loader also calls `requireAdminAccess()` before constructing a
privileged client. This keeps the loader safe if it is later reused outside the
current layout. Future Server Actions and licensing data loaders must apply the
same server-side rule rather than relying on hidden UI.

The offline activation route handlers apply the same gate again and additionally
reject the read-only `viewer` role. Only active `owner`, `admin`, or `support`
operators can verify an uploaded `.elmoreq` or issue/download its `.elmolic`.
These handlers also require a same-origin browser request and never expose the
privileged credential to client code.

## Non-negotiable rules

- Never use `user_metadata` for authorization; users can edit it.
- Never treat `authenticated` as an admin role.
- Never expose the server secret through `NEXT_PUBLIC_*`, props, cookies, or
  logs.
- Browser clients use only the publishable key and never query `licensing`.
- Every licensing data path must remain server-only and authorization-gated.
