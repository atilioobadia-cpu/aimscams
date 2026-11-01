# Send Message visual audit

Date: 2026-11-01  
Reference: `F:\Wakandi\messages-send-message\FULL.png`  
AIMSCAMS route: `/messages-send-message`

## Comparison

The reference form asks for message Type and Company, then Template and Segment, with Send Message, Cancel, and Test Message actions. AIMSCAMS asks for Template and Channel, a direct Recipient, and a freeform Message body. The two forms represent different delivery models and target-selection workflows; there is no segment selector in the local page. Both captures show blank forms, and local send/test actions are disabled until required fields are supplied.

## Recommendations

- Align the form with the approved messaging workflow, including target audience/segment selection and company/channel behavior.
- Keep Send Message and Test Message gated until recipient targeting, template rendering, and consent checks are defined.
- Preserve the reference two-column field rhythm and compact action row within the shared message service shell.

Read-only browser review; no fields were entered and no message was sent or tested.  
Implementation commit: none; delivery contract and target-selection controls differ.