# GitHub Actions & CI/CD Guide

## Current Status

**Repository:** https://github.com/msckolw/mediawebsite  
**Workflows:** 2 active  
**Status:** ✅ Working

---

## GitHub Actions Workflows

### 1. Deploy Backend to EC2
**File:** `.github/workflows/deploy-backend.yml`  
**Trigger:** Push to `main` branch (backend changes only)  
**What it does:**
1. Checks API is responding
2. SSH to EC2
3. Pull latest code
4. Install dependencies
5. Restart PM2
6. Verify deployment

### 2. SSH Connection Test
**File:** `.github/workflows/ssh-test.yml`  
**Trigger:** Manual (workflow_dispatch)  
**What it does:**
- Tests SSH connection to EC2
- Displays system information
- Checks PM2 status

---

## Required Secrets

### Setup GitHub Secrets

Go to: https://github.com/msckolw/mediawebsite/settings/secrets/actions

### 1. EC2_SSH_KEY
**Value:** Complete contents of `~/.ssh/nobias-media-key.pem`

```bash
# Display your key
cat ~/.ssh/nobias-media-key.pem

# Copy everything including:
# -----BEGIN RSA PRIVATE KEY-----
# ... key content ...
# -----END RSA PRIVATE KEY-----
```

**Add to GitHub:**
1. Settings → Secrets and variables → Actions
2. New repository secret
3. Name: `EC2_SSH_KEY`
4. Value: Paste entire key
5. Add secret

### 2. EC2_HOST
**Value:** `api.thenobiasmedia.com`

**Add to GitHub:**
1. Settings → Secrets and variables → Actions
2. New repository secret
3. Name: `EC2_HOST`
4. Value: `api.thenobiasmedia.com`
5. Add secret

---

## Deployment Workflow

### Automatic Deployment
```bash
# Make changes to backend
cd backend
# ... make your changes ...

# Commit and push
git add .
git commit -m "backend: your changes"
git push origin main

# GitHub Actions will automatically:
# 1. Detect backend changes
# 2. Run deployment workflow
# 3. Deploy to EC2
# 4. Restart backend
```

### Monitor Deployment
1. Go to https://github.com/msckolw/mediawebsite/actions
2. Click on the running workflow
3. Watch real-time logs
4. Verify success ✅

---

## Manual Deployment Trigger

### Via GitHub UI
1. Go to https://github.com/msckolw/mediawebsite/actions
2. Select "Deploy Backend to EC2"
3. Click "Run workflow"
4. Select branch (main)
5. Click "Run workflow"

### Via Git Command
```bash
# Trigger deployment with empty commit
git commit --allow-empty -m "chore: trigger deployment"
git push origin main
```

---

## Troubleshooting

### Deployment Fails

**Check workflow logs:**
1. Go to https://github.com/msckolw/mediawebsite/actions
2. Click on failed workflow
3. Expand failed step
4. Read error message

**Common issues:**

#### SSH Permission Denied
```
Permission denied (publickey)
```

**Solution:**
1. Verify `EC2_SSH_KEY` secret is set correctly
2. Ensure key includes headers (`-----BEGIN...` and `-----END...`)
3. Check key matches EC2 instance

```bash
# Verify key fingerprint
ssh-keygen -lf ~/.ssh/nobias-media-key.pem

# Compare with EC2
aws ec2 describe-key-pairs --key-names nobias-media-key
```

#### Wrong Username
```
ec2-user@...: Permission denied
```

**Solution:**
- Workflow uses `ec2-user` (correct for Amazon Linux 2)
- If using Ubuntu, change to `ubuntu` in workflow file

#### Git Pull Fails
```
error: Your local changes would be overwritten
```

**Solution:**
SSH to EC2 and reset:
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite
git stash
git pull origin main
EOF
```

#### API Not Responding
```
API returned HTTP 500
```

**Solution:**
Check backend logs:
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "pm2 logs nobias-backend"
```

---

## Workflow Configuration

### Deploy Backend Workflow

**Triggers:**
```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'
  workflow_dispatch:
```

**Key Steps:**
1. Checkout code
2. Verify API is responding
3. Create SSH key file
4. Deploy to EC2 (git pull, npm install, pm2 restart)
5. Verify deployment
6. Show deployment summary

**Secrets Used:**
- `EC2_SSH_KEY` - Private SSH key
- `EC2_HOST` - EC2 domain/IP

---

## Testing SSH Connection

### Via GitHub Actions
1. Go to https://github.com/msckolw/mediawebsite/actions
2. Select "SSH Connection Test"
3. Click "Run workflow"
4. Select branch (main)
5. Click "Run workflow"
6. View results

### Via Local Machine
```bash
# Test SSH connection
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com "echo 'Connection successful'"

# Test deployment command
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com \
  "cd ~/mediawebsite && git pull && cd backend && pm2 restart nobias-backend"
```

---

## Deployment Best Practices

### Before Pushing
1. ✅ Test changes locally
2. ✅ Check for syntax errors
3. ✅ Update environment variables if needed
4. ✅ Write clear commit messages

### After Pushing
1. ✅ Monitor GitHub Actions workflow
2. ✅ Check deployment logs
3. ✅ Test API endpoint
4. ✅ Verify no errors in PM2 logs

### Commit Message Format
```bash
# Backend changes
git commit -m "backend: add new endpoint for user profile"

# Frontend changes
git commit -m "frontend: fix navigation bug"

# Both
git commit -m "feat: add bookmark functionality"

# Bug fix
git commit -m "fix: resolve CORS issue"

# Deployment trigger
git commit -m "chore: trigger deployment"
```

---

## Rollback Procedure

### Via Git
```bash
# Revert last commit
git revert HEAD
git push origin main

# Or reset to specific commit
git log --oneline -10
git reset --hard <COMMIT_HASH>
git push --force origin main
```

### Via SSH (Manual)
```bash
ssh -i ~/.ssh/nobias-media-key.pem ec2-user@api.thenobiasmedia.com << 'EOF'
cd ~/mediawebsite
git log --oneline -10
git reset --hard <COMMIT_HASH>
cd backend
npm install
pm2 restart nobias-backend
EOF
```

---

## Monitoring Deployments

### GitHub Actions Dashboard
- **URL:** https://github.com/msckolw/mediawebsite/actions
- **Shows:** All workflow runs, status, logs
- **Filter:** By workflow, branch, status

### Deployment Notifications
Consider setting up:
- Email notifications (GitHub settings)
- Slack integration
- Discord webhooks

---

## Security Best Practices

### Secrets Management
1. ✅ Never commit secrets to Git
2. ✅ Use GitHub Secrets for sensitive data
3. ✅ Rotate SSH keys periodically
4. ✅ Limit secret access to necessary workflows

### SSH Key Security
1. ✅ Use separate key for GitHub Actions
2. ✅ Restrict key permissions (chmod 400)
3. ✅ Don't share keys between environments
4. ✅ Revoke old keys when no longer needed

### Workflow Security
1. ✅ Use specific branch triggers
2. ✅ Limit workflow_dispatch to maintainers
3. ✅ Review workflow changes carefully
4. ✅ Use minimal permissions

---

## Advanced Configuration

### Deploy on Specific Paths Only
```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'backend/src/**'
      - 'backend/package.json'
```

### Add Deployment Notifications
```yaml
- name: Notify on Success
  if: success()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"✅ Backend deployed successfully"}'
```

### Add Tests Before Deploy
```yaml
- name: Run Tests
  run: |
    cd backend
    npm test
```

---

## Useful Commands

```bash
# View workflow runs
gh run list

# View specific run
gh run view <RUN_ID>

# Trigger workflow
gh workflow run deploy-backend.yml

# View workflow logs
gh run view --log

# Cancel running workflow
gh run cancel <RUN_ID>
```

---

## Support

- **GitHub Actions:** https://github.com/msckolw/mediawebsite/actions
- **GitHub Docs:** https://docs.github.com/en/actions
- **Workflow Files:** `.github/workflows/`
