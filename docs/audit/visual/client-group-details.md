# Client group details visual audit

## Reference evidence

- F:\Wakandi\clients-group-1789\FULL.png and numbered captures 01 through 20.
- Canonical AIMSCAMS route: /clients/groups/[id].
- The reference page has a group summary card, a twelve-tab detail strip, membership/contact/meeting sections, a member list, and separate views for users, accounts, charges, residence, KYC, income, assets, bank, history, and statements.
- The screenshots contain production data; only layout and behavior patterns are used as reference.

## Findings

The previous AIMSCAMS page showed only a small summary and member table. It did not reproduce the summary card, the tab navigation, or the detail sections. AIMSCAMS exposes group/member data, membership/branch/loan-officer lookups, and loan, loan-application, and savings-account lists. It has no group-detail data endpoints for users, charges, residence, KYC, income, assets, bank, history, or statements.

## Changes

- Rebuilt the page summary with group name/reference, status, member count, meeting schedule, branch, and manager.
- Added the reference tab order: Details, Members, Users, Accounts, Charges, Residence, KYC, Income, Assets, Bank, History, Statement.
- Added membership, contact, and meeting detail sections populated from the AIMSCAMS group profile and available lookups.
- Expanded the Members table to show the available AIMSCAMS member fields.
- Connected Accounts to loan, loan-application, and savings-account lists, with exact client-name/reference filtering and links that carry the selected group into new-account forms.
- Kept text sizing and tab/control geometry on shared v1.2.0 tokens.
- Tabs without a supporting AIMSCAMS data endpoint are marked unavailable; Accounts reads existing AIMSCAMS records. No production Wakandi data was copied or fabricated.

## Verification

- npm run typecheck --prefix apps/web passes.
- Browser visual verification remains pending. The visible local browser is signed out at /login, and no local group record is available. No sample records were created.

## Status

The summary, Details, Members, and Accounts sections are connected to available AIMSCAMS data. Remaining tabs need their own data endpoints and workflows. Full visual parity remains pending a signed-in browser comparison with a local synthetic group.