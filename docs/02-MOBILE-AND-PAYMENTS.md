# 2. Mobile API and payment integration

Use the backend donation status as the source of truth. The SDK success, failure,
cancellation, or 5019 error callback is a signal to check status, not permission
to create another charge. The React Native application is maintained separately
and has not been tested here.

## Connection and sign-in

Use the verified API origin from [guide 1](01-PROJECT-AND-DEPLOYMENT.md), with
`/api` included once in apiBase. The documented Cloud Run URL must be verified
against the actual release environment. Anurag's app is not the Expo sample in
this repository; validate against his installed SDK and network client.

POST `/api/auth/googleSignIn` with a Google OAuth **access token**, not an ID token:

```json
{ "accessToken": "<Google-access-token>" }
```

The backend also accepts `access_token` or `token`. It fetches Google's userinfo,
requires a verified email and returns success/user metadata. Authentication uses
an HTTP-only `access_token` cookie; the JSON token value `"Active"` is not a JWT
and must not be used as a Bearer token. The mobile HTTP client must preserve the
cookie if it needs authenticated endpoints. Token verification is
POST `/api/auth/verifyAccessToken` with that cookie.

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
a redirect query parameter, or the presence of old checkout fields.

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

`payment_hash` is signed only for an existing pending PayU transaction, matching
its checkout amount, product, name, email, and empty UDFs. Settled sessions return
409 and must go to status. Auxiliary hashes require the exact configured merchant
key and command matching the callback name in `key|command|var1|` format. Supported
names: getBinInfo, validateVPA, get_checkout_details, get_eligible_payment_options,
eligibleBinsForEMI, payment_source. Unknown formats and V2 return 400; collect a
redacted callback example for validation rather than relaxing signing restrictions.

## Backend validation and release

Run `npm test` from backend. Tests use fake credentials and mocked providers;
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
checks belong in [guide 3](03-OPERATIONS-AND-RELEASE.md). Unsupported callbacks such
as get_sdk_configuration, get_all_offer_details and quickPayEvent are not made
supported merely because an archived guide said they worked.
