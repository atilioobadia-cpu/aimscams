# Shared header profile menu

## Wakandi reference

The read-only profile menu inspection showed account contact links for email and phone, a My Groups action, and Logout. The local header previously showed the user name and role, disabled Profile and Settings entries, and Sign out.

## AIMSCAMS alignment

- The menu displays the authenticated account email and phone when present.
- Email and phone use `mailto:` and `tel:` links.
- My Groups opens the Clients page with the Group type filter selected.
- Logout keeps the existing local sign-out request and user-facing error state.
- The header continues to show the user's full name next to the avatar.

The local API has no user-scoped My Groups endpoint or membership relation. The menu therefore opens the existing group client list, not a user-specific group list. The Wakandi screenshot did not establish matching local data or actions beyond these menu entries.

## Initial verification status

At first implementation, the in-app AIMSCAMS tab was on `/login` and the authenticated menu could not be rechecked. The build compiled, but TypeScript validation was blocked by errors in the pre-existing Create Client draft (`apps/web/src/app/(app)/clients/create/page.tsx`). The local account menu has since been rechecked below.

## Re-review — 2026-11-01

- Reopened AIMSCAMS `/dashboard` in the visible in-app browser and opened the account menu. It shows the authenticated email and phone links, `My Groups`, and `Logout`; the header shows institution name/registration, language, branch/status, avatar, and full user name.
- Compared the supplied Wakandi Teller reference header (`F:\Wakandi\transaction-teller-transaction\FULL.png`): the reference account avatar uses a warm coral-to-peach fill. AIMSCAMS used a blue gradient, so the local avatar gradient now uses the matching warm range. Initials and account name remain dynamic because the authenticated identities differ.
- No Wakandi control was submitted or changed. A fresh live profile-menu comparison remains limited by the Windows browser URL verification guard; the local menu was visually rechecked in the visible browser.

## Live comparison — 2026-11-02

- Compared the authenticated profile menu directly in the visible Wakandi Chrome session and local AIMSCAMS `/dashboard`; Wakandi was read-only.
- Both menus are 280px wide and contain email, phone, a groups link, and logout. Wakandi uses `MyGroups` and lowercase `logout`; AIMSCAMS retains sentence-case labels (`My groups`, `Log out`) per the repository UI rule.
- AIMSCAMS menu surface is aligned to the observed 6px corner radius and subtle `0 2px 12px rgba(0, 0, 0, 0.1)` shadow. The full name remains visible beside the avatar.
- Verified visually in Chrome after the local hot refresh. No font, header, sidebar, or menu width tokens changed; v1.2.0 shell sizes remain 12.8px base type, 68px header, 204px sidebar, and 18px content inset.
- Phase 1 (shared header/profile menu) is complete. Next: Phase 2 Dashboard content review, then Phase 3 Clients. Use at most one existing local sample record when a UI state needs data; add none during this header pass.
