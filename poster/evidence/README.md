# Current poster evidence

- [manifest.json](manifest.json): current artifacts, hashes, eight chart identifiers, four photos, modules and data provenance.
- [layout_validation.json](layout_validation.json): actual screen and print measurements bound to the current HTML hash.
- [artifact_validation.json](artifact_validation.json): public standalone-poster portion of the completed local PDF checks.
- [qr_metadata.json](qr_metadata.json): unchanged original QR asset and its standalone decode record.
- [qr_verification.json](qr_verification.json): current pixel-identity continuity record; no new decode claimed.
- [review_summary.md](review_summary.md): public summary of the fresh final review.

The course-specific checks pass. The generic conference-paper gate suite is not represented as passed. The 35-check/four-decode records for the earlier poster remain under [the dated archive](../history/2026-09-03/evidence/).

Repository CI verifies artifact/checksum binding, SVG content and photo payloads, documented layout results, approved copy, links and QR path continuity. It does not rerun the original GUI visual review or claim a new QR decode.
