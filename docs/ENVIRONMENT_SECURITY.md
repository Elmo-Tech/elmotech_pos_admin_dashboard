> Historical Supabase design. The current runtime is Laravel-only; Supabase connections are disabled. See [current verification](LARAVEL_CONNECTION_VERIFICATION.md).

# Environment & Data-Access Security

## Environment identity

`APP_ENV` is the server-owned environment identity. `src/shared/config/server.ts`
validates it against the project ref in `NEXT_PUBLIC_SUPABASE_URL` and throws on
unknown or mismatched projects. The shell receives that validated value and
keeps the environment badge visible.

Privileged licensing reads are enabled for exactly one validated project at a
time:

| `APP_ENV` | Required `NODE_ENV` | Required project ref |
|---|---|---|
| `staging` | development or production | `sweezvyqlmerlcxjkair` |
| `production` | production | `lhfvlczfqltvwydfaeod` |

`getRequiredSupabaseUrl()` refuses to create the privileged data path when the
URL is missing or its project ref does not exactly match `APP_ENV`. Production
cannot fall back to Staging, Staging cannot fall back to Production, and
`APP_ENV=production` is rejected unless `NODE_ENV=production`.

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
`src/shared/api/supabase/privileged-client.ts`.

Production deployment configuration uses the same variable names with
`APP_ENV=production`, the Production URL, and separately managed Production
publishable/server credentials. Production runs only through `npm run build`
followed by `npm run start`; local `npm run dev` remains Staging-only.

Final Production acceptance used this configuration in a local production-mode
Next.js process and resolved project ref `lhfvlczfqltvwydfaeod`. The active
Owner authorization, server-only licensing read path, and authenticated Edge
Function connectivity passed. This verifies supported Production operation but
does not claim public/cloud hosting or a deployed Production domain; permanent
hosting and domain deployment remain a separate operational follow-up.

## Licensing data boundary

```text
Browser session
  -> verified JWT claims on the Next.js server
    -> licensing.admin_users authorization
      -> server-only privileged client for the validated environment
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
