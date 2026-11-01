# Account Import Batches visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\import-account\FULL.png`  
AIMSCAMS route: `/import-account`

## Comparison

The reference shows an Account Import title card with Upload Account and Account Template actions, a search/status/add-filter toolbar, a table-column control, and a persistent empty batch table. Columns are Id, File, Batch Reference Id, Date, Template Type, Status, Total Records, Uploaded Records, and Uploaded By.

AIMSCAMS now uses the shared import-batches page used by Member Import, with the account-specific heading, actions, and Template Type column. Search supports batch reference, file name, and id; status/date filters operate on the existing local batch response. The account template downloads the CSV headers supported by the local wizard. The organization has no account-import batches, and the API does not provide template type or uploader metadata, so neither is invented.

The reference has no real account-import row to copy. No account file was selected or imported; no account records or balances were created.

## Remaining work

- Connect import creator and template type metadata, and row actions, to the import service.
- Review a populated batch after a supported local file-upload flow is available.
- Recapture and run the canonical screenshot diff; the stored metrics compare against the old standalone empty card and are stale.
