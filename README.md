# The NoBias Media

A news website and shared API for articles, categorized sources, bookmarks,
Google sign-in, administration, and donations. The website uses React; the API
uses Express, MongoDB, and Socket.IO. Hosting is Vercel and Google Cloud Run.

## Start here

| Task | Guide |
|---|---|
| Install, configure environments, or deploy | [1. Project and deployment](docs/01-PROJECT-AND-DEPLOYMENT.md) |
| Integrate reader APIs, sign-in, or payments | [2. Client APIs and payments](docs/02-MOBILE-AND-PAYMENTS.md) |
| Validate a release or troubleshoot production | [3. Operations and release](docs/03-OPERATIONS-AND-RELEASE.md) |
| Understand uploads, caching, and loading improvements | [4. Performance](docs/04-PERFORMANCE.md) |

## Environments and current status

- Website: <https://thenobiasmedia.com>.
- API origin: `https://thenbm-329287861933.asia-south1.run.app`.
- Client API base: `https://thenbm-329287861933.asia-south1.run.app/api`.
- Documentation reviewed: October 23, 2026.
- Latest local validation: 49 backend tests, 27 frontend tests, and a successful
  frontend production build. Tests use mocks/local servers; they do not certify
  live payment settlement or production database behavior.
- Reader response and performance changes are local; deployment was not performed
  in this work. Release the backend before the updated frontend.
- The current React Native source is maintained elsewhere and was not modified
  or tested. The older local mobile copy is not the current app.

## Validate locally

Run from the repository root after installing dependencies as described in guide 1:

```sh
rtk npm test --prefix backend
rtk npm test --prefix frontend -- --watchAll=false --runInBand
rtk npm run build --prefix frontend
```

The [GitHub workflow](.github/workflows/deploy-backend.yml) validates the
application and Docker build; it does not deploy the backend. Local development,
CI, Docker, and Vercel use Node 24.x; see guide 1 for setup and Vercel settings.

## Documentation maintenance

These four guides describe current code. [Archived documents](docs/archive/README.md)
are historical references and do not override them. Keep code behavior, local
checks, and observed production behavior distinct. Never copy credentials or
customer payment data into documentation. When behavior changes, update its
owning guide instead of appending a second, conflicting description elsewhere.
