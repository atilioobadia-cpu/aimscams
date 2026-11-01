# Member Import Batches visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\import-member\FULL.png`  
AIMSCAMS route: `/import-member`

## Comparison

The reference shows a Member Import title card with Upload Member and Member Template actions, a search/status/add-filter toolbar, a table-columns control, and a persistent batch table with Id, File, Batch Reference Id, Date, Status, Total Records, Uploaded Records, and Uploaded By.

AIMSCAMS now renders the matching title/actions and the filter/table structure in the visible browser. Search supports reference, filename, and batch id; Status and date filters operate on the local batch response; the member template downloads the supported CSV column header. The list response contains no member-import batches, so the empty state stays inside the table. The API does not expose Uploaded By or the reference activation/actions data, so these fields are unavailable rather than invented.

The reference row contains real organization data and was not copied. A synthetic CSV was prepared for QA, but the in-app browser did not attach the local file through its file chooser; no import was submitted and no member was created. No real file or reference data was uploaded.

## Remaining work

- Connect Uploaded By and supported row actions to the import service.
- Review an imported row when a supported local file-upload flow is available.
- Recapture and run the canonical screenshot diff; the saved metrics compare against the previous zero-batch card and are stale.
