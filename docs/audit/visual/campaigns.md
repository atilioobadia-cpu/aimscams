# Campaigns visual audit

Date: 2026-11-04  
Reference: Wakandi navigation lists Run Campaign and Active Campaigns; no matching campaign page captures are available in `F:\Wakandi`.  
AIMSCAMS routes: `/campaigns`, `/active-campaigns`

## Findings

- AIMSCAMS previously exposed only one Campaigns item, while the Wakandi navigation has Run Campaign and Active Campaigns destinations.
- The local campaign data and workflow are not implemented. Both destinations now render a real, clearly gated page rather than leaving Active Campaigns at a 404.
- Page-level visual parity remains unverified because there is no page capture and the live Wakandi session is currently at SSO.

## Review limits

No campaign records were created. The two destinations use the existing shared compact page header and unavailable-state component until a current reference capture and local campaign contract are available.
