# AWS EC2 Management Commands

## Instance Information

**Domain:** api.thenobiasmedia.com  
**SSH Key:** ~/.ssh/nobias-media-key.pem  
**Username:** ec2-user  
**Project Path:** ~/mediawebsite  
**Backend Port:** 5002

---

## SSH Connection

### Basic Connection
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com
```

### Connection with Port Forwarding
```bash
ssh -i ~/.ssh/nobias-media-key.pem -L 5002:localhost:5002 ec2-user@api.thenobiasmedia.com
```

### Fix SSH Key Permissions
```bash
chmod 400 ~/.ssh/nobias-media-key.pem
```

---

## AWS CLI Commands

### Instance Management

#### Check Instance Status
```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=nobias-media-backend" \
  --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress,PrivateIpAddress]" \
  --output table
```

#### Get Instance ID
```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=nobias-media-backend" \
  --query "Reservations[*].Instances[*].InstanceId" \
  --output text
```

#### Start Instance
```bash
aws ec2 start-instances --instance-ids <INSTANCE_ID>
```

#### Stop Instance
```bash
aws ec2 stop-instances --instance-ids <INSTANCE_ID>
```

#### Reboot Instance
```bash
aws ec2 reboot-instances --instance-ids <INSTANCE_ID>
```

#### Terminate Instance (DANGEROUS!)
```bash
aws ec2 terminate-instances --instance-ids <INSTANCE_ID>
```

---

### Security Groups

#### List Security Groups
```bash
aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=*nobias*" \
  --query "SecurityGroups[*].[GroupId,GroupName,Description]" \
  --output table
```

#### View Security Group Rules
```bash
aws ec2 describe-security-groups \
  --group-ids <SECURITY_GROUP_ID> \
  --query "SecurityGroups[*].IpPermissions[*]" \
  --output json
```

#### Add Inbound Rule (Port 5002)
```bash
aws ec2 authorize-security-group-ingress \
  --group-id <SECURITY_GROUP_ID> \
  --protocol tcp \
  --port 5002 \
  --cidr 0.0.0.0/0
```

#### Add Inbound Rule (HTTPS)
```bash
aws ec2 authorize-security-group-ingress \
  --group-id <SECURITY_GROUP_ID> \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

#### Remove Inbound Rule
```bash
aws ec2 revoke-security-group-ingress \
  --group-id <SECURITY_GROUP_ID> \
  --protocol tcp \
  --port 5002 \
  --cidr 0.0.0.0/0
```

---

### Elastic IP Management

#### List Elastic IPs
```bash
aws ec2 describe-addresses \
  --query "Addresses[*].[PublicIp,InstanceId,AllocationId]" \
  --output table
```

#### Associate Elastic IP
```bash
aws ec2 associate-address \
  --instance-id <INSTANCE_ID> \
  --allocation-id <ALLOCATION_ID>
```

#### Disassociate Elastic IP
```bash
aws ec2 disassociate-address --association-id <ASSOCIATION_ID>
```

---

## PM2 Management on EC2

### Check Status
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"
```

### View Logs
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend --lines 50"
```

### Restart Application
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 restart nobias-backend"
```

### Full Deployment
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "cd ~/mediawebsite && git pull origin main && cd backend && npm install && pm2 restart nobias-backend"
```

---

## Monitoring & Logs

### CloudWatch Logs (if configured)
```bash
aws logs tail /aws/ec2/nobias-backend --follow
```

### System Metrics
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=<INSTANCE_ID> \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### Check Disk Usage
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "df -h"
```

### Check Memory Usage
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "free -h"
```

---

## Backup & Snapshots

### Create AMI Backup
```bash
aws ec2 create-image \
  --instance-id <INSTANCE_ID> \
  --name "nobias-backend-backup-$(date +%Y%m%d)" \
  --description "Backup of NoBias Media backend"
```

### List AMIs
```bash
aws ec2 describe-images \
  --owners self \
  --query "Images[*].[ImageId,Name,CreationDate]" \
  --output table
```

### Create EBS Snapshot
```bash
aws ec2 create-snapshot \
  --volume-id <VOLUME_ID> \
  --description "NoBias backend volume snapshot"
```

---

## Troubleshooting

### Test API Endpoint
```bash
curl -v https://api.thenobiasmedia.com/api/news?page=1
```

### Check Port Connectivity
```bash
nc -zv api.thenobiasmedia.com 5002
```

### DNS Lookup
```bash
dig api.thenobiasmedia.com
nslookup api.thenobiasmedia.com
```

### Check Process on Port
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "sudo netstat -tulpn | grep 5002"
```

### View System Logs
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "sudo journalctl -u pm2-ec2-user -n 50"
```

---

## Quick Reference

### Environment Variables
```bash
# View on EC2
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "cat ~/mediawebsite/backend/.env"
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

## Cost Optimization

### Check Instance Type
```bash
aws ec2 describe-instances \
  --instance-ids <INSTANCE_ID> \
  --query "Reservations[*].Instances[*].[InstanceType,State.Name]" \
  --output table
```

### Stop Instance During Off-Hours (Schedule)
```bash
# Create CloudWatch Event Rule (example)
aws events put-rule \
  --name stop-nobias-backend-nightly \
  --schedule-expression "cron(0 2 * * ? *)"
```

---

## Security Best Practices

1. **Restrict SSH Access**
```bash
aws ec2 authorize-security-group-ingress \
  --group-id <SECURITY_GROUP_ID> \
  --protocol tcp \
  --port 22 \
  --cidr <YOUR_IP>/32
```

2. **Enable CloudWatch Monitoring**
```bash
aws ec2 monitor-instances --instance-ids <INSTANCE_ID>
```

3. **Regular Backups**
```bash
# Create weekly backup script
aws ec2 create-image \
  --instance-id <INSTANCE_ID> \
  --name "nobias-weekly-$(date +%Y%m%d)"
```

4. **Update Security Patches**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "sudo yum update -y"
```
