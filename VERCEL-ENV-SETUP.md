# Fix: No News Showing on Live Site

## The Problem:
Your live site (https://thenobiasmedia.com) is trying to connect to `localhost:5002` which doesn't exist on the internet. It only works on your computer.

## The Solution:
Set the production API URL in Vercel's Environment Variables.

---

## Step-by-Step Guide:

### 1. Go to Vercel Dashboard
- Open: https://vercel.com
- Click on your project: **media-website**

### 2. Open Environment Variables Settings
- Click **"Settings"** tab (top)
- Click **"Environment Variables"** (left sidebar)

### 3. Add the API URL Variable

Click **"Add New"** or **"Add Variable"** button

Fill in:
```
Key (Name):     REACT_APP_API_URL
Value:          https://api.thenobiasmedia.com/api
Environment:    ✅ Production
                ☐ Preview
                ☐ Development
```

**Important:** 
- Only check **"Production"** box
- Leave Preview and Development unchecked

Click **"Save"**

### 4. Add Google OAuth Variable (if not already added)

Click **"Add New"** again

Fill in:
```
Key (Name):     REACT_APP_OAUTH_CLIENT_ID
Value:          230747935272-gansuql6fvrfocn57vtpe6gm44aoosab.apps.googleusercontent.com
Environment:    ✅ Production
                ✅ Preview
                ✅ Development
```

Click **"Save"**

---

## 5. Redeploy Your Site

After adding environment variables, you need to redeploy:

**Option A: Trigger Redeploy in Vercel**
1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. Click the three dots (⋮) menu
4. Click **"Redeploy"**
5. Confirm

**Option B: Push to Git (forces redeploy)**
```bash
cd /Users/manisankarchakrabarty/Documents/The\ NBM/mediawebsite
git commit --allow-empty -m "Trigger redeploy with new environment variables"
git push origin main
```

---

## 6. Wait for Deployment

- Vercel will rebuild your site with the new environment variables
- This takes about 2-5 minutes
- You'll see the build progress in the **Deployments** tab

---

## 7. Verify It Works

After deployment completes:

1. Open: https://thenobiasmedia.com
2. Wait for news to load
3. You should see news articles! ✅

---

## Important Notes:

### Make Sure Your Backend API is Running!

Your backend must be running at: `https://api.thenobiasmedia.com`

Test it:
```bash
curl https://api.thenobiasmedia.com/api/news
```

If this doesn't work, you need to:
1. Start your backend server on EC2/Render
2. Configure DNS for `api.thenobiasmedia.com` to point to your backend server
3. Make sure backend is listening on port 5002 or 443 (HTTPS)

---

## Troubleshooting:

### News Still Not Loading After Redeploy?

**Check 1: Environment Variable is Set**
- Go to Vercel → Settings → Environment Variables
- Verify `REACT_APP_API_URL` is there with correct value

**Check 2: Backend API is Working**
```bash
curl https://api.thenobiasmedia.com/api/news
```
Should return JSON with news data

**Check 3: Check Browser Console**
1. Open your site: https://thenobiasmedia.com
2. Press F12 (Developer Tools)
3. Click **"Console"** tab
4. Look for errors (red text)
5. Look for "Failed to fetch" or "Network Error"

**Check 4: Check Network Tab**
1. In Developer Tools, click **"Network"** tab
2. Refresh the page
3. Look for request to `/api/news`
4. Check what URL it's calling - should be `https://api.thenobiasmedia.com/api/news`

---

## Quick Summary:

1. ✅ Go to Vercel → Settings → Environment Variables
2. ✅ Add: `REACT_APP_API_URL` = `https://api.thenobiasmedia.com/api`
3. ✅ Redeploy the site
4. ✅ Wait 2-5 minutes
5. ✅ Test: Open https://thenobiasmedia.com
6. ✅ News should appear!

---

## If Backend API Domain Doesn't Work:

You might need to configure `api.thenobiasmedia.com` DNS. Go back to GoDaddy and add:

```
Type: A
Name: api
Value: <Your EC2 IP Address>
```

OR if using Render/another service:

```
Type: CNAME
Name: api
Value: <Your backend service URL from Render>
```
