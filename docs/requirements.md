# Current active repositories

Frontend code is in `/workspace/HCM-frontend` (`rameezik/HCM-frontend`), as most recently requested by the user. Backend code is in `/workspace/HCM-backend` (`rameezik/HCM-backend`). The earlier hcm-app review commit is retained without rewriting history. The sections below record prior implementation, relocation and validation history. Local commits are authorized for review; no pushes have been requested.

# Active repository layout

Frontend: `/workspace/hcm-app` (`rameezik/hcm-app`). Backend: `/workspace/HCM-backend` (`rameezik/HCM-backend`). These are separate repositories. The frontend application files have been copied, byte-verified, into hcm-app; original checkouts and uncommitted work are preserved. Setup/startup instructions now use these active paths. The report below records earlier implementation and validation history; its initial repository-layout notes are historical.

# HCM Lite requirements and implementation plan

Source: complete seven-page PDF (cover plus six numbered pages), read before development. The PDF is the requirements source; the pasted text authorizes implementation, specifies the stack, frontend repository, theme, and no commits/pushes.

## Baseline
- hcm-app is a valid empty/unborn checkout with no application files.
- HCM-backend has dependencies and directory scaffolding; every source/test file is empty.
- HCM-frontend was cloned from the explicitly requested GitHub repository. Next.js 16.4.3, React 19.3.0, Tailwind 4; existing charcoal, cyan and rose theme. Most routes are placeholders, no authentication/API integration.
- No MongoDB URI, JWT secret, or AI key is injected. Google Fonts and MongoDB binary host are blocked by current egress.

## Required capabilities (all initially unimplemented)
01 First-run company + Admin setup, single successful initialization.
02 JWT login/logout/password change, bcrypt, forced temporary password rotation, server role/scope guards.
03 Company hours/grace/half-day/weekends/location/radius; rules snapshot for new records.
04 Departments, designations, leave types/quotas, public holidays; Admin write and HR read.
05 Admin creates HR, deactivates/resets HR and Employee logins; no extra Admin creation.
06 HR registers/edits employees and salary, creates login; employees edit only phone/address.
07 Server search/filter/paging and Employee 360 scoped to self or authorized staff.
08 HR CSV export and optional import with row/field/reason dry run, validation and uniqueness.
09 Server-time web check-in/out, unique employee/date, duplicate 409.
10 Attendance board/calendar: late, half_day, absent, on_leave, missing_checkout.
11 Employee correction request/reason, HR decision, Admin read.
12 HR/Employee leave application/cancellation/balance/history, workdays, weekends/holidays excluded, overlap/balance 422.
13 HR approves/rejects with comment and notification; decisions revalidate balance.
14 HR salary structure; Admin read; private from peers.
15 HR monthly payroll draft: 1.5 basic, 40% HRA/10% medical, absence/unpaid/half-day deduction, proration, annual progressive tax divided by 12.
16 Admin-only payroll finalization, immutable locked results, no generation overwrite.
17 Role-scoped payslip PDF download, actual payroll data.
18 Date/department-scoped server analytics: headcount/attrition, attendance rate/late/absenteeism, leave utilization, payroll gross/net/average; trends, gender/tenure, late leaders, employee hours/balance/latest slip.
19 Hosted LLM tool-calling chat; seven specified tools call same scoped services as REST.
20 Admin/HR dashboard summary, 3–5 bullets using current server KPI data.
21 Smart leave JSON validated/retried once and confirmed by human; never auto-save.
22 Policy Q&A from PDF rules only; refuse unauthorized data.
23 Admin/HR announcements, all dashboards read.
24 In-app leave/payroll notifications scoped to recipient.
25 Admin-only immutable audit records (actor/action/entity/before/after); log all important mutations and AI calls.

## Business constraints
Default office 09:00, grace 15 min, half day <5h, Sat/Sun weekend. Annual14/sick8/casual10/unpaid unlimited. Payroll annual tax: <=600k zero; <=1.2m 5% excess over600k; <=2.4m 30k+15% excess over1.2m; <=3.6m 210k+25% excess over2.4m; above 510k+35% excess over3.6m. Attendance rate weighted numerator excludes approved leave denominator. No sample business data. AI timeout15s/rate20 user/hour/backend key only/labeled generated/no writes/logs.

## Entities and relationships
Company singleton/settings; User(role, hash, active, forced rotation) links optional Employee; Employee links Department/Designation and stores salary/employment dates/status; Attendance unique employee/day with rule snapshot; Correction links Employee/Attendance; Leave links Employee/LeaveType and approver; Holiday; PayrollRun unique month embeds frozen employee payslips; Announcement actor; Notification recipient; AuditLog actor/entity; AiLog actor/status/tool calls.

## Assumptions
- Company calendar/time is UTC until a company timezone is explicitly specified; show that in settings. Strict ISO dates.
- HR self-service attendance/leave requires a linked employee profile; Admin may create an HR login linked to an existing employee.
- Tax uses contractual full-month gross annualized, deducted monthly after proration, capped at payable gross; no unrequested late penalty.
- Payroll draft runs may be explicitly regenerated until finalized; use fresh rules snapshots and freeze final payslip data.
- Pending leave reserves balance and overlap to prevent concurrent oversubscription; cancelled/rejected requests release it.
- No optional camera/mobile/face identity, risk/anomaly/PWA bonus is claimed.

## Implementation order and validation
1 Backend schema/services/guards, first-run and login; domain unit tests.
2 Organization/employees; attendance/leave; payroll/PDF; analytics/comms/audit.
3 Hosted AI adapter and scoped tools; honest unavailable state without credentials.
4 Reusable frontend views integrated with API; existing theme and mobile navigation.
5 Build/lint, real Mongo integration lifecycle (isolated test database), scope/security tests, functional requests, and responsive browser tests if a browser is available.
6 Save tested install/start instructions and secure configuration requirements. Never mark checks verified unless executed; no commits or pushes.

## Validation baseline
- npm ci succeeds in backend and frontend with unchanged lockfiles.
- Existing frontend build fails on blocked Google Fonts; lint fails FadeIn synchronous effect.
- node server.js exits immediately because file is empty.
- node --test discovers two empty files but executes no assertions; this is NOT backend readiness.


## Implementation and verification status after development

| PDF items | Implementation | Verification |
| --- | --- | --- |
| 01–07 Auth, setup, organization, users, employees | Implemented in backend/API and role-specific JSX views | Real MongoDB integration; Chromium setup/role/login/registration flow. Individual company/catalog edits also exercised. |
| 08 CSV | Dry-run, atomic import, formula-safe export | Real invalid/valid dry-run, import/login, export assertions. |
| 09–11 Attendance | Server clock, unique dates, calendar/board, rule snapshots, corrections | Real duplicate/checkout/status/correction/scope assertions; Chromium check-in/out. |
| 12–13 Leave | Working-day accounting, reserved quota, overlap checks, cancellation, HR decision | Real quota/overlap/cancellation/approval/notification checks and Chromium employee-to-HR flow. Holiday exclusion covered by rule test. |
| 14–17 Payroll | Salary editing, proration/deductions/progressive tax, draft/stale-input checks, Admin lock, scoped PDF | Tax-band/proration tests and real draft/salary-update/stale-rejection/finalization/lock/PDF/scope assertions; Chromium draft/finalize/download. |
| 18 Dashboards | Database aggregates plus calendar-derived attendance, date/dept filters, trends, gender/tenure, leave/dept/payroll insights, YTD attrition, personal hours/balances/slips | Real known-record aggregate and personal-scope assertions; rendered desktop/mobile dashboards. Complex historical attrition and all filter combinations are not exhaustively tested. |
| 19–22 AI | HTTPS hosted tool-call adapter, seven scoped tools, policy prompt with current rules, summaries, smart draft validation/retry, timeout/rate/logging/labels | Read-only tool functions exercised against real services; missing-key API/browser fallback verified. **Live model answers, smart-leave interpretation, hosted retries/timeouts and provider integration remain UNVERIFIED: no AI_API_KEY.** |
| 23–25 Comms/audit | Announcements, own notifications, immutable Admin audit and AI logs | Real API persistence/scope/read-marker/redaction tests; Chromium notification action. |

No optional mobile/camera/face/geofence/liveness, risk/anomaly/late-penalty/PWA bonus is claimed. Source changes were explicitly authorized by the pasted development request. No commits or pushes. The default development database remains empty after isolated tests are removed. Public hosting and LMS submission are outside this setup and unperformed.

Final executed outcomes:28 backend checks pass; frontend lint/build and real Chromium production/development workflows pass. Live AI remains blocked by missing AI_API_KEY binding and proxy CONNECT403 for api.groq.com. See verification.md for exact evidence and actions.


## Current layout validation and local review commits

The user explicitly confirmed separate repositories and requested local commits. Active frontend source is directly in `/workspace/hcm-app`; active API source remains `/workspace/HCM-backend`. There are no nested Git repositories or backend directories in hcm-app. All81 original frontend source/config/lock files matched byte-for-byte during the relocation audit, excluding intentionally updated documentation and generated outputs. The original HCM-frontend checkout remains untouched to preserve its local work.

Executed after correcting the layout: frontend `npm run lint` and `npm run build` passed from hcm-app, including47 built routes; backend `npm test` passed28 checks from HCM-backend against real MongoDB. The updated startup helper passes both direct/proxied database health checks. The running Next.js command explicitly uses hcm-app, and Chromium verified first-run setup plus the real Express/MongoDB health request at375px without browser runtime errors. An initial run was blocked by sandbox network permissions; after the network grant, the affected build/runtime/database checks passed.

Local commits in the two selected repositories record the implementation for review. No push, public deployment or LMS submission is included. Saved repository selection remains hcm-app plus HCM-backend. Live hosted AI remains unverified pending its backend key and provider access; the existing honest missing-key fallback and scoped tool tests are unchanged.
