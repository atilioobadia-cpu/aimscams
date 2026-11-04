# Import parity notes

Reference inspected live in Wakandi with the authenticated session at a 1225x567 CSS viewport. Inspection remained read-only; Upload and Template actions were not activated.

## Navigation

Import has three destinations: Member, Account, and Transaction. The local sidebar uses the same three destinations.

## Wakandi measurements observed

- Page title is an unboxed row; title text begins near x=264.5, y=98.9. The two right-aligned actions are about 29px tall, teal outlined, and use a 6px radius.
- Toolbar is a separate white panel at x=214.1, y=162.6, width=997.1, height=56.4, with a light gray 1px border and 6px radius.
- Search control is about 191x34px. Status control is about 76x35px. The status filter opens a condition/value popover with Clear and Apply.
- Table starts at y=219.0. Header row is about 38.95px tall, with #f8fafc fill, #495057 text, and 10.08px vertical / 13.44px horizontal cell padding. Data rows are about 52.27px tall.
- Account Import includes a Template Type column. Member and Transaction Import do not.
- Empty Account Import table is about 210px tall including its header; empty state is centered.
- The observed status filter values are Uploaded, In Progress, New, Verified, Submitted, Error, Success, Archive, Deleted, Deleting, and Pending.

## AIMSCAMS implementation

`ImportBatchesPage` is shared by Member, Account, and Transaction. It now uses the unboxed title row, compact title actions, a separate compact toolbar, a Wakandi-style status condition/value popover, a width-constrained table, compact header/data row padding, and a centered empty state. The local typography scale remains based on the existing v1.2.0 application sizing; compact action labels use the measured Wakandi button size.

The local table can only show rows supplied by the local import-batch API. No Wakandi records or production file/member data were copied. Upload and template actions remain local-only.

## Verification limits

The Member Import reference included one existing historical row. Local import data is empty, so visual verification covered the empty state and controls rather than row-level data parity. Import route changes were checked in the visible Chrome session. No automated test suite was run.
