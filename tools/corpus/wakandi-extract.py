"""Phase 2 extraction pipeline for the F:\\Wakandi screenshots (stitching only)."""
import json
import os
import re
from collections import OrderedDict
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(r"F:\Wakandi")
OUT = Path(r"C:\Users\atili\microfinance_cams\docs\audit")
STITCHED = OUT / "wakandi-stitched"
INVENTORY_JSON = OUT / "wakandi-inventory.json"
STITCH_LOG = OUT / "wakandi-stitch-log.json"
PAGES_JSON = OUT / "wakandi-pages.json"

STITCHED.mkdir(parents=True, exist_ok=True)


def natural_key(value):
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", value)]


def route_slug(name):
    match = re.match(r"screencapture-cams-wakandi-co-tz-(.+)-\d{4}-\d{2}-\d{2}-\d{2}_\d{2}_\d{2}(?: \(\d+\))?\.png", name)
    return match.group(1) if match else None


def detect_overlap(top_image, bottom_image):
    top = np.asarray(top_image.convert("RGB"))
    bottom = np.asarray(bottom_image.convert("RGB"))
    if top.shape[1] != bottom.shape[1]:
        return 0
    best = 0
    for offset in (20, 30, 40, 50, 60, 80, 100, 120):
        if offset > top.shape[0] // 2 or offset > bottom.shape[0] // 2:
            continue
        a = top[-offset:, ::4, :].astype(int)
        b = bottom[:offset, ::4, :].astype(int)
        if np.abs(a - b).mean() < 6 and offset > best:
            best = offset
    return best


def main():
    # load existing inventory
    with open(INVENTORY_JSON, encoding="utf-8") as handle:
        files = json.load(handle)
    files = [f for f in files if f["name"].lower().endswith(".png")]
    files.sort(key=lambda item: natural_key(item["rel"]))
    print("files", len(files))

    groups = OrderedDict()
    for item in files:
        slug = route_slug(item["name"])
        if slug is None:
            groups.setdefault("__other__" + item["rel"], []).append(item)
        else:
            groups.setdefault(slug, []).append(item)
    for slug in groups:
        groups[slug].sort(key=lambda item: natural_key(item["name"]))
    print("groups", len(groups))

    stitch_log = []
    all_pages = []
    for slug, items in groups.items():
        if slug.startswith("__other__"):
            for item in items:
                all_pages.append({"slug": slug, "page_index": 0, "sources": [item["name"]], "overlap": 0, "stitched": False, "output": item["path"], "width": item["width"], "height": item["height"]})
            continue
        # stitch
        i = 0
        page_index = 0
        while i < len(items):
            stitched_flag = False
            overlap = 0
            if i + 1 < len(items) and items[i]["width"] == items[i + 1]["width"]:
                with Image.open(items[i]["path"]) as top_img, Image.open(items[i + 1]["path"]) as bot_img:
                    overlap = detect_overlap(top_img, bot_img)
                if overlap > 0:
                    stitched_flag = True
            sources = [items[i]]
            if stitched_flag:
                sources = [items[i], items[i + 1]]
            # build image
            images = [Image.open(s["path"]) for s in sources]
            width = images[0].width
            if len(images) == 1:
                stitched = images[0].copy()
            else:
                total_height = sum(img.height for img in images) - overlap
                stitched = Image.new("RGB", (width, total_height), "white")
                y = 0
                for img in images:
                    stitched.paste(img.convert("RGB"), (0, y))
                    y += img.height - overlap
                    overlap = 0
            safe_slug = slug.replace("/", "_")
            out_name = f"{safe_slug}__p{page_index}.png"
            out_path = STITCHED / out_name
            stitched.save(out_path)
            for img in images:
                img.close()
            stitch_log.append({"slug": slug, "page_index": page_index, "sources": [s["name"] for s in sources], "stitched": stitched_flag, "overlap": overlap if stitched_flag else 0, "output": str(out_path.relative_to(OUT)), "width": stitched.width, "height": stitched.height})
            all_pages.append({"slug": slug, "page_index": page_index, "sources": [s["name"] for s in sources], "stitched": stitched_flag, "overlap": overlap if stitched_flag else 0, "output": str(out_path), "width": stitched.width, "height": stitched.height})
            i += 2 if stitched_flag else 1
            page_index += 1
    with open(STITCH_LOG, "w", encoding="utf-8") as handle:
        json.dump(stitch_log, handle, indent=2, ensure_ascii=False)
    with open(PAGES_JSON, "w", encoding="utf-8") as handle:
        json.dump(all_pages, handle, indent=2, ensure_ascii=False)
    print("pages", len(all_pages))


if __name__ == "__main__":
    main()
