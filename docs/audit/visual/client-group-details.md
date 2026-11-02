# Client group details visual audit

## Reference evidence

- F:\Wakandi\clients-group-1789\FULL.png and numbered captures 01 through 20.
- Canonical AIMSCAMS route: /clients/groups/[id].
- The reference page has a group summary card, a twelve-tab detail strip, membership/contact/meeting sections, a member list, and separate views for users, accounts, charges, residence, KYC, income, assets, bank, history, and statements. The Statement capture shows Start Date, End Date, Submit, Print, and Download controls.
- The screenshots contain production data; only layout and behavior patterns are used as reference.

## Findings

The previous AIMSCAMS page showed only a small summary and member table. It did not reproduce the summary card, the tab navigation, or the detail sections. AIMSCAMS exposes group/member data, membership/branch/loan-officer lookups, loan, loan-application, savings-account, and transaction lists. It has no group-detail data endpoints for users, charges, residence, KYC, income, assets, bank, or history.

## Changes

- Rebuilt the page summary with group name/reference, status, member count, meeting schedule, branch, and manager.
- Added the reference tab order: Details, Members, Users, Accounts, Charges, Residence, KYC, Income, Assets, Bank, History, Statement.
- Added membership, contact, and meeting detail sections populated from the AIMSCAMS group profile and available lookups.
- Expanded the Members table to show the available AIMSCAMS member fields and added the reference Add Group Member modal with search, selection, and permission-gated assignment of an unassigned individual client.
- Connected Accounts to loan, loan-application, and savings-account lists, with exact client-name/reference filtering and links that carry the selected group into new-account forms.
- Connected Statement to the group's transaction records, with Start Date and End Date filters, Submit, pagination, Print, and CSV Download. The API applies the group client ID alongside its existing organisation and branch scope.
- Guarded group assignment in the client update API: only an individual can be assigned, the target must be a group in the same organisation, and an individual already assigned elsewhere cannot be moved through this workflow.
- Kept text sizing and tab/control geometry on shared v1.2.0 tokens.
- Users, Charges, Residence, KYC, Income, Assets, Bank, and History remain unavailable until AIMSCAMS has supporting data endpoints. Accounts and Statement read existing AIMSCAMS records. No production Wakandi data was copied or fabricated.

## Verification

- `npm run typecheck --prefix apps/web` passes.
- `npm run typecheck --prefix apps/api` passes.
- `git diff --check` reports only a pre-existing trailing blank line at the end of `apps/web/src/lib/settings.ts`.
- The group summary monogram is derived from the group name, and its record label is Group rather than Member.
- Browser visual verification remains pending. Chrome UI control stopped because it could not verify the active page URL. The live Wakandi page and a signed-in AIMSCAMS group record were not inspected in this pass. No production data was changed and no sample records were created.

## Status

The summary, Details, Members (including Add Group Member), Accounts, and Statement sections are connected to available AIMSCAMS data. Remaining unavailable tabs need their own data endpoints and workflows. Full visual parity remains pending a signed-in Wakandi comparison and a signed-in AIMSCAMS browser check with a local synthetic group.
