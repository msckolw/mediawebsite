> Historical document. Superseded by the [three active guides](../01-PROJECT-AND-DEPLOYMENT.md).
> Hosting, completion claims and API examples below may be outdated.

# CRITICAL: PayU Configuration Issue

## Problem
The PayU hash endpoints (`get_all_offer_details` and `quickPayEvent`) are failing because the backend is validating the merchant key, but the environment variable has a placeholder value.

## Current Status
- ✅ `get_sdk_configuration` - Working
- ❌ `get_all_offer_details` - Failing  
- ❌ `quickPayEvent` - Failing
- ❌ Google Sign In - Failing

## Root Cause
The backend `.env` file has:
```
PAYU_MERCHANT_KEY=your_payu_merchant_key_here
PAYU_MERCHANT_SALT=your_payu_merchant_salt_here
```

These are placeholder values. The hash endpoint validates that the merchant key in the request matches the one in the environment.

## Why get_sdk_configuration Works
It might be working because your developer is sending the correct merchant key that happens to pass validation, OR the validation logic differs.

## Solution

### Step 1: Get Real PayU Credentials
You need the actual PayU credentials from your PayU merchant account:
1. Login to PayU merchant dashboard
2. Go to Settings → API Keys
3. Copy:
   - Merchant Key (e.g., `gtKFFx` or similar)
   - Merchant Salt (e.g., `eCwWELxi` or similar)

### Step 2: Update Production Environment Variables
Update these in Google Cloud Run:

```bash
PAYU_MERCHANT_KEY=<your_actual_merchant_key>
PAYU_MERCHANT_SALT=<your_actual_merchant_salt>
PAYU_MODE=test  # or 'live' for production
```

### Step 3: Tell Your Developer
Once updated, tell your developer to use the **exact same merchant key** in their hash requests.

Example:
```json
{
  "hashName": "get_all_offer_details",
  "hashString": "gtKFFx|get_all_offer_details|default|"
}
```

The first field (`gtKFFx`) MUST match the `PAYU_MERCHANT_KEY` environment variable.

## How to Update Google Cloud Run Environment Variables

### Option 1: Using Google Cloud Console
1. Go to Google Cloud Console
2. Navigate to Cloud Run → Services
3. Select your backend service
4. Click "EDIT & DEPLOY NEW REVISION"
5. Go to "Variables & Secrets" tab
6. Update `PAYU_MERCHANT_KEY` and `PAYU_MERCHANT_SALT`
7. Deploy

### Option 2: Using gcloud CLI
```bash
gcloud run services update thenbm \
  --region=asia-south1 \
  --update-env-vars PAYU_MERCHANT_KEY=your_key_here,PAYU_MERCHANT_SALT=your_salt_here
```

## Google Sign In Issue

The Google Sign In is also failing. Your developer needs to send the request in this format:

### Correct Request Format
```http
POST https://thenbm-329287861933.asia-south1.run.app/api/auth/googleSignIn
Content-Type: application/json

{
  "accessToken": "ya29.a0AfB_byD..."
}
```

OR

```json
{
  "access_token": "ya29.a0AfB_byD..."
}
```

OR

```json
{
  "token": "ya29.a0AfB_byD..."
}
```

The backend accepts all three field names. Make sure:
1. The token is a valid Google OAuth 2.0 access token
2. Content-Type header is set to `application/json`
3. The request body is valid JSON
4. The token is from Google's OAuth flow (not ID token)

## Testing After Fix

### Test Hash Endpoint
```bash
curl -X POST https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/hash \
  -H "Content-Type: application/json" \
  -d '{
    "hashName": "get_all_offer_details",
    "hashString": "YOUR_MERCHANT_KEY|get_all_offer_details|default|"
  }'
```

### Test Google Sign In
```bash
curl -X POST https://thenbm-329287861933.asia-south1.run.app/api/auth/googleSignIn \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "VALID_GOOGLE_ACCESS_TOKEN"
  }'
```

## Quick Checklist
- [ ] Get real PayU merchant key and salt from PayU dashboard
- [ ] Update environment variables in Google Cloud Run
- [ ] Verify merchant key regex matches: `^[A-Za-z0-9_-]{1,128}$`
- [ ] Tell developer to use the same merchant key in requests
- [ ] Test all hash types after update
- [ ] Verify Google Sign In request format with developer
