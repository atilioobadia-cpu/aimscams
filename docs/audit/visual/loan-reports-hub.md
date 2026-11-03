# Loan Reports hub visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\reports-loan\FULL.png`  
AIMSCAMS route: `/reports-loan`

## Comparison

The reference and current AIMSCAMS page use a Loan Reports title card and a four-column set of compact report links with info icons in the same sequence. The reference includes Loan Repayment Schedule Report between Loan Repayment Report and Paid Off Loans Report; that destination now has a local route using the shared report shell.

## Changes and browser review

- The title card, card ordering, compact four-column links, and info icons were verified in the visible browser against the reference.
- Added the missing Loan Repayment Schedule Report destination and report-specific empty table shell. The available reference set has no capture for this report page, so its exact filters and columns remain unverified; the column labels are based on the existing loan schedule and expected-repayment contracts.

Implementation commit: 8875cd3 (feat/web: align loan reports hub with reference); schedule destination added 2026-11-04.


