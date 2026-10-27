# 2. Client APIs and payments

Reviewed October 23, 2026. This is the shared website/mobile client contract.
Reader and performance changes described here require the local backend changes
to be deployed. The current mobile source was not available or tested.

Use the backend donation status as the source of truth. The SDK success, failure,
cancellation, or 5019 error callback is a signal to check status, not permission
to create another charge. The React Native application is maintained separately
and has not been tested here.

## Connection and sign-in

Use the verified API origin from [guide 1](01-PROJECT-AND-DEPLOYMENT.md), with
`/api` included once in apiBase. Confirm the API base for the release environment. The current React Native app
is maintained separately; validate its installed SDK and network client.

POST `/api/auth/googleSignIn` with a Google OAuth **access token**, not an ID token:

```json
{ "accessToken": "<Google-access-token>" }
```

The backend also accepts `access_token` or `token`. It fetches Google's userinfo,
requires a verified email and returns success/user metadata. Authentication uses
an HTTP-only `access_token` cookie; the JSON token value `"Active"` is not a JWT
and must not be used as a Bearer token. The mobile HTTP client must preserve the
cookie if it needs authenticated endpoints. Token verification is
POST `/api/auth/verifyAccessToken` with that cookie. Current website clients use
GET `/api/auth/session`, returning `{ user: { email, role, name } }` or 401, and
POST `/api/auth/logout`, returning 204 and expiring the cookie. Logout does not
revoke other copies of an already-issued JWT.

The backend retries Google's userinfo read once for temporary network failures,
timeouts, HTTP 429, or HTTP 5xx. Each attempt has a 4.5-second timeout, with a
150-ms delay between attempts. Invalid credentials are not retried. A persistent
Google failure returns 503, not an invalid-token 401; no session is issued until
Google returns a verified email and the user record is saved. Mobile clients
should keep sign-in pending until the backend responds, preserve the returned
cookie, and distinguish 503/network failures from invalid credentials. This
backend change requires deployment; the current mobile implementation remains
unverified without its source or a failing request log.

Public news APIs need no authentication:

| Request | Result |
|---|---|
| GET `/api/news?page=1` | Ten articles per page, currentPage, totalPages |
| GET `/api/category/:cat?page=1` | Category articles; URL-encode the category |
| GET `/api/news/:id` | One article |
| GET `/api/news/:id?source=true` | Article with source data |
| GET `/api/source` | Available source types |

Check non-2xx responses. Do not substitute mock news for production failures.
The admin write endpoints are not part of the mobile reader integration.

Reader details contract: both `/api/news/:id` and `/api/news/:id?source=true`
return a single article object, including `_id`, `title`, `summary`, and `content`.
The latter also includes `source` as an array; an article without sources has an
empty array. These endpoints are public and require no login. Use the article's
`_id` from the feed when navigating; do not pass a page number or an undefined ID.
Malformed IDs return 400 and unknown article IDs return 404.

The deployed API base checked on 23 October 2026 is
`https://thenbm-329287861933.asia-south1.run.app/api`. All mobile requests must
use the same base, including details and sources. The current mobile source was
not available for this backend change, so its button handlers, navigation and
on-device latency remain unverified. Deploy the backend change before relying
on the expanded sources response.


## Smaller reader responses

After deploying the backend optimization, opt into compact feeds with
`GET /api/news?page=1&view=feed` or
`GET /api/category/:cat?page=1&view=feed`. These preserve article IDs, titles,
complete summaries, categories, timestamps and pagination, and omit full bodies
and sources. Fetch full bodies only on the detail screen:
`GET /api/news/:id?media=url`. Add `source=true` to include source data.
The default endpoints retain their previous body and inline-image format for
older clients. No mobile source changes were included in this optimization.

In compact feeds or with `media=url`, embedded uploads become absolute HTTPS
image URLs. The image endpoint is public, sends the original image bytes with
an ETag, and caches matching version URLs for one day. An article edit changes
its image URL version. External image-host URLs pass through unchanged. Keep
`PUBLIC_API_URL` set to the canonical backend origin without `/api`; a proxy
must preserve the host if that setting is absent. Deploy the backend before
releasing clients that request image URLs.

## Donation request and responses

POST `/api/donations` with JSON:

```json
{
  "firstname": "Test Donor",
  "email": "donor@example.org",
  "phone": "9876543210",
  "amount": "19.99",
  "method": "upi",
  "platform": "app",
  "idempotencyKey": "<stable-UUID-for-this-donation>"
}
```

Amount: ₹10–₹1,00,000, at most two decimal places. Name: 2–100 characters.
Phone: Indian ten-digit mobile starting 6–9. Methods: upi, card, netbanking, all.
Key: 16–128 letters/digits/underscores/hyphens. Amounts return as decimal strings.
Creation returns id, amount, method, platform, status, gateway, transactionId and
checkout null. Repeating a key with different donation details returns 409.

A new successful checkout returns the same metadata plus checkout. Native
checkout is `type: "payu_form"` with url and fields. Status reads omit checkout.
Repeat or settled checkout returns 409 with checkout null, code, message and
nextAction check_status. No client should infer success from an SDK callback,
a redirect query parameter, or the presence of old checkout fields. See [performance](04-PERFORMANCE.md) for
reader caching; payment and session traffic stays on the network.

## Keep one donation ID and idempotency key for the unresolved donation

Generate a UUID (using a React Native compatible UUID library) once when the user
starts a new donation. Persist the UUID, donation ID, and active transaction ID
until the outcome is resolved. Reuse the key when retrying a failed HTTP request;
do not generate a new key on every tap, screen render, or SDK callback. A fresh
key represents a genuinely new donation, not a retry of an unresolved payment.

POST `/api/donations` with firstname, email, phone, decimal amount, method,
`platform: "app"`, and idempotencyKey. Check `response.ok` before using the JSON.
This endpoint returns donation metadata and `checkout: null`, even on retries.

## Start the SDK only from a new successful checkout response

POST `/api/donations/:id/checkout` once from an explicit checkout action. Disable
the action while it is running. Save transaction IDs already opened in the SDK
so rerenders and duplicate event listeners cannot open the same transaction twice.

```js
const response = await fetch(`${apiBase}/donations/${donationId}/checkout`, {
  method: 'POST'
});
const data = await response.json();
if (response.status === 409) {
  // ALREADY_PAID, PAYMENT_PENDING, or PAYMENT_UNVERIFIED: no SDK fields.
  navigation.navigate('DonateStatus', { donationId });
  return;
}
if (!response.ok) {
  // A timeout can leave a charge in progress. Resolve status before retrying.
  navigation.navigate('DonateStatus', { donationId });
  return;
}
if (data.status !== 'pending' || data.checkout?.type !== 'payu_form') {
  throw new Error('Expected a new native PayU checkout session');
}
const fields = data.checkout.fields;
// Build the installed SDK's parameters using fields.key, fields.txnid,
// fields.amount, fields.productinfo, fields.firstname, fields.email, fields.phone,
// fields.surl and fields.furl exactly. Match its environment to checkout.url:
// secure.payu.in = live; test.payu.in = test. Do not hard-code merchant keys.
// Open the SDK only if fields.txnid has not already been opened.
```

Native app donations select PayU and return form fields even when web QR is
configured. Web checkout continues to support configured PayU and PhonePe flows.

## Handle every result callback by checking status

`onPaymentSuccess`, `onPaymentFailure`, `onPaymentCancel`, and `onError` (including
5019) should navigate to the status screen and check
GET `/api/donations/:id/status`. If the app only has the transaction ID, use
GET `/api/donations/by-txnid/:txnid`. Neither callback should call checkout or
reopen cached checkout fields. Register listeners once and remove them on unmount.

Poll pending status every ten seconds. After a bounded wait, offer a manual
status refresh or support; do not automatically create another payment. A 409
with `code: "ALREADY_PAID"` is a completed payment, not a payment failure.

POST `/api/donations/:id/cancel` now verifies the provider outcome:

- 409 / ALREADY_PAID: show success from the status endpoint.
- 202 / PAYMENT_PENDING or PAYMENT_UNVERIFIED: wait and check status.
- 200 / `nextAction: "retry_checkout"`: a retry of the same donation is permitted;
  checkout generates a new transaction ID. Never reuse the old SDK fields.

The backend never marks a payment failed solely because the SDK reports cancellation.

## Dynamic hashes

POST `/api/payments/payu/hash` with the original SDK hashName, hashString, hashType,
and optional payment-only postSalt. Check the HTTP status before calling the
installed SDK's hash completion method. Do not send error bodies to the SDK.

Native Checkout Pro sends `payment_source` for its full payment hash. The backend
accepts both `payment_source` and the legacy `payment_hash` name through the same
transaction validation, returning the hash under the exact requested name. Both
are signed only for an existing pending PayU transaction, matching
its checkout amount, product, name, email, and empty UDFs. Equivalent decimal
amounts (`50`, `50.0`, `50.00`) are accepted; the original SDK string is signed
without reformatting. Settled sessions return 409 and must go to status.

Auxiliary hashes require the exact configured merchant key and command matching
the callback name in `key|command|var1|` format. Supported names:
`getBinInfo`, `validateVPA`, `get_checkout_details`,
`get_eligible_payment_options`, `get_sdk_configuration`, `get_all_offer_details`,
`quickPayEvent`, `eligibleBinsForEMI`, `payment_related_details_for_mobile_sdk`,
`vas_for_mobile_sdk`, `binBaseDetails`, `check_isDomestic`, `check_offer_details`,
and `getEmiAmountAccordingToInterest`. Unknown names and formats return 400.
`payment_source` is a payment hash, never an auxiliary `key|command|var1|` hash.

V1 (also the default for an omitted, null, or empty hashType) returns the hex
SHA-512 of `hashString + merchantSalt + postSalt`. V2 returns the hex HMAC-SHA256
of the original hashString, with the server's merchant salt as its key. Both
versions enforce the same merchant/command and payment-session checks above;
this does not authorize arbitrary opaque strings. Nonempty postSalt is supported
only for V1 payment hashes; absent, null, and empty postSalt are treated as absent.
Special-purpose hashes such as `lookup api hash` remain unsupported.

Mobile initialization compatibility was updated October 27, 2026. Previously,
the initialization names above were rejected, as were all V2 requests and SDK
payment amounts formatted without two decimal places. These rejections can leave
Checkout Pro waiting for a hash. The update requires backend deployment; the
actual app's failing callback and on-device behavior have not been verified.
Algorithm references: [PayU dynamic hashing](https://docs.payu.in/docs/generate-dynamic-hash-react)
and [PayU V2 hashing](https://docs.payu.in/docs/hash-generation-for-checkoutpro-sdk#v2-hashes).

For this API, a successful hash response is `{ [hashName]: "<hex hash>" }`.
Pass that map to `PayUBizSdk.hashGenerated`, rather than reading `response.hash`.
Forward hashName, hashString, hashType, and postSalt from the SDK callback, and
handle HTTP errors with a bounded timeout so the app cannot wait indefinitely.
For React Native 0.82+, check PayU's current
[Android integration instructions](https://docs.payu.in/docs/reactnative-checkoutpro-android-integration)
for its `PayUBizSdk.makeHttpRequest` networking requirement. The mobile source is
outside this checkout; these client changes cannot be applied here.

## UPI processing regression corrected October 27, 2026

The native SDK's `PayuConstants.PAYMENT_SOURCE` value is `payment_source`.
`HashGenerationHelper.getPaymentHashData` sends the complete transaction string
under that name when starting payment. Previously this API mistakenly classified
`payment_source` as an auxiliary command and rejected that full string with 400.
This can leave Checkout Pro waiting for a hash after the user selects UPI.
The route now applies the existing pending-session, donor, amount, merchant, and
UDF checks to both payment hash names. It preserves the SDK callback name in the
response, so the mobile client can pass it directly to `hashGenerated`.

Also restored the native SDK's read-only `vas_for_mobile_sdk` initialization
command and the other supported read-only commands listed above. Merchant and
command binding remain required. Payment verification continues on the server;
this change does not permit signing refund, capture, cancellation, or arbitrary
commands.

Verified against published source artifacts `in.payu:payu-checkout-pro:3.3.13`
and `in.payu:payu-sdk:7.12.9`, which are used by the current published React Native
package. The app's installed SDK version and its actual failing request remain
unavailable. Deploy this backend correction and test on-device; local regression
tests do not establish that the installed app has completed a payment.

## Backend validation and release

Run `rtk npm test --prefix backend` from the repository root. Tests use fake credentials and mocked providers;
no live payment is made. Deploy the backend changes before using this contract.
Then test one real app payment with the actual installed SDK, confirm status,
and confirm duplicate callbacks do not reopen checkout. Error 5019 alone does
not establish which layer reused the transaction; provider responses and app
network logs are still needed for production diagnosis.


## Response handling reference

| Endpoint/result | Client action |
|---|---|
| Creation 400 | Correct validation errors; do not launch SDK |
| Creation 409 | Key belongs to different details; resolve the existing donation |
| Checkout 200 with pending/payU form | Open SDK once for the newly issued txnid |
| Checkout 409 ALREADY_PAID | Go to status; show confirmed success |
| Checkout 409 PAYMENT_PENDING/PAYMENT_UNVERIFIED/PAYMENT_RESOLVED | Go to status; do not reopen old fields |
| Checkout 503 or network timeout | Check status before another attempt |
| Cancel 202 | Keep donation/key; continue status checks |
| Cancel 200 retry_checkout | Retry checkout for this donation, using its new txnid |
| Hash 400 | Unsupported/mismatched SDK input; inspect a redacted callback |
| Hash 404/409 | Resolve the session via status, not cached fields |
| Hash 429 | Back off; do not retry in a tight loop |
| Hash 503 | Report temporary backend unavailability; preserve the donation |

For older web integrations only: POST `/api/payments/create`, GET
`/api/payments/:txnid` and POST `/api/payments/:txnid/verify` remain implemented.
New mobile integrations should use the donation endpoints above. The legacy
create endpoint is not the donation idempotency contract.

Backend details and credentials belong in guide 1; testing, support and release
checks belong in [guide 3](03-OPERATIONS-AND-RELEASE.md). Archived guides do not override the supported hash formats and algorithms listed
in this guide. Collect a redacted callback and its HTTP error before extending
support for another format.
