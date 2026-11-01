# Visual audit tooling

Verified 2026-11-01 on the AIMSCAMS development workstation.

## Browser and runtime

| Tool | Version / state |
|---|---|
| Node.js | 24.16.0 |
| npm | 11.13.0 |
| Playwright | 1.64.1, installed under `tools/ui-audit` |
| Playwright Chromium | Managed Chromium revision 1248; executable present |
| Python | 3.12.10 |

The visible in-app browser is authenticated at the local AIMSCAMS dashboard. Browser navigation and DOM snapshots were verified there using Playwright. The in-app browser remains the visible surface for page checks. The repeatable capture harness may use its own Playwright-managed Chromium context to produce full-resolution captures for pixel analysis.

## Image and OCR tooling

| Tool | Version / state |
|---|---|
| Pillow | 12.3.0 |
| NumPy | 2.5.1 |
| OpenCV | 5.0.0 |
| scikit-image | 0.26.0 |
| pytesseract | 0.3.13 |
| pandas | 3.1.0 |
| RapidOCR | 1.4.4 |
| Tesseract | 5.4.0.20240606; `eng` and `osd` data installed |

Tesseract executable: `C:\Program Files\Tesseract-OCR\tesseract.exe`. It is not on the current process PATH; the audit code must set pytesseract's executable path explicitly. EasyOCR and ImageMagick are not installed. ImageMagick is optional; Pillow/OpenCV cover the required image operations.

## Data handling

Reference images remain on `F:\Wakandi`; do not copy full screenshots or OCR text containing member records into tracked files. Keep generated screenshots and OCR caches under ignored `artifacts/`. Committed crops may include UI controls only and must exclude names, identifiers, balances, and other member data.

The existing comparison capture script contains inline local login and MFA values. Do not run or reproduce those values. Refactor the audit capture to use the ignored local storage-state artifact, and keep all authentication material out of reports and commits.
