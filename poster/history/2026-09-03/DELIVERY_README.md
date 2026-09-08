# Final poster delivery

## Files

| Artifact | Purpose | Size | SHA-256 |
|---|---|---:|---|
| [`W1_Layout_A_Integrated_Final_4960.svg`](final/W1_Layout_A_Integrated_Final_4960.svg) | Canonical editable master | 77,424,126 bytes | `e63a2fde75dc247517f55c6fa57fcfc2fcd3fb6c2ef3590262d893be6d74d349` |
| [`W1_Layout_A_Integrated_Final_4960.pdf`](final/W1_Layout_A_Integrated_Final_4960.pdf) | Large-format print/viewing version | 57,686,135 bytes | `82e26f9cae135e6425a6c9a8dbca15a4884ce3c372b5e0a25183f71a0bdbe09c` |
| [`W1_Layout_A_Integrated_Final_4960_review_preview.png`](final/W1_Layout_A_Integrated_Final_4960_review_preview.png) | Lightweight repository preview | 1,414,475 bytes | `59aeaa179c2c603330b2fad6c0d601b7767d0f1346ff1c98eab66a79eae01f6a` |

The canvas is `4960 × 3600`; the print page recorded by the build is approximately `1189 × 862.984 mm`.

## Final-stage changes

- raised all six masthead visuals as one aligned row;
- moved the Stage 3 connector into a clear corridor;
- placed the connector layer above poster content so no arrowhead is covered;
- kept all four numbered connectors at the same length and stroke geometry;
- enlarged the GitHub QR after a low-resolution decode test exposed insufficient module density;
- revalidated the QR in four output contexts.

## Evidence and QA

- [`evidence/manifest.json`](evidence/manifest.json) records the layout identity, reused modules, derived figures, photographs, data sources, references, and GitHub target.
- [`evidence/validation.json`](evidence/validation.json) records 35/35 passing project-specific checks.
- [`evidence/qr_verification.json`](evidence/qr_verification.json) records successful decode outcomes for the standalone QR, full-resolution poster, 40% review preview, and a 150-DPI PDF render.
- [`final/CHECKSUMS.sha256`](final/CHECKSUMS.sha256) locks the three public final artifacts.

Run the repository-level delivery check from the repository root:

```bash
python scripts/validate_poster_delivery.py
```

## Source and reproducibility boundary

The data pipeline under the repository root is deterministic and directly rebuildable. The files under [`source/`](source/) preserve the final poster assembly and QR-generation logic, but the large poster builder also depends on the original team working tree: extracted teammate SVGs, licensed photographs, and local review assets are not all duplicated in this public repository. Set `POSTER_SOURCE_ROOT` to that working tree when rebuilding.

The committed final SVG is self-contained for viewing and editing. The SVG keeps vector modules as vector content, while the photographic assets remain embedded raster images.

## Rights and privacy

The final poster contains attributed external photographs and small team-process thumbnails. Repository publication does not grant blanket reuse rights. Raw course templates, student identifiers, private conversations, credentials, and full-resolution process photographs are intentionally excluded.
