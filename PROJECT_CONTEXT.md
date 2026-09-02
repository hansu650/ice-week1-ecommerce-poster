# Project Context

> Scope: Durable context for the ICE Week 1 e-commerce poster project only. This is not a chat transcript.
> Last reviewed: 2026-09-02
> Working label: project_pr handoff. `PROJECT_CONTEXT.md` remains the single canonical memory so there is no competing context file.
> Canonical memory: `PROJECT_CONTEXT.md`. Keep it separate from `README.md`, `materials/hansu650/MATERIALS.md`, and `docs/TEAM_FIGURE_HANDOFF.md`.

## Purpose

- [stated 2026-09-01] Build the Week 1 group poster around **“From Domestic Scale to Global Reach: How China's Cross-border E-commerce Is Reshaping Global Retail.”**
- [verified 2026-09-02] The project evidence chain is official source → provenance-preserving raw data → deterministic processing → teammate-ready data → teammate figures → final A0 poster. Evidence: [README.md](README.md).

## User-stated constraints

- [stated 2026-09-02] Maintain a dedicated GitHub Markdown memory and do not mix it with the repository's existing Markdown documents.
- [stated 2026-09-02] Preserve durable summaries of both the previous task and the current task here so work can resume even if a task page, session file, or pagination index later becomes incomplete.
- [stated 2026-09-01] Do not redesign teammates' poster modules or change their prompts; the data pipeline supports three independent drawing tasks.
- [stated 2026-09-01] The early long-poster draft was stopped because its visual direction was not accepted; it is reference material, not a final deliverable.
- [verified 2026-09-02] Do not commit private chats, credentials, tokens, student IDs, caches, environments, local session paths, or unrelated course files. Evidence: [CONTRIBUTING.md](CONTRIBUTING.md) and [README.md](README.md).

## Decisions

- [stated 2026-09-01] PR #2 was merged unchanged after the user explicitly accepted the copyright and repository-rule risk of its ZIP-contained PDFs.
- [stated 2026-09-01] PR #4 was merged unchanged after the user explicitly accepted the unclear reuse status of its backup UNCTAD PDF.
- [verified 2026-09-02] The Feature4X CVPR 2025 poster is retained as an external link-only design reference because public redistribution permission for the full poster image was not identified. Evidence: [references/design-reference/SOURCE.md](references/design-reference/SOURCE.md).

## Verified state

- [verified 2026-09-02] PRs [#1](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/1), [#2](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/2), [#3](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/3), [#4](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/4), and [#5](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/5) are merged into `main`.
- [verified 2026-09-02] Remote `main` is at merge commit [`55ff8df`](https://github.com/hansu650/ice-week1-ecommerce-poster/commit/55ff8df54e029f27429e003243499c31913d5c1a).
- [verified 2026-09-02] The reproducible pipeline added 31 files and passed deterministic rebuilding, data validation, five local tests, and [GitHub Actions](https://github.com/hansu650/ice-week1-ecommerce-poster/actions/runs/33504486657).
- [verified 2026-09-02] Three processed inputs are ready: `data/processed/china_cbec_trade_2018_2024.csv`, `data/processed/ipc_purchase_source_china_2016_2023.csv`, and `data/processed/unctad_business_ecommerce_sales_2016_2022.csv`.
- [verified 2026-09-02] Contributor materials are present under `materials/hansu650/`, `materials/Tao-123x/`, `materials/Milkwort-father/`, and `materials/cuiocuio/`.
- [verified 2026-09-02] The final teammate SVGs, assembled A0 PDF, and repository QR SVG are not yet in `main`. Their reserved paths are documented in [docs/TEAM_FIGURE_HANDOFF.md](docs/TEAM_FIGURE_HANDOFF.md).

## Active commitment

- [stated 2026-09-02] Keep this file maintained as the distinct GitHub project memory when durable decisions, verified milestones, blockers, or resume points change.

## Project / PR conversation handoff

### Previous task — `github+找素材`

- [verified 2026-09-02] The paginated task view stopped before the physical end of the underlying task log and showed an interrupted turn, but a full read through the true end recovered substantial later work, context compactions, tool results, and task completion records. The visible task index is therefore not a reliable sole endpoint.
- [verified 2026-09-02] The recovered true endpoint is: PRs #1–#5 merged, the reproducible data pipeline and three processed datasets landed in `main`, validation and CI passed, and the three final teammate SVG modules, A0 poster PDF, and repository QR SVG remained unfinished.

### Current task — recovery and durable handoff

- [verified 2026-09-02] The current task reconciled the indexed history with the complete later task-log records, rechecked the repository, PR, and CI state, and identified the real resume point recorded below.
- [verified 2026-09-02] This canonical memory was created in Ready-for-review PR [#6](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/6). At this review point, PR #6 is open, mergeable, not a draft, and changes only `PROJECT_CONTEXT.md`.

## PR ledger

| PR | Verified status on 2026-09-02 | Durable contribution |
| --- | --- | --- |
| [#1](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/1) | Merged | Initial user materials; merge commit [`179322f`](https://github.com/hansu650/ice-week1-ecommerce-poster/commit/179322f48cfab9392defa0ccbcb3bd5ee661cb5d). |
| [#2](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/2) | Merged | Tao-123x materials, with the accepted licence/repository-rule risk recorded above; merge commit [`1b28f21`](https://github.com/hansu650/ice-week1-ecommerce-poster/commit/1b28f211be14c5e07707fa7c470895e781fa612e). |
| [#3](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/3) | Merged | Milkwort-father materials after correcting the archive path; merge commit [`fe67f7d`](https://github.com/hansu650/ice-week1-ecommerce-poster/commit/fe67f7d632501dc70e0bdbea49e0cc6106381d08). |
| [#4](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/4) | Merged | cuiocuio materials, with the accepted backup-PDF reuse risk recorded above; merge commit [`fdc6a58`](https://github.com/hansu650/ice-week1-ecommerce-poster/commit/fdc6a581d72ebdc036b73b5b9e619ddb519795d4). |
| [#5](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/5) | Merged | Reproducible data pipeline, processed datasets, documentation, tests, and CI; merge commit [`55ff8df`](https://github.com/hansu650/ice-week1-ecommerce-poster/commit/55ff8df54e029f27429e003243499c31913d5c1a). |
| [#6](https://github.com/hansu650/ice-week1-ecommerce-poster/pull/6) | Open; Ready for review | Adds and maintains this single canonical project/task memory; only `PROJECT_CONTEXT.md` is changed. |

## Resume point

- [verified 2026-09-02] Data discovery, processing, validation, and the first five PR merges are complete; do not restart those stages without new evidence.
- [verified 2026-09-02] Resume from the handoff stage: receive and validate the three teammate SVG modules, preserve their scope labels and attribution, assemble the final A0 PDF, generate the repository QR SVG, and submit those deliverables through a separate PR. Evidence: [docs/TEAM_FIGURE_HANDOFF.md](docs/TEAM_FIGURE_HANDOFF.md).
- [verified 2026-09-02] Reserved output paths are `poster/modules/market-growth.svg`, `poster/modules/consumer-reach.svg`, `poster/modules/global-impact.svg`, `poster/final/ice-week1-poster-a0.pdf`, and `poster/assets/github-repository-qr.svg`.

## Recovery procedure

- [stated 2026-09-02] A future task should read this entire file first, then continue from the verified resume point instead of reconstructing the project from memory.
- [verified 2026-09-02] Cross-check remote `main`, the relevant PRs, GitHub Actions, [README.md](README.md), and [docs/TEAM_FIGURE_HANDOFF.md](docs/TEAM_FIGURE_HANDOFF.md); never assume that the last turn shown by a paginated task view is the true end.
- [verified 2026-09-02] If repository state and task history disagree and the local task log is available, audit it through physical end-of-file, reconcile the durable outcome, and update this one canonical file.
- [verified 2026-09-02] Store only concise project facts and handoff state here; keep raw chats, raw task logs, local paths, secrets, and personal identifiers out of the public repository.

## Key artifacts

- [verified 2026-09-02] [Repository](https://github.com/hansu650/ice-week1-ecommerce-poster) — remote source of truth.
- [verified 2026-09-02] [data/processed/](data/processed/) — teammate-ready tables.
- [verified 2026-09-02] [scripts/](scripts/) and [REPRODUCIBILITY.md](REPRODUCIBILITY.md) — deterministic build and validation entry points.
- [verified 2026-09-02] [DATA_DICTIONARY.md](DATA_DICTIONARY.md) and [DATA_SOURCES.md](DATA_SOURCES.md) — definitions, provenance, scope, and limitations.
- [verified 2026-09-02] [docs/TEAM_FIGURE_HANDOFF.md](docs/TEAM_FIGURE_HANDOFF.md) — current drawing-to-final-poster handoff.

## Known risks

- [verified 2026-09-02] `materials/Tao-123x/Tao-123x-week1-materials.zip` contains complete PDFs whose redistribution licences were not verified before merge. Evidence: PR #2 review history.
- [verified 2026-09-02] The backup UNCTAD PDF inside `materials/cuiocuio/cuiocuio-week1-materials.zip` did not show a clear reuse licence during review. Evidence: PR #4 review history.
- [verified 2026-09-02] MOFCOM/GACC reuse terms remain unclear; the hansu650 submission therefore stores an attributed factual transcription and original chart rather than the source report PDF or publisher figure. Evidence: [materials/hansu650/MATERIALS.md](materials/hansu650/MATERIALS.md).
