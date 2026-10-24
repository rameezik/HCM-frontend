# Local face attendance and analytics

Pages `/employee/face-enrollment` and `/hr/face-enrollment` use the browser camera and the application's own backend inference. AWS Face Liveness/Rekognition and browser Cognito credentials are no longer part of the active face flow. The frontend captures three bounded JPEG camera samples after explicit biometric consent; the backend runs OpenCV YuNet detection/alignment and SFace identity embeddings locally on CPU. No external API key is needed. The UI sends samples and a purpose-bound challenge, never an embedding, similarity decision or verification-success flag.

Camera capture supports cancellation/track cleanup and clear denied/missing/busy-camera errors. HTTPS is required in production, with localhost permitted during development. Missing local model/runtime/encryption configuration produces an actionable unavailable state and leaves ordinary attendance usable. Templates and encryption keys remain backend-only. Employees can withdraw consent/delete and re-enroll.

**Local identity matching does not establish reliable liveness.** The camera interface is not proof against photos, replay, virtual cameras or modified clients. YuNet/SFace do not implement validated presentation-attack detection; no blinking/head movement claim substitutes for it. The consent and attendance screens disclose the limitation. The authorized web attendance and HR correction process remains available.

All role dashboards and attendance pages retain company-scoped `/api/attendance/analytics` data: daily metrics, weekly status bars, monthly rate line, staff department comparisons, status distribution and employee timeline/history. Filters, accessible tables, loading/empty/error states, 15-second visible-tab polling and immediate attendance-event refresh use real backend results. No fabricated business values are used. Company timezone labels and actual UTC timestamps are retained.

AI chat, summary and smart-leave controls check `/api/ai/status`. Missing `AI_API_KEY` disables only those controls with a configuration notice. Authentication, company/employee forms, regular leave/attendance, payroll and dashboards remain independent.

Backend setup (Python 3.10+ with venv/pip, Node24.19 and a MongoDB replica set):

```sh
cd /workspace/HCM-backend
npm ci
bash scripts/setup-local-face.sh
npm run setup:env
npm start
```

Frontend setup:

```sh
cd /workspace/HCM-frontend
npm ci
npm run dev
# Verify production output:
# npm run lint && npm run build
```

The paired backend report `HCM-backend/docs/face-attendance.md` lists exact model filenames/checksums, MIT YuNet and Apache-2.0 SFace licenses, configuration, endpoints, encryption/retention, actual executed tests and security/accuracy limits. Model setup installs pinned Python OpenCV/NumPy and SHA-256-verified official OpenCV Zoo weights; runtime inference does not call a cloud provider. Physical-camera/PAD accuracy is not certified by image-fixture tests.

Verification completed: frontend lint and the 49-route production build passed. The backend full suite passed 65/65 checks; after an additional HTTPS guard change, the focused local-integration suite passed 13/13 checks. Chromium exercised real `getUserMedia`/canvas with a public-domain fixture-video camera stream and actual local-model enrollment, face check-in/out, MongoDB chart refresh, withdrawal/deletion, denied camera permission and a 375px layout without runtime errors. A fixture camera stream does not validate a physical user camera or robust liveness/PAD. Test data was isolated from application records.

Commit/push status is reported separately after validation; existing history is preserved.
