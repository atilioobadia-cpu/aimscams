"""Build docs/audit/reference-map.json: reference slug -> AIMSCAMS route (Phase 3).

Every mapped route is validated against the Phase 1 crawl output so a typo cannot
silently produce an empty comparison row. Slugs with no equivalent stay null with a
reason, which is itself a finding.
"""
import json
from pathlib import Path

OUT = Path(r"C:\Users\atili\microfinance_cams\docs\audit")
PAGES = OUT / "wakandi-pages.json"
STATIC_CRAWL = OUT / "route-crawl.json"
DYNAMIC_CRAWL = OUT / "route-crawl-dynamic.json"
MAP_JSON = OUT / "reference-map.json"

NON_UI_PREFIX = "__other__"

# Reference slugs that need an explicit target because the route differs in shape.
OVERRIDES = {
    "clients": "/clients",
    "clients-create": "/clients/create",
    "clients-create-group": "/clients/create-group",
    "clients-group-1789": None,
    "core-wba-business-account": "/business-account",
    "account-loan-details-118-summary": "/account-loan-details/[id]",
    "account-loan-details-118-documents": "/account-loan-details/[id]/documents",
    "account-loan-details-118-guarantors": "/account-loan-details/[id]/guarantors",
    "account-loan-details-118-repayments": "/account-loan-details/[id]/repayments",
    "account-loan-details-118-schedule": None,
    "account-loan-details-118-transactions": "/account-loan-details/[id]/transactions",
    "account-loan-application-details-39": "/account-loan-application-details/[id]",
    "account-loan-application-details-124": "/account-loan-application-details/[id]",
    "account-loan-application-edit-39": "/account-loan-application-edit/[id]",
    "requests": "/requests",
    "settings-account": "/settings/general",
    "settings-accounting-settings": "/settings/accounting",
    "settings-administrator": "/settings/users",
    "settings-administrator-add": "/settings/users",
    "settings-branch": "/settings/branches",
    "settings-branch-add": "/settings/branches/new",
    "settings-policies-credit-product-policy": "/settings/policies/credit-product",
    "settings-policies-credit-product-policy-5": "/settings/policies/credit-product/[id]",
    "settings-policies-credit-product-policy-5-edit": "/settings/policies/credit-product/[id]/edit",
    "settings-policies-holidays": "/settings/policies/holidays",
    "settings-policies-membership-policy": "/settings/policies/membership",
    "settings-policies-membership-policy-create": "/settings/policies/membership/new",
    "settings-policies-membership-policy-1": "/settings/policies/membership/[id]",
    "settings-policies-membership-policy-1-edit": "/settings/policies/membership/[id]/edit",
    "settings-policies-membership-policy-2": "/settings/policies/membership/[id]",
    "settings-policies-membership-policy-2-edit": "/settings/policies/membership/[id]/edit",
    "settings-products-fee-penalties": "/settings/products/fee-penalties",
    "settings-products-interest-rate": "/settings/products/interest-rates",
    "settings-products-interest-rate-create": "/settings/products/interest-rates/new",
    "settings-products-loan": "/settings/products/loan",
    "settings-products-loan-5": "/settings/products/loan/[id]",
    "settings-products-loan-provisioning": "/settings/products/provisioning-rules",
    "settings-products-loan-provisioning-create": "/settings/products/provisioning-rules",
    "settings-products-savings": "/settings/products/savings",
    "settings-products-savings-create": "/settings/products/savings/new",
    "settings-products-savings-edit-1": "/settings/products/savings",
    "settings-role": "/settings/roles",
    "settings-service-provider": "/settings/services",
    "messages-template-list-create-3793": None,
}

# Why a reference page has no counterpart here.
REASONS = {
    "clients-group-1789": "Client groups exist only as a create form; no group detail screen.",
    "account-loan-details-118-schedule": "Loan detail has no schedule tab; the schedule is not exposed on its own page.",
    "messages-template-list-create-3793": "Templates are seeded, not authored in the UI.",
}

NOTES = {
    "core-wba-business-account": "Reference page is dropped here by DECISIONS D-015 (WB-01).",
    "settings-administrator-add": "Users are added by dialog on the list page, not a separate route.",
    "settings-products-savings-edit-1": "Savings product edits happen by dialog on the list page.",
    "settings-products-loan-provisioning-create": "Provisioning rules are created by dialog on the list page.",
    "settings-account": "Mapped to Settings > General (institution profile).",
}

# Prefixes whose AIMSCAMS route name matches the reference slug exactly.
DIRECT_PREFIXES = ("accounting-", "reports-", "transaction-", "import-", "messages-", "account-")


def main():
    pages = json.loads(PAGES.read_text(encoding="utf-8"))
    static_routes = {row["route"] for row in json.loads(STATIC_CRAWL.read_text(encoding="utf-8"))["results"]}
    dynamic_routes = {
        row["route"] for row in json.loads(DYNAMIC_CRAWL.read_text(encoding="utf-8"))["results"]
    }
    known = static_routes | dynamic_routes

    slugs = []
    for page in pages:
        if page["slug"] not in slugs:
            slugs.append(page["slug"])

    mapping = {}
    problems = []
    for slug in slugs:
        if slug.startswith(NON_UI_PREFIX):
            continue
        if slug in OVERRIDES:
            route = OVERRIDES[slug]
        elif slug.startswith(DIRECT_PREFIXES) and "/" + slug in static_routes:
            route = "/" + slug
        else:
            route = None
            problems.append(f"unmapped slug: {slug}")
        if route is not None and route not in known:
            problems.append(f"{slug} -> {route} is not a known route")
            route = None
        entry = {"route": route}
        if route is None:
            entry["missing"] = REASONS.get(slug, "No AIMSCAMS equivalent yet.")
        elif slug in NOTES:
            entry["note"] = NOTES[slug]
        mapping[slug] = entry

    MAP_JSON.write_text(json.dumps(mapping, indent=2, ensure_ascii=False), encoding="utf-8")
    mapped = sum(1 for v in mapping.values() if v["route"])
    print(f"slugs={len(mapping)} mapped={mapped} unmapped={len(mapping) - mapped}")
    for problem in problems:
        print("  ", problem)


if __name__ == "__main__":
    main()
