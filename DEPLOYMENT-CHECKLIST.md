# 🚀 Production Deployment Checklist

**Deployment Date**: July 22, 2026  
**Version**: Multi-Gateway Payment System (PhonePe + PayU)  
**Git Commit**: `a153e0e` - "feat: implement multi-gateway payment system with PhonePe + PayU"

---

## ✅ Code Pushed to GitHub

- [x] Backend changes committed
- [x] Frontend changes committed
- [x] Documentation updated
- [x] Changes pushed to `main` branch

**Commit Details**:
- 25 files changed
- 4,434 insertions, 161 deletions
- New files: 12 (models, routes, services, docs)
- Modified files: 13

---

## 📋 Pre-Deployment Steps

### 1. Backend Environment Variables (Render)

You need to add these **NEW** environment variables in Render dashboard:

#### PhonePe Configuration (REQUIRED for PhonePe to work)
```env
# PhonePe Gateway
PHONEPE_MODE=sandbox                              # Use 'live' for production
PHONEPE_CLIENT_ID=your_phonepe_client_id
PHONEPE_CLIENT_SECRET=your_phonepe_client_secret
PHONEPE_CLIENT_VERSION=v1
PHONEPE_WEBHOOK_USERNAME=your_webhook_username
PHONEPE_WEBHOOK_PASSWORD=your_webhook_password

# Optional: Override default PhonePe URLs (usually not needed)
# PHONEPE_AUTH_URL=https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token
# PHONEPE_API_BASE_URL=https://api-preprod.phonepe.com/apis/pg-sandbox
```

#### Gateway Selection (REQUIRED)
```env
# Which gateways to enable (comma-separated)
PAYMENT_ENABLED_GATEWAYS=phonepe,payu

# Traffic distribution (weights, higher = more traffic)
PAYMENT_PHONEPE_WEIGHT=70        # 70% of payments go to PhonePe
PAYMENT_PAYU_WEIGHT=30           # 30% of payments go to PayU
```

#### PayU QR Code (OPTIONAL - for web UPI without redirect)
```env
PAYU_DBQR_ENABLED=true           # Set to 'true' to enable PayU QR code generation
```

#### Existing Variables (VERIFY these are still set)
```env
# Database
MONGODB_URI=mongodb+srv://...

# Server
PORT=5002

# Auth
JWT_SECRET=...

# PayU (existing)
PAYU_MERCHANT_KEY=...
PAYU_MERCHANT_SALT=...
PAYU_MODE=test                   # Change to 'live' when ready

# URLs
PUBLIC_API_URL=https://mediawebsite.onrender.com
FRONTEND_URL=https://www.thenobiasmedia.com
```

---

## 🔧 Deployment Steps

### Step 1: Update Render Environment Variables

1. Go to Render Dashboard: https://dashboard.render.com
2. Select your backend service: `mediawebsite`
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add all the PhonePe variables listed above
6. Add gateway selection variables
7. **Important**: Click **Save Changes** at the bottom

**Screenshot locations to verify**:
- ✅ All PhonePe variables added
- ✅ PAYMENT_ENABLED_GATEWAYS set
- ✅ Gateway weights configured
- ✅ PAYU_DBQR_ENABLED set (if using QR)

### Step 2: Trigger Render Deployment

**Option A - Automatic** (Recommended):
- Render will auto-deploy when it detects the GitHub push
- Go to **Events** tab to monitor deployment progress
- Wait for "Deploy succeeded" message

**Option B - Manual**:
- Go to **Manual Deploy** section
- Click **Deploy latest commit**
- Select branch: `main`
- Click **Deploy**

**Expected Deploy Time**: 3-5 minutes

### Step 3: Verify Backend Deployment

Once deployment succeeds, test these endpoints:

#### Health Check
```bash
curl https://mediawebsite.onrender.com/api/health
```
**Expected**: `200 OK` with JSON response

#### Test Donation Creation
```bash
curl -X POST https://mediawebsite.onrender.com/api/donations \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "100",
    "firstname": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "method": "upi",
    "platform": "web",
    "idempotencyKey": "test-' $(date +%s) '-key"
  }'
```
**Expected**: 
- `200 OK` with donation object
- Should include: `id`, `amount`, `status: "pending"`

#### Test Gateway Selection
Check backend logs in Render to verify:
```
Selected gateway: phonepe (or payu)
```

### Step 4: Frontend Deployment (Vercel)

Vercel should auto-deploy from GitHub push. Verify:

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select project: `mediawebsite` or `thenobiasmedia`
3. Check **Deployments** tab
4. Look for latest deployment from `main` branch
5. Verify status: **Ready** (✅ green checkmark)

**Expected Deploy Time**: 2-3 minutes

### Step 5: Test Complete Payment Flow

#### Test 1: PhonePe Payment
1. Go to: https://www.thenobiasmedia.com/donate
2. Fill form:
   - Amount: ₹100
   - Name: Your Name
   - Email: your@email.com
   - Phone: Your phone
   - Method: **UPI**
3. Click "Donate Now"
4. **Expected**: PhonePe checkout opens (iframe or redirect)
5. Complete test payment
6. **Expected**: Redirects to status page showing success

#### Test 2: PayU QR Code (if enabled)
1. Go to: https://www.thenobiasmedia.com/donate
2. Fill same form, select **UPI**
3. If PayU is selected by gateway logic:
   - **Expected**: QR code displays on your site
   - Scan with any UPI app
   - Complete payment
4. Click "Check payment status"
5. **Expected**: Shows success after payment

#### Test 3: Idempotency (Duplicate Prevention)
1. Open browser console (F12)
2. Submit same donation form twice rapidly
3. **Expected**: 
   - Both requests return same donation ID
   - Only 1 payment created in database
   - No duplicate charge

---

## 🔍 Post-Deployment Verification

### Backend Logs Check
1. Go to Render Dashboard → **Logs** tab
2. Look for these messages:
   ```
   ✅ Server started on port 5002
   ✅ MongoDB connected successfully
   ✅ Routes registered: /api/donations
   ```
3. Make a test donation and check logs for:
   ```
   Selected gateway: phonepe
   Creating donation with idempotencyKey: ...
   Donation created: ...
   ```

### Database Verification
1. Login to MongoDB Atlas: https://cloud.mongodb.com
2. Browse Collections
3. Check new collections exist:
   - ✅ `donations` collection
   - ✅ `payments` collection (should have gateway field)
4. Verify test donation:
   ```javascript
   db.donations.find().sort({ createdAt: -1 }).limit(1)
   db.payments.find().sort({ createdAt: -1 }).limit(1)
   ```

### Frontend Console Check
1. Open https://www.thenobiasmedia.com/donate
2. Open browser console (F12)
3. Check for errors (should be none)
4. Submit donation and watch network tab:
   - ✅ POST to `/api/donations` succeeds
   - ✅ POST to `/api/donations/:id/checkout` succeeds
   - ✅ Returns checkout object with type: 'phonepe' or 'payu_qr'

---

## 🐛 Troubleshooting

### Issue: "PhonePe is not configured" Error

**Cause**: Missing PhonePe environment variables

**Fix**:
1. Check Render environment variables
2. Verify all PHONEPE_* variables are set
3. Check for typos in variable names
4. Redeploy after adding variables

### Issue: "No payment gateway is available" Error

**Cause**: Both gateways failed configuration check

**Fix**:
1. Check `PAYMENT_ENABLED_GATEWAYS` includes at least one gateway
2. For PhonePe: Verify CLIENT_ID, CLIENT_SECRET, CLIENT_VERSION are set
3. For PayU: Verify MERCHANT_KEY and MERCHANT_SALT are set
4. Check backend logs for specific gateway errors

### Issue: Always Uses PayU (Never PhonePe)

**Cause**: PhonePe not passing configuration check

**Fix**:
1. Check backend logs for: "PhonePe configuration failed"
2. Verify PHONEPE_CLIENT_ID, CLIENT_SECRET, CLIENT_VERSION
3. Check weights: `PAYMENT_PHONEPE_WEIGHT` > 0

### Issue: QR Code Not Showing

**Cause**: PayU QR not enabled or not selected

**Fix**:
1. Set `PAYU_DBQR_ENABLED=true` in Render
2. Check if PhonePe is being selected instead (higher weight)
3. Temporarily set `PAYMENT_PAYU_WEIGHT=100` to force PayU selection
4. Check backend logs for QR generation errors

### Issue: Payment Status Stuck on "Pending"

**Cause**: Webhook failed or gateway didn't respond

**Fix**:
1. Wait 30 seconds (auto-verification runs every 10s)
2. Check backend logs for webhook delivery
3. Manually verify in gateway dashboard:
   - PhonePe: Check order status
   - PayU: Check transaction status
4. Check if backend was cold (Render spin-down issue)

### Issue: Duplicate Payments Created

**Cause**: Idempotency key not working

**Fix**:
1. Check frontend is generating stable UUID
2. Verify `idempotencyKey` is passed in request
3. Check MongoDB for duplicate donations with same key
4. Ensure Donation model has unique index on idempotencyKey

---

## 📊 Monitoring

### Metrics to Track (First 24 Hours)

#### Payment Success Rate
```javascript
// MongoDB query
db.payments.aggregate([
  { $match: { createdAt: { $gte: new ISODate("2026-07-22") } } },
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Target: >95% success rate
```

#### Gateway Distribution
```javascript
db.payments.aggregate([
  { $match: { createdAt: { $gte: new ISODate("2026-07-22") } } },
  { $group: { _id: "$gateway", count: { $sum: 1 } } }
])

// Should match your weight distribution (70/30)
```

#### Idempotency Check
```javascript
// Check for duplicate idempotencyKeys (should be 0)
db.donations.aggregate([
  { $group: { _id: "$idempotencyKey", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
```

#### Average Payment Time
- Time from donation creation to payment success
- Target: <30 seconds for PhonePe, <2 minutes for PayU QR

### Error Rate
- Monitor Render logs for error patterns
- Check for 500 errors in API responses
- Target: <1% error rate

---

## 🎯 Success Criteria

Before marking deployment as complete, verify:

- [x] ✅ Code pushed to GitHub
- [ ] ✅ Backend deployed to Render (auto from GitHub)
- [ ] ✅ Frontend deployed to Vercel (auto from GitHub)
- [ ] ✅ All environment variables set
- [ ] ✅ Health check returns 200 OK
- [ ] ✅ Test donation creation works
- [ ] ✅ PhonePe payment flow works end-to-end
- [ ] ✅ PayU QR code displays (if enabled)
- [ ] ✅ Status page auto-updates
- [ ] ✅ Idempotency prevents duplicates
- [ ] ✅ No errors in backend logs
- [ ] ✅ No errors in frontend console
- [ ] ✅ Donations collection exists in MongoDB
- [ ] ✅ Gateway selection works (check logs)
- [ ] ✅ Webhooks being received (check logs after test payment)

---

## 🚨 Rollback Plan

If critical issues occur:

### Option 1: Disable Multi-Gateway
```env
# In Render environment variables
PAYMENT_ENABLED_GATEWAYS=payu    # Use only PayU (old system)
```

### Option 2: Full Rollback
```bash
# Revert to previous commit
git revert a153e0e
git push origin main

# Render will auto-deploy the reverted version
```

### Option 3: Use Old Payment Endpoints
- Old PayU-only endpoints still work:
  - `POST /api/payments/create`
  - `GET /api/payments/:txnid`
- Frontend can temporarily use old API

---

## 📞 Support Contacts

### PhonePe Support
- Email: merchantsupport@phonepe.com
- Dashboard: https://business.phonepe.com

### PayU Support
- Email: support@payu.in
- Phone: +91-124-4656999
- Dashboard: https://onboarding.payu.in

### Render Support
- Help Center: https://render.com/docs
- Status Page: https://status.render.com

### MongoDB Support
- Support Portal: https://support.mongodb.com
- Atlas Dashboard: https://cloud.mongodb.com

---

## 📝 Next Steps (Post-Deployment)

### Immediate (Within 24 Hours)
1. Monitor error logs closely
2. Track payment success rate
3. Verify gateway distribution matches weights
4. Test with real payments (small amounts)
5. Check webhook delivery rate

### Short-Term (Within 1 Week)
1. Switch from test mode to live mode:
   ```env
   PHONEPE_MODE=live
   PAYU_MODE=live
   ```
2. Update PayU merchant key/salt for live
3. Get PhonePe live credentials
4. Configure live webhook URLs in both gateways
5. Test with real payment methods

### Medium-Term (Within 1 Month)
1. Add payment analytics dashboard
2. Implement refund API
3. Add email notifications
4. Generate donation receipts
5. Monitor and optimize gateway weights based on success rates

---

## ✅ Deployment Complete!

Once all checklist items are verified, deployment is complete. Monitor the system for the first 24-48 hours and adjust gateway weights if needed based on success rates.

**Deployed By**: Kiro AI Agent  
**Deployment Date**: July 22, 2026  
**Version**: Multi-Gateway Payment System v1.0

---

*For detailed technical documentation, see:*
- PAYMENT-INTEGRATION.md
- IMPLEMENTATION-SUMMARY.md
- QUICK-REFERENCE.md
