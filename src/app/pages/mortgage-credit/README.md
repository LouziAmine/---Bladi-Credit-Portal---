# Mortgage simulator

Public form on `/mortgage-credit` (the landing page). It calls `POST /api/v1/mortgage-credit` through
`MortgageCreditService` (`core/services/mortgage-credit-service/`); the types are in
`core/models/mortgage-credit.model.ts` and the limits in `core/models/simulation-limits.model.ts`.

Its translations (`public/i18n/mortgage-credit/`, keys `mortgageCredit.*`) are also used by the back-office
screens that show a dossier's schedule, such as `pages/admin/demands/demand-detail/simulation-details`.
Check those screens before renaming a key.

The investment simulator is a separate product: [`pages/investment-credit`](../investment-credit).
