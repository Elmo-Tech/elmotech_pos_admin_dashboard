# Frontend dependency remediation

18 November 2026. Reviewed the supplied `docs/tooling-verification/audit.json` against the modified working-tree lockfile. Existing Husky/CI changes were preserved. Full copy-level dependency paths, advisory IDs, installed/replacement versions, affected ranges, scope and official patched versions are in [the inventory](dependency-remediation/INVENTORY.md) and [structured records](dependency-remediation/finding-inventory.json). Lockfile before/after digests are retained in `dependency-remediation/lock-hashes.json`.

## Applied changes

| Dependency | Previous | Selected | Reason |
| --- | --- | --- | --- |
| next and matching eslint-config-next | 16.3.4 | 16.4.5 | Earliest Next release covering all supplied Next advisories, including Critical image/typed-array issues and the later cache disclosures |
| sharp and platform bindings | 0.35.4 | 0.35.5 | Patched librsvg dependency |
| source-map-js | 1.2.1 | 1.2.2 | Patched indexed source-map section-offset denial of service |
| zod | 4.5.4 | 4.6.7 | Compatible patched 4.x resolution, advisory fixed from 4.6.6 |
| brace-expansion | 1.1.18 / 5.0.9 | 1.1.22 / 5.0.13 | Compatible patched resolutions within both existing dependency ranges |

Next/env/SWC/plugin packages move with the selected framework release. Sharp's native libvips bindings and compatible semver child resolution move with sharp. Supabase, React, application source and existing workflow configuration were preserved. No force audit repair or major-version overrides were used. The manifest change specific to this remediation is the matching Next and ESLint-config version pair. Other fixes are lockfile resolutions of affected components.

Official advisory records were retrieved from the GitHub Advisory API for every supplied direct advisory. Release notes were checked for [Next 16.4.5](https://github.com/vercel/next.js/releases/tag/v16.4.5), [sharp 0.35.5](https://github.com/lovell/sharp/releases/tag/v0.35.5) and [Zod 4.6.7](https://github.com/colinhacks/zod/releases/tag/v4.6.7). Their bodies are retained in `release-notes.json`. GitHub release-tag records for the selected brace-expansion and source-map-js versions returned 404. Their fix versions were verified against the official advisory records and registry metadata. This release-note availability gap is recorded.

## Remaining findings and decisions

The original audit reported 1 Critical, 14 High and 6 Moderate affected packages. The refreshed audit reports **0 Critical, 10 High and 6 Moderate** affected packages. These counts include parents inheriting a vulnerable child, so several package findings share one advisory.

All remaining High findings trace to **picomatch, GHSA-fc5q-39xc-vjpf**. Installed copies are 2.3.2 and 4.0.7. The official advisory covers <=4.0.7 and supplies no patched release. Registry metadata showed no published version above 4.0.7. Affected paths are development/build tooling through ESLint's fast-glob/micromatch chain, TypeScript resolver/typescript-eslint's tinyglobby/fdir chain, and lint-staged's direct picomatch dependency. The inventory expands each parent and copy.

npm suggests downgrading eslint-config-next to 14.2.35 and lint-staged to 16.3.4. Those changes alter major tooling contracts and were not applied. A decision is needed to await patched upstream versions, authorize a separately scoped replacement of affected tooling, or explicitly accept the residual risk. No risk acceptance is assumed. CI's high-severity dependency gate will continue failing.

The remaining Moderate advisory is **minimatch GHSA-g3hv-75wg-m249**, inherited through typescript-eslint and its parser/utils/plugin packages. Installed minimatch 10.2.6 has a documented fix at 11.0.1, outside its parent's current 10.x range. A forced override would violate that dependency contract. A compatible parent update/backport or an explicitly approved breaking tooling migration is needed.

Next is used for both production serving and builds. Sharp is the framework's optional runtime image-processing dependency. source-map-js is a production-installed dependency through Next/postcss, used for CSS/build source maps. Zod, brace-expansion and all remaining glob findings are development/build dependencies. These scope classifications establish dependency exposure and do not claim that an exploit was reproduced against the dashboard.

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Clean `HUSKY=0 npm ci` | PASS | dependency-remediation/install.log |
| `npm audit --json` | FAIL residual 10 High / 6 Moderate, no Critical | dependency-remediation/audit-after.json |
| `npm run lint` | PASS | dependency-remediation/lint.log |
| `npm run typecheck` | PASS | dependency-remediation/typecheck.log |
| `npm test` | PASS, all 50 tests including FSD boundaries | dependency-remediation/tests.log |
| Default `npm run build` | PASS, Next 16.4.5 Turbopack | dependency-remediation/build.log |
| Complete route and proxy configuration comparison | PASS, no differences from current baseline | dependency-remediation/route-comparison.log and routes-after.json |
| GitHub PR/workflow access | BLOCKED, GraphQL cannot resolve Elmo-Tech/elmotech_pos_admin_dashboard | Same repository-access error on retry, no run links available |
| Authenticated Arabic/English desktop/mobile acceptance | BLOCKED pending secure staging role accounts and disposable activation/renewal fixtures | docs/FRONTEND_ACCEPTANCE.md |

Checks used a clean temporary checkout with the exact patched manifest/lockfile and no `.env` files. The verified lockfile is also installed in the working checkout. Existing staged content was untouched. Security verification uses official version ranges, the refreshed dependency graph and application regression/build controls. Live exploit reproduction, Supabase mutation acceptance and deployment verification were not performed.

Frontend acceptance remains open because the residual advisory decisions and authenticated staging fixtures are outstanding. Laravel and MySQL work is deferred.

## Deployment classification correction

A subsequent review ran both full and omit-dev audits. Remaining copies belong to the lockfile devDependency graph, but their actual deployment exposure is unverified. Checked-in CI installs the full graph. Deployment pruning, artifact contents and hosting settings could not be verified. Prior development/build scope descriptions describe dependency placement and must not be read as confirmed build-only deployment isolation. See [the deployment exposure report](audit-deployment-review/REPORT.md).
