# NoBias Media - Master Documentation

A news platform delivering unbiased news coverage. 
*This document serves as the single source of truth for the project's architecture, local development, and deployment as of April 2026.*

---

## 🏗️ Architecture

The application has been fully migrated to a modern, serverless architecture:

```text
┌─────────────────┐
│   Users         │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────────┐
│Vercel│  │Google     │
│(CDN) │  │Cloud Run  │
└───┬──┘  └──┬────────┘
    │        │
    │    ┌───▼────┐
    │    │MongoDB │
    │    │ Atlas  │
    │    └────────┘
    │
┌───▼──────────┐
│   Frontend   │
│ React SPA    │
└──────────────┘
```

| Component | Technology | Hosting | URL |
|-----------|-----------|---------|-----|
| **Frontend** | React | Vercel | https://www.thenobiasmedia.com |
| **Backend** | Node.js / Express | Google Cloud Run | *(Check GCP Console for current run.app URL)* |
| **Database** | MongoDB | Atlas | https://cloud.mongodb.com |
| **CI/CD** | GitHub Actions / Cloud Build | Auto-deploy on push to `main` | - |

---

## 💻 Local Development (Quick Start)

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas connection string (placed in `.env`)

### 1. Run Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5002
```

### 2. Run Frontend
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

---

## 🚀 Deployment Guide

Both the frontend and backend are configured to **automatically deploy** when you push to the `main` branch on GitHub.

```bash
git add .
git commit -m "your update message"
git push origin main
```

### Backend (Google Cloud Run)
- The backend uses a `Dockerfile` located at the root of the repository.
- **Continuous Deployment**: Managed by Google Cloud Build.
- **Environment Variables**: Managed directly in the Cloud Run UI -> "Edit & Deploy New Revision" -> "Variables & Secrets".
- **Important**: MongoDB Atlas Network Access must be set to `0.0.0.0/0` (Allow Anywhere) since Cloud Run uses dynamic IPs.

### Frontend (Vercel)
- The frontend is located in the `/frontend` directory.
- **Continuous Deployment**: Managed by Vercel's GitHub integration.
- **Environment Variables**: Managed in Vercel Dashboard -> Settings -> Environment Variables. 
- **Important**: `REACT_APP_API_URL` must point to your live Google Cloud Run service URL.

---

## 📁 Project Structure

```text
mediawebsite/
├── backend/               # Node.js Express Backend
│   ├── src/               # Application source code
│   │   ├── server.js      # Express server entry point
│   │   ├── routes/        # API Routes (news, auth)
│   │   └── models/        # Mongoose Database Models
│   └── package.json       # Backend dependencies
├── frontend/              # React Frontend
│   ├── src/               # React source code
│   │   ├── services/      # API communication (axios)
│   │   ├── pages/         # Route components
│   │   └── components/    # Reusable UI components
│   └── package.json       # Frontend dependencies
├── Dockerfile             # Used by Google Cloud Run to build the backend
├── .dockerignore          # Excludes files from the Docker build
└── vercel.json            # Vercel deployment configuration
```

---

## 🛠️ Troubleshooting

### Backend Failing to Start on Cloud Run
If Cloud Build succeeds but deployment fails with "failed to start and listen on the port", it means the Node.js app crashed on startup.
1. Check Cloud Run Logs for the exact error.
2. Most common cause 1: `MONGODB_URI` environment variable is missing or incorrect in Cloud Run settings.
3. Most common cause 2: MongoDB Atlas IP Access is blocking Cloud Run. Ensure `0.0.0.0/0` is allowed in Atlas Network Access.

### Frontend Showing Blank White Screen
If the Vercel deployment succeeds but the site is a white screen:
1. Check the browser console (Right Click -> Inspect -> Console).
2. Ensure `REACT_APP_API_URL` in Vercel correctly points to the active Cloud Run URL.
3. In Vercel, try deploying again with the "Clear Cache" option enabled.

---
*Note: Legacy deployment documentation (Render, AWS EC2) has been deprecated and removed to maintain a single source of truth.*
