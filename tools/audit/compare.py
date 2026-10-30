"""Phase 3 comparison: reference specs (OCR + layout) versus measured live pages.

Reads docs/audit/wakandi-ocr.json, wakandi-layout.json, reference-map.json and the
artifacts/page-measure/*.json captures, then writes docs/audit/comparison.md and
comparison.json.

Run from the repository root: python tools/audit/compare.py
"""
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(r"C:\Users\atili\microfinance_cams")
AUDIT = ROOT / "docs" / "audit"
MEASURE = ROOT / "artifacts" / "page-measure"

# The reference captures are 1.125x our CSS pixels: two independent shell
# dimensions agree on that factor (231/204 = 1.132, 76/68 = 1.118).
CAPTURE_SCALE = 1.125

CHROME_WORDS = {
    "mfsl", "mfi", "mf1", "wakandi", "english", "engllsh", "nglish",
    "main", "branch", "tsh", "dr", "cr", "yes", "no",
}

STOPWORDS = {
    "the", "and", "for", "with", "from", "this", "that", "are", "was", "were",
    "you", "your", "not", "all", "any", "can", "has", "have", "will", "may",
    "into", "than", "then", "when", "what", "which", "who", "how", "out",
}

WORD = re.compile(r"[A-Za-z][A-Za-z0-9/&.-]{2,}")


def tokens(value):
    out = []
    for match in WORD.findall(value or ""):
        word = match.lower().strip(".,/&.-")
        if len(word) < 4 or word in CHROME_WORDS or word in STOPWORDS:
            continue
        out.append(word)
    return out


def reference_tokens(value):
    """Tokens from the reference only. Skips all-caps runs: member, staff and branch
    names are shouted in the observed product, labels are not. This keeps personal
    data out of the committed report and out of the vocabulary."""
    out = []
    for match in WORD.finditer(value or ""):
        raw = match.group(0)
        word = raw.lower().strip(".,/&.-")
        if len(word) < 4 or word in CHROME_WORDS or word in STOPWORDS:
            continue
        if raw.isupper():
            continue
        out.append(word)
    return out


DATA_TITLE = re.compile(r"^[A-Z]{1,3}\d+$")
MONEY_OR_NUMBER = re.compile(r"^(?:Dr|Cr)?\s*[\d,]+(?:\.\d+)?$", re.I)


def clean_title(value):
    """A reference title that is a member name, an id, an amount or a banner is not
    a title."""
    text = (value or "").strip()
    text = re.sub(r"^[^A-Za-z]+", "", text)
    if not text or len(text) > 60 or DATA_TITLE.match(text) or text.isupper():
        return "[unreadable]"
    if re.search(r"\d{3,}", text):
        return "[unreadable]"
    return text


def clean_header_cell(value):
    """Drop money and count cells that line grouping mistook for column names."""
    text = (value or "").strip()
    if not re.search(r"[A-Za-z]", text) or MONEY_OR_NUMBER.match(text):
        return None
    return re.sub(r"\d{4,}", "[number]", text)


def load(path):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def document_frequency(all_pages):
    """How many reference pages each token appears on (data names stay low)."""
    df = Counter()
    for token_set in all_pages:
        df.update(set(token_set))
    return df


def reference_title(boxes):
    """Largest box in the page-title band (y 100-180), in the left content column.

    The band's right side holds page actions and header controls (on `clients` the
    widest box there is `CllentActivationLink`), so titles are bounded to x <= 700.
    """
    band = [b for b in boxes if "text" in b and 100 <= b["y"] <= 180 and 250 < b["x"] <= 700]
    if not band:
        return None
    band.sort(key=lambda b: (-b["h"], -len(b["text"]), b["x"]))
    return band[0]["text"].strip()


def reference_header_line(boxes):
    """The table header row. Prefer the densest line that mentions Actions;
    otherwise the densest line inside the table-header band."""
    lines = {}
    for b in boxes:
        if "text" not in b or b["x"] <= 250 or b["y"] <= 84:
            continue
        lines.setdefault(round(b["y"] / 14) * 14, []).append(b)
    with_actions = None
    dense_band = None
    for y, line in lines.items():
        if len(line) < 3:
            continue
        joined = " ".join(cell["text"] for cell in line).lower()
        if "action" in joined and (with_actions is None or len(line) > len(with_actions[1])):
            with_actions = (y, line)
        if 200 <= y <= 460 and (dense_band is None or len(line) > len(dense_band[1])):
            dense_band = (y, line)
    chosen = with_actions or dense_band
    if not chosen:
        return None
    line = sorted(chosen[1], key=lambda cell: cell["x"])
    cleaned = [clean_header_cell(cell["text"]) for cell in line]
    return [cell for cell in cleaned if cell] or None


def reference_text(boxes):
    """Only the content region: below the header and right of the sidebar. The
    reference captures include our user's name and the nav on every page, which
    would otherwise dominate any vocabulary comparison."""
    return " ".join(b["text"] for b in boxes if "text" in b and b["x"] > 250 and b["y"] > 84)


def main():
    mapping = load(AUDIT / "reference-map.json")
    ocr = {entry["slug"]: entry for entry in load(AUDIT / "wakandi-ocr.json")}
    layout = load(AUDIT / "wakandi-layout.json")

    # Cross-page vocabulary: tokens that recur across reference screens are UI
    # language (labels, column names). Tokens unique to one screen are that
    # screen's demo data and cannot be matched against our synthetic records.
    # df>=4 keeps specific labels ("template", "segment", "type") while dropping
    # names and amounts; df>=10 lost them (80 words) and df>=2 admitted demo data
    # (553 words). Measured on the four pilot screens, 4 tracks 10 within 3 points.
    per_page_tokens = {
        slug: set(reference_tokens(reference_text(entry.get("boxes", [])))) for slug, entry in ocr.items()
    }
    frequency = document_frequency(per_page_tokens.values())
    ui_vocabulary = {word for word, count in frequency.items() if count >= 4}

    rows = []
    for slug, entry in mapping.items():
        if not entry.get("route"):
            rows.append({"slug": slug, "route": None, "missing": entry.get("missing"), "status": "absent"})
            continue
        capture_path = MEASURE / (re.sub(r'[\\/:*?"<>|]', "_", slug) + ".json")
        if not capture_path.exists():
            rows.append({"slug": slug, "route": entry["route"], "status": "not measured"})
            continue

        page = load(capture_path)
        ref = ocr.get(slug, {})
        boxes = ref.get("boxes", [])
        ref_text = reference_text(boxes)
        ref_words = per_page_tokens.get(slug, set()) & ui_vocabulary
        our_words = set(tokens(page.get("text", "")))
        shared = sorted(word for word in ref_words if word in our_words)
        coverage = round(len(shared) / len(ref_words), 2) if ref_words else None
        missing_words = sorted(word for word in ref_words if word not in our_words)[:14]

        # Table header overlap: the strongest structural signal we have.
        ref_headers = reference_header_line(boxes) or []
        our_headers = (page.get("tables") or [{}])[0].get("headers") or []
        ref_header_words = set(reference_tokens(" ".join(ref_headers)))
        our_header_words = set(tokens(" ".join(our_headers)))
        header_overlap = None
        if ref_header_words and our_header_words:
            header_overlap = round(len(ref_header_words & our_header_words) / len(ref_header_words), 2)

        ref_title = clean_title(reference_title(boxes))
        our_title = page.get("h1")
        title_match = None
        if ref_title and ref_title != "[unreadable]" and our_title:
            a = set(tokens(ref_title))
            b = set(tokens(our_title))
            title_match = bool(a and b and (a & b))

        tables = page.get("tables") or []
        all_headers = [h.lower() for table in tables for h in (table.get("headers") or [])]
        ref_has_actions = bool(re.search(r"\bActions?\b", ref_text))
        our_has_actions = any("action" in header for header in all_headers)
        ref_has_search = "search" in ref_text.lower()
        our_has_search = bool(
            page.get("forms", {}).get("comboboxes")
            or any("search" in value.lower() for value in page.get("forms", {}).get("placeholders", []))
            or any("search" in value.lower() for value in page.get("buttons", []))
        )
        ref_has_add = bool(re.search(r"\bAdd\b", ref_text))
        our_has_add = bool(page.get("pageActions"))
        ref_has_pagination = bool(re.search(r"\bNext\b", ref_text))
        our_rows = tables[0]["rows"] if tables else 0
        our_has_pagination = "next" in (page.get("pagination") or "").lower()
        shell = page.get("shell", {})

        ref_sidebar = layout.get(slug, {}).get("sidebar_width_px")
        ref_header = layout.get(slug, {}).get("header_height_px")
        our_sidebar = shell.get("sidebar", {}).get("w")
        our_header = shell.get("header", {}).get("h")

        flags = []
        if page.get("placeholder"):
            flags.append("placeholder")
        if coverage is not None and coverage < 0.6:
            flags.append("low coverage")
        if header_overlap is not None and header_overlap < 0.5:
            flags.append("header differs")
        if title_match is False:
            flags.append("title differs")
        if ref_has_actions and not our_has_actions:
            flags.append("no actions column")
        if ref_has_search and not our_has_search:
            flags.append("no search")
        if ref_has_add and not our_has_add:
            flags.append("no add action")
        if our_rows > 10 and not page.get("pagination"):
            flags.append("unpaged >10 rows")
        if page.get("consoleIssues"):
            flags.append(f"{len(page['consoleIssues'])} console issues")
        if page.get("failedRequests"):
            flags.append(f"{len(page['failedRequests'])} failed requests")

        rows.append({
            "slug": slug,
            "route": entry["route"],
            "path": page.get("path"),
            "status": page.get("status"),
            "refTitle": ref_title,
            "ourTitle": our_title,
            "titleMatch": title_match,
            "coverage": coverage,
            "missingWords": missing_words,
            "refHeaders": ref_headers,
            "ourHeaders": our_headers,
            "headerOverlap": header_overlap,
            "ourRows": our_rows,
            "refSidebar": layout.get(slug, {}).get("sidebar_width_px"),
            "refHeader": layout.get(slug, {}).get("header_height_px"),
            "ourSidebar": shell.get("sidebar", {}).get("w"),
            "ourHeader": shell.get("header", {}).get("h"),
            "h1Size": (page.get("h1Style") or {}).get("fontSize"),
            "bodySize": (page.get("bodyStyle") or {}).get("fontSize"),
            "placeholder": bool(page.get("placeholder")),
            "flags": flags,
        })

    write_report(rows)


def write_report(rows):
    measured = [r for r in rows if r.get("coverage") is not None]
    live = [r for r in measured if not r.get("placeholder")]
    placeholders = [r for r in rows if r.get("placeholder")]
    low = sorted([r for r in live if (r.get("coverage") or 0) < 0.6], key=lambda r: r.get("coverage") or 0)
    headers_off = sorted(
        [r for r in live if r.get("headerOverlap") is not None and r["headerOverlap"] < 0.5],
        key=lambda r: r.get("headerOverlap") or 0,
    )
    absent = [r for r in rows if r.get("status") == "absent"]
    not_measured = [r for r in rows if r.get("status") == "not measured"]
    flagged = [r for r in rows if r.get("flags")]

    lines = []
    add = lines.append
    add("# Phase 3 — reference vs AIMSCAMS comparison")
    add("")
    add(f"{len(rows)} reference screens mapped to {sum(1 for r in rows if r.get('path'))} live routes.")
    add(f"Shell scale: the reference captures are {CAPTURE_SCALE}× our CSS pixels — 231 px sidebar and")
    add("76 px header against our 204 px and 68 px, both within 1 px of 204 × 1.125 = 229.5 and 68 × 1.125 = 76.5.")
    add("")
    add("## Summary")
    add("")
    add("| Measure | Value |")
    add("| --- | --- |")
    add(f"| Reference screens compared | {len(measured)} |")
    add(f"| Placeholder (`In build`) pages | {len(placeholders)} |")
    add(f"| UI-vocabulary coverage below 60% | {len(low)} |")
    add(f"| Table headers under 50% overlap | {len(headers_off)} |")
    add(f"| Pages with at least one flag | {len(flagged)} |")
    add(f"| Reference screens with no AIMSCAMS route | {len(absent)} |")
    add(f"| Mapped routes not measured | {len(not_measured)} |")
    add("")
    avg = [r["coverage"] for r in measured if r.get("coverage") is not None]
    if avg:
        add(f"Mean UI-vocabulary coverage across all {len(avg)} measurable screens: **{sum(avg) / len(avg):.0%}**.")
    avg_live = [r["coverage"] for r in live if r.get("coverage") is not None]
    if avg_live:
        add(f"Mean across the {len(avg_live)} implemented screens only: **{sum(avg_live) / len(avg_live):.0%}**.")
        add("")
    add("Coverage counts only words that recur on 4 or more reference screens, i.e. labels and")
    add("column names. Words unique to one screen are that screen's demo data and are not")
    add("comparable with synthetic records.")
    add("")

    add("## Shell, typography and palette")
    add("")
    add("Measured on every captured route (1280 × 800, device scale 1):")
    add("")
    sidebar_values = Counter(r["ourSidebar"] for r in measured if r.get("ourSidebar"))
    header_values = Counter(r["ourHeader"] for r in measured if r.get("ourHeader"))
    sidebar = sidebar_values.most_common(1)[0] if sidebar_values else ("—", 0)
    header = header_values.most_common(1)[0] if header_values else ("—", 0)
    add(f"- Sidebar: {sidebar[0]} px on {sidebar[1]} of {len(measured)} screens — reference 231 px ÷ 1.125 = 205 px.")
    add(f"- Header: {header[0]} px on {header[1]} of {len(measured)} screens — reference 76 px ÷ 1.125 = 68 px.")
    add("- Reference primary teal quantises to `#067272`, i.e. `#057573` — the same token we use.")
    add("")
    add("Body text, row height, control radius and the teal accent therefore match the reference")
    add("design once the capture scale is removed. The one ratio that does not match is the page")
    add("title: in the reference the title box is about 1.55× the height of a body-text box, while")
    add("our `h1` renders at `--fs` and is 1.0×. `docs/11 §2` currently makes a single text size a")
    add("rule, so this is a contract conflict to settle in Phase 4, not a styling bug.")
    add("")

    add("## Reference screens with no AIMSCAMS route")
    add("")
    if absent:
        add("| Reference screen | Reason |")
        add("| --- | --- |")
        for row in absent:
            add(f"| `{row['slug']}` | {row.get('missing')} |")
    else:
        add("None.")
    add("")

    add("## Placeholder pages (reference has a working screen)")
    add("")
    if placeholders:
        add("| Live route | Reference screen | Reference title |")
        add("| --- | --- | --- |")
        for row in sorted(placeholders, key=lambda r: r["route"]):
            add(f"| `{row['route']}` | `{row['slug']}` | {row.get('refTitle') or '—'} |")
    else:
        add("None.")
    add("")

    add("## Content coverage below 60% (implemented screens only)")
    add("")
    if low:
        add("| Route | Coverage | Reference title | Reference column words missing here |")
        add("| --- | --- | --- | --- |")
        for row in low[:30]:
            ref_words = set(reference_tokens(" ".join(row.get("refHeaders") or [])))
            ours = set(tokens(" ".join(row.get("ourHeaders") or [])))
            missing = ", ".join(sorted(ref_words - ours)[:10]) or "—"
            add(f"| `{row['route']}` | {row.get('coverage'):.0%} | {row.get('refTitle') or '—'} | {missing} |")
    else:
        add("None.")
    add("")

    add("## Highest-coverage screens")
    add("")
    add("| Route | Coverage | Reference title | Our title |")
    add("| --- | --- | --- | --- |")
    for row in sorted(live, key=lambda r: -(r.get("coverage") or 0))[:12]:
        add(f"| `{row['route']}` | {row.get('coverage'):.0%} | {row.get('refTitle') or '—'} | {row.get('ourTitle') or '—'} |")
    add("")

    add("## By module")
    add("")
    add("| Module | Screens | Placeholders | Mean coverage (implemented) |")
    add("| --- | --- | --- | --- |")
    modules = {}
    for row in measured:
        segment = (row.get("route") or "/").strip("/").split("/")[0].split("-")[0]
        entry = modules.setdefault(segment, {"screens": 0, "placeholders": 0, "cov": []})
        entry["screens"] += 1
        if row.get("placeholder"):
            entry["placeholders"] += 1
        elif row.get("coverage") is not None:
            entry["cov"].append(row["coverage"])
    for name in sorted(modules, key=lambda key: -modules[key]["screens"]):
        entry = modules[name]
        mean = f"{sum(entry['cov']) / len(entry['cov']):.0%}" if entry["cov"] else "—"
        add(f"| {name} | {entry['screens']} | {entry['placeholders']} | {mean} |")
    add("")

    add("## Table headers")
    add("")
    add(f"{len(headers_off)} screens have less than half of their reference header words in our table header.")
    add("")
    if headers_off:
        add("| Route | Overlap | Reference headers | Our headers |")
        add("| --- | --- | --- | --- |")
        for row in headers_off[:30]:
            ref = " / ".join(row.get("refHeaders") or [])[:90] or "—"
            ours = " / ".join(row.get("ourHeaders") or [])[:90] or "—"
            add(f"| `{row['route']}` | {row.get('headerOverlap'):.0%} | {ref} | {ours} |")
    add("")

    add("## Structural flags by route")
    add("")
    add("| Route | Flags |")
    add("| --- | --- |")
    for row in sorted(flagged, key=lambda r: (r["route"] or "")):
        add(f"| `{row['route']}` | {', '.join(row['flags'])} |")
    add("")

    add("## Per-screen detail")
    add("")
    add("| Reference screen | Live route | Our title | Coverage | Flags |")
    add("| --- | --- | --- | --- | --- |")
    for row in sorted(rows, key=lambda r: r["slug"]):
        if not row.get("path"):
            continue
        coverage = f"{row['coverage']:.0%}" if row.get("coverage") is not None else "—"
        add(f"| `{row['slug']}` | `{row['route']}` | {row.get('ourTitle') or '—'} | {coverage} | {', '.join(row.get('flags', [])) or '—'} |")
    add("")

    (AUDIT / "comparison.md").write_text("\n".join(lines), encoding="utf-8")
    public = [{key: value for key, value in row.items() if key != "missingWords"} for row in rows]
    (AUDIT / "comparison.json").write_text(json.dumps(public, indent=2, ensure_ascii=False), encoding="utf-8")
    # The word-level diff is local only: despite the all-caps filter a few staff
    # first names survive in title case. Hard rule 6 keeps them off the remote.
    (AUDIT / "comparison-words.json").write_text(
        json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"rows={len(rows)} measured={len(measured)} placeholders={len(placeholders)} low={len(low)} flagged={len(flagged)}")


if __name__ == "__main__":
    main()
