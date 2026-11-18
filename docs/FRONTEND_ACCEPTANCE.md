# Frontend acceptance

18 November 2026. Baseline d17674a and migrated commit 28a2497 were matched against retained builds by comparing all tracked runtime inputs. All 95 baseline and 168 migrated inputs matched their Git commits.

The local configuration points to documented Supabase staging. Fixture account references, disposable activation requests and eligible renewal records were absent. A secure fixture handoff was requested. Authenticated testing awaits that handoff.

| Requested flow | Status | Evidence / blocker |
| --- | --- | --- |
| Login and logout | BLOCKED | No disposable staff account/session provided |
| Owner/admin/support/viewer permissions | BLOCKED | Four role fixtures unavailable |
| List filters and pagination | BLOCKED | Authenticated access and disposable list data unavailable |
| Plan create/edit and persistence after refresh | BLOCKED | Writable fixture account/data unavailable |
| Activation upload, verification, issuance and download | BLOCKED | Disposable valid .elmoreq and matching license/customer unavailable |
| Same-device renewal and download | BLOCKED | Eligible activated finite license and disposable renewal operation unavailable |
| Protected dialogs, loading and errors | BLOCKED | Authenticated fixture environment unavailable |
| Protected Arabic/English desktop/mobile comparison | BLOCKED | Same prerequisite |
| Anonymous configuration screen comparison | PASS | Eight screenshots, four before/after contexts, byte-identical PNGs, zero page errors |
| Existing source regression suite | PASS | 50 local tests, controlled dependencies |

The auxiliary browser comparison ran the credential-free retained builds at 1440x1000 and 390x844, with Arabic and English cookies. Both rendered the auth-not-configured screen. These screenshots document that available state. They do not verify the authenticated login form or live Supabase behavior.

Evidence is in `frontend-acceptance/public-browser.json` and the eight `before/after-{ar,en}-{desktop,mobile}.png` screenshots. No visual or behavioral difference was observed in those four configuration-screen pairs. Differences in the blocked flows cannot be assessed.

The missing Chrome installation was recovered by downloading temporary Playwright Chromium. Browsers and local servers were closed after capture. Application source and backend data were unchanged by acceptance checks. Authenticated acceptance remains incomplete pending secure role accounts and disposable activation/renewal fixtures against the same staging environment.

Dependency remediation subsequently removed all Critical findings. Ten High and six Moderate package findings remain pending upstream fixes or a tooling decision. See `DEPENDENCY_REMEDIATION.md`. Authenticated acceptance remains blocked by the same fixture prerequisites.
