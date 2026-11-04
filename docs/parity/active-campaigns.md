# Active Campaigns parity pass

Status: page structure and control sizing matched to the live Wakandi view; campaign data remains unavailable locally.

## Wakandi reference

Inspected at `/active-campaigns` in the authenticated live session. The page has a 66px title card and a 290px Running campaigns card. The latter uses 20.16px padding and an inline header with a 468px title/description column and a right-aligned 200 by 34px status selector.

The status selector options are All statuses, Scheduled, Active, Paused, Cancelled, and Completed. The empty/error state is centered with a 34px warning icon, a 14.784px title, a 12.768px status message, and a 60 by 34px Retry button. At inspection time the reference reported “Couldn't load running campaigns” and “Failed to fetch.” Retry was clicked once; it remained read-only and returned the same fetch error.

## AIMSCAMS change and verification

- Replaced the `ComingSoon` placeholder with the measured title card, Running campaigns card, status selector, and centered error state.
- Visible local browser measurement after reload: title card x=213.32/y=78.67/w=998.69/h=66; content card x=213.32/y=158.67/w=998.69/h=290.09; status selector x=991.19/y=179.49/w=200/h=34; Retry link styled as a button x=682.65/y=360.34/w=60.03/h=34.
- The status options match Wakandi. The selector remains a local control; it cannot filter rows while there is no campaign data source.
- AIMSCAMS has no campaigns API implementation. Its honest local error reads “Campaign service isn't connected in the local environment.” Retry returns to the route; it does not claim to fetch data. A campaign service and a real retry request are still needed for behavior parity.

No production data was changed. The empty/error page contains no campaign details to copy.
