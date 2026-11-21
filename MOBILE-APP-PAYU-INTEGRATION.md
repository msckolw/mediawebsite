# Mobile App - PayU Integration Guide

## Problem: binBaseDetails Hash Generation Failing

The backend is rejecting `binBaseDetails` hash requests because the mobile app is sending the wrong format.

## Required Format

All auxiliary PayU commands (including `binBaseDetails`) must follow this **exact format**:

```
merchantKey|hashName|var1|
```

### Format Breakdown:
- **Field 0**: Your PayU merchant key (`0BPUp0`)
- **Field 1**: The command name (e.g., `binBaseDetails`)
- **Field 2**: The variable (e.g., BIN number for `binBaseDetails`)
- **Field 3**: **MUST BE EMPTY** (but the trailing pipe `|` is required)

### ✅ Correct Examples:

```json
{
  "hashName": "binBaseDetails",
  "hashString": "0BPUp0|binBaseDetails|123456|"
}
```

```json
{
  "hashName": "get_all_offer_details",
  "hashString": "0BPUp0|get_all_offer_details|default|"
}
```

### ❌ Wrong Examples:

```json
// Missing merchant key
{
  "hashName": "binBaseDetails",
  "hashString": "binBaseDetails|123456|"
}

// Missing var1 (field 2 is empty)
{
  "hashName": "binBaseDetails",
  "hashString": "0BPUp0|binBaseDetails||"
}

// Not ending with pipe
{
  "hashName": "binBaseDetails",
  "hashString": "0BPUp0|binBaseDetails|123456"
}

// Extra field after the trailing pipe
{
  "hashName": "binBaseDetails",
  "hashString": "0BPUp0|binBaseDetails|123456|extra"
}
```

## Mobile App Code Fix

### Android (Kotlin/Java)

```kotlin
// Correct implementation
fun generateBinBaseDetailsHash(binNumber: String): JSONObject {
    val merchantKey = "0BPUp0"
    val hashName = "binBaseDetails"
    
    // IMPORTANT: Format must be exactly merchantKey|hashName|var1|
    val hashString = "$merchantKey|$hashName|$binNumber|"
    
    val requestBody = JSONObject().apply {
        put("hashName", hashName)
        put("hashString", hashString)
    }
    
    return requestBody
}

// Usage
val binNumber = "123456" // First 6 digits of card
val requestBody = generateBinBaseDetailsHash(binNumber)

// Send to your backend
val url = "https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/hash"
// ... make POST request with requestBody
```

### iOS (Swift)

```swift
// Correct implementation
func generateBinBaseDetailsHash(binNumber: String) -> [String: Any] {
    let merchantKey = "0BPUp0"
    let hashName = "binBaseDetails"
    
    // IMPORTANT: Format must be exactly merchantKey|hashName|var1|
    let hashString = "\(merchantKey)|\(hashName)|\(binNumber)|"
    
    let requestBody: [String: Any] = [
        "hashName": hashName,
        "hashString": hashString
    ]
    
    return requestBody
}

// Usage
let binNumber = "123456" // First 6 digits of card
let requestBody = generateBinBaseDetailsHash(binNumber: binNumber)

// Send to your backend
let url = URL(string: "https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/hash")!
// ... make POST request with requestBody
```

### React Native

```javascript
// Correct implementation
const generateBinBaseDetailsHash = (binNumber) => {
  const merchantKey = '0BPUp0';
  const hashName = 'binBaseDetails';
  
  // IMPORTANT: Format must be exactly merchantKey|hashName|var1|
  const hashString = `${merchantKey}|${hashName}|${binNumber}|`;
  
  return {
    hashName,
    hashString
  };
};

// Usage
const binNumber = '123456'; // First 6 digits of card
const requestBody = generateBinBaseDetailsHash(binNumber);

// Send to your backend
fetch('https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/hash', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestBody)
})
.then(response => response.json())
.then(data => {
  console.log('Hash received:', data);
  // data.binBaseDetails will contain the hash
})
.catch(error => {
  console.error('Error:', error);
});
```

## All Supported Auxiliary Commands

These commands all use the same format: `merchantKey|hashName|var1|`

```javascript
const supportedCommands = [
  'getBinInfo',
  'validateVPA',
  'get_checkout_details',
  'get_eligible_payment_options',
  'get_sdk_configuration',
  'get_all_offer_details',
  'quickPayEvent',
  'eligibleBinsForEMI',
  'payment_related_details_for_mobile_sdk',
  'vas_for_mobile_sdk',
  'binBaseDetails',          // ← Your failing command
  'check_isDomestic',
  'check_offer_details',
  'getEmiAmountAccordingToInterest'
];
```

### Common var1 Values:

- `binBaseDetails` → BIN number (first 6 digits of card)
- `get_all_offer_details` → `"default"`
- `get_sdk_configuration` → `"default"`
- `validateVPA` → UPI VPA address
- `getBinInfo` → BIN number

## Testing & Debugging

### 1. Test with curl:

```bash
curl -X POST https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/hash \
  -H "Content-Type: application/json" \
  -d '{
    "hashName": "binBaseDetails",
    "hashString": "0BPUp0|binBaseDetails|123456|"
  }'
```

**Expected Response:**
```json
{
  "binBaseDetails": "abc123...def456"
}
```

### 2. Check Backend Logs:

After deploying the updated backend, failed requests will show detailed error messages:

```json
{
  "message": "Invalid hash format: var1 is empty.",
  "detail": "Field[2] (var1) must contain a non-empty value. For binBaseDetails, this should be the BIN number.",
  "expectedFormat": "merchantKey|binBaseDetails|<BIN_NUMBER>|"
}
```

### 3. Enable Debug Logs in Mobile App:

```javascript
console.log('Sending hash request:', {
  hashName: 'binBaseDetails',
  hashString: hashString,
  fields: hashString.split('|')
});
```

## Common Mistakes to Avoid

❌ **Don't use different field orders**
```javascript
// WRONG - fields in wrong order
const hashString = `${hashName}|${merchantKey}|${binNumber}|`;
```

❌ **Don't forget the trailing pipe**
```javascript
// WRONG - missing trailing pipe
const hashString = `${merchantKey}|${hashName}|${binNumber}`;
```

❌ **Don't leave var1 empty**
```javascript
// WRONG - var1 is empty
const hashString = `${merchantKey}|${hashName}||`;
```

❌ **Don't add extra fields**
```javascript
// WRONG - extra field after trailing pipe
const hashString = `${merchantKey}|${hashName}|${binNumber}|extra`;
```

## Next Steps

1. **Update mobile app code** using examples above
2. **Deploy updated backend** (enhanced error logging is now available)
3. **Test with a real BIN number** (e.g., `123456`)
4. **Check backend logs** if it still fails - you'll now see detailed error messages
5. **Verify the hash is returned** and use it in PayU SDK

## Questions?

If you still face issues after implementing this:
1. Share the exact request body your mobile app is sending
2. Check the Cloud Run logs for the detailed error message
3. Verify the BIN number is not empty/null in your mobile app

## API Endpoint

**POST** `https://thenbm-329287861933.asia-south1.run.app/api/payments/payu/hash`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "hashName": "binBaseDetails",
  "hashString": "0BPUp0|binBaseDetails|<BIN_NUMBER>|"
}
```

**Response:**
```json
{
  "binBaseDetails": "a1b2c3d4e5f6..."
}
```
