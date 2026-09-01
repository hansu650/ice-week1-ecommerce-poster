# Source acquisition index

This directory is an index, not a dump of the entire course-material folder or teammate ZIPs.

| Stream | Official or public source | Local committed raw artifact |
|---|---|---|
| China CBEC | MOFCOM report page and Table 11 | `data/raw/china_cbec_trade_2018_2024_verified.csv` |
| IPC consumer reach | IPC 2023 survey page/release; HKTDC 2024 slide 8 | `data/raw/ipc_purchase_source_china_2016_2023.csv` |
| UNCTAD global context | UNCTAD 2024 report, Figures 1-2 | `data/raw/unctad_business_ecommerce_figure2_vector_points_2016_2022.csv` |

Full citations, page numbers, access date, licences, and scope limitations are in [`../DATA_SOURCES.md`](../DATA_SOURCES.md). The official UNCTAD PDF is openly licensed, but is not duplicated here because the small vector-coordinate extraction plus official URL is sufficient for the deterministic build. It can be supplied locally to the optional verification command in [`../REPRODUCIBILITY.md`](../REPRODUCIBILITY.md).
