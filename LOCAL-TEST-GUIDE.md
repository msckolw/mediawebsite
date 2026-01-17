# Local Testing Guide

## ✅ Servers Running

### Backend
- **URL:** http://localhost:5002
- **Status:** ✅ Running
- **Database:** Connected to MongoDB Atlas

### Frontend
- **URL:** http://localhost:3000
- **Status:** ✅ Running (production build)
- **Build:** Fresh build with fixes applied

---

## 🧪 How to Test the White Screen Fix

### 1. Open the Site
Open your browser and go to:
```
http://localhost:3000
```

### 2. Test Navigation
1. **Home page should load** ✅
2. **Click on any article card** or "Read more" button
3. **Article detail page should load immediately** (no white screen!)
4. **Refresh the article page** → Should still work
5. **Navigate back to home** → Should work
6. **Click another article** → Should work

### 3. Check Browser Console
Open DevTools (F12) and check:
- ✅ No "Loading chunk failed" errors
- ✅ No "Failed to fetch" errors for chunks
- ✅ Service worker registers successfully
- ✅ No chrome-extension cache errors

### 4. Test Different Scenarios

#### Test 1: Fresh Load
1. Clear browser cache (Ctrl+Shift+Delete)
2. Reload page
3. Click article → Should work

#### Test 2: Service Worker
1. Open DevTools → Application tab → Service Workers
2. Check "nobias-media-cache-v3" is registered
3. Navigate between pages → Should be smooth

#### Test 3: Network Tab
1. Open DevTools → Network tab
2. Click article
3. Check all chunk files load successfully (200 status)
4. No 404 errors

---

## 🔍 What to Look For

### ✅ Success Indicators
- Article pages load immediately on first click
- No white screen at any point
- Smooth navigation between pages
- All chunk files load (check Network tab)
- Service worker registers without errors
- Console is clean (no red errors)

### ❌ Failure Indicators
- White screen when clicking articles
- "Loading chunk XXX failed" errors
- 404 errors for .chunk.js files
- Service worker errors
- Page only works after refresh

---

## 📊 Compare with Production

### Production (Current - Broken)
1. Go to https://www.thenobiasmedia.com
2. Click article → White screen ❌
3. Refresh → Works ✅
4. Console shows chunk 404 errors ❌

### Localhost (Fixed)
1. Go to http://localhost:3000
2. Click article → Loads immediately ✅
3. No refresh needed ✅
4. Console is clean ✅

---

## 🛠️ If You Find Issues

### Issue: Still seeing white screen
**Check:**
1. Build completed successfully?
   ```bash
   ls -la frontend/build/static/js/*.chunk.js
   ```
2. Service worker updated?
   - DevTools → Application → Service Workers
   - Should show "nobias-media-cache-v3"

**Fix:**
```bash
# Rebuild
cd frontend
rm -rf build
npm run build

# Restart serve
# Stop the serve process and restart
npx serve -s build -p 3000
```

### Issue: API errors
**Check backend is running:**
```bash
curl http://localhost:5002/api/news?page=1
```

**Should return JSON with articles**

### Issue: CORS errors
**Check backend CORS config:**
Backend should allow localhost:3000 (already configured in backend/src/server.js)

---

## 🎯 Testing Checklist

- [ ] Home page loads
- [ ] Click article card → Detail page loads (no white screen)
- [ ] Refresh article page → Still works
- [ ] Navigate back to home → Works
- [ ] Click different article → Works
- [ ] No console errors
- [ ] Service worker registered (v3)
- [ ] All chunk files load (Network tab)
- [ ] Navigation is smooth
- [ ] No 404 errors

---

## 📝 Test Results

### What Works:
- 

### What Doesn't Work:
- 

### Console Errors:
- 

### Notes:
- 

---

## ✅ If Everything Works

Great! The fix is working locally. You can now deploy to production:

```bash
git add .
git commit -m "fix: resolve chunk loading and caching issues"
git push origin main
```

After deployment:
1. Wait 2-3 minutes for Vercel to deploy
2. Test on https://www.thenobiasmedia.com
3. Users may need hard refresh (Ctrl+Shift+R)

---

## 🛑 Stop Servers

When done testing:

### Stop Frontend Server
```bash
# Press Ctrl+C in the terminal running serve
# Or kill the process
```

### Stop Backend Server
```bash
# Press Ctrl+C in the terminal running backend
# Or kill the process
```

---

## 🔗 Quick Links

- **Local Frontend:** http://localhost:3000
- **Local Backend:** http://localhost:5002
- **Production:** https://www.thenobiasmedia.com
- **API:** https://api.thenobiasmedia.com

---

**Happy Testing! 🚀**
