from __future__ import annotations

import hashlib
import html
import json
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np
import qrcode
from qrcode.constants import ERROR_CORRECT_Q


URL = "https://github.com/hansu650/ice-week1-ecommerce-poster"
HERE = Path(__file__).resolve().parent
QR_DIR = HERE.parent / "assets" / "qr"
SVG_OUTPUT = QR_DIR / "github_repo_qr.svg"
PNG_OUTPUT = QR_DIR / "github_repo_qr_verification.png"
METADATA_OUTPUT = QR_DIR / "github_repo_qr.metadata.json"
REPOSITORY_ROOT = HERE.parent.parent
ERROR_CORRECTION = "Q"
QUIET_ZONE_MODULES = 4
PNG_BOX_SIZE = 24


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def matrix_to_svg(matrix: list[list[bool]]) -> str:
    size = len(matrix)
    commands: list[str] = []
    for y, row in enumerate(matrix):
        x = 0
        while x < size:
            if not row[x]:
                x += 1
                continue
            start = x
            while x < size and row[x]:
                x += 1
            run = x - start
            commands.append(f"M{start} {y}h{run}v1h-{run}z")

    escaped_url = html.escape(URL, quote=True)
    path_data = "".join(commands)
    return "\n".join(
        [
            '<?xml version="1.0" encoding="UTF-8"?>',
            (
                f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" '
                f'viewBox="0 0 {size} {size}" role="img" aria-label="QR code for {escaped_url}" '
                f'data-qr-url="{escaped_url}" data-error-correction="{ERROR_CORRECTION}" '
                f'data-quiet-zone-modules="{QUIET_ZONE_MODULES}" shape-rendering="crispEdges">'
            ),
            "  <title>GitHub repository QR code</title>",
            f"  <desc>{escaped_url}</desc>",
            f'  <rect x="0" y="0" width="{size}" height="{size}" fill="#FFFFFF"/>',
            f'  <path d="{path_data}" fill="#000000"/>',
            "</svg>",
            "",
        ]
    )


def decode_png(path: Path) -> tuple[str, list[list[float]] | None]:
    image = cv2.imdecode(np.frombuffer(path.read_bytes(), dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise RuntimeError(f"Could not read generated QR PNG: {path}")
    decoded, points, _ = cv2.QRCodeDetector().detectAndDecode(image)
    point_list = None if points is None else points.reshape(-1, 2).round(2).tolist()
    return decoded, point_list


def main() -> None:
    QR_DIR.mkdir(parents=True, exist_ok=True)
    qr_code = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_Q,
        box_size=PNG_BOX_SIZE,
        border=QUIET_ZONE_MODULES,
    )
    qr_code.add_data(URL)
    qr_code.make(fit=True)
    matrix = qr_code.get_matrix()

    SVG_OUTPUT.write_text(matrix_to_svg(matrix), encoding="utf-8")
    raster = qr_code.make_image(fill_color="black", back_color="white").convert("RGB")
    raster.save(PNG_OUTPUT, format="PNG", optimize=True)

    decoded, points = decode_png(PNG_OUTPUT)
    if decoded != URL:
        raise RuntimeError(f"QR self-check failed: decoded {decoded!r}, expected {URL!r}")

    metadata = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "url": URL,
        "errorCorrection": ERROR_CORRECTION,
        "qrVersion": qr_code.version,
        "matrixModulesIncludingQuietZone": len(matrix),
        "quietZoneModules": QUIET_ZONE_MODULES,
        "verificationPngPixels": list(raster.size),
        "standaloneDecode": decoded,
        "standaloneDetectorPoints": points,
        "svg": {"path": SVG_OUTPUT.relative_to(REPOSITORY_ROOT).as_posix(), "sha256": sha256(SVG_OUTPUT)},
        "png": {"path": PNG_OUTPUT.relative_to(REPOSITORY_ROOT).as_posix(), "sha256": sha256(PNG_OUTPUT)},
    }
    METADATA_OUTPUT.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
