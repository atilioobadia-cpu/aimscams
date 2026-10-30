"""Structural masking: detect dynamic data regions in reference and mask them in both images."""
import cv2
import numpy as np
from rapidocr_onnxruntime import RapidOCR

ocr_engine = RapidOCR()

# Common UI words that are structural (not dynamic data)
STRUCTURAL_WORDS = {
    'dashboard', 'clients', 'accounts', 'transactions', 'accounting', 'reports',
    'requests', 'messages', 'campaigns', 'import', 'settings', 'search', 'filter',
    'add', 'edit', 'delete', 'save', 'cancel', 'submit', 'close', 'view', 'details',
    'name', 'email', 'phone', 'address', 'status', 'date', 'amount', 'balance',
    'type', 'actions', 'no', 'yes', 'active', 'inactive', 'pending', 'approved',
    'rejected', 'total', 'page', 'of', 'rows', 'showing', 'entries', 'first',
    'last', 'previous', 'next', 'export', 'print', 'download', 'upload', 'reset',
    'clear', 'apply', 'sort', 'order', 'asc', 'desc', 'id', 'code', 'description',
    'branch', 'group', 'member', 'loan', 'savings', 'fee', 'charge', 'interest',
    'payment', 'repayment', 'disbursement', 'principal', 'outstanding', 'arrears',
    'installment', 'schedule', 'collateral', 'guarantor', 'product', 'policy',
    'holiday', 'working', 'days', 'office', 'user', 'role', 'admin', 'branch',
    'account', 'ledger', 'journal', 'entry', 'debit', 'credit', 'trial', 'balance',
    'cash', 'book', 'flow', 'statement', 'income', 'expense', 'asset', 'liability',
    'equity', 'capital', 'revenue', 'profit', 'loss', 'tax', 'reconciliation',
    'notes', 'of', 'account', 'monthly', 'annual', 'quarterly', 'daily', 'weekly',
    'from', 'to', 'start', 'end', 'created', 'updated', 'by', 'on', 'at', 'in',
    'for', 'with', 'and', 'or', 'not', 'all', 'any', 'some', 'none', 'each',
    'every', 'other', 'same', 'different', 'new', 'old', 'current', 'previous',
    'next', 'last', 'first', 'total', 'sum', 'count', 'average', 'min', 'max',
    'chart', 'of', 'accounts', 'opening', 'closing', 'opening', 'balance',
    'group', 'ledger', 'postable', 'non-postable', 'dr', 'cr', 'debit', 'credit',
    'dashboard', 'welcome', 'back', 'overview', 'summary', 'details', 'list',
    'create', 'update', 'remove', 'confirm', 'are', 'you', 'sure', 'want',
    'to', 'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them',
    'their', 'we', 'our', 'us', 'i', 'my', 'me', 'he', 'she', 'his', 'her',
    'him', 'has', 'have', 'had', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
    'might', 'must', 'can', 'shall', 'a', 'an', 'the', 'and', 'but', 'if',
    'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with',
    'about', 'against', 'between', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on',
    'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
    'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'don', 'now', 'aimscams',
    'wakandi', '©', '2026', 'rights', 'reserved', 'all', '©', '©',
}


def ocr_image(img):
    """OCR an image, return list of (text, x1, y1, x2, y2)."""
    result, _ = ocr_engine(img)
    boxes = []
    if result:
        for line in result:
            # line format: [box, text, score]
            box = line[0]  # [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]
            text = line[1]
            xs = [p[0] for p in box]
            ys = [p[1] for p in box]
            x1, y1 = int(min(xs)), int(min(ys))
            x2, y2 = int(max(xs)), int(max(ys))
            boxes.append((text, x1, y1, x2, y2))
    return boxes


def is_dynamic_text(text):
    """Determine if text is dynamic data (name, amount, date, ID)."""
    text = text.strip()
    if not text:
        return False
    # Contains digits → likely dynamic (amounts, dates, IDs, counts)
    if any(c.isdigit() for c in text):
        return True
    # Single capitalized word that's not a common UI word → likely a name
    words = text.lower().split()
    if len(words) == 1 and text[0].isupper() and text.lower() not in STRUCTURAL_WORDS:
        # Could be a name or a label; check if it's a known UI word
        if text.lower() not in STRUCTURAL_WORDS:
            return True
    # Date-like patterns
    import re
    if re.search(r'\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}', text):
        return True
    if re.search(r'\d{4}[/\-\.]\d{1,2}[/\-\.]\d{1,2}', text):
        return True
    return False


def find_mask_regions(ref_img, our_img, ref_boxes=None, our_boxes=None):
    """Find regions to mask: OCR both (unless boxes are given), mask text that differs or is dynamic."""
    if ref_boxes is None:
        ref_boxes = ocr_image(ref_img)
    if our_boxes is None:
        our_boxes = ocr_image(our_img)

    regions = []
    # Mask dynamic text in reference
    for text, x1, y1, x2, y2 in ref_boxes:
        if is_dynamic_text(text):
            # Expand region by 4px
            regions.append((max(0, x1-4), max(0, y1-4), min(ref_img.shape[1], x2+4), min(ref_img.shape[0], y2+4)))

    # Also mask text that differs between reference and ours
    # Find text in ours that doesn't match reference text at similar positions
    for text_r, x1_r, y1_r, x2_r, y2_r in ref_boxes:
        matched = False
        for text_o, x1_o, y1_o, x2_o, y2_o in our_boxes:
            # Check if regions overlap significantly
            overlap_x = max(0, min(x2_r, x2_o) - max(x1_r, x1_o))
            overlap_y = max(0, min(y2_r, y2_o) - max(y1_r, y1_o))
            if overlap_x > 0 and overlap_y > 0:
                area_r = (x2_r - x1_r) * (y2_r - y1_r)
                area_o = (x2_o - x1_o) * (y2_o - y1_o)
                overlap_area = overlap_x * overlap_y
                if overlap_area > 0.3 * min(area_r, area_o):
                    matched = True
                    if text_r.strip().lower() != text_o.strip().lower():
                        # Text differs → dynamic data
                        regions.append((max(0, x1_r-4), max(0, y1_r-4), min(ref_img.shape[1], x2_r+4), min(ref_img.shape[0], y2_r+4)))
                    break
        if not matched:
            # Text in reference has no match in ours → could be dynamic or missing
            # Mask it to be safe
            regions.append((max(0, x1_r-4), max(0, y1_r-4), min(ref_img.shape[1], x2_r+4), min(ref_img.shape[0], y2_r+4)))

    return regions


def apply_masks(img, regions):
    """Apply mask regions to an image (fill with white)."""
    masked = img.copy()
    for x1, y1, x2, y2 in regions:
        masked[y1:y2, x1:x2] = 255
    return masked


def mask_both(ref_img, our_img, ref_boxes=None, our_boxes=None):
    """Find mask regions from reference and apply to both images."""
    regions = find_mask_regions(ref_img, our_img, ref_boxes, our_boxes)
    ref_masked = apply_masks(ref_img, regions)
    our_masked = apply_masks(our_img, regions)
    return ref_masked, our_masked, regions
