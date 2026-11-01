# Client creation visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\clients-create\FULL.png`  
AIMSCAMS route: `/clients/create`

## Comparison

The reference capture shows a full-page Create New Client workflow organized as expandable sections. Membership Details is open with policy, joining date, branch, reference number, client manager, and group fields; Personal, Contact, Identity, Residence, and Employment sections follow below. AIMSCAMS instead presents a six-step registration wizard with a progress bar and a compact Membership step. Its initial fields are arranged in two columns, and it has a separate Clients link and Next action. The information architecture, page length, section treatment, and control grouping differ. The captured reference values are intentionally omitted.

## Recommendations

- Align the registration sections and field groupings to the approved client contract while retaining the local validation and step flow where appropriate.
- Match the reference accordion hierarchy, full-page spacing, title card, and footer actions.
- Resolve the reference-number loading state in AIMSCAMS before relying on that field in a live registration flow.

Read-only browser review; no client information was entered and no registration was submitted.  
Implementation commit: none; form structure and reference-number state need follow-up.