#!/bin/bash

echo "🔍 Verifying EC2 Backend Deployment"
echo "===================================="
echo ""

# Configuration
API_DOMAIN="api.thenobiasmedia.com"
SSH_KEY="~/.ssh/nobias-media-key.pem"
SSH_USER="ec2-user"

# Check DNS resolution
echo "1️⃣ Checking DNS for $API_DOMAIN..."
API_IP=$(dig +short $API_DOMAIN | tail -n1)
if [ -z "$API_IP" ]; then
    echo "   ❌ DNS resolution failed"
else
    echo "   ✅ DNS resolves to: $API_IP"
fi
echo ""

# Check if backend is responding
echo "2️⃣ Testing backend API endpoint..."
echo "   Trying: https://$API_DOMAIN/api/news?page=1"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$API_DOMAIN/api/news?page=1)
echo "   HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Backend is responding"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "   ❌ Cannot connect to backend"
else
    echo "   ⚠️  Unexpected status: $HTTP_CODE"
fi
echo ""

# Test the specific endpoint with source=true
echo "3️⃣ Testing news source endpoint (the problematic one)..."
echo "   Trying: https://$API_DOMAIN/api/news/695b8dc5eb1b0e0375c475d4?source=true"
SOURCE_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$API_DOMAIN/api/news/695b8dc5eb1b0e0375c475d4?source=true)
echo "   HTTP Status: $SOURCE_CODE"

if [ "$SOURCE_CODE" = "401" ]; then
    echo "   ❌ Still getting 401 Unauthorized - Backend not updated yet"
elif [ "$SOURCE_CODE" = "200" ]; then
    echo "   ✅ Success! Backend is working correctly"
else
    echo "   ⚠️  Unexpected status code: $SOURCE_CODE"
fi
echo ""

# Check EC2 instance status via AWS CLI (if configured)
echo "4️⃣ Checking EC2 instance status..."
if command -v aws &> /dev/null; then
    echo "   Running AWS CLI check..."
    aws ec2 describe-instances \
      --filters "Name=tag:Name,Values=nobias-media-backend" \
      --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]" \
      --output table 2>/dev/null || echo "   ⚠️  AWS CLI not configured or no matching instances"
else
    echo "   ⚠️  AWS CLI not installed - skipping instance check"
fi
echo ""

# SSH and check PM2 status (optional)
echo "5️⃣ Checking PM2 status on EC2..."
if [ -f "$SSH_KEY" ]; then
    echo "   Connecting to EC2..."
    ssh -i $SSH_KEY -o ConnectTimeout=5 -o StrictHostKeyChecking=no $SSH_USER@$API_DOMAIN "pm2 status" 2>/dev/null || echo "   ⚠️  Cannot connect via SSH"
else
    echo "   ⚠️  SSH key not found at $SSH_KEY"
fi
echo ""

# Check what's actually running
echo "6️⃣ Recommendations:"
if [ "$SOURCE_CODE" = "401" ]; then
    echo "   - Backend code on EC2 is not updated"
    echo "   - SSH to EC2: ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com"
    echo "   - Check GitHub Actions deployment logs"
    echo "   - Verify PM2 restarted successfully"
    echo "   - Check logs: pm2 logs nobias-backend"
fi
echo ""
echo "🔗 Useful links:"
echo "   GitHub Actions: https://github.com/msckolw/mediawebsite/actions"
echo "   Your API: https://api.thenobiasmedia.com/api/news?page=1"
echo ""
echo "📋 Quick SSH command:"
echo "   ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com"
