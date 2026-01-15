# AWS EC2 Troubleshooting Guide

Quick solutions to common AWS EC2 deployment issues for NoBias Media backend.

---

## Connection Issues

### Cannot SSH to EC2

**Symptoms:**
```
ssh: connect to host api.thenobiasmedia.com port 22: Connection refused
```

**Solutions:**

1. **Check instance is running**
```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=nobias-media-backend" \
  --query "Reservations[*].Instances[*].[InstanceId,State.Name]" \
  --output table
```

2. **Check security group allows your IP**
```bash
# Get your current IP
curl ifconfig.me

# Check security group rules
aws ec2 describe-security-groups --group-ids <SG_ID>
```

3. **Fix SSH key permissions**
```bash
chmod 400 ~/.ssh/nobias-media-key.pem
```

4. **Try with verbose output**
```bash
ssh -v -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com
```

---

### DNS Not Resolving

**Symptoms:**
```
ssh: Could not resolve hostname api.thenobiasmedia.com
```

**Solutions:**

1. **Check DNS propagation**
```bash
dig api.thenobiasmedia.com
nslookup api.thenobiasmedia.com
```

2. **Use IP directly**
```bash
# Get EC2 public IP
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=nobias-media-backend" \
  --query "Reservations[*].Instances[*].PublicIpAddress" \
  --output text

# Connect with IP
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@<PUBLIC_IP>
```

3. **Clear DNS cache**
```bash
# macOS
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Linux
sudo systemd-resolve --flush-caches
```

---

## Backend Issues

### Backend Not Responding

**Symptoms:**
```
curl: (7) Failed to connect to api.thenobiasmedia.com port 5002
```

**Solutions:**

1. **Check if PM2 is running**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"
```

2. **Check backend logs**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend --lines 50"
```

3. **Restart backend**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 restart nobias-backend"
```

4. **Check if port is in use**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "sudo netstat -tulpn | grep 5002"
```

5. **Complete restart**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite/backend
pm2 stop nobias-backend
pm2 delete nobias-backend
pm2 start src/server.js --name nobias-backend
pm2 save
EOF
```

---

### 401 Unauthorized Error

**Symptoms:**
```json
{"error": "Access Token is Mandatory"}
```

**Solutions:**

1. **Backend code not updated**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite
git pull origin main
cd backend
pm2 restart nobias-backend
EOF
```

2. **Check route configuration**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "cat ~/mediawebsite/backend/src/routes/newsRoutes.js | grep -A 5 'source=true'"
```

---

### MongoDB Connection Error

**Symptoms:**
```
MongooseServerSelectionError: connect ECONNREFUSED
```

**Solutions:**

1. **Check environment variables**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "cat ~/mediawebsite/backend/.env | grep MONGODB_URI"
```

2. **Verify MongoDB URI**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite/backend
node -e "
require('dotenv').config();
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
"
EOF
```

3. **Test MongoDB connection**
```bash
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

4. **Recreate .env file**
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

## GitHub Actions Issues

### Deployment Failing

**Symptoms:**
- GitHub Actions workflow shows red X
- Deployment step fails

**Solutions:**

1. **Check GitHub Secrets**
   - Go to: Settings → Secrets and variables → Actions
   - Verify `EC2_SSH_KEY` exists and contains full private key
   - Verify `EC2_HOST` is set to `api.thenobiasmedia.com`

2. **Check workflow logs**
   - Go to: https://github.com/msckolw/mediawebsite/actions
   - Click on failed workflow
   - Review error messages

3. **Test SSH connection manually**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "echo 'Connection works'"
```

4. **Verify EC2_SSH_KEY format**
   - Must include `-----BEGIN RSA PRIVATE KEY-----`
   - Must include `-----END RSA PRIVATE KEY-----`
   - No extra spaces or newlines

5. **Re-trigger deployment**
```bash
git commit --allow-empty -m "chore: Trigger deployment"
git push origin main
```

---

### SSH Key Permission Denied

**Symptoms:**
```
Permission denied (publickey)
```

**Solutions:**

1. **Check key is in GitHub Secrets**
```bash
# Display your key (to verify format)
cat ~/.ssh/nobias-media-key.pem
```

2. **Verify key matches EC2 instance**
```bash
# Get key fingerprint
ssh-keygen -lf ~/.ssh/nobias-media-key.pem

# Compare with EC2 key pair
aws ec2 describe-key-pairs --key-names nobias-media-key
```

3. **Check username is correct**
   - Should be `ec2-user` (not `ubuntu`)
   - Update workflow file if needed

---

## Performance Issues

### High CPU Usage

**Symptoms:**
- Slow API responses
- PM2 shows high CPU

**Solutions:**

1. **Check CPU usage**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "top -bn1 | head -20"
```

2. **Check PM2 metrics**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 monit"
```

3. **Restart backend**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 restart nobias-backend"
```

4. **Check for memory leaks**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend | grep -i 'memory\|heap'"
```

5. **Consider upgrading instance**
```bash
# Stop instance
aws ec2 stop-instances --instance-ids <INSTANCE_ID>

# Change instance type
aws ec2 modify-instance-attribute \
  --instance-id <INSTANCE_ID> \
  --instance-type t2.small

# Start instance
aws ec2 start-instances --instance-ids <INSTANCE_ID>
```

---

### Out of Memory

**Symptoms:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solutions:**

1. **Check memory usage**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "free -h"
```

2. **Increase Node.js memory limit**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
pm2 delete nobias-backend
pm2 start src/server.js --name nobias-backend --node-args="--max-old-space-size=1024"
pm2 save
EOF
```

3. **Clear PM2 logs**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 flush nobias-backend"
```

4. **Restart instance**
```bash
aws ec2 reboot-instances --instance-ids <INSTANCE_ID>
```

---

### Slow API Responses

**Symptoms:**
- API takes > 2 seconds to respond
- Timeout errors

**Solutions:**

1. **Test response time**
```bash
curl -w "@-" -o /dev/null -s https://api.thenobiasmedia.com/api/news?page=1 << 'EOF'
time_total: %{time_total}s
EOF
```

2. **Check database queries**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "pm2 logs nobias-backend | grep -i 'query\|slow'"
```

3. **Add database indexes** (if needed)

4. **Enable caching** (if not already)

5. **Check network latency**
```bash
ping api.thenobiasmedia.com
traceroute api.thenobiasmedia.com
```

---

## Disk Space Issues

### Disk Full

**Symptoms:**
```
ENOSPC: no space left on device
```

**Solutions:**

1. **Check disk usage**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "df -h"
```

2. **Find large files**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "du -h ~ | sort -rh | head -20"
```

3. **Clear PM2 logs**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
pm2 flush nobias-backend
rm -rf ~/mediawebsite/backend/logs/*
EOF
```

4. **Clear npm cache**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "npm cache clean --force"
```

5. **Remove old node_modules**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "find ~ -name 'node_modules' -type d -prune -exec du -sh {} \;"
```

6. **Increase EBS volume size**
```bash
# Modify volume size
aws ec2 modify-volume --volume-id <VOLUME_ID> --size 20

# Extend filesystem (on EC2)
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
sudo growpart /dev/xvda 1
sudo xfs_growfs -d /
EOF
```

---

## Git Issues

### Git Pull Fails

**Symptoms:**
```
error: Your local changes to the following files would be overwritten by merge
```

**Solutions:**

1. **Stash local changes**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite
git stash
git pull origin main
EOF
```

2. **Hard reset (CAUTION: loses local changes)**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite
git fetch origin
git reset --hard origin/main
EOF
```

3. **Check git status**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "cd ~/mediawebsite && git status"
```

---

## PM2 Issues

### PM2 Not Starting

**Symptoms:**
```
[PM2] Process not found
```

**Solutions:**

1. **Check PM2 status**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"
```

2. **Start backend manually**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite/backend
pm2 start src/server.js --name nobias-backend
pm2 save
EOF
```

3. **Check PM2 logs**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs --err"
```

4. **Reinstall PM2**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
npm uninstall -g pm2
npm install -g pm2
pm2 update
EOF
```

---

### PM2 Startup Not Working

**Symptoms:**
- Backend doesn't start after reboot

**Solutions:**

1. **Configure PM2 startup**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
pm2 startup
# Run the command it outputs (with sudo)
pm2 save
EOF
```

2. **Test reboot**
```bash
aws ec2 reboot-instances --instance-ids <INSTANCE_ID>

# Wait 2 minutes, then check
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"
```

---

## Emergency Procedures

### Complete System Recovery

If everything is broken:

```bash
# 1. Connect to EC2
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com

# 2. Stop all PM2 processes
pm2 kill

# 3. Pull latest code
cd ~/mediawebsite
git fetch origin
git reset --hard origin/main

# 4. Reinstall dependencies
cd backend
rm -rf node_modules
npm install --production

# 5. Recreate .env
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://manisankar:77HFY1n0QsN6d76L@cluster0.kkwdaye.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
PORT=5002
JWT_SECRET=nobias_media_jwt_secret_key_2024_secure
NODE_ENV=production
EOF

# 6. Start backend
pm2 start src/server.js --name nobias-backend
pm2 save
pm2 startup

# 7. Verify
pm2 status
pm2 logs nobias-backend --lines 20
```

---

### Rollback to Previous Version

```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite

# View recent commits
git log --oneline -10

# Rollback to specific commit
git reset --hard <COMMIT_HASH>

# Restart backend
cd backend
npm install
pm2 restart nobias-backend
EOF
```

---

## Getting Help

### Collect Diagnostic Information

Run this script to collect all relevant information:

```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
echo "=== System Information ==="
uname -a
uptime

echo -e "\n=== Disk Usage ==="
df -h

echo -e "\n=== Memory Usage ==="
free -h

echo -e "\n=== PM2 Status ==="
pm2 status

echo -e "\n=== PM2 Logs (last 20 lines) ==="
pm2 logs nobias-backend --lines 20 --nostream

echo -e "\n=== Environment Variables ==="
cat ~/mediawebsite/backend/.env | grep -v "PASSWORD\|SECRET\|URI"

echo -e "\n=== Git Status ==="
cd ~/mediawebsite && git status

echo -e "\n=== Node Version ==="
node --version

echo -e "\n=== npm Version ==="
npm --version

echo -e "\n=== Port 5002 Status ==="
sudo netstat -tulpn | grep 5002
EOF
```

### Contact Information

- **GitHub Issues:** https://github.com/msckolw/mediawebsite/issues
- **GitHub Actions:** https://github.com/msckolw/mediawebsite/actions
- **API Status:** https://api.thenobiasmedia.com/api/news?page=1

---

## Prevention

### Regular Maintenance

1. **Daily checks**
```bash
./verify-ec2-deployment.sh
```

2. **Weekly updates**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "sudo yum update -y"
```

3. **Monthly backups**
```bash
aws ec2 create-image \
  --instance-id <INSTANCE_ID> \
  --name "nobias-backup-$(date +%Y%m%d)"
```

### Monitoring Setup

Consider setting up:
- CloudWatch alarms for CPU/Memory
- Uptime monitoring (e.g., UptimeRobot)
- Log aggregation (e.g., CloudWatch Logs)
- Performance monitoring (e.g., New Relic, DataDog)
