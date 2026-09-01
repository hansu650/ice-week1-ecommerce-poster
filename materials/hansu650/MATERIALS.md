# Material Package 01 — China’s Cross-border E-commerce

## Contributor and role

- **GitHub:** [hansu650](https://github.com/hansu650)
- **Role:** Team Leader
- **Contribution:** topic direction, source curation, evidence checking, repository organisation, and team coordination.

## Proposed poster direction

**From Domestic Scale to Global Reach: How China’s Cross-border E-commerce Is Reshaping Global Retail**

Main message: China’s domestic e-commerce scale becomes global retail influence through platforms, payments, logistics, data, and policy, while cross-border readiness remains uneven across markets.

## 1. Paper and figure

- **Paper:** Zhang, L. and Asraf bin Abdullah, M. (2026), *An empirical study on the potential of China’s cross-border e-commerce exports under the RCEP framework: an application of the extended gravity model*.
- **Paper:** https://doi.org/10.1057/s41599-026-07267-z
- **Figure:** Figure 3, “Line chart of cross-border e-commerce development level in RCEP countries”.
- **Image:** https://media.springernature.com/full/springer-static/image/art%3A10.1057%2Fs41599-026-07267-z/MediaObjects/41599_2026_7267_Fig3_HTML.png
- **Licence:** CC BY-NC-ND 4.0.
- **Planned use:** reproduce the figure unchanged with full attribution in non-commercial coursework; do not recolour, translate, or otherwise adapt it.
- **Value:** supports the claim that cross-border e-commerce readiness and development remain uneven across RCEP economies.

## 2. Official data

### UNCTAD business e-commerce sales

- **Dataset:** Domestic and international e-commerce sales, 2012–2025.
- **Official page:** https://unctadstat.unctad.org/datacentre/dataviewer/US.ECommerceTotal
- **Licence:** CC BY 3.0 IGO.
- **Key evidence:** UNCTAD reports that China’s business e-commerce sales rose from **US$1.6 trillion in 2016 to US$4.5 trillion in 2022**.
- **Report source:** https://unctad.org/system/files/official-document/der2024_ch05_en.pdf
- **Planned use:** redraw a concise growth chart in the poster’s visual style.

### UNCTAD international digital ordering trade

- **Dataset:** International digitally ordered trade by partner, 2015–2024.
- **Official page:** https://unctadstat.unctad.org/datacentre/dataviewer/US.ECommerceInternational
- **Licence:** CC BY 3.0 IGO.
- **Planned use:** explore international connections and market reach.
- **Limitation:** country coverage, firm size, industry scope, tax treatment, and e-commerce definitions are not fully comparable. China’s values include sales taxes, so comparisons require a note.

## 3. Code sources

### EconDataLibrary

- **Repository:** https://github.com/elkassabgi/econdatalibrary
- **Code licence:** MIT; source data retain the original publisher’s terms.
- **Relevant scripts:**
  - `jobs/ingest_unctad_ds.py`
  - `updater/strategies/fetchers/unctad_ecommercetotal.py`
  - `updater/strategies/fetchers/unctad_ecommerceinternational.py`
- **Purpose:** retrieve, clean, and standardise UNCTAD time-series data.
- **Planned use:** reference the ingestion logic and write a smaller reproducible script for the selected poster charts.

### RCEP replication repository

- **Repository:** https://github.com/llzhang1028/An-empirical-study-on-the-potential-of-China-s-cross-border-e-commerce-exports0117
- **Language:** Stata 18.
- **Limitation:** no separate repository licence was identified, so the code and data will be treated as reference material unless reuse permission is confirmed.

## Selection recommendation

Use this package as the first candidate because it provides a coherent evidence chain:

**peer-reviewed paper and figure + official UNCTAD data + relevant open-source ingestion code**

The final poster should redraw the UNCTAD data charts, use the RCEP figure only under its stated no-derivatives terms, and clearly distinguish reported statistics from proxy measures.

---

# Material Package 02 — China's Customs-recorded Cross-border E-commerce, 2018–2024

## Contributor

- **GitHub username:** [hansu650](https://github.com/hansu650)
- **Proposed topic:** *From Domestic Scale to Global Reach: How China's Cross-border E-commerce Is Reshaping Global Retail*
- **Date submitted:** 2026-09-01

## Poster relevance

- **Official Week 1 theme supported:** the scale and growth of China's cross-border e-commerce, with export-led growth as a bridge from domestic capacity to global retail reach.
- **Proposed poster section:** the opening evidence block, immediately after the title and key message.
- **Main claim:** customs-recorded cross-border e-commerce trade rose from RMB 1.06 trillion in 2018 to RMB 2.71 trillion in 2024; exports accounted for about 79.5% of the 2024 total.
- **Why useful for a long vertical poster:** one clean line chart establishes the time trend before later panels discuss platforms, logistics, regional reach, and uneven market readiness.

## Paper or report

- **Title:** *中国数字贸易发展报告2025* (*China Digital Trade Development Report 2025*)
- **Author or organisation:** Ministry of Commerce of the People's Republic of China; the table cites the General Administration of Customs of China as the original data source.
- **Year:** 2025
- **DOI:** none identified.
- **Official URL:** https://fms.mofcom.gov.cn/xxfb/art/2025/art_3aeb2e47113845bdb16dcb053e5f6e9d.html
- **Relevant page, table, or figure:** Table 11, “2018-2024年中国跨境电子商务进出口总体情况表”, printed page 63 / PDF page 68.
- **Licence or reuse status:** the official landing page does not state an open-content licence; **licence pending verification**. The report PDF is therefore not redistributed in this repository.
- **What is redrawn:** the seven annual values for total imports and exports, exports, and imports are redrawn as an original line chart.
- **Limitations:** this is a customs trade series in current RMB, not a measure of all platform sales or global retail turnover. It should not be compared directly with UNCTAD business e-commerce sales without reconciling definitions and currency.

## Dataset

- **Dataset title:** China cross-border e-commerce imports and exports, 2018–2024.
- **Publisher or creator:** General Administration of Customs of China, reproduced in the Ministry of Commerce report above; structured transcription by hansu650.
- **Official URL:** https://fms.mofcom.gov.cn/xxfb/art/2025/art_3aeb2e47113845bdb16dcb053e5f6e9d.html
- **Access date:** 2026-09-01.
- **Licence:** no explicit open-data licence was identified on the report page; **licence pending verification**. This submission contains only a small seven-row factual transcription with full attribution.
- **Coverage period:** 2018–2024, annual.
- **Geography:** People's Republic of China.
- **Unit and currency:** RMB 100 million; year-on-year growth fields are percentages.
- **Data type:** real preprocessed data, not synthetic.
- **Raw or processed:** manually transcribed from the official report table and converted to machine-readable CSV; the XLSX is an editable derivative of the CSV.
- **Important field definitions:** `total_import_export_100m_cny`, `export_100m_cny`, and `import_100m_cny` are reported annual trade values; `*_yoy_pct` fields are the source's annual growth rates.
- **Cleaning or transformation:** English snake-case headers were added, blank 2018 growth cells were preserved, numeric cells were parsed, and every row was checked to satisfy total = exports + imports. The workbook adds formula-based export and import shares.
- **Limitations:** values are rounded and not inflation-adjusted; computed shares can therefore differ slightly from calculations based on unrounded source data. The source's statistical definition governs the series.

## Figure or image

- **Original title:** *China's Cross-border E-commerce Trade, 2018–2024*.
- **Creator:** hansu650 / Week 1 poster team, generated from the included CSV.
- **Repository files:** [`figures/china-crossborder-trade-2018-2024.png`](figures/china-crossborder-trade-2018-2024.png) and [`figures/china-crossborder-trade-2018-2024.svg`](figures/china-crossborder-trade-2018-2024.svg).
- **Source table:** Table 11 in the official report above; no publisher figure is copied.
- **Licence or reuse status:** original chart design and rendering are licensed under CC BY 4.0; the underlying official data retain their source terms.
- **Proposed use:** redraw.
- **Planned changes:** poster designers may translate labels, resize, or adjust colours while keeping values, axes, units, and attribution unchanged.
- **Required attribution:** “Source: General Administration of Customs of China, cited in MOFCOM (2025), Table 11; chart redrawn by the Week 1 poster team.”
- **Limitations:** the chart shows national scale and composition, not destination markets or causal effects on foreign retailers.

## Code or GitHub source

- **Repository or code URL:** [`scripts/plot_china_crossborder_trade.py`](scripts/plot_china_crossborder_trade.py).
- **Author:** hansu650 / Week 1 poster team.
- **Licence:** MIT; see [`scripts/LICENSE`](scripts/LICENSE).
- **Required environment:** Python 3.10+ and Matplotlib; pinned compatible range in [`scripts/requirements.txt`](scripts/requirements.txt).
- **Input:** `data/china-crossborder-ecommerce-2018-2024.csv`.
- **Output:** 3200 × 1800 PNG and editable SVG in `figures/`.
- **What is reused or rewritten:** the plot is original project code; no third-party repository source is copied. For a later country-by-partner extension, the official UN Comtrade Python client is available at https://github.com/uncomtrade/comtradeapicall under the MIT licence.
- **Reproducibility notes:** run `python scripts/plot_china_crossborder_trade.py` from any working directory. The script resolves paths relative to itself and validates years, numeric values, and accounting totals before drawing.

## Files included

| File | Type | Source | Purpose |
|---|---|---|---|
| `data/china-crossborder-ecommerce-2018-2024.csv` | CSV | GACC via MOFCOM (2025), Table 11 | Auditable machine-readable input |
| `data/china-crossborder-ecommerce-2018-2024.xlsx` | XLSX | Derived from the included CSV | Editable table, formulas, and chart for the design team |
| `figures/china-crossborder-trade-2018-2024.png` | PNG | Generated by the included script | High-resolution poster-ready figure |
| `figures/china-crossborder-trade-2018-2024.svg` | SVG | Generated by the included script | Editable vector figure |
| `figures/LICENSE.md` | Markdown | CC BY 4.0 notice | Reuse terms for the original chart design |
| `scripts/plot_china_crossborder_trade.py` | Python | Original project code | Validation and reproducible plotting |
| `scripts/requirements.txt` | Text | Project environment record | Minimal dependency range |
| `scripts/LICENSE` | Text | MIT licence | Reuse terms for the plotting script |
| `references/mofcom-digital-trade-report-2025.md` | Markdown | Official source record | Provenance, reuse status, and use limits |

## Contributor statement

> I located the official MOFCOM report, traced Table 11 to GACC, manually transcribed the seven-year series, standardised the fields, verified the accounting identity for every year, prepared an editable workbook, wrote and tested a reproducible plotting script, and redrew the chart without copying a publisher image. I also recorded the unresolved source-licence issue and excluded the report PDF and third-party repository contents from the commit.

## Final checks

- [x] All cited links were recorded and checked during preparation.
- [x] Sources and licences, including unresolved licence status, are recorded.
- [x] Data type is clearly labelled as real preprocessed data.
- [x] No private or sensitive information is included.
- [x] No copyrighted PDF or original publisher figure is redistributed.
- [x] The proposed use is relevant to the Week 1 poster.
