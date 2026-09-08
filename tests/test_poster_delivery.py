"""Regressions for version binding and lossless photo delivery."""
from __future__ import annotations
import base64
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from validate_poster_delivery import validate_layout, validate_svg

def test_old_layout_report_cannot_validate_a_new_html():
    report = json.loads((ROOT / "poster/evidence/layout_validation.json").read_text(encoding="utf-8"))
    failures = []
    validate_layout(report, "0" * 64, failures)
    assert "Layout evidence belongs to a different HTML artifact" in failures

def test_reencoded_photo_cannot_pass_original_payload_check():
    svg = (ROOT / "poster/final/W1_Poster_Revised.svg").read_text(encoding="utf-8")
    manifest = json.loads((ROOT / "poster/evidence/manifest.json").read_text(encoding="utf-8"))
    poster_copy = json.loads((ROOT / "poster/source/POSTER_COPY.json").read_text(encoding="utf-8"))
    # Alter decoded bytes while retaining a valid JPEG signature/base64 encoding.
    marker = "data:image/jpeg;base64,"
    start = svg.index(marker) + len(marker)
    end = svg.index('"', start)
    payload = base64.b64decode(svg[start:end]) + b"changed"
    altered = svg[:start] + base64.b64encode(payload).decode("ascii") + svg[end:]
    failures = []
    validate_svg(altered, manifest, poster_copy, failures)
    assert any("JPEG payload hash mismatch" in failure for failure in failures)
