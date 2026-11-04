# Run Campaign parity pass

Status: empty-state page matched to the live Wakandi reference and verified in the visible local tab.

## Wakandi reference

Inspected at `/campaigns` in the authenticated live session, read-only. At a 1225 by 567 CSS-pixel viewport:

- Title card: x=213, y=78, w=998, h=66px; white surface, 1px light border, 8px radius. Title is 20.16px Roboto with a 20px teal megaphone icon.
- Recommended campaigns card: x=213, y=158, w=998, h=264px; white surface, light border, 8px radius, 20.16px padding.
- Section title: x=234, y=179, 15.456px, weight 600. Supporting text: y=199, 11.76px.
- Centered empty state: inbox icon 34px; title y=304 at 14.784px; description y=332 at 12.768px in a 376px text column.
- No action buttons or data-creation controls appear on this page.

## AIMSCAMS change and verification

- Replaced the `In build` placeholder with the same Campaigns title card, Recommended campaigns section, and centered no-campaigns empty state.
- Matched the card heights, border/radius, content padding, typography, icon box, and text positions to the live measurements.
- Verified in the visible local browser. Local card bounds are x=213.32/y=78.67/w=998.69/h=66 and x=213.32/y=158.67/w=998.69/h=264; section text and empty-state element positions match the reference within about 1px.
- AIMSCAMS still uses its 12.8px v1.2.0 body baseline globally; the page-specific typography above follows the measured reference values.

## Notes

Wakandi showed no published campaign records, so no sample content was invented and no production data was changed. The local page intentionally keeps the same empty state until local campaign data exists.
