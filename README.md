# NoBias Media - Master Documentation

> **Current deployment:** The backend currently runs on Google Cloud Run. Google Cloud Build deploys it on GitHub pushes; [GitHub Actions](.github/workflows/deploy-backend.yml) validates backend and frontend changes but does not deploy. The Cloud Run URL is already configured in [`frontend/.env.production`](frontend/.env.production). The Render/EC2 deployment sections below are historical. See [CLOUD-RUN-DEPLOYMENT.md](CLOUD-RUN-DEPLOYMENT.md) for the current deployment details.

A news platform delivering unbiased news coverage with integrated donation system.
*This document serves as the single source of truth for the project's architecture, local development, and deployment as of July 2026.*

---

## 🏗️ Architecture

The application uses a modern, serverless architecture with integrated payment processing:

```text
┌─────────────────┐
│   Users         │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────────┐      ┌──────────┐
│Vercel│  │Render     │◄─────┤  PayU    │
│(CDN) │  │(Backend)  │      │ Gateway  │
└───┬──┘  └──┬────────┘      └──────────┘
    │        │
    │    ┌───▼────┐
    │    │MongoDB │
    │    │ Atlas  │
    │    └────────┘
    │
┌───▼──────────┐
│   Frontend   │
│ React SPA    │
└──────────────┘
```

| Component | Technology | Hosting | URL |
|-----------|-----------|---------|-----|
| **Frontend** | React | Vercel | https://www.thenobiasmedia.com |
| **Backend** | Node.js / Express | Render.com | https://mediawebsite.onrender.com |
| **Database** | MongoDB | Atlas | https://cloud.mongodb.com |
| **Payment Gateway** | PayU | Cloud | https://test.payu.in (test) / https://secure.payu.in (prod) |
| **CI/CD** | GitHub Actions | Auto-deploy on push to `main` | - |

---

## ⚠️ Known Issues

### Render Backend Endpoint Issue
**Problem**: Render free tier spins down after 15 minutes of inactivity, causing:
- First request after idle period takes 50+ seconds (cold start)
- Payment callbacks from PayU may timeout during cold starts
- Poor user experience with loading delays

**Impact on Payment Flow**:
- Donation form submission may appear frozen
- PayU success/failure callbacks may fail
- Webhook delivery may timeout

**Solutions Being Considered**:
1. **Upgrade to Render Paid Plan** ($7/month) - Keeps instance always warm
2. **Migrate to Railway/Fly.io** - Better free tier performance
3. **Add Health Check Pinger** - Keep-alive service to prevent spin-down
4. **Hybrid Approach** - Keep payment APIs on always-on service, other routes on free tier

**Current Workaround**:
- Backend health check endpoint: `GET /api/health`
- Frontend pings this every 10 minutes when donate page is open
- Still not perfect for webhook reliability

---

## 💻 Local Development (Quick Start)

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas connection string
- PayU test account credentials (for payment testing)

### 1. Setup Environment Variables

**Backend** (`backend/.env`):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
PORT=5002
JWT_SECRET=your-secret-key
PAYU_MERCHANT_KEY=your-test-key
PAYU_MERCHANT_SALT=your-test-salt
PAYU_MODE=test
PUBLIC_API_URL=http://localhost:5002
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5002
```

### 2. Run Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5002
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

### 4. Test Payment Flow (Local)
1. Navigate to `http://localhost:3000/donate`
2. Fill donation form with test details
3. Use PayU test cards: `5123456789012346` (success) or `4012001037141112` (failure)
4. Verify payment status updates in MongoDB

---

## 🚀 Deployment Guide

Both the frontend and backend are configured to **automatically deploy** when you push to the `main` branch on GitHub.

```bash
git add .
git commit -m "your update message"
git push origin main
```

### Backend (Render.com)
- **Build Command**: `npm install`
- **Start Command**: `node src/server.js`
- **Environment Variables** (Set in Render Dashboard):
  ```
  MONGODB_URI=<your-atlas-connection-string>
  PORT=5002
  JWT_SECRET=<your-secret>
  PAYU_MERCHANT_KEY=<your-live-key>
  PAYU_MERCHANT_SALT=<your-live-salt>
  PAYU_MODE=live
  PUBLIC_API_URL=https://mediawebsite.onrender.com
  FRONTEND_URL=https://www.thenobiasmedia.com
  ```
- **Health Check**: `/api/health`
- **Important**: 
  - Free tier spins down after 15 min inactivity (see Known Issues)
  - MongoDB Atlas Network Access must include Render IPs or `0.0.0.0/0`
  - PayU webhook URL must be configured in PayU dashboard

### Frontend (Vercel)
- **Framework Preset**: Create React App
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Environment Variables** (Set in Vercel Dashboard):
  ```
  REACT_APP_API_URL=https://mediawebsite.onrender.com
  ```
- **Important**: 
  - Ensure backend URL doesn't have trailing slash
  - Clear deployment cache if changes don't appear

### PayU Configuration (Required for Payments)
1. **Login to PayU Dashboard**: https://onboarding.payu.in
2. **Set Webhook URL**: 
   - Go to Settings → Technical Info
   - Set Success URL: `https://mediawebsite.onrender.com/api/payments/payu/success`
   - Set Failure URL: `https://mediawebsite.onrender.com/api/payments/payu/failure`
   - Set Webhook URL: `https://mediawebsite.onrender.com/api/payments/payu/webhook`
3. **Get Credentials**:
   - Copy Merchant Key and Salt
   - Add to Render environment variables
4. **Test Mode**: Use `https://test.payu.in` base URL and test credentials for development

---

## 📁 Project Structure

```text
mediawebsite/
├── backend/                    # Node.js Express Backend
│   ├── src/
│   │   ├── server.js           # Express server entry point
│   │   ├── socket.js           # WebSocket server (real-time news)
│   │   ├── routes/
│   │   │   ├── newsRoutes.js   # News CRUD APIs
│   │   │   ├── authRoutes.js   # OAuth & JWT authentication
│   │   │   └── paymentRoutes.js # PayU payment integration
│   │   ├── models/
│   │   │   ├── News.js         # News article schema
│   │   │   ├── OAuth.js        # User OAuth tokens
│   │   │   ├── Payment.js      # Payment transaction schema
│   │   │   └── SourceType.js   # News source types
│   │   ├── utils/
│   │   │   ├── validateToken.js # JWT validation middleware
│   │   │   └── payu.js         # PayU hash & verification utilities
│   │   └── environment/
│   │       └── environment.js  # Environment config loader
│   └── package.json
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── App.js              # Main app router
│   │   ├── services/
│   │   │   ├── api.js          # Axios API client
│   │   │   └── paymentService.js # Payment API wrapper
│   │   ├── pages/
│   │   │   ├── DonatePage.js   # Donation form
│   │   │   ├── DonateStatusPage.js # Payment status
│   │   │   └── RefundPolicy.js # Refund policy page
│   │   └── components/
│   │       ├── NewsGrid.js     # News listing
│   │       ├── AdminPanel.js   # Admin dashboard
│   │       ├── Header.js       # Navigation bar
│   │       └── Footer.js       # Footer with links
│   └── package.json
├── Dockerfile                  # Docker build config (for Cloud Run/Railway)
├── .dockerignore
└── vercel.json                 # Vercel deployment config
```

---

## 💳 Payment Integration (PayU)

### Overview
The donation system is fully integrated with PayU payment gateway, supporting:
- UPI, Credit/Debit Cards, Net Banking
- Server-side hash generation (secure)
- Webhook-based status updates
- Transaction verification API
- Guest donations (no login required)

### Payment Flow
```text
User fills form → Backend creates payment → User redirected to PayU
                    ↓                           ↓
              Saves to MongoDB            User completes payment
                                              ↓
                                    PayU sends webhook to backend
                                              ↓
                                    Backend updates payment status
                                              ↓
                                    User redirected to status page
```

### API Endpoints

#### 1. Create Payment
```http
POST /api/payments/create
Content-Type: application/json

{
  "amount": "500",
  "firstname": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "method": "all" // "upi", "card", or "all"
}

Response:
{
  "txnid": "nbm1721654321abc",
  "action": "https://test.payu.in/_payment",
  "fields": {
    "key": "...",
    "txnid": "nbm1721654321abc",
    "amount": "500.00",
    "hash": "...",
    "surl": "...",
    "furl": "..."
  }
}
```

#### 2. Get Payment Status
```http
GET /api/payments/:txnid

Response:
{
  "txnid": "nbm1721654321abc",
  "amount": "500.00",
  "status": "success", // "pending", "success", "failed"
  "method": "upi",
  "mode": "UPI",
  "productinfo": "NBM Donation",
  "createdAt": "2026-07-22T10:30:00.000Z",
  "updatedAt": "2026-07-22T10:35:00.000Z"
}
```

#### 3. Verify Payment (Manual Check)
```http
POST /api/payments/:txnid/verify

Response: Same as Get Payment Status (updated from PayU)
```

#### 4. PayU Callbacks (Internal Use)
```http
POST /api/payments/payu/success   # PayU redirects here on success
POST /api/payments/payu/failure   # PayU redirects here on failure
POST /api/payments/payu/webhook   # PayU sends async updates here
```

### Database Schema (Payment Model)

```javascript
{
  txnid: String,              // Unique transaction ID (e.g., "nbm1721654321abc")
  gateway: String,            // "payu" (future: "phonepe")
  amount: String,             // Amount in INR (e.g., "500.00")
  productinfo: String,        // "NBM Donation"
  firstname: String,          // Donor name
  email: String,              // Donor email
  phone: String,              // Donor phone (10 digits)
  method: String,             // "upi", "card", or "all"
  status: String,             // "pending", "success", "failed"
  
  // PayU specific fields
  payuStatus: String,         // Original PayU status
  mihpayid: String,           // PayU transaction reference
  mode: String,               // Payment mode (e.g., "UPI", "CC")
  bankcode: String,           // Bank code
  error: String,              // Error code (if failed)
  errorMessage: String,       // Error description
  hashVerified: Boolean,      // Was webhook hash valid?
  rawResponse: Object,        // Full PayU response
  
  createdAt: Date,
  updatedAt: Date
}
```

### Security Features
1. **Server-Side Hash Generation**: PayU salt never exposed to frontend
2. **Hash Verification**: All callbacks verified with SHA-512 hash
3. **Duplicate Protection**: `txnid` is unique and indexed
4. **Amount Validation**: Min ₹10, Max ₹1,00,000
5. **Input Sanitization**: Email regex, phone 10-digit validation
6. **Status Lock**: Success payments cannot be overwritten by delayed webhooks

### Testing Payment Flow

**Test Card Numbers** (PayU Test Mode):
- Success: `5123456789012346`
- Failure: `4012001037141112`
- CVV: `123`
- Expiry: Any future date

**Test UPI**:
- Use `success@payu` for success
- Use `failure@payu` for failure

### Future Enhancement: Multi-Gateway Support

**Planned Architecture**:
```javascript
// Random gateway selection (70% PayU, 30% PhonePe)
const gateway = selectGateway(amount, method);

// Payment model will store:
{
  gateway: "payu" | "phonepe",
  
  // PayU fields
  mihpayid: String,
  
  // PhonePe fields  
  transactionId: String,
  merchantId: String
}
```

**Why Multi-Gateway?**:
- Load distribution across gateways
- Failover if one gateway is down
- Better success rates (some users prefer specific gateways)
- Avoid single point of failure

**Implementation Status**: Not yet implemented (PayU only for now)

---

## 🛠️ Troubleshooting

### Backend Issues

#### Backend Not Responding (Render Spin-Down)
**Symptoms**: API requests take 50+ seconds on first load after idle period

**Diagnosis**:
```bash
# Check if backend is warm
curl https://mediawebsite.onrender.com/api/health

# If it takes >30s, backend was sleeping
```

**Solutions**:
1. **Immediate**: Wait for cold start to complete (first request wakes it up)
2. **Short-term**: Implement frontend keep-alive pinger (ping `/api/health` every 10 min)
3. **Long-term**: Upgrade to Render paid plan ($7/month for always-on)

#### MongoDB Connection Errors
**Symptoms**: Backend logs show `MongoNetworkError` or `ECONNREFUSED`

**Solutions**:
1. Verify `MONGODB_URI` is correct in Render environment variables
2. Check MongoDB Atlas → Network Access → Add `0.0.0.0/0` (allow all IPs)
3. Ensure cluster is not paused (check Atlas dashboard)

#### Payment Webhook Not Received
**Symptoms**: Payment stuck in "pending" status after completing on PayU

**Diagnosis**:
```bash
# Check if webhook endpoint is accessible
curl -X POST https://mediawebsite.onrender.com/api/payments/payu/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "txnid=test123&status=success"
```

**Solutions**:
1. **Cold Start Issue**: Backend was sleeping when PayU sent webhook
   - Solution: Upgrade to paid Render plan or migrate to Railway/Fly.io
2. **Wrong Webhook URL**: Check PayU dashboard has correct webhook URL
3. **Hash Mismatch**: Verify `PAYU_MERCHANT_SALT` matches PayU dashboard
4. **Manual Verification**: Use verify payment API as fallback:
   ```bash
   POST /api/payments/:txnid/verify
   ```

### Frontend Issues

#### Blank White Screen
**Symptoms**: Vercel deployment succeeds but site shows white screen

**Solutions**:
1. Open browser console (F12) and check for errors
2. Common error: `Failed to fetch` → Backend URL is wrong or backend is down
3. Verify `REACT_APP_API_URL` in Vercel environment variables
4. Check if backend is responding: `curl https://mediawebsite.onrender.com/api/health`
5. Clear Vercel cache and redeploy

#### Payment Form Not Submitting
**Symptoms**: "Donate" button spins forever

**Solutions**:
1. Check browser console for API errors
2. Verify backend `/api/payments/create` endpoint is working:
   ```bash
   curl -X POST https://mediawebsite.onrender.com/api/payments/create \
     -H "Content-Type: application/json" \
     -d '{"amount":"100","firstname":"Test","email":"test@test.com","phone":"9876543210","method":"all"}'
   ```
3. If backend is sleeping, wait for cold start or implement keep-alive
4. Check PayU credentials are set in backend environment variables

#### Payment Status Shows Wrong Status
**Symptoms**: Paid successfully on PayU but status page shows "pending" or "failed"

**Solutions**:
1. **Immediate**: Use manual verification
   ```javascript
   // Frontend code
   await fetch(`${API_URL}/api/payments/${txnid}/verify`, { method: 'POST' });
   ```
2. **Root Cause**: Webhook delivery failed (likely due to backend cold start)
3. **Long-term**: Implement retry logic in frontend:
   ```javascript
   // Poll status every 3 seconds for up to 1 minute
   const checkStatus = async () => {
     for (let i = 0; i < 20; i++) {
       const res = await fetch(`${API_URL}/api/payments/${txnid}`);
       const data = await res.json();
       if (data.status !== 'pending') return data;
       await new Promise(resolve => setTimeout(resolve, 3000));
     }
   };
   ```

### PayU Integration Issues

#### Invalid Hash Error
**Symptoms**: PayU returns "Invalid hash" error

**Solutions**:
1. Verify `PAYU_MERCHANT_KEY` and `PAYU_MERCHANT_SALT` match PayU dashboard exactly (no spaces)
2. Ensure `PAYU_MODE` is set to `test` for test credentials or `live` for production
3. Check hash generation in `backend/src/utils/payu.js` matches PayU documentation

#### Payment Gets Stuck
**Symptoms**: User completes payment on PayU but never redirected back

**Solutions**:
1. Check Success URL and Failure URL in PayU dashboard are correct
2. Ensure `PUBLIC_API_URL` environment variable is set correctly (no trailing slash)
3. Test callback URLs manually:
   ```bash
   curl https://mediawebsite.onrender.com/api/payments/payu/success
   # Should redirect to frontend donate/status page
   ```

### Database Issues

#### Payment Not Saving
**Symptoms**: API returns 500 error when creating payment

**Solutions**:
1. Check backend logs for MongoDB errors
2. Verify `Payment` model is properly exported in `backend/src/models/Payment.js`
3. Ensure MongoDB connection is established before handling requests
4. Check if `txnid` already exists (duplicate transaction ID)

#### Old Payments Not Showing
**Symptoms**: Admin panel doesn't show payment history

**Solutions**:
1. Verify MongoDB query in admin API (if implemented)
2. Check date range filters are not excluding old payments
3. Ensure proper indexing on `createdAt` field for performance

---

## 🔐 Environment Variables Reference

### Backend (Render)
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/nbm` | ✅ Yes |
| `PORT` | Server port | `5002` | ✅ Yes |
| `JWT_SECRET` | Secret for JWT token signing | `your-secret-key-here` | ✅ Yes |
| `PAYU_MERCHANT_KEY` | PayU merchant key | `ABCD1234` | ✅ Yes (for payments) |
| `PAYU_MERCHANT_SALT` | PayU merchant salt | `xyz789` | ✅ Yes (for payments) |
| `PAYU_MODE` | PayU environment | `test` or `live` | ✅ Yes (for payments) |
| `PUBLIC_API_URL` | Public backend URL (no trailing slash) | `https://mediawebsite.onrender.com` | ✅ Yes (for payments) |
| `FRONTEND_URL` | Frontend URL (no trailing slash) | `https://www.thenobiasmedia.com` | ✅ Yes (for redirects) |

### Frontend (Vercel)
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `REACT_APP_API_URL` | Backend API URL (no trailing slash) | `https://mediawebsite.onrender.com` | ✅ Yes |

---

## 📊 Monitoring & Logs

### Backend Logs (Render)
```bash
# Access via Render Dashboard → Your Service → Logs
# Or use Render CLI:
render logs --service mediawebsite
```

**What to monitor**:
- Cold start times (look for "Server started" logs)
- Payment webhook deliveries
- MongoDB connection errors
- PayU hash verification failures

### Frontend Logs (Vercel)
```bash
# Access via Vercel Dashboard → Your Project → Logs
# Or use Vercel CLI:
vercel logs
```

**What to monitor**:
- API fetch errors
- Payment form submission failures
- Redirect issues after payment

### PayU Logs
**Access**: PayU Dashboard → Transactions

**What to monitor**:
- Webhook delivery status
- Failed payments with error codes
- Hash verification failures

---

## 🚦 Health Checks

### Backend Health Check
```bash
curl https://mediawebsite.onrender.com/api/health
# Expected: 200 OK with JSON response
```

### Payment System Health
```bash
# Test payment creation
curl -X POST https://mediawebsite.onrender.com/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "10",
    "firstname": "Test User",
    "email": "test@example.com",
    "phone": "9876543210",
    "method": "all"
  }'

# Expected: 200 OK with txnid and PayU form fields
```

### Database Health
```bash
# Check if MongoDB is accepting connections
# (Requires admin API endpoint - not yet implemented)
curl https://mediawebsite.onrender.com/api/admin/health
```

---

## 📝 Development Checklist

### Before Starting Development
- [ ] MongoDB Atlas cluster is running and accessible
- [ ] PayU test account is active
- [ ] Environment variables are set in `.env` files
- [ ] Node.js 18+ is installed
- [ ] `npm install` completed in both `backend/` and `frontend/`

### Before Deploying to Production
- [ ] All environment variables set in Render dashboard
- [ ] All environment variables set in Vercel dashboard
- [ ] PayU live credentials configured (not test mode)
- [ ] PayU webhook URLs updated to production URLs
- [ ] MongoDB Atlas allows Render IPs (or `0.0.0.0/0`)
- [ ] Test payment flow end-to-end on staging
- [ ] Backend health check returns 200 OK
- [ ] Frontend can reach backend API
- [ ] Cold start time is acceptable (<30s) or paid plan enabled

### Payment Integration Checklist
- [✅] Create payment API (`POST /api/payments/create`)
- [✅] Payment model with all required fields
- [✅] Server-side hash generation (PayU salt secure)
- [✅] Success/failure callback handlers
- [✅] Webhook handler with hash verification
- [✅] Payment status API (`GET /api/payments/:txnid`)
- [✅] Manual verification API (`POST /api/payments/:txnid/verify`)
- [✅] Frontend donation form
- [✅] Frontend payment status page
- [✅] Refund policy page
- [✅] Amount validation (₹10-₹100,000)
- [✅] Email and phone validation
- [✅] Duplicate transaction protection
- [✅] Success payment status lock (prevents overwrites)
- [❌] Refund API (manual refunds only for now)
- [❌] Multi-gateway support (PhonePe integration pending)
- [❌] Admin payment dashboard (pending)

---

## 🔮 Roadmap

### Immediate Priorities
1. **Fix Render Cold Start Issue**
   - [ ] Implement frontend keep-alive pinger
   - [ ] Add retry logic for payment webhooks
   - [ ] Consider migration to Railway/Fly.io or paid Render plan

2. **Payment System Enhancements**
   - [ ] Add admin payment dashboard (view all donations)
   - [ ] Implement refund API (admin-only)
   - [ ] Add email notifications on successful donations
   - [ ] Generate donation receipts (PDF download)

### Near-Term Features
3. **Multi-Gateway Support**
   - [ ] Integrate PhonePe payment gateway
   - [ ] Implement smart gateway selection (70/30 split)
   - [ ] Add gateway failover logic
   - [ ] Update Payment model to support multiple gateways

4. **Analytics & Reporting**
   - [ ] Donation analytics dashboard
   - [ ] Monthly donation reports
   - [ ] Top donors leaderboard (with consent)
   - [ ] Payment success/failure rate tracking

### Long-Term Vision
5. **Subscription/Recurring Donations**
   - [ ] Monthly/yearly recurring donation plans
   - [ ] Auto-debit integration
   - [ ] Donor management portal

6. **Mobile App**
   - [ ] React Native mobile app
   - [ ] Push notifications for news updates
   - [ ] In-app donations

---

## 🤝 Contributing

### Code Style
- Use 2 spaces for indentation
- Use `const` over `let` where possible
- Add comments for complex logic
- Follow existing naming conventions

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: descriptive commit message"

# Push and create PR
git push origin feature/your-feature-name
```

### Commit Message Format
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, no logic change)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

---

## 📞 Support & Contact

- **Technical Issues**: Create an issue on GitHub
- **Payment Issues**: Check PayU dashboard or contact PayU support
- **Deployment Issues**: Check Render/Vercel logs first

---

---

## 📚 Additional Documentation

- **[PAYMENT-INTEGRATION.md](PAYMENT-INTEGRATION.md)** - Complete technical documentation for PayU payment gateway integration
- **[RENDER-ISSUE.md](RENDER-ISSUE.md)** - Detailed analysis of Render backend cold start issue and solutions
- **[IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md)** - Implementation checklist, status, and metrics

---

*Last Updated: July 22, 2026*
*Note: This documentation reflects the current state of the payment integration. The multi-gateway support (PhonePe) and refund API are planned but not yet implemented.*
