# Guarantors Report visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan-GuarantorsReport\FULL.png`  
AIMSCAMS route: `/reports-loan-GuarantorsReport`

## Comparison

The reference filters by date range, loan status, institution, loan officer, product, and guarantor. Its sortable/filterable grid includes loan officer/product and guarantor savings balance, share capital, and total amount guaranteed; the page has Submit/Clear and Download.

AIMSCAMS displays an as-of date and Refresh with the generic chart-of-accounts table. The guarantor and guarantee fields are missing.

## Recommendations

- Connect a guarantor report query that joins approved loan and member guarantee information.
- Provide the date/status/institution/guarantor filters and the three guarantee totals from that response.
- Validate personal-data visibility and authorization before rendering any guarantor rows.

Browser review was read-only; no report was submitted or downloaded.  
Implementation commit: none; guarantor report query and access contract are absent.
