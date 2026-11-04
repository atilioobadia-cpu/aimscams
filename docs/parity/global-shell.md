# Global shell parity pass

Status: shell geometry verified at the current desktop width. The available Chrome tabs had different viewport heights, so the vertical viewport dimensions and typography are documented as differences rather than certified as identical.

## Live shell measurements

Measurement method: visible Chrome tabs; `getBoundingClientRect()` and `getComputedStyle()`. Wakandi was read-only.

| Element | Wakandi | AIMSCAMS |
|---|---:|---:|
| Header | `(0, 0, 1225.33, 64.67)` | same |
| Expanded sidebar | `(0, 64.67, 200, 502.67)` | `(0, 64.67, 200, 558.67)` |
| Main viewport | `x=200, y=64.67, w=1025.33, h=502.67`; overflow hidden | `x=200, y=64.67, w=1025.33, h=558.67`; fixed below header, internal overflow |
| Main content width | 1010px visible width after scrollbar; 13.44px content inset | 1010px visible width after scrollbar; 13.44px inset |
| Page scroll | document stays at viewport height; main content scrolls | document stays at viewport height; main content scrolls |

Both tabs were 1225px wide. Wakandi measured 567px high at DPR 1; AIMSCAMS measured 623px high at DPR 1.5. This difference affects only the available vertical space in the current browser windows, not the measured header/sidebar widths or dashboard card positions.

The AIMSCAMS main content now uses a fixed viewport below the 64.67px header, reserves a 15px scrollbar, and scrolls internally. The sidebar and main width transitions are 0.3s. The light border token is `#e2e8f0`; the header separator remains `#c3c6ca`.

Typography remains at the user's requested v1.2.0 scale: 16px root and 12.8px body. Wakandi measured 13.44px body text in its live session. The text-size difference is deliberate under the current instruction.

## Remaining shell checks

- Compare collapsed and expanded sidebar at the same height and verify scroll position/transition.
- Compare profile menu, language menu, branch state, footer, chat button, hover/focus, and keyboard navigation.
- Check shell horizontal overflow and console output at desktop and narrow widths.
