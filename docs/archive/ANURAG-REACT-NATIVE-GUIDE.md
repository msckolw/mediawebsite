> Historical document. Superseded by the [three active guides](../01-PROJECT-AND-DEPLOYMENT.md).
> Hosting, completion claims and API examples below may be outdated.

# React Native donation payment flow

Use the backend donation status as the source of truth. The SDK success, failure,
cancellation, or 5019 error callback is a signal to check status, not permission
to create another charge. The React Native application is maintained separately
and has not been tested here.

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
