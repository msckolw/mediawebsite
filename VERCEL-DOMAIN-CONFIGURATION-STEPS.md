# Vercel Domain Configuration - Detailed Steps

## Step-by-Step Guide: Adding Both Domains in Vercel

---

## Part 1: Access Your Vercel Project

### Step 1: Log in to Vercel
1. Open your browser
2. Go to: **https://vercel.com**
3. Click **"Log in"** button (top right)
4. Log in with your account (GitHub, GitLab, Bitbucket, or Email)

### Step 2: Navigate to Your Project
1. After logging in, you'll see your **Dashboard**
2. Look for your project: **"mediawebsite"** or **"nobiasmedia"** or **"thenobiasmedia"**
3. Click on the project card to open it

---

## Part 2: Add Domains

### Step 3: Open Domain Settings
1. You're now on the **Project Overview** page
2. Look at the top navigation tabs:
   - Overview
   - Deployments
   - Analytics
   - **Settings** ← Click this
3. Click on **"Settings"** tab

### Step 4: Navigate to Domains Section
1. In the Settings sidebar (left side), you'll see multiple options:
   - General
   - **Domains** ← Click this
   - Environment Variables
   - Git
   - Functions
   - etc.
2. Click on **"Domains"**

### Step 5: Add First Domain (Root Domain)
1. You'll see a text input box with placeholder: **"Add Domain"** or **"yourdomain.com"**
2. Type in the box: `thenobiasmedia.com`
3. Click **"Add"** button (or press Enter)

#### What Happens Next:
Vercel will show a popup or page with:
- ✅ Domain added successfully
- DNS configuration instructions
- Status: "Invalid Configuration" (this is normal, will fix with DNS)

**Important:** Don't close this page yet! Copy the DNS records shown.

### Step 6: Add Second Domain (WWW Subdomain)
1. Look for the same **"Add Domain"** input box again
2. Type: `www.thenobiasmedia.com`
3. Click **"Add"** button

#### What Happens Next:
Same as above - Vercel will add the domain and show DNS configuration.

---

## Part 3: Set Primary Domain

### Step 7: Make Root Domain Primary
1. You should now see **TWO domains** listed:
   ```
   ✓ thenobiasmedia.com
   ✓ www.thenobiasmedia.com
   ```

2. Look for the domain: `thenobiasmedia.com`
3. On the right side of the domain, you'll see:
   - A **three-dot menu (⋮)** or **Options** button
   - Click on it

4. A dropdown menu will appear with options like:
   - **"Set as Primary Domain"** ← Click this
   - Edit
   - Remove
   - View DNS Records
   - etc.

5. Click **"Set as Primary Domain"**

6. A confirmation dialog appears:
   ```
   Set thenobiasmedia.com as Primary Domain?
   All other domains will redirect to this domain.
   ```

7. Click **"Set as Primary"** or **"Confirm"**

### Step 8: Verify Primary Domain is Set
After setting, you should see:
```
✓ thenobiasmedia.com (Primary) ← Should have a "Primary" badge
✓ www.thenobiasmedia.com → Redirects to thenobiasmedia.com
```

---

## Part 4: Get DNS Configuration Details

### Step 9: View DNS Records for Root Domain
1. Click on `thenobiasmedia.com` in your domains list
2. OR click the three-dot menu (⋮) → **"View DNS Records"**
3. You'll see something like:

```
┌─────────────────────────────────────────────────┐
│  DNS Configuration for thenobiasmedia.com       │
├─────────────────────────────────────────────────┤
│                                                  │
│  Add the following records to your DNS:         │
│                                                  │
│  Type: A                                        │
│  Name: @                                        │
│  Value: 76.76.19.19                             │
│                                                  │
│  OR (if A record not supported)                 │
│                                                  │
│  Type: CNAME                                    │
│  Name: @                                        │
│  Value: cname.vercel-dns.com                    │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Copy these values!** You'll need them in Part 5.

### Step 10: View DNS Records for WWW Domain
1. Click on `www.thenobiasmedia.com` in your domains list
2. OR click the three-dot menu (⋮) → **"View DNS Records"**
3. You'll see:

```
┌─────────────────────────────────────────────────┐
│  DNS Configuration for www.thenobiasmedia.com   │
├─────────────────────────────────────────────────┤
│                                                  │
│  Add the following records to your DNS:         │
│                                                  │
│  Type: CNAME                                    │
│  Name: www                                      │
│  Value: cname.vercel-dns.com                    │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Copy these values!**

---

## Part 5: Configure DNS (In Your Domain Registrar)

Now you need to add these DNS records where you bought your domain.

### Where Did You Buy thenobiasmedia.com?
Common registrars:
- **GoDaddy** (godaddy.com)
- **Namecheap** (namecheap.com)
- **Google Domains** (domains.google.com)
- **Cloudflare** (cloudflare.com)
- **Hostinger**
- **Others**

### Step 11: Log in to Your Domain Registrar

#### Example: If Using GoDaddy
1. Go to: **https://godaddy.com**
2. Log in to your account
3. Click on **"My Products"**
4. Find **"Domains"** section
5. Click **"DNS"** or **"Manage DNS"** next to `thenobiasmedia.com`

#### Example: If Using Namecheap
1. Go to: **https://namecheap.com**
2. Log in to your account
3. Click **"Domain List"** (left sidebar)
4. Click **"Manage"** button next to `thenobiasmedia.com`
5. Click **"Advanced DNS"** tab

#### Example: If Using Cloudflare
1. Go to: **https://dash.cloudflare.com**
2. Log in
3. Click on **"thenobiasmedia.com"** from your domains list
4. Click **"DNS"** → **"Records"**

### Step 12: Add A Record (Root Domain)

1. Look for button: **"Add Record"** or **"Add New Record"**
2. Click it
3. Fill in the form:

   ```
   Type: A Record (or just "A")
   Name: @ (or leave blank, or type "thenobiasmedia.com")
   Value/Points to: 76.76.19.19
   TTL: 3600 (or "Auto" or "Default")
   ```

4. Click **"Save"** or **"Add Record"**

**Note:** If your registrar doesn't support A records for root domain, use CNAME instead:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

### Step 13: Add CNAME Record (WWW Subdomain)

1. Click **"Add Record"** or **"Add New Record"** again
2. Fill in the form:

   ```
   Type: CNAME
   Name: www
   Value/Points to: cname.vercel-dns.com
   TTL: 3600 (or "Auto" or "Default")
   ```

3. Click **"Save"** or **"Add Record"**

### Step 14: Remove Conflicting Records (Important!)

**Before proceeding, check if there are OLD records for your domain:**

Look for existing records that might conflict:
- Old A records for `@` or root
- Old CNAME records for `www`
- Parking page records
- Old hosting records

**Delete these old records!** Keep only the new Vercel records you just added.

---

## Part 6: Wait for DNS Propagation

### Step 15: DNS Propagation Time
DNS changes take time to propagate worldwide:
- **Minimum:** 5-10 minutes
- **Average:** 30 minutes to 2 hours
- **Maximum:** 24-48 hours (rare)

### Step 16: Check DNS Propagation Status

#### Method 1: Using Online Tool
1. Go to: **https://dnschecker.org**
2. Enter: `thenobiasmedia.com`
3. Select: **"A"** record type
4. Click **"Search"**
5. You should see `76.76.19.19` appearing across different locations

Repeat for `www.thenobiasmedia.com` with **"CNAME"** type.

#### Method 2: Using Command Line (Terminal)
```bash
# Check root domain
dig thenobiasmedia.com

# Should show:
# thenobiasmedia.com. 3600 IN A 76.76.19.19

# Check www subdomain
dig www.thenobiasmedia.com

# Should show:
# www.thenobiasmedia.com. 3600 IN CNAME cname.vercel-dns.com.
```

---

## Part 7: Verify in Vercel

### Step 17: Check Domain Status in Vercel
1. Go back to Vercel → Your Project → Settings → Domains
2. Refresh the page
3. Domain status should change from:
   - ❌ "Invalid Configuration" 
   - TO → ✅ "Valid Configuration"

This might take a few minutes after DNS propagates.

### Step 18: SSL Certificate
Vercel automatically provisions SSL certificates:
- This happens automatically after domains are validated
- Takes 5-10 minutes
- You'll see a green lock icon 🔒 when visiting your site

---

## Part 8: Test Your Website

### Step 19: Test in Browser

#### Test 1: Root Domain
1. Open browser (preferably **Incognito/Private mode** to avoid cache)
2. Type in address bar: `thenobiasmedia.com`
3. Press Enter
4. **Expected:** Your website loads ✅

#### Test 2: Root Domain with HTTPS
1. Type: `https://thenobiasmedia.com`
2. **Expected:** Your website loads with green lock 🔒 ✅

#### Test 3: WWW Subdomain
1. Type: `www.thenobiasmedia.com`
2. **Expected:** Redirects to `https://thenobiasmedia.com` ✅

#### Test 4: WWW with HTTP
1. Type: `http://www.thenobiasmedia.com`
2. **Expected:** Redirects to `https://thenobiasmedia.com` ✅

### Step 20: Test with cURL (Optional)
```bash
# Test root domain
curl -I https://thenobiasmedia.com

# Expected: HTTP/2 200 OK

# Test www redirect
curl -I https://www.thenobiasmedia.com

# Expected: HTTP/2 308 (redirect to non-www)
```

---

## Part 9: Troubleshooting

### Issue 1: "Invalid Configuration" Still Showing
**Solution:**
- Wait 5-30 more minutes
- Verify DNS records are correct
- Click **"Refresh"** button in Vercel

### Issue 2: "DNS_PROBE_FINISHED_NXDOMAIN"
**Solution:**
- DNS records not added correctly
- Check your registrar's DNS management page
- Verify the records match exactly what Vercel provided

### Issue 3: Certificate Error / Not Secure Warning
**Solution:**
- Wait 10 more minutes for SSL provisioning
- Make sure domains show "Valid Configuration" in Vercel
- Try clearing browser cache and refreshing

### Issue 4: Domain Shows Vercel Placeholder Page
**Solution:**
- Your project deployment might have failed
- Go to Vercel → Deployments → Check latest deployment status
- Click on deployment → View logs

### Issue 5: Works with WWW but Not Without
**Solution:**
- A record for root domain (@) not added
- Go back to DNS settings and add the A record

### Issue 6: Works Without WWW but Not With WWW
**Solution:**
- CNAME record for www not added
- Go back to DNS settings and add the CNAME record

---

## Visual Summary

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  YOU TYPE:                    WHAT HAPPENS:            │
│                                                         │
│  thenobiasmedia.com          → Loads your site ✅      │
│  www.thenobiasmedia.com      → Redirects to root ✅    │
│  https://thenobiasmedia.com  → Loads securely 🔒 ✅    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Checklist

### In Vercel Dashboard:
- [ ] Added `thenobiasmedia.com`
- [ ] Added `www.thenobiasmedia.com`
- [ ] Set `thenobiasmedia.com` as Primary Domain
- [ ] Copied DNS configuration details

### In Domain Registrar:
- [ ] Added A record: @ → 76.76.19.19
- [ ] Added CNAME record: www → cname.vercel-dns.com
- [ ] Removed old/conflicting DNS records
- [ ] Saved changes

### Verification:
- [ ] Waited 30+ minutes for DNS propagation
- [ ] Checked DNS propagation on dnschecker.org
- [ ] Domain shows "Valid Configuration" in Vercel
- [ ] SSL certificate is active (green lock 🔒)
- [ ] Tested `thenobiasmedia.com` - works!
- [ ] Tested `www.thenobiasmedia.com` - redirects!

---

## Need More Help?

### Vercel Documentation:
- https://vercel.com/docs/concepts/projects/domains/add-a-domain

### Contact Support:
- Vercel Support: https://vercel.com/support
- Check deployment logs: Vercel Dashboard → Deployments → View Logs

### Video Tutorials:
Search YouTube for: "How to add custom domain to Vercel"

---

**Remember:** DNS changes can take time. If it doesn't work immediately, wait 30 minutes and try again. Don't panic! 😊
