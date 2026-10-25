# Credit Bladi Portal

[![Frontend CI/CD](https://github.com/LouziAmine/---Bladi-Credit-Portal---/actions/workflows/ci-cd.yml/badge.svg?branch=release%2F2.1.0)](https://github.com/LouziAmine/---Bladi-Credit-Portal---/actions/workflows/ci-cd.yml)
![Angular](https://img.shields.io/badge/Angular-22-red?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-Apache%202.0-yellow.svg)

The web front end of Credit Bladi, a Moroccan credit platform. Visitors simulate a mortgage (conventional or
Mourabaha) or a company investment loan without an account; bank staff run the dossiers through the
instruction workflow; clients follow their dossiers and repayments in a portal. It talks to the
[Credit Bladi API](https://github.com/LouziAmine/---Credit-Bladi---) (Spring Boot).

> MVP. Known limitations are listed in the API's
> [architecture notes](https://github.com/LouziAmine/---Credit-Bladi---/blob/release/2.1.0/docs/architecture.md#known-limitations).

## Quick Start

| Tool | Version |
|---|---|
| Node.js | 22.22+ or 24.15+ (required by Angular 22) |
| API | [Credit Bladi API](https://github.com/LouziAmine/---Credit-Bladi---) running on `:8080` |

```bash
npm ci
npm start          # http://localhost:4200, calls the API on http://localhost:8080
```

Demo login (API dev profile): `admin` / `admin123`.

To run the portal and the API together in Docker, clone both repositories side by side and follow the API's
[Quick Start](https://github.com/LouziAmine/---Credit-Bladi---#quick-start).

| Problem | Fix |
|---|---|
| `The Angular CLI requires a minimum Node.js version` | Install Node 22.22+ or 24.15+ (`node -v`) |
| Pages load but login and simulation fail | Start the API on `:8080` |
| `Port 4200 is already in use` | `npm start -- --port 4300`, and allow that origin in the API's CORS setting |

## What is in the portal

| Area | Who | What they do |
|---|---|---|
| Simulators | Anyone | Mortgage and investment simulations: monthly payment, TEG, fees, schedule, or the reason for a refusal. An eligible simulation opens a dossier |
| Back office (`/admin`) | `MANAGER` | Dossier pipeline (classification, assignment, steps, committee decision, documents), credit files and payments, parameters (BAM, rates, Mourabaha, enterprise types), users, enterprises, audit log, Excel import |
| Client portal (`/portal`) | `CLIENT` | Own dossiers, requested documents, repayment schedule, payment declarations, early repayment quote |

Every screen is described in [Application Overview](docs/business-workflow.md) and shown with screenshots in the
[User Guide](docs/user-guide/README.md).

## Tech stack

| | |
|---|---|
| Framework | Angular 22: standalone components, signals, zoneless, `OnPush` everywhere |
| Language | TypeScript (strict) |
| UI | Bootstrap 5 and Bootstrap Icons, bundled (no CDN), French, English and Arabic (RTL) with ngx-translate |
| Auth | JWT in `HttpOnly`, `SameSite=Strict` cookies, never readable from JavaScript |
| Real time | `EventSource` (Server-Sent Events) for the notification bell |
| Tests | Vitest (unit), Playwright (end to end), Lighthouse CI (performance) |
| Quality | ESLint with Angular, TypeScript and security rules, `audit-ci` for dependencies |
| Delivery | GitHub Actions, Docker image on nginx (unprivileged) |

## Documentation

| Document | Content |
|---|---|
| [Application Overview](docs/business-workflow.md) | What each screen does and who can use it, for non-technical readers |
| [User Guide](docs/user-guide/README.md) | Screens and scenarios with screenshots |
| [Architecture](docs/architecture.md) | Folder structure, Angular conventions, authentication and session refresh |
| [Testing](docs/testing.md) | How to run each suite, current results, report screenshots |
| [Deployment](docs/deployment.md) | CI/CD pipeline, nginx image, runtime variables |
| [Architecture at a Glance (C4)](https://github.com/LouziAmine/---Credit-Bladi---/blob/release/2.1.0/docs/c4-architecture.md) | System context, containers, front and back layers |
| [Feature Flows](https://github.com/LouziAmine/---Credit-Bladi---/blob/release/2.1.0/docs/flows/README.md) | One sequence diagram per feature, from the click to the database and back |

## Development

| Command | Does |
|---|---|
| `npm start` | Dev server on `:4200` (`src/environments/environment.development.ts`) |
| `npm run build` | Production build in `dist/` (the API is reached on the same origin, `/api/v1`) |
| `npm test` | Unit tests (Vitest); `npm run test:coverage` adds the coverage report and thresholds |
| `npm run test:e2e` | Playwright end-to-end tests (needs the API, see [Testing](docs/testing.md)) |
| `npm run lint` | ESLint, including the security rules |
| `npm run test:security:sca` | Dependency audit |
| `./run-tests.sh` | Interactive menu over all of the above |

| Build configuration | `apiUrl` | Used by |
|---|---|---|
| development | `http://localhost:8080/api/v1` | `npm start` |
| staging | `https://staging-api.bladi-credit.ma/api/v1` | `ng build --configuration staging` |
| production | `/api/v1` (proxied by nginx) | `npm run build`, Docker image |

## Security

- Tokens live only in `HttpOnly` cookies. A test checks that nothing JWT-shaped is ever stored in
  `localStorage` or `sessionStorage`.
- On a `401`, the error interceptor refreshes the session once and replays the request; if that fails, the
  user goes back to `/login`.
- Route guards: `authGuard`, `guestGuard`, `managerGuard` (the whole `/admin` area) and `clientGuard`
  (`/portal`).
- The production image sends a strict Content-Security-Policy with a per-response nonce, HSTS and
  `X-Frame-Options: DENY` (`deploy/nginx/default.conf.template`).
- No third-party script or font at runtime: everything is bundled.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[Apache License 2.0](LICENSE). Contact: Amine Louzi (louzi.amine.pro.pro@gmail.com).
