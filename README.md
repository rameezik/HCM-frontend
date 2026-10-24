# HCM Lite frontend

The application uses two separate repositories:

```text
/workspace/HCM-frontend/          Next.js frontend (this repository)
  app/                      App Router pages, JavaScript/JSX
  components/               Role-based screens and reusable UI
  lib/api.js                Same-origin Express API client
/workspace/HCM-backend/      Express/Mongoose backend repository
  server.js                 API entry point
  src/                      Authentication, models, routes and business services
  tests/                    Real MongoDB integration and business-rule tests
```

Frontend → Express REST API → MongoDB. The frontend never accesses MongoDB directly. The existing charcoal surfaces, cyan/rose accents, typography and responsive navigation are preserved.

## Start in this cloud environment

```sh
bash /workspace/onboarding/start.sh
```

This starts the local MongoDB replica set, the API from `/workspace/HCM-backend` on port4000, and Next.js from `/workspace/HCM-frontend` on port3000. Logs are in `/workspace/logs`. Installation/refresh is `bash /workspace/onboarding/install.sh`; it uses the application lockfiles and preserves local configuration. Both apps use Node24.19.0.

Start from the login flow. A fresh database redirects to company/Admin setup. Admin creates organization records and HR; HR registers employees. Temporary passwords must be changed on first sign-in. No default accounts, fake responses or business records are seeded.

## Frontend commands

From this repository:

```sh
npm ci
npm run dev
npm run lint
npm run build
npm start
```

The backend and MongoDB must also be running for real API behavior. `API_INTERNAL_URL` is a server-only Express origin, defaulting to `http://127.0.0.1:4000`; Next.js proxies same-origin `/api` calls using HttpOnly session cookies. Optional frontend configuration is in `.env.local`. Do not place MongoDB credentials or AI keys in the frontend. Compilation requires Google Fonts network access to `fonts.googleapis.com` and `fonts.gstatic.com`; TLS verification remains enabled.

## Backend

The actual backend code is in `/workspace/HCM-backend`, a separate Git repository. Its environment configuration belongs in its ignored `.env`. To run backend checks, use `cd /workspace/HCM-backend && npm test` with the local replica set running. Tests create and remove only isolated `hcm_test_*` databases.

## Requirements and verification

See [requirements checklist](docs/requirements.md), [verification report](docs/verification.md), and the backend README. Calendar dates and office hours use UTC. Active frontend development and review use this `HCM-frontend` repository. The earlier `hcm-app` review commit is retained as-is; its history is not rewritten.

The hosted AI adapter and scoped tools are implemented, but live model behavior requires a secure backend `AI_API_KEY` binding and provider network access. Ordinary forms remain usable without AI. Optional camera/mobile and other bonus features are not implemented. Local commits are created for review in the two selected repositories. No pushes, public deployment or LMS submission have been performed.
