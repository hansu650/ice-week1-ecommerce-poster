# Data dictionary

## `china_cbec_trade_2018_2024.csv`

Each row is one calendar year from 2018 through 2024. Monetary fields use **RMB 100 million (亿元人民币)**.

| Field | Type | Definition |
|---|---|---|
| `year` | integer | Calendar year |
| `total_import_export_100m_cny` | integer | Cross-border e-commerce imports plus exports, RMB 100 million |
| `export_100m_cny` | integer | Cross-border e-commerce exports, RMB 100 million |
| `import_100m_cny` | integer | Cross-border e-commerce imports, RMB 100 million |
| `total_yoy_pct` | decimal / blank | Reported year-over-year change in total; blank in 2018 |
| `export_yoy_pct` | decimal / blank | Reported year-over-year change in exports; blank in 2018 |
| `import_yoy_pct` | decimal / blank | Reported year-over-year change in imports; blank in 2018 |

The pipeline enforces `total = export + import` for every year. The year-over-year columns are transcribed values reported in Table 11, not recomputed replacements. In particular, the table reports 39.2% for 2020 export growth while the rounded level values imply 35.9%; the pipeline preserves the official table value and records this source inconsistency rather than silently changing it.

## `ipc_purchase_source_china_2016_2023.csv`

This dataset contains all eight published observations from 2016 through 2023. None is interpolated.

| Field | Type | Definition |
|---|---|---|
| `year` | integer | Survey trend year, 2016 through 2023 |
| `share_percent` | decimal | **Share of surveyed cross-border shoppers whose latest purchase came from China.** |
| `measure` | text | The definition above, repeated to prevent scope loss |
| `sample_note` | text | Published trend-country scope, with the full 2023 survey distinguished |

This is a respondent/purchase-origin share. It is **not China's share of global e-commerce sales value**, retail revenue, merchandise value, or trade value. The public 2023 survey covered 32,510 respondents in 41 markets. IPC describes a 24-country continuous trend sample. The full-survey respondent count must not be assigned to this trend sample.

## `unctad_business_ecommerce_sales_2016_2022.csv`

Each row is the approximate central estimate shown by UNCTAD for businesses in 43 covered economies. These economies represented about 76% of global GDP and 73% of global exports, so the values must not be described as a complete observed global total.

| Field | Type | Definition |
|---|---|---|
| `year` | integer | Calendar/reporting year, 2016-2022 |
| `sales_trillion_usd` | decimal | Approximate business e-commerce sales, current US$ trillion, rounded to one decimal after vector-chart calibration |
| `coverage_economies` | integer | Number of developed and developing economies covered: 43 |
| `estimate_status` | text | Qualification applied to the chart-derived value; 2022 explicitly says `indicative estimate` |
| `source_page` | text | Figure and report page locator |
| `notes` | text | Estimation and comparability limitations |

From 2016-2021, one to six percent of the central estimate is based on extrapolated figures; turnover-based estimates raise the estimated portion to roughly 7-12%. In 2022, estimates account for about one third of the total, so UNCTAD says the figure should be regarded as indicative. Industries, firm sizes, taxes, discounts, and returns are not harmonized across every economy.

## `metrics_summary.json`

This generated JSON contains only values calculated by the scripts. It includes:

- the 2018-2024 China CBEC growth multiple and six-year CAGR;
- 2024 export and import shares;
- the IPC endpoint change, the 2019–2022 decline, the 2023 rebound, and survey-scope flags;
- the UNCTAD coverage and approximate 2021/2022 values.

## RCEP source table

The additional raw RCEP table is a country-by-year matrix for 11 economies and 2013–2022. Its values are allocated-export-proxy/model-implied-export ratios. It is used by the poster heatmap and scatter; it is not a newly generated output of the three-stream data pipeline.
