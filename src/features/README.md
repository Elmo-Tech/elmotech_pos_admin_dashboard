# Features

Each slice owns an operator interaction: manage-plan, create-customer,
provision-subscription, rotate-license-code, sign-in, sign-out, activate-license,
and renew-subscription. Screen compositions and page-local reads belong in
`src/fsd/pages`; the dashboard shell belongs in `src/widgets`.

Use the slice's `index.ts` for client UI and its `server.ts` where a separate
server API is needed. Server Action implementations own `"use server"`; action
public APIs re-export those references without repeating that directive.
Privileged clients and query/Edge adapters must remain server-only and retain
all existing entry-point authorization.

See `docs/FRONTEND_FSD_MIGRATION.md` for the complete route/ownership map,
structure-only FSD CLI commands and validation limits.
