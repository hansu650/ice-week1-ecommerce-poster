# Poster source notes

This directory preserves the final integration and QR logic:

- `build_w1_story_poster_4960.mjs` — composes the four-stage poster, exports SVG/PDF/previews, and writes the project manifest/validation;
- `generate_github_qr.py` — creates the repository QR as SVG and PNG, then decodes the PNG locally;
- `verify_github_qr.py` — verifies the QR in standalone and final-render contexts;
- `package.json` — Playwright dependency for the poster renderer;
- `requirements-qr.txt` — Python dependencies for QR generation/decoding.

## Rebuild boundary

The committed Final SVG is self-contained, but the assembly script also expects the original team working tree containing extracted member SVGs, source photographs, and review assets. Those files are not all duplicated here because the repository preserves contributor ZIPs and excludes private/full-resolution process material.

Set these optional environment variables when rebuilding:

- `POSTER_SOURCE_ROOT` — root of the original Week 1 working tree;
- `POSTER_OUTPUT_DIR` — output directory; defaults to `poster/final`;
- `POSTER_BROWSER_EXECUTABLE` — browser executable when Playwright’s bundled Chromium is not used;
- `POSTER_QR_SVG` — QR SVG override; defaults to `poster/assets/qr/github_repo_qr.svg`.

Install the renderer dependency:

```bash
cd poster/source
npm install
```

Generate the QR and then build:

```bash
python -m pip install -r requirements-qr.txt
python generate_github_qr.py
node build_w1_story_poster_4960.mjs
```

The public copy of the builder removes machine-specific user paths. A successful rebuild still requires the original source tree and licensed/private assets described above.
