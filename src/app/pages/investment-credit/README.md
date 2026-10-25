# Investment simulator

Public form on `/investment-credit` for company investment loans. It calls `POST /api/v1/investment-credit`
through `InvestmentCreditService` (`core/services/investment-credit-service/`); the types are in
`core/models/investment-credit.model.ts`, which also exports `EnterpriseType` and `ENTERPRISE_TYPE_OPTIONS`,
used everywhere a company type is chosen.

The rate and eligibility grids are edited on [`pages/admin/investment-credit-parameters`](../admin/investment-credit-parameters).
Company records and client access are separate screens: `pages/admin/enterprises` and
`pages/admin/enterprise-links`.
