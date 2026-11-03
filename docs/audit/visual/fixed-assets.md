# Fixed Assets visual audit

Date: 2026-11-03
Reference: authenticated Wakandi `/accounting/fixed-asset` page, inspected in the visible Chrome session
AIMSCAMS route: `/accounting-fixed-asset`

## Reference behavior observed

- The title card contains `Fixed Assets`, followed by `Add Fixed Asset` and `Import` actions in that order.
- The register starts with a single `Show` filter row. Its filter has Condition operators `Is`, `Is Any Of`, `Is Not`, and `Is None Of`; Value choices are `All`, `Active`, and `Sold & Disposed`.
- The table columns are Asset Name, Asset Number, Asset Type, Purchase Date, Entry Date, Purchase Price (TSh), and an actions control. The empty table state uses an outlined inbox icon and `No data available`.
- `Add Fixed Asset` opens a `Details` panel with a maximize control, close control, a scrollable form, and a fixed Cancel/Save footer. Fields observed: Asset name, Asset / Invoice Number, Asset Purchase Date, Asset Entry Date, Asset Value, Asset Type, Asset Status, Description, Serial Number, Warranty Expiry, Creditor's Ledger, Cash/Journal, Increase in Value, Increase In Value Entry Date, Depreciation Method, Averaging Method, Effective Life (Years), Depreciation during the year, Accumulated depreciation, Fair / Book value, Supplier Name, Supplier Company, and Supplier Address.
- Asset Status choices are `Purchased Asset` and `Fixed Grant Asset`. Depreciation choices are `No Depreciation`, `Straight Line`, and `Diminishing Balance`; averaging choices are `Monthly` and `Yearly`.
- Import opens a dialog with a file selector, `.csv`/`.xlsx` support, a 5 MB limit, a sample-file link, Cancel, and an Import action disabled until a valid file is selected.

## AIMSCAMS changes

- Matched the 70 px title card, 14 px gap, 55 px Show toolbar, 38 px table heading, 170 px empty row, action order, compact control heights, and table columns at the observed 1225 × 567 browser viewport.
- Removed the extra search row and full-width status select. Added the Show condition/value popover.
- Replaced the compact five-field form with a scrollable Details panel and fixed footer. Added the reference fields and payment/depreciation selectors.
- Extended `FixedAsset` persistence and API responses to store the additional reference fields, including entry date and separate notes/description.
- Enabled local CSV/XLSX import with a 5 MB guard, row validation, sample workbook, and explicit user-triggered record creation. No local records were imported during verification.

## Measurement limits

The visible browser screenshot supplied exact rendered viewport geometry for the list. Wakandi's authenticated session expired while reopening the Details form, and its SSO reported that reCAPTCHA could not connect. The current form field order and options were captured from the authenticated page accessibility tree before expiry. DevTools computed CSS values for the form were not available in this pass, so these are screenshot-based viewport measurements rather than claims about Wakandi's underlying CSS rules.

## Verification

- Confirmed the reference list, Show filter choices, form fields/options, ledger selector, and import dialog in the active Wakandi session. No production record was saved or imported.
- Confirmed the local empty register layout and Show popover in the visible Chrome tab.
- Opened the local Details form and confirmed the form scroll region, fields, disabled Save behavior when required data is unavailable, and fixed Cancel/Save footer. No local record was submitted.
- The sample workbook and import parser were added; no file was selected or imported in the visual check.
- Database migrations `20261103130000_fixed_asset_reference_fields` and `20261103142000_fixed_asset_notes` were applied to the local development database.
