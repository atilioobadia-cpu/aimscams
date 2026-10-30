# Calibration

## Method
The reference captures are 1.125× our CSS pixels (confirmed in Phase 2/3):
- Sidebar: 231 px (reference) / 204 px (ours) = 1.132 ≈ 1.125
- Header: 76 px (reference) / 68 px (ours) = 1.118 ≈ 1.125
- 204 × 1.125 = 229.5 ≈ 231, 68 × 1.125 = 76.5 ≈ 76

## Selected combination
- **Viewport:** 1837 × 1080 CSS px
- **DPR:** 1 (device scale factor 1)
- **Full-page capture:** yes (scroll the entire page)

## Evidence
- Reference image width: 1838 px (all screenshots)
- Our page width at 1837×1080: 1822px content + 15px scrollbar = 1837px
- Text height ratio: reference body text ~22-25px boxes ≈ 14px CSS; ours 12.8px (denser by design, D-020)
- The 1.125× factor applies to shell geometry (sidebar, header, row height), not text

## Capture command
Playwright: `page.setViewportSize({ width: 1837, height: 1080 })`, `deviceScaleFactor: 1`, full-page screenshot.