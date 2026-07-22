# Domain Setup Guide for thenobiasmedia.com

## Problem
When users type `thenobiasmedia.com` (without www) in the browser, the website doesn't open.

## Solution Steps

### 1. Configure Vercel Dashboard

1. **Log in to Vercel**
   - Go to https://vercel.com
   - Navigate to your project (NoBias Media / mediawebsite)

2. **Add Both Domains**
   - Click on **Settings** → **Domains**
   - Add the following domains:
     - `thenobiasmedia.com` (root domain) ← **Set this as PRIMARY**
     - `www.thenobiasmedia.com` (www variant)

3. **Vercel will provide you with DNS records to add**

---

### 2. Configure DNS Records (In Your Domain Registrar)

Log in to where you registered your domain (GoDaddy, Namecheap, Cloudflare, etc.) and add these DNS records:

#### For Root Domain (thenobiasmedia.com):
```
Type: A
Name: @ (or leave blank for root domain)
Value: 76.76.19.19
TTL: 3600 (or Auto)
```

**Alternative Option (if A record doesn't work):**
```
Type: CNAME
Name: @ (or leave blank)
Value: cname.vercel-dns.com
TTL: 3600
```

#### For WWW Subdomain:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

---

### 3. Set Primary Domain in Vercel

1. In Vercel Dashboard → Domains
2. Click the three dots (...) next to `thenobiasmedia.com`
3. Select **"Set as Primary Domain"**
4. Enable **"Redirect other domains to primary"**

This ensures:
- `thenobiasmedia.com` → Works ✅
- `www.thenobiasmedia.com` → Redirects to → `thenobiasmedia.com` ✅

---

### 4. Deploy Updated Configuration

The `vercel.json` file has been updated to include redirect rules. Deploy this change:

```bash
git add vercel.json
git commit -m "Add domain redirect configuration"
git push origin main
```

Vercel will automatically redeploy your site.

---

### 5. Verify Configuration

After DNS propagation (can take 5 minutes to 48 hours), test:

1. **Check DNS propagation:**
   - Visit: https://dnschecker.org
   - Enter: `thenobiasmedia.com`
   - Verify A record points to Vercel's IP

2. **Test URLs:**
   ```bash
   # Test root domain
   curl -I https://thenobiasmedia.com
   
   # Test www subdomain
   curl -I https://www.thenobiasmedia.com
   ```

3. **Browser tests:**
   - Open browser in incognito mode
   - Type: `thenobiasmedia.com` → Should work ✅
   - Type: `www.thenobiasmedia.com` → Should redirect to non-www ✅

---

## Common Issues & Solutions

### Issue 1: "DNS_PROBE_FINISHED_NXDOMAIN"
**Solution:** DNS records not configured correctly. Double-check:
- A record for root domain (@)
- CNAME record for www subdomain

### Issue 2: Site works with www but not without
**Solution:** Make sure A record for root domain is added in DNS settings

### Issue 3: Changes not reflecting
**Solution:** 
- Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Wait for DNS propagation (up to 48 hours, usually 5-30 minutes)
- Use https://dnschecker.org to check propagation status

### Issue 4: Certificate errors
**Solution:** Vercel automatically provisions SSL certificates. Wait 5-10 minutes after adding domain.

---

## Quick Reference: Vercel DNS Configuration

If Vercel provides different IP addresses in your dashboard, use those instead. Common Vercel IPs:
- `76.76.19.19`
- `76.76.21.21`

Always check your Vercel Dashboard → Domains section for the exact DNS records to use.

---

## Backend API Domain

Your backend is on: `api.thenobiasmedia.com`

Make sure this CNAME record exists:
```
Type: CNAME
Name: api
Value: <your-backend-service-url> (from Render or EC2)
```

---

## Testing Checklist

- [ ] Added both domains in Vercel Dashboard
- [ ] Set `thenobiasmedia.com` as primary domain
- [ ] Configured A record for root domain
- [ ] Configured CNAME for www subdomain
- [ ] Deployed updated vercel.json
- [ ] Tested https://thenobiasmedia.com
- [ ] Tested https://www.thenobiasmedia.com
- [ ] Verified SSL certificate is active
- [ ] Cleared browser cache and tested

---

## Need Help?

If issues persist after 48 hours:
1. Check Vercel deployment logs
2. Verify DNS records using `dig thenobiasmedia.com` or `nslookup thenobiasmedia.com`
3. Contact Vercel support with your domain configuration
