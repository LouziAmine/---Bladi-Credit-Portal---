# Credit Bladi Portal

![Angular](https://img.shields.io/badge/Angular-22-red?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-Apache%202.0-yellow.svg)
![Tests](https://img.shields.io/badge/tests-Vitest%20%7C%20Playwright%20%7C%20Lighthouse-orange)

Angular frontend for Credit Bladi, a Moroccan mortgage credit simulator compliant with Bank
Al-Maghrib (BAM) regulatory rules. Talks to the [Credit-Bladi](../Credit-Bladi) Spring Boot API.

## Table of Contents

- [Overview](#overview)
- [Application Overview & User Journeys](docs/business-workflow.md)
- [Tech Stack](#tech-stack)
- [Documentation](#documentation)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Run locally](#run-locally)
  - [Configuration profiles](#configuration-profiles)
  - [Building](#building)
- [Testing](#testing)
  - [What each layer actually checks](#what-each-layer-actually-checks)
- [Security Model](#security-model)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Overview

Credit Bladi Portal is the public web application for Credit Bladi's mortgage simulator: a single
form where an applicant enters a loan amount, duration, financing product (Conventional or
Mourabaha) and profile, and immediately gets a full cost breakdown or a clear rejection reason,
with no account required. A separate, role-gated Administration area lets bank staff (`MANAGER`
role) adjust the regulatory parameters every simulation runs against, manage staff accounts, and
review the compliance audit trail.

For the full walkthrough of every screen and who can do what, see [Application Overview & User
Journeys](docs/business-workflow.md). For the business rules behind the numbers (the BAM
eligibility checks, the two financing products, CSP applicant profiles), see the backend's
[Simulation Workflow & Business Domain](../Credit-Bladi/docs/business-workflow.md).

## Tech Stack

| | |
|---|---|
| Framework | Angular 22 (standalone components, signals) |
| Language | TypeScript, strict mode |
| Styling | Bootstrap 5, self-hosted (no runtime CDN) |
| Auth | JWT in HttpOnly, SameSite=Strict cookies (no token in localStorage) |
| Assets | Self-hosted fonts/icons (`@fontsource/poppins`, `bootstrap-icons`, `bootstrap`); no third-party CDN at runtime |
| Tests | Vitest (unit), Playwright (integration/E2E), Lighthouse CI (performance) |
| Security | eslint-plugin-security (SAST), audit-ci (SCA), OWASP ZAP (DAST) |
| Code Style | ESLint (Angular ESLint + TypeScript ESLint), Prettier |

## Documentation

Detailed docs live in [`docs/`](docs/):

| Doc | Covers |
|---|---|
| [Application Overview & User Journeys](docs/business-workflow.md) | What the portal lets people do, screen by screen: the public simulator, registration/login, and every Manager-only admin screen, written for a non-technical reader |
| [User Guide (Annotated Screenshots)](docs/user-guide/README.md) | Every screen and scenario (Visitor, Client, Manager), walked through with real screenshots captured against a live backend: accepted/rejected simulations, register/login, and all five admin screens |
| [Architecture](docs/architecture.md) | Real folder structure, Angular conventions used (standalone components, signals, functional guards/interceptors), the authentication/session-refresh flow, and the design patterns in play |
| [Testing & Quality Reports](docs/testing.md) | How to run each test suite, reference results, and annotated screenshots of the Vitest coverage, Playwright, Lighthouse CI, and OWASP ZAP reports |

## Getting Started

### Prerequisites

- Node.js 20+, npm
- The [Credit-Bladi](../Credit-Bladi) backend running on `:8080` for any flow that calls the API
  (login, register, simulation, admin); pages that don't call the API render fine without it.

### Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200/`.

### Configuration profiles

The API base URL is set per build configuration in `src/environments/`; nothing is read from the
environment at runtime:

| Configuration | File | `apiUrl` | Used by |
|---|---|---|---|
| Development | `environment.development.ts` | `http://localhost:8080/api/v1` | `ng serve` / `npm start` |
| Staging | `environment.staging.ts` | `https://staging-api.bladi-credit.ma/api/v1` | `ng build --configuration staging` |
| Production | `environment.ts` | `/api/v1` (same-origin, reverse-proxied to the backend) | `ng build` (default), `npm run preview` |

See [Architecture > Configuration profiles](docs/architecture.md#configuration-profiles) for how
Angular's `fileReplacements` wires this up.

### Building

```bash
ng build
```

Artifacts are written to `dist/`. `npm run preview` builds and serves them through
`tools/preview-server.mjs` (the same target Lighthouse/ZAP use) if you want to see the app the way
those gates do rather than through `ng serve`.

## Testing

`./run-tests.sh` is an interactive menu that wraps all of the test suites below, the fastest way
to get started without memorizing npm flags:

```bash
./run-tests.sh
```

| Option | Does |
|---|---|
| 1 | Unit tests (Vitest), no app needed, 100% coverage threshold |
| 2 | Playwright integration/E2E tests, starts the app automatically |
| 3 | Lighthouse CI performance tests (production build via `tools/preview-server.mjs`, auto-managed) |
| 4 | Playwright then Lighthouse, back to back |
| 5 | ESLint: Angular style rules + eslint-plugin-security (SAST) |
| 6 | Start the app in dev mode |
| 7 | npm audit / audit-ci: SCA scan of production dependencies |
| 8 | OWASP ZAP: DAST scan (requires Docker; builds + starts the preview server if needed) |

Auth-dependent Playwright specs (login, guards, cookie flags) need the backend running on `:8080`
and its seeded dev admin account (`admin` / `admin123`), the same account the backend's own ZAP
automation authenticates with. They `test.skip()` themselves if the backend isn't reachable,
so the suite stays green without it; only unauthenticated flows (validation, XSS, routing
fallback) run in that case.

Full commands, reference results, and annotated report screenshots are in [Testing & Quality
Reports](docs/testing.md).

### What each layer actually checks

- **Unit (Vitest)**: component/service logic in isolation, no browser, no network.
- **Integration/E2E (Playwright)**: real browser against `ng serve`, one spec file per backend
  controller domain, covering every endpoint that has a UI action behind it: login and
  registration flows, route guards, form validation, XSS regressions, cookie flags (`HttpOnly`,
  `SameSite=Strict`), token storage (asserts nothing JWT-shaped ever lands in
  `localStorage`/`sessionStorage`); the credit-simulation feature itself (conventional vs
  Mourabaha, co-borrower, amortization schedule, a BAM-rejected 422 scenario surfacing a real
  error); and every manager-only admin flow (user create/promote/demote, BAM/credit-rate/Mourabaha
  parameter edits, audit log). Mirrors the backend's own scenario coverage at the UI level; see
  the spec-to-controller table in [Testing & Quality Reports](docs/testing.md).
- **Performance (Lighthouse CI)**: against `tools/preview-server.mjs`, a real static server over
  the minified `ng build` output (not `ng serve`, a dev tool with none of the compression/caching/
  security headers a real deployment would have). Budgets on performance/accessibility/
  best-practices/SEO scores and Core Web Vitals (LCP, TBT, CLS). Accessibility is gated high
  (0.95) deliberately.
- **SCA (`audit-ci`)**: fails the build on high/critical CVEs in dependencies that ship to the
  browser bundle; `--skip-dev` keeps build-tooling-only vulnerabilities (ESLint, Lighthouse CLI,
  etc.) from blocking a release over risk that was never deployable.
- **SAST (`eslint-plugin-security`)**: static checks for eval, non-literal regexp, unsafe
  object injection, etc., scoped to `.ts` sources.
- **DAST (OWASP ZAP)**: `security/zap-automation.yaml` crawls `tools/preview-server.mjs` with
  `spiderAjax` (plain spider can't follow Angular's client-side routing) and active-scans the
  unauthenticated surface: headers, reflected XSS, info disclosure. Authenticated business-flow
  scanning of the API itself is already covered by the backend's own ZAP run.

## Security Model

- Access/refresh tokens stored in **HttpOnly, `SameSite=Strict` cookies**, never in
  `localStorage`/`sessionStorage` and never readable from JavaScript (regression-tested, see
  [Testing](docs/testing.md))
- A global HTTP interceptor transparently retries a request once after a silent token refresh on
  `401`, then redirects to `/login` if the refresh itself fails; see [Architecture >
  Authentication & session flow](docs/architecture.md#authentication--session-flow)
- Route-level guards (`authGuard`, `guestGuard`, `managerGuard`) gate every screen; the entire
  `/admin/*` area is unreachable, and hidden from navigation, for anyone without the `MANAGER` role
- Zero third-party CDN at runtime: Bootstrap, Bootstrap Icons, and Poppins are npm dependencies
  bundled at build time, removing an entire class of supply-chain/SRI concerns
- Content-Security-Policy served with a per-request nonce for Angular's own scoped styles, no
  `unsafe-inline`; see [`tools/preview-server.mjs`](tools/preview-server.mjs)
- SAST (`eslint-plugin-security`), SCA (`audit-ci`), and DAST (OWASP ZAP) all gate the pipeline;
  see [Testing](#testing) above

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the branching workflow, the
tests to run before opening a pull request, and the code style enforced by ESLint/Prettier. This
project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).

## License

Licensed under the [Apache License, Version 2.0](LICENSE).

## Contact

**Amine Louzi** (louzi.amine.pro.pro@gmail.com)