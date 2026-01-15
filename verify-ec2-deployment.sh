#!/bin/bash

echo "🔍 Verifying EC2 Backend Deployment"
echo "===================================="
echo ""

# Check DNS resolution
echo "1️⃣ Checking DNS for api.thenobiasmedia.com..."
API_IP=$(dig +short api.thenobiasmedia.com | tail -n1)
echo "   DNS resolves to: $API_IP"
echo ""

# Check if backend is responding
echo "2️⃣ Testing backend API endpoint..."
echo "   Trying: https://api.thenobiasmedia.com/api/news?page=1"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.thenobiasmedia.com/api/news?page=1)
echo "   HTTP Status: $HTTP_CODE"
echo ""

# Test the specific endpoint with source=true
echo "3️⃣ Testing news source endpoint (the problematic one)..."
echo "   Trying: https://api.thenobiasmedia.com/api/news/695b8dc5eb1b0e0375c475d4?source=true"
SOURCE_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://api.thenobiasmedia.com/api/news/695b8dc5eb1b0e0375c475d4?source=true)
echo "   HTTP Status: $SOURCE_CODE"

if [ "$SOURCE_CODE" = "401" ]; then
    echo "   ❌ Still getting 401 Unauthorized - Backend not updated yet"
elif [ "$SOURCE_CODE" = "200" ]; then
    echo "   ✅ Success! Backend is working correctly"
else
    echo "   ⚠️  Unexpected status code: $SOURCE_CODE"
fi
echo ""

# Check what's actually running
echo "4️⃣ Recommendations:"
if [ "$SOURCE_CODE" = "401" ]; then
    echo "   - Backend code on EC2 is not updated"
    echo "   - Check GitHub Actions deployment logs"
    echo "   - Verify PM2 restarted successfully"
    echo "   - SSH into EC2 and check: pm2 logs nobias-backend"
fi
echo ""
echo "🔗 Useful links:"
echo "   GitHub Actions: https://github.com/msckolw/mediawebsite/actions"
echo "   Your API: https://api.thenobiasmedia.com/api/news?page=1"
