# Data sources and reuse notes

Initial source retrieval: **2026-09-01**. The eight IPC observations and final poster were checked against the retained source reports on **2026-09-08**; this does not claim a fresh download of every URL.

## A. China cross-border e-commerce, 2018-2024

- Publisher: Ministry of Commerce of the People's Republic of China.
- Report: *China Digital Trade Development Report 2025*.
- Source page: <https://fms.mofcom.gov.cn/xxfb/art/2025/art_3aeb2e47113845bdb16dcb053e5f6e9d.html>
- Data locator: Table 11, physical PDF page 68 / printed page 62; the table attributes the data to the General Administration of Customs of China.
- Coverage: 2018-2024 revised report series; seven annual observations.
- Unit: RMB 100 million and percent.
- Data type: real official aggregate statistics, manually transcribed and checked; not transaction-level customs data.
- Reuse: the government report does not state a Creative Commons or comparable open-data licence. **Licence pending verification; retain attribution.**

The separate 2020-2024 preliminary customs sequence is not used here because it must not be mixed with the revised 2018-2024 report series. Unsupported 2025/2026 demonstration values are excluded.

## B. IPC purchase origins, 2016–2023

- Primary survey organization: International Post Corporation (IPC), *Cross-Border E-Commerce Shopper Survey 2023*.
- Official 2023 survey page: <https://www.ipc.be/services/business-framework/cross-border-shopper-survey/2023>
- Official IPC release and methodology: <https://www.ipc.be/news-portal/general-news/2024/01/11/12/46/ipc-cross-border-e-commerce-shopper-survey-shows-more-positive-mindset-among-online-consumers>
- Public chart containing all eight annual observations: Irina Fan, *Digital Trade Transformation: Cross-Border E-commerce*, HKTDC Research, 2024, slide 8: <https://www.aof.org.hk/docs/default-source/hkimr/conference-workshop/panel-2_1_irina-fan.pdf?sfvrsn=315bce5b_2>
- Published values for 2016–2023: 26, 33, 36, 36, 34, 31, 30 and 37 percent. All eight values come directly from slide 8.
- Survey scope: frequent cross-border online shoppers; full 2023 survey 32,510 respondents in 41 markets; IPC's release identifies 24 countries present in every survey since 2016. The current dataset does not attach an unverified respondent count to the continuous trend sample.
- Data type: published annual survey-chart observations; no respondent-level microdata and no interpolation.
- Citation roles: HKTDC supplies the complete historical chart; IPC supplies original survey scope and the delivery/customs findings used in the accompanying analysis. HKTDC attributes its chart to IPC.
- Reuse: IPC/HKTDC public-page and presentation reuse terms for these values are not explicit. **Licence pending verification; redraw the values and retain attribution.**

## C. UNCTAD business e-commerce, 2016-2022

- Publisher: United Nations Conference on Trade and Development (UNCTAD).
- Report: *Business e-commerce sales and the role of online platforms*, UNCTAD Technical Notes on ICT for Development No. 1, 2024, document `UNCTAD/DTL/ECDE/2024/3`.
- Official publication page: <https://unctad.org/publication/business-e-commerce-sales-and-role-online-platforms-advance-copy>
- Official PDF: <https://unctad.org/system/files/official-document/dtlecde2024d3_en.pdf>
- Data locator: Figure 2, printed page 6 / physical PDF page 10. Box 1 states that its central estimate matches the Figure 1 overall total.
- Coverage: 43 economies representing about 76% of global GDP and 73% of global exports.
- Values: approximate totals obtained by calibrating the official PDF's seven-point vector line against its 0 and 5 US$ trillion gridlines, then rounding to one decimal.
- Licence: **Creative Commons Attribution 3.0 IGO (CC BY 3.0 IGO)**, stated on physical PDF page 2: <https://creativecommons.org/licenses/by/3.0/igo/>
- Attribution: `Source: UNCTAD (2024), UNCTAD/DTL/ECDE/2024/3, CC BY 3.0 IGO.`

The current UNCTADstat analytical table and metadata are useful for economy-level follow-up, but they are not substituted for the report's historical 43-economy aggregate:

- Viewer: <https://unctadstat.unctad.org/datacentre/dataviewer/US.ECommerceTotal/>
- Metadata API: <https://unctadstat-api.unctad.org/api/reportMetadata/US.ECommerceTotal/en>

UNCTAD separately reports that transactions through 37 major digital intermediary platforms rose from about US$2.6 trillion in 2019 to US$4.0 trillion in 2021, an increase of about 55% (physical PDF pages 35-36, Figure 16). This endpoint comparison is documented but is not expanded into an invented annual series.

## D. RCEP model-ratio table

- Source: Zhang and Asraf bin Abdullah (2026), Table 19: <https://doi.org/10.1057/s41599-026-07267-z>.
- Public table: [data/raw/rcep_trade_potential_by_country_year.csv](data/raw/rcep_trade_potential_by_country_year.csv).
- Coverage: 11 partner economies, 2013–2022.
- Measure: allocated bilateral export proxy divided by model-implied exports. These are historical model ratios, not directly observed bilateral sales or causal effects of the RCEP agreement.
- The paper's categories use country averages over the period; a final-year value can fall in a different interval.

## E. Rounded totals used by the final poster

The final poster uses UNCTAD's prose totals of almost US$25 trillion for 2021 and an indicative US$27 trillion for 2022, plus its separate 37-platform comparison. The existing Figure 2 vector-digitisation pipeline remains a distinct, explicitly approximate series. The two business/platform measures cover different periods and activities and cannot be added.
