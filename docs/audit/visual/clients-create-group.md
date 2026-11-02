# Create Group visual audit

Date: 2026-11-02
Reference: `F:\Wakandi\clients-create-group\FULL.png` and the dated capture in the same folder
AIMSCAMS route: `/clients/create-group`

## Reference observations

The initial reference state has a full-width Create New Group title card with a Cancel action. Membership Details is open and contains required Policy and Branch Name searchable selectors in a two-column row, followed by an optional Relationship Manager selector. A Next button sits at the lower right of the section. Group Details is collapsed and disabled initially. Cancel and Continue actions remain at the bottom of the form.

The reference does not show the inside of Group Details or any post-Next state, so those fields and interactions cannot be scored against the supplied capture.

## AIMSCAMS changes

- Replaced the three-step progress wizard with the reference title card and two accordion sections.
- Added searchable Policy, Branch Name, and Relationship Manager controls backed by the existing local lookup APIs.
- Kept Group Details locked until the required membership selections are made, with the bottom Continue action disabled until a group name is provided.
- Preserved the existing group name, reference number, joining date, and meeting schedule fields under Group Details and passed the selected policy, branch, and manager through the existing group creation request.
- Kept all control heights tied to the shared v1.2.0 size tokens.

## Verification and remaining evidence

TypeScript check passed after the implementation. A visible browser render is still pending: the local tab redirected to `/login` after the development server was restarted, and the user needs to sign in there. No values were entered and no group was created. The two supplied captures show only the initial state, leaving the expanded Group Details state unverified against Wakandi.

## Status

Initial-state structure and fields are implemented. Browser verification and the post-Next comparison remain pending authentication and a Wakandi reference of the expanded Group Details state.
