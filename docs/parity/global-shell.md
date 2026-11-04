# Global shell parity baseline

Status: incomplete. This pass captured AIMSCAMS live values only; a current Wakandi comparison is not available because the only open Wakandi tab is at SSO. Do not treat these local values as proof of parity.

## AIMSCAMS live baseline

Route: `/active-campaigns`
CSS viewport: 1211.33 × 559.33 px
Device pixel ratio: 1.5
Measurement method: visible Chrome tab, `getBoundingClientRect()` and `getComputedStyle()`.

| Element | AIMSCAMS rect (x, y, w, h) | AIMSCAMS computed values | Wakandi | Difference |
|---|---:|---|---|---|
| `html` | 0, 0, 1211.33, 559.33 | background `rgb(235, 233, 233)`; root font 16px | Not measured this pass | Not available |
| `body` | 0, 0, 1211.33, 559.33 | background `rgb(235, 233, 233)`; Roboto 12.8px / 19.2px; text `rgb(73, 80, 87)` | Not measured this pass | Not available |
| app header | 0, 0, 1211.33, 64.67 | white; Roboto 12.8px / 19.2px; horizontal padding 14px; shadow `rgb(195, 198, 202) 0px 1px 0px 0px` | Not measured this pass | Not available |
| header user name | 1086.94, 25.59, 72.40, 12.80 | Roboto 12.8px / 12.8px, weight 700; clipped overflow | Not measured this pass | Not available |
| sidebar (`aside`) | 0, 64.67, 200, 494.67 | white; Roboto 12.8px / 19.2px | Not measured this pass | Not available |
| sidebar footer | 0, 485.44, 199.33, 73.90 | transparent; padding 6px 8px; flex gap 3px | Not measured this pass | Not available |
| main region | 200, 0, 1011.33, 559.33 | left margin 200px; top padding 64.67px; transparent background | Not measured this pass | Not available |
| chat button | 1105.67, 453.67, 60, 60 | background `rgb(5, 117, 115)`; white; pill radius; shadow `0 10px 15px -3px` plus `0 4px 6px -4px` | Not measured this pass | Not available |

At this viewport the document has no horizontal overflow: client width 1211px and scroll width 1211px. Visible page console returned no warning/error entries in the collected log window. These are AIMSCAMS-only results.

## Required next comparison

1. Restore an authenticated Wakandi session in the visible Chrome tab. Keep Wakandi read-only.
2. Set both apps to the same CSS viewport and DPR, beginning at 1280 × 590 and 1.5 DPR.
3. Measure matching header, sidebar (expanded and collapsed), footer, main content offset, and chat control with bounding boxes and computed styles.
4. Record state and hover/focus differences, then fix shared tokens/components and remeasure before marking this section complete.
5. Repeat at 1536 × 864 and 1920 × 1080; verify no horizontal overflow and capture console warnings/errors.

This baseline does not certify any page or shared component as complete.
