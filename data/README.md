# Data layout

`data/raw/` contains only the compact inputs needed to reproduce the three primary processed tables. `data/processed/` contains generated artifacts and should be changed only by running `python scripts/build_all.py`.

| Raw input | Preparation code | Generated output |
|---|---|---|
| `raw/china_cbec_trade_2018_2024_verified.csv` | `scripts/prepare_china_cbec.py` | `processed/china_cbec_trade_2018_2024.csv` |
| `raw/ipc_purchase_source_china_2016_2023.csv` | `scripts/prepare_ipc_consumer_reach.py` | `processed/ipc_purchase_source_china_2016_2023.csv` |
| `raw/unctad_business_ecommerce_figure2_vector_points_2016_2022.csv` | `scripts/prepare_unctad_global_ecommerce.py` | `processed/unctad_business_ecommerce_sales_2016_2022.csv` |

`processed/metrics_summary.json` is also generated and contains the calculated 2018-2024 growth multiple, CAGR, 2024 export/import shares, and the IPC percentage-point change.

The raw China and IPC files are real preprocessed/transcribed data from the cited sources. The UNCTAD raw file contains vector coordinates extracted from the official report chart; the resulting monetary values are therefore marked approximate. No synthetic or interpolated social/economic observations are introduced by this repository.
