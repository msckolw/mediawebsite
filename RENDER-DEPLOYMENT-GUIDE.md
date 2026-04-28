# Render Deployment Guide

## 🚀 Deploy Backend to Render

Your backend is **100% ready** for Render deployment. No code changes needed!

---

## Quick Start (15 minutes)

### Method 1: Render Dashboard (Recommended)

#### Step 1: Create Web Service

1. Go to https://dashboard.render.com
2. Sign in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect repository: `msckolw/mediawebsite`
5. Click **"Connect"**

#### Step 2: Configure Service

```
Name:              nobias-backend
Region:            Oregon (US West)
Branch:            main
Root Directory:    backend
Runtime:           Node
Build Command:     npm install
Start Command:     npm start
```

#### Step 3: Choose Plan

- **Free Tier**: $0/month
  - ✅ 750 hours/month
  - ✅ Auto-sleep after 15 min inactivity
  - ✅ Spins up on request (cold start ~30s)
  - ⚠️ Good for testing, not production

- **Starter**: $7/month
  - ✅ Always on (no cold starts)
  - ✅ Better performance
  - ✅ Recommended for production

#### Step 4: Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

```env
MONGODB_URI=mongodb+srv://manisankar:77HFY1n0QsN6d76L@cluster0.kkwdaye.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
PORT=5002
JWT_SECRET=nobias_media_jwt_secret_key_2024_secure
JWT_REFRESH_SECRET=nobias_media_refresh_secret_key_2024_secure
NODE_ENV=production
```

#### Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. Your API will be live at: `https://nobiasmedia.onrender.com`

#### Step 6: Test

```bash
# Test API
curl https://nobiasmedia.onrender.com/api/news?page=1

# Should return JSON with news articles
```

---

### Method 2: Using render.yaml (Infrastructure as Code)

#### Step 1: Commit render.yaml

```bash
git add render.yaml
git commit -m "Add Render deployment configuration"
git push origin main
```

#### Step 2: Create Service from Blueprint

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect repository: `msckolw/mediawebsite`
4. Render will detect `render.yaml`
5. Add environment variables (secrets)
6. Click **"Apply"**

---

## Custom Domain Setup

### Add api.thenobiasmedia.com

#### Step 1: In Render Dashboard

1. Go to your service
2. Click **"Settings"** → **"Custom Domain"**
3. Click **"Add Custom Domain"**
4. Enter: `api.thenobiasmedia.com`
5. Render will show DNS instructions

#### Step 2: Update DNS

Add CNAME record in your DNS provider:

```
Type:  CNAME
Name:  api
Value: nobiasmedia.onrender.com
TTL:   3600
```

#### Step 3: Wait for SSL

- Render auto-provisions SSL certificate
- Takes 5-10 minutes
- Your API will be available at: `https://api.thenobiasmedia.com`

---

## Update Frontend to Use Render

### Option 1: Environment Variable (Recommended)

**Vercel Dashboard:**
1. Go to project settings
2. Environment Variables
3. Add/Update:
   ```
   REACT_APP_API_URL=https://nobiasmedia.onrender.com/api
   ```
4. Redeploy frontend

### Option 2: Update config.js

```javascript
// frontend/src/config.js
const API_URL = process.env.REACT_APP_API_URL || 'https://nobiasmedia.onrender.com/api';

export { API_URL };
```

### Update Socket.io Connection

```javascript
// frontend/src/pages/Home.js
socketRef.current = io('https://nobiasmedia.onrender.com');
```

---

## Auto-Deploy Setup

### Render Auto-Deploys on Git Push

**Already configured!** When you push to `main`:

```bash
git add backend/
git commit -m "backend: update feature"
git push origin main
```

Render will:
1. Detect changes in `backend/` folder
2. Build automatically
3. Deploy new version
4. Zero downtime deployment

### Disable Auto-Deploy (Optional)

1. Service Settings
2. **"Build & Deploy"**
3. Toggle **"Auto-Deploy"** off
4. Deploy manually via dashboard

---

## Monitoring & Logs

### View Logs

**Dashboard:**
1. Go to your service
2. Click **"Logs"** tab
3. Real-time logs appear

**CLI:**
```bash
# Install Render CLI
npm install -g render-cli

# Login
render login

# View logs
render logs nobias-backend
```

### Metrics

Dashboard shows:
- CPU usage
- Memory usage
- Request count
- Response times
- Error rates

---

## Environment Variables Management

### View/Edit Variables

1. Service → **"Environment"** tab
2. Add/Edit/Delete variables
3. Click **"Save Changes"**
4. Service auto-restarts

### Secrets Best Practice

✅ **DO:**
- Store in Render dashboard
- Use different secrets per environment
- Rotate secrets regularly

❌ **DON'T:**
- Commit secrets to git
- Share secrets in plain text
- Use same secrets everywhere

---

## Troubleshooting

### Service Won't Start

**Check Build Logs:**
1. Dashboard → Service → **"Logs"**
2. Look for errors in build phase
3. Common issues:
   - Missing dependencies
   - Wrong start command
   - Port binding issues

**Fix:**
```bash
# Ensure package.json has correct start script
"scripts": {
  "start": "node src/server.js"
}
```

### MongoDB Connection Failed

**Check:**
1. Environment variable `MONGODB_URI` is set
2. MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
3. Connection string is correct

**Test locally:**
```bash
cd backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected'))
  .catch(err => console.error('❌ Error:', err));
"
```

### Cold Starts (Free Tier)

**Problem:** Service sleeps after 15 min inactivity

**Solutions:**
1. **Upgrade to Starter plan** ($7/month) - Recommended
2. **Use cron job** to ping every 10 minutes:
   ```bash
   # Add to cron-job.org or similar
   */10 * * * * curl https://nobiasmedia.onrender.com
   ```
3. **Accept cold starts** - First request takes ~30s

### 502 Bad Gateway

**Causes:**
- Service is starting (wait 30s)
- Service crashed (check logs)
- Health check failing

**Fix:**
1. Check logs for errors
2. Verify service is running
3. Test health check endpoint: `curl https://nobiasmedia.onrender.com/`

---

## Performance Optimization

### 1. Enable HTTP/2

✅ Automatically enabled by Render

### 2. Add Health Check

```javascript
// backend/src/server.js
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});
```

Update render.yaml:
```yaml
healthCheckPath: /health
```

### 3. Optimize Build

```yaml
# render.yaml
buildCommand: npm ci --production
```

### 4. Use Node.js LTS

```json
// backend/package.json
"engines": {
  "node": "18.x"
}
```

---

## Cost Comparison

### Render vs AWS EC2

| Feature | Render Free | Render Starter | AWS EC2 t2.micro |
|---------|-------------|----------------|------------------|
| **Cost** | $0/month | $7/month | ~$10/month |
| **Always On** | ❌ (sleeps) | ✅ | ✅ |
| **Auto-Deploy** | ✅ | ✅ | ⚠️ (manual) |
| **SSL** | ✅ Free | ✅ Free | ⚠️ (setup needed) |
| **Monitoring** | ✅ Built-in | ✅ Built-in | ⚠️ (CloudWatch) |
| **Logs** | ✅ Built-in | ✅ Built-in | ⚠️ (PM2/CloudWatch) |
| **Scaling** | ❌ | ✅ Easy | ⚠️ Manual |
| **Maintenance** | ✅ Zero | ✅ Zero | ⚠️ Manual updates |

**Recommendation:** 
- **Development/Testing:** Render Free
- **Production:** Render Starter ($7/month) or AWS EC2

---

## Migration from AWS to Render

### Step 1: Deploy to Render (Keep AWS Running)

Follow deployment steps above. Both will run simultaneously.

### Step 2: Test Render Deployment

```bash
# Test Render API
curl https://nobiasmedia.onrender.com/api/news?page=1

# Compare with AWS
curl https://api.thenobiasmedia.com/api/news?page=1
```

### Step 3: Update Frontend (Gradual)

**Option A: Environment Variable**
```
REACT_APP_API_URL=https://nobiasmedia.onrender.com/api
```

**Option B: Canary Deployment**
```javascript
// Route 10% traffic to Render, 90% to AWS
const API_URL = Math.random() < 0.1 
  ? 'https://nobiasmedia.onrender.com/api'
  : 'https://api.thenobiasmedia.com/api';
```

### Step 4: Monitor for 24-48 Hours

- Check Render logs
- Monitor error rates
- Verify performance
- Test all endpoints

### Step 5: Full Cutover

1. Update DNS: `api.thenobiasmedia.com` → Render
2. Update all frontend configs
3. Monitor for issues
4. Keep AWS running for 1 week (backup)

### Step 6: Decommission AWS

1. Stop EC2 instance
2. Wait 1 week
3. Terminate instance if no issues
4. Remove GitHub Actions AWS workflow

---

## Rollback Procedure

### If Render Has Issues

**Quick Rollback:**
1. Update frontend env var back to AWS
   ```
   REACT_APP_API_URL=https://api.thenobiasmedia.com/api
   ```
2. Redeploy frontend
3. AWS backend still running (no downtime)

**DNS Rollback:**
1. Update DNS back to AWS IP
2. Wait for propagation (5-10 min)

---

## Useful Commands

### Render CLI

```bash
# Install
npm install -g render-cli

# Login
render login

# List services
render services list

# View logs
render logs nobias-backend

# Restart service
render services restart nobias-backend

# Deploy manually
render services deploy nobias-backend
```

### Test Endpoints

```bash
# Health check
curl https://nobiasmedia.onrender.com/

# News API
curl https://nobiasmedia.onrender.com/api/news?page=1

# Specific article
curl https://nobiasmedia.onrender.com/api/news/ARTICLE_ID

# With timing
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://nobiasmedia.onrender.com/api/news?page=1
```

---

## Support & Resources

### Documentation
- **Render Docs:** https://render.com/docs
- **Node.js on Render:** https://render.com/docs/deploy-node-express-app
- **Environment Variables:** https://render.com/docs/environment-variables

### Dashboard
- **Render Dashboard:** https://dashboard.render.com
- **Service Logs:** Dashboard → Service → Logs
- **Metrics:** Dashboard → Service → Metrics

### Community
- **Render Community:** https://community.render.com
- **Status Page:** https://status.render.com

---

## Next Steps

1. ✅ Deploy to Render (15 min)
2. ✅ Test all endpoints
3. ✅ Update frontend config
4. ✅ Monitor for 24 hours
5. ✅ Decide: Keep Render or rollback to AWS

---

## Summary

### ✅ Pros of Render
- Zero configuration needed
- Auto-deploy on git push
- Free SSL certificates
- Built-in monitoring & logs
- No server maintenance
- Easy scaling
- Free tier available

### ⚠️ Cons of Render
- Free tier has cold starts
- Less control than EC2
- Vendor lock-in
- Limited customization

### 💡 Recommendation

**For your use case:** Render Starter ($7/month) is **perfect**!

- ✅ Simpler than AWS EC2
- ✅ Auto-deploy saves time
- ✅ No PM2/server management
- ✅ Built-in monitoring
- ✅ Lower cost than AWS
- ✅ Zero maintenance

**Deploy to Render and keep AWS as backup for 1 week, then decide.**

---

**Ready to deploy?** Follow the Quick Start section above! 🚀
