# Transactions parity checkpoint

## AIMSCAMS navigation

The Transactions sidebar now exposes the same three destinations as Wakandi, in the same order:

1. Teller → `/transaction-teller-transaction`
2. Online → `/transaction-online-transaction`
3. All → `/transaction-all-transaction`

Teller history, Teller approval request, and Reconciliation are not shown as Transactions sub-navigation entries. Their routes and features remain in the application.

## Wakandi reference status

The existing Chrome session redirected from the Teller route to Wakandi SSO. The Teller, Online, and All production pages could not be measured in this pass. No credentials were entered and no production records or filters were changed. Resume the visual and DevTools measurement audit after the user signs in and leaves the reference page available.

## Local page review

- AIMSCAMS Teller, Online, and All routes were opened read-only in the visible Chrome session.
- The sidebar confirmed exactly three children and the routes above.
- No transaction, till, or online collection form was submitted.
- Keep the v1.2.0 global font sizing constraint for the remaining visual work.
