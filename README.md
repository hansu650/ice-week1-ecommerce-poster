# ICE Week 1: E-commerce Trends Poster

[![Data validation](https://github.com/hansu650/ice-week1-ecommerce-poster/actions/workflows/data-validation.yml/badge.svg)](https://github.com/hansu650/ice-week1-ecommerce-poster/actions/workflows/data-validation.yml)

This repository records the evidence, reproducible data processing, teammate figures, and final-poster assembly for Week 1 of Industry and Community Engagement.

## Poster direction

**From Domestic Scale to Global Reach: How China's Cross-border E-commerce Is Reshaping Global Retail**

## Current status

The three primary data streams are processed, validated, and ready for the three teammates who are independently drawing the market-growth, consumer-reach, and global-impact modules. Their existing prompts and visual designs are not changed by this pipeline.

The final teammate SVGs, the assembled A0 PDF, and the repository QR code have not yet been submitted. Reserved destinations are documented in [the teammate handoff](docs/TEAM_FIGURE_HANDOFF.md).

## Evidence chain

```text
official source / cited report
  -> data/raw/ provenance-preserving inputs
  -> scripts/ deterministic preparation
  -> data/processed/ teammate-ready tables
  -> teammate figures (reserved)
  -> final A0 poster (reserved)
```

## Processed data

| Module | Processed file | Rows | Important scope |
|---|---|---:|---|
| Market growth | [`data/processed/china_cbec_trade_2018_2024.csv`](data/processed/china_cbec_trade_2018_2024.csv) | 7 | Revised 2018-2024 series; unit is RMB 100 million |
| Consumer reach | [`data/processed/ipc_purchase_source_china_2016_2023.csv`](data/processed/ipc_purchase_source_china_2016_2023.csv) | 2 | Two observed survey endpoints only; not a sales-value market share |
| Global industry context | [`data/processed/unctad_business_ecommerce_sales_2016_2022.csv`](data/processed/unctad_business_ecommerce_sales_2016_2022.csv) | 7 | Approximate totals for 43 economies; 2022 is indicative |

Machine-readable derived metrics are in [`data/processed/metrics_summary.json`](data/processed/metrics_summary.json). Field definitions and limitations are in [DATA_DICTIONARY.md](DATA_DICTIONARY.md) and [DATA_SOURCES.md](DATA_SOURCES.md).

## Rebuild and validate

```bash
conda env create -f environment.yml
conda activate ice-week1-data-pipeline
python scripts/build_all.py --check
python scripts/validate_processed_data.py
python -m pytest -q
```

To regenerate the committed outputs instead of checking them:

```bash
python scripts/build_all.py
```

The `--check` mode builds into a temporary directory and requires byte-for-byte equality with the committed outputs. Full environment and source-PDF verification instructions are in [REPRODUCIBILITY.md](REPRODUCIBILITY.md).

## Repository structure

```text
data/
  raw/          # small, provenance-preserving inputs
  processed/    # generated tables used by teammates
scripts/        # one preparation module per data stream plus build/validation
tests/          # data-contract and deterministic-build tests
references/
  design-reference/  # external CVPR reference citation; no copied poster image
data-sources/   # acquisition index and official URLs
design-reference/    # pointer to the canonical reference notes
docs/           # handoff and future poster destinations
materials/      # original teammate ZIP submissions retained unchanged
```

## Design reference

Feature4X's CVPR 2025 poster is an **external reference only** for studying layout, information hierarchy, and colour. It was not created by this team and is not a course outcome. Because no explicit public-redistribution licence was identified for the full poster image, this repository uses an official-link-only citation and does not commit the PNG. See [`references/design-reference/`](references/design-reference/).

## Public-repository safeguards

Do not upload private chats, credentials, cookies, tokens, student IDs, virtual environments, caches, or unrelated course files. Do not mix the preliminary 2020-2024 customs sequence with the revised 2018-2024 report sequence, and do not introduce unsupported 2025/2026 demonstration values.

Each contributor should continue to follow [CONTRIBUTING.md](CONTRIBUTING.md) and submit changes through a separate branch and pull request.
