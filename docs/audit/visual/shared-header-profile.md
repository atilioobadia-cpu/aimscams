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

## Verification status

The in-app AIMSCAMS tab was on `/login` during this change, so the authenticated dropdown could not be visually rechecked after implementation. The production build compiled the application but TypeScript validation is currently blocked by errors in the pre-existing, uncommitted Create Client draft (`apps/web/src/app/(app)/clients/create/page.tsx`). A final visible menu comparison needs the user to sign in locally.
