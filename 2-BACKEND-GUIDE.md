# Backend Deployment Guide

## Current Status

**API:** https://api.thenobiasmedia.com  
**Status:** ✅ Working  
**Port:** 5002  
**Database:** MongoDB Atlas  
**Process Manager:** PM2

---

## Quick Deploy

### From Local Machine
```bash
# Deploy via SSH
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "cd ~/mediawebsite && git pull && cd backend && npm install && pm2 restart nobias-backend"
```

### Via GitHub Actions
```bash
# Push changes to trigger auto-deploy
git add .
git commit -m "backend: your changes"
git push origin main

# Monitor: https://github.com/msckolw/mediawebsite/actions
```

---

## Environment Variables

Located at: `~/mediawebsite/backend/.env`

```env
MONGODB_URI=mongodb+srv://manisankar:77HFY1n0QsN6d76L@cluster0.kkwdaye.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
PORT=5002
JWT_SECRET=nobias_media_jwt_secret_key_2024_secure
NODE_ENV=production
```

### Update Environment Variables
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite/backend
cat > .env << 'ENVEOF'
MONGODB_URI=mongodb+srv://manisankar:77HFY1n0QsN6d76L@cluster0.kkwdaye.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
PORT=5002
JWT_SECRET=nobias_media_jwt_secret_key_2024_secure
NODE_ENV=production
ENVEOF
pm2 restart nobias-backend
EOF
```

---

## PM2 Management

### Basic Commands
```bash
# Status
pm2 status

# Logs (real-time)
pm2 logs nobias-backend

# Logs (last 50 lines)
pm2 logs nobias-backend --lines 50

# Restart
pm2 restart nobias-backend

# Stop
pm2 stop nobias-backend

# Start
pm2 start src/server.js --name nobias-backend

# Monitor resources
pm2 monit

# Save configuration
pm2 save
```

### Via SSH
```bash
# Check status
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"

# View logs
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend --lines 50"

# Restart
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 restart nobias-backend"
```

---

## Testing

### Test API Endpoints
```bash
# News endpoint
curl https://api.thenobiasmedia.com/api/news?page=1

# News sources (no auth required)
curl https://api.thenobiasmedia.com/api/news/695b8dc5eb1b0e0375c475d4?source=true

# With timing
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://api.thenobiasmedia.com/api/news?page=1
```

### Check Response
```bash
# Should return 200
curl -I https://api.thenobiasmedia.com/api/news?page=1

# Verbose output
curl -v https://api.thenobiasmedia.com/api/news?page=1
```

---

## Troubleshooting

### Backend Not Starting
```bash
# Check logs for errors
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend --err --lines 50"

# Check if port is in use
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "sudo netstat -tulpn | grep 5002"

# Complete restart
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite/backend
pm2 stop nobias-backend
pm2 delete nobias-backend
pm2 start src/server.js --name nobias-backend
pm2 save
EOF
```

### MongoDB Connection Issues
```bash
# Test connection
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite/backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ Connected'); process.exit(0); })
  .catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
"
EOF
```

### High Memory Usage
```bash
# Check memory
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "free -h"

# Restart with increased memory
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
pm2 delete nobias-backend
pm2 start src/server.js --name nobias-backend --node-args="--max-old-space-size=1024"
pm2 save
EOF
```

### 401 Unauthorized Errors
This means the backend code isn't updated with the latest changes.

```bash
# Deploy latest code
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite
git pull origin main
cd backend
npm install
pm2 restart nobias-backend
EOF
```

---

## Database Updates

### Update Source Types (Conservative → Traditionalist)
```bash
# Run the update script
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite/backend
node scripts/update-source-types.js
EOF
```

---

## Logs Management

### View Logs
```bash
# Real-time logs
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend"

# Last 100 lines
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend --lines 100"

# Error logs only
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend --err"
```

### Clear Logs
```bash
# Clear PM2 logs
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 flush nobias-backend"

# Clear log files
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "rm -rf ~/mediawebsite/backend/logs/*"
```

---

## Performance Monitoring

### Check Performance
```bash
# CPU and Memory usage
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 monit"

# Response time
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://api.thenobiasmedia.com/api/news?page=1
```

### Optimize Performance
1. **Add database indexes** for frequently queried fields
2. **Enable caching** for static data
3. **Use pagination** for large datasets
4. **Optimize queries** to reduce database load

---

## Rollback Procedure

### Rollback to Previous Version
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite

# View recent commits
git log --oneline -10

# Rollback to specific commit
git reset --hard <COMMIT_HASH>

# Reinstall dependencies
cd backend
npm install

# Restart
pm2 restart nobias-backend
EOF
```

---

## Maintenance

### Daily
- Check PM2 status
- Review error logs
- Monitor API response times

### Weekly
- Review CloudWatch metrics (if configured)
- Check disk space
- Update npm dependencies if needed

### Monthly
- Update system packages
- Review and rotate logs
- Test backup restoration
- Review AWS costs

---

## Emergency Contacts

- **API Status:** https://api.thenobiasmedia.com/api/news?page=1
- **GitHub Actions:** https://github.com/msckolw/mediawebsite/actions
- **GitHub Repo:** https://github.com/msckolw/mediawebsite
