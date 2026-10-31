# Masked regions

Regions masked in both reference and our screenshots before scoring, because they are
unavoidable dynamic or branding values. All coordinates are reference pixels at DPR 1.25.

| Region | Pages | Reason |
|---|---|---|
| Sidebar footer (0,940)-(239,1041) | all | Branding: reference shows "Wakandi", ours shows "AIMSCAMS" wordmark and copyright. |
| Header institution logo (8,8)-(62,62) | all | Tenant asset: reference carries the MFSL logo image; ours falls back to the monogram until a logo is uploaded. |
| Dynamic text (amounts, dates, IDs, names) | per page | Masked automatically by `mask.py` (digits / unknown single words / differing text). |
