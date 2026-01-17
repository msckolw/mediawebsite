# AWS EC2 Complete Guide

## Quick Reference

**Domain:** api.thenobiasmedia.com  
**SSH Key:** ~/.ssh/nobias-media-key.pem  
**User:** ec2-user  
**Path:** ~/mediawebsite  
**Port:** 5002  
**PM2:** nobias-backend

---

## Essential Commands

### Connect to EC2
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com
```

### Deploy Changes
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "cd ~/mediawebsite && git pull && cd backend && npm install && pm2 restart nobias-backend"
```

### Check Status
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"
```

### View Logs
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend --lines 50"
```

### Test API
```bash
curl https://api.thenobiasmedia.com/api/news?page=1
```

---

## AWS CLI Commands

### Instance Management
```bash
# Check status
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=nobias-media-backend" \
  --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]" \
  --output table

# Start instance
aws ec2 start-instances --instance-ids <INSTANCE_ID>

# Stop instance
aws ec2 stop-instances --instance-ids <INSTANCE_ID>

# Reboot instance
aws ec2 reboot-instances --instance-ids <INSTANCE_ID>
```

### Security Group
```bash
# View rules
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=*nobias*"

# Add port 5002
aws ec2 authorize-security-group-ingress \
  --group-id <SG_ID> \
  --protocol tcp --port 5002 --cidr 0.0.0.0/0
```

### Create Backup
```bash
aws ec2 create-image \
  --instance-id <INSTANCE_ID> \
  --name "nobias-backup-$(date +%Y%m%d)"
```

---

## Troubleshooting

### Backend Not Responding
```bash
# Check logs
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend"

# Restart
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 restart nobias-backend"
```

### Port Issues
```bash
# Check what's using port 5002
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "sudo netstat -tulpn | grep 5002"
```

### MongoDB Connection Error
```bash
# Verify .env file
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "cat ~/mediawebsite/backend/.env"

# Recreate .env
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

### Complete System Recovery
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
# Stop PM2
pm2 kill

# Pull latest code
cd ~/mediawebsite
git fetch origin
git reset --hard origin/main

# Reinstall dependencies
cd backend
rm -rf node_modules
npm install --production

# Recreate .env
cat > .env << 'ENVEOF'
MONGODB_URI=mongodb+srv://manisankar:77HFY1n0QsN6d76L@cluster0.kkwdaye.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
PORT=5002
JWT_SECRET=nobias_media_jwt_secret_key_2024_secure
NODE_ENV=production
ENVEOF

# Start backend
pm2 start src/server.js --name nobias-backend
pm2 save
pm2 startup
EOF
```

---

## Monitoring

### Check Resources
```bash
# CPU and Memory
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "top -bn1 | head -20"

# Disk space
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "df -h"

# Memory
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "free -h"
```

### PM2 Monitoring
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 monit"
```

---

## Security Best Practices

1. **Restrict SSH access** to your IP only
2. **Keep system updated**:
   ```bash
   ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "sudo yum update -y"
   ```
3. **Regular backups** (weekly recommended)
4. **Monitor logs** for suspicious activity
5. **Use IAM roles** instead of storing credentials

---

## Useful Aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
alias nbssh='ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com'
alias nbdeploy='ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "cd ~/mediawebsite && git pull && cd backend && pm2 restart nobias-backend"'
alias nbstatus='ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"'
alias nblogs='ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend"'
alias nbtest='curl https://api.thenobiasmedia.com/api/news?page=1'
```
