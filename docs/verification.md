# Current active repositories

Frontend code is in `/workspace/HCM-frontend` (`rameezik/HCM-frontend`), as most recently requested by the user. Backend code is in `/workspace/HCM-backend` (`rameezik/HCM-backend`). The earlier hcm-app review commit is retained without rewriting history. The sections below record prior implementation, relocation and validation history. Local commits are authorized for review; no pushes have been requested.

# Active repository layout

Frontend: `/workspace/hcm-app` (`rameezik/hcm-app`). Backend: `/workspace/HCM-backend` (`rameezik/HCM-backend`). These are separate repositories. The frontend application files have been copied, byte-verified, into hcm-app; original checkouts and uncommitted work are preserved. Setup/startup instructions now use these active paths. The report below records earlier implementation and validation history; its initial repository-layout notes are historical.

# HCM Lite verification

## Scope and state

Read all seven PDF pages before development, including the role/feature tables and architecture/data-flow diagrams. Implemented against `rameezik/HCM-frontend` and the existing `rameezik/HCM-backend`; the originally selected `rameezik/hcm-app` is empty/unborn and retained. No commits, pushes, public hosting or LMS submission were performed.

The local development workflow runs Node24.19.0, Next16.4.3/React19.3/Tailwind4, Express/Mongoose, and a real MongoDB8.0.16 single-node replica set. The MongoDB archive matched the official SHA-256 `dc0c0fcaabea2902e67cd408e58497d5ce5d3d22890b37003c2e23a841e5a1d4`; TLS/checksum verification was never disabled.

## Passed

- Frozen installs: `npm ci` in both applications. The reusable `/workspace/onboarding/install.sh` was executed successfully, including repeat dependency installation, local-config preservation, MongoDB prerequisite checks, frontend lint and production build.
- Frontend: `npm run lint` and `npm run build` passed. Build generated47 routes. The last build included the explicit trusted local development origin. JavaScript/JSX application pages preserve the existing charcoal/cyan/rose identity and layout.
- Backend: `npm test` completed with **28 passed,0 failed,0 skipped**. The suite uses real, uniquely named MongoDB test databases, not mocked database calls or fake API responses. Coverage includes date/holiday/attendance rules, all annual-tax slab boundaries, proration, bootstrap/auth and forced password change, role and peer-scope rejection, real employee registration/search/profile updates, check-in/out/duplicate conflict, correction approval, leave overlap/reservation/quota/cancellation/approval, CSV dry-run/import/export, server-derived analytics, salary changes/stale payroll rejection, Admin-only finalization/locking, real scoped PDF bytes, notifications, audit redaction/access and session revocation. All seven AI read-only tool functions were exercised against real scoped services; missing-key fallback/logging was verified separately.
- Chromium production browser flow: fresh company/Admin setup; organization and HR creation; HR and Employee temporary-password rotation; employee registration; real server-time check-in/out; employee leave application and HR approval; HR payroll generation; Admin finalization; employee PDF download. The PDF download begins with real `%PDF` bytes.
- Chromium development browser flow after origin correction: repeated the same full workflow; also verified missing-key chat and smart-leave errors (a failed AI request cannot report success), notifications/read action,375px navigation and no detected page-level overflow or browser runtime errors. API permission tests run independently of menu visibility.
- Reusable `/workspace/onboarding/start.sh` was executed and rerun. MongoDB reported writable-primary readiness; API health succeeded directly and through Next.js. It starts the API and Next.js development watchers with logs in `/workspace/logs`. Frontend and API are running for development.
- Cleanup: all isolated integration/browser test databases were removed. The default `hcm_lite` database has **zero company,user,employee,attendance,leave and payroll records**. No demo users or business data were retained. `/api/setup` reports `required:true`; final Chromium validation checks that the empty database redirects login to the first-run form.
- `git diff --check` passed in both source repositories. The local backend `.env` is ignored and not printed. Unrelated formatter-only changes in pre-existing frontend helper/layout components were restored.

## Diagnosed and resolved during setup

- Google Fonts and MongoDB artifact egress was initially blocked. Required domains were added to the saved configuration; verified MongoDB installation and frontend builds subsequently succeeded.
- Mongoose9 requires `ordered:true` when creating multiple documents in a transaction; corrected setup defaults accordingly.
- An Employee detail request originally substituted the caller's own ID when a peer ID was supplied. Changed to intersect both constraints; peer IDs return404 and cannot redirect edits to another target.
- Added stale-payroll detection and serialized employee writes for attendance/leave decisions; finalized months reject conflicting changes.
- Fixed an existing synchronous state update in FadeIn, explicit accessible select labels, narrow-screen table wrapping, and misleading generic success text on AI/read-only forms.
- Next16 development resources require an explicit trusted origin when accessed via127.0.0.1; the documented `allowedDevOrigins` setting resolved the development browser failure. No wildcard development origin was added.

## Blocked: required live AI verification

`AI_API_KEY` is not present and the saved secret requirement has **no saved binding**. The provider adapter defaults to Groq's HTTPS OpenAI-compatible tool-calling endpoint. An unauthenticated connectivity check through the platform proxy was rejected with **CONNECT403**; this is a network-policy boundary, not an authenticated provider response. No secret value was requested or sent in chat. Draft persistence is confirmed, but that does not prove runtime network/secret application.

**User action:** securely enter `AI_API_KEY` in environment settings and apply the saved `api.groq.com` access requirement. Then resume this chat so live scoped chat, policy questions/refusal, smart-leave date interpretation/validation, summaries, timeout/fallback and rate-limit behavior can be tested before claiming full PDF readiness. The current no-key fallback remains usable and all ordinary forms continue working. Do not mark live AI complete based on adapter code or tool-unit checks alone.

## Configuration saved

Confirmed draft persistence for `install_script`, `start_skill`, all three retained repository entries/mounts, `AI_BASE_URL` and `AI_MODEL` variable requirements, and the `AI_API_KEY` secret requirement scoped to `api.groq.com`. Saved custom destinations: `fastdl.mongodb.org`, `fonts.googleapis.com`, `fonts.gstatic.com`, and `api.groq.com`. Existing package-manager presets were preserved.

The configured roots and exact HEADs are:

| Checkout | HEAD |
| --- | --- |
| hcm-app | null: positively verified symbolic unborn work branch |
| HCM-backend | 89ae80d856d44b27892d25aae3bfa13f50bdf12c |
| HCM-frontend | 3462e0b43f4183a42727abfd6527e32c270ed8e2 |

Full workspace discovery found no additional project checkouts or traversal failures. The empty sandbox `/workspace/.git` sentinel is not a Git repository. No source checkout was removed or reset; implemented work remains uncommitted for review and snapshot publication.

The user must **review and save changes in environment settings, then publish the environment** when validation is complete. Draft saving does not publish or prove restoration in a new task. No publication or fresh-task restoration is claimed.

## Explicit limitations

Hosted-model behavior remains unverified and prevents a full-readiness claim. Optional camera/mobile/face/geofence/liveness, risk/anomaly/late-penalty and PWA bonuses are not implemented. Historical attrition edge cases, every report-filter combination, every possible concurrent mutation, production deployment and a comprehensive security/accessibility audit are not exhaustively verified. Tests demonstrate the listed workflows and boundaries, not blanket production certification. Calendar/date assumptions and payroll policy details are documented in the backend README and requirements checklist.


## Current layout validation and local review commits

The user explicitly confirmed separate repositories and requested local commits. Active frontend source is directly in `/workspace/hcm-app`; active API source remains `/workspace/HCM-backend`. There are no nested Git repositories or backend directories in hcm-app. All81 original frontend source/config/lock files matched byte-for-byte during the relocation audit, excluding intentionally updated documentation and generated outputs. The original HCM-frontend checkout remains untouched to preserve its local work.

Executed after correcting the layout: frontend `npm run lint` and `npm run build` passed from hcm-app, including47 built routes; backend `npm test` passed28 checks from HCM-backend against real MongoDB. The updated startup helper passes both direct/proxied database health checks. The running Next.js command explicitly uses hcm-app, and Chromium verified first-run setup plus the real Express/MongoDB health request at375px without browser runtime errors. An initial run was blocked by sandbox network permissions; after the network grant, the affected build/runtime/database checks passed.

Local commits in the two selected repositories record the implementation for review. No push, public deployment or LMS submission is included. Saved repository selection remains hcm-app plus HCM-backend. Live hosted AI remains unverified pending its backend key and provider access; the existing honest missing-key fallback and scoped tool tests are unchanged.


Latest user correction: the frontend implementation and local review commit belong in HCM-frontend. The backend feature commit is already recorded in HCM-backend. The hcm-app commit remains preserved and is not used as the active frontend. Runtime helpers target HCM-frontend and HCM-backend. Saved repository membership is not changed by this path correction.
