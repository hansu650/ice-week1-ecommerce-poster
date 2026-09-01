# Teammate figure handoff

The three drawing tasks remain independent. This repository does not change their prompts or redesign their modules.

## Inputs ready now

1. Market growth: `data/processed/china_cbec_trade_2018_2024.csv`
2. Consumer reach: `data/processed/ipc_purchase_source_china_2016_2023.csv`
3. Global industry impact: `data/processed/unctad_business_ecommerce_sales_2016_2022.csv`

Before drawing, each teammate should read the matching section of `DATA_DICTIONARY.md` and retain the scope label in the figure caption. In particular:

- China monetary values are in RMB 100 million.
- IPC 26% and 37% are shopper-response shares, not global sales-value shares.
- UNCTAD values are approximate totals for 43 covered economies; 2022 is indicative.

## Reserved future deliverables

The repository currently reserves these logical destinations; do not create empty binaries solely to fill them:

```text
poster/modules/market-growth.svg
poster/modules/consumer-reach.svg
poster/modules/global-impact.svg
poster/final/ice-week1-poster-a0.pdf
poster/assets/github-repository-qr.svg
```

When those deliverables arrive, validate source captions, fonts, dimensions, and privacy before committing them through a separate pull request.
