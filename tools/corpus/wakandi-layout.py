"""Measure layout and dominant colours on one representative stitched page per route slug.

Downsamples each image to at most 1200 px tall before measuring. Writes wakandi-layout.json.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(r"C:\Users\atili\microfinance_cams\docs\audit")
PAGES_JSON = OUT / "wakandi-pages.json"
LAYOUT_JSON = OUT / "wakandi-layout.json"
MAX_H = 1200


def hex_of(rgb):
    return "#{:02x}{:02x}{:02x}".format(*[int(c) for c in rgb])


def dominant(region, count=5):
    if region.size == 0:
        return []
    pixels = region.reshape(-1, 3).astype(np.int32)
    quant = (pixels // 12) * 12 + 6
    packed = (quant[:, 0] << 16) | (quant[:, 1] << 8) | quant[:, 2]
    keys, counts = np.unique(packed, return_counts=True)
    order = np.argsort(-counts)[:count]
    total = counts.sum()
    out = []
    for i in order:
        key = int(keys[i])
        out.append({
            "hex": "#{:02x}{:02x}{:02x}".format((key >> 16) & 255, (key >> 8) & 255, key & 255),
            "share": round(float(counts[i] / total), 3),
        })
    return out


def sidebar_width(array):
    h, w, _ = array.shape
    # The sidebar is a vertical band on the left. Find the right edge by
    # locating the first column (in the middle band of rows) whose luminance
    # variance is near zero (the gap between sidebar and content).
    top = int(h * 0.25)
    bottom = int(h * 0.75)
    band = array[top:bottom, :, :]
    for x in range(120, min(w, 360)):
        column = band[:, x, :].astype(int)
        luminance = column.mean(axis=1)
        if luminance.std() < 4:
            return x
    # fallback: last column before a large horizontal gap in mean colour
    means = band.mean(axis=(0, 2))
    for x in range(120, min(w, 360)):
        if abs(means[x] - means[x - 1]) > 12:
            return x
    return None


def header_height(array, x_start):
    h, w, _ = array.shape
    xs = min(w - 1, (x_start or 200) + 20)
    # header is the top band; find first row where the colour at xs changes
    # from the top row's colour by more than a small threshold.
    row_colour = array[0, xs].astype(int)
    for y in range(4, min(h, 200)):
        if np.abs(array[y, xs].astype(int) - row_colour).sum() > 40:
            return y
    return None


def measure(path):
    with Image.open(path) as image:
        rgb = image.convert("RGB")
        factor = min(1.0, MAX_H / rgb.height)
        if factor < 1.0:
            rgb = rgb.resize((max(1, int(rgb.width * factor)), max(1, int(rgb.height * factor))), Image.LANCZOS)
        array = np.asarray(rgb)
    h, w, _ = array.shape
    sb = sidebar_width(array)
    hh = header_height(array, sb)
    sidebar_region = array[:, : (sb or 0), :]
    header_region = array[: (hh or 0), (sb or 0):, :]
    body_region = array[(hh or 0) + 4:, (sb or 0) + 4:, :]
    return {
        "orig_width": None,
        "width": w,
        "height": h,
        "scale": round(factor, 4),
        "sidebar_width_px": None if sb is None else int(sb / factor),
        "header_height_px": None if hh is None else int(hh / factor),
        "dominant_all": dominant(array),
        "dominant_sidebar": dominant(sidebar_region),
        "dominant_header": dominant(header_region),
        "dominant_body": dominant(body_region),
        "sidebar_bg": hex_of(array[h // 2, 2]),
        "body_bg": hex_of(array[min(h - 2, (hh or 0) + 40), min(w - 2, (sb or 0) + 40)]),
    }


def main():
    with open(PAGES_JSON, encoding="utf-8") as handle:
        pages = json.load(handle)
    seen = set()
    results = {}
    for page in pages:
        if page["slug"] in seen:
            continue
        seen.add(page["slug"])
        try:
            results[page["slug"]] = measure(page["output"])
        except Exception as error:  # noqa: BLE001
            results[page["slug"]] = {"error": str(error)}
        print("measured", page["slug"], flush=True)
    with open(LAYOUT_JSON, "w", encoding="utf-8") as handle:
        json.dump(results, handle, indent=2, ensure_ascii=False)
    print("done", len(results), flush=True)


if __name__ == "__main__":
    main()
