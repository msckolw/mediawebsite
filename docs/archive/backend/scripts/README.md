> Historical document. Superseded by the [three active guides](../../../01-PROJECT-AND-DEPLOYMENT.md).
> Hosting, completion claims and API examples below may be outdated.

# Database Migration Scripts

## Update Source Types: Conservative → Traditionalist

This script updates all news articles in the database to replace "Conservative" terminology with "Traditionalist".

### What it does:
- Changes `"Right / Conservative"` → `"Right / Traditionalist"`
- Changes `"Conservative"` → `"Traditionalist"`
- Updates all articles in the MongoDB database
- Provides detailed logging and verification

### How to run:

#### Option 1: Run Locally
```bash
cd backend
node scripts/update-source-types.js
```

#### Option 2: Run on EC2
```bash
# SSH to EC2
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com

# Navigate to backend
cd ~/mediawebsite/backend

# Run the migration
node scripts/update-source-types.js
```

### Prerequisites:
- `.env` file must be configured with `MONGODB_URI`
- Node.js and npm packages must be installed

### Safety:
- ✅ Safe to run multiple times (idempotent)
- ✅ Only updates matching records
- ✅ Provides verification after completion
- ✅ Shows detailed logging of all changes

### Expected Output:
```
═══════════════════════════════════════
🚀 Starting Source Type Migration
   Conservative → Traditionalist
═══════════════════════════════════════

🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🔍 Finding articles with Conservative source types...
📊 Found 15 articles to update

  📝 Updating: "Breaking News: Political Analysis..."
     Old: Right / Conservative
     New: Right / Traditionalist

═══════════════════════════════════════
✅ Migration Complete!
📊 Articles updated: 15
📊 Total sources updated: 23
═══════════════════════════════════════

🔍 Verifying changes...
✅ Verification passed! No Conservative entries remain.

✅ All done! You can now close this script.
```

### Rollback:
If you need to rollback, you can modify the script to reverse the changes:
```javascript
source.source_type = 'Right / Conservative'; // Instead of 'Right / Traditionalist'
```

### After Running:
1. Restart your backend: `pm2 restart nobias-backend`
2. Clear any caches
3. Verify on the frontend that source types display correctly
