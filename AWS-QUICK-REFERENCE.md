# AWS EC2 Quick Reference Card

## Essential Information

```
Domain:     api.thenobiasmedia.com
SSH Key:    ~/.ssh/nobias-media-key.pem
User:       ec2-user
Path:       ~/mediawebsite
Port:       5002
PM2 Name:   nobias-backend
```

---

## Most Used Commands

### SSH Connection
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com
```

### Quick Deploy
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "cd ~/mediawebsite && git pull && cd backend && pm2 restart nobias-backend"
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

### Instance Status
```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=nobias-media-backend" \
  --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]" \
  --output table
```

### Start/Stop Instance
```bash
# Get instance ID first
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=nobias-media-backend" \
  --query "Reservations[*].Instances[*].InstanceId" \
  --output text)

# Stop
aws ec2 stop-instances --instance-ids $INSTANCE_ID

# Start
aws ec2 start-instances --instance-ids $INSTANCE_ID

# Reboot
aws ec2 reboot-instances --instance-ids $INSTANCE_ID
```

### Security Group
```bash
# View rules
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=*nobias*" \
  --query "SecurityGroups[*].IpPermissions[*]" \
  --output json

# Add port 5002
aws ec2 authorize-security-group-ingress \
  --group-id <SG_ID> \
  --protocol tcp --port 5002 --cidr 0.0.0.0/0
```

---

## PM2 Commands (on EC2)

```bash
pm2 status                    # Check status
pm2 logs nobias-backend       # View logs
pm2 restart nobias-backend    # Restart app
pm2 stop nobias-backend       # Stop app
pm2 start nobias-backend      # Start app
pm2 monit                     # Monitor resources
pm2 save                      # Save current state
```

---

## Troubleshooting

### Backend Not Responding
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
pm2 logs nobias-backend --lines 50
pm2 restart nobias-backend
pm2 status
EOF
```

### Check Port
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "sudo netstat -tulpn | grep 5002"
```

### Check Disk Space
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "df -h"
```

### Check Memory
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "free -h"
```

---

## Emergency Procedures

### Complete Restart
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite/backend
pm2 stop nobias-backend
pm2 delete nobias-backend
pm2 start src/server.js --name nobias-backend
pm2 save
EOF
```

### Rollback to Previous Version
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite
git log --oneline -5
git reset --hard <COMMIT_HASH>
cd backend
pm2 restart nobias-backend
EOF
```

### Clear Logs
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "pm2 flush nobias-backend"
```

---

## Monitoring URLs

- **API Health:** https://api.thenobiasmedia.com/api/news?page=1
- **GitHub Actions:** https://github.com/msckolw/mediawebsite/actions
- **AWS Console:** https://console.aws.amazon.com/ec2/

---

## GitHub Secrets Required

```
EC2_SSH_KEY  = Contents of ~/.ssh/nobias-media-key.pem
EC2_HOST     = api.thenobiasmedia.com
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Backend not updated, run deploy |
| Connection refused | Check if PM2 is running |
| Port in use | Kill process: `sudo kill -9 $(lsof -ti:5002)` |
| Out of memory | Restart PM2: `pm2 restart nobias-backend` |
| Git pull fails | Stash changes: `git stash && git pull` |
| SSH timeout | Check security group allows your IP |

---

## Backup & Recovery

### Create Backup
```bash
aws ec2 create-image \
  --instance-id <INSTANCE_ID> \
  --name "nobias-backup-$(date +%Y%m%d)" \
  --description "Manual backup"
```

### List Backups
```bash
aws ec2 describe-images \
  --owners self \
  --filters "Name=name,Values=nobias-backup-*" \
  --query "Images[*].[ImageId,Name,CreationDate]" \
  --output table
```

---

## Performance Optimization

### Check Response Time
```bash
curl -w "@-" -o /dev/null -s https://api.thenobiasmedia.com/api/news?page=1 << 'EOF'
time_namelookup:  %{time_namelookup}\n
time_connect:     %{time_connect}\n
time_starttransfer: %{time_starttransfer}\n
time_total:       %{time_total}\n
EOF
```

### Monitor CPU/Memory
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "top -bn1 | head -20"
```

---

## Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# SSH to NoBias EC2
alias nbssh='ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com'

# Deploy NoBias backend
alias nbdeploy='ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "cd ~/mediawebsite && git pull && cd backend && pm2 restart nobias-backend"'

# Check NoBias status
alias nbstatus='ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"'

# View NoBias logs
alias nblogs='ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend"'

# Test NoBias API
alias nbtest='curl https://api.thenobiasmedia.com/api/news?page=1'
```

Then run: `source ~/.bashrc` or `source ~/.zshrc`
