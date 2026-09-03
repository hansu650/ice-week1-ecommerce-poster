"""Validate the committed final-poster delivery using the Python standard library."""

from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote


ROOT = Path(__file__).resolve().parents[1]
POSTER = ROOT / "poster"
FINAL = POSTER / "final"
EVIDENCE = POSTER / "evidence"
EXPECTED_URL = "https://github.com/hansu650/ice-week1-ecommerce-poster"
EXPECTED_VIEWBOX = "0 0 4960 3600"
EXPECTED_CHECK_COUNT = 35
EXPECTED_QR_CASES = 4
MARKDOWN_FILES = (
    ROOT / "README.md",
    ROOT / "docs" / "FINAL_POSTER_PROCESS.md",
    POSTER / "README.md",
    EVIDENCE / "README.md",
    POSTER / "source" / "README.md",
)


def digest(path: Path) -> str:
    result = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            result.update(block)
    return result.hexdigest()


def require(condition: bool, message: str, failures: list[str]) -> None:
    if not condition:
        failures.append(message)


def load_json(path: Path, failures: list[str]):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        failures.append(f"Could not load {path.relative_to(ROOT)}: {exc}")
        return {}


def parse_checksums(path: Path, failures: list[str]) -> dict[str, str]:
    checksums: dict[str, str] = {}
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        failures.append(f"Could not read {path.relative_to(ROOT)}: {exc}")
        return checksums
    for line_number, line in enumerate(lines, 1):
        if not line.strip():
            continue
        match = re.fullmatch(r"([0-9a-f]{64})  (.+)", line)
        if not match:
            failures.append(f"Invalid checksum line {line_number}: {line!r}")
            continue
        checksums[match.group(2)] = match.group(1)
    return checksums


def validate_markdown_links(path: Path, failures: list[str]) -> None:
    try:
        text = path.read_text(encoding="utf-8")
    except OSError as exc:
        failures.append(f"Could not read {path.relative_to(ROOT)}: {exc}")
        return
    for raw_target in re.findall(r"!?\[[^\]]*\]\(([^)]+)\)", text):
        target = raw_target.strip().split("#", 1)[0]
        if not target or re.match(r"^(?:https?://|mailto:)", target):
            continue
        resolved = (path.parent / unquote(target)).resolve()
        require(resolved.is_relative_to(ROOT.resolve()), f"Markdown link escapes repository: {raw_target}", failures)
        require(resolved.exists(), f"Broken Markdown link in {path.relative_to(ROOT)}: {raw_target}", failures)


def main() -> int:
    failures: list[str] = []
    expected_files = {
        "W1_Layout_A_Integrated_Final_4960.svg",
        "W1_Layout_A_Integrated_Final_4960.pdf",
        "W1_Layout_A_Integrated_Final_4960_review_preview.png",
    }
    required_records = {
        "manifest.json",
        "validation.json",
        "qr_metadata.json",
        "qr_verification.json",
    }

    for name in sorted(expected_files):
        require((FINAL / name).is_file(), f"Missing final artifact: {name}", failures)
    for name in sorted(required_records):
        require((EVIDENCE / name).is_file(), f"Missing evidence record: {name}", failures)
    for markdown_path in MARKDOWN_FILES:
        require(markdown_path.is_file(), f"Missing Markdown document: {markdown_path.relative_to(ROOT)}", failures)
        if markdown_path.is_file():
            validate_markdown_links(markdown_path, failures)

    public_text_files = (
        ROOT / "README.md",
        ROOT / "docs" / "FINAL_POSTER_PROCESS.md",
        POSTER / "README.md",
        EVIDENCE / "README.md",
        EVIDENCE / "qr_metadata.json",
        POSTER / "source" / "README.md",
        POSTER / "source" / "build_w1_story_poster_4960.mjs",
        POSTER / "source" / "generate_github_qr.py",
        POSTER / "source" / "verify_github_qr.py",
    )
    forbidden_literals = ("C:/Users/", "C:\\Users\\", "AppData", ".codex/sessions")
    for text_path in public_text_files:
        if not text_path.is_file():
            continue
        public_text = text_path.read_text(encoding="utf-8")
        for forbidden in forbidden_literals:
            require(forbidden not in public_text, f"Private machine path found in {text_path.relative_to(ROOT)}", failures)

    checksum_path = FINAL / "CHECKSUMS.sha256"
    require(checksum_path.is_file(), "Missing CHECKSUMS.sha256", failures)
    checksums = parse_checksums(checksum_path, failures) if checksum_path.is_file() else {}
    require(set(checksums) == expected_files, "Checksum file does not list exactly the three final artifacts", failures)
    for name, expected in checksums.items():
        artifact = FINAL / name
        if artifact.is_file():
            require(digest(artifact) == expected, f"SHA-256 mismatch: {name}", failures)

    svg_path = FINAL / "W1_Layout_A_Integrated_Final_4960.svg"
    if svg_path.is_file():
        with svg_path.open("rb") as handle:
            header = handle.read(8192).decode("utf-8", errors="replace")
        require(f'viewBox="{EXPECTED_VIEWBOX}"' in header, "SVG viewBox is not 0 0 4960 3600", failures)
        require('data-measure-role="poster"' in header, "SVG poster measurement marker is missing", failures)
        require("<svg" in header, "SVG root element is missing", failures)

    pdf_path = FINAL / "W1_Layout_A_Integrated_Final_4960.pdf"
    if pdf_path.is_file():
        with pdf_path.open("rb") as handle:
            prefix = handle.read(8)
            handle.seek(max(0, pdf_path.stat().st_size - 2048))
            suffix = handle.read()
        require(prefix.startswith(b"%PDF-"), "PDF header is invalid", failures)
        require(b"%%EOF" in suffix, "PDF EOF marker is missing", failures)

    validation = load_json(EVIDENCE / "validation.json", failures)
    checks = validation.get("checks", {})
    require(isinstance(checks, dict), "validation.checks is not an object", failures)
    if isinstance(checks, dict):
        require(len(checks) == EXPECTED_CHECK_COUNT, f"Expected {EXPECTED_CHECK_COUNT} project checks, found {len(checks)}", failures)
        failed_checks = sorted(name for name, value in checks.items() if value is not True)
        require(not failed_checks, f"Project checks failed: {failed_checks}", failures)
    require(validation.get("output", {}).get("viewBox") == EXPECTED_VIEWBOX, "Validation output viewBox mismatch", failures)

    manifest = load_json(EVIDENCE / "manifest.json", failures)
    canvas = manifest.get("canvas", {})
    require(canvas.get("width") == 4960 and canvas.get("height") == 3600, "Manifest canvas mismatch", failures)
    require(manifest.get("github", {}).get("url") == EXPECTED_URL, "Manifest GitHub URL mismatch", failures)
    require(len(manifest.get("reusedModules", [])) == 4, "Manifest should record four reused member modules", failures)
    require(len(manifest.get("references", [])) == 7, "Manifest should record seven references", failures)

    qr_metadata = load_json(EVIDENCE / "qr_metadata.json", failures)
    require(qr_metadata.get("url") == EXPECTED_URL, "QR metadata URL mismatch", failures)
    require(qr_metadata.get("errorCorrection") == "Q", "QR error correction should be Q", failures)
    require(qr_metadata.get("quietZoneModules") == 4, "QR quiet zone should be four modules", failures)
    require(qr_metadata.get("standaloneDecode") == EXPECTED_URL, "Standalone QR decode mismatch", failures)
    for label in ("svg", "png"):
        record = qr_metadata.get(label, {})
        relative_path = record.get("path", "")
        qr_asset = ROOT / relative_path
        require(bool(relative_path) and qr_asset.is_file(), f"Missing QR {label} asset: {relative_path}", failures)
        if relative_path and qr_asset.is_file():
            require(digest(qr_asset) == record.get("sha256"), f"QR {label} SHA-256 mismatch", failures)

    qr_report = load_json(EVIDENCE / "qr_verification.json", failures)
    qr_results = qr_report.get("results", [])
    require(qr_report.get("expectedUrl") == EXPECTED_URL, "QR report URL mismatch", failures)
    require(qr_report.get("allPassed") is True, "QR report allPassed is not true", failures)
    require(len(qr_results) == EXPECTED_QR_CASES, f"Expected {EXPECTED_QR_CASES} QR cases, found {len(qr_results)}", failures)
    require(all(item.get("matchesExpected") is True for item in qr_results), "One or more QR cases did not match", failures)

    summary = {
        "finalArtifacts": len(expected_files),
        "markdownDocuments": len(MARKDOWN_FILES),
        "projectChecks": len(checks) if isinstance(checks, dict) else 0,
        "qrAssets": 2,
        "qrCases": len(qr_results),
        "allPassed": not failures,
        "failures": failures,
    }
    print(json.dumps(summary, indent=2))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
