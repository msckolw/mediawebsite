# Vercel Deployment Guide

## Current Status

**Live Site:** https://www.thenobiasmedia.com  
**Platform:** Vercel  
**Framework:** Create React App  
**Auto-Deploy:** ✅ Enabled (on push to main)

---

## Quick Deploy

### Automatic (Recommended)
```bash
# Push to main branch
git add .
git commit -m "frontend: your changes"
git push origin main

# Vercel auto-deploys in ~2-3 minutes
```

### Manual via Dashboard
1. Go to https://vercel.com/dashboard
2. Find your project
3. Deployments → Latest → ••• → Redeploy
4. **UNCHECK** "Use existing Build Cache" (important!)
5. Click Redeploy

### Manual via CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (from project root)
vercel --prod

# Force rebuild (clears cache)
vercel --prod --force
```

---

## Configuration

### Vercel Config File
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

**Key Settings:**
- `buildCommand`: Builds from frontend directory
- `outputDirectory`: Where build files are located
- `rewrites`: Enables SPA routing (fixes refresh on routes)

---

## Environment Variables

### View/Edit on Vercel
1. Go to https://vercel.com/dashboard
2. Select project
3. Settings → Environment Variables

### Required Variables
```
REACT_APP_API_URL=https://api.thenobiasmedia.com
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### Add New Variable
1. Settings → Environment Variables
2. Click "Add"
3. Enter key and value
4. Select environments (Production, Preview, Development)
5. Save
6. **Redeploy** for changes to take effect

---

## Build Process

### What Happens on Deploy
1. Vercel detects push to main
2. Clones repository
3. Runs `cd frontend && npm install && npm run build`
4. Uploads build files to CDN
5. Updates live site
6. Sends deployment notification

### Build Time
- **Normal:** 2-3 minutes
- **With cache:** 1-2 minutes
- **Force rebuild:** 3-4 minutes

---

## Monitoring

### Deployment Status
**Dashboard:** https://vercel.com/dashboard

**Check:**
- Deployment status (Building, Ready, Error)
- Build logs
- Preview URL
- Production URL

### Build Logs
1. Go to https://vercel.com/dashboard
2. Select project
3. Click on deployment
4. View "Build Logs" tab

**Look for:**
- Build errors
- Warnings
- Bundle size
- Build time

### Analytics
1. Go to https://vercel.com/dashboard
2. Select project → Analytics

**Monitor:**
- Page views
- Unique visitors
- Top pages
- Error rates
- Performance metrics

---

## Troubleshooting

### Build Fails

**Check build logs:**
1. Dashboard → Deployments → Failed deployment
2. Click "View Build Logs"
3. Find error message

**Common issues:**

#### Out of Memory
```
JavaScript heap out of memory
```

**Solution:**
Increase Node memory in build command:
```json
{
  "buildCommand": "cd frontend && NODE_OPTIONS='--max-old-space-size=4096' npm run build"
}
```

#### Missing Dependencies
```
Cannot find module 'xyz'
```

**Solution:**
```bash
cd frontend
npm install xyz --save
git add package.json package-lock.json
git commit -m "frontend: add missing dependency"
git push origin main
```

#### Build Timeout
```
Build exceeded maximum duration
```

**Solution:**
1. Optimize build (remove unused dependencies)
2. Upgrade Vercel plan for longer build time
3. Use build cache

### Deployment Succeeds but Site Broken

#### White Screen
**Cause:** Missing chunk files or service worker issues

**Solution:**
1. Redeploy with cache cleared
2. Check browser console for errors
3. See `3-FRONTEND-GUIDE.md` for detailed fix

#### 404 on Routes
**Cause:** Missing SPA rewrites

**Solution:**
Ensure `vercel.json` has rewrites:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### API Errors
**Cause:** Wrong API URL or CORS issues

**Solution:**
1. Check `REACT_APP_API_URL` environment variable
2. Verify backend CORS allows your domain
3. Test API directly: `curl https://api.thenobiasmedia.com/api/news?page=1`

---

## Domains & DNS

### Custom Domain Setup
1. Dashboard → Project → Settings → Domains
2. Add domain: `www.thenobiasmedia.com`
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-60 minutes)

### DNS Configuration
**Add these records to your DNS provider:**

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Or for apex domain:**
```
Type: A
Name: @
Value: 76.76.21.21
```

### SSL Certificate
- Automatically provisioned by Vercel
- Free Let's Encrypt certificate
- Auto-renewal
- HTTPS enforced by default

---

## Performance Optimization

### Check Bundle Size
```bash
cd frontend
npm run build

# View bundle size
ls -lh build/static/js/
```

### Optimize Build
1. **Remove unused dependencies**
   ```bash
   npm uninstall unused-package
   ```

2. **Use code splitting** (already implemented)
   ```javascript
   const Component = React.lazy(() => import('./Component'))
   ```

3. **Optimize images**
   - Use WebP format
   - Compress before uploading
   - Use lazy loading

4. **Enable caching**
   - Static assets cached automatically
   - Service worker caches API responses

### Vercel Edge Network
- Automatic CDN distribution
- Global edge locations
- Instant cache invalidation
- DDoS protection

---

## Rollback

### Via Dashboard
1. Go to https://vercel.com/dashboard
2. Select project → Deployments
3. Find previous working deployment
4. Click ••• → "Promote to Production"
5. Confirm

### Via CLI
```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote <DEPLOYMENT_URL>
```

### Via Git
```bash
# Revert commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <COMMIT_HASH>
git push --force origin main
```

---

## Preview Deployments

### Automatic Preview
Every push to non-main branch creates preview deployment:

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and push
git add .
git commit -m "frontend: add new feature"
git push origin feature/new-feature

# Vercel creates preview URL
# Check GitHub PR for preview link
```

### Preview URL Format
```
https://mediawebsite-<hash>-<username>.vercel.app
```

### Test Before Merging
1. Push to feature branch
2. Get preview URL from GitHub PR
3. Test thoroughly
4. Merge to main when ready

---

## CI/CD Integration

### GitHub Integration
**Already configured:**
- Auto-deploy on push to main
- Preview deployments for PRs
- Deployment status in GitHub

### Deployment Notifications
**Configure in Vercel:**
1. Settings → Git → Notifications
2. Enable:
   - Deployment Started
   - Deployment Ready
   - Deployment Failed

**Integrate with:**
- Slack
- Discord
- Email
- Webhooks

---

## Security

### Environment Variables
- ✅ Never commit secrets to Git
- ✅ Use Vercel environment variables
- ✅ Separate variables for Production/Preview/Development
- ✅ Rotate secrets periodically

### HTTPS
- ✅ Enforced by default
- ✅ Automatic certificate renewal
- ✅ HSTS enabled
- ✅ TLS 1.2+ only

### Headers
Add security headers in `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## Cost Management

### Free Tier Limits
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic SSL
- Global CDN

### Monitor Usage
1. Dashboard → Settings → Usage
2. Check:
   - Bandwidth
   - Build minutes
   - Serverless function invocations

### Optimize Costs
1. Use build cache
2. Optimize bundle size
3. Enable compression
4. Use CDN caching

---

## Best Practices

### Before Deploying
1. ✅ Test build locally
2. ✅ Check for console errors
3. ✅ Test all routes
4. ✅ Verify API connections
5. ✅ Check mobile responsiveness

### After Deploying
1. ✅ Test in incognito mode
2. ✅ Check build logs
3. ✅ Monitor error rates
4. ✅ Test on multiple devices
5. ✅ Verify analytics tracking

### Deployment Checklist
- [ ] Code tested locally
- [ ] Build succeeds locally
- [ ] No console errors
- [ ] Environment variables updated
- [ ] API endpoints working
- [ ] Mobile responsive
- [ ] SEO meta tags present
- [ ] Analytics configured

---

## Useful Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Deploy with force rebuild
vercel --prod --force

# List deployments
vercel ls

# View deployment logs
vercel logs <DEPLOYMENT_URL>

# Promote deployment
vercel promote <DEPLOYMENT_URL>

# Remove deployment
vercel rm <DEPLOYMENT_URL>

# Link local project
vercel link

# Pull environment variables
vercel env pull
```

---

## Support

- **Dashboard:** https://vercel.com/dashboard
- **Documentation:** https://vercel.com/docs
- **Status:** https://www.vercel-status.com
- **Support:** https://vercel.com/support
- **Community:** https://github.com/vercel/vercel/discussions
