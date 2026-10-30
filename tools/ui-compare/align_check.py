import sys, json, cv2, numpy as np
from pathlib import Path

ROOT = Path(r"C:\Users\atili\microfinance_cams")

def phase_corr(a, b):
    a = a.astype(np.float32)
    b = b.astype(np.float32)
    h = min(a.shape[0], b.shape[0])
    w = min(a.shape[1], b.shape[1])
    a = a[:h, :w]
    b = b[:h, :w]
    win = np.outer(np.hanning(h), np.hanning(w)).astype(np.float32)
    fa = np.fft.fft2(a * win)
    fb = np.fft.fft2(b * win)
    cross = fa * np.conj(fb)
    cross /= np.abs(cross) + 1e-10
    corr = np.fft.ifft2(cross).real
    peak = np.unravel_index(np.argmax(corr), corr.shape)
    dy = peak[0] if peak[0] < h // 2 else peak[0] - h
    dx = peak[1] if peak[1] < w // 2 else peak[1] - w
    return dx, dy

def ssim(a, b):
    a = cv2.cvtColor(a, cv2.COLOR_BGR2GRAY) if len(a.shape) == 3 else a
    b = cv2.cvtColor(b, cv2.COLOR_BGR2GRAY) if len(b.shape) == 3 else b
    h = min(a.shape[0], b.shape[0])
    w = min(a.shape[1], b.shape[1])
    a = a[:h, :w].astype(np.float64)
    b = b[:h, :w].astype(np.float64)
    C1 = (0.01 * 255) ** 2
    C2 = (0.03 * 255) ** 2
    mu1 = cv2.GaussianBlur(a, (11, 11), 1.5)
    mu2 = cv2.GaussianBlur(b, (11, 11), 1.5)
    mu1_sq = mu1 ** 2
    mu2_sq = mu2 ** 2
    mu1_mu2 = mu1 * mu2
    sigma1_sq = cv2.GaussianBlur(a ** 2, (11, 11), 1.5) - mu1_sq
    sigma2_sq = cv2.GaussianBlur(b ** 2, (11, 11), 1.5) - mu2_sq
    sigma12 = cv2.GaussianBlur(a * b, (11, 11), 1.5) - mu1_mu2
    ssim_map = ((2 * mu1_mu2 + C1) * (2 * sigma12 + C2)) / ((mu1_sq + mu2_sq + C1) * (sigma1_sq + sigma2_sq + C2))
    return float(ssim_map.mean())

def main():
    name = sys.argv[1] if len(sys.argv) > 1 else "accounting-chart-of-accounts"
    pages = json.load(open(ROOT / "tools/ui-compare/pages.json", encoding="utf-8"))
    page = next(p for p in pages if p["name"] == name)
    ref = cv2.imread(str(ROOT / page["reference_image"]))
    ours = cv2.imread(str(ROOT / "artifacts/ui-screenshots" / (name + ".png")))
    ref_g = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY)
    ours_g = cv2.cvtColor(ours, cv2.COLOR_BGR2GRAY)

    # Crop to min dimensions
    h = min(ref_g.shape[0], ours_g.shape[0])
    w = min(ref_g.shape[1], ours_g.shape[1])
    ref_c = ref_g[:h, :w]
    ours_c = ours_g[:h, :w]

    lines = []
    lines.append("Page: %s" % name)
    lines.append("ref size: %dx%d  ours size: %dx%d  crop: %dx%d" % (ref.shape[1], ref.shape[0], ours.shape[1], ours.shape[0], w, h))

    # Whole page
    dx, dy = phase_corr(ref_c, ours_c)
    s = ssim(ref[:h, :w], ours[:h, :w])
    lines.append("WHOLE: dx=%d dy=%d ssim=%.4f" % (dx, dy, s))

    # Header band (top 100px)
    dx_h, dy_h = phase_corr(ref_c[:100, :], ours_c[:100, :])
    s_h = ssim(ref[:100, :w], ours[:100, :w])
    lines.append("HEADER (y=0-100): dx=%d dy=%d ssim=%.4f" % (dx_h, dy_h, s_h))

    # Sidebar band (x=0-250, full height)
    dx_s, dy_s = phase_corr(ref_c[:, :250], ours_c[:, :250])
    s_s = ssim(ref[:h, :250], ours[:h, :250])
    lines.append("SIDEBAR (x=0-250): dx=%d dy=%d ssim=%.4f" % (dx_s, dy_s, s_s))

    # Content band (x=250+, full height)
    dx_c, dy_c = phase_corr(ref_c[:, 250:], ours_c[:, 250:])
    s_c = ssim(ref[:h, 250:w], ours[:h, 250:w])
    lines.append("CONTENT (x=250+): dx=%d dy=%d ssim=%.4f" % (dx_c, dy_c, s_c))

    output = "\n".join(lines) + "\n"
    print(output)

    # Save to file
    out_path = ROOT / "docs/audit/compare" / name / "align.txt"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(output, encoding="utf-8")

if __name__ == "__main__":
    main()
