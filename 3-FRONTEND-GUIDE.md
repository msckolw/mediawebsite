# Frontend Deployment Guide

## Current Issue: White Screen Bug

**Problem:** Article pages show white screen on first click, work after refresh  
**Cause:** Missing chunk files + service worker caching issues  
**Status:** ✅ Fixed, ready to deploy

---

## Quick Fix (Choose One)

### Option 1: Automated Script
```bash
./deploy-fix.sh
```

### Option 2: Manual Git Push
```bash
git add vercel.json frontend/public/service-worker.js
git commit -m "fix: resolve chunk loading and caching issues"
git push origin main
```

### Option 3: Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Find project → Deployments
3. Latest deployment → ••• → Redeploy
4. **UNCHECK** "Use existing Build Cache"
5. Click Redeploy

---

## What Was Fixed

### 1. Service Worker (`frontend/public/service-worker.js`)
- ✅ Bumped cache version (v2 → v3) to force client updates
- ✅ Skip caching non-http(s) requests (fixes chrome-extension errors)
- ✅ Added error handling for cache operations
- ✅ Better error logging

### 2. Vercel Config (`vercel.json`)
- ✅ Fixed build command path: `cd frontend && npm install && npm run build`
- ✅ Fixed output directory: `frontend/build`
- ✅ Added SPA rewrites for proper routing

---

## Local Development

### Start Development Server
```bash
cd frontend
npm start
# Opens http://localhost:3000
```

### Build for Production
```bash
cd frontend
npm run build
```

### Test Production Build Locally
```bash
cd frontend
npm run build
npx serve -s build -p 3000
# Test at http://localhost:3000
```

---

## Deployment

### Via Vercel (Automatic)
Vercel auto-deploys when you push to `main` branch:

```bash
git add .
git commit -m "frontend: your changes"
git push origin main
```

Monitor deployment: https://vercel.com/dashboard

### Via Vercel CLI (Manual)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (from project root)
vercel --prod
```

---

## Environment Variables

Located at: `frontend/.env`

```env
REACT_APP_API_URL=https://api.thenobiasmedia.com
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### Update on Vercel
1. Go to https://vercel.com/dashboard
2. Select project
3. Settings → Environment Variables
4. Add/Update variables
5. Redeploy for changes to take effect

---

## Troubleshooting

### White Screen on Navigation
**Symptoms:** Home loads, but clicking articles shows white screen

**Solution:**
1. Redeploy with cache cleared (see Quick Fix above)
2. Users need to hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)

### Missing Chunk Files (404 errors)
**Symptoms:** Console shows `Loading chunk XXX failed`

**Solution:**
```bash
# Rebuild locally
cd frontend
rm -rf build node_modules/.cache
npm install
npm run build

# Deploy
vercel --prod
```

### Service Worker Errors
**Symptoms:** Console shows service worker cache errors

**Solution:**
1. Service worker is already fixed (cache version bumped)
2. Users need to hard refresh to get new service worker
3. Or use incognito mode to test

### CORS Errors
**Symptoms:** API requests blocked by CORS policy

**Check backend CORS configuration:**
```javascript
// backend/src/server.js should have:
app.use(cors({
  origin: ['https://www.thenobiasmedia.com', 'http://localhost:3000'],
  credentials: true
}));
```

### Build Fails on Vercel
**Check Vercel build logs:**
1. Go to https://vercel.com/dashboard
2. Click on failed deployment
3. View "Build Logs" tab
4. Fix errors and redeploy

---

## Testing Checklist

After deployment, verify:

- [ ] Home page loads
- [ ] Click article card → Article detail loads (no white screen)
- [ ] Refresh article page → Still works
- [ ] Browser console shows no chunk errors
- [ ] Service worker registers successfully
- [ ] No chrome-extension errors
- [ ] Navigation between pages works smoothly

### Test in Multiple Browsers
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

---

## Cache Management

### Clear Browser Cache
**For Users:**
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

**Or use incognito mode**

### Clear Service Worker Cache
```javascript
// Run in browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
location.reload();
```

---

## Performance Optimization

### Check Bundle Size
```bash
cd frontend
npm run build

# Check build/static/js/ for large files
ls -lh build/static/js/
```

### Optimize Images
- Use WebP format
- Compress images before uploading
- Use lazy loading for images

### Code Splitting
Already implemented with React.lazy():
```javascript
// frontend/src/routes.js
let ArticleDetail = React.lazy(() => import('./pages/ArticleDetail'))
```

---

## Monitoring

### Vercel Analytics
- Go to https://vercel.com/dashboard
- Select project → Analytics
- Monitor:
  - Page views
  - Error rates
  - Performance metrics

### Browser Console
Check for:
- JavaScript errors
- Network errors
- Performance warnings

---

## Rollback Procedure

### Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select project → Deployments
3. Find previous working deployment
4. Click ••• → Promote to Production

### Via Git
```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <COMMIT_HASH>
git push --force origin main
```

---

## Build Configuration

### Vercel Settings
Located at: `vercel.json`

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/build",
  "framework": "create-react-app",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### React Scripts
Located at: `frontend/package.json`

```json
{
  "scripts": {
    "start": "cross-env PORT=3000 react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| White screen | Redeploy with cache cleared |
| Chunk 404 | Rebuild and redeploy |
| Service worker errors | Already fixed, users need hard refresh |
| CORS errors | Check backend CORS config |
| Build timeout | Increase Vercel timeout or optimize build |
| Out of memory | Increase Node memory in build command |

---

## Prevention

### Before Deploying
1. ✅ Test build locally
2. ✅ Check for console errors
3. ✅ Test navigation between pages
4. ✅ Verify API endpoints work

### After Deploying
1. ✅ Test in incognito mode
2. ✅ Check Vercel deployment logs
3. ✅ Monitor error rates
4. ✅ Test on mobile devices

---

## Useful Commands

```bash
# Local development
cd frontend && npm start

# Build
cd frontend && npm run build

# Test build locally
cd frontend && npx serve -s build

# Deploy via Vercel CLI
vercel --prod

# Check bundle size
cd frontend && npm run build && ls -lh build/static/js/

# Clear node cache
cd frontend && rm -rf node_modules/.cache
```

---

## Support

- **Live Site:** https://www.thenobiasmedia.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub Repo:** https://github.com/msckolw/mediawebsite
