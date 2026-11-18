# Audit and deployment exposure review

18 November 2026. Commit 399eafb. The patched lockfile SHA-256 is `4de890a4c0867ad7420887d286dfb8c103eb178adb4a67e40c0114af758faf90`. The high-severity CI threshold is preserved.

| Item | Status | Evidence |
| --- | --- | --- |
| Full npm audit | FAIL | audit-full.json, 10 High / 6 Moderate affected packages, exit 1 |
| Full audit with existing high threshold | FAIL | audit-high-threshold.txt, exit 1 |
| npm audit --omit=dev --json | PASS | audit-omit-dev.json, zero advisories, exit 0 |
| Actual deployment install/artifact exposure | BLOCKED | No deployment configuration in repository, hosting metadata unavailable |
| GitHub PR / Actions verification | BLOCKED | gh pr view returns GraphQL repository-not-found |
| Authenticated staging acceptance | BLOCKED | No authorized role accounts or disposable activation/renewal fixtures supplied |

## Deployment evidence

The checked-in Frontend CI runs `npm ci` followed by lint/typecheck/tests in one job and `npm ci` followed by `npm run build` in another. These commands install devDependencies. They describe CI execution. The workflow contains no deployment, pruning, artifact copy, container stage or runtime installation command.

The manifest specifies `next build` and `next start`. README and ENVIRONMENT_SECURITY describe a locally started production-mode process and explicitly leave permanent hosting as follow-up. No Dockerfile, compose file, Vercel configuration, Coolify configuration or deployment workflow was found. Next configuration is empty and does not specify standalone output.

A connected hosting project lookup was attempted for the repository URL. The Vercel connection returned HTTP 403 due to missing team access. Its association with this application could not be established. GitHub metadata remains inaccessible. Therefore actual deployment dependency contents and install/build commands remain unverified.

All remaining audited copies have the lockfile dev flag and disappear from npm’s omit-dev audit graph. A production artifact may still contain devDependencies if it ships an unpruned full install. No remaining package is classified as build-only for the actual deployment. The clean omit-dev result does not establish the contents of a deployed artifact.

## Remaining advisory paths

GHSA-fc5q-39xc-vjpf affects picomatch. Its official record has no patched release. GHSA-g3hv-75wg-m249 affects minimatch 10.2.6, with the recorded patch at 11.0.1 outside the parent range. Inherited parent findings are expanded below.

| Package | Version | Severity | Advisory ID(s) | Dependency path |
| --- | --- | --- | --- | --- |
| @next/eslint-plugin-next | 16.4.5 | high | GHSA-fc5q-39xc-vjpf | root -> eslint-config-next -> @next/eslint-plugin-next |
| @typescript-eslint/eslint-plugin | 8.70.0 | moderate | GHSA-fc5q-39xc-vjpf, GHSA-g3hv-75wg-m249 | root -> eslint-config-next -> typescript-eslint -> @typescript-eslint/eslint-plugin |
| @typescript-eslint/parser | 8.70.0 | moderate | GHSA-fc5q-39xc-vjpf, GHSA-g3hv-75wg-m249 | root -> eslint-config-next -> typescript-eslint -> @typescript-eslint/parser |
| @typescript-eslint/type-utils | 8.70.0 | moderate | GHSA-fc5q-39xc-vjpf, GHSA-g3hv-75wg-m249 | root -> eslint-config-next -> typescript-eslint -> @typescript-eslint/eslint-plugin -> @typescript-eslint/type-utils |
| @typescript-eslint/typescript-estree | 8.70.0 | high | GHSA-fc5q-39xc-vjpf, GHSA-g3hv-75wg-m249 | root -> eslint-config-next -> typescript-eslint -> @typescript-eslint/typescript-estree |
| @typescript-eslint/utils | 8.70.0 | moderate | GHSA-fc5q-39xc-vjpf, GHSA-g3hv-75wg-m249 | root -> eslint-config-next -> typescript-eslint -> @typescript-eslint/utils |
| eslint-config-next | 16.4.5 | high | GHSA-fc5q-39xc-vjpf | root -> eslint-config-next |
| eslint-import-resolver-typescript | 3.10.1 | high | GHSA-fc5q-39xc-vjpf | root -> eslint-config-next -> eslint-import-resolver-typescript |
| fast-glob | 3.3.1 | high | GHSA-fc5q-39xc-vjpf | root -> eslint-config-next -> @next/eslint-plugin-next -> fast-glob |
| fdir | 6.5.0 | high | GHSA-fc5q-39xc-vjpf | root -> eslint-config-next -> eslint-import-resolver-typescript -> tinyglobby -> fdir |
| lint-staged | 17.6.1 | high | GHSA-fc5q-39xc-vjpf | root -> lint-staged |
| micromatch | 4.0.8 | high | GHSA-fc5q-39xc-vjpf | root -> eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch |
| minimatch | 10.2.6 | moderate | GHSA-g3hv-75wg-m249 | root -> eslint-config-next -> typescript-eslint -> @typescript-eslint/typescript-estree -> minimatch |
| picomatch | 4.0.7 | high | GHSA-fc5q-39xc-vjpf | root -> lint-staged -> picomatch |
| picomatch | 2.3.2 | high | GHSA-fc5q-39xc-vjpf | root -> eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> picomatch |
| picomatch | 4.0.7 | high | GHSA-fc5q-39xc-vjpf | root -> eslint-config-next -> eslint-import-resolver-typescript -> tinyglobby -> picomatch |
| tinyglobby | 0.2.17 | high | GHSA-fc5q-39xc-vjpf | root -> eslint-config-next -> eslint-import-resolver-typescript -> tinyglobby |
| typescript-eslint | 8.70.0 | moderate | GHSA-fc5q-39xc-vjpf, GHSA-g3hv-75wg-m249 | root -> eslint-config-next -> typescript-eslint |

No patch or threshold change was made during this review. Authenticated acceptance remains pending secure fixture access to the same staging backend for baseline and migrated builds. GitHub run links remain unavailable until repository access is restored. Laravel and MySQL are deferred.
