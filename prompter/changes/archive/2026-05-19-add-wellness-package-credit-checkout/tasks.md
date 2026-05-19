## 1. Implementation
- [x] 1.1 Add schema support for consultation credit state on `users` and package-purchase metadata on `payments`, then update the related Eloquent models and factories.
- [x] 1.2 Award consultation credit after successful consultation payment and persist the expiry window and source-payment linkage needed to validate later package purchases.
- [x] 1.3 Add patient package browsing and checkout endpoints plus the Inertia page that show original price, credit applied, final payable amount, and eligibility state.
- [x] 1.4 Extend payment orchestration so package checkout creates discounted Midtrans payment attempts when a remaining balance exists and immediately activates the package when the remaining balance is zero.
- [x] 1.5 Extend package activation and notification flows so successful package purchases consume the consultation credit exactly once, create the `user_packages` entitlement, and queue the activation confirmation.
- [x] 1.6 Add feature coverage for credit award, expiry and completion eligibility rejection, funded package settlement, zero-balance activation, duplicate webhook safety, and activation notification dispatch.
- [x] 1.7 Run focused validation for the affected Laravel feature tests and any frontend build or test commands required by the new patient package page.

## Post-Implementation
- [x] Update root `AGENTS.md` if the implemented package-credit workflow introduces project guidance that future assistants need.
