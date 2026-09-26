# Quick Reference Card - NoBias Media Payment System

**Last Updated**: July 22, 2026  
**Print this and keep it handy!**

---

## 🚀 Quick Commands

### Local Development
```bash
# Start backend
cd backend && npm run dev

# Start frontend (new terminal)
cd frontend && npm start

# Test payment creation
curl -X POST http://localhost:5002/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{"amount":"100","firstname":"Test","email":"test@example.com","phone":"9876543210","method":"all"}'
```

### Check Production Status
```bash
# Backend health
curl https://mediawebsite.onrender.com/api/health

# Get payment status
curl https://mediawebsite.onrender.com/api/payments/YOUR_TXNID

# Verify payment
curl -X POST https://mediawebsite.onrender.com/api/payments/YOUR_TXNID/verify
```

---

## 🔗 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | https://www.thenobiasmedia.com | Public website |
| **Donate Page** | https://www.thenobiasmedia.com/donate | Donation form |
| **Backend** | https://mediawebsite.onrender.com | API server |
| **Backend Health** | https://mediawebsite.onrender.com/api/health | Check if backend is warm |
| **PayU Dashboard** | https://onboarding.payu.in | PayU merchant dashboard |
| **MongoDB Atlas** | https://cloud.mongodb.com | Database management |
| **Render Dashboard** | https://render.com | Backend hosting |
| **Vercel Dashboard** | https://vercel.com | Frontend hosting |

---

## 📋 API Endpoints Cheat Sheet

### Create Payment
```bash
POST /api/payments/create
Body: { amount, firstname, email, phone, method }
Returns: { txnid, action, fields }
```

### Get Status
```bash
GET /api/payments/:txnid
Returns: { txnid, amount, status, ... }
```

### Verify Payment
```bash
POST /api/payments/:txnid/verify
Returns: Updated payment from PayU
```

---

## 🧪 Test Credentials (PayU)

### Test Cards
```
Success Card: 5123456789012346
Failure Card: 4012001037141112
CVV: 123
Expiry: Any future date
```

### Test UPI
```
Success: success@payu
Failure: failure@payu
```

---

## 🔐 Environment Variables Quick Check

### Backend (Render)
```bash
MONGODB_URI=mongodb+srv://...
PORT=5002
JWT_SECRET=...
PAYU_MERCHANT_KEY=...         # ← Must match PayU dashboard
PAYU_MERCHANT_SALT=...        # ← Keep secret!
PAYU_MODE=test                # or 'live'
PUBLIC_API_URL=https://mediawebsite.onrender.com
FRONTEND_URL=https://www.thenobiasmedia.com
```

### Frontend (Vercel)
```bash
REACT_APP_API_URL=https://mediawebsite.onrender.com
```

---

## ⚠️ Common Issues & Quick Fixes

### Issue: Payment Stuck on "Pending"
**Quick Fix**: Click "Verify Now" button on status page  
**Root Cause**: Backend cold start (webhook timeout)  
**Permanent Fix**: Upgrade Render to paid plan

### Issue: Backend Not Responding
**Quick Check**: 
```bash
curl https://mediawebsite.onrender.com/api/health
```
**If slow (>10s)**: Backend is cold starting, wait 1 minute  
**If error**: Check Render dashboard for crashes

### Issue: "Invalid Hash" Error
**Check**: 
1. `PAYU_MERCHANT_SALT` matches PayU dashboard (no spaces)
2. `PAYU_MODE` matches credentials (test vs live)

### Issue: Frontend Shows Blank Screen
**Check**:
1. Browser console for errors (F12)
2. `REACT_APP_API_URL` in Vercel is correct
3. Backend is responding

---

## 🚨 Emergency Contacts

### PayU Support
- Email: support@payu.in
- Phone: +91-124-4656999
- Dashboard: https://onboarding.payu.in

### Render Support
- Help Center: https://render.com/docs
- Status Page: https://status.render.com

### Vercel Support
- Help Center: https://vercel.com/help
- Status Page: https://www.vercel-status.com

---

## 📊 Key Metrics to Monitor

### Payment Metrics
- Total donations today/week/month
- Success rate (target: >95%)
- Average donation amount
- Payment method distribution

### Technical Metrics
- Backend response time (target: <1s)
- Webhook delivery success (target: >95%)
- Cold start frequency (target: 0 with paid plan)
- API error rate (target: <1%)

---

## 🔧 Troubleshooting Flowchart

```text
Payment Issue?
    ↓
Check backend health (/api/health)
    ↓
    ├─ Takes >10s → Backend cold (wait or upgrade)
    ├─ Error 500 → Check Render logs
    └─ OK 200 → Continue
        ↓
Check payment status (GET /api/payments/:txnid)
    ↓
    ├─ Status: success → No issue!
    ├─ Status: failed → Check PayU dashboard for reason
    └─ Status: pending → Use verify API or wait
        ↓
Try manual verification (POST /api/payments/:txnid/verify)
    ↓
    ├─ Now success → Webhook failed (cold start issue)
    └─ Still pending → Check PayU dashboard
```

---

## 📁 File Locations Quick Reference

### Backend
```
routes/paymentRoutes.js       - Payment APIs
models/Payment.js             - Database schema
utils/payu.js                 - PayU utilities
server.js                     - Entry point
```

### Frontend
```
pages/DonatePage.js           - Donation form
pages/DonateStatusPage.js     - Payment status
services/paymentService.js    - API wrapper
```

### Documentation
```
README.md                     - Main documentation
PAYMENT-INTEGRATION.md        - Technical docs
RENDER-ISSUE.md              - Cold start issue
IMPLEMENTATION-SUMMARY.md     - Status & checklist
QUICK-REFERENCE.md           - This file!
```

---

## 🎯 Status at a Glance

```
✅ Features Complete:        14/16 (87.5%)
⚠️ Critical Issues:          1 (Render cold start)
🚀 Production Ready:         Yes (with workaround)
📈 Recommended Action:       Upgrade Render ($7/mo)
⏰ Action Deadline:          Within 1 week
```

---

## 💡 Quick Decision Guide

### Should I upgrade Render?
**If yes to any**:
- Getting >10 donations/month
- Users complaining about slow payment
- Late night/early morning donations important
- Want professional reliability

**Cost**: $7/month  
**Benefit**: 0 cold starts, 100% webhook delivery

### Should I migrate to Railway?
**If yes to both**:
- Want to save $2/month ($5 vs $7)
- Can spend 2 hours on migration

**Cost**: $5/month  
**Benefit**: Same reliability as Render paid

### Should I add PhonePe?
**If yes to any**:
- Getting >50 donations/month
- Users prefer UPI over cards
- Want load balancing across gateways

**Effort**: ~8 hours development  
**Benefit**: Better UPI experience, redundancy

---

## 🔄 Regular Maintenance Checklist

### Daily
- [ ] Check payment success rate
- [ ] Monitor backend cold starts
- [ ] Review error logs

### Weekly
- [ ] Export donation report
- [ ] Check webhook delivery rate
- [ ] Review PayU dashboard

### Monthly
- [ ] Reconcile PayU transactions with database
- [ ] Update dependencies (npm update)
- [ ] Review and archive old logs

---

## 📞 Who to Call

### Payment Issues
1. Check PayU dashboard first
2. Use manual verification API
3. Contact PayU support if needed

### Backend Issues
1. Check Render dashboard
2. Review backend logs
3. Restart service if needed
4. Contact Render support

### Frontend Issues
1. Check browser console
2. Verify environment variables in Vercel
3. Clear cache and redeploy

### Database Issues
1. Check MongoDB Atlas dashboard
2. Verify network access settings
3. Check connection string
4. Contact MongoDB support

---

## 🎓 Learning Resources

### PayU Documentation
- Integration Guide: https://docs.payu.in/docs/integration-overview
- Hash Guide: https://docs.payu.in/docs/hash-generation
- Testing Guide: https://docs.payu.in/docs/testing

### Render Documentation
- Getting Started: https://render.com/docs
- Environment Variables: https://render.com/docs/environment-variables
- Troubleshooting: https://render.com/docs/troubleshooting

### MongoDB Best Practices
- Connection Guide: https://www.mongodb.com/docs/drivers/node/current/
- Schema Design: https://www.mongodb.com/docs/manual/core/data-modeling-introduction/

---

## ✅ Pre-Deployment Checklist

### Code
- [ ] All tests passing
- [ ] No console.log in production code
- [ ] Environment variables documented
- [ ] Error handling complete

### Configuration
- [ ] PayU live credentials in Render
- [ ] Webhook URLs in PayU dashboard
- [ ] MongoDB network access configured
- [ ] Render/Vercel env vars set

### Testing
- [ ] End-to-end payment tested
- [ ] Webhook delivery confirmed
- [ ] Status page updates verified
- [ ] Edge cases tested

### Documentation
- [ ] README.md updated
- [ ] API changes documented
- [ ] Environment variables listed
- [ ] Known issues disclosed

---

**Print this card and keep it accessible!**  
**For detailed info, see full documentation files.**
