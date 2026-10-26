# 3. Operations and release

Reviewed October 23, 2026. Use [setup](01-PROJECT-AND-DEPLOYMENT.md) for environments,
[client APIs](02-MOBILE-AND-PAYMENTS.md) for integration, and
[performance](04-PERFORMANCE.md) for caching and publishing behavior.

## Verification status

| Evidence | Result and limits |
|---|---|
| Latest backend suite | 49 tests passed; local servers, in-memory models, and mocked providers |
| Latest frontend suite | 27 tests passed; no physical-device coverage |
| Frontend production build | Passed locally; not proof of a successful hosted release |
| Public API reads on October 23 | Health, feed, detail, and sources returned 200 before deployment of the local changes |
| Release state | Local changes prepared; no deployment, live payment, or production index migration performed |
| Mobile app | Current source unavailable; current app navigation and startup unverified |

## Release checklist

1. Review the diff and confirm the intended API origin and payment environment.
   Run from the repository root:

   ```sh
   rtk npm test --prefix backend
   rtk npm test --prefix frontend -- --watchAll=false --runInBand
   rtk npm run build --prefix frontend
   ```

2. Run checks with Node 24.x, matching the package engines, `.node-version`,
   GitHub Actions, Docker, and Vercel configuration documented in guide 1.
   The GitHub validation workflow runs both regression suites and builds
   Docker/frontend; it does not deploy. Do not assume a passing workflow changes
   the hosted service.
3. Release the backend first, with the correct runtime secrets and canonical
   `PUBLIC_API_URL`. Verify its revision and `/api/health`. Verify compound news
   indexes exist; schema declarations alone do not prove deployment or index creation.
4. Release the frontend with the intended `REACT_APP_API_URL` and OAuth client ID.
   Test home/category feeds, full summaries, Read More, Sources, source links,
   direct legal-page URLs, sign-in, logout, bookmarks, and consent settings.
5. Test publishing in a test environment: upload and URL images, invalid images,
   create/edit/delete, immediate admin feedback, and live reader refreshes.
   Confirm compact-feed images and full articles after page reload/reconnect.
6. Inspect the service worker and a clean browser session. Check API/session/payment
   requests use the network. Compare loading on a throttled mobile connection;
   local payload reductions are not a production speed measurement.
7. In provider sandboxes, check success, decline, cancellation, timeout, delayed
   callbacks, and duplicate callbacks for each enabled gateway. Native PayU must
   still receive SDK form fields when web QR is enabled.
8. Test double-taps, reopened screens, lost checkout responses, and retries after
   success. Never reopen old transaction fields or replace an unresolved donation
   with a new idempotency key. Verify amounts and that confirmed success survives
   a concurrent failure/cancel signal.
9. Verify provider callbacks and the separately maintained app against the released
   backend. Any controlled live transaction needs its actual provider outcome
   checked; retain redacted evidence rather than inferring settlement from a screen.

## Website and hosting troubleshooting

| Symptom | Check |
|---|---|
| Empty news or API error | Actual browser request URL, `/api` suffix, response status, health, and MongoDB connectivity |
| Slow initial request | Cloud Run startup traces, MongoDB connection time/region, payload size, and external image hosts |
| Reader image fails | Release the image endpoint before its clients; verify `PUBLIC_API_URL`, image request status, and remote-host accessibility |
| Old page after release | Released asset hashes, service-worker registration/cache, hard refresh, and a clean session |
| Google `origin_mismatch` | Exact browser origin and OAuth client ID in the deployed frontend build and Google Console |
| Sign-in or logout fails | Cookie delivery, HTTPS, cross-site cookie restrictions, session/logout response, and the configured CORS allowlist |
| Read More or Sources fails | Same API base as the feed, article `_id`, HTTP status, and expected object response; app navigation needs current app logs/source |

The backend listens after MongoDB connects. Health returns 200 while connected
and 503 after disconnect. Cloud Run can still cold-start; a minimum instance
can reduce startup waits but adds cost. Hosting settings were not changed here.

The service worker uses `nobias-media-cache-v7`. It caches public static assets,
uses network-first navigation with an offline shell fallback, and bypasses API,
session, payment, non-GET, and cross-origin requests. Offline shell availability
does not mean articles or payments work offline. Image HTTP caching is separate;
see guide 4.

## Sessions, consent, and live feeds

- The website verifies its HttpOnly cookie through `/api/auth/session` and expires
  it through `/api/auth/logout`. There is no server-side JWT revocation registry.
- Optional analytics stays disabled until explicit acceptance in `cookieConsentV2`.
  Old timer-based choices are requested again. Cookie settings allows withdrawal;
  legacy `cookieConsent` and `cookieConsentDate` are also written for compatibility.
- Article mutations emit `article:created`, `article:updated`, and `article:deleted`.
  Home/category feeds reset to page one after mutations and reconnects, and discard
  older in-flight responses. The first connection reuses the initial HTTP load.
  The legacy `newArticle` event remains available.

## Payment troubleshooting

Record donation ID, transaction ID, gateway/environment, callback timestamp,
endpoint, and HTTP status. Compare provider records with redacted backend/app logs.
Never record salts, tokens, full payment credentials, or unnecessary personal data.

| Symptom | Response |
|---|---|
| SDK error 5019 after success | Read server status; confirmed success must not reopen the SDK. Compare transaction IDs and checkout calls |
| Checkout 409 | Follow `code` and `nextAction`; already-paid/unresolved payments have no reusable checkout fields |
| Cancel returns 202 | Outcome is pending or unavailable; keep the donation/key and check status |
| Timeout or missing provider record | Reconcile status and callbacks; absence alone is not proof of failure |
| Provider success but local failure | Check credentials/mode, returned amount/amt, and server-side reconciliation |
| Hash 400 | Check the exact V1 callback, merchant key, command format, and original checkout fields; see guide 2's allowlist |
| Hash 409 | Session is settled; check status instead of using cached fields |
| Native response lacks SDK fields | Check `platform: "app"` and PayU enablement |
| Invalid response hash | Match credentials/environment and payload; never bypass verification |

Poll pending status every ten seconds with a bounded wait and manual refresh/support
fallback. A provider-verified failure permits a new transaction for the same donation.
An SDK cancellation alone does not establish failure. Full response handling and
supported hash commands belong in [guide 2](02-MOBILE-AND-PAYMENTS.md).

## Refunds, support, and public policies

There is no automated refund API. Reconcile the payment and process approved
refunds through the provider dashboard. Confirm the actual provider reference and
processing status; closing the SDK is not a refund. Published refund wording
currently includes a two-day timeline and physical-goods language; the owner must
resolve that mismatch for a donation-based news product before promising a timeline.

| Public page | Path |
|---|---|
| Privacy | `/privacy-policy` |
| Terms | `/terms-conditions` |
| Refunds | `/refund-policy` |
| Account deletion | `/delete-account` |
| Copyright claims | `/copyright-claims` |
| Contact | `/contact` |
| About | `/about` |

Support is `contact@thenobiasmedia.com`. Public policy/business content lives in
`frontend/src/pages/`; verify the published identity, address, commitments, and URLs
with the owner before gateway/store submissions. Static pages are not proof of
legal compliance, provider approval, or implemented operational processes.

For deletion/export, verify the requester, record the request, apply the approved
retention policy across database records, sessions, local device data, and backups,
and confirm completion. No account-deletion/deactivation API is implemented; the
page describes an email process.

For copyright requests, record the article URL, claimed work, identity, evidence,
and requested action. Confirm published response commitments before promising
one; preserve evidence, assess permissions, and record any correction/removal.
Escalate disputed formal notices to the responsible owner/adviser.

For store submissions, inventory the actual released app's SDKs/data and verify
working privacy, support, and deletion flows. Do not copy archived claims that all
data is optional, never shared, or that account purge/recovery is automated. No
current app package, signing, SDK, or store readiness was verified in this work.

## Open issues and maintenance

- Admin login credentials remain hard-coded in the backend source. Replacing
  them is separate implementation work; do not copy their values into docs.
- Runtime versions differ between the frontend package, CI, and Docker image.
- Published policy wording and the operational deletion/retention process need
  owner review. Image format/resolution checks do not verify copyright or authenticity.
- A merchant salt was previously exposed in historical material. Redaction does
  not revoke it; the owner must confirm rotation and assess earlier shared copies/history.
- `backend/scripts/update-source-types.js` writes to MongoDB. A verified target,
  backup, and reviewed maintenance plan are needed before running it.

Maintain the four guides linked from the root README. Keep environment settings
in guide 1, client contracts in guide 2, operations here, and performance in guide 4.
Archived material is historical and must not override current code or verified runtime facts.
