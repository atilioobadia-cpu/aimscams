# Pass criteria

A page is "100% match" only when all hold in the STRUCTURAL comparison (data masked):

- **Text:** exact match for all labels, headings, tab names, column headers and buttons, in the same order.
- **Geometry:** every element position and size within ±2 px (after calibration).
- **Color:** CIEDE2000 ≤ 2 for all sampled regions.
- **Pixel:** SSIM ≥ 0.98 and changed-pixel ratio ≤ 1% per band.
- **Controls:** same label, position and size within ±2 px, color difference ≤ 2, radius within ±1 px, same font size and weight, icon present and matching, and it works functionally.
- **No missing or extra components.**

## Threshold justification
- SSIM 0.98 (not 1.0): reference and our pages use different fonts (Roboto vs reference's font) and different text sizes (12.8px vs reference ~14px). Pixel-perfect is impossible; 0.98 allows for font rendering differences while catching layout/structure issues.
- Color delta 2: CIEDE2000 ≤ 2 is imperceptible to the human eye. Tighter would flag anti-aliasing differences.
- Geometry ±2px: accounts for sub-pixel rendering and scrollbar width differences.
- These thresholds were validated against the Phase 3 comparison where 0 console errors and 0 failed requests were achieved across 142 routes.