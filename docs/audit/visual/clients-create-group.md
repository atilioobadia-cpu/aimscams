# Create Group visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\clients-create-group\FULL.png`  
AIMSCAMS route: `/clients/create-group`

## Comparison

The reference has a full-width Create New Group title card with a Cancel action. The first expanded Membership Details accordion contains required searchable Policy and Branch Name selectors, an optional Relationship Manager selector, and a Next button. A second Group Details accordion and persistent Cancel/Continue footer are also visible.

AIMSCAMS currently presents a three-step registration wizard. Its first step has Reference Number, Group Name, free-text Branch ID and Membership Policy fields, plus Joining Date and Back/Next controls. It has a progress bar, but not the reference accordion layout, searchable selectors, relationship-manager field, or visible second-section/footer composition. The title treatment is also plain breadcrumb/heading text rather than the reference title card.

## Recommendations

- Rework the first step around the Membership Details accordion, using searchable policy, branch-name, and relationship-manager selectors backed by the local domain data.
- Preserve the subsequent group details in the reference accordion/footer layout, and align the page title and cancel controls with the shared title card.
- Keep the existing wizard's later workflow only where it maps to the reference sections; do not treat a progress bar as a substitute for the reference structure.

Browser review was read-only. No fields were entered and Next was not used.

## Status

Structure and field differences remain. No implementation change was made during this audit.
