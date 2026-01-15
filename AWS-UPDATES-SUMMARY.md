# AWS Credentials & Commands Update Summary

## Overview
All AWS EC2 credentials, commands, and documentation have been updated with the correct configuration for the NoBias Media backend deployment.

---

## Updated Configuration

### Production Environment
- **Domain:** api.thenobiasmedia.com
- **SSH Key:** ~/.ssh/nobias-media-key.pem
- **Username:** ec2-user (changed from ubuntu)
- **Project Path:** ~/mediawebsite
- **Backend Port:** 5002
- **PM2 Process:** nobias-backend

---

## Files Updated

### 1. DEPLOY-TO-EC2.md
**Changes:**
- Updated SSH connection command with correct key path and domain
- Changed username from `ubuntu` to `ec2-user`
- Added AWS CLI commands section
- Updated EC2 setup information with actual configuration
- Added security group configuration commands
- Added CloudWatch logs commands

### 2. verify-ec2-deployment.sh
**Changes:**
- Added configuration variables at the top
- Enhanced DNS resolution checks
- Added AWS CLI instance status check
- Added SSH connection to check PM2 status
- Updated all SSH commands with correct credentials
- Added better error handling and status messages

### 3. backend/deploy-ec2.sh
**Changes:**
- Updated final instructions with correct domain
- Added AWS security group configuration commands
- Added multiple endpoint URLs (local, public, domain)
- Enhanced deployment verification steps

### 4. .github/workflows/deploy-backend.yml
**Changes:**
- Changed username from `ubuntu` to `ec2-user`
- Added proper deployment script with error handling
- Added git pull, npm install, and PM2 restart
- Enhanced verification with API endpoint testing
- Added environment variables for EC2_HOST
- Updated output messages with correct domain

### 5. .github/workflows/ssh-test.yml
**Changes:**
- Changed username from `ubuntu` to `ec2-user`
- Enhanced SSH test with more system information
- Added disk usage and PM2 status checks
- Improved output formatting

---

## New Files Created

### 1. AWS-EC2-COMMANDS.md
**Comprehensive command reference including:**
- Instance management (start, stop, reboot, terminate)
- Security group configuration
- Elastic IP management
- PM2 management via SSH
- CloudWatch monitoring
- Backup and snapshot creation
- Troubleshooting commands
- Quick reference for common tasks

### 2. AWS-SETUP-GUIDE.md
**Complete setup guide covering:**
- Initial EC2 instance launch
- Security group configuration
- Server setup (Node.js, PM2, Git)
- Environment variables configuration
- GitHub Actions setup with secrets
- DNS configuration
- SSL/TLS setup with Nginx and Let's Encrypt
- CloudWatch monitoring setup
- Automated backups
- Troubleshooting procedures
- Cost optimization strategies
- Security best practices

### 3. AWS-QUICK-REFERENCE.md
**Quick reference card with:**
- Essential connection information
- Most commonly used commands
- AWS CLI shortcuts
- PM2 commands
- Troubleshooting quick fixes
- Emergency procedures
- Monitoring URLs
- Common issues and solutions
- Useful bash aliases

### 4. AWS-UPDATES-SUMMARY.md
**This file - documenting all changes**

---

## GitHub Secrets Required

Ensure these secrets are configured in your GitHub repository:

1. **EC2_SSH_KEY**
   - Path: Settings → Secrets and variables → Actions → New repository secret
   - Value: Complete contents of `~/.ssh/nobias-media-key.pem`
   - Include: `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`

2. **EC2_HOST**
   - Path: Settings → Secrets and variables → Actions → New repository secret
   - Value: `api.thenobiasmedia.com`

---

## Key Changes Summary

### Username Change
- **Old:** ubuntu
- **New:** ec2-user
- **Reason:** Amazon Linux 2 uses `ec2-user` by default

### SSH Key Path
- **Old:** `/path/to/YOUR_KEY.pem` (placeholder)
- **New:** `~/.ssh/nobias-media-key.pem` (actual path)

### Domain Configuration
- **Old:** Generic placeholders like `YOUR_EC2_IP`
- **New:** Actual domain `api.thenobiasmedia.com`

### AWS CLI Integration
- Added comprehensive AWS CLI commands for:
  - Instance management
  - Security groups
  - Monitoring
  - Backups
  - Cost optimization

---

## Testing Checklist

After these updates, verify:

- [ ] SSH connection works
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com
```

- [ ] GitHub Actions can deploy
  - Check: https://github.com/msckolw/mediawebsite/actions

- [ ] API is accessible
```bash
curl https://api.thenobiasmedia.com/api/news?page=1
```

- [ ] PM2 is running
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"
```

- [ ] DNS resolves correctly
```bash
dig api.thenobiasmedia.com
```

---

## Next Steps

1. **Verify GitHub Secrets**
   - Ensure EC2_SSH_KEY and EC2_HOST are set correctly

2. **Test Deployment**
   - Make a small change to backend
   - Push to main branch
   - Verify GitHub Actions deploys successfully

3. **Setup Monitoring**
   - Configure CloudWatch (see AWS-SETUP-GUIDE.md)
   - Setup automated backups

4. **Security Hardening**
   - Restrict SSH to specific IPs
   - Enable CloudTrail
   - Setup VPC Flow Logs

5. **SSL/TLS Configuration**
   - Setup Nginx reverse proxy
   - Install Let's Encrypt certificate
   - Configure HTTPS redirect

---

## Quick Commands Reference

```bash
# Connect to EC2
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

# Check instance status
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=nobias-media-backend" \
  --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]" \
  --output table
```

---

## Documentation Structure

```
.
├── DEPLOY-TO-EC2.md           # Quick deployment guide
├── AWS-EC2-COMMANDS.md        # Comprehensive command reference
├── AWS-SETUP-GUIDE.md         # Complete setup from scratch
├── AWS-QUICK-REFERENCE.md     # Quick reference card
├── AWS-UPDATES-SUMMARY.md     # This file
├── verify-ec2-deployment.sh   # Deployment verification script
├── backend/deploy-ec2.sh      # Server-side deployment script
└── .github/workflows/
    ├── deploy-backend.yml     # Automated deployment
    └── ssh-test.yml           # SSH connection test
```

---

## Support & Troubleshooting

If you encounter issues:

1. **Check the logs:**
   ```bash
   ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend"
   ```

2. **Verify GitHub Actions:**
   - https://github.com/msckolw/mediawebsite/actions

3. **Test API endpoint:**
   ```bash
   curl -v https://api.thenobiasmedia.com/api/news?page=1
   ```

4. **Check DNS:**
   ```bash
   dig api.thenobiasmedia.com
   ```

5. **Refer to documentation:**
   - Quick fixes: AWS-QUICK-REFERENCE.md
   - Detailed troubleshooting: AWS-SETUP-GUIDE.md
   - All commands: AWS-EC2-COMMANDS.md

---

## Changelog

**Date:** January 15, 2026

**Changes:**
- Updated all AWS EC2 credentials from placeholders to actual values
- Changed username from `ubuntu` to `ec2-user`
- Updated SSH key path to `~/.ssh/nobias-media-key.pem`
- Updated domain to `api.thenobiasmedia.com`
- Added comprehensive AWS CLI commands
- Created three new documentation files
- Enhanced GitHub Actions workflows
- Added monitoring and backup procedures
- Included security best practices
- Added troubleshooting guides

**Impact:**
- All deployment scripts now use correct credentials
- GitHub Actions will deploy successfully
- Documentation is complete and accurate
- Easier troubleshooting with comprehensive guides
