# Poster revision — 8 September 2026

The earlier poster needed more explanation around the figures. The current revision adds interpretation, comparisons, business implications and evidence limits while preserving all eight data charts and the established canvas. Four context photos remain: stock, delivery, payment and order processing.

## What changed

- Explanatory prose: 656 to 1,096 words using the same counting rule, excluding sources, references, captions and chart labels.
- The IPC chart and public data now include all eight published 2016–2023 observations, showing the intervening decline and rebound.
- The analysis distinguishes falling import share from growing import value, slower positive growth from contraction, final-year trade mix from contribution to the increase, and RCEP period averages from final-year ratios.
- The two UNCTAD measures retain their different populations and time periods. Neither is treated as evidence that China caused the reported changes.
- Photos illustrate the services involved in an order; they are not evidence of a particular firm's performance.

## Why two shopper sources are cited

HKTDC's presentation supplies the complete historical series and itself attributes the data to IPC. IPC's original publication supplies survey scope and the delivery/customs findings discussed alongside the chart. The citations support the whole section, with distinct roles.

## Final delivery and verification

[Current PDF](../poster/final/W1_Poster_Revised.pdf), [SVG](../poster/final/W1_Poster_Revised.svg), [HTML](../poster/final/poster.html) and [preview](../poster/final/W1_Poster_Preview.png) are copied from the approved artifacts without editing their contents.

Actual Node Playwright screen/print measurements found no text overflow or collisions. The final PDF geometry check passed. Independent PDF-object inspection confirmed vector text and chart paths, all four original JPEG payloads, and 15 clickable links. The fresh final review found no required fixes and remains same-family provisional.

The QR pattern is unchanged. This revision uses continuity evidence from the previously verified QR, not a newly performed decode. The older generic conference-paper gate is not represented as passed.

## Reproduce the repository checks

```bash
python scripts/build_all.py --check
python scripts/validate_processed_data.py
python scripts/validate_poster_delivery.py
python -m pytest -q
```

Earlier public artifacts and their reports remain in [the dated archive](../poster/history/2026-09-03/). No course-grade guarantee is inferred from word counts or technical checks.
