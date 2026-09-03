# Final poster process and evidence chain

## Purpose

This document connects the final Week 1 poster to the repository evidence that supports it. It is deliberately organised as a process chain rather than a gallery of outputs: each stage records what changed, what evidence exists, and what limitation remains.

## Quantified process overview

The private course-working audit tracks 121 unique evidence paths with no missing files. Only the public-safe subset is committed here. The assessable workload represented by that subset includes:

- three documented data streams;
- deterministic preparation, validation, and five passing data tests;
- four contributor evidence modules;
- three structured mini-figure review rounds;
- a 15-node local poster-version timeline from initial composition to Final;
- two targeted final feedback fixes with before/after evidence;
- 35 passing project-specific final checks;
- four successful QR decode contexts;
- five merged material/data pull requests before the Final delivery PR.

These counts are not used as a substitute for quality. They show how the final outcome is connected to research, collaboration, iteration, and verification.

## 1. Translating the brief into an evidence question

The team narrowed a broad “e-commerce trends” topic to a traceable question about China’s cross-border e-commerce growth and its regional and global industry effects. The poster was planned as a four-stage argument rather than four disconnected ownership boxes:

1. Question and method;
2. Trade scale;
3. Regional and global effects;
4. Synthesis.

The final layout identity and narrative are recorded in [`poster/evidence/manifest.json`](../poster/evidence/manifest.json).

## 2. Dividing the work without losing a common standard

Four contributors developed complementary evidence areas:

- `hansu650`: verified customs/market material, regional evidence, evidence calibration, integration, and final QA;
- `Tao-123x`: market scale and export-led trade material;
- `Milkwort-father`: consumer-reach material;
- `cuiocuio`: global-industry material.

The initial contribution history is preserved in [PR #1](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/1), [PR #2](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/2), [PR #3](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/3), and [PR #4](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/4). The original contributor ZIPs remain separated under [`materials/`](../materials/) to preserve attribution and avoid silently rewriting other members’ work.

Parallel work increased speed but introduced a predictable integration problem: independent modules did not automatically share the same hierarchy, colour, type, scope language, or evidence density. The later handoff and integration stages address that problem explicitly.

## 3. Building the data process before the poster

The repository’s strongest reproducibility chain is:

```text
documented official source
  -> data/raw/
  -> scripts/prepare_*.py
  -> data/processed/
  -> data/processed/metrics_summary.json
  -> validation and tests
  -> member figure handoff
```

The unified pipeline was added in [PR #5](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/5). Its key files are:

- [`DATA_SOURCES.md`](../DATA_SOURCES.md) — provenance and source limitations;
- [`DATA_DICTIONARY.md`](../DATA_DICTIONARY.md) — field definitions and units;
- [`scripts/build_all.py`](../scripts/build_all.py) — deterministic orchestration;
- [`scripts/validate_processed_data.py`](../scripts/validate_processed_data.py) — content checks;
- [`tests/test_processed_data.py`](../tests/test_processed_data.py) — five data-contract/determinism tests;
- [`docs/TEAM_FIGURE_HANDOFF.md`](TEAM_FIGURE_HANDOFF.md) — teammate-facing figure inputs.

This stage prevented the final graphic from becoming the first place where data discrepancies were discovered.

## 4. Preserving interpretation boundaries

The process checks not only whether a number was copied correctly but whether the wording matches its scope:

| Evidence | Retained interpretation |
|---|---|
| China CBEC series | approximately RMB 1.06T in 2018 to RMB 2.71T in 2024; 2024 exports approximately 79.5% |
| IPC endpoints | 26% to 37% of surveyed shoppers reporting that their latest cross-border purchase came from China |
| RCEP indicator | partner opportunity/association evidence, not a direct causal policy estimate |
| UNCTAD context | totals for 43 economies; 2022 remains indicative |

The resulting tables are under [`data/processed/`](../data/processed/). This distinction matters because numerical agreement alone does not make a claim safe: sample scope, proxy meaning, and causal verbs also require review.

## 5. Moving from attractive drafts to evidence-led modules

Local development included early long-poster and flowchart concepts. Some became visually coherent but were rejected because they did not carry enough verified evidence or used space less effectively than data-led alternatives. The regional component was rebuilt as real-data evidence blocks instead of treating a polished flowchart as the final answer.

This rejected-work stage is retained in the course evidence package rather than published as another “final” asset. Its value is reflective: a local visual pass did not override a weak evidence-to-claim relationship.

## 6. Reviewing figures in three structured rounds

Three local review rounds separated the decisions that are often collapsed into one final export:

1. story/workflow and style comparison;
2. targeted composition, title, grayscale, and colour-dependency revision;
3. advanced trade-mix, growth-decomposition, and RCEP-opportunity figures.

The accepted outputs were then integrated according to evidence density. High-information figures received more space, while contribution ownership was preserved through module attribution rather than equal-sized boxes.

## 7. Integrating the four modules

The final builder nests team SVG modules instead of converting every chart into a screenshot. The integration source is archived at [`poster/source/build_w1_story_poster_4960.mjs`](../poster/source/build_w1_story_poster_4960.mjs).

The public script has been privacy-sanitised: machine-specific user paths were replaced by environment variables. It still requires the original working-tree assets and is therefore an assembly record, not a claim that a fresh clone contains every licensed/private source asset.

The canonical final artifact is [`poster/final/W1_Layout_A_Integrated_Final_4960.svg`](../poster/final/W1_Layout_A_Integrated_Final_4960.svg). The PDF is retained separately for print/viewing.

## 8. Applying final feedback as measurable changes

The last visible feedback round identified two small but consequential problems:

- the six masthead visuals sat too low as a row;
- the Stage 3 connector arrowhead was partly covered.

The next revision raised the masthead visual group by 18 poster units, moved the Stage 3 arrow into a clear corridor, and placed the complete connector layer above content. All four arrows use the same 30-unit length and six-unit body stroke. The final validator records the masthead shift, connector-layer order, geometry consistency, and corridor clearances.

This stage demonstrates why a full-poster thumbnail is insufficient: final review also needs targeted crops and geometry-level checks.

## 9. Generating and testing the repository QR

The QR was generated offline by [`poster/source/generate_github_qr.py`](../poster/source/generate_github_qr.py) with:

- payload `https://github.com/hansu650/ice-week1-ecommerce-poster`;
- error correction Q;
- QR version 5;
- a four-module quiet zone.

The first embedded size decoded in the full-resolution poster and PDF but failed in the 40% review preview. The QR was enlarged and the complete test set was repeated. [`poster/evidence/qr_verification.json`](../poster/evidence/qr_verification.json) now records successful decoding in all four contexts:

1. standalone verification image;
2. 4960 × 3600 poster render;
3. 1984 × 1440 review preview;
4. 150-DPI PDF render.

This is stronger evidence than checking only that the source QR contains the correct URL: it tests the actual delivery media.

## 10. Locking the Final delivery

The final delivery contains:

- an editable SVG master;
- a large-format PDF;
- a lightweight review preview;
- SHA-256 checksums;
- a manifest;
- 35 project-specific checks;
- standalone and integrated QR records;
- a repository-level validator and GitHub Actions workflow.

Run:

```bash
python scripts/validate_poster_delivery.py
```

The validator checks artifact existence and hashes, SVG root metadata, basic PDF integrity, manifest identity, all 35 project checks, and the four recorded QR outcomes.

## 11. Honest validation boundary

The project-specific geometry, content, provenance, and QR checks pass. The process does not claim that every generic external gate passed. A separate academic-poster gate was only partially applicable because it expected paper figures marked as `img[data-source=paper]`, whereas this course poster nests SVG modules; browser-dependent checks were also unavailable in that run.

The failure was not hidden or bypassed with fake assets. The applicable validation scope is stated precisely in [`poster/evidence/README.md`](../poster/evidence/README.md).

## 12. Privacy, attribution, and portfolio use

This repository intentionally excludes:

- the course assessment specification and reflection template;
- student identifiers;
- private chats and account information;
- credentials, cookies, tokens, and local environments;
- full-resolution process photographs;
- an external reference poster without confirmed redistribution permission.

The final poster itself includes attributed external photographs and small team-process thumbnails. Their presence does not grant blanket reuse rights.

For assessment, the repository is supporting evidence rather than the submitted Portfolio. The strongest evidence chain combines the final poster, selected collaboration photographs kept in the private course document, the data process, version comparisons, feedback corrections, and verified pull-request/CI history.
