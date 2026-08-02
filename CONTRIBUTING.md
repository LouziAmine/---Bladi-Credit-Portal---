# Contributing to Credit Bladi Portal

Thanks for taking the time to contribute. This document explains how to propose a change, what's
expected before opening a pull request, and the coding standards enforced in this repository.

## Code of Conduct

This project and everyone participating in it is governed by the
[Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold it.

## Getting set up

Follow the [Getting Started](README.md#getting-started) section of the README to install
prerequisites and run the application locally. Most flows (login, register, simulation, admin)
also need the [Credit-Bladi](../Credit-Bladi) backend running on `:8080`.

## Workflow

1. Fork the repository and create your branch from `master`.
2. Name your branch after what it does, e.g. `feature/simulation-pdf-export` or
   `fix/register-password-validator`.
3. Make your change, keeping it focused on a single concern.
4. Add or update tests that cover the change (unit and, if it touches a user flow, an
   integration/E2E spec).
5. Run the full check suite locally before opening a pull request (see below).
6. Open a pull request against `master` with a clear description of the change and why it's
   needed.

## Before opening a pull request

Run these from the repository root; `./run-tests.sh` wraps all of them in an interactive menu:

```bash
# Code style: must pass with zero violations
npm run lint

# Unit tests, 100% coverage threshold
npm run test:coverage

# Integration/E2E tests (starts the app automatically)
npm run test:e2e
```

A pull request that fails ESLint, drops unit coverage below 100%, or breaks a Playwright spec will
not be merged until it's fixed.

## Code style

- TypeScript and templates follow the Angular ESLint + TypeScript ESLint rule sets
  (`eslint.config.js`); run `npm run lint` to verify before pushing. Formatting is enforced by
  Prettier (`.prettierrc`).
- Keep the layered structure documented in [Architecture](docs/architecture.md): dependency
  direction is strictly inward, `pages/`/`layouts/` depend on `core/`/`shared/`, never the reverse.
  Don't add imports that violate that direction.
- New HTTP calls belong behind a service in `core/services/`, never called directly from a
  component; see [Design patterns actually in
  use](docs/architecture.md#design-patterns-actually-in-use).
- Follow the existing lazy-loading convention (`loadComponent()`) for any new route; only
  `/simulation` is eager, and that's a deliberate, documented exception (see
  [Architecture](docs/architecture.md#angular-architecture-conventions)); don't add a second one
  without the same layout-shift evidence.
- All code, comments, and commit messages must be in English.

## Commit messages

Write commit messages that explain **why** a change was made, not just what changed. Keep the
first line under ~70 characters; add a body if the reasoning needs more space.

## Reporting bugs / requesting features

Open a GitHub issue with:
- A clear description of the problem or the feature request
- Steps to reproduce (for bugs), including which role (visitor/client/manager) and which screen
- What you expected to happen vs. what actually happened

## Questions

If anything in this guide is unclear, open an issue or reach out, see
[README > Contact](README.md#contact).