# 1. Project setup and deployment

Reviewed October 23, 2026. This is the active setup reference for The NoBias Media.
Use [the mobile/payment guide](02-MOBILE-AND-PAYMENTS.md) for API integration and
[the operations/release guide](03-OPERATIONS-AND-RELEASE.md) for troubleshooting
and release checks. Archived documents are historical, not deployment instructions.

## Project map

| Folder/file | Purpose |
|---|---|
| `frontend/` | React 18 / Create React App website; news, bookmarks, legal pages, donations |
| `backend/` | Express, MongoDB/Mongoose, cookie authentication, Socket.IO, PayU and PhonePe |
| External React Native app | Shares the API; current source is outside this checkout |
| `Dockerfile` | Backend container, built from the repository root |
| `vercel.json` | Frontend build and single-page-app routing |
| `.github/workflows/deploy-backend.yml` | Validation workflow, despite its filename |

Production hosting is Vercel for the website and Google Cloud Run for the API.
Deployment dashboards and private runtime variables were not inspected in this check.

Website: `https://thenobiasmedia.com`.
API origin: `https://thenbm-329287861933.asia-south1.run.app`.
Public health, feed, article and source requests to this origin returned 200 on
23 October 2026. Recheck it before configuring a different environment.
An API client base URL includes `/api`; PUBLIC_API_URL does not.

## Local setup

Use Node.js 24.x for local development and builds. The root, frontend, and backend
packages declare `engines.node: "24.x"`; GitHub Actions reads `.node-version`, and
the backend container uses `node:24-alpine`. Use your Node version manager to
select Node 24 before installing dependencies or running checks.

Vercel supports Node 24.x and uses the root package's engine declaration for the
existing repository-root deployment. Keep the Vercel Root Directory at the
repository root. `vercel.json` installs with `npm ci --prefix frontend`, builds
with `npm run build --prefix frontend`, and publishes `frontend/build`. This
preserves the frontend lockfile and does not install the Cloud Run backend.
The project can also select 24.x under Vercel Settings > Build and Deployment >
Node.js Version; the package engine declaration controls new deployments.

Create a private `backend/.env` with development database and signing secrets,
plus sandbox payment settings if payments are being tested. Keep secrets out of Git.
Set frontend build variables in its environment or `frontend/.env.local`.

From the repository root:

```sh
cd backend
rtk npm ci
rtk npm test
rtk npm run dev
```

In another terminal:

```sh
cd frontend
rtk npm ci
rtk npm start
```

Defaults: frontend `http://localhost:3000`; backend `http://localhost:5002`;
frontend API base `http://localhost:5002/api`. Backend routes are registered during
initialization, but the HTTP server listens only after MongoDB connects. This keeps
cold-start requests out of Mongoose's query buffer and prevents Cloud Run's default
TCP startup probe from reporting readiness before the database is available.
GET `/api/health` returns 200 when connected and 503 after a disconnect.

## Backend configuration

| Variable | Meaning |
|---|---|
| `MONGODB_URI` | Private MongoDB connection string |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Private authentication signing secrets |
| `NODE_ENV` | `production` for the deployed API |
| `PORT` | Provided by Cloud Run; container default 8080; local server default 5002 |
| `PUBLIC_API_URL` | Public backend HTTPS origin, without `/api` or trailing slash |
| `FRONTEND_URL` | Public website HTTPS origin, without trailing slash |
| `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT` | Matching merchant credentials for the chosen environment |
| `PAYU_MODE` | `test` or `live`; set explicitly in production |
| `PAYU_DBQR_ENABLED` | `true` only if PayU DBQR is activated; affects web UPI QR, not native app fields |
| `PAYMENT_ENABLED_GATEWAYS` | Comma-separated `payu`, `phonepe`, or both; native app needs PayU enabled |
| `PAYMENT_PAYU_WEIGHT`, `PAYMENT_PHONEPE_WEIGHT` | Positive relative selection weights for eligible gateways |
| `PHONEPE_MODE` | `sandbox` or `live` |
| `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, `PHONEPE_CLIENT_VERSION` | PhonePe-issued OAuth credentials/version; use the provider's actual version value |
| `PHONEPE_WEBHOOK_USERNAME`, `PHONEPE_WEBHOOK_PASSWORD` | Match PhonePe webhook dashboard credentials |
| `PHONEPE_AUTH_URL`, `PHONEPE_API_BASE_URL` | Optional endpoint overrides; normally use mode-selected defaults |

Put merchant salt, passwords, client secrets and database credentials in runtime
secrets. The merchant key may appear in checkout fields; its salt must not.
Native `platform: "app"` uses PayU. Web uses configured gateways; PayU can redirect
for supported methods, or return a UPI QR when DBQR is enabled. Older statements
that every web card/net-banking payment always uses PhonePe no longer match code.

## Frontend and Google sign-in configuration

| Build variable | Value |
|---|---|
| `REACT_APP_API_URL` | Verified backend origin plus `/api` |
| `REACT_APP_OAUTH_CLIENT_ID` | Public Google Web OAuth client ID for this environment |

`REACT_APP_*` values are embedded into the public frontend bundle. Never put
backend secrets in them. Rebuild/redeploy Vercel after changing build variables.
Set preview environment values deliberately rather than inheriting live payment
credentials by accident.

The website uses Google's popup access-token flow. In Google Cloud Console, open
the exact OAuth client configured above and authorize `https://thenobiasmedia.com`
as a JavaScript origin. Add other actual browser origins as needed, including
`http://localhost:3000` for development. Origins have no path or trailing slash.
The current popup flow does not use a redirect URI. An OAuth client change also
requires a frontend rebuild if its ID changes.

CORS currently uses an explicit allowlist in [server.js](../backend/src/server.js):
the two website origins and `http://localhost:3000`. Changing `FRONTEND_URL` alone
does not add a new CORS origin. Authentication cookies use `Secure`, `HttpOnly`,
and `SameSite=None`; verify local cookie handling before debugging protected
endpoints. Public news endpoints do not require a cookie.

## Domains

Add both `thenobiasmedia.com` and `www.thenobiasmedia.com` to the Vercel project.
Use the DNS values shown by that project's dashboard, rather than old hard-coded
IP/CNAME examples. Verify TLS and DNS for both names. Current `vercel.json`
redirects the www root to the non-www root; verify www deep links separately,
since that root-only rule is not proof of a site-wide redirect.

A custom API domain is optional. Before adopting one, confirm DNS/TLS, update
PUBLIC_API_URL and frontend/mobile API settings, and update gateway callback URLs.

## Build, callbacks and deployment

1. Run backend tests (`rtk npm test` in backend), frontend tests, and the frontend
   production build. Review the changes intended for release. From the root:

   ```sh
   rtk npm test --prefix backend
   rtk npm test --prefix frontend -- --watchAll=false --runInBand
   rtk npm run build --prefix frontend
   ```
2. Build the backend container from the repository root so `COPY backend/...`
   paths resolve. Configure Cloud Run's runtime secrets and URLs independently
   from the frontend's public build variables. Set `PUBLIC_API_URL` to the API
   origin so generated image and payment URLs use the canonical HTTPS host.
   Release the backend first, then the frontend; new image URLs require the
   image endpoint in the backend revision.
3. Verify the project's Cloud Build trigger and Vercel deployment settings. The
   repository's GitHub validation workflow checks backend syntax, runs the backend
   and frontend regression suites, builds Docker, and builds the frontend. It does
   not deploy to Google Cloud. Documentation-only changes do not match its path filters.
4. Configure PayU callback URLs:
   - `{PUBLIC_API_URL}/api/payments/payu/success`
   - `{PUBLIC_API_URL}/api/payments/payu/failure`
   - `{PUBLIC_API_URL}/api/payments/payu/webhook` where supported by the merchant product.
5. Configure PhonePe webhook:
   `{PUBLIC_API_URL}/api/payments/phonepe/webhook`. Authorization is SHA-256 hex
   of the configured `username:password`; the backend also checks provider status.
6. After deployment, verify `/api/health`, `/api/news`, browser API requests,
   Google sign-in and the payment scenarios in guide 3. Local tests are not proof
   that the production SDK, merchant products or callbacks are configured correctly.

Latest local validation on October 23, 2026: 49 backend tests, 27 frontend tests,
and a successful production frontend build. No deployment or live payment was
performed. See [operations](03-OPERATIONS-AND-RELEASE.md) for release verification
and [performance](04-PERFORMANCE.md) for the new reader/image behavior.
