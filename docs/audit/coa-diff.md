# Chart of accounts diff (Phase 1)

Generated 2026-10-29T16:28:04.597Z by `tools/ui-audit/coa-validate.mjs`.

## Reference file validation

| Check | Result |
| --- | --- |
| Rows (including top-level) | 137 |
| Rows with a code | 132 |
| Codes unique | yes |
| Every parent exists | yes |
| En dash (U+2013) present | yes |
| Curly apostrophe (U+2019) present | yes |
| Typos kept ("Commision", "Accomodation") | yes |
| No replacement characters | yes |

No validation problems.

## Current system versus reference

- Reference accounts with a code: 132
- Current accounts (live API): 18
- Missing from the system: 115
- Extra in the system (not in reference): 1
- Renamed (same code, different name): 16
- Wrong type (Group/Ledger): 1 (the system has no Group flag, so every group is absent)
- Wrong normal balance: 0
- Accounts with a parent in the system: 0 of 18 (no parent column in `gl_account`)

### Missing from the system

| Code | Name | Type | Parent |
| --- | --- | --- | --- |
| 1000 | CASH AND CASH EQUIVALENTS | Group | Assets |
| 1001 | AIMSCAMS | Ledger | 1000 |
| 1011 | Teller 2 | Ledger | 1010 |
| 1012 | Teller 1 | Ledger | 1010 |
| 1100 | SHORT TERM INVESTMENTS | Group | Assets |
| 1200 | TOTAL LOANS | Group | Assets |
| 1202 | EMERGENCY LOAN | Ledger | 1200 |
| 1203 | BUSINESS LOAN | Ledger | 1200 |
| 1204 | HOUSING LOAN | Ledger | 1200 |
| 1206 | SUSPENSE ON LOAN | Ledger | 1200 |
| 1300 | CUMULATIVE LOAN LOSSES | Group | Assets |
| 1400 | INTEREST AND EXPECTED FEES | Group | Assets |
| 1500 | CURRENT ASSETS | Group | Assets |
| 1501 | Prepaid Corporate Tax | Ledger | 1500 |
| 1502 | Loan Processing Fees Receivable | Ledger | 1500 |
| 1503 | Staff Advances/Receivables | Ledger | 1500 |
| 1504 | Prepaid Expenses | Ledger | 1500 |
| 1600 | LONG - TERM INVESTMENTS | Group | Assets |
| 1700 | NON-CURRENT ASSETS | Group | Assets |
| 1701 | Furniture & Fittings | Ledger | 1700 |
| 1702 | Office Equipment | Ledger | 1700 |
| 1703 | Motorbikes for Agents | Ledger | 1700 |
| 1704 | GPS Trackers | Ledger | 1700 |
| 1705 | Fireproof Safe & Cabinets | Ledger | 1700 |
| 1706 | Software Licenses | Ledger | 1700 |
| 1707 | Leasehold Improvements | Ledger | 1700 |
| 2000 | CURRENT LIABILITIES | Group | Liabilities and Owners Equity |
| 2002 | AIMSCAMS Charges | Ledger | 2000 |
| 2003 | Insurance premiums | Ledger | 2000 |
| 2006 | Staff Salaries Payable | Ledger | 2000 |
| 2007 | Interest Payable to Lenders | Ledger | 2000 |
| 2008 | Deferred Loan Income | Ledger | 2000 |
| 2009 | Accrued Expenses | Ledger | 2000 |
| 2010 | Down Payment | Ledger | 2000 |
| 2011 | Tax Payable | Ledger | 2000 |
| 2100 | INTEREST DEBTS | Group | Liabilities and Owners Equity |
| 2200 | MEMBERS SAVINGS AND DEPOSITS | Group | Liabilities and Owners Equity |
| 2300 | SHORT - TERM LOANS | Group | Liabilities and Owners Equity |
| 2400 | LONG - TERM LOANS | Group | Liabilities and Owners Equity |
| 2401 | Long-term Loans from Lenders | Ledger | 2400 |
| 2500 | UNPAID EXPENSES | Group | Liabilities and Owners Equity |
| 2501 | Accumulated depreciation | Ledger | 2500 |
| 2600 | SUSPENDED INCOME | Group | Liabilities and Owners Equity |
| 2700 | POSTPONED SUBSIDIES | Group | Liabilities and Owners Equity |
| 3000 | MEMBERS SHARES | Group | Capital Account |
| 3100 | PROFIT/ LOSS | Group | Capital Account |
| 3101 | PROFIT AND LOSS A/C | Ledger | 3100 |
| 3200 | ACCUMULATION OF PROFIT / LOSS FOR THE RELEVANT YEAR | Group | Capital Account |
| 3300 | ACCUMULATION OF PROFIT / LOSS FOR THE PAST YEARS | Group | Capital Account |
| 3400 | CHANGE OF OWNER'S EQUITY | Group | Capital Account |
| 3401 | Education Fund | Ledger | 3400 |
| 3402 | Statutory Reserve Funds | Ledger | 3400 |
| 3403 | Share Transfer Fund | Ledger | 3400 |
| 3405 | Retained Earning | Ledger | 3400 |
| 3406 | Grants | Ledger | 3400 |
| 3407 | Insurance Fund | Ledger | 3400 |
| 3408 | Revaluation Reserves | Ledger | 3400 |
| 3409 | Bad And Doubtful Debts Provision | Ledger | 3400 |
| 4000 | INTEREST INCOME | Group | Incomes |
| 4002 | INTEREST INCOME ON EMERGENCY LOAN | Ledger | 4000 |
| 4003 | INTEREST INCOME ON HOUSING LOAN | Ledger | 4000 |
| 4004 | INTEREST INCOME ON BUSINESS LOAN | Ledger | 4000 |
| 4005 | INTEREST INCOME ON STAFF LOAN | Ledger | 4000 |
| 4100 | OTHER INCOME FROM LOANS | Group | Incomes |
| 4102 | DEVICE TRACKING FEE | Ledger | 4100 |
| 4103 | LOAN RESTRUCTURING FEE | Ledger | 4100 |
| 4200 | OTHER INCOME | Group | Incomes |
| 4201 | Insurance Commision | Ledger | 4200 |
| 4202 | Income from Sale of Repossessed Assets | Ledger | 4200 |
| 4203 | Subscription Fees | Ledger | 4200 |
| 4204 | Other Operational Income | Ledger | 4200 |
| 4300 | INCOME TO GENERATE INVESTMENTS | Group | Incomes |
| 4400 | SUBSIDIES | Group | Incomes |
| 4500 | OTHER REVENUES | Group | Incomes |
| 5000 | LOAN EXPENSES | Group | Expenses |
| 5002 | Field Transport (Loan Monitoring) | Ledger | 5000 |
| 5003 | Loan Loss Provision | Ledger | 5000 |
| 5005 | Fuel – Motorbikes | Ledger | 5000 |
| 5100 | HR & DEVELOPMENT | Group | Expenses |
| 5101 | Subscriptions | Ledger | 5100 |
| 5102 | Training & Team Building | Ledger | 5100 |
| 5103 | Consultancy Fees | Ledger | 5100 |
| 5104 | Director’s Fees | Ledger | 5100 |
| 5105 | Volunteers/Ambassadors Stipends | Ledger | 5100 |
| 5106 | NHIF Medical Insurance | Ledger | 5100 |
| 5107 | Repairs & Maintenance | Ledger | 5100 |
| 5108 | Board Expenses | Ledger | 5100 |
| 5109 | Tea/Coffee & Staff Meals | Ledger | 5100 |
| 5200 | ADMINISTRATIVE COSTS | Group | Expenses |
| 5201 | Salaries & Wages – All Staff | Ledger | 5200 |
| 5202 | Rent | Ledger | 5200 |
| 5203 | Utilities (Electricity, Water) | Ledger | 5200 |
| 5204 | Internet & Communications | Ledger | 5200 |
| 5205 | Stationery & Printing | Ledger | 5200 |
| 5206 | Cleaning Services | Ledger | 5200 |
| 5207 | Advertising & Promotion | Ledger | 5200 |
| 5208 | Office Supplies | Ledger | 5200 |
| 5209 | Professional Fees | Ledger | 5200 |
| 5210 | Insurance | Ledger | 5200 |
| 5211 | License & Regulatory Fees | Ledger | 5200 |
| 5212 | Software Subscription & Maintenance | Ledger | 5200 |
| 5213 | Current year depreciation | Ledger | 5200 |
| 5214 | Travelling Allowance and Accomodation | Ledger | 5200 |
| 5215 | Marketing and Advertisement | Ledger | 5200 |
| 5216 | NSSF Contribution | Ledger | 5200 |
| 5217 | S/Duty Lease | Ledger | 5200 |
| 5300 | BUSINESS COSTS | Group | Expenses |
| 5400 | EQUIPMENT COSTS | Group | Expenses |
| 5401 | Current year depreciation | Ledger | 5400 |
| 5500 | OTHER COSTS | Group | Expenses |
| 5501 | AIMSCAMS Fees | Ledger | 5500 |
| 5600 | OFFICE COSTS | Group | Expenses |
| 5700 | ESTATE EXPENSES | Group | Expenses |
| 5800 | TRAVEL COSTS | Group | Expenses |
| 5900 | SYSTEM COSTS | Group | Expenses |

### Extra in the system

| Code | Name | Normal balance |
| --- | --- | --- |
| 2101 | Member savings | credit |

### Renamed

| Code | System name | Reference name |
| --- | --- | --- |
| 1002 | Cash on hand | Cash on Hand |
| 1003 | Bank - CRDB | BANK CRDB |
| 1005 | Bank - NMB | BANK NMB |
| 1010 | Teller cash | TELLERS |
| 1201 | Loans receivable | ASSET LOAN |
| 1205 | Staff loans | STAFF LOAN |
| 1505 | Interest receivable | Interest Receivable |
| 2001 | Tax payable | Tax Payable (Current tax liabilities) |
| 2005 | Accounts payable | Accounts Payable |
| 3404 | Share capital | Share Capital |
| 4001 | Interest income - loans | INTEREST INCOME ON ASSET LOAN |
| 4101 | Loan management fee | LOAN MANAGEMENT FEE |
| 4104 | Loan penalty | LOAN PENALTY |
| 5001 | Interest expense - member savings | Tracker Device Purchase & Installation |
| 5004 | Write-off - bad loans | Write-off – Bad Loans |
| 5502 | Bank charges | BANK CHARGES |

### Normal balance mismatch

| Code | System | Reference (by root) |
| --- | --- | --- |

### Structure not represented

- The reference hierarchy (Group rows and parents) has no counterpart: `gl_account` has no `parent_id` and no group flag.
- Posting policies in `packages/ledger/src/seed.ts` use codes that have no reference equivalent (for example `2101` Member savings, which is absent from the reference). Those policies must be remapped before any renumbering, and every ledger line posted under a renamed code must be re-pointed by a reversal-free migration.

## Result

The system does not match the reference. 115 reference accounts are absent, 1 system accounts have no reference equivalent, and the hierarchy is not modelled at all. Phase 5 must add a parent/group model before the chart can match.
