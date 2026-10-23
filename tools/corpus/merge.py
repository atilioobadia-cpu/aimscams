#!/usr/bin/env python3
"""Merge per-screenshot OCR text into one deduplicated file per route.

Screenshot filenames follow the pattern produced by the capture session:

    screencapture-cams-wakandi-co-tz-<route>-YYYY-MM-DD-HH_MM_SS.png

This script groups by <route>, concatenates in timestamp order, drops duplicate
lines (the same navigation chrome appears on every screenshot), and writes
<route>.txt plus an index with shot/character counts.

IMPORTANT: the output contains real member data visible in the screenshots.
It is gitignored on purpose. Do not commit it.

Usage:
    python merge.py --ocr ./ocr --out ./merged
"""

from __future__ import annotations

import argparse
import json
import re
from collections import OrderedDict
from pathlib import Path

NAME_RE = re.compile(
    r"^screencapture-cams-wakandi-co-tz-(?P<route>.+?)-\d{4}-\d{2}-\d{2}-\d{2}_\d{2}_\d{2}$"
)

# Navigation chrome and footer repeated on every screen.
NOISE = {
    "",
    "WAKANDI",
    "Wakandi",
    "w",
    "English",
    "Swahili",
    "-",
    "|",
    "2026 Wakandi. All rights reserved.",
    "© 2026 Wakandi. All rights reserved.",
    "0 2026 Wakandi. All rights reserved.",
    "g Open",
}

SPACE_RE = re.compile(r"[ \t]{2,}")


def clean(text: str) -> list[str]:
    out: list[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        if line in NOISE:
            continue
        line = SPACE_RE.sub("  ", line)
        if len(line) < 2:
            continue
        out.append(line)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ocr", default="./ocr", help="directory of per-image .txt files")
    ap.add_argument("--out", default="./merged", help="output directory")
    args = ap.parse_args()

    ocr_dir = Path(args.ocr)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    routes: dict[str, list[tuple[str, Path]]] = {}
    unparsed = 0

    for txt in sorted(ocr_dir.glob("*.txt")):
        m = NAME_RE.match(txt.stem)
        if not m:
            unparsed += 1
            continue
        routes.setdefault(m.group("route"), []).append((txt.stem, txt))

    index = []
    for route, shots in sorted(routes.items()):
        seen: OrderedDict[str, None] = OrderedDict()
        for _, path in sorted(shots):
            for line in clean(path.read_text(encoding="utf-8", errors="replace")):
                seen.setdefault(line, None)
        merged = "\n".join(seen)
        (out_dir / f"{route}.txt").write_text(merged, encoding="utf-8")
        index.append(
            {
                "route": route,
                "shots": len(shots),
                "ocr_ok": len(shots),
                "chars": len(merged),
                "lines": len(seen),
            }
        )

    (out_dir / ".." / "route-index.json").write_text(
        json.dumps(index, indent=1, ensure_ascii=False), encoding="utf-8"
    )

    print(f"routes={len(index)} files={sum(len(s) for s in routes.values())} unparsed={unparsed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
