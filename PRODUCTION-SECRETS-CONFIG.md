# Production Secrets Configuration Guide

## Current Admin Credentials
- **Email**: `manisankarthenobias@gmail.com`
- **Password**: `Tnbm@726756`
- **Bcrypt Hash**: `$2a$10$Dq2r6tP./K4mBGSjv4oSeevGQJ1fzhho73QJWAz/iUZkBa0swBmS6`

## Google Cloud Secret Manager Setup

### Step 1: Create Secrets in Secret Manager

```bash
# Set your project ID
export PROJECT_ID="thenbm"

# Create Admin Email Secret
echo -n "manisankarthenobias@gmail.com" | gcloud secrets create ADMIN_EMAIL \
  --data-file=- \
  --project=$PROJECT_ID

# Create Admin Password Hash Secret
echo -n '$2a$10$Dq2r6tP./K4mBGSjv4oSeevGQJ1fzhho73QJWAz/iUZkBa0swBmS6' | gcloud secrets create ADMIN_PASSWORD_HASH \
  --data-file=- \
  --project=$PROJECT_ID
```

### Step 2: Grant Cloud Run Access to Secrets

```bash
# Get your Cloud Run service account
export SERVICE_ACCOUNT=$(gcloud run services describe thenbm \
  --region=asia-south1 \
  --format='value(spec.template.spec.serviceAccountName)')

# Grant access to ADMIN_EMAIL secret
gcloud secrets add-iam-policy-binding ADMIN_EMAIL \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID

# Grant access to ADMIN_PASSWORD_HASH secret
gcloud secrets add-iam-policy-binding ADMIN_PASSWORD_HASH \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID
```

### Step 3: Update Cloud Run Service with Secrets

```bash
gcloud run services update thenbm \
  --region=asia-south1 \
  --update-secrets=ADMIN_EMAIL=ADMIN_EMAIL:latest,ADMIN_PASSWORD_HASH=ADMIN_PASSWORD_HASH:latest \
  --project=$PROJECT_ID
```

### Alternative: Using Google Cloud Console (Web UI)

1. **Navigate to Secret Manager**:
   - Go to https://console.cloud.google.com/security/secret-manager?project=thenbm
   - Click "CREATE SECRET"

2. **Create ADMIN_EMAIL Secret**:
   - Name: `ADMIN_EMAIL`
   - Secret value: `manisankarthenobias@gmail.com`
   - Click "CREATE SECRET"

3. **Create ADMIN_PASSWORD_HASH Secret**:
   - Name: `ADMIN_PASSWORD_HASH`
   - Secret value: `$2a$10$Dq2r6tP./K4mBGSjv4oSeevGQJ1fzhho73QJWAz/iUZkBa0swBmS6`
   - Click "CREATE SECRET"

4. **Add Secrets to Cloud Run**:
   - Go to https://console.cloud.google.com/run?project=thenbm
   - Click on your service "thenbm"
   - Click "EDIT & DEPLOY NEW REVISION"
   - Scroll to "Variables & Secrets" section
   - Click "REFERENCE A SECRET"
   - Select `ADMIN_EMAIL`, choose "Exposed as environment variable", name it `ADMIN_EMAIL`
   - Click "REFERENCE A SECRET" again
   - Select `ADMIN_PASSWORD_HASH`, choose "Exposed as environment variable", name it `ADMIN_PASSWORD_HASH`
   - Click "DEPLOY"

## AI News Assistant API Keys (Optional - For Future Use)

When you're ready to enable the AI News Assistant feature, add these secrets:

```bash
# Parallel AI (Required for web search)
echo -n "YOUR_PARALLEL_API_KEY" | gcloud secrets create PARALLEL_API_KEY \
  --data-file=- \
  --project=$PROJECT_ID

# OpenAI GPT-6 Luna (Optional)
echo -n "YOUR_OPENAI_API_KEY" | gcloud secrets create OPENAI_API_KEY \
  --data-file=- \
  --project=$PROJECT_ID

# xAI Grok 4.7 (Optional)
echo -n "YOUR_XAI_API_KEY" | gcloud secrets create XAI_API_KEY \
  --data-file=- \
  --project=$PROJECT_ID

# Enable Assistant
echo -n "true" | gcloud secrets create ASSISTANT_ENABLED \
  --data-file=- \
  --project=$PROJECT_ID
```

Then update Cloud Run with these additional secrets:

```bash
gcloud run services update thenbm \
  --region=asia-south1 \
  --update-secrets=PARALLEL_API_KEY=PARALLEL_API_KEY:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest,XAI_API_KEY=XAI_API_KEY:latest,ASSISTANT_ENABLED=ASSISTANT_ENABLED:latest \
  --project=$PROJECT_ID
```

## Verification

After deploying, test admin login:
1. Go to https://thenobiasmedia.com/admin
2. Login with:
   - Email: `manisankarthenobias@gmail.com`
   - Password: `Tnbm@726756`

## Security Notes

- **Never commit** `.env` files to git
- **Never expose** secrets in code or logs
- Rotate credentials periodically
- Use Secret Manager for all sensitive data in production
- Keep this document secure and delete it after configuration

## Current Status

✅ Local backend configured with new credentials
❌ Production Cloud Run needs secrets configuration (follow steps above)
❌ Mobile app payment issue still needs fixing (mobile app location unknown)
