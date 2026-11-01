# Accounting settings visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\settings-accounting-settings\FULL.png`  
AIMSCAMS route: `/settings/accounting`

## Comparison

The reference uses an Accounting title card and an Inter Branch Setting tab with a tax-rate list/search and an Add Tax Rates dialog. The dialog groups rate name, code, description, active status, and one or more tax components with rate and ledger code. AIMSCAMS shows statutory tax rate and inter-branch ledger controls, a Fiscal periods table, and a Posting policies section. The route currently uses a plain heading/description and includes accounting navigation links rather than a tax-rate manager. The settings concepts overlap, but the reference tax-component catalog is absent.

## Recommendations

- Add the tax-rate catalog and component editor with reference list/modal hierarchy, backed by a dedicated tax-rate model.
- Keep inter-branch posting configuration separate from tax-rate editing, and preserve the local fiscal-period workflow if it is part of AIMSCAMS's approved contract.
- Use the shared settings title-card treatment and remove unrelated accounting links from this page's primary content.

Read-only browser review. No tax, ledger, fiscal period, or posting policy setting was changed. Implementation commit: none.
