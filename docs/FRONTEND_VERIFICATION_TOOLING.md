# Frontend verification tooling

Validated locally on 18 November 2026 with Node 24.21.0 and npm 11.19.0. Next supports Node >=20.9 and the locked Supabase SDK requires >=22. CI uses Node 24, which also supports lint-staged 17.6.1. Existing prepare logic was absent.

## Changes

- `package.json` and `package-lock.json` add Husky 9.1.7 and lint-staged 17.6.1 as dev dependencies.
- `prepare` runs `.husky/install.mjs`. It skips CI, HUSKY=0, production and installations without Husky or a Git checkout. Other installation errors surface.
- `.husky/pre-commit` runs lint-staged with `--fail-on-changes`. Its ESLint command has no fix flag. It handles staged filenames, including spaces, and fails on task changes. Full tests/builds run in CI.
- `npm run typecheck` generates Next route types before standalone TypeScript checks. `npm test` runs all existing Node tests, including FSD boundaries.
- `.github/workflows/frontend-ci.yml` runs on PRs. Push jobs compare the branch with `github.event.repository.default_branch`. This uses GitHub's actual default branch dynamically. Cached origin/HEAD says master, while live metadata access currently returns Repository not found.
- `.github/workflows/dependency-audit.yml` runs for package manifest/lockfile PR changes and manual dispatch. PRs probe the Dependency Review API. HTTP 200 enables the official Dependency Review action with high severity threshold. HTTP 403/404 selects npm audit. Other availability errors fail visibly. Manual dispatch runs npm audit.

Both workflows use contents-read permissions. Frontend CI disables hooks with HUSKY=0, caches npm against package-lock.json and cancels superseded PR runs. It references no Supabase secrets. The default production build has its own named job.

The deliberate src/fsd/pages layout is validated by the existing FSD boundary test in npm test.

## Local results

| Check | Result | Evidence |
| --- | --- | --- |
| Full CI `HUSKY=0 npm ci` | PASS, 379 packages installed, hooksPath absent afterward | tooling-verification/install-full.log |
| Production `npm ci --omit=dev` | PASS, Husky absent, hooksPath absent | tooling-verification/install-production.log |
| Hook with clean staged TypeScript filename containing spaces | PASS, exit 0, isolated index hash preserved | tooling-verification/hook-pass.log |
| Hook with unused any-typed variable | PASS rejection, exit 1 | tooling-verification/hook-fail.log |
| ESLint | PASS | tooling-verification/lint.log |
| Typecheck including fresh Next type generation | PASS | tooling-verification/typecheck.log |
| Node tests | PASS, 50 tests | tooling-verification/tests.log |
| Default Next production build | PASS | tooling-verification/build.log |
| Workflow YAML parse and permissions/event structure | PASS using js-yaml and inspected GitHub expressions | Both workflow files |
| Dependency audit | FAIL, 14 high, 1 critical, 6 moderate | tooling-verification/audit.json |
| GitHub execution and Dependency Review eligibility | BLOCKED, repository metadata access returns 404 | No workflow was pushed or dispatched |

The audit includes direct and transitive advisories, including Next.js and tooling dependencies. No remediation was applied. Findings remain visible and will fail the audit fallback at the requested threshold.

All hook tests used a temporary Git repository. The user's staging index was untouched. Developer hook activation is performed through the guarded prepare installer after installing locked tooling.

## Proposed required check names

- `Lint, typecheck and tests`
- `Next.js production build`

`Dependency security check` runs only for dependency PR changes/manual runs. Making this path-filtered check required for every PR can leave other PRs waiting for a check that never starts. Select its requirement policy separately when managing branch protection.

No checks ran on GitHub during this task. Local access could not resolve the private remote through gh or git, so availability of GitHub Dependency Review will be determined by the workflow's runtime probe. Branch protection and deployment settings were not changed.

References used for configuration are [Husky CI/production install guidance](https://typicode.github.io/husky/how-to.html) and [GitHub Dependency Review availability](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review).
