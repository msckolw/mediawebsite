> Historical document. Superseded by the [three active guides](../01-PROJECT-AND-DEPLOYMENT.md).
> Hosting, completion claims and API examples below may be outdated.

# API Guide for Anurag (Mobile Developer)

## ✅ Backend Configuration Status
The backend is **already configured correctly** on Google Cloud Run with:
- Merchant Key: `0BPUp0`
- Merchant Salt: `[REDACTED — rotate the merchant salt]`
- Mode: `live` (production)

---

## Google Sign In Request Format

### Endpoint
```
POST https://thenbm-329287861933.asia-south1.run.app/api/auth/googleSignIn
```

### Request Body (Use any format)
```json
{"accessToken": "ya29.a0AfB_byD_..."}
```
OR
```json
{"access_token": "ya29.a0AfB_byD_..."}
```
OR
```json
{"token": "ya29.a0AfB_byD_..."}
```

**Important:** Use Google OAuth 2.0 **access token** (not ID token)

---

## PayU Hash Request Format

### Endpoint
```
POST https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/hash
```

### For SDK Configuration (✅ Working)
```json
{
  "hashName": "get_sdk_configuration",
  "hashString": "0BPUp0|get_sdk_configuration|default|"
}
```

### For Offer Details (❌ Was Failing)
```json
{
  "hashName": "get_all_offer_details",
  "hashString": "0BPUp0|get_all_offer_details|default|"
}
```

### For Quick Pay Event (✅ Fixed)
```json
{
  "hashName": "quickPayEvent",
  "hashString": "0BPUp0|quickPayEvent|default|"
}
```

### For Eligible Bins for EMI (✅ New)
```json
{
  "hashName": "eligibleBinsForEMI",
  "hashString": "0BPUp0|eligibleBinsForEMI|default|"
}
```

### For Payment Source (✅ New)
```json
{
  "hashName": "payment_source",
  "hashString": "0BPUp0|payment_source|default|"
}
```

### For Payment Hash
```json
{
  "hashName": "payment_hash",
  "hashString": "0BPUp0|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|||||"
}
```

---

## Critical Format Rules

All PayU hash requests (except payment_hash) follow this pattern:

```
0BPUp0|command_name|var1|
```

**Rules:**
1. Must have exactly 4 fields separated by `|`
2. Must end with `|` (empty 4th field)
3. First field = `0BPUp0` (merchant key - exact match)
4. Second field = command name (matches hashName)
5. Third field = variable (cannot be empty - use "default")
6. Fourth field = empty (just the `|`)

---

## React Native Code Examples

### Google Sign In
```javascript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import axios from 'axios';

const tokens = await GoogleSignin.getTokens();
const response = await axios.post(
  'https://thenbm-329287861933.asia-south1.run.app/api/auth/googleSignIn',
  { accessToken: tokens.accessToken }
);
```

### PayU Hash Generation
```javascript
const response = await axios.post(
  'https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/hash',
  {
    hashName: 'get_all_offer_details',
    hashString: '0BPUp0|get_all_offer_details|default|'
  }
);
const hash = response.data.get_all_offer_details;
```

---

## Testing with cURL

```bash
# Test get_all_offer_details
curl -X POST https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/hash \
  -H "Content-Type: application/json" \
  -d '{"hashName": "get_all_offer_details", "hashString": "0BPUp0|get_all_offer_details|default|"}'

# Test quickPayEvent
curl -X POST https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/hash \
  -H "Content-Type: application/json" \
  -d '{"hashName": "quickPayEvent", "hashString": "0BPUp0|quickPayEvent|default|"}'
```

---

## Common Errors

### "Unsupported or invalid PayU hash name"
**Solution:** Use exact format `0BPUp0|command_name|default|` with 4 fields

### "Missing or invalid Google access token"
**Solution:** Send access token as `accessToken`, `access_token`, or `token`

---

Share this document with Anurag for the exact request formats!
