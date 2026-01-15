# Deploy Backend Changes to EC2

## Quick Deployment (Copy & Paste)

### Step 1: Connect to Your EC2 Instance

Replace `YOUR_KEY.pem` and `YOUR_EC2_IP` with your actual values:

```bash
ssh -i /path/to/YOUR_KEY.pem ec2-user@YOUR_EC2_IP
```

### Step 2: Deploy the Changes

Once connected to EC2, run these commands:

```bash
# Navigate to your project directory
cd ~/mediawebsite  # or wherever your project is located

# Pull the latest changes from GitHub
git pull origin main

# Navigate to backend directory
cd backend

# Install any new dependencies (optional, only if package.json changed)
npm install

# Restart the backend service with PM2
pm2 restart nobias-backend

# Check if it's running properly
pm2 status

# View recent logs to verify no errors
pm2 logs nobias-backend --lines 30
```

### Step 3: Verify the Fix

1. Open your production website in a browser
2. Click on any article
3. Click "News Sources" button
4. It should now work without requiring login! ✅

---

## Alternative: One-Line Deployment

If you want to do it all at once:

```bash
ssh -i /path/to/YOUR_KEY.pem ec2-user@YOUR_EC2_IP "cd ~/mediawebsite && git pull origin main && cd backend && pm2 restart nobias-backend && pm2 logs nobias-backend --lines 20"
```

---

## Troubleshooting

### If PM2 is not running:
```bash
cd ~/mediawebsite/backend
pm2 start src/server.js --name nobias-backend
pm2 save
```

### If you get permission errors:
```bash
chmod 400 /path/to/YOUR_KEY.pem
```

### If git pull fails:
```bash
cd ~/mediawebsite
git stash  # Save any local changes
git pull origin main
```

### Check backend logs:
```bash
pm2 logs nobias-backend --lines 50
```

### Restart if needed:
```bash
pm2 restart nobias-backend
```

---

## What This Deployment Fixes

**Issue:** "Access Token is Mandatory" error when clicking "News Sources"

**Fix:** Updated `backend/src/routes/newsRoutes.js` to allow public access to article sources without authentication

**Files Changed:**
- `backend/src/routes/newsRoutes.js` - Removed authentication requirement for sources

---

## Need Help?

If you encounter any issues:

1. **Check PM2 status:** `pm2 status`
2. **View logs:** `pm2 logs nobias-backend`
3. **Restart backend:** `pm2 restart nobias-backend`
4. **Check if port 5002 is open:** `netstat -tuln | grep 5002`

---

## Your EC2 Setup Info Needed

To help you better, please provide:
- EC2 instance IP address
- Path to your SSH key file
- Directory where your project is located on EC2
- Username (usually `ec2-user` or `ubuntu`)

Then I can give you the exact commands to run!
