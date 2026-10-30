"""OCR one representative stitched page per route slug with RapidOCR.

Caps each page to 900 px wide and 1400 px tall before OCR (boxes are scaled back).
Resumes from docs/audit/wakandi-ocr.json, skipping slugs already processed.
"""
import json
import time
from pathlib import Path

import numpy as np
from PIL import Image
from rapidocr_onnxruntime import RapidOCR

OUT = Path(r"C:\Users\atili\microfinance_cams\docs\audit")
PAGES_JSON = OUT / "wakandi-pages.json"
OCR_JSON = OUT / "wakandi-ocr.json"
MAX_W = 900
MAX_H = 1400

ocr = RapidOCR()
with open(PAGES_JSON, encoding="utf-8") as handle:
    pages = json.load(handle)

done = []
if OCR_JSON.exists():
    with open(OCR_JSON, encoding="utf-8") as handle:
        done = json.load(handle)
done_slugs = {entry["slug"] for entry in done}

seen = set()
representative = []
for page in pages:
    if page["slug"] in seen:
        continue
    seen.add(page["slug"])
    representative.append(page)
todo = [page for page in representative if page["slug"] not in done_slugs]
print(f"representative={len(representative)} done={len(done)} todo={len(todo)}", flush=True)

start = time.time()
for index, page in enumerate(todo):
    boxes_out = []
    try:
        with Image.open(page["output"]) as source:
            rgb = source.convert("RGB")
            factor = min(1.0, MAX_W / rgb.width, MAX_H / rgb.height)
            if factor < 1.0:
                rgb = rgb.resize((max(1, int(rgb.width * factor)), max(1, int(rgb.height * factor))), Image.LANCZOS)
            array = np.asarray(rgb)
        result, _ = ocr(array)
        if result:
            for box, text, score in result:
                xs = [point[0] for point in box]
                ys = [point[1] for point in box]
                boxes_out.append({
                    "text": text,
                    "score": round(float(score), 3),
                    "x": int(min(xs) / factor),
                    "y": int(min(ys) / factor),
                    "w": int((max(xs) - min(xs)) / factor),
                    "h": int((max(ys) - min(ys)) / factor),
                })
    except Exception as error:  # noqa: BLE001
        boxes_out = [{"error": str(error)}]
    done.append({
        "slug": page["slug"],
        "page_index": page["page_index"],
        "output": page["output"],
        "width": page["width"],
        "height": page["height"],
        "boxes": boxes_out,
    })
    with open(OCR_JSON, "w", encoding="utf-8") as handle:
        json.dump(done, handle, indent=2, ensure_ascii=False)
    print(f"{len(done)}/{len(representative)} {time.time() - start:.0f}s {page['slug']}", flush=True)

print("done", len(done), flush=True)
