"""Generate per-page spec markdown from OCR + layout measurements (Phase 2)."""
import json
from collections import defaultdict
from pathlib import Path

OUT = Path(r"C:\Users\atili\microfinance_cams\docs\audit")
OCR_JSON = OUT / "wakandi-ocr.json"
LAYOUT_JSON = OUT / "wakandi-layout.json"
PAGES_JSON = OUT / "wakandi-pages.json"
SPEC_DIR = OUT / "wakandi-spec"
STITCH_LOG = OUT / "wakandi-stitch-log.json"

SPEC_DIR.mkdir(parents=True, exist_ok=True)

ocr_data = json.load(open(OCR_JSON, encoding="utf-8"))
layout_data = json.load(open(LAYOUT_JSON, encoding="utf-8"))
pages_data = json.load(open(PAGES_JSON, encoding="utf-8"))
stitch_log = json.load(open(STITCH_LOG, encoding="utf-8"))

# map slug -> list of stitch log entries
sources_by_slug = defaultdict(list)
for entry in stitch_log:
    sources_by_slug[entry["slug"]].append(entry)

# group pages by slug for the representative selection (first only)
ocr_by_slug = {}
for entry in ocr_data:
    ocr_by_slug.setdefault(entry["slug"], entry)

needs_human = []

for slug, ocr_entry in ocr_by_slug.items():
    layout = layout_data.get(slug, {})
    boxes = ocr_entry.get("boxes", [])
    # score check
    scores = [b.get("score", 0) for b in boxes if "error" not in b and "score" in b]
    avg_score = sum(scores) / len(scores) if scores else 0
    if avg_score < 0.7 or len(boxes) < 6:
        needs_human.append((slug, f"avg OCR score {avg_score:.2f}, {len(boxes)} boxes"))

    # group boxes into lines by y (tolerance 14px)
    lines = defaultdict(list)
    for box in boxes:
        if "error" in box:
            continue
        key = round(box["y"] / 14) * 14
        lines[key].append(box)
    sorted_lines = sorted(lines.items())

    spec_lines = []
    spec_lines.append(f"# {slug.replace('-', ' ').title()}")
    spec_lines.append("")
    spec_lines.append(f"Source slug: `{slug}`  ")
    spec_lines.append(f"Representative stitched page: `{Path(ocr_entry['output']).name}`  ")
    spec_lines.append(f"Original size: {ocr_entry['width']} x {ocr_entry['height']}  ")
    spec_lines.append(f"OCR boxes: {len(boxes)} (avg score {avg_score:.2f})  ")
    spec_lines.append("")
    spec_lines.append("## Source images")
    for entry in sources_by_slug.get(slug, []):
        for src in entry["sources"]:
            spec_lines.append(f"- `{src}`" + (" (stitched)" if entry["stitched"] else ""))
    spec_lines.append("")
    spec_lines.append("## Layout (measured)")
    spec_lines.append(f"- Sidebar width: {layout.get('sidebar_width_px')} px")
    spec_lines.append(f"- Header height: {layout.get('header_height_px')} px")
    spec_lines.append(f"- Sidebar background: {layout.get('sidebar_bg')}")
    spec_lines.append(f"- Body background: {layout.get('body_bg')}")
    spec_lines.append(f"- Dominant sidebar colours: {', '.join(c['hex'] for c in layout.get('dominant_sidebar', []))}")
    spec_lines.append(f"- Dominant header colours: {', '.join(c['hex'] for c in layout.get('dominant_header', []))}")
    spec_lines.append(f"- Dominant body colours: {', '.join(c['hex'] for c in layout.get('dominant_body', []))}")
    spec_lines.append("")
    spec_lines.append("## Text (OCR, top to bottom; x,y,w,h in source pixels)")
    for y_key, line_boxes in sorted_lines:
        line_boxes.sort(key=lambda b: b["x"])
        text = " | ".join(f"{b['text']} ({b['x']},{b['y']},{b['w']},{b['h']})" for b in line_boxes)
        spec_lines.append(f"- y~{y_key}: {text}")
    spec_lines.append("")
    spec_lines.append("## Notes")
    spec_lines.append("- Brand name in the reference is 'Wakandi'/'MFSL MFI'; in AIMSCAMS this becomes 'AIMSCAMS' / the institution name.")
    spec_lines.append("- All money values are integers in minor units; OCR may have dropped decimals or thousands separators.")
    spec_lines.append("")

    safe_name = slug.replace("/", "_").replace("\\", "_")
    (SPEC_DIR / f"{safe_name}.md").write_text("\n".join(spec_lines), encoding="utf-8")

# INDEX.md
index_lines = ["# Wakandi page index (Phase 2)", "", f"Generated {__import__('datetime').datetime.now().isoformat()}.", "", f"Total pages (stitched): {len(stitch_log)}. Representative pages (OCR'd): {len(ocr_by_slug)}.", "", "| # | Slug | Source images | Stitched |", "| --- | --- | --- | --- |"]
for i, entry in enumerate(stitch_log, 1):
    if entry["page_index"] != 0:
        continue
    index_lines.append(f"| {i} | `{entry['slug']}` | {', '.join('`' + s + '`' for s in entry['sources'])} | {'yes' if entry['stitched'] else 'no'} |")
(SPEC_DIR / "INDEX.md").write_text("\n".join(index_lines), encoding="utf-8")

# NEEDS-HUMAN.md
human_lines = ["# Pages needing human review (Phase 2)", "", "Low OCR confidence or very few detected boxes. Please provide a text description or a clearer crop.", ""]
if needs_human:
    human_lines.append("| Slug | Reason |")
    human_lines.append("| --- | --- |")
    for slug, reason in sorted(needs_human):
        human_lines.append(f"| `{slug}` | {reason} |")
else:
    human_lines.append("None.")
(SPEC_DIR / "NEEDS-HUMAN.md").write_text("\n".join(human_lines), encoding="utf-8")

print(f"specs: {len(ocr_by_slug)}, needs-human: {len(needs_human)}")
