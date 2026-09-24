# Cloud Run Deployment

## Current hosting and build configuration

- **Frontend:** Vercel. The repository's `vercel.json` builds the Create React App frontend with `cd frontend && npm install && npm run build` and publishes `frontend/build`. The production API setting is in `frontend/.env.production` as `REACT_APP_API_URL`, pointing at the Cloud Run service and ending in `/api`.
- **Backend:** Google Cloud Run. The root `Dockerfile` builds the backend image; build from the repository root so its `backend/` paths resolve.
- **Deployment:** Google Cloud Build builds and deploys the backend to Cloud Run when changes are pushed to GitHub, according to the Cloud Build trigger configuration.
- **Validation:** [`.github/workflows/deploy-backend.yml`](.github/workflows/deploy-backend.yml) runs on pushes and pull requests to `main` when `backend/**`, `frontend/**`, `Dockerfile`, `.dockerignore`, or the workflow itself changes; it also supports manual dispatch. GitHub Actions validates backend JavaScript syntax, builds the root Docker image, runs focused frontend tests, and builds the frontend for production. It does not authenticate to Google Cloud or deploy; no Google Cloud service-account secret is required by this workflow.

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

The backend health endpoint is `GET /api/health`; it returns HTTP 200 when MongoDB is connected and HTTP 503 otherwise. Cloud Build handles deployment; the GitHub Actions validation workflow does not check the live endpoint.

The latest pushed commit, `df1990d`, has a successful `google-cloud-build` GitHub check, and its `/api/health` endpoint returned HTTP 200. Cloud Run runtime environment settings were not inspected. The live payment flow has not been tested.
