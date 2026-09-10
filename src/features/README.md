# Feature modules

This directory holds feature-specific code (components, hooks, and
client-side data logic) once a licensing module — Customers, Plans,
Subscriptions, Licenses, Activation Requests, Devices, Issuances, Audit
Logs — moves beyond its current placeholder page in `src/app`.

Each module gets its own subdirectory here, e.g. `features/customers/`,
keeping module-specific UI and data-fetching logic out of shared
`src/components/` and out of route files. Nothing is implemented here yet
in this architecture/scaffold phase.
