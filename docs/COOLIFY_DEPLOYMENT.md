# Coolify VPS deployment

This setup uses **two Coolify Git-based Docker Compose resources**, matching the
separate Next.js and Laravel repositories. Each resource builds from its own
repository root; neither depends on a sibling directory existing on the VPS.
The frontend calls the Laravel domain over HTTPS. Supabase remains disabled.

## 1. Publish the source

The frontend repository already has an origin at
`https://github.com/Elmo-Tech/elmotech_pos_admin_dashboard.git`. Select the branch
containing these deployment files in Coolify. The local Laravel repository has
no Git remote configured yet; publish its source to your chosen private repository
before creating the backend resource. No commit, push or remote deployment was
performed by this setup task.

## 2. Laravel + MySQL resource first

Use the Laravel repository, Docker Compose build pack, Base Directory `/`,
Compose path `/docker-compose.yaml`.

Services: **app** (PHP8.5-FPM), **web** (Nginx HTTP8080), **mysql** (MySQL8.4).
Only assign a public HTTPS domain to **web**, selecting container port **8080**.
For example, if Coolify asks for the port in the domain field, enter
`https://api.example.com:8080`; the public API still uses HTTPS443. Do not assign
a domain or publish a host port for app/FPM or MySQL.

Add backend runtime variables from `docker/coolify.env.example`:

| Variable | Value |
|---|---|
| APP_URL | Public Laravel origin, e.g. https://api.example.com |
| APP_KEY | Stable base64-encoded 32-byte Laravel key, including base64: prefix |
| DB_DATABASE | dashboard, or a dedicated database name |
| DB_USERNAME | dashboard, or a dedicated non-root user |
| DB_PASSWORD | Long random application password |
| MYSQL_ROOT_PASSWORD | Different long random root password |

Generate APP_KEY once, then store it as a Coolify secret. For example, on a
machine with Docker:

```sh
docker run --rm php:8.5-cli-bookworm php -r 'echo "base64:".base64_encode(random_bytes(32)).PHP_EOL;'
```

Keep the same key across redeployments. No local .env, MySQL data directory,
CSV export, credentials, or test accounts are copied into either image.

After the first backend deployment, open the **app** service terminal and run:

```sh
php artisan migrate --force --no-interaction
php artisan dashboard:user owner@your-domain.com --role=owner
```

Save the generated password privately. The local owner account is not deployed
or automatically seeded. Migrations and staff provisioning are deliberate
operator steps, not automatic image-build/startup side effects. Repeat the
migration command for subsequent releases that contain migrations, after backup.

Verify the API health URL `/up`, then authenticate against `/api/v1/auth/login`.
The health endpoint checks Laravel boot; the separate MySQL health check verifies
SQL connectivity. Neither replaces the required migrations and owner setup.

## 3. Next.js resource

Use the frontend repository, Docker Compose build pack, Base Directory `/`,
Compose path `/docker-compose.yaml`.

Assign an HTTPS domain to service **dashboard**, container port **3000**. Set:

```dotenv
LARAVEL_API_URL=https://api.example.com/api/v1
```

This variable is server-only and supplied at runtime. Do not use localhost,
`http://app`, a Supabase URL or a frontend NEXT_PUBLIC_ variable here. The two
resources use independent Compose networks; Laravel is reached through its
public HTTPS domain, preserving the existing transport's TLS requirement.

The image uses Node24, npm ci, HUSKY=0, and Next's standalone output. Only traced
runtime dependencies, static assets and public files are copied into the runner.
The production container runs as the existing unprivileged node user. The image
build explicitly uses **Webpack**, matching the compiler already verified by
this project's acceptance checks; the existing npm build script and CI's default
build command are unchanged.

No Docker host ports are published. Coolify's reverse proxy handles public TLS
and routes to the selected container ports. Compose health checks travel with the
resource. Frontend `/login` health is an unauthenticated rendering check, not a
Laravel login or a full backend availability test.

## Persistence and operations

- Backend `mysql-data` stores `/var/lib/mysql`; `laravel-storage` stores sessions,
  file cache, views and application storage. Keep these volumes across redeploys.
- Take consistent MySQL backups and test restore before database changes. Deleting
  volumes or using `docker compose down -v` removes persisted data.
- Initial MySQL username/password variables initialize a new volume only. Changing
  Coolify variables alone does not rotate an existing MySQL user's password.
- app and web run without added Linux capabilities; MySQL uses its standard image
  initialization permissions. The database joins an internal network only.
- PHP logs go to stderr; Nginx logs go to stdout/stderr for Coolify collection.
- `php artisan sanctum:prune-expired --hours=24` may be scheduled on the app service
  for expired-token cleanup. There is no queue worker requirement in this phase.
- The application key, database credentials and any future POS signing key must
  be runtime secrets, never build arguments or committed files.

For a manual VPS deployment outside Coolify, create a private .env.coolify from
its repository's environment example and explicitly pass it, avoiding accidental
use of the local development .env:

```sh
docker compose --env-file .env.coolify config --quiet
docker compose --env-file .env.coolify build --pull
docker compose --env-file .env.coolify up -d
```

For backend first-run provisioning, then run:

```sh
docker compose --env-file .env.coolify exec app php artisan migrate --force --no-interaction
docker compose --env-file .env.coolify exec app php artisan dashboard:user owner@your-domain.com --role=owner
```

## Scope and verification

This initializes deployment configuration; it does not deploy the VPS or modify
Coolify resources. The backend source still needs a remote Git repository.
Docker is unavailable on the current machine, so container builds, actual Compose
startup, Nginx/PHP-FPM interoperability and VPS ingress are **not verified here**.
See [local verification](deployment/VERIFICATION.md) for checks that actually ran.

New POS activation verification/signing and renewal remain unavailable until the
verified implementation and key configuration are supplied. Containerizing the
app does not resolve that existing functional blocker.

## Sources

- [Coolify Git-based Docker Compose](https://coolify.io/docs/applications/builds/docker-compose)
- [Coolify domains and container ports](https://coolify.io/docs/applications/configuration/general)
- [Laravel production deployment](https://laravel.com/docs/13.x/deployment)
- Next's installed `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/output.md`
- [PHP8.5 OPcache is built in](https://www.php.net/opcache.installation)
