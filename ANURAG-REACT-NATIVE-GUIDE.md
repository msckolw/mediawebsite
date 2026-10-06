# NBM Payment Integration — React Native Guide for Anurag

## Backend Base URL
```
https://thenbm-329287861933.asia-south1.run.app/api
```

## SDK to Install
```bash
npm install payu-non-seam-less-react --save
react-native link payu-non-seam-less-react
```

---

## Step 1 — Create Donation (call your backend)

```js
const idempotencyKey = Date.now().toString() + Math.random().toString(36).slice(2);

const donationRes = await fetch(
  'https://thenbm-329287861933.asia-south1.run.app/api/donations',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstname: 'John',
      email: 'john@example.com',
      phone: '9876543210',
      amount: '100',
      method: 'upi',        // 'upi' | 'card' | 'netbanking'
      platform: 'app',      // ← MUST be 'app' for mobile
      idempotencyKey        // unique per attempt, 16-128 chars alphanumeric
    })
  }
);
const donation = await donationRes.json();
// save donation.id
```

---

## Step 2 — Start Checkout (get payment params from backend)

```js
const checkoutRes = await fetch(
  `https://thenbm-329287861933.asia-south1.run.app/api/donations/${donation.id}/checkout`,
  { method: 'POST', headers: { 'Content-Type': 'application/json' } }
);
const checkoutData = await checkoutRes.json();
const fields = checkoutData.checkout.fields;
// fields contains: key, txnid, amount, productinfo, firstname, email, phone, hash, pg
```

---

## Step 3 — Build PayU SDK Payment Params

```js
import { NativeModules, NativeEventEmitter } from 'react-native';
const { PayUBizSdk } = NativeModules;

const payUPaymentParams = {
  key: fields.key,                    // '0BPUp0'
  transactionId: fields.txnid,        // from backend, max 25 chars
  amount: fields.amount,              // e.g. '100.00'
  productInfo: fields.productinfo,    // 'NBM Donation'
  firstName: fields.firstname,
  email: fields.email,
  phone: fields.phone,

  // ✅ PRODUCTION URLs (surl/furl handled by backend)
  android_surl: 'https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/success',
  android_furl: 'https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/failure',
  ios_surl: 'https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/success',
  ios_furl: 'https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/failure',

  environment: '0',                   // '0' = Production, '1' = Test
  userCredential: `0BPUp0:${fields.email}`,
  userToken: `userId:${fields.email}`,

  additionalParam: {
    udf1: '', udf2: '', udf3: '', udf4: '', udf5: ''
  }
};

// Open PayU checkout screen
PayUBizSdk.openCheckoutScreen({ payUPaymentParams });
```

---

## Step 4 — Register Event Listeners (CRITICAL — this is why callbacks are not firing)

Anurag MUST register these listeners. **This is what handles the payment method selection and hash generation callbacks.**

```js
componentDidMount() {
  const eventEmitter = new NativeEventEmitter(PayUBizSdk);

  // Payment result callbacks
  this.paymentSuccess = eventEmitter.addListener('onPaymentSuccess', this.onPaymentSuccess);
  this.paymentFailure = eventEmitter.addListener('onPaymentFailure', this.onPaymentFailure);
  this.paymentCancel  = eventEmitter.addListener('onPaymentCancel',  this.onPaymentCancel);
  this.error          = eventEmitter.addListener('onError',          this.onError);

  // ⚠️ MOST IMPORTANT — hash generation callback
  // SDK calls this whenever it needs a hash (eligibleBinsForEMI, payment_source, etc.)
  this.generateHash   = eventEmitter.addListener('generateHash',     this.generateHash);
}

componentWillUnmount() {
  this.paymentSuccess.remove();
  this.paymentFailure.remove();
  this.paymentCancel.remove();
  this.error.remove();
  this.generateHash.remove();
}
```

---

## Step 5 — generateHash Implementation (call backend, return to SDK)

### For React Native < 0.82.0 (standard fetch):

```js
generateHash = async (e) => {
  const { hashName, hashString, postSalt } = e;

  const response = await fetch(
    'https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/hash',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hashName, hashString, postSalt })
    }
  );
  const data = await response.json();

  // ✅ Pass hash back to SDK — THIS is what makes the payment screen open
  PayUBizSdk.hashGenerated({ [hashName]: data[hashName] });
};
```

### For React Native >= 0.82.0 (MUST use makeHttpRequest):

```js
generateHash = async (e) => {
  const { hashName, hashString, postSalt } = e;

  try {
    const rawBody = JSON.stringify({ hashName, hashString, postSalt });
    const headers = { 'Content-Type': 'application/json' };

    // ✅ Use PayUBizSdk.makeHttpRequest instead of fetch for RN 0.82+
    const response = await PayUBizSdk.makeHttpRequest(
      'https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/hash',
      'POST',
      rawBody,
      headers
    );

    const data = typeof response === 'string' ? JSON.parse(response) : response;

    // ✅ Pass hash back to SDK
    PayUBizSdk.hashGenerated({ [hashName]: data[hashName] });

  } catch (error) {
    console.error('Hash generation error:', error);
  }
};
```

---

## Step 6 — Handle Payment Result

```js
onPaymentSuccess = async (e) => {
  console.log('Payment Success:', e.merchantResponse, e.payuResponse);
  // Check final status from backend
  const status = await fetch(
    `https://thenbm-329287861933.asia-south1.run.app/api/donations/${donationId}/status`
  );
  const result = await status.json();
  // Navigate to success screen
  navigation.navigate('DonateStatus', { status: result.status, donationId });
};

onPaymentFailure = (e) => {
  console.log('Payment Failed:', e.merchantResponse, e.payuResponse);
  navigation.navigate('DonateStatus', { status: 'failed', donationId });
};

onPaymentCancel = (e) => {
  console.log('Payment Cancelled:', e);
};

onError = (e) => {
  console.log('SDK Error:', e);
};
```

---

## Step 7 — Check Payment Status (polling)

```js
const statusRes = await fetch(
  `https://thenbm-329287861933.asia-south1.run.app/api/donations/${donationId}/status`
);
const result = await statusRes.json();
// result.status => 'success' | 'pending' | 'failed'
// result.transactionId => PayU transaction ID
// result.amount => payment amount
```

---

## Summary of the Issue

The reason payment methods are **not redirecting** is because the `generateHash` event listener is either:

1. **Not registered** — `eventEmitter.addListener('generateHash', this.generateHash)` is missing
2. **Not calling `PayUBizSdk.hashGenerated(result)`** after getting the hash from backend
3. **Using `fetch` on RN 0.82+** — must use `PayUBizSdk.makeHttpRequest` instead

The SDK fires `generateHash` event when a payment method is selected (UPI, card, etc.).
If Anurag doesn't handle it and call `PayUBizSdk.hashGenerated(result)`, the SDK **waits forever** and never opens the payment screen.

---

## Production Checklist for Anurag

- [ ] `environment: '0'` (not `'1'`)
- [ ] `platform: 'app'` in donation creation request
- [ ] `generateHash` event listener is registered
- [ ] `PayUBizSdk.hashGenerated(result)` is called after every hash fetch
- [ ] Using `PayUBizSdk.makeHttpRequest` if on RN 0.82+
- [ ] `eventEmitter.remove()` called in `componentWillUnmount`
