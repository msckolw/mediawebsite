# Cloud Run Deployment

## Current hosting and build configuration

- **Frontend:** Vercel. The repository's `vercel.json` builds the Create React App frontend with `cd frontend && npm install && npm run build` and publishes `frontend/build`. The production API setting is in `frontend/.env.production` as `REACT_APP_API_URL`, pointing at the Cloud Run service and ending in `/api`.
- **Backend:** Google Cloud Run. The root `Dockerfile` builds the backend image; build from the repository root so its `backend/` paths resolve.
- **Automation:** [`.github/workflows/deploy-backend.yml`](.github/workflows/deploy-backend.yml) runs on pushes to `main` when `backend/**`, `Dockerfile`, `.dockerignore`, or the workflow itself changes; it also supports manual dispatch. It builds and deploys the root Docker image, then checks `/api/health`.
- **GitHub Actions secret:** Configure `GCP_SA_KEY` with the service-account credential required for Google Cloud authentication. Never put its value in documentation, source, or logs.

## Backend runtime environment

Set the backend's runtime variables in Cloud Run. The application uses these names:

- `MONGODB_URI`
- `PORT` (Cloud Run supplies this; the container defaults to `8080`)
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `PAYU_MERCHANT_KEY`
- `PAYU_MERCHANT_SALT`
- `PAYU_MODE`
- `PUBLIC_API_URL`
- `FRONTEND_URL`
- `NODE_ENV`

Keep credentials private and configure only the values appropriate for the deployment. The frontend production setting `REACT_APP_API_URL` must be the backend URL ending in `/api`.

## Health check and verification limits

The backend health endpoint is `GET /api/health`; it returns HTTP 200 when MongoDB is connected and HTTP 503 otherwise. The workflow checks that endpoint after deployment.

Live GitHub Actions run history and Cloud Run environment settings require access to the relevant accounts and have not been verified here. Local fixes or documentation changes are not deployed until committed and pushed; deployments are triggered only when the workflow's branch and path conditions are met (or by manual dispatch). This document does not assert that the payment flow has been tested.
