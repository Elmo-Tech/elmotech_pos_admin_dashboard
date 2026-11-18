# Deployment configuration verification — 18 November 2026

| Check | Result | Evidence |
|---|---|---|
| Frontend and backend Compose YAML | PASS | Parsed with yaml; validated against the official Compose specification using isolated Ajv8 / JSON Schema2020-12 |
| Private ports, MySQL network and storage | PASS | No published host ports; MySQL internal network; dedicated database/storage volumes; root credentials absent from app environment |
| Backend entrypoint shell syntax | PASS | sh -n |
| Entrypoint key validation and fail-fast startup | PASS | Isolated shell harness with real PHP key checks; invalid/missing keys rejected; config failure prevents command execution; no automatic database migration |
| Frontend lint / typecheck | PASS | lint.log and typecheck.log |
| Frontend regression tests | PASS | 67 Node tests; tests.log |
| Production build with standalone output | PASS | Webpack; build-webpack.log |
| Standalone runtime layout | PASS | Temporary artifact copy without env files; /login200, CSS/font200, protected /plans redirect through proxy |
| Full route/proxy manifests | PASS | Identical to retained baseline; route-check.json |
| Docker Compose CLI validation | BLOCKED | Docker CLI is a dangling symlink to missing /Applications/Docker.app; no usable Docker executable/socket |
| Docker image builds / actual container startup | BLOCKED | No Docker runtime; PHP extensions/build steps, Linux user permissions, Nginx/FPM communication and MySQL volume initialization not executed |
| Coolify VPS deployment, TLS/ingress and production login | NOT RUN | No remote deployment requested/performed; backend still has no Git remote |

Source artifacts: compose-validation.json, entrypoint-checks.json and
standalone-smoke.json. The runtime smoke test used the same standalone/static
layout as the Docker runner, not a Linux container. The startup harness stubbed
Artisan cache commands and did not touch the existing database or application
cache. The PHP Docker base's supported tags/extensions and PHP8.5 OPcache behavior
were checked against official image/PHP documentation.

The temporary standalone listener on4330 was stopped and removed. Existing
frontend4320 and Laravel8000 remain stopped. MySQL3407 was not changed. No image
was pushed, no local data exported/imported, and no production accounts created.
No package versions, lockfile content, auth/session logic or Supabase-disabled
policy changed in this deployment setup.

The default Turbopack build was not rerun; its previously documented development
environment blocker is not counted as passing. The Dockerfile deliberately uses
the separately verified Webpack build. New POS signing and renewal remain the
existing functional blocker regardless of container deployment.
