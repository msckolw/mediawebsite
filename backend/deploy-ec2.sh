#!/bin/bash

# AWS EC2 Deployment Script for NoBias Media Backend
# Run this script on your EC2 instance

echo "🚀 Starting NoBias Media Backend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root"
    exit 1
fi

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
print_status "Script directory: $SCRIPT_DIR"

# Navigate to backend directory
cd "$SCRIPT_DIR"
print_status "Current directory: $(pwd)"

# Create .env file with correct MongoDB URI
print_status "Creating .env file..."
cat > .env << 'EOF'
# MongoDB Connection
MONGODB_URI=mongodb+srv://manisankar:77HFY1n0QsN6d76L@cluster0.kkwdaye.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# Server Port
PORT=5002

# JWT Secret (change this to a secure random string)
JWT_SECRET=nobias_media_jwt_secret_key_2024_secure

# Node Environment
NODE_ENV=production
EOF

print_status ".env file created successfully"

# Verify .env file
if [ -f ".env" ]; then
    print_status "✅ .env file exists"
    print_status "Environment variables:"
    cat .env | grep -v "^#" | grep -v "^$"
else
    print_error "❌ Failed to create .env file"
    exit 1
fi

# Install dependencies
print_status "Installing Node.js dependencies..."
if npm install; then
    print_status "✅ Dependencies installed successfully"
else
    print_error "❌ Failed to install dependencies"
    exit 1
fi

# Test environment variables
print_status "Testing environment variable loading..."
node -e "
require('dotenv').config();
console.log('MONGODB_URI loaded:', !!process.env.MONGODB_URI);
console.log('PORT loaded:', !!process.env.PORT);
console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
if (process.env.MONGODB_URI) {
    console.log('✅ Environment variables loaded successfully');
} else {
    console.log('❌ Environment variables not loaded');
    process.exit(1);
}
"

# Create PM2 ecosystem file
print_status "Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'nobias-backend',
    script: 'src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

print_status "✅ PM2 ecosystem file created"

# Stop existing PM2 process if running
print_status "Stopping existing PM2 processes..."
pm2 stop nobias-backend 2>/dev/null || true
pm2 delete nobias-backend 2>/dev/null || true

# Test the server connection
print_status "Testing server startup..."
timeout 10s node src/server.js &
SERVER_PID=$!
sleep 5

if kill -0 $SERVER_PID 2>/dev/null; then
    print_status "✅ Server starts successfully"
    kill $SERVER_PID 2>/dev/null || true
else
    print_warning "Server test completed (may have exited normally)"
fi

# Start with PM2
print_status "Starting application with PM2..."
if pm2 start ecosystem.config.js; then
    print_status "✅ Application started with PM2"
else
    print_error "❌ Failed to start with PM2"
    exit 1
fi

# Save PM2 configuration
pm2 save

# Setup PM2 startup (this will show a command to run with sudo)
print_status "Setting up PM2 startup..."
pm2 startup

# Show status
print_status "Application status:"
pm2 status

# Show logs
print_status "Recent logs:"
pm2 logs nobias-backend --lines 10

# Test API endpoint
print_status "Testing API endpoint..."
sleep 3
if curl -f http://localhost:5002/ >/dev/null 2>&1; then
    print_status "✅ API endpoint is responding"
else
    print_warning "⚠️  API endpoint test failed - check logs above"
fi

# Final instructions
echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Run the PM2 startup command shown above (with sudo)"
echo "2. Configure your security group to allow port 5002"
echo "3. Update your frontend API URL to: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5002/api"
echo ""
echo "📊 Useful commands:"
echo "  pm2 status              - Check application status"
echo "  pm2 logs nobias-backend - View logs"
echo "  pm2 restart nobias-backend - Restart application"
echo "  pm2 monit              - Monitor application"
echo ""
echo "🌐 Your backend should be accessible at:"
echo "  http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5002"
echo ""