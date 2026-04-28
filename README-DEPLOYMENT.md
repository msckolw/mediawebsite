# NoBias Media - Deployment Documentation

Complete deployment and troubleshooting guide for NoBias Media platform.

---

## 📚 Documentation Structure

### [RENDER-DEPLOYMENT-GUIDE.md](./RENDER-DEPLOYMENT-GUIDE.md) ⭐ PRIMARY
**Render Backend Hosting (CURRENT)**
- Quick deployment guide
- Environment variables
- Monitoring and logs
- Auto-deploy setup
- Troubleshooting

### [1-AWS-GUIDE.md](./1-AWS-GUIDE.md) (LEGACY)
**AWS EC2 Backend Hosting (Deprecated)**
- Kept for reference only
- No longer in active use

### [2-BACKEND-GUIDE.md](./2-BACKEND-GUIDE.md)
**Backend Deployment & Management**
- Deploy backend changes
- Environment variables
- Database updates
- Performance monitoring
- Rollback procedures

### [3-FRONTEND-GUIDE.md](./3-FRONTEND-GUIDE.md)
**Frontend Deployment & Fixes**
- Vercel deployment
- Local development
- Cache management
- Performance optimization
- Troubleshooting

### [4-GITHUB-GUIDE.md](./4-GITHUB-GUIDE.md)
**GitHub Actions & CI/CD**
- Automated deployments to Render
- GitHub secrets setup
- Workflow configuration
- Deployment monitoring

### [5-VERCEL-GUIDE.md](./5-VERCEL-GUIDE.md)
**Vercel Platform Management**
- Deployment methods
- Build configuration
- Environment variables
- Domain & DNS setup
- Performance optimization

---

## 🚀 Quick Start

### Deploy Backend Changes (Render)
```bash
# Automatic via GitHub push
git add backend/
git commit -m "backend: your changes"
git push origin main

# Render auto-deploys in 1-2 minutes
# Monitor: https://dashboard.render.com
```

### Deploy Frontend Changes (Vercel)
```bash
# Automatic via Vercel
git add frontend/
git commit -m "frontend: your changes"
git push origin main

# Manual via Vercel CLI
vercel --prod
```

---

## 🔍 Quick Diagnostics

### Check Backend Status (Render)
```bash
# API health
curl https://nobiasmedia.onrender.com/api/news?page=1

# Check Render dashboard
# Go to: https://dashboard.render.com
```

### Check Frontend Status (Vercel)
```bash
# Test live site
curl -I https://www.thenobiasmedia.com

# Check Vercel deployments
# Go to: https://vercel.com/dashboard
```

### Check GitHub Actions
```bash
# View workflow status
# Go to: https://github.com/msckolw/mediawebsite/actions
```

---

## 📊 System Overview

### Architecture
```
┌─────────────────┐
│   Users         │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────┐
│Vercel│  │Render │
│(CDN) │  │ (API) │
└───┬──┘  └──┬────┘
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

### Components
- **Frontend:** React app on Vercel CDN
- **Backend:** Node.js/Express on Render
- **Database:** MongoDB Atlas
- **CI/CD:** GitHub Actions → Render auto-deploy
- **Process Manager:** Render (managed)

---

## 🔗 Important Links

### Production
- **Website:** https://www.thenobiasmedia.com
- **API:** https://nobiasmedia.onrender.com
- **API Test:** https://nobiasmedia.onrender.com/api/news?page=1

### Dashboards
- **Render:** https://dashboard.render.com
- **Vercel:** https://vercel.com/dashboard
- **GitHub Actions:** https://github.com/msckolw/mediawebsite/actions
- **MongoDB Atlas:** https://cloud.mongodb.com

### Repository
- **GitHub:** https://github.com/msckolw/mediawebsite

---

## 🛠️ Common Tasks

### View Backend Logs (Render)
```bash
# Via Dashboard
# 1. Go to https://dashboard.render.com
# 2. Select your service
# 3. Click "Logs" tab
```

### Restart Backend (Render)
```bash
# Via Dashboard
# 1. Go to https://dashboard.render.com
# 2. Select your service
# 3. Click "Manual Deploy" → "Clear build cache & deploy"
```

### Redeploy Frontend (Vercel)
```bash
# Via Vercel Dashboard: Deployments → Redeploy
# Or via CLI:
vercel --prod --force
```

### Update Environment Variables

**Backend (Render Dashboard):**
1. Go to https://dashboard.render.com
2. Select service → Environment
3. Add/Edit variables
4. Service auto-restarts

**Frontend (Vercel Dashboard):**
1. Settings → Environment Variables
2. Add/Edit variables
3. Redeploy to apply

---

## 🆘 Emergency Procedures

### Backend Down
```bash
# 1. Check Render dashboard
# Go to: https://dashboard.render.com

# 2. Check logs
# Dashboard → Service → Logs

# 3. Manual redeploy
# Dashboard → Manual Deploy → Deploy

# 4. Test API
curl https://nobiasmedia.onrender.com/api/news?page=1
```

### Frontend Down
```bash
# 1. Check Vercel status
# Go to: https://vercel.com/dashboard

# 2. Check build logs
# Dashboard → Deployments → Latest → Build Logs

# 3. Redeploy
# Dashboard → Deployments → Latest → Redeploy (uncheck cache)
```

---

## 📞 Support

### Documentation
- **Render:** [RENDER-DEPLOYMENT-GUIDE.md](./RENDER-DEPLOYMENT-GUIDE.md)
- **Backend:** [2-BACKEND-GUIDE.md](./2-BACKEND-GUIDE.md)
- **Frontend:** [3-FRONTEND-GUIDE.md](./3-FRONTEND-GUIDE.md)
- **GitHub:** [4-GITHUB-GUIDE.md](./4-GITHUB-GUIDE.md)
- **Vercel:** [5-VERCEL-GUIDE.md](./5-VERCEL-GUIDE.md)

### Quick Reference
```bash
# Test API
curl https://nobiasmedia.onrender.com/api/news?page=1

# Deploy backend (push to main)
git push origin main

# Deploy frontend
vercel --prod
```

---

## ✅ Deployment Checklist

### Before Deploying
- [ ] Code tested locally
- [ ] No console errors
- [ ] Environment variables updated
- [ ] Dependencies installed
- [ ] Build succeeds locally

### After Deploying
- [ ] Deployment succeeded
- [ ] API responds correctly
- [ ] Frontend loads without errors
- [ ] Test key user flows
- [ ] Monitor logs for errors

---

## 📝 Change Log

**Latest Changes:**
- ✅ **Migrated from AWS EC2 to Render**
- ✅ Updated GitHub Actions for Render deployment
- ✅ Updated frontend to use Render API
- ✅ Simplified deployment process
- ✅ Zero-maintenance backend hosting

**Date:** April 29, 2026

---

## 🎯 Current Status

- **Backend:** ✅ Live on Render (https://nobiasmedia.onrender.com)
- **Frontend:** ✅ Live on Vercel (https://www.thenobiasmedia.com)
- **Database:** ✅ MongoDB Atlas
- **CI/CD:** ✅ GitHub Actions → Render auto-deploy

---

**Need Help?** Check [RENDER-DEPLOYMENT-GUIDE.md](./RENDER-DEPLOYMENT-GUIDE.md) for detailed instructions.
