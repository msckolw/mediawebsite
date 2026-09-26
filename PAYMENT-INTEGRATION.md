# Payment Integration Documentation

Complete technical documentation for the PayU payment gateway integration in NoBias Media platform.

**Last Updated**: July 22, 2026  
**Current Status**: Production Ready (PayU only)  
**Future Plans**: Multi-gateway support (PhonePe integration pending)

---

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Payment Flow](#payment-flow)
3. [API Documentation](#api-documentation)
4. [Database Schema](#database-schema)
5. [Security Implementation](#security-implementation)
6. [Testing Guide](#testing-guide)
7. [Troubleshooting](#troubleshooting)
8. [Future Enhancements](#future-enhancements)

---

## Architecture Overview

### Tech Stack
- **Payment Gateway**: PayU (India)
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Frontend**: React
- **Hash Algorithm**: SHA-512 (server-side only)

### Key Design Decisions

#### 1. Server-Side Hash Generation
**Why**: PayU salt must never be exposed to frontend
```javascript
// ❌ BAD: Frontend generates hash (exposes salt)
const hash = sha512(`${key}|${txnid}|${amount}|...|${salt}`);

// ✅ GOOD: Backend generates hash
router.post('/payments/create', async (req, res) => {
  const hash = paymentHash({ ...params, salt });
  res.json({ fields: { ...otherFields, hash } });
});
```

#### 2. Webhook + Callback Redundancy
**Why**: Webhooks can fail (cold starts, network issues)
- **Primary**: Webhook updates payment asynchronously
- **Fallback**: Success/failure callbacks update on redirect
- **Manual**: Verify API allows force-refresh from PayU

#### 3. Status Lock for Success Payments
**Why**: Prevent delayed webhooks from corrupting successful payments
```javascript
if (payment.status === 'success' && nextStatus !== 'success') {
  return { ok: true, payment, ignored: true };
}
```

#### 4. Guest Donations (No Authentication)
**Why**: Reduce friction, increase conversion
- No login required to donate
- Only collect: name, email, phone
- Privacy-first: minimal data collection

---

## Payment Flow

### Complete Flow Diagram
```text
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                            │
└─────────────────────────────────────────────────────────────────┘

1. User visits /donate page
   └─> Fills form: amount, name, email, phone, method (UPI/Card/All)

2. Frontend calls POST /api/payments/create
   └─> Backend validates input
   └─> Generates unique txnid (e.g., "nbm1721654321abc")
   └─> Generates PayU hash (SHA-512, server-side)
   └─> Creates Payment document (status: "pending")
   └─> Returns: { txnid, action: "https://test.payu.in/_payment", fields }

3. Frontend auto-submits form to PayU
   └─> User redirected to PayU payment page

4. User completes payment on PayU
   ├─> Success: PayU redirects to /api/payments/payu/success
   └─> Failure: PayU redirects to /api/payments/payu/failure

5. Backend callback handler
   └─> Verifies hash
   └─> Updates Payment status in MongoDB
   └─> Redirects user to /donate/status?txnid=...&status=...

6. PayU sends webhook (async, parallel to step 5)
   └─> POST /api/payments/payu/webhook
   └─> Backend verifies hash
   └─> Updates Payment status (if not already "success")

7. Frontend status page
   └─> Polls GET /api/payments/:txnid every 3 seconds
   └─> Shows final status to user
   └─> Option to manually verify if stuck on "pending"

┌─────────────────────────────────────────────────────────────────┐
│                      CRITICAL RACE CONDITION                     │
└─────────────────────────────────────────────────────────────────┘

Problem: Webhook may arrive BEFORE or AFTER callback redirect
Solution: Both handlers call applyPayuCallback() which:
  - Uses upsert logic (updates existing payment)
  - Locks "success" status (prevents overwrite by delayed webhook)
  - Returns { ok, payment, ignored } to indicate if update was applied
```

### Sequence Diagram
```text
Frontend          Backend          MongoDB         PayU
   |                 |                |              |
   |---create------->|                |              |
   |                 |---save-------->|              |
   |<--form fields---|                |              |
   |                 |                |              |
   |=================|================|==submit form==>|
   |                 |                |              |
   |                 |                |<--callback---|
   |                 |<--webhook------|              |
   |                 |---update------>|              |
   |<--redirect------|                |              |
   |                 |                |              |
   |---get status--->|                |              |
   |<--status--------|---query------->|              |
   |                 |<--payment------|              |
```

---

## API Documentation

### 1. Create Payment

**Endpoint**: `POST /api/payments/create`  
**Authentication**: None (guest donations allowed)  
**Rate Limit**: None (consider adding in production)

#### Request
```json
{
  "amount": "500",
  "firstname": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "method": "all"
}
```

#### Request Validation
| Field | Type | Required | Validation | Error Message |
|-------|------|----------|------------|---------------|
| `amount` | String/Number | ✅ Yes | ₹10 - ₹100,000 | "Amount must be between ₹10 and ₹1,00,000" |
| `firstname` | String | ✅ Yes | Min 2 chars | "Please enter your name" |
| `email` | String | ✅ Yes | Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | "Please enter a valid email" |
| `phone` | String | ✅ Yes | Regex: `/^[6-9]\d{9}$/` | "Please enter a valid 10-digit Indian mobile number" |
| `method` | String | ❌ No | Enum: `upi`, `card`, `all` | Defaults to `all` |

#### Response (Success)
```json
{
  "txnid": "nbm1721654321abc",
  "action": "https://test.payu.in/_payment",
  "fields": {
    "key": "JPM7Fg",
    "txnid": "nbm1721654321abc",
    "amount": "500.00",
    "productinfo": "NBM Donation",
    "firstname": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "surl": "https://mediawebsite.onrender.com/api/payments/payu/success",
    "furl": "https://mediawebsite.onrender.com/api/payments/payu/failure",
    "hash": "abc123...",
    "pg": "UPI"
  }
}
```

#### Response (Error)
```json
{
  "message": "Amount must be between ₹10 and ₹1,00,000."
}
```

**HTTP Status Codes**:
- `200 OK`: Payment created successfully
- `400 Bad Request`: Validation error
- `500 Internal Server Error`: Database error
- `503 Service Unavailable`: PayU not configured (missing env vars)

#### Frontend Integration
```javascript
const createPayment = async (formData) => {
  const response = await fetch(`${API_URL}/api/payments/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  const { txnid, action, fields } = await response.json();
  
  // Auto-submit form to PayU
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  
  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  
  document.body.appendChild(form);
  form.submit();
};
```

---

### 2. Get Payment Status

**Endpoint**: `GET /api/payments/:txnid`  
**Authentication**: None (transaction ID is sufficient)  
**Use Case**: Poll for status updates, display on status page

#### Request
```bash
GET /api/payments/nbm1721654321abc
```

#### Response (Success)
```json
{
  "txnid": "nbm1721654321abc",
  "amount": "500.00",
  "status": "success",
  "method": "upi",
  "mode": "UPI",
  "productinfo": "NBM Donation",
  "createdAt": "2026-07-22T10:30:00.000Z",
  "updatedAt": "2026-07-22T10:35:00.000Z"
}
```

**Status Values**:
- `pending`: Payment not yet completed (initial state)
- `success`: Payment successful (funds received)
- `failed`: Payment failed (user cancelled or error)

#### Response (Not Found)
```json
{
  "message": "Payment not found."
}
```

**HTTP Status Codes**:
- `200 OK`: Payment found
- `404 Not Found`: Invalid transaction ID
- `500 Internal Server Error`: Database error

#### Frontend Polling Example
```javascript
const pollPaymentStatus = async (txnid, maxAttempts = 20) => {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`${API_URL}/api/payments/${txnid}`);
    const payment = await response.json();
    
    if (payment.status !== 'pending') {
      return payment; // Success or failed
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s
  }
  
  return null; // Timeout after 1 minute
};
```

---

### 3. Verify Payment (Manual)

**Endpoint**: `POST /api/payments/:txnid/verify`  
**Authentication**: None  
**Use Case**: Force-refresh status from PayU (fallback if webhook failed)

#### Request
```bash
POST /api/payments/nbm1721654321abc/verify
```

#### Response
Same as Get Payment Status (returns updated payment object)

#### How It Works
1. Backend calls PayU's `verify_payment` API
2. PayU returns latest transaction status
3. Backend updates MongoDB with fresh data
4. Returns updated payment to frontend

#### Frontend Usage
```javascript
const verifyPayment = async (txnid) => {
  const response = await fetch(`${API_URL}/api/payments/${txnid}/verify`, {
    method: 'POST'
  });
  return await response.json();
};

// Use when status is stuck on "pending" for >1 minute
```

**HTTP Status Codes**:
- `200 OK`: Verification successful
- `404 Not Found`: Invalid transaction ID
- `500 Internal Server Error`: PayU API error
- `503 Service Unavailable`: PayU not configured

---

### 4. PayU Callbacks (Internal)

These endpoints are called by PayU and should not be called manually by frontend.

#### Success Callback
**Endpoint**: `POST /api/payments/payu/success`  
**Called By**: PayU (redirect after successful payment)  
**Response**: 302 redirect to frontend status page

#### Failure Callback
**Endpoint**: `POST /api/payments/payu/failure`  
**Called By**: PayU (redirect after failed payment)  
**Response**: 302 redirect to frontend status page

#### Webhook (Server-to-Server)
**Endpoint**: `POST /api/payments/payu/webhook`  
**Called By**: PayU (async notification, parallel to callbacks)  
**Response**: 200 JSON `{ received: true }`

**All three endpoints**:
- Verify PayU hash (SHA-512)
- Update payment status in MongoDB
- Handle duplicate/delayed notifications
- Never overwrite "success" status

---

## Database Schema

### Payment Model

**File**: `backend/src/models/Payment.js`

```javascript
const paymentSchema = new mongoose.Schema({
  // Transaction identifiers
  txnid: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  
  // Future multi-gateway support
  gateway: { 
    type: String, 
    enum: ['payu', 'phonepe'], 
    default: 'payu' 
  },
  
  // Payment details
  amount: { type: String, required: true },
  productinfo: { type: String, default: 'NBM Donation' },
  
  // Donor information
  firstname: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  
  // Payment preferences
  method: { 
    type: String, 
    enum: ['upi', 'card', 'all'], 
    default: 'all' 
  },
  
  // Payment status (indexed for fast queries)
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending',
    index: true
  },
  
  // PayU specific fields
  payuStatus: { type: String },        // Original PayU status
  mihpayid: { type: String },          // PayU transaction reference
  mode: { type: String },              // CC, DC, NB, UPI, etc.
  bankcode: { type: String },          // Bank identifier
  error: { type: String },             // Error code (if failed)
  errorMessage: { type: String },      // Human-readable error
  hashVerified: { 
    type: Boolean, 
    default: false 
  },
  rawResponse: { type: Object },       // Full PayU response (debugging)
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update updatedAt on save
paymentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
```

### Indexes
```javascript
// Automatically created by Mongoose
db.payments.createIndex({ txnid: 1 }, { unique: true });
db.payments.createIndex({ status: 1 });

// Recommended for production (add manually)
db.payments.createIndex({ createdAt: -1 }); // For admin dashboard
db.payments.createIndex({ email: 1 });      // For donor lookup
db.payments.createIndex({ mihpayid: 1 });   // For PayU reconciliation
```

### Sample Documents

**Pending Payment**:
```json
{
  "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
  "txnid": "nbm1721654321abc",
  "gateway": "payu",
  "amount": "500.00",
  "productinfo": "NBM Donation",
  "firstname": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "method": "all",
  "status": "pending",
  "payuStatus": null,
  "mihpayid": null,
  "mode": null,
  "bankcode": null,
  "error": null,
  "errorMessage": null,
  "hashVerified": false,
  "rawResponse": null,
  "createdAt": "2026-07-22T10:30:00.000Z",
  "updatedAt": "2026-07-22T10:30:00.000Z"
}
```

**Successful Payment**:
```json
{
  "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
  "txnid": "nbm1721654321abc",
  "gateway": "payu",
  "amount": "500.00",
  "productinfo": "NBM Donation",
  "firstname": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "method": "upi",
  "status": "success",
  "payuStatus": "success",
  "mihpayid": "403993715527062324",
  "mode": "UPI",
  "bankcode": "SBIN",
  "error": null,
  "errorMessage": null,
  "hashVerified": true,
  "rawResponse": {
    "status": "success",
    "txnid": "nbm1721654321abc",
    "amount": "500.00",
    "mihpayid": "403993715527062324",
    "mode": "UPI",
    "bankcode": "SBIN",
    "hash": "..."
  },
  "createdAt": "2026-07-22T10:30:00.000Z",
  "updatedAt": "2026-07-22T10:35:12.000Z"
}
```

**Failed Payment**:
```json
{
  "txnid": "nbm1721654999xyz",
  "status": "failed",
  "payuStatus": "failure",
  "error": "E000",
  "errorMessage": "No payment option is available for this transaction. Please contact your Merchant.",
  "hashVerified": true,
  "rawResponse": { "..." },
  "updatedAt": "2026-07-22T10:32:45.000Z"
}
```

---

## Security Implementation

### 1. Hash Generation (SHA-512)

**File**: `backend/src/utils/payu.js`

```javascript
const crypto = require('crypto');

function sha512(value) {
  return crypto.createHash('sha512').update(value).digest('hex');
}

function paymentHash({
  key,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  udf1 = '',
  udf2 = '',
  udf3 = '',
  udf4 = '',
  udf5 = '',
  salt
}) {
  const plaintext = [
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1 || '',
    udf2 || '',
    udf3 || '',
    udf4 || '',
    udf5 || '',
    '',  // udf6-udf10 (empty)
    '',
    '',
    '',
    '',
    salt
  ].join('|');
  
  return sha512(plaintext);
}
```

**PayU Hash Formula**:
```
SHA512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt)
```

**Response Hash Formula** (for verification):
```
SHA512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)

Or with additionalCharges:
SHA512(additionalCharges|salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
```

### 2. Hash Verification

```javascript
function responseHashCandidates(params, salt) {
  const base = `${salt}|${params.status}||||||${params.udf5 || ''}|${params.udf4 || ''}|${params.udf3 || ''}|${params.udf2 || ''}|${params.udf1 || ''}|${params.email}|${params.firstname}|${params.productinfo}|${params.amount}|${params.txnid}|${params.key}`;
  
  const hashes = [sha512(base)];
  
  if (params.additionalCharges) {
    hashes.push(sha512(`${params.additionalCharges}|${base}`));
  }
  
  return hashes;
}

function isValidResponseHash(params, salt) {
  const received = (params.hash || '').toLowerCase();
  if (!received) return false;
  return responseHashCandidates(params, salt).some(hash => hash === received);
}
```

**Why Two Hash Candidates?**  
PayU includes `additionalCharges` in hash if present (e.g., payment gateway charges). We check both possibilities.

### 3. Input Validation

```javascript
// Amount validation
const MIN_AMOUNT = 10;
const MAX_AMOUNT = 100000;

function formatAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return amount.toFixed(2);
}

// Email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Phone validation (Indian mobile numbers only)
function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(String(phone).replace(/\s+/g, ''));
}
```

### 4. Duplicate Transaction Protection

```javascript
// Unique txnid prevents duplicate payments
const txnid = `nbm${Date.now()}${crypto.randomBytes(3).toString('hex')}`;

// MongoDB unique index ensures no duplicates
{ txnid: 1 }, { unique: true }
```

### 5. Success Status Lock

```javascript
async function applyPayuCallback(params, { requireHash = true } = {}) {
  const payment = await Payment.findOne({ txnid: params.txnid });
  
  // Prevent overwriting successful payments
  const nextStatus = mapPayuStatus(params.status);
  if (payment.status === 'success' && nextStatus !== 'success') {
    return { ok: true, payment, ignored: true };
  }
  
  // Update payment...
}
```

**Why?** Webhooks may be delayed or arrive out-of-order. Once a payment is marked `success`, it should never revert to `pending` or `failed`.

### 6. Environment-Based Configuration

```javascript
function payuConfig() {
  const key = process.env.PAYU_MERCHANT_KEY;
  const salt = process.env.PAYU_MERCHANT_SALT;
  const baseUrl = process.env.PAYU_MODE === 'live'
    ? 'https://secure.payu.in'
    : 'https://test.payu.in';
  
  return { key, salt, baseUrl, /* ... */ };
}
```

**Never hardcode credentials** in source code. Always use environment variables.

---

## Testing Guide

### Local Testing Setup

1. **Get PayU Test Credentials**:
   - Signup at https://onboarding.payu.in
   - Get test merchant key and salt
   - Add to `backend/.env`:
     ```env
     PAYU_MERCHANT_KEY=your_test_key
     PAYU_MERCHANT_SALT=your_test_salt
     PAYU_MODE=test
     ```

2. **Start Backend and Frontend**:
   ```bash
   # Terminal 1
   cd backend && npm run dev
   
   # Terminal 2
   cd frontend && npm start
   ```

3. **Navigate to Donate Page**:
   ```
   http://localhost:3000/donate
   ```

### Test Cases

#### Test Case 1: Successful UPI Payment
**Steps**:
1. Fill donation form:
   - Amount: ₹100
   - Name: Test User
   - Email: test@example.com
   - Phone: 9876543210
   - Method: UPI
2. Click "Donate Now"
3. On PayU page, use test UPI: `success@payu`
4. Verify redirect to success page
5. Check MongoDB: `status === 'success'`

**Expected Result**: Payment status updates to "success" within 5 seconds

---

#### Test Case 2: Failed Card Payment
**Steps**:
1. Fill donation form with amount: ₹200
2. Select method: Card
3. On PayU page, use test card: `4012001037141112` (failure card)
4. Complete payment flow

**Expected Result**: Redirected to status page showing "failed"

---

#### Test Case 3: Webhook Retry
**Steps**:
1. Create payment (status: "pending")
2. Manually send webhook (simulate PayU):
   ```bash
   curl -X POST http://localhost:5002/api/payments/payu/webhook \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "txnid=nbm123&status=success&key=JPM7Fg&..."
   ```
3. Check MongoDB status updated

**Expected Result**: Status changes from "pending" to "success"

---

#### Test Case 4: Delayed Webhook (Status Lock)
**Steps**:
1. Complete payment successfully (status: "success")
2. Wait 5 minutes
3. Send duplicate webhook with `status=pending`
4. Check MongoDB

**Expected Result**: Status remains "success" (not overwritten)

---

#### Test Case 5: Invalid Hash Rejection
**Steps**:
1. Send webhook with incorrect hash:
   ```bash
   curl -X POST http://localhost:5002/api/payments/payu/webhook \
     -d "txnid=nbm123&status=success&hash=invalid_hash"
   ```

**Expected Result**: Payment status not updated, webhook returns 200 but ignores data

---

#### Test Case 6: Amount Validation
**Input Test Cases**:
| Input | Expected | Error Message |
|-------|----------|---------------|
| `5` | ❌ Reject | "Amount must be between ₹10 and ₹1,00,000" |
| `10` | ✅ Accept | - |
| `50000` | ✅ Accept | - |
| `100000` | ✅ Accept | - |
| `100001` | ❌ Reject | "Amount must be between ₹10 and ₹1,00,000" |
| `abc` | ❌ Reject | "Amount must be between ₹10 and ₹1,00,000" |
| `-100` | ❌ Reject | "Amount must be between ₹10 and ₹1,00,000" |

---

#### Test Case 7: Email Validation
| Input | Expected | Error Message |
|-------|----------|---------------|
| `test@example.com` | ✅ Accept | - |
| `test@` | ❌ Reject | "Please enter a valid email" |
| `@example.com` | ❌ Reject | "Please enter a valid email" |
| `test.user+tag@sub.example.com` | ✅ Accept | - |
| `no-at-sign.com` | ❌ Reject | "Please enter a valid email" |

---

#### Test Case 8: Phone Validation
| Input | Expected | Error Message |
|-------|----------|---------------|
| `9876543210` | ✅ Accept | - |
| `6000000000` | ✅ Accept | - (starts with 6-9) |
| `5876543210` | ❌ Reject | "Please enter a valid 10-digit Indian mobile number" |
| `987654321` | ❌ Reject | "Please enter a valid 10-digit Indian mobile number" (only 9 digits) |
| `98765432100` | ❌ Reject | "Please enter a valid 10-digit Indian mobile number" (11 digits) |
| `abcdefghij` | ❌ Reject | "Please enter a valid 10-digit Indian mobile number" |

---

### PayU Test Credentials

**Test Cards**:
| Card Number | Expiry | CVV | Result |
|-------------|--------|-----|--------|
| `5123456789012346` | Any future | `123` | Success |
| `4012001037141112` | Any future | `123` | Failure |

**Test UPI**:
- Success: `success@payu`
- Failure: `failure@payu`

**Test Net Banking**:
- Select any bank
- Use test credentials provided on PayU test page

---

## Troubleshooting

### Problem: Payment Stuck on "Pending"

**Symptoms**: Payment completed on PayU but status page shows "pending" for >1 minute

**Possible Causes**:
1. Webhook failed to reach backend (cold start)
2. Callback redirect failed
3. Hash mismatch (webhook ignored)
4. MongoDB write failure

**Diagnosis Steps**:
```bash
# 1. Check backend logs
render logs --service mediawebsite | grep "payu"

# 2. Check if payment exists in DB
mongo "mongodb+srv://..." --eval 'db.payments.findOne({ txnid: "nbm123" })'

# 3. Manually verify with PayU
curl -X POST https://mediawebsite.onrender.com/api/payments/nbm123/verify

# 4. Check PayU dashboard for webhook delivery status
# Login to PayU → Transactions → Search txnid → Check webhook logs
```

**Solutions**:
1. **Immediate**: Use manual verification API
2. **Short-term**: Implement frontend auto-verify after 30s timeout
3. **Long-term**: Fix Render cold start issue (upgrade or migrate)

---

### Problem: "Invalid Hash" Error

**Symptoms**: Backend logs show "Hash verification failed"

**Possible Causes**:
1. Wrong `PAYU_MERCHANT_SALT` in environment variables
2. Typo in hash generation code
3. PayU changed hash format (unlikely)

**Diagnosis**:
```javascript
// Add debug logging in backend
console.log('Received hash:', params.hash);
console.log('Expected hashes:', responseHashCandidates(params, salt));
```

**Solutions**:
1. Verify salt matches PayU dashboard exactly (no extra spaces)
2. Check if `additionalCharges` field is present (affects hash)
3. Contact PayU support if hash format changed

---

### Problem: Cold Start Timeout

**Symptoms**: First request after 15+ minutes takes 50+ seconds

**Impact**:
- Donation form submission appears frozen
- PayU webhook times out (5-second timeout)
- Poor user experience

**Solutions**:
1. **Free Tier Workaround**:
   ```javascript
   // Frontend: Keep backend warm
   useEffect(() => {
     const interval = setInterval(() => {
       fetch(`${API_URL}/api/health`);
     }, 10 * 60 * 1000); // Every 10 minutes
     
     return () => clearInterval(interval);
   }, []);
   ```

2. **Paid Solution**: Upgrade to Render paid plan ($7/month)

3. **Alternative Hosting**: Migrate to Railway/Fly.io (better free tier)

4. **Hybrid Approach**: 
   - Keep payment APIs on always-on service (Railway)
   - Keep other routes on Render free tier

---

### Problem: User Not Redirected After Payment

**Symptoms**: User completes payment but stays on PayU page

**Possible Causes**:
1. Wrong `surl`/`furl` URLs in payment creation
2. Backend callback handler crashed
3. Redirect logic broken

**Diagnosis**:
```bash
# Test callback endpoints directly
curl -X POST https://mediawebsite.onrender.com/api/payments/payu/success \
  -d "txnid=test123&status=success&..."

# Should return 302 redirect to frontend
```

**Solutions**:
1. Verify `PUBLIC_API_URL` and `FRONTEND_URL` env vars
2. Check backend logs for crash errors
3. Ensure callback routes return `res.redirect(302, ...)`

---

### Problem: Duplicate Payments

**Symptoms**: Same user charged multiple times for one donation

**Possible Causes**:
1. User clicked "Donate" button multiple times
2. Frontend didn't disable button during submission
3. Browser back/refresh during payment

**Prevention**:
```javascript
// Frontend: Disable button during submission
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);
  
  try {
    await createPayment(formData);
  } finally {
    setIsSubmitting(false);
  }
};

// Button
<button disabled={isSubmitting}>
  {isSubmitting ? 'Processing...' : 'Donate Now'}
</button>
```

**Backend Protection**:
- Unique `txnid` prevents DB duplicates
- Consider adding rate limiting per email/phone

---

## Future Enhancements

### 1. Multi-Gateway Support (PhonePe)

**Status**: Planned (not implemented)

**Architecture Changes**:
```javascript
// Payment model
{
  gateway: "payu" | "phonepe",
  
  // PayU fields
  mihpayid: String,
  
  // PhonePe fields
  transactionId: String,
  merchantId: String,
  merchantTransactionId: String
}

// Smart gateway selection
function selectGateway(amount, method) {
  // 70/30 split
  if (Math.random() < 0.7) return 'payu';
  
  // Failover
  if (!isPayuHealthy()) return 'phonepe';
  
  // Method preference
  if (method === 'upi') return 'phonepe';
  
  return 'payu';
}
```

**Implementation Tasks**:
- [ ] Create `backend/src/utils/phonepe.js` (SHA-256 hash)
- [ ] Add PhonePe routes in `paymentRoutes.js`
- [ ] Update Payment model schema
- [ ] Add PhonePe env vars (`PHONEPE_MERCHANT_ID`, `PHONEPE_SALT`)
- [ ] Test PhonePe sandbox environment
- [ ] Update frontend to handle both gateways

---

### 2. Refund API

**Status**: Planned (not implemented)

**Proposed API**:
```javascript
POST /api/payments/:txnid/refund
Authorization: Bearer <admin-jwt>

{
  "reason": "User requested refund",
  "amount": "500.00" // Optional: partial refund
}

Response:
{
  "refundId": "REF123456",
  "status": "pending",
  "amount": "500.00",
  "estimatedDays": 5
}
```

**Implementation Tasks**:
- [ ] Add refund fields to Payment model
- [ ] Integrate PayU refund API
- [ ] Add admin authentication middleware
- [ ] Send email notification on refund
- [ ] Update refund policy page

---

### 3. Admin Payment Dashboard

**Status**: Planned (not implemented)

**Features**:
- View all donations (paginated, filterable)
- Export donation reports (CSV/Excel)
- Refund management
- Analytics (total donations, success rate, average amount)

**Proposed API**:
```javascript
GET /api/admin/payments
Authorization: Bearer <admin-jwt>
Query: ?page=1&limit=20&status=success&from=2026-01-01&to=2026-12-31

Response:
{
  "payments": [...],
  "total": 150,
  "page": 1,
  "pages": 8
}
```

---

### 4. Email Notifications

**Status**: Planned (not implemented)

**Use Cases**:
- Send donation receipt on success
- Send refund confirmation
- Send failed payment notification

**Implementation**:
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendDonationReceipt(payment) {
  await transporter.sendMail({
    from: '"NoBias Media" <donations@thenobiasmedia.com>',
    to: payment.email,
    subject: 'Thank you for your donation!',
    html: `
      <h1>Donation Receipt</h1>
      <p>Transaction ID: ${payment.txnid}</p>
      <p>Amount: ₹${payment.amount}</p>
      <p>Date: ${new Date(payment.createdAt).toLocaleDateString()}</p>
    `
  });
}
```

---

### 5. Recurring Donations

**Status**: Planned (not implemented)

**Features**:
- Monthly/yearly auto-debit
- Manage subscriptions (pause, cancel)
- Send upcoming payment reminders

**Proposed Model**:
```javascript
const subscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  amount: { type: String, required: true },
  frequency: { type: String, enum: ['monthly', 'yearly'] },
  status: { type: String, enum: ['active', 'paused', 'cancelled'] },
  nextPaymentDate: { type: Date },
  paymentHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }]
});
```

---

## Appendix

### PayU Status Codes Mapping

| PayU Status | Our Status | Description |
|-------------|------------|-------------|
| `success` | `success` | Payment successful |
| `captured` | `success` | Payment captured |
| `pending` | `pending` | Payment in progress |
| `auth` | `pending` | Authorized but not captured |
| `authsuccess` | `pending` | Authorization successful |
| `initiated` | `pending` | Payment initiated |
| `failure` | `failed` | Payment failed |
| `failed` | `failed` | Payment failed |
| `dropped` | `failed` | Payment dropped |
| `bounced` | `failed` | Payment bounced |
| `cancelled` | `failed` | User cancelled |
| `cancel` | `failed` | User cancelled |

### Error Codes

**PayU Error Codes** (stored in `payment.error` field):
- `E000`: No payment option available
- `E001`: Invalid parameters
- `E002`: Invalid hash
- `E003`: Transaction failed
- `E004`: Bank declined
- `E005`: Insufficient funds
- `E006`: Card expired
- `E007`: Invalid CVV
- `E008`: Card blocked

**Our API Error Responses**:
- `400 Bad Request`: Validation error (amount, email, phone)
- `404 Not Found`: Invalid transaction ID
- `500 Internal Server Error`: Database/server error
- `503 Service Unavailable`: PayU not configured

---

*End of Payment Integration Documentation*

**Questions or Issues?**  
Create an issue on GitHub or contact the development team.
