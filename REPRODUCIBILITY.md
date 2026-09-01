# Reproducibility guide

## Supported environment

- Python 3.12
- `pdfplumber` 0.11.x for optional verification of the UNCTAD PDF vector path
- `pytest` 8.x or 9.x for tests

Create the task-specific Conda environment without modifying `base`:

```bash
conda env create -f environment.yml
conda activate ice-week1-data-pipeline
```

## Generate outputs

```bash
python scripts/build_all.py
```

This command reads the three committed raw inputs and deterministically writes:

- `data/processed/china_cbec_trade_2018_2024.csv`
- `data/processed/ipc_purchase_source_china_2016_2023.csv`
- `data/processed/unctad_business_ecommerce_sales_2016_2022.csv`
- `data/processed/metrics_summary.json`

No current date, random seed, network response, locale-specific formatting, or filesystem path is embedded in the generated files.

## Prove a clean rebuild

```bash
python scripts/build_all.py --check
python scripts/validate_processed_data.py
python -m pytest -q
```

`--check` generates into an isolated temporary directory and compares every artifact byte-for-byte with the committed version. The validator checks:

- required columns and allowed nulls;
- ascending/continuous years;
- numeric and percentage ranges;
- `total = export + import` for every China row;
- IPC's exact two endpoints and +11 percentage-point change;
- UNCTAD's 43-economy coverage and approximate/indicative labels;
- consistency between CSVs and `metrics_summary.json`.

## Verify the UNCTAD extraction against the official PDF

Download the official report from:

<https://unctad.org/system/files/official-document/dtlecde2024d3_en.pdf>

Then run:

```bash
python scripts/build_all.py --check --verify-unctad-pdf /path/to/dtlecde2024d3_en.pdf
```

The optional check reads physical PDF page 10, identifies the single seven-point blue central-estimate vector line in Figure 2, and compares every y-coordinate with the committed extraction within 0.02 PDF points. It does not use OCR or infer values from a low-resolution screenshot.

## Separation of responsibilities

- Source acquisition and licensing decisions are documented in `DATA_SOURCES.md` and `data-sources/`.
- Each preparation script performs only one data transformation.
- `build_all.py` orchestrates the transformations; it does not download or plot data.
- `validate_processed_data.py` validates contracts; it does not mutate files.
- Teammate drawing code consumes processed CSVs separately.
