# AWS EC2 Deployment Checklist

Use this checklist to ensure your AWS EC2 deployment is properly configured.

---

## Pre-Deployment Checklist

### AWS Configuration
- [ ] AWS account is active and accessible
- [ ] AWS CLI is installed locally
  ```bash
  aws --version
  ```
- [ ] AWS CLI is configured with credentials
  ```bash
  aws configure list
  ```
- [ ] EC2 instance is running
  ```bash
  aws ec2 describe-instances --filters "Name=tag:Name,Values=nobias-media-backend"
  ```

### SSH Access
- [ ] SSH key file exists at `~/.ssh/nobias-media-key.pem`
  ```bash
  ls -la ~/.ssh/nobias-media-key.pem
  ```
- [ ] SSH key has correct permissions (400)
  ```bash
  chmod 400 ~/.ssh/nobias-media-key.pem
  ```
- [ ] Can connect to EC2 via SSH
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "echo 'Connection successful'"
  ```

### Security Group
- [ ] Port 22 (SSH) is open for your IP
- [ ] Port 5002 (Backend) is open to 0.0.0.0/0
- [ ] Port 443 (HTTPS) is open to 0.0.0.0/0
  ```bash
  aws ec2 describe-security-groups --group-ids <SG_ID>
  ```

### DNS Configuration
- [ ] Domain `api.thenobiasmedia.com` points to EC2 IP
  ```bash
  dig api.thenobiasmedia.com
  ```
- [ ] DNS propagation is complete
  ```bash
  nslookup api.thenobiasmedia.com
  ```

---

## Server Setup Checklist

### Node.js & Dependencies
- [ ] Node.js is installed on EC2
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "node --version"
  ```
- [ ] npm is installed
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "npm --version"
  ```
- [ ] PM2 is installed globally
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 --version"
  ```

### Project Setup
- [ ] Repository is cloned at `~/mediawebsite`
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "ls -la ~/mediawebsite"
  ```
- [ ] Backend dependencies are installed
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "ls ~/mediawebsite/backend/node_modules"
  ```
- [ ] `.env` file exists with correct variables
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "cat ~/mediawebsite/backend/.env"
  ```

### PM2 Configuration
- [ ] Backend is running with PM2
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"
  ```
- [ ] PM2 process is named `nobias-backend`
- [ ] PM2 startup script is configured
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 startup"
  ```
- [ ] PM2 configuration is saved
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 save"
  ```

---

## GitHub Actions Checklist

### Repository Secrets
- [ ] `EC2_SSH_KEY` secret is configured
  - Go to: Settings → Secrets and variables → Actions
  - Contains full private key including headers
- [ ] `EC2_HOST` secret is configured
  - Value: `api.thenobiasmedia.com`

### Workflow Files
- [ ] `.github/workflows/deploy-backend.yml` exists
- [ ] `.github/workflows/ssh-test.yml` exists
- [ ] Workflows use `ec2-user` (not `ubuntu`)
- [ ] Workflows reference correct secrets

### Test Deployment
- [ ] Push a test commit to trigger deployment
  ```bash
  echo "# Test deployment" >> backend/README.md
  git add backend/README.md
  git commit -m "test: Trigger deployment"
  git push origin main
  ```
- [ ] GitHub Actions workflow runs successfully
  - Check: https://github.com/msckolw/mediawebsite/actions
- [ ] Backend restarts automatically

---

## API Testing Checklist

### Basic Connectivity
- [ ] API responds to health check
  ```bash
  curl -I https://api.thenobiasmedia.com/api/news?page=1
  ```
- [ ] Returns 200 status code
- [ ] Response time is acceptable (< 2 seconds)
  ```bash
  curl -w "%{time_total}\n" -o /dev/null -s https://api.thenobiasmedia.com/api/news?page=1
  ```

### Endpoint Testing
- [ ] News endpoint works
  ```bash
  curl https://api.thenobiasmedia.com/api/news?page=1
  ```
- [ ] News sources endpoint works (no auth required)
  ```bash
  curl https://api.thenobiasmedia.com/api/news/695b8dc5eb1b0e0375c475d4?source=true
  ```
- [ ] Returns valid JSON
- [ ] No authentication errors (401)

### Frontend Integration
- [ ] Frontend can connect to backend
- [ ] "News Sources" button works without login
- [ ] No CORS errors in browser console

---

## Monitoring Checklist

### Logs
- [ ] PM2 logs are accessible
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend --lines 20"
  ```
- [ ] No error messages in logs
- [ ] Log rotation is configured

### Performance
- [ ] CPU usage is normal (< 80%)
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "top -bn1 | head -5"
  ```
- [ ] Memory usage is normal (< 80%)
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "free -h"
  ```
- [ ] Disk space is sufficient (> 20% free)
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "df -h"
  ```

### Uptime
- [ ] Backend process is running
- [ ] No recent crashes in PM2
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"
  ```
- [ ] Uptime is as expected

---

## Security Checklist

### Access Control
- [ ] SSH access is restricted to known IPs (optional but recommended)
- [ ] Root login is disabled
- [ ] Password authentication is disabled
- [ ] Only key-based authentication is allowed

### Firewall
- [ ] Security group rules are minimal (only required ports)
- [ ] No unnecessary ports are open
- [ ] Outbound rules are configured

### Updates
- [ ] System packages are up to date
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "sudo yum check-update"
  ```
- [ ] Node.js is on LTS version
- [ ] npm packages are updated
  ```bash
  ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "cd ~/mediawebsite/backend && npm outdated"
  ```

### Secrets Management
- [ ] Environment variables are not in Git
- [ ] `.env` file is in `.gitignore`
- [ ] Database credentials are secure
- [ ] JWT secret is strong and unique

---

## SSL/TLS Checklist (Optional but Recommended)

### Certificate
- [ ] SSL certificate is installed
- [ ] Certificate is valid and not expired
- [ ] Certificate matches domain

### HTTPS Configuration
- [ ] Nginx is installed and configured
- [ ] HTTPS redirect is working (HTTP → HTTPS)
- [ ] SSL/TLS version is modern (TLS 1.2+)
- [ ] Strong cipher suites are configured

### Testing
- [ ] HTTPS endpoint works
  ```bash
  curl -I https://api.thenobiasmedia.com/api/news?page=1
  ```
- [ ] No certificate warnings in browser
- [ ] SSL Labs test passes (A or A+)
  - https://www.ssllabs.com/ssltest/

---

## Backup & Recovery Checklist

### Backups
- [ ] AMI backup exists
  ```bash
  aws ec2 describe-images --owners self --filters "Name=name,Values=nobias-backup-*"
  ```
- [ ] Backup schedule is configured
- [ ] Backups are tested and restorable

### Recovery Plan
- [ ] Recovery procedure is documented
- [ ] Recovery time objective (RTO) is defined
- [ ] Recovery point objective (RPO) is defined
- [ ] Disaster recovery plan is tested

---

## Documentation Checklist

### Files Present
- [ ] `DEPLOY-TO-EC2.md` - Quick deployment guide
- [ ] `AWS-EC2-COMMANDS.md` - Command reference
- [ ] `AWS-SETUP-GUIDE.md` - Complete setup guide
- [ ] `AWS-QUICK-REFERENCE.md` - Quick reference card
- [ ] `AWS-UPDATES-SUMMARY.md` - Update summary
- [ ] `AWS-DEPLOYMENT-CHECKLIST.md` - This file

### Documentation Quality
- [ ] All commands are tested and working
- [ ] Credentials are correct (not placeholders)
- [ ] Examples use actual domain and paths
- [ ] Troubleshooting section is comprehensive

---

## Post-Deployment Checklist

### Verification
- [ ] Run verification script
  ```bash
  ./verify-ec2-deployment.sh
  ```
- [ ] All tests pass
- [ ] No errors in output

### Monitoring Setup
- [ ] CloudWatch agent is installed (optional)
- [ ] Metrics are being collected
- [ ] Alarms are configured for critical issues

### Team Communication
- [ ] Team is notified of deployment
- [ ] Documentation is shared
- [ ] Access credentials are distributed securely

---

## Maintenance Schedule

### Daily
- [ ] Check PM2 status
- [ ] Review error logs
- [ ] Monitor API response times

### Weekly
- [ ] Review CloudWatch metrics
- [ ] Check disk space
- [ ] Review security group rules

### Monthly
- [ ] Update system packages
- [ ] Update npm dependencies
- [ ] Review and rotate logs
- [ ] Test backup restoration
- [ ] Review AWS costs

### Quarterly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Disaster recovery drill
- [ ] Documentation review

---

## Emergency Contacts

**GitHub Repository:**
https://github.com/msckolw/mediawebsite

**GitHub Actions:**
https://github.com/msckolw/mediawebsite/actions

**API Endpoint:**
https://api.thenobiasmedia.com

**AWS Console:**
https://console.aws.amazon.com/ec2/

---

## Quick Commands

```bash
# SSH to server
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com

# Deploy changes
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "cd ~/mediawebsite && git pull && cd backend && pm2 restart nobias-backend"

# Check status
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"

# View logs
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend --lines 50"

# Test API
curl https://api.thenobiasmedia.com/api/news?page=1

# Run verification
./verify-ec2-deployment.sh
```

---

## Completion

Once all items are checked:
- [ ] Deployment is complete and verified
- [ ] Documentation is up to date
- [ ] Team is trained on procedures
- [ ] Monitoring is active
- [ ] Backup strategy is in place

**Deployment Date:** _________________

**Deployed By:** _________________

**Verified By:** _________________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
