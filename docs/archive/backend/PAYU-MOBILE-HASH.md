> Historical document. Superseded by the [three active guides](../../01-PROJECT-AND-DEPLOYMENT.md).
> Hosting, completion claims and API examples below may be outdated.

# PayU mobile dynamic hashes

POST `/api/payments/payu/hash` returns `{ "<hashName>": "<sha512>" }` for supported
V1 requests. The hash is computed from the original UTF-8 hashString plus the
server merchant salt; a payment-only postSalt may follow the salt.

Payment strings must contain the configured merchant key, an existing pending
PayU transaction ID issued by this backend, the exact checkout amount, product,
name, email, empty UDF1–5 and reserved fields, and the final delimiter. The
16-field format remains unchanged. Unknown sessions return 404; successful or
failed sessions return 409 with nextAction check_status. Never reopen the SDK
or use cached fields after a settled session.

Auxiliary strings must be exactly `key|command|var1|`, with the configured key,
a nonempty var1, and command equal to hashName. Permitted names are getBinInfo,
validateVPA, get_checkout_details, get_eligible_payment_options, eligibleBinsForEMI,
and payment_source. Unknown commands, V2, client-supplied salts, malformed strings,
and auxiliary postSalt are rejected with 400. SDK formats outside this contract
need a redacted example and explicit validation; they must not be signed arbitrarily.

Other errors: 429 for rate limiting, 503 for unavailable configuration/database.
The per-process limit is 60 requests per observed IP per minute, with a maximum
4096-character string. Responses use Cache-Control no-store. Multi-instance
production needs a shared edge limit; configure trusted proxies deliberately.
The salt must remain on the backend and must never be logged or returned.

The endpoint supports native SDK transport but has not been verified against the
separately maintained React Native app. See ../ANURAG-REACT-NATIVE-GUIDE.md for
status, cancellation, idempotency, and retry behavior.
