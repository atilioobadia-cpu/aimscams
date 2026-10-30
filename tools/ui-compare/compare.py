"""UI comparison: reference vs AIMSCAMS screenshots.

Computes SSIM, changed-pixel ratio, and diff regions per page.
Run: python tools/ui-compare/compare.py
"""
import os, sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from mask import mask_both, find_mask_regions, ocr_image


def wakandi_boxes_map():
    out = {}
    for e in json.load(open(WAKANDI_OCR, encoding="utf-8")):
        for b in e["boxes"]:
            out.setdefault(e["slug"], []).append(
                (b["text"], b["x"], b["y"], b["x"] + b["w"], b["y"] + b["h"]))
    return out

def cached_ocr(key, src_path, img):
    OCR_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache = OCR_CACHE_DIR / (key + ".json")
    stamp = os.path.getmtime(src_path)
    if cache.exists():
        data = json.load(open(cache, encoding="utf-8"))
        if data.get("mtime") == stamp:
            return [tuple(b) for b in data["boxes"]]
    boxes = ocr_image(img)
    json.dump({"mtime": stamp, "boxes": boxes}, open(cache, "w", encoding="utf-8"))
    return boxes

import numpy as np
import cv2

ROOT = Path(r"C:\Users\atili\microfinance_cams")
OCR_CACHE_DIR = ROOT / "artifacts" / "ocr-cache"
WAKANDI_OCR = ROOT / "docs" / "audit" / "wakandi-ocr.json"
REF_DIR = Path(r"F:\Wakandi")
OUR_DIR = ROOT / "artifacts" / "ui-screenshots"
REPORT_DIR = ROOT / "docs" / "audit" / "compare"
PAGES_JSON = ROOT / "tools" / "ui-compare" / "pages.json"


def load_image(path):
    img = cv2.imread(str(path))
    if img is None:
        return None
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def resize_to_match(ref, ours):
    """Resize ours to ref dimensions if needed."""
    if ref.shape != ours.shape:
        ours = cv2.resize(ours, (ref.shape[1], ref.shape[0]))
    return ours


def compute_ssim(ref, ours):
    """Compute SSIM between two images."""
    # Use cv2-based SSIM approximation (scipy/skimage not available)
    ref_gray = cv2.cvtColor(ref, cv2.COLOR_RGB2GRAY)
    ours_gray = cv2.cvtColor(ours, cv2.COLOR_RGB2GRAY)
    # Simple SSIM
    C1 = (0.01 * 255) ** 2
    C2 = (0.03 * 255) ** 2
    mu1 = cv2.GaussianBlur(ref_gray.astype(np.float64), (11, 11), 1.5)
    mu2 = cv2.GaussianBlur(ours_gray.astype(np.float64), (11, 11), 1.5)
    mu1_sq = mu1 ** 2
    mu2_sq = mu2 ** 2
    mu1_mu2 = mu1 * mu2
    sigma1_sq = cv2.GaussianBlur(ref_gray.astype(np.float64) ** 2, (11, 11), 1.5) - mu1_sq
    sigma2_sq = cv2.GaussianBlur(ours_gray.astype(np.float64) ** 2, (11, 11), 1.5) - mu2_sq
    sigma12 = cv2.GaussianBlur(ref_gray.astype(np.float64) * ours_gray.astype(np.float64), (11, 11), 1.5) - mu1_mu2
    ssim_map = ((2 * mu1_mu2 + C1) * (2 * sigma12 + C2)) / ((mu1_sq + mu2_sq + C1) * (sigma1_sq + sigma2_sq + C2))
    return float(ssim_map.mean())


def find_diff_regions(ref, ours, threshold=30):
    """Find connected diff regions."""
    diff = cv2.absdiff(ref, ours)
    gray = cv2.cvtColor(diff, cv2.COLOR_RGB2GRAY)
    _, mask = cv2.threshold(gray, threshold, 255, cv2.THRESH_BINARY)
    # morphological close to merge nearby regions
    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    regions = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        area = w * h
        if area < 100:  # skip tiny regions
            continue
        regions.append({"x": x, "y": y, "w": w, "h": h, "area": area})
    regions.sort(key=lambda r: r["area"], reverse=True)
    return regions, mask


def changed_pixel_ratio(ref, ours, threshold=30):
    diff = cv2.absdiff(ref, ours)
    gray = cv2.cvtColor(diff, cv2.COLOR_RGB2GRAY)
    changed = np.sum(gray > threshold)
    total = gray.size
    return float(changed / total)


def main():
    pages = json.load(open(PAGES_JSON, encoding="utf-8"))
    summary = []
    wboxes = wakandi_boxes_map()
    for page in pages:
        name = page["name"]
        ref_path = page.get("reference_image")
        if not ref_path:
            continue
        ref_full = ROOT / ref_path
        our_path = OUR_DIR / f"{name}.png"
        if not ref_full.exists() or not our_path.exists():
            continue

        ref = load_image(ref_full)
        ours = load_image(our_path)
        if ref is None or ours is None:
            continue

        # Pad our image to match reference dimensions (don't resize/distort)
        if ours.shape != ref.shape:
            padded = np.full(ref.shape, 235, dtype=np.uint8)  # page bg color
            h = min(ours.shape[0], ref.shape[0])
            w = min(ours.shape[1], ref.shape[1])
            padded[:h, :w] = ours[:h, :w]
            ours = padded

        # Structural masking: mask dynamic data regions in both images
        ref_boxes = wboxes.get(name)
        if ref_boxes is None:
            ref_boxes = cached_ocr("ref-" + name, ref_full, ref)
        our_boxes = cached_ocr("our-" + name, our_path, ours)
        ref_masked, our_masked, mask_regions = mask_both(ref, ours, ref_boxes, our_boxes)

        # Compute on masked images
        ssim = compute_ssim(ref_masked, our_masked)
        cpr = changed_pixel_ratio(ref_masked, our_masked)
        regions, mask = find_diff_regions(ref_masked, our_masked)

        # Also compute unmasked for reference
        ssim_unmasked = compute_ssim(ref, ours)
        cpr_unmasked = changed_pixel_ratio(ref, ours)

        page_dir = REPORT_DIR / name
        page_dir.mkdir(parents=True, exist_ok=True)

        # Save masked diff image
        diff_img = cv2.absdiff(ref_masked, our_masked)
        cv2.imwrite(str(page_dir / "diff.png"), cv2.cvtColor(diff_img, cv2.COLOR_RGB2BGR))

        report = {
            "page": name,
            "route": page.get("route"),
            "ssim": round(ssim, 4),
            "changed_pixel_ratio": round(cpr, 4),
            "ssim_unmasked": round(ssim_unmasked, 4),
            "cpr_unmasked": round(cpr_unmasked, 4),
            "mask_regions": len(mask_regions),
            "diff_regions": regions[:20],
            "pass": ssim >= 0.98 and cpr <= 0.01,
        }
        json.dump(report, open(page_dir / "report.json", "w", encoding="utf-8"), indent=2)

        # Write markdown report
        md = f"# {name}\n\n"
        md += f"- Route: {page.get('route')}\n"
        md += f"- SSIM (masked): {ssim:.4f} (threshold 0.98)\n"
        md += f"- SSIM (unmasked): {ssim_unmasked:.4f}\n"
        md += f"- Changed pixel ratio (masked): {cpr:.4%} (threshold 1%)\n"
        md += f"- Changed pixel ratio (unmasked): {cpr_unmasked:.4%}\n"
        md += f"- Mask regions: {len(mask_regions)}\n"
        md += f"- Diff regions: {len(regions)}\n"
        md += f"- **Pass:** {'YES' if report['pass'] else 'NO'}\n\n"
        if regions:
            md += "## Top diff regions\n\n"
            md += "| # | x | y | w | h | area |\n|---|---|---|---|---|---|\n"
            for i, r in enumerate(regions[:10]):
                md += f"| {i+1} | {r['x']} | {r['y']} | {r['w']} | {r['h']} | {r['area']} |\n"
        (page_dir / "report.md").write_text(md, encoding="utf-8")

        summary.append(report)
        print(f"{name}: SSIM={ssim:.4f} CPR={cpr:.4%} regions={len(regions)} pass={report['pass']}")

    # Write summary
    (REPORT_DIR / "SUMMARY.md").write_text(
        "# Comparison Summary\n\n"
        + f"Pages compared: {len(summary)}\n"
        + f"Pages passing: {sum(1 for s in summary if s['pass'])}\n"
        + f"Pages failing: {sum(1 for s in summary if not s['pass'])}\n\n"
        + "| Page | SSIM | CPR | Regions | Pass |\n|---|---|---|---|---|\n"
        + "\n".join(f"| {s['page']} | {s['ssim']} | {s['changed_pixel_ratio']} | {len(s['diff_regions'])} | {'YES' if s['pass'] else 'NO'} |" for s in summary)
        + "\n",
        encoding="utf-8",
    )
    print(f"\nSummary: {sum(1 for s in summary if s['pass'])}/{len(summary)} passing")

if __name__ == "__main__":
    main()