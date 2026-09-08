# Poster source

The current assembly source is [build_text_expansion_20260908.mjs](build_text_expansion_20260908.mjs), with [POSTER_COPY.json](POSTER_COPY.json) and the [eight-point IPC input](data/ipc_purchase_origins_2016_2023.csv).

The committed [SVG](../final/W1_Poster_Revised.svg) and [HTML](../final/poster.html) are self-contained for viewing and editing. The assembly script additionally requires the original Week 1 source tree, including licensed photos, logo artwork and the earlier team mini-figure sources; those inputs are not all duplicated here.

Set:
- `POSTER_SOURCE_ROOT`: the original Week 1 (9-1) source directory.
- `POSTER_OUTPUT_DIR`: optional output directory; defaults to `rendered` beside the script.
- `POSTER_BROWSER_EXECUTABLE`: optional browser executable; otherwise Playwright's installed Chromium is used.

The original Comic Sans MS font must be available for matching layout. Install the declared Node dependencies, then run `npm run build`. A rebuild with different fonts or browser versions is not expected to reproduce the committed PDF bytes exactly.

[build_w1_story_poster_4960.mjs](build_w1_story_poster_4960.mjs), [generate_github_qr.py](generate_github_qr.py) and [verify_github_qr.py](verify_github_qr.py) preserve the historical assembly/QR workflow. Use `npm run build:historical` only when intentionally rebuilding that earlier design.
