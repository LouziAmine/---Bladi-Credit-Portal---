[Back to README](../../README.md) · [Application Overview](../business-workflow.md)

# User Guide

Every screenshot on this page is produced by the Playwright suite (`npm run test:e2e`) against the real API
on its `dev` profile, with fictitious Moroccan companies and people. Running the suite refreshes them all
(`docs/screenshots/e2e/`), so the guide always shows the current screens.

- [1. Mortgage simulator](#1-mortgage-simulator)
- [2. Investment simulator](#2-investment-simulator)
- [3. Accounts and sign-in](#3-accounts-and-sign-in)
- [4. Back office: an investment dossier from start to finish](#4-back-office-an-investment-dossier-from-start-to-finish)
- [5. Back office: mortgage dossiers](#5-back-office-mortgage-dossiers)
- [6. Client portal](#6-client-portal)
- [7. Parameters and reference data](#7-parameters-and-reference-data)
- [8. Users and audit log](#8-users-and-audit-log)
- [9. Languages and mobile](#9-languages-and-mobile)

## 1. Mortgage simulator

The landing page. Anyone can simulate without an account.

**Conventional loan accepted**: rate, monthly payment, insurance, fees, TEG and total cost.

![Conventional mortgage accepted](../screenshots/e2e/simulation/01-conventional-accepted.png)

**Mourabaha accepted**: profit margin, VAT and the all-inclusive installment, no interest rate.

![Mourabaha accepted](../screenshots/e2e/simulation/02-mourabaha-accepted.png)

**Repayment schedule**, month by month (conventional, then Mourabaha).

![Conventional schedule](../screenshots/e2e/simulation/04-amortization-schedule-conventional.png)

![Mourabaha schedule](../screenshots/e2e/simulation/20-amortization-schedule-mourabaha.png)

**Co-borrower**: the second income is added to the debt-ratio check.

![Co-borrower](../screenshots/e2e/simulation/03-coborrower-toggle.png)

**Refusals** always say why:

| Rule | Screenshot |
|---|---|
| Age at maturity | ![Age at maturity](../screenshots/e2e/simulation/05-rejected-age-at-maturity.png) |
| Minimum deposit (LTV) | ![Deposit](../screenshots/e2e/simulation/13-rejected-ltv-deposit-insufficient.png) |
| Debt ratio | ![Debt ratio](../screenshots/e2e/simulation/14-rejected-debt-ratio-exceeded.png) |
| Duration for the profile | ![Duration](../screenshots/e2e/simulation/15-rejected-duration-out-of-range.png) |

**Form checks** run before any call to the API.

![Required fields](../screenshots/e2e/simulation/07-required-field-validation.png)

## 2. Investment simulator

**Eligible company** (PME, then GE): the result shows the dossier reference opened for the bank.

![PME eligible](../screenshots/e2e/investment-credit/02-pme-eligible.png)

![GE eligible](../screenshots/e2e/investment-credit/03-ge-eligible.png)

**Refusals**: company too young, financing above the revenue ratio, guarantees too low, debt service too high.

| Rule | Screenshot |
|---|---|
| Company age | ![Too young](../screenshots/e2e/investment-credit/05-rejected-company-too-young.png) |
| Financing ratio | ![Financing ratio](../screenshots/e2e/investment-credit/06-rejected-financing-ratio.png) |
| Guarantee coverage | ![Guarantees](../screenshots/e2e/investment-credit/07-rejected-guarantee-coverage.png) |
| Debt service | ![Debt service](../screenshots/e2e/investment-credit/08-rejected-debt-service.png) |

## 3. Accounts and sign-in

**Register**: the password must be complex enough; a username can only be used once.

![Password complexity](../screenshots/e2e/register/01-password-complexity-validation.png)

![Registered](../screenshots/e2e/register/03-register-success.png)

**Log in**, with the error shown for wrong credentials.

![Wrong credentials](../screenshots/e2e/auth/03-login-invalid-credentials.png)

![Logged in](../screenshots/e2e/auth/04-login-success.png)

**Session safety**: no token is readable by the page, and the cookies are `HttpOnly` and `SameSite=Strict`.

![No token in storage](../screenshots/e2e/security/03-no-token-in-storage.png)

![Cookie flags](../screenshots/e2e/security/04-cookies-httponly-samesite.png)

## 4. Back office: an investment dossier from start to finish

**Dossier list**, filtered by status, type and search.

![Dossier list](../screenshots/e2e/demand-workflow/01-demands-list-filtered.png)

**Classification**: the simulated BAM check helps decide; the dossier is confirmed as real and attached to
its company.

![BAM check](../screenshots/e2e/demand-workflow/03-bam-verification.png)

![Classification form](../screenshots/e2e/demand-workflow/04-classification-form.png)

![Classified](../screenshots/e2e/demand-workflow/06-classified-real.png)

**Assignment and remarks.**

![Reassigned](../screenshots/e2e/demand-workflow/07-reassigned.png)

![Remark](../screenshots/e2e/demand-workflow/08-remark-added.png)

**Documents**: wrong file types and infected files are refused; a new version replaces the old one; files
open in a viewer.

![Infected file refused](../screenshots/e2e/demand-workflow/10-document-infected-refused.png)

![Versions](../screenshots/e2e/demand-workflow/11-documents-versioned.png)

![Viewer](../screenshots/e2e/demand-workflow/12-document-viewer.png)

**Request a document from the client.**

![Document requested](../screenshots/e2e/demand-workflow/13-document-requested.png)

**Advance or return**: only the eligible profile can act; a dossier can go back one step with a reason.

![Locked for others](../screenshots/e2e/demand-workflow/14-advance-locked-for-others.png)

![Advance form](../screenshots/e2e/demand-workflow/15-advance-form.png)

![Returned](../screenshots/e2e/demand-workflow/16-returned-for-completion.png)

**Committee rules**: a deferred dossier must go back; a rate above the legal ceiling is refused.

![Deferred](../screenshots/e2e/demand-workflow/17-decision-deferred-refused.png)

![Above TMIC](../screenshots/e2e/demand-workflow/18-decision-rate-above-tmic.png)

**Credit granted**, insurance confirmed, then the credit file opens with its schedule.

![Granted](../screenshots/e2e/demand-workflow/19-credit-granted.png)

![Insurance missing](../screenshots/e2e/demand-workflow/20-insurance-missing.png)

![Credit file](../screenshots/e2e/demand-workflow/21-completed-credit-file.png)

**Notification bell**, updated live.

![Notifications](../screenshots/e2e/demand-workflow/22-notifications.png)

## 5. Back office: mortgage dossiers

**Instruction**, then the **four-eyes rule**: the instructor cannot take the decision; a second person does.

![Instruction](../screenshots/e2e/mortgage-workflow/01-mortgage-instruction.png)

![Four-eyes](../screenshots/e2e/mortgage-workflow/02-four-eyes-violation.png)

![Second pair of eyes](../screenshots/e2e/mortgage-workflow/03-decided-by-second-eyes.png)

**Refusal by the committee** (the applicant is told by e-mail) and the rejected-dossiers filter.

![Refused](../screenshots/e2e/mortgage-workflow/04-committee-refused.png)

![Rejected filter](../screenshots/e2e/mortgage-workflow/05-rejected-filter.png)

**Mourabaha credit file**, then the **borrower** invited by e-mail finds the dossier and declares a payment.

![Mourabaha credit file](../screenshots/e2e/mortgage-workflow/06-mourabaha-credit-file.png)

![Borrower portfolio](../screenshots/e2e/mortgage-workflow/08-borrower-portfolio.png)

![Payment declared](../screenshots/e2e/mortgage-workflow/09-borrower-payment-declared.png)

## 6. Client portal

**Invitation**: the person sees who invites them and creates their account.

![Invitation](../screenshots/e2e/client-portal/01-invitation-preview.png)

**Portfolio, company dossiers and a dossier.**

![Portfolio](../screenshots/e2e/client-portal/03-portfolio.png)

![Company dossiers](../screenshots/e2e/client-portal/04-enterprise-dossiers.png)

![Dossier](../screenshots/e2e/client-portal/05-dossier-detail.png)

**Requested documents**: an infected file is refused; the manager sees the request fulfilled.

![Infected refused](../screenshots/e2e/client-portal/07-document-infected-refused.png)

![Provided](../screenshots/e2e/client-portal/08-document-provided.png)

**Payments**: the client declares a payment (an invalid RIB is refused), the manager validates or rejects it.

![Invalid RIB](../screenshots/e2e/client-portal/11-declare-invalid-rib.png)

![Declared](../screenshots/e2e/client-portal/12-payment-declared.png)

![Validated and rejected](../screenshots/e2e/client-portal/14-manager-validated-and-rejected.png)

**Early repayment**: the client gets a quote; the manager records a partial or a full repayment.

![Quote](../screenshots/e2e/client-portal/16-client-early-repayment-quote.png)

![Partial repayment](../screenshots/e2e/client-portal/17-partial-early-repayment.png)

![Closed](../screenshots/e2e/client-portal/18-credit-file-closed.png)

**Access to a company**: a claim waits for a manager's approval; access can be revoked; another company's
dossiers stay closed.

![Claim pending](../screenshots/e2e/client-portal/19-claim-pending.png)

![Approved](../screenshots/e2e/client-portal/21-claim-approved.png)

![Access denied](../screenshots/e2e/client-portal/24-access-denied.png)

## 7. Parameters and reference data

**BAM, credit rates and Mourabaha parameters**, with their input checks.

![BAM](../screenshots/e2e/admin-parameters/01-bam-update-success.png)

![Credit rates](../screenshots/e2e/admin-parameters/02-credit-rates-update-success.png)

![Mourabaha](../screenshots/e2e/admin-parameters/04-mourabaha-update-success.png)

**Investment parameters**: a rate above the legal ceiling is refused.

![Above TMIC](../screenshots/e2e/admin-referential/07-investment-parameters-above-tmic.png)

**Activity sectors, enterprises and document suggestions.**

![Sector](../screenshots/e2e/admin-referential/01-activity-sector-created.png)

![Enterprise](../screenshots/e2e/admin-referential/03-enterprise-created.png)

**Excel import**: the report lists each rejected row.

![Import report](../screenshots/e2e/admin-referential/08-demand-import-report.png)

## 8. Users and audit log

**Users**: create staff or client accounts; a manager cannot change their own role.

![Create user](../screenshots/e2e/admin-users/01-create-client-user.png)

![Own role locked](../screenshots/e2e/admin-users/03-self-role-change-disabled.png)

**Audit log**: who did what, when, with the before and after values.

![Audit log](../screenshots/e2e/admin-audit-log/01-audit-log-list.png)

## 9. Languages and mobile

**Arabic** turns the page right to left, refusals included.

![Arabic](../screenshots/e2e/ux/01-arabic-rtl.png)

![Arabic refusal](../screenshots/e2e/ux/02-arabic-rejection.png)

**Phone width**: the menu collapses and a simulation can be completed end to end.

![Mobile menu](../screenshots/e2e/ux/04-mobile-menu-open.png)

![Mobile simulation](../screenshots/e2e/ux/05-mobile-simulation.png)
