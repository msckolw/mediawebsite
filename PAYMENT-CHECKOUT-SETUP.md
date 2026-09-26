# Donation checkout setup

The website creates one donation and one active payment attempt. The server selects PayU or PhonePe for UPI and uses PhonePe for cards and net banking. The web page never collects card numbers. PhonePe card and bank payments run in PhonePe's embedded checkout. PayU UPI payments appear as a dynamic QR on the donation page.

## Required server settings

Set `FRONTEND_URL` and `PUBLIC_API_URL` to the public HTTPS origins of the web app and API. Set `PHONEPE_MODE=sandbox` during testing, then `live` for production. Configure `PHONEPE_CLIENT_ID`, `PHONEPE_CLIENT_SECRET`, and `PHONEPE_CLIENT_VERSION` from PhonePe. Set `PHONEPE_WEBHOOK_USERNAME` and `PHONEPE_WEBHOOK_PASSWORD` to the credentials configured in the PhonePe dashboard. Register `POST {PUBLIC_API_URL}/api/payments/phonepe/webhook` there with SHA256 authorization. The endpoint compares the Authorization header with the SHA256 hex digest of `username:password` and confirms each notification through PhonePe's status API.

Set `PAYMENT_ENABLED_GATEWAYS=phonepe` to start. Once PayU activates Dynamic QR / DBQR for the merchant account, set `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, `PAYU_MODE=test` (or `live`), `PAYU_DBQR_ENABLED=true`, and `PAYMENT_ENABLED_GATEWAYS=phonepe,payu`. The PayU QR flow needs PayU to enable `pg=DBQR`, `bankcode=UPIDBQR`, and server-to-server flow 4. Register `POST {PUBLIC_API_URL}/api/payments/payu/webhook` if PayU supports callbacks for the enabled product. Payment success is confirmed through the PayU verify API. A successful PayU callback is also hash checked.

Set `PAYMENT_PHONEPE_WEIGHT=1` and `PAYMENT_PAYU_WEIGHT=1` for equal UPI distribution. Change the positive weights to shift UPI traffic. Card and net banking traffic always goes to PhonePe in this release. A gateway is eligible only when its credentials and relevant product flag are configured. Keep all secrets on the server.

## Sandbox checks

1. Use sandbox credentials and HTTPS test URLs. Start a UPI donation and verify that the PhonePe iframe opens and the status page remains pending until the server confirms success or failure.
2. Enable PayU DBQR in its test merchant account, then start a UPI donation. Verify that the QR displays, that scanning opens the intended UPI payment, and that the donation changes to success only after PayU verification.
3. Start card and net banking donations; verify that they always use PhonePe. Test cancelled, failed, delayed, and successful payments, plus a browser refresh during checkout.
4. Send an invalid PhonePe webhook Authorization header and confirm it is rejected. Confirm a valid notification causes a server-side status check. Never mark a donation successful from a browser callback alone.

## Backend contract for a future app client

`POST /api/donations` accepts `amount`, `firstname`, `email`, `phone`, `method` (`upi`, `card`, `netbanking`), `platform` (`web` or `app`), and a stable random `idempotencyKey` (16 to 128 letters, digits, underscores, or hyphens). Keep the same key for retries of the same request. It returns a donation `id`.

`POST /api/donations/:id/checkout` starts or returns its active attempt. `GET /api/donations/:id/status` returns `pending`, `success`, or `failed`, along with transaction ID and gateway. Treat only the server's `success` response as a successful payment. The current checkout payloads are designed for the website; app-specific SDK support and deep links should be designed when the app work begins. This repository does not modify the React Native app.
