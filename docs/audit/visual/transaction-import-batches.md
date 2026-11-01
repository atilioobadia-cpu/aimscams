# Transaction Import Batches visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\import-transaction\FULL.png`  
AIMSCAMS route: `/import-transaction`

## Comparison

The reference shows a Transaction Import title card with Upload Transaction and Transaction Template actions, a search/status/add-filter toolbar, a table-column control, and a persistent empty table with Id, File, Batch Reference Id, Date, Status, Total Records, Uploaded Records, and Uploaded By.

AIMSCAMS now uses the shared import-batches page with transaction-specific title, icon, actions, and the CSV headers supported by the local transaction wizard. Search supports batch reference, file name, and id; status/date filters operate on the batch response. The local organization has no transaction-import batches, and the API omits uploader metadata and row actions, so no history or operators are fabricated.

The reference has no transaction batch row to copy. No sample transaction was imported because the local wizard would post financial transactions to the ledger; no transaction or balance was created or changed.

## Remaining work

- Connect import creator metadata and row actions to the batch service.
- Review a populated batch when safe, non-posting sample data and a supported upload flow are available.
- Recapture and run the canonical screenshot diff; the stored metrics compare against the old standalone empty card and are stale.
