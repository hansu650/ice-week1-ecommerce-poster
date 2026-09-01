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
