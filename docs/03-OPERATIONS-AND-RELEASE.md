# 3. Operations, troubleshooting and release

Updated 8 October 2026. Use [guide 1](01-PROJECT-AND-DEPLOYMENT.md) for setup and
[guide 2](02-MOBILE-AND-PAYMENTS.md) for the client contract. This guide replaces
historical checklists and compliance summaries; it does not certify provider or
app-store approval.

## Payment diagnosis

Record donation ID, txnid, gateway, environment, callback timestamp, endpoint and
HTTP status. Compare backend logs with the provider's transaction dashboard and
redacted app network logs. Do not record merchant salt, tokens, full payment
credentials or unnecessary personal data in support logs.

| Symptom | Check and response |
|---|---|
| Error 5019 after a successful payment | Check server status. If successful, display success and do not reopen the SDK. Compare repeated txnids and checkout calls; the error alone does not prove the app's request sequence. |
| Checkout 409 | Read code and nextAction. Already-paid or unresolved payments deliberately return no checkout fields. |
| Cancel returns 202 | Provider outcome is pending/unavailable. Do not generate a new key or launch another charge. |
| Pending after a timeout | Poll status, check provider/callback logs, then use support reconciliation. An absent provider record is not proof of failure. |
| Payment succeeded but local record says failed | Status checks reconcile legacy failed records with PayU. Check provider credentials/mode and the returned amount/amt. |
| Hash request returns 400 | Confirm exact callback name, supported format, merchant key and unchanged checkout fields. Unknown callbacks need validation, not arbitrary signing. |
| Hash request returns 409 | Session is settled; go to status. |
| No mobile SDK fields | Confirm platform app and PayU enabled. Web DBQR must not substitute a QR payload for mobile fields. |
| Invalid response hash | Check matching key/salt/mode, unchanged callback payload and provider format. Never bypass hash validation to mark success. |

A provider-verified failure allows checkout to issue a fresh txnid for the same
donation. A new idempotency key is for a genuinely new donation after the old one
is resolved. Browser/SDK errors do not establish that a charge failed.

## Website and hosting diagnosis

For empty news or API errors, inspect the browser's actual request URL. Check
REACT_APP_API_URL ends in /api and was included in the deployed frontend build.
Check `/api/health` and MongoDB connectivity. CORS allows the configured website
origins and localhost; new origins require an intentional server configuration
change. For Google origin_mismatch, compare the deployed OAuth client ID and exact
browser origin with Google Console, then rebuild if the client ID changes.

Old Render cold-start reports are historical. If the current service is Render,
inspect its actual tier/idle behavior; for Cloud Run, inspect instance settings
and latency. Do not treat old percentages, timeout measurements or keep-alive
claims as current observations. Avoid automatically retrying a payment because
hosting is slow.

The website registers `/service-worker.js`, currently using cache version v4.
For stale pages, inspect registration and Cache Storage, test a hard refresh,
and compare against a clean browser session. Navigation uses network-first with
an offline shell fallback; this is not a guarantee that all articles work offline.
Do not allow payment/status responses to be served as cached confirmation.

CookieConsent stores cookieConsent and cookieConsentDate in local storage.
The current component automatically accepts after one second; it is not a
verified opt-in tracking gate. Earlier claims of GDPR/CCPA compliance or guaranteed
performance gains are not supported by this implementation.

## Release checks

1. Backend: run `rtk npm test` in backend. The latest payment changes passed 27
   tests using local test servers, fake credentials and in-memory/provider mocks.
   No live MongoDB settlement or actual React Native SDK was exercised.
2. Frontend: run tests with watch disabled and run its production build. Confirm
   normal news routes, direct legal-page links, donation page and status page.
3. Sandbox payments: test success, decline, user cancel, provider timeout,
   callback delay and duplicate callbacks. Check PayU SDK fields when web QR is
   enabled. Check PhonePe web checkout separately if enabled.
4. Retry tests: double-tap checkout, refresh/reopen, lose the checkout HTTP
   response, and retry after success. Confirm no old txnid is reopened and no
   unresolved donation is replaced by a fresh idempotency key.
5. Settlement: confirm provider amount equals the stored donation amount, success
   survives concurrent failure/cancel, and pending does not display success.
6. Deployment: inspect released revision and runtime settings, verify health and
   callback delivery, then conduct a controlled live transaction using the actual
   merchant account and separately maintained app. Retain redacted evidence.

There is no automated refund API in the current backend. Reconcile the transaction
and process approved refunds through the provider's dashboard; confirm the provider
reference and communicate the actual processing status. Cancelling an SDK screen
is not a refund. Do not promise the historical 5–7-day timeline: the current refund
web page states two days and includes physical-goods language. The owner must
resolve this policy mismatch for a donations-only news product.

## Public pages and business details

| Page | Production path |
|---|---|
| Privacy policy | /privacy-policy |
| Terms | /terms-conditions |
| Refund policy | /refund-policy |
| Account deletion | /delete-account |
| Copyright claims | /copyright-claims |
| Support/contact | /contact |
| About | /about |

Website: https://thenobiasmedia.com. Support: contact@thenobiasmedia.com.
Existing published address: The NoBias Media, 75–76 West Guru Angad Nagar, near
Nirman Vihar Metro Station, Delhi 110092, India. Verify owner-approved business
identity/address before gateway or store submission.

Keep public policy content in `frontend/src/pages/` as the source for what users
are told. Verify these URLs on the deployed website rather than relying on an old
"completed" label. Keep provider submissions and app disclosures consistent with
the actual product, data flows and approved policies.

## App-store submission

Provide working privacy, support and deletion URLs. Check the actual app has the
required account-deletion flow and that support can fulfil requests. The backend
currently has no account-deletion/deactivation endpoint; the web page describes an
email process. Earlier documents' claims that automated deactivation, grace-period
recovery, purge and confirmation emails are implemented are not evidence.

Complete Google Play Data Safety and Apple privacy disclosures from an inventory
of the released app's SDKs and data: Google sign-in/profile, donation contact data,
bookmarks, diagnostics, analytics and any third-party processing. Do not copy old
forms claiming all data is optional or never shared. Verify provider and platform
requirements at submission time, including login and deletion requirements.

The repository Expo sample has bundle/package ID com.nobiasmedia.app and currently
builds APKs in its EAS production Android profile. Store packaging/signing must be
verified for the actual app; that sample is not proof Anurag's payment build is
ready for Google Play or Apple. Keep screenshots, branding, versioning, rating,
reviewer access instructions and privacy information aligned with the release.

## Support, deletion and copyright operations

For deletion/export requests, verify the requester through the registered Google
account, record the request, remove or retain data according to the approved policy,
and confirm completion. Check database records, bookmarks/local device data,
sessions and backups separately. Payment/accounting retention and session revocation
need an actual operational process; do not infer them from a static policy page.

For copyright complaints, record the article URL, claimed work, claimant identity,
proof and requested action. The historical internal target was acknowledgment
within 48 hours and review within 1–3 business days; confirm the current published
policy and achievable commitments. Preserve evidence, assess permissions, remove
or correct content when appropriate, and record the resolution. A policy page does
not establish fair use or DMCA safe-harbor protection. Escalate disputed or formal
legal notices to the responsible owner/legal adviser rather than promising immunity.

For the source-type migration, `backend/scripts/update-source-types.js` replaces
Conservative labels with Traditionalist in matching articles. It writes to MongoDB:
use a verified target database, backup, and reviewed maintenance plan before running
it. Validate changes afterwards. Old EC2/PM2 examples apply only if that deployment
actually exists; they are not Cloud Run instructions.

## Known gaps and credentials

The previous review found hard-coded admin login credentials and frontend sign-out
that does not clear the authentication cookie; the payment fixes did not address
those issues. The runtime version mismatch, cookie auto-acceptance and policy
mismatches above also remain. Schedule changes separately rather than presenting
this documentation update as a fix.

An old mobile guide contained a plaintext merchant salt. It has been redacted from
the documentation archive and is not included in the active guides. Rotate that
credential through the provider and runtime secret configuration, and assess Git
history or previously shared copies; moving/redacting files does not revoke it.

## Documentation ownership

Maintain only these three guides as the active operating references. README is
an index. `docs/archive/` preserves superseded material for history, with sensitive
values redacted; do not use it to override the source code or current deployment.
Update guides with behavior changes and distinguish code-supported behavior,
local test results and production observations.
