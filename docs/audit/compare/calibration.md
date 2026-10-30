# Calibration

## Method
Measured by sampling pixel columns in the reference and our captures on 2026-10-30.
Reference sidebar right edge: 287px (white-to-gray transition at y=400).
Our sidebar right edge: 203px.
Reference header bottom: 95px (white-to-gray transition at x=500).
Our header bottom: 67px.

## DPR determination
| DPR | Ref sidebar (CSS) | Our sidebar (CSS) | Ratio | Ref header (CSS) | Our header (CSS) | Ratio |
|-----|-------------------|-------------------|-------|-------------------|-------------------|-------|
| 1.0 | 287 | 203 | 1.41 | 95 | 67 | 1.42 |
| 1.25 | 230 | 203 | 1.13 | 76 | 67 | 1.13 |
| 1.5 | 191 | 203 | 0.94 | 63 | 67 | 0.94 |
| 2.0 | 144 | 203 | 0.71 | 48 | 67 | 0.71 |

DPR=1.25 gives ratios closest to 1.0 (our CSS ≈ reference CSS). **Selected: DPR 1.25.**

## Selected combination
- **Viewport:** 1470 × 1094 CSS px (1838/1.25 = 1470, 1368/1.25 = 1094)
- **DPR:** 1.25
- **Full-page capture:** yes

## Evidence
- Reference image: 1838 × 1368 px (all screenshots)
- Our page at DPR=1.25, 1470×1094: sidebar 204px CSS, header 68px CSS
- Reference at DPR=1.25: sidebar 230px CSS, header 76px CSS
- Scale factor: 230/204 = 1.13, 76/68 = 1.12 (≈ 1.125×, matching the earlier Phase 2/3 finding)
- Text height: reference body text ~22-25px boxes ≈ 14-18px CSS at DPR=1.25; ours 12.8px

## Previous calibration (WRONG)
The earlier calibration assumed DPR=1 with 1837×1080 viewport. This was incorrect because the reference
images were captured at DPR=1.25. The 1.125× factor was actually the ratio between reference CSS
(at DPR=1.25) and our CSS (at DPR=1), not a CSS scale factor.

## Capture command
Playwright: `page.setViewportSize({ width: 1470, height: 1094 })`, `deviceScaleFactor: 1.25`, full-page screenshot.