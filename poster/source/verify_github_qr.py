from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np


EXPECTED_URL = "https://github.com/hansu650/ice-week1-ecommerce-poster"
POSTER_WIDTH = 4960
POSTER_HEIGHT = 3600
QR_REGION = (4675, 3285, 4950, 3560)


def read_image(path: Path):
    return cv2.imdecode(np.frombuffer(path.read_bytes(), dtype=np.uint8), cv2.IMREAD_COLOR)


def decode_variants(image, *, poster_crop: bool):
    height, width = image.shape[:2]
    working = image
    crop_pixels = None
    if poster_crop:
        x0, y0, x1, y1 = QR_REGION
        px0 = max(0, round(width * x0 / POSTER_WIDTH))
        py0 = max(0, round(height * y0 / POSTER_HEIGHT))
        px1 = min(width, round(width * x1 / POSTER_WIDTH))
        py1 = min(height, round(height * y1 / POSTER_HEIGHT))
        working = image[py0:py1, px0:px1]
        crop_pixels = [px0, py0, px1, py1]

    detector = cv2.QRCodeDetector()
    attempts = []
    variants = [("native", working)]
    for scale in (2, 4, 8):
        variants.append(
            (
                f"nearest_{scale}x",
                cv2.resize(working, None, fx=scale, fy=scale, interpolation=cv2.INTER_NEAREST),
            )
        )
    gray = cv2.cvtColor(working, cv2.COLOR_BGR2GRAY)
    _, thresholded = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    variants.append(("otsu_4x", cv2.resize(thresholded, None, fx=4, fy=4, interpolation=cv2.INTER_NEAREST)))

    for name, variant in variants:
        decoded, points, _ = detector.detectAndDecode(variant)
        attempts.append(
            {
                "variant": name,
                "decoded": decoded,
                "points": None if points is None else points.reshape(-1, 2).round(2).tolist(),
            }
        )
        if decoded:
            break

    decoded = next((attempt["decoded"] for attempt in attempts if attempt["decoded"]), "")
    return {
        "imagePixels": [width, height],
        "posterCrop": poster_crop,
        "cropPixels": crop_pixels,
        "decoded": decoded,
        "matchesExpected": decoded == EXPECTED_URL,
        "attempts": attempts,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Decode the GitHub QR from standalone and poster renders.")
    parser.add_argument("--standalone", type=Path, required=True)
    parser.add_argument("--poster", type=Path, action="append", default=[])
    parser.add_argument("--pdf-render", type=Path, action="append", default=[])
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()

    items = [("standalone", args.standalone, False)]
    items.extend((f"poster:{path.name}", path, True) for path in args.poster)
    items.extend((f"pdf:{path.name}", path, True) for path in args.pdf_render)

    results = []
    for label, path, poster_crop in items:
        image = read_image(path)
        if image is None:
            raise RuntimeError(f"Could not read verification image: {path}")
        result = decode_variants(image, poster_crop=poster_crop)
        result.update({"label": label, "path": str(path)})
        results.append(result)

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "expectedUrl": EXPECTED_URL,
        "allPassed": all(result["matchesExpected"] for result in results),
        "results": results,
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    if not report["allPassed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
