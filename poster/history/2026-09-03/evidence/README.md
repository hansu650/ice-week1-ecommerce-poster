# Poster evidence records

This directory keeps the machine-readable records produced alongside the final poster.

| Record | Scope |
|---|---|
| [`manifest.json`](manifest.json) | Poster identity, canvas, narrative, reused modules, data, photographs, references, and QR target |
| [`validation.json`](validation.json) | 35 project-specific geometry, content, provenance, and export checks |
| [`qr_metadata.json`](qr_metadata.json) | QR payload, version, correction level, quiet zone, and standalone hash/decode record |
| [`qr_verification.json`](qr_verification.json) | Four decode contexts taken from the standalone QR and final poster/PDF renders |

These records support auditability; they do not turn project-specific checks into an external certification. A separate generic academic-poster gate was only partially applicable during local review because its asset contract expected `img[data-source=paper]`, whereas this poster integrates nested SVG modules. Browser-dependent checks were unavailable in that run. The repository therefore reports the applicable checks precisely instead of claiming that every external gate passed.
