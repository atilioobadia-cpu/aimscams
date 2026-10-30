# Component spec (shared design tokens)

Derived from the Wakandi reference corpus (Phase 2/3). All values are CSS pixels at DPR 1, 1837×1080 viewport.

## Geometry
- Sidebar width: 204px (collapsed: 76px)
- Header height: 68px
- Row height: 36px (sidebar), 28px (sidebar subitem)
- Content padding: 18px
- Icon size: 20px
- Control height: 42px (auth), 36px (app)
- Control radius: 5px (controls), 8px (cards), 6px (pills), 11px (modals)
- Card gap: 20px vertical, 12px horizontal (KPI grid)

## Typography
- Body/title: 12.8px (single size, everywhere) — exception: page h1 is 20px (D-033)
- Font family: Roboto, Arial, Helvetica, sans-serif
- Line height: 1.5 (19.2px for 12.8px text)

## Colors
- Primary: #057573 (active sidebar pill, active tab, primary buttons)
- Primary tint: #e6f1f1 (teal icon badge, hover fills)
- Page background: #ebe9e9
- Surface: #ffffff (header, sidebar, cards)
- Border: #dee2e6
- Text strong: #111827
- Text heading: #495057
- Text muted: #6c757d
- Danger: #dc3545 (danger-bg: #f8eae7)
- Accent yellow: #e6c120 (accent-yellow-bg: #fcf7e3)

## Shared components
- **Button (primary):** bg #057573, white text, 12.8px, weight 600, height 36px (app) / 42px (auth), radius 5px
- **Button (outline):** transparent bg, 1px border #dee2e6, text #495057
- **Input:** height 36px (app), 42px (auth), radius 5px, 1px border #dee2e6, 12px padding, bg white
- **Badge (default):** bg primary tint, text primary, radius 6px
- **Badge (outline):** transparent bg, 1px border, text muted
- **Table header:** bg #f8fafc, font 12.8px, weight 600, text #6c757d, uppercase, 12px padding
- **Table row:** height 36px, 12px padding, border-bottom 1px #dee2e6
- **Card:** white bg, 1px border #dee2e6, 8px radius, no shadow (or 0 2px 8px rgba(0,0,0,0.15) for auth)
- **Modal:** 11px radius, white bg, shadow
- **Sidebar item:** height 36px, 12.8px, weight 500, text #495057, active: bg #057573, text white, weight 600
- **Sidebar subitem:** height 28px, 12.8px, weight 400
- **Page header:** title 20px/700 (D-033), description 12.8px muted, breadcrumb 12.8px muted
- **Pagination:** 36px height, prev/next + page numbers, 12.8px
- **Empty state:** centered, icon 48px, title 12.8px/600, description 12.8px muted
- **Banner/alert:** full width, 8px radius, 12px padding, colored bg + text
- **Tab:** 44px height, 12.8px label, active: primary bg white text, inactive: transparent text-strong
- **KPI card:** 94.8px height, 8 per row (4 per row), 12px gap, 14px padding

## Icon positions
- Input left icon: 12px from left, 16px size, text starts at 40px (12px gap)
- Row actions: three-dot menu, 36px trigger, right-aligned
- Sidebar icons: 20px, 12px left margin

## Where used
- See docs/audit/components/<page>/controls.json for per-page control inventory.