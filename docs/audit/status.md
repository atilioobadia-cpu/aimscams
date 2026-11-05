# AIMSCAMS live Wakandi parity status

Updated: 2026-11-05. Source of truth: currently open live Wakandi and AIMSCAMS browser sessions only. Wakandi is read-only. No screenshots or historical audit evidence are used.

## Status counts

- `NOT_CHECKED`: 0
- `DIFFERENCES_OPEN`: 0
- `FIXED_NEEDS_RECHECK`: 0
- `VERIFIED_MATCH`: 13
- BLOCKED: 2

A task is added to this table before its inspection begins. Only `VERIFIED_MATCH` counts as complete. Phase 4 report detail rows will be expanded from the live menu inventory before those pages are inspected.

| Phase | Task | Wakandi route | AIMSCAMS route | State | Last live comparison | Evidence | Commit | Open differences |
|---|---|---|---|---|---|---|---|---|
| 1 Settings | P01-T01 Services | `/settings/service-provider` | `/settings-service-provider` | VERIFIED_MATCH | 2026-11-05 — probe 0 diffs at 1920×1080@1, 1536×864@1.25, 1280×590@1.5 | `docs/audit/parity/P01-T01-services*.md` | `parity(P01-T01): match settings services to live Wakandi` | None |
| 1 Settings | P01-T02 Roles | `/settings/role` | `/settings-role` | VERIFIED_MATCH | 2026-11-05 — probe 0 diffs at 1920×1080@1, 1536×864@1.25, 1280×590@1.5 | `docs/audit/parity/P01-T02-roles*.md` | `parity(P01-T02): match settings roles to live Wakandi` | None |
| 1 Settings | P01-T03 Users | `/settings/administrator` | `/settings-administrator` | VERIFIED_MATCH | 2026-11-05 — probe 0 diffs at 1920×1080@1, 1536×864@1.25, 1280×590@1.5 | `docs/audit/parity/P01-T03-users*.md` | `parity(P01-T03): match settings users to live Wakandi` | None |
| 1 Settings | P01-T04 Auto Debit | `/settings/auto-debit` | `/settings/auto-debit` | BLOCKED | 2026-11-05 — reference table empty; local page is a 404 (route missing) | `docs/audit/tasks/P01-T04-settings-auto-debit.md` | Not committed | Feature missing entirely; recorded in NEEDS-HUMAN.md |

| 1 Settings | P01-T05 Policies | `/settings/policies` | `/settings/policies` | VERIFIED_MATCH | 2026-11-05 — probe 0 diffs at 1920×1080@1, 1536×864@1.25, 1280×590@1.5 | `docs/audit/parity/P01-T05-policies*.md` | `parity(P01-T05): match settings policies to live Wakandi` | None |

| 1 Settings | P01-T06 Products — Savings | `/settings/products/savings` | `/settings/products/savings` | VERIFIED_MATCH | 2026-11-05 — probe 0 diffs at 1920×1080@1, 1536×864@1.25, 1280×590@1.5 | `docs/audit/parity/P01-T06-savings*.md` | `parity(P01-T06): match settings products savings to live Wakandi` | None |

| 1 Settings | P01-T07 Products — Loan | `/settings/products/loan` | `/settings/products/loan` | VERIFIED_MATCH | 2026-11-05 — probe 0 diffs at 1920×1080@1, 1536×864@1.25, 1280×590@1.5 | `docs/audit/parity/P01-T07-loan*.md` | `parity(P01-T07): match settings products loan to live Wakandi` | None |

| 1 Settings | P01-T08 Products — Interest Rate | `/settings/products/interest-rate` | `/settings/products/interest-rates` | VERIFIED_MATCH | 2026-11-05 — probe 0 diffs at 1920×1080@1, 1536×864@1.25, 1280×590@1.5 | `docs/audit/parity/P01-T08-interest-rates*.md` | `parity(P01-T08): match settings products interest rates to live Wakandi` | None |

| 1 Settings | P01-T09 Products — Fee & Penalties | `/settings/products/fee-penalties` | `/settings/products/fee-penalties` | VERIFIED_MATCH | 2026-11-05 — probe 0 diffs at 1920×1080@1, 1536×864@1.25, 1280×590@1.5 | `docs/audit/parity/P01-T09-fees*.md` | `parity(P01-T09): match settings products fees to live Wakandi` | None |

| 1 Settings | P01-T10 Products — Loan Provisioning | `/settings/products/loan-provisioning` | `/settings/products/provisioning-rules` | VERIFIED_MATCH | 2026-11-05 — probe 0 diffs at 1920×1080@1, 1536×864@1.25, 1280×590@1.5 | `docs/audit/parity/P01-T10-provisioning*.md` | `parity(P01-T10): match settings products provisioning to live Wakandi` | None |

| 1 Settings | P01-T11 Branches | /settings/branch | /settings/branches | VERIFIED_MATCH | 2026-11-05 — probe 0 diffs at 1920×1080@1, 1536×864@1.25, 1280×590@1.5 | `docs/audit/parity/P01-T11-branches*.md` | `parity(P01-T11): match settings branches to live Wakandi` | None |




| 1 Settings | P01-T12 Accounting settings | /settings/accounting-settings | /settings/accounting | VERIFIED_MATCH | 2026-11-05 — probe 0 diffs at 1920×1080@1, 1536×864@1.25, 1280×590@1.5 | `docs/audit/parity/P01-T12-accounting*.md` | `parity(P01-T12): match settings accounting to live Wakandi` | None |


| 1 Settings | P01-T13 General settings | /settings/account | /settings/general | VERIFIED_MATCH | 2026-11-05 — probe 0 diffs at 1920×1080@1, 1536×864@1.25, 1280×590@1.5 | `docs/audit/parity/P01-T13-general*.md` | `parity(P01-T13): match settings general to live Wakandi` | None |


| 2 Business Account | P02-T01 Business Account hub | /core/wba/business-account | /business-account | VERIFIED_MATCH | 2026-11-05 — probe 0 diffs at 1920×1080@1, 1536×864@1.25, 1280×590@1.5 | `docs/audit/parity/P02-T01-business-account*.md` | `parity(P02-T01): match business account to live Wakandi` | None |
| 3 Import | P03-T01 Import | /import | /import | BLOCKED | 2026-11-05 - page is a Coming Soon placeholder; Wakandi has 3 import flows | docs/audit/tasks/P03-T01-import.md | Not committed | Feature missing; recorded in NEEDS-HUMAN.md |
| 4 Reports | P04-T01 Reports hub | /reports | /reports | VERIFIED_MATCH | 2026-11-05 - Wakandi reports page is navigation-only | docs/audit/parity/ | parity(P04-T01) | None |
