# Mobile App API Request Formats

## Base URL
```
Production: https://thenbm-329287861933.asia-south1.run.app/api
```

---

## 1. Google Sign In API

### Endpoint
```
POST /auth/googleSignIn
```

### Request Headers
```
Content-Type: application/json
```

### Request Body Format
The backend accepts the Google access token in **any of these field names**:
- `access_token` (web format)
- `accessToken` (mobile format - recommended)
- `token` (alternative format)

### Example Request
```json
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

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "token": "Active",
  "user": {
    "email": "user@example.com",
    "role": "user",
    "name": "User Name"
  }
}
```

### Error Responses

#### 401 - Missing Token
```json
{
  "message": "Missing or invalid Google access token."
}
```

#### 401 - Invalid Token
```json
{
  "message": "Invalid Google access token."
}
```

#### 401 - Email Not Verified
```json
{
  "message": "Google account email is not verified."
}
```

#### 500 - Server Error
```json
{
  "message": "Could not complete Google sign-in."
}
```

### Important Notes
1. The access token should be obtained from Google OAuth 2.0 flow
2. Maximum token length: 4096 characters
3. The backend verifies the token with Google's API
4. Email must be verified in the Google account
5. A cookie (`access_token`) will be set for web sessions

---

## 2. PayU Hash Generation API

### Endpoint
```
POST /payments/payu/hash
```

### Request Headers
```
Content-Type: application/json
```

### Rate Limiting
- 60 requests per minute per IP address
- Response: 429 Too Many Requests if exceeded

---

### Hash Type 1: `payment_hash` (For Payment Transactions)

#### Request Body
```json
{
  "hashName": "payment_hash",
  "hashString": "MERCHANT_KEY|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|||||",
  "postSalt": "optional_post_salt_string"
}
```

#### Field Format Requirements
- Format: `key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|||||`
- Must end with `|` (trailing delimiter)
- 17 fields total (16 + trailing empty)
- Fields 11-15 must be empty (represented by `|||||`)
- Amount format: `0` or `[1-9]d{0,8}` with optional `.dd` decimals
- `postSalt` is optional

#### Example Request
```json
{
  "hashName": "payment_hash",
  "hashString": "gtKFFx|test_txn_123|100.00|donation|John Doe|john@example.com||||||||||",
  "postSalt": ""
}
```

#### Success Response (200 OK)
```json
{
  "payment_hash": "a1b2c3d4e5f6...sha512_hash_string"
}
```

---

### Hash Type 2: `get_sdk_configuration` ✅ WORKING

#### Request Body
```json
{
  "hashName": "get_sdk_configuration",
  "hashString": "MERCHANT_KEY|get_sdk_configuration|default|"
}
```

#### Format Requirements
- Format: `MERCHANT_KEY|get_sdk_configuration|VAR1|`
- 4 fields: [merchant_key, command_name, var1, empty]
- Must end with `|`
- VAR1 can be any non-empty string (e.g., "default")

#### Example Request
```json
{
  "hashName": "get_sdk_configuration",
  "hashString": "gtKFFx|get_sdk_configuration|default|"
}
```

#### Success Response (200 OK)
```json
{
  "get_sdk_configuration": "a1b2c3d4e5f6...sha512_hash_string"
}
```

---

### Hash Type 3: `get_all_offer_details` ❌ FAILING

#### Request Body
```json
{
  "hashName": "get_all_offer_details",
  "hashString": "MERCHANT_KEY|get_all_offer_details|VAR1|"
}
```

#### Format Requirements
- Format: `MERCHANT_KEY|get_all_offer_details|VAR1|`
- 4 fields: [merchant_key, command_name, var1, empty]
- Must end with `|`
- VAR1 can be any non-empty string

#### Example Request
```json
{
  "hashName": "get_all_offer_details",
  "hashString": "gtKFFx|get_all_offer_details|default|"
}
```

---

### Hash Type 4: `quickPayEvent` ❌ FAILING

#### Request Body
```json
{
  "hashName": "quickPayEvent",
  "hashString": "MERCHANT_KEY|quickPayEvent|VAR1|"
}
```

#### Format Requirements
- Format: `MERCHANT_KEY|quickPayEvent|VAR1|`
- 4 fields: [merchant_key, command_name, var1, empty]
- Must end with `|`
- VAR1 can be any non-empty string

#### Example Request
```json
{
  "hashName": "quickPayEvent",
  "hashString": "gtKFFx|quickPayEvent|default|"
}
```

---

### Hash Type 5: `getBinInfo`

#### Request Body
```json
{
  "hashName": "getBinInfo",
  "hashString": "MERCHANT_KEY|getBinInfo|BIN_NUMBER|"
}
```

#### Example Request
```json
{
  "hashName": "getBinInfo",
  "hashString": "gtKFFx|getBinInfo|424242|"
}
```

---

### Hash Type 6: `validateVPA`

#### Request Body
```json
{
  "hashName": "validateVPA",
  "hashString": "MERCHANT_KEY|validateVPA|UPI_ID|"
}
```

#### Example Request
```json
{
  "hashName": "validateVPA",
  "hashString": "gtKFFx|validateVPA|user@paytm|"
}
```

---

### Hash Type 7: `get_checkout_details`

#### Request Body
```json
{
  "hashName": "get_checkout_details",
  "hashString": "MERCHANT_KEY|get_checkout_details|VAR1|"
}
```

#### Example Request
```json
{
  "hashName": "get_checkout_details",
  "hashString": "gtKFFx|get_checkout_details|default|"
}
```

---

### Hash Type 8: `get_eligible_payment_options`

#### Request Body
```json
{
  "hashName": "get_eligible_payment_options",
  "hashString": "MERCHANT_KEY|get_eligible_payment_options|VAR1|"
}
```

#### Example Request
```json
{
  "hashName": "get_eligible_payment_options",
  "hashString": "gtKFFx|get_eligible_payment_options|default|"
}
```

---

## Common Error Responses

### 400 - Invalid Request
```json
{
  "message": "Expected hashName and hashString."
}
```

```json
{
  "message": "Invalid hashName or hashString."
}
```

```json
{
  "message": "Unsupported or invalid PayU hash name: <hashName>."
}
```

### 429 - Rate Limited
```json
{
  "message": "Too many hash requests. Try again shortly."
}
```

### 503 - Service Unavailable
```json
{
  "message": "PayU mobile hash generation is not configured."
}
```

---

## IMPORTANT NOTES FOR DEVELOPERS

### For Google Sign In:
1. **Use `accessToken` field name** - this is the recommended format for mobile apps
2. Get the Google access token from your OAuth 2.0 flow
3. Send it directly in the request body
4. The backend validates it with Google's API
5. No additional headers or authentication needed for this endpoint

### For PayU Hash:
1. **Replace `MERCHANT_KEY` with actual merchant key** - do NOT send literal string "MERCHANT_KEY"
2. **The backend adds the SALT automatically** - never send salt in the request
3. All auxiliary commands (except payment_hash) follow the same pattern:
   - 4 pipe-separated fields
   - Format: `MERCHANT_KEY|command_name|var1|`
   - Must end with `|` (empty 4th field)
4. VAR1 can be transaction ID, "default", or any identifier depending on PayU SDK requirements

### Troubleshooting:
If you get "Unsupported or invalid PayU hash name" error:
- Check that merchant key is correct (not placeholder)
- Ensure exactly 4 fields separated by `|`
- Field 2 must exactly match the hashName
- Must end with `|`
- Field 3 (VAR1) must not be empty

---

## Testing Checklist

### Google Sign In
- [ ] Get Google access token from OAuth flow
- [ ] Send POST request with `accessToken` in body
- [ ] Verify 200 OK response with user data
- [ ] Check that cookie is set (for web compatibility)

### PayU Hash - payment_hash
- [ ] Use correct merchant key
- [ ] Format: 17 fields ending with `|`
- [ ] Fields 11-15 are empty
- [ ] Amount in correct format
- [ ] Verify SHA512 hash returned

### PayU Hash - SDK Commands
- [ ] Use correct merchant key
- [ ] Format: 4 fields ending with `|`
- [ ] Command name matches hashName exactly
- [ ] VAR1 is not empty
- [ ] Verify SHA512 hash returned
