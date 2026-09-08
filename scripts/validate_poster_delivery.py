"""Validate the current public poster and its version-bound evidence records."""
from __future__ import annotations
import base64
import binascii
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import sys
from urllib.parse import unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SVG_NS = "{http://www.w3.org/2000/svg}"
EXPECTED_URL = "https://github.com/hansu650/ice-week1-ecommerce-poster"
EXPECTED_CHARTS = {
    "china_trade", "china_origin", "rcep_heatmap", "business_sales",
    "platform_sales", "trade_mix", "growth_waterfall", "rcep_opportunity",
}
EXPECTED_PHOTOS = {"warehouse_stock", "last_mile_delivery", "online_payment", "order_processing"}
EXPECTED_FILES = {"W1_Poster_Revised.svg", "W1_Poster_Revised.pdf", "W1_Poster_Preview.png", "poster.html"}
MARKDOWN_FILES = [
    "README.md", "poster/README.md", "poster/evidence/README.md",
    "poster/evidence/review_summary.md", "poster/source/README.md",
    "docs/TEACHER_FEEDBACK_REVISION_20260908.md", "docs/FINAL_POSTER_PROCESS.md",
    "DATA_SOURCES.md", "DATA_DICTIONARY.md", "REPRODUCIBILITY.md",
]

def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()

def require(ok, message, failures):
    if not ok:
        failures.append(message)

def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))

def file_record(root, record, failures):
    relative = record.get("path", "")
    target = (root / relative).resolve()
    if not relative or not target.is_relative_to(root.resolve()):
        failures.append(f"File record escapes repository: {relative}")
        return None
    if not target.is_file():
        failures.append(f"Missing file: {relative}")
        return None
    require(digest(target) == record.get("sha256"), f"SHA-256 mismatch: {relative}", failures)
    if "bytes" in record:
        require(target.stat().st_size == record["bytes"], f"Byte length mismatch: {relative}", failures)
    return target

def approved_blocks(copy):
    result = [value for key in ("rail", "trade", "consumer", "rcep", "global")
              for block in copy[key] for value in (block["heading"], block["text"])]
    return result + [copy["photo_scope"], copy["trade_chart_role"], copy["consumer_trend"]] + list(copy["advanced"].values())

def flat(value):
    return re.sub(r"\s+", "", value)

def validate_svg(svg_text, manifest, copy, failures):
    svg = ET.fromstring(svg_text)
    require(svg.get("viewBox") == "0 0 4960 3600", "SVG canvas mismatch", failures)
    charts = [node.get("data-chart") for node in svg.iter() if node.get("data-chart")]
    require(Counter(charts) == Counter(EXPECTED_CHARTS), "Chart inventory must contain exactly the eight approved charts", failures)
    images = list(svg.iter(SVG_NS + "image"))
    require(Counter(node.get("data-context-photo") for node in images) == Counter(EXPECTED_PHOTOS),
            "Photo inventory must contain exactly the four approved photos", failures)
    expected = {item["id"]: item["sha256"] for item in manifest["photos"]}
    require(set(expected) == EXPECTED_PHOTOS, "Manifest photo inventory mismatch", failures)
    for node in images:
        photo_id = node.get("data-context-photo")
        href = node.get("href", node.get("{http://www.w3.org/1999/xlink}href", ""))
        if not href.startswith("data:image/jpeg;base64,"):
            failures.append(f"Photo is not an embedded original JPEG: {photo_id}")
            continue
        try:
            payload = base64.b64decode(href.split(",", 1)[1], validate=True)
        except (ValueError, binascii.Error):
            failures.append(f"Invalid JPEG payload encoding: {photo_id}")
            continue
        require(payload.startswith(b"\xff\xd8"), f"JPEG signature mismatch: {photo_id}", failures)
        require(hashlib.sha256(payload).hexdigest() == expected.get(photo_id),
                f"JPEG payload hash mismatch: {photo_id}", failures)
    visible = " ".join("".join(node.itertext()) for node in svg.iter(SVG_NS + "text"))
    missing = [text for text in approved_blocks(copy) if flat(text) not in flat(visible)]
    require(not missing, f"Missing approved prose blocks: {len(missing)}", failures)
    require(not re.search(r"TODO|FIXME|PLACEHOLDER|Lorem ipsum|\\ref\{|\bundefined\b|\bNaN\b", visible),
            "Unresolved placeholder in poster text", failures)
    links = [node.get("href") for node in svg.iter(SVG_NS + "a")]
    require(len(links) == 15 and EXPECTED_URL in links, "Poster source/GitHub links mismatch", failures)
    return svg, links

def validate_layout(layout, html_hash, failures):
    require(layout.get("status") == "PASS", "Layout report is not PASS", failures)
    require(layout.get("htmlSha256") == html_hash, "Layout evidence belongs to a different HTML artifact", failures)
    require(layout.get("dimensions", {}).get("masterPx") == [4960, 3600], "Layout report canvas mismatch", failures)
    reports = layout.get("reports", [])
    require(Counter(row.get("media") for row in reports) == Counter(["screen", "print"]),
            "Both screen and print reports are required", failures)
    require(layout.get("standaloneErrors") == [], "Standalone module layout errors remain", failures)
    for report in reports:
        for key in ("outside", "textOverlaps", "photoOverlaps", "missingApprovedCopy", "placeholders"):
            require(report.get(key) == [], f"{report.get('media')} layout has {key}", failures)
        require(Counter(item["id"] for item in report.get("charts", [])) == Counter(EXPECTED_CHARTS),
                "Measured chart inventory mismatch", failures)
        require(Counter(item["id"] for item in report.get("photos", [])) == Counter(EXPECTED_PHOTOS),
                "Measured photo inventory mismatch", failures)
        require(report.get("githubVisible") is True, "GitHub URL is not visibly recorded", failures)

def markdown_links(root, relative, failures):
    path = root / relative
    text = path.read_text(encoding="utf-8")
    for raw in re.findall(r"!?\[[^\]]*\]\(([^)]+)\)", text):
        target = raw.strip().strip("<>").split("#", 1)[0]
        if not target or re.match(r"^(https?://|mailto:)", target):
            continue
        resolved = (path.parent / unquote(target)).resolve()
        require(resolved.is_relative_to(root.resolve()), f"Markdown link escapes repository: {relative}: {raw}", failures)
        require(resolved.exists(), f"Broken Markdown link: {relative}: {raw}", failures)
    require(not re.search(r"(?<![A-Za-z])[A-Za-z]:[\\/]", text), f"Machine-specific path in public document: {relative}", failures)

def validate(root=ROOT):
    root = Path(root).resolve()
    failures = []
    evidence = root / "poster/evidence"
    manifest = read_json(evidence / "manifest.json")
    require(manifest.get("schema_version") == 2, "Manifest schema version mismatch", failures)
    require(manifest.get("github", {}).get("url") == EXPECTED_URL, "Manifest GitHub URL mismatch", failures)
    require(manifest.get("canvas", {}).get("width") == 4960 and manifest.get("canvas", {}).get("height") == 3600,
            "Manifest canvas mismatch", failures)
    records = manifest.get("artifacts", {})
    require(set(records) == EXPECTED_FILES, "Exactly the four current public artifacts are required", failures)
    for record in records.values():
        file_record(root, record, failures)
    modules = manifest.get("modules", [])
    require(len(modules) == 7, "Seven editable chart modules are required", failures)
    for module in modules:
        for key in ("svg", "pdf"):
            file_record(root, module[key], failures)
    for record in manifest.get("public_data", []):
        file_record(root, record, failures)
    checksums = {}
    for line in (root / "poster/final/CHECKSUMS.sha256").read_text(encoding="utf-8").splitlines():
        match = re.fullmatch(r"([0-9a-f]{64})  ([^/\\]+)", line)
        if not match:
            failures.append("Malformed checksum line")
            continue
        checksums[match[2]] = match[1]
    require(checksums == {name: record["sha256"] for name, record in records.items()},
            "Checksum list does not match the current artifact records", failures)

    svg_path = root / "poster/final/W1_Poster_Revised.svg"
    svg_text = svg_path.read_text(encoding="utf-8")
    copy = read_json(root / "poster/source/POSTER_COPY.json")
    svg, links = validate_svg(svg_text, manifest, copy, failures)
    html_path = root / "poster/final/poster.html"
    html = html_path.read_text(encoding="utf-8")
    require('data-measure-role="poster"' in html, "HTML poster measurement marker missing", failures)
    require(svg_text in html, "HTML does not embed the exact current SVG master", failures)
    operative = re.sub(r"data:image/[^;]+;base64,[A-Za-z0-9+/=]+", "data:embedded", html)
    require(not re.search(r"<script\b[^>]*\bsrc\s*=|<(?:img|image)\b[^>]*\b(?:src|href)\s*=\s*['\"]https?://", operative, re.I),
            "Remote rendering dependency in current poster HTML", failures)
    layout = read_json(evidence / "layout_validation.json")
    validate_layout(layout, digest(html_path), failures)

    pdf = root / "poster/final/W1_Poster_Revised.pdf"
    with pdf.open("rb") as handle:
        prefix = handle.read(8)
        handle.seek(max(0, pdf.stat().st_size - 2048))
        suffix = handle.read()
    require(prefix.startswith(b"%PDF-") and b"%%EOF" in suffix, "Invalid PDF file structure", failures)
    artifact = read_json(evidence / "artifact_validation.json")
    require(artifact.get("status") == "PASS" and artifact.get("poster_sha256") == digest(pdf),
            "PDF verification does not bind to the current artifact", failures)
    require(artifact.get("poster_pages") == 1 and artifact.get("charts") == 8 and artifact.get("photos") == 4,
            "PDF verification scope mismatch", failures)
    require(artifact.get("approved_prose_preserved") is True, "Approved PDF prose not verified", failures)
    photo_checks = artifact.get("photo_and_link_checks", {})
    require(photo_checks.get("four_original_JPEG_payloads_preserved") is True, "Original PDF photo payloads not verified", failures)
    require(photo_checks.get("removed_photos_absent") is True, "Removed PDF photos are not recorded as absent", failures)
    require(Counter(item["uri"] for item in photo_checks.get("links", [])) == Counter(links),
            "PDF and SVG link targets differ", failures)
    require(artifact.get("vector_inspection", {}).get("status") == "PASS", "PDF vector-object review missing", failures)

    qr_meta = read_json(evidence / "qr_metadata.json")
    require(qr_meta.get("url") == EXPECTED_URL and qr_meta.get("standaloneDecode") == EXPECTED_URL,
            "Original QR target/decode record mismatch", failures)
    for key in ("svg", "png"):
        file_record(root, qr_meta[key], failures)
    qr_svg = ET.parse(root / qr_meta["svg"]["path"]).getroot()
    qr_paths = [node.get("d") for node in qr_svg.iter(SVG_NS + "path")]
    master_paths = {node.get("d") for node in svg.iter(SVG_NS + "path")}
    require(bool(qr_paths) and all(value in master_paths for value in qr_paths),
            "Current SVG does not preserve the original QR path pattern", failures)
    qr = read_json(evidence / "qr_verification.json")
    require(qr.get("status") == "PASS" and qr.get("pixel_identical") is True and qr.get("expectedUrl") == EXPECTED_URL,
            "Current QR continuity evidence mismatch", failures)
    require(qr.get("fresh_decode_performed") is False, "Current QR report must not claim a new decode", failures)
    require((root / qr.get("prior_decode_record", "")).is_file(), "Prior QR decode record missing", failures)

    for relative in MARKDOWN_FILES:
        markdown_links(root, relative, failures)
    for filename in ("manifest.json", "layout_validation.json", "artifact_validation.json", "qr_verification.json"):
        text = (evidence / filename).read_text(encoding="utf-8")
        require(not re.search(r"(?<![A-Za-z])[A-Za-z]:[\\/]", text),
                f"Machine-specific path in public record: {filename}", failures)
    return {
        "allPassed": not failures, "currentArtifacts": len(records), "chartModules": len(modules),
        "dataCharts": 8, "originalPhotoPayloads": 4, "approvedCopyBlocks": len(approved_blocks(copy)),
        "layoutMedia": ["screen", "print"], "qrVerification": "pattern and recorded pixel continuity; no new decode",
        "failures": failures,
    }

def main():
    try:
        result = validate()
    except (OSError, ValueError, KeyError, TypeError, ET.ParseError) as exc:
        result = {"allPassed": False, "failures": [f"Malformed or missing delivery input: {exc}"]}
    print(json.dumps(result, indent=2))
    return 0 if result["allPassed"] else 1

if __name__ == "__main__":
    sys.exit(main())
