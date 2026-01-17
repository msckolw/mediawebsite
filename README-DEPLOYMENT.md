# NoBias Media - Deployment Documentation

Complete deployment and troubleshooting guide for NoBias Media platform.

---

## 📚 Documentation Structure

### [1-AWS-GUIDE.md](./1-AWS-GUIDE.md)
**AWS EC2 Backend Hosting**
- SSH connection commands
- EC2 instance management
- AWS CLI commands
- Monitoring and troubleshooting
- Security best practices

### [2-BACKEND-GUIDE.md](./2-BACKEND-GUIDE.md)
**Backend Deployment & Management**
- Deploy backend changes
- PM2 process management
- Environment variables
- Database updates
- Performance monitoring
- Rollback procedures

### [3-FRONTEND-GUIDE.md](./3-FRONTEND-GUIDE.md)
**Frontend Deployment & Fixes**
- Fix white screen bug (CURRENT ISSUE)
- Vercel deployment
- Local development
- Cache management
- Performance optimization
- Troubleshooting

### [4-GITHUB-GUIDE.md](./4-GITHUB-GUIDE.md)
**GitHub Actions & CI/CD**
- Automated deployments
- GitHub secrets setup
- Workflow configuration
- Deployment monitoring
- Rollback procedures

### [5-VERCEL-GUIDE.md](./5-VERCEL-GUIDE.md)
**Vercel Platform Management**
- Deployment methods
- Build configuration
- Environment variables
- Domain & DNS setup
- Performance optimization
- Cost management

---

## 🚨 Current Issue: White Screen Bug

**Problem:** Article pages show white screen on first click, work after refresh

**Quick Fix:**
```bash
# Option 1: Redeploy via Vercel Dashboard
# 1. Go to https://vercel.com/dashboard
# 2. Find project → Deployments → Latest → Redeploy
# 3. UNCHECK "Use existing Build Cache"
# 4. Click Redeploy

# Option 2: Push changes
git add vercel.json frontend/public/service-worker.js
git commit -m "fix: resolve chunk loading and caching issues"
git push origin main
```

**Details:** See [3-FRONTEND-GUIDE.md](./3-FRONTEND-GUIDE.md)

---

## 🚀 Quick Start

### Deploy Backend Changes
```bash
# Via SSH
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "cd ~/mediawebsite && git pull && cd backend && npm install && pm2 restart nobias-backend"

# Via GitHub Actions (automatic)
git add backend/
git commit -m "backend: your changes"
git push origin main
```

### Deploy Frontend Changes
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

### Check Backend Status
```bash
# API health
curl https://api.thenobiasmedia.com/api/news?page=1

# PM2 status
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"

# View logs
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend --lines 50"
```

### Check Frontend Status
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
┌───▼──┐  ┌──▼───┐
│Vercel│  │  EC2 │
│(CDN) │  │(API) │
└───┬──┘  └──┬───┘
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
- **Backend:** Node.js/Express on AWS EC2
- **Database:** MongoDB Atlas
- **CI/CD:** GitHub Actions
- **Process Manager:** PM2

---

## 🔗 Important Links

### Production
- **Website:** https://www.thenobiasmedia.com
- **API:** https://api.thenobiasmedia.com
- **API Test:** https://api.thenobiasmedia.com/api/news?page=1

### Dashboards
- **Vercel:** https://vercel.com/dashboard
- **AWS Console:** https://console.aws.amazon.com/ec2/
- **GitHub Actions:** https://github.com/msckolw/mediawebsite/actions
- **MongoDB Atlas:** https://cloud.mongodb.com

### Repository
- **GitHub:** https://github.com/msckolw/mediawebsite

---

## 🛠️ Common Tasks

### Restart Backend
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 restart nobias-backend"
```

### View Backend Logs
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend"
```

### Redeploy Frontend
```bash
# Via Vercel Dashboard: Deployments → Redeploy
# Or via CLI:
vercel --prod --force
```

### Update Environment Variables
```bash
# Backend (.env on EC2)
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "nano ~/mediawebsite/backend/.env"

# Frontend (Vercel Dashboard)
# Settings → Environment Variables
```

### Rollback Deployment
```bash
# Backend
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "cd ~/mediawebsite && git reset --hard <COMMIT_HASH> && cd backend && pm2 restart nobias-backend"

# Frontend (Vercel Dashboard)
# Deployments → Previous deployment → Promote to Production
```

---

## 🆘 Emergency Procedures

### Backend Down
```bash
# 1. Check if running
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"

# 2. Check logs
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend --err"

# 3. Restart
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 restart nobias-backend"

# 4. If still down, complete restart
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite/backend
pm2 stop nobias-backend
pm2 delete nobias-backend
pm2 start src/server.js --name nobias-backend
pm2 save
EOF
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

### Complete System Recovery
See detailed procedures in:
- Backend: [2-BACKEND-GUIDE.md](./2-BACKEND-GUIDE.md) → "Complete System Recovery"
- Frontend: [3-FRONTEND-GUIDE.md](./3-FRONTEND-GUIDE.md) → "Troubleshooting"

---

## 📞 Support

### Documentation
- AWS: [1-AWS-GUIDE.md](./1-AWS-GUIDE.md)
- Backend: [2-BACKEND-GUIDE.md](./2-BACKEND-GUIDE.md)
- Frontend: [3-FRONTEND-GUIDE.md](./3-FRONTEND-GUIDE.md)
- GitHub: [4-GITHUB-GUIDE.md](./4-GITHUB-GUIDE.md)
- Vercel: [5-VERCEL-GUIDE.md](./5-VERCEL-GUIDE.md)

### Quick Reference
```bash
# SSH to EC2
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com

# Deploy backend
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "cd ~/mediawebsite && git pull && cd backend && pm2 restart nobias-backend"

# Check status
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"

# Test API
curl https://api.thenobiasmedia.com/api/news?page=1

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
- ✅ Fixed service worker caching issues
- ✅ Fixed Vercel build configuration
- ✅ Consolidated documentation into 5 guides
- ✅ Updated GitHub Actions workflows
- ✅ Improved error handling

**Date:** January 17, 2026

---

## 🎯 Next Steps

1. **Fix white screen bug:** Follow [3-FRONTEND-GUIDE.md](./3-FRONTEND-GUIDE.md)
2. **Deploy fix:** Push changes or redeploy via Vercel
3. **Test thoroughly:** Verify article navigation works
4. **Monitor:** Check for any new errors

---

**Need Help?** Check the relevant guide above or review the troubleshooting sections.
