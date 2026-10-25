# CI/CD & Deployment

The full pipeline and deployment guide (both images, environments, secrets, backend variables) lives in the
backend repository: [docs/deployment.md](https://github.com/LouziAmine/---Credit-Bladi---/blob/release/2.1.0/docs/deployment.md).

## This repository

`.github/workflows/ci-cd.yml`:

| Job | What it does |
|---|---|
| `build-test` | `npm ci`, ESLint, Vitest with coverage thresholds, `audit-ci` (high severity), production build; uploads `dist/` and the coverage report |
| `docker` | Builds `ghcr.io/<owner>/credit-bladi-portal` (multi-stage: Node build → unprivileged nginx) and pushes it on branch pushes and `v*` tags |
| `deploy` | Optional (repository variable `DEPLOY_ENABLED=true`): POSTs the new image to the `DEPLOY_HOOK_URL` secret of the `staging` (branches) or `production` (tags) environment, then checks `APP_URL` |

## Runtime

| Variable | Default | Notes |
|---|---|---|
| `API_UPSTREAM` | `http://backend:8080` | Where nginx forwards `/api/` |
| `NGINX_PORT` | `8080` | Listening port |

The production build calls the API on the same origin (`/api/v1`, `src/environments/environment.ts`). The
nginx template in `deploy/nginx/default.conf.template` provides the proxy, the CSP with a per-response
nonce, HSTS and the cache policy.

Coverage thresholds in `angular.json` are a ratchet set at the current values (statements 87 %, branches
89 %, functions 79 %, lines 85 %): raise them as coverage improves, never lower them.
