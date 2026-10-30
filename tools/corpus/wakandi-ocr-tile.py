"""Re-OCR the tall report images by vertical tiling. Updates wakandi-ocr.json entries."""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from rapidocr_onnxruntime import RapidOCR

OUT = Path(r"C:\Users\atili\microfinance_cams\docs\audit")
OCR_JSON = OUT / "wakandi-ocr.json"
TILE_H = 1200
MAX_W = 900
TARGETS = {
    "reports-client-MemberVerificationReport",
    "reports-loan-ActiveLoanReport",
    "reports-loan-ExpectedLoanRepaymentsReport",
    "accounting-reports-CashBook",
}

ocr = RapidOCR()
data = json.load(open(OCR_JSON, encoding="utf-8"))
by_slug = {entry["slug"]: entry for entry in data}

for slug in TARGETS:
    entry = by_slug.get(slug)
    if entry is None:
        print("missing", slug)
        continue
    path = entry["output"]
    with Image.open(path) as source:
        rgb = source.convert("RGB")
        factor = min(1.0, MAX_W / rgb.width)
        if factor < 1.0:
            rgb = rgb.resize((max(1, int(rgb.width * factor)), int(rgb.height * factor)), Image.LANCZOS)
        width, height = rgb.size
        boxes = []
        y = 0
        while y < height:
            bottom = min(height, y + TILE_H)
            tile = rgb.crop((0, y, width, bottom))
            arr = np.asarray(tile)
            result, _ = ocr(arr)
            if result:
                for box, text, score in result:
                    xs = [point[0] for point in box]
                    ys = [point[1] for point in box]
                    boxes.append({
                        "text": text,
                        "score": round(float(score), 3),
                        "x": int(min(xs) / factor),
                        "y": int((min(ys) + y) / factor),
                        "w": int((max(xs) - min(xs)) / factor),
                        "h": int((max(ys) - min(ys)) / factor),
                    })
            y += TILE_H - 120
            if y >= height:
                break
    entry["boxes"] = boxes
    scores = [b.get("score", 0) for b in boxes]
    print(slug, len(boxes), "boxes, avg", round(sum(scores) / len(scores), 2) if scores else 0)

with open(OCR_JSON, "w", encoding="utf-8") as handle:
    json.dump(data, handle, indent=2, ensure_ascii=False)
print("done")
