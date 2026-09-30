# PayU mobile dynamic hash endpoint

`POST /api/payments/payu/hash` handles supported PayU SDK dynamic-hash requests. The SDK integration must use the exact callback field names and hash-completion method for the SDK version installed by the app. The example below is only a backend transport helper: it takes values already extracted from the actual SDK callback; it does not demonstrate or prescribe SDK callback wiring.

For payment, the backend accepts only the standard payment string with a configured first-field merchant key, required transaction ID and bounded numeric amount, exactly 16 fields plus the final delimiter, and empty reserved slots. For the four auxiliary names below, it accepts exactly `key|command|var1|`, with the configured key, nonempty var1, and exact hash-name/command match. Hashes are SHA-512 over the original UTF-8 `hashString + configured salt` (payment only may append optional `postSalt`). Client salt overrides are rejected.

Example payment request:

```json
{
  "hashName": "payment_hash",
  "hashType": "V1",
  "hashString": "merchant_key_123|txn|1.00|product|first|a@b.test|||||||||||"
}
```

Example VPA request, using the documented PayU command and sample VPA:

```json
{
  "hashName": "validateVPA",
  "hashType": "V1",
  "hashString": "merchant_key_123|validateVPA|9999999999@upi|"
}
```

The endpoint also supports the documented `getBinInfo`, `get_checkout_details`, and `get_eligible_payment_options` command hashes. The [Validate VPA API](https://docs.payu.in/reference/validate_vpa_api) and [Get BIN Info API](https://docs.payu.in/reference/get_bin_info_api) specify command hashes as `key|command|var1|salt`; this endpoint binds the command itself to the permitted callback name. Other auxiliary commands, V2, and lookup API hashes remain unsupported unless PayU documents a format that can be safely bound to its command. The V2 algorithm is documented by PayU, but this endpoint does not support it.

Backend transport helper (not SDK callback or completion code):

```js
async function helperRequestPayUHash(apiBaseUrl, {
  hashName,
  hashString,
  hashType,
  postSalt
}) {
  const base = new URL(apiBaseUrl);
  if (base.protocol !== 'https:') throw new Error('HTTPS backend URL required');
  const url = new URL('/api/payments/payu/hash', base);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ hashName, hashString, hashType, postSalt })
  });
  if (!response.ok) throw new Error(`PayU hash request failed: HTTP ${response.status}`);
  return response.json();
}
```

Example keyed response:

```json
{ "payment_hash": "<generated-hash>" }
```

Errors include HTTP 400 for invalid or unsupported input, 429 when rate-limited, and 503 when required server configuration is unavailable. Responses use `Cache-Control: no-store`. Configure `PAYU_MERCHANT_KEY` and `PAYU_MERCHANT_SALT` in the backend runtime. Input strings are capped at 4096 characters and requests are limited to 60 per client IP per process in a fixed one-minute window (not a rolling window); use a shared gateway limit in multi-instance production. Behind a proxy, the limiter uses the observed socket IP unless a proxy is correctly configured as trusted. Do not change server trust-proxy settings as part of this integration. This endpoint does not authenticate mobile clients; rate limiting is not authentication. Never expose or log the salt.

SDK integration and a real test transaction have not been verified. Deploy the backend endpoint before using it from the app.
