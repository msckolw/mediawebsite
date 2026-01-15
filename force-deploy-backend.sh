#!/bin/bash
# Force deploy backend to EC2 - Run this if GitHub Actions fails

echo "🚀 Force deploying backend to EC2..."

# This will trigger GitHub Actions by touching a backend file
echo "# Force deploy $(date)" >> backend/src/routes/newsRoutes.js

git add backend/src/routes/newsRoutes.js
git commit -m "chore: Force backend deployment"
git push origin main

echo "✅ Pushed to GitHub - Actions will deploy in ~2 minutes"
echo "📊 Check status: https://github.com/msckolw/mediawebsite/actions"
