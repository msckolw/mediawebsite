# AWS EC2 Setup Guide for NoBias Media

## Current Configuration

**Production Environment:**
- **Domain:** api.thenobiasmedia.com
- **Backend Port:** 5002
- **SSH Key:** ~/.ssh/nobias-media-key.pem
- **Username:** ec2-user
- **Project Path:** ~/mediawebsite
- **PM2 Process:** nobias-backend

---

## Prerequisites

1. **AWS Account** with EC2 access
2. **AWS CLI** installed and configured
3. **SSH Key Pair** (nobias-media-key.pem)
4. **Domain** pointing to EC2 instance

---

## Initial EC2 Setup

### 1. Launch EC2 Instance

```bash
# Using AWS CLI
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name nobias-media-key \
  --security-group-ids <SECURITY_GROUP_ID> \
  --subnet-id <SUBNET_ID> \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=nobias-media-backend}]'
```

### 2. Configure Security Group

Required inbound rules:
```bash
# SSH (Port 22)
aws ec2 authorize-security-group-ingress \
  --group-id <SECURITY_GROUP_ID> \
  --protocol tcp --port 22 \
  --cidr <YOUR_IP>/32

# Backend API (Port 5002)
aws ec2 authorize-security-group-ingress \
  --group-id <SECURITY_GROUP_ID> \
  --protocol tcp --port 5002 \
  --cidr 0.0.0.0/0

# HTTPS (Port 443)
aws ec2 authorize-security-group-ingress \
  --group-id <SECURITY_GROUP_ID> \
  --protocol tcp --port 443 \
  --cidr 0.0.0.0/0
```

### 3. Allocate Elastic IP (Optional but Recommended)

```bash
# Allocate Elastic IP
aws ec2 allocate-address --domain vpc

# Associate with instance
aws ec2 associate-address \
  --instance-id <INSTANCE_ID> \
  --allocation-id <ALLOCATION_ID>
```

---

## Server Setup

### 1. Connect to EC2

```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com
```

### 2. Install Node.js

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Install Node.js LTS
nvm install --lts
nvm use --lts
```

### 3. Install PM2

```bash
npm install -g pm2
```

### 4. Clone Repository

```bash
cd ~
git clone https://github.com/msckolw/mediawebsite.git
cd mediawebsite/backend
```

### 5. Setup Environment Variables

```bash
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://manisankar:77HFY1n0QsN6d76L@cluster0.kkwdaye.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
PORT=5002
JWT_SECRET=nobias_media_jwt_secret_key_2024_secure
NODE_ENV=production
EOF
```

### 6. Install Dependencies

```bash
npm install --production
```

### 7. Start with PM2

```bash
pm2 start src/server.js --name nobias-backend
pm2 save
pm2 startup
```

Run the command that PM2 outputs (with sudo).

---

## GitHub Actions Setup

### Required Secrets

Add these secrets to your GitHub repository:

1. **EC2_SSH_KEY**
   - Content: Private SSH key (nobias-media-key.pem)
   - Path: Settings → Secrets → Actions → New repository secret

2. **EC2_HOST**
   - Content: api.thenobiasmedia.com (or EC2 public IP)
   - Path: Settings → Secrets → Actions → New repository secret

### Add SSH Key to GitHub Secrets

```bash
# Display your private key
cat ~/.ssh/nobias-media-key.pem

# Copy the entire output including:
# -----BEGIN RSA PRIVATE KEY-----
# ... key content ...
# -----END RSA PRIVATE KEY-----
```

Paste this into GitHub Secrets as `EC2_SSH_KEY`.

---

## DNS Configuration

### Point Domain to EC2

1. Get your EC2 public IP:
```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=nobias-media-backend" \
  --query "Reservations[*].Instances[*].PublicIpAddress" \
  --output text
```

2. Add A record in your DNS provider:
   - **Type:** A
   - **Name:** api
   - **Value:** <EC2_PUBLIC_IP>
   - **TTL:** 300

3. Verify DNS:
```bash
dig api.thenobiasmedia.com
nslookup api.thenobiasmedia.com
```

---

## SSL/TLS Setup (HTTPS)

### Option 1: Using Nginx + Let's Encrypt

```bash
# Install Nginx
sudo yum install nginx -y

# Install Certbot
sudo yum install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d api.thenobiasmedia.com

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/conf.d/nobias.conf
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name api.thenobiasmedia.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.thenobiasmedia.com;

    ssl_certificate /etc/letsencrypt/live/api.thenobiasmedia.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.thenobiasmedia.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Option 2: Using AWS Certificate Manager + Load Balancer

1. Request certificate in ACM
2. Create Application Load Balancer
3. Configure target group pointing to EC2:5002
4. Update DNS to point to ALB

---

## Monitoring & Maintenance

### CloudWatch Setup

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
sudo rpm -U ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### Automated Backups

Create a backup script:
```bash
cat > ~/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d)
INSTANCE_ID=$(ec2-metadata --instance-id | cut -d " " -f 2)

# Create AMI
aws ec2 create-image \
  --instance-id $INSTANCE_ID \
  --name "nobias-backup-$DATE" \
  --description "Automated backup"

# Delete old backups (keep last 7 days)
aws ec2 describe-images \
  --owners self \
  --filters "Name=name,Values=nobias-backup-*" \
  --query 'Images[?CreationDate<=`'$(date -d '7 days ago' -Iseconds)'`].[ImageId]' \
  --output text | xargs -r aws ec2 deregister-image --image-id
EOF

chmod +x ~/backup.sh
```

Add to crontab:
```bash
crontab -e
# Add: 0 2 * * * ~/backup.sh
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
pm2 logs nobias-backend

# Check environment variables
cat ~/mediawebsite/backend/.env

# Test MongoDB connection
node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"
```

### Port Already in Use

```bash
# Find process using port 5002
sudo netstat -tulpn | grep 5002

# Kill process
sudo kill -9 <PID>

# Restart PM2
pm2 restart nobias-backend
```

### Cannot Connect via SSH

```bash
# Check security group
aws ec2 describe-security-groups --group-ids <SECURITY_GROUP_ID>

# Check instance status
aws ec2 describe-instance-status --instance-ids <INSTANCE_ID>

# Check SSH key permissions
chmod 400 ~/.ssh/nobias-media-key.pem
```

### High CPU/Memory Usage

```bash
# Check resource usage
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "top -bn1 | head -20"

# Check PM2 metrics
pm2 monit

# Restart if needed
pm2 restart nobias-backend
```

---

## Cost Optimization

### Use Reserved Instances

```bash
# Purchase 1-year reserved instance (saves ~40%)
aws ec2 purchase-reserved-instances-offering \
  --reserved-instances-offering-id <OFFERING_ID> \
  --instance-count 1
```

### Auto-Scaling (Optional)

For high traffic, consider:
1. Create Auto Scaling Group
2. Configure scaling policies
3. Use Application Load Balancer

### Stop Instance During Off-Hours

```bash
# Create Lambda function to stop/start instance
# Or use AWS Instance Scheduler
```

---

## Security Best Practices

1. **Restrict SSH Access**
   - Only allow your IP
   - Use bastion host for production

2. **Regular Updates**
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "sudo yum update -y"
```

3. **Enable CloudTrail**
```bash
aws cloudtrail create-trail \
  --name nobias-audit \
  --s3-bucket-name nobias-cloudtrail-logs
```

4. **Use IAM Roles**
   - Attach IAM role to EC2 instead of storing credentials

5. **Enable VPC Flow Logs**
```bash
aws ec2 create-flow-logs \
  --resource-type VPC \
  --resource-ids <VPC_ID> \
  --traffic-type ALL \
  --log-destination-type cloud-watch-logs \
  --log-group-name nobias-vpc-flow-logs
```

---

## Quick Reference Commands

```bash
# SSH to server
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com

# Deploy changes
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "cd ~/mediawebsite && git pull && cd backend && npm install && pm2 restart nobias-backend"

# Check status
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 status"

# View logs
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend --lines 50"

# Test API
curl https://api.thenobiasmedia.com/api/news?page=1
```

---

## Support

For issues or questions:
1. Check logs: `pm2 logs nobias-backend`
2. Review GitHub Actions: https://github.com/msckolw/mediawebsite/actions
3. Verify DNS: `dig api.thenobiasmedia.com`
4. Test API: `curl https://api.thenobiasmedia.com/api/news?page=1`
