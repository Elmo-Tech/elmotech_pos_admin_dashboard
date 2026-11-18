# Dependency remediation inventory

18 November 2026. Source audit is `docs/tooling-verification/audit.json`. Every affected lockfile copy and inherited advisory is expanded in `finding-inventory.json`. Official advisory records are retained in `official-advisories.json`.

| Package | Before → after | Scope and dependency path | Advisory IDs |
| --- | --- | --- | --- |
| @next/eslint-plugin-next | 16.3.4 → 16.4.5 | development/build — root -> eslint-config-next -> @next/eslint-plugin-next | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) |
| @typescript-eslint/eslint-plugin | 8.70.0 → 8.70.0 | development/build — root -> eslint-config-next -> typescript-eslint -> @typescript-eslint/eslint-plugin | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) |
| @typescript-eslint/parser | 8.70.0 → 8.70.0 | development/build — root -> eslint-config-next -> typescript-eslint -> @typescript-eslint/parser | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) |
| @typescript-eslint/type-utils | 8.70.0 → 8.70.0 | development/build — root -> eslint-config-next -> typescript-eslint -> @typescript-eslint/eslint-plugin -> @typescript-eslint/type-utils | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) |
| @typescript-eslint/typescript-estree | 8.70.0 → 8.70.0 | development/build — root -> eslint-config-next -> typescript-eslint -> @typescript-eslint/typescript-estree | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) |
| @typescript-eslint/utils | 8.70.0 → 8.70.0 | development/build — root -> eslint-config-next -> typescript-eslint -> @typescript-eslint/utils | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) |
| brace-expansion | 1.1.18 → 1.1.22; 5.0.9 → 5.0.13 | development/build — root -> eslint -> minimatch -> brace-expansion<br>root -> eslint-config-next -> typescript-eslint -> @typescript-eslint/typescript-estree -> minimatch -> brace-expansion | [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p), [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr), [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) |
| eslint-config-next | 16.3.4 → 16.4.5 | development/build — root -> eslint-config-next | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) |
| eslint-import-resolver-typescript | 3.10.1 → 3.10.1 | development/build — root -> eslint-config-next -> eslint-import-resolver-typescript | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) |
| fast-glob | 3.3.1 → 3.3.1 | development/build — root -> eslint-config-next -> @next/eslint-plugin-next -> fast-glob | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) |
| fdir | 6.5.0 → 6.5.0 | development/build — root -> eslint-config-next -> eslint-import-resolver-typescript -> tinyglobby -> fdir | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) |
| lint-staged | 17.6.1 → 17.6.1 | development/build — root -> lint-staged | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) |
| micromatch | 4.0.8 → 4.0.8 | development/build — root -> eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) |
| minimatch | 10.2.6 → 10.2.6 | development/build — root -> eslint-config-next -> typescript-eslint -> @typescript-eslint/typescript-estree -> minimatch | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) |
| next | 16.3.4 → 16.4.5 | runtime/build (Next dependency) — root -> next | [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [GHSA-39w2-rjm5-chcv](https://github.com/advisories/GHSA-39w2-rjm5-chcv), [GHSA-3w37-wq28-93x7](https://github.com/advisories/GHSA-3w37-wq28-93x7), [GHSA-4jqv-mc3x-m676](https://github.com/advisories/GHSA-4jqv-mc3x-m676), [GHSA-673q-mjm6-r5xr](https://github.com/advisories/GHSA-673q-mjm6-r5xr), [GHSA-cjq9-62q9-8jv4](https://github.com/advisories/GHSA-cjq9-62q9-8jv4), [GHSA-f87g-xv8r-7p7x](https://github.com/advisories/GHSA-f87g-xv8r-7p7x), [GHSA-h694-7cp9-m8p3](https://github.com/advisories/GHSA-h694-7cp9-m8p3), [GHSA-mcj8-r9mp-w47p](https://github.com/advisories/GHSA-mcj8-r9mp-w47p), [GHSA-mfr8-8qww-v76h](https://github.com/advisories/GHSA-mfr8-8qww-v76h), [GHSA-p3m5-59mp-jv5r](https://github.com/advisories/GHSA-p3m5-59mp-jv5r), [GHSA-vc7v-qv4w-wrv8](https://github.com/advisories/GHSA-vc7v-qv4w-wrv8), [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j) |
| picomatch | 2.3.2 → 2.3.2; 4.0.7 → 4.0.7 | development/build — root -> eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> picomatch<br>root -> eslint-config-next -> eslint-import-resolver-typescript -> tinyglobby -> picomatch<br>root -> lint-staged -> picomatch | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) |
| sharp | 0.35.4 → 0.35.5 | runtime/build (Next dependency) — root -> next -> sharp | [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) |
| source-map-js | 1.2.1 → 1.2.2 | runtime/build (Next dependency) — root -> next -> postcss -> source-map-js | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) |
| tinyglobby | 0.2.17 → 0.2.17 | development/build — root -> eslint-config-next -> eslint-import-resolver-typescript -> tinyglobby | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) |
| typescript-eslint | 8.70.0 → 8.70.0 | development/build — root -> eslint-config-next -> typescript-eslint | [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) |
| zod | 4.5.4 → 4.6.7 | development/build — root -> eslint-config-next -> eslint-plugin-react-hooks -> zod | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) |

## Patched versions from official advisories

| Advisory | Component | First patched release(s) |
| --- | --- | --- |
| [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw) | next | 15.5.28, 16.4.1 |
| [GHSA-39w2-rjm5-chcv](https://github.com/advisories/GHSA-39w2-rjm5-chcv) | next | 16.3.8 |
| [GHSA-3w37-wq28-93x7](https://github.com/advisories/GHSA-3w37-wq28-93x7) | next | 16.3.8 |
| [GHSA-4jqv-mc3x-m676](https://github.com/advisories/GHSA-4jqv-mc3x-m676) | next | 15.5.27, 16.3.8 |
| [GHSA-673q-mjm6-r5xr](https://github.com/advisories/GHSA-673q-mjm6-r5xr) | next | 16.4.1 |
| [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | source-map-js | 1.2.2 |
| [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | brace-expansion | 5.0.10, 3.0.7, 2.1.5, 1.1.19 |
| [GHSA-cjq9-62q9-8jv4](https://github.com/advisories/GHSA-cjq9-62q9-8jv4) | next | 16.3.8 |
| [GHSA-f87g-xv8r-7p7x](https://github.com/advisories/GHSA-f87g-xv8r-7p7x) | next | 16.3.8 |
| [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) | picomatch | None published |
| [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) | minimatch | 11.0.1 |
| [GHSA-h694-7cp9-m8p3](https://github.com/advisories/GHSA-h694-7cp9-m8p3) | next | 16.3.8 |
| [GHSA-mcj8-r9mp-w47p](https://github.com/advisories/GHSA-mcj8-r9mp-w47p) | next | 16.3.8, 15.5.27 |
| [GHSA-mfr8-8qww-v76h](https://github.com/advisories/GHSA-mfr8-8qww-v76h) | next | 16.4.5 |
| [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | zod | 4.6.6 |
| [GHSA-p3m5-59mp-jv5r](https://github.com/advisories/GHSA-p3m5-59mp-jv5r) | next | 15.5.28, 16.4.1 |
| [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | brace-expansion | 5.0.12, 3.0.9, 2.1.7, 1.1.21 |
| [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | brace-expansion | 5.0.11, 3.0.8, 2.1.6, 1.1.20 |
| [GHSA-vc7v-qv4w-wrv8](https://github.com/advisories/GHSA-vc7v-qv4w-wrv8) | next | 16.4.5 |
| [GHSA-vcvr-r3jv-pc5j](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j) | next | 16.3.6 |
| [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) | sharp | 0.35.5 |
