# Loan Reports parity pass

Status: compared against the authenticated, live Wakandi Loan Reports hub and aligned in AIMSCAMS.

## Live reference and measurements

Reference: `https://cams.wakandi.co.tz/reports/loan` (read-only). At a 1225 by 567 CSS-pixel viewport, the Wakandi title card is at x=213.44, y=78.10, w=983.13, h=59.58px. It uses an 8px radius, a 1px `#dee2e6` border, approximately 20px horizontal padding, and a 20.16px Roboto semibold title with a 20.16px icon.

The four-column report grid begins at y=151.13px with 13.44px column and row gaps. Cards measure 235.70 by 63.83px, have an 8px radius, no visible border, and a subtle `0 1.68px 3.36px rgba(0,0,0,.075)` shadow. Labels use bold 13.44px text. Long titles wrap to two compact lines. Each card has a separate right-aligned info action; selecting the report title opens that report.

## AIMSCAMS comparison and change

- The shared report-category component now uses the four-column layout from the desktop `lg` breakpoint and the measured 13.44px gaps.
- The header uses the measured 59.58px height, 8px radius, `#dee2e6` border, and title styling.
- Cards use a 63.83px minimum height, measured radius and shadow, and compact 1.2 line-height so two-line labels fit without growing the card. The info action remains separate from the report link.
- The local visible browser was reviewed beside the live Wakandi view at the same viewport. Their title and card grid positions, widths, heights, wrapping, icon placement, and overall row rhythm now align. AIMSCAMS retains the user-requested v1.2.0 body type scale (12.8px).

## Remaining scope

This record covers the Loan Reports category hub only. Report detail pages still need direct comparison for filters, table columns, export actions, and empty states. The other report category hubs and detail pages are tracked in `reports.md`.
