# Contributing to Credit Bladi Portal

Thanks for taking the time to contribute. This page explains how to propose a change and what is checked
before it is merged. Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting set up

Follow the [Quick Start](README.md#quick-start) of the README. Most screens (login, simulation, back office,
portal) also need the [Credit Bladi API](https://github.com/LouziAmine/---Credit-Bladi---) on `:8080`.

## Workflow

1. Fork the repository and branch from `master`, named after what the change does, for example
   `feature/early-repayment-history` or `fix/rib-validation`.
2. Keep the change on one concern, and add or update its tests: a unit test, plus an end-to-end spec when it
   changes a user flow.
3. Run the checks below, then open a pull request against `master` that says what changed and why.

## Before opening a pull request

```bash
npm run lint            # must pass with no error
npm run test:coverage   # unit tests and the coverage thresholds
npm run test:e2e        # end-to-end tests (needs the API, see docs/testing.md)
```

`./run-tests.sh` offers the same commands as a menu. A pull request that fails lint, lowers coverage below the
thresholds in `angular.json`, or breaks a Playwright spec is not merged.

## Code style

- ESLint (Angular, TypeScript and security rules) and Prettier define the style.
- Dependencies point inward: `pages/` and `layouts/` use `core/` and `shared/`, never the reverse
  ([Architecture](docs/architecture.md#folder-structure)).
- HTTP calls live in a service under `core/services/`, never in a component
  ([Patterns in use](docs/architecture.md#patterns-in-use)).
- New routes are lazy (`loadComponent()`); only the landing page is eager, to avoid a layout shift
  ([Conventions](docs/architecture.md#conventions)).
- No comments in the source code: names carry the meaning, and explanations go in `docs/`.
- No literal business values in specs: they come from `src/app/testing/mocks/`
  ([Testing](docs/testing.md#unit-tests)).
- Code and commit messages are in English. Every text shown to users goes through a translation key in
  `public/i18n/` (French, English and Arabic).

## Commit messages

Say **why** the change was made, not only what changed. Keep the first line under about 70 characters and add
a body when the reasoning needs it.

## Bugs and feature requests

Open a GitHub issue with a clear description, the role (visitor, client or manager) and the screen concerned,
the steps to reproduce, and what you expected compared with what happened.

## Questions

Open an issue, or write to the contact in the [README](README.md#license).
