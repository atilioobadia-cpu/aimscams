"""Tile a wide image (ActiveLoanReport) in both directions."""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from rapidocr_onnxruntime import RapidOCR

OUT = Path(r"C:\Users\atili\microfinance_cams\docs\audit")
OCR_JSON = OUT / "wakandi-ocr.json"
import os
SLUG = os.environ.get("OCR_SLUG", "reports-loan-ActiveLoanReport")
TILE = 1200

ocr = RapidOCR()
data = json.load(open(OCR_JSON, encoding="utf-8"))
entry = [x for x in data if x["slug"] == SLUG][0]
path = entry["output"]
with Image.open(path) as source:
    rgb = source.convert("RGB")
    width, height = rgb.size
    boxes = []
    y = 0
    while y < height:
        x = 0
        while x < width:
            tile = rgb.crop((x, y, min(width, x + TILE), min(height, y + TILE)))
            arr = np.asarray(tile)
            result, _ = ocr(arr)
            if result:
                for box, text, score in result:
                    xs = [point[0] for point in box]
                    ys = [point[1] for point in box]
                    boxes.append({
                        "text": text,
                        "score": round(float(score), 3),
                        "x": int(min(xs) + x),
                        "y": int(min(ys) + y),
                        "w": int(max(xs) - min(xs)),
                        "h": int(max(ys) - min(ys)),
                    })
            x += TILE - 120
            if x >= width:
                break
        y += TILE - 120
        if y >= height:
            break
entry["boxes"] = boxes
scores = [b.get("score", 0) for b in boxes]
print(SLUG, len(boxes), "boxes, avg", round(sum(scores) / len(scores), 2) if scores else 0)
with open(OCR_JSON, "w", encoding="utf-8") as handle:
    json.dump(data, handle, indent=2, ensure_ascii=False)
print("done")
