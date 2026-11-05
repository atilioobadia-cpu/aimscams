# AIMSCAMS live Wakandi parity status

Updated: 2026-11-05. Source of truth: currently open live Wakandi and AIMSCAMS browser sessions only. Wakandi is read-only. No screenshots or historical audit evidence are used.

## Status counts

- `NOT_CHECKED`: 1
- `DIFFERENCES_OPEN`: 12
- `FIXED_NEEDS_RECHECK`: 0
- `VERIFIED_MATCH`: 1
- `BLOCKED`: 0

A task is added to this table before its inspection begins. Only `VERIFIED_MATCH` counts as complete. Phase 4 report detail rows will be expanded from the live menu inventory before those pages are inspected.

| Phase | Task | Wakandi route | AIMSCAMS route | State | Last live comparison | Evidence | Commit | Open differences |
|---|---|---|---|---|---|---|---|---|
| 1 Settings | P01-T01 Services | `/settings/service-provider` | `/settings-service-provider` | VERIFIED_MATCH | 2026-11-05 — probe 0 diffs at 1920×1080@1, 1536×864@1.25, 1280×590@1.5 | `docs/audit/parity/P01-T01-services*.md` | `parity(P01-T01): match settings services to live Wakandi` | None |
| 1 Settings | P01-T02 Roles | `/settings/role` | `/settings-role` | DIFFERENCES_OPEN | 2026-11-05 — live list and create form compared | `evidence/P01-T02-roles/` | Not committed | Extra local Manage permissions action; permission default differs; computed CSS and responsive checks pending |
| 1 Settings | P01-T03 Users | `/settings/administrator` | `/settings-administrator` | DIFFERENCES_OPEN | 2026-11-05 — live list, row menu, and create flow compared | `evidence/P01-T03-users/` | Not committed | Create-user flow and row actions differ; filters and computed CSS pending |
| 1 Settings | P01-T04 Auto Debit | `/settings/auto-debit` | `/settings/auto-debit` | DIFFERENCES_OPEN | 2026-11-05 — reference table empty; local page is an In build placeholder | `evidence/P01-T04-auto-debit/` | Not committed | Local Auto Debit functionality/UI surface is missing; CSS pending |

| 1 Settings | P01-T05 Policies | `/settings/policies` | `/settings/policies` | DIFFERENCES_OPEN | 2026-11-05 — all three sections and representative forms inspected | `evidence/P01-T05-policies/` | Not committed | Membership wizard, holidays views/defaults, and holiday form differ; CSS pending |

| 1 Settings | P01-T06 Products — Savings | `/settings/products/savings` | `/settings/products/savings` | DIFFERENCES_OPEN | 2026-11-05 — list and create form compared | `evidence/P01-T06-products-savings/` | Not committed | Create flow differs; model-incomplete controls; computed CSS pending |

| 1 Settings | P01-T07 Products — Loan | `/settings/products/loan` | `/settings/products/loan` | DIFFERENCES_OPEN | 2026-11-05 — list and empty state compared | `evidence/P01-T07-products-loan/` | Not committed | Extra local Add Filters and different empty-state copy; CSS pending |

| 1 Settings | P01-T08 Products — Interest Rate | `/settings/products/interest-rate` | `/settings/products/interest-rates` | DIFFERENCES_OPEN | 2026-11-05 — list and create form compared | `evidence/P01-T08-products-interest-rates/` | Not committed | Extra Add Filters; create workflow and model support differ; CSS pending |

| 1 Settings | P01-T09 Products — Fee & Penalties | `/settings/products/fee-penalties` | `/settings/products/fee-penalties` | DIFFERENCES_OPEN | 2026-11-05 — list and Add Charge form compared | `evidence/P01-T09-products-fees/` | Not committed | Extra local controls and additional fee fields; CSS and reference headers pending |

| 1 Settings | P01-T10 Products — Loan Provisioning | `/settings/products/loan-provisioning` | `/settings/products/provisioning-rules` | DIFFERENCES_OPEN | 2026-11-05 — list and blank create flow compared | `evidence/P01-T10-products-provisioning/` | Not committed | Local create flow exposes unsupported criteria inline; extra Add Filters; CSS and responsive checks pending |

| 1 Settings | P01-T11 Branches | /settings/branch | /settings/branches | NOT_CHECKED | Not inspected | vidence/P01-T11-branches/ | Not committed | Pending live comparison |




| 1 Settings | P01-T12 Accounting settings | /settings/accounting-settings | /settings/accounting | NOT_CHECKED | Not inspected | vidence/P01-T12-accounting-settings/ | Not committed | Pending live comparison |


| 1 Settings | P01-T13 General settings | /settings/account | /settings/general | NOT_CHECKED | Not inspected | vidence/P01-T13-general-settings/ | Not committed | Pending live comparison |


| 2 Business Account | P02-T01 Business Account hub | /core/wba/business-account | /business-account | NOT_CHECKED | Not inspected | vidence/P02-T01-business-account/ | Not committed | Pending live comparison |

