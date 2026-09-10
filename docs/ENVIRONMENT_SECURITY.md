# Environment & Data-Access Security

## Environment identity

`APP_ENV` is the server-owned environment identity. `src/server/env.ts`
validates it against the project ref in `NEXT_PUBLIC_SUPABASE_URL` and throws on
unknown or mismatched projects. The shell receives that validated value and
keeps the environment badge visible.

This implementation batch enables privileged licensing reads for Staging only:

- project: `elmotech-pos-licensing-staging`
- ref: `sweezvyqlmerlcxjkair`
- URL: `https://sweezvyqlmerlcxjkair.supabase.co`

`getRequiredStagingSupabaseUrl()` refuses to create the privileged data path for
any other declared environment or project ref.

## Local configuration

Real values belong only in untracked `.env.local`:

```dotenv
APP_ENV=staging
NEXT_PUBLIC_SUPABASE_URL=https://sweezvyqlmerlcxjkair.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<staging-publishable-key>
SUPABASE_SECRET_KEY=<staging-server-secret-key>
```

The publishable key is used by browser and cookie-based Auth clients. The server
secret has no `NEXT_PUBLIC_` prefix and is read only by
`src/server/supabase/privileged-client.ts`.

## Licensing data boundary

```text
Browser session
  -> verified JWT claims on the Next.js server
    -> licensing.admin_users authorization
      -> server-only privileged Staging client
        -> licensing schema reads
```

The privileged client is a stateless `@supabase/supabase-js` client scoped to
the `licensing` schema. It disables session persistence, URL session detection,
and token refresh, and it has no cookie adapter. The secret is never passed
through props or logged.

`anon` and `authenticated` retain no direct licensing-table access. Browser code
continues to use the publishable key only; all Overview queries run in the
server-only feature data layer after authorization.

## Runtime states

- Missing public Auth configuration: `/login` shows the existing controlled
  not-configured state.
- Missing server secret: authenticated dashboard access fails closed.
- Invalid admin row or disabled status: the dashboard shows the generic access
  denied screen.
- Overview query failure: the page shows a controlled operational error instead
  of fake zeroes.
