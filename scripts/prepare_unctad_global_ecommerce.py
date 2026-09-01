"""Prepare approximate UNCTAD business e-commerce totals from the official vector figure."""

from __future__ import annotations

import argparse
import csv
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "raw" / "unctad_business_ecommerce_figure2_vector_points_2016_2022.csv"
DEFAULT_OUTPUT = ROOT / "data" / "processed" / "unctad_business_ecommerce_sales_2016_2022.csv"

RAW_FIELDS = [
    "year",
    "line_top_pdf_points",
    "axis_zero_top_pdf_points",
    "axis_five_top_pdf_points",
    "source_figure",
    "source_printed_page",
    "source_physical_pdf_page",
]
OUTPUT_FIELDS = [
    "year",
    "sales_trillion_usd",
    "coverage_economies",
    "estimate_status",
    "source_page",
    "notes",
]


def _as_decimal(value: str, field: str) -> Decimal:
    try:
        return Decimal(value.strip())
    except InvalidOperation as exc:
        raise ValueError(f"{field} must be numeric, got {value!r}") from exc


def _verify_pdf_vector_points(source_pdf: Path, expected_rows: list[dict[str, str]]) -> None:
    """Check committed extraction coordinates against the blue central line in PDF page 10."""
    import pdfplumber

    with pdfplumber.open(source_pdf) as report:
        if len(report.pages) < 10:
            raise ValueError("UNCTAD report has fewer than 10 physical pages")
        page = report.pages[9]
        candidates = []
        for curve in page.curves:
            points = curve.get("pts") or []
            color = curve.get("stroking_color")
            if (
                curve.get("stroke")
                and not curve.get("fill")
                and len(points) == 7
                and curve.get("width", 0) > 300
                and isinstance(color, tuple)
                and len(color) == 3
                and abs(float(color[2]) - 0.612) < 0.02
            ):
                candidates.append(sorted(points, key=lambda point: point[0]))
        if len(candidates) != 1:
            raise ValueError(f"Expected one seven-point central line in UNCTAD Figure 2, found {len(candidates)}")

        extracted_y = [Decimal(str(point[1])) for point in candidates[0]]
        expected_y = [_as_decimal(row["line_top_pdf_points"], "line_top_pdf_points") for row in expected_rows]
        for year, actual, expected in zip(range(2016, 2023), extracted_y, expected_y, strict=True):
            if abs(actual - expected) > Decimal("0.02"):
                raise ValueError(f"UNCTAD vector point mismatch for {year}: {actual} vs {expected}")


def prepare(
    input_path: Path = DEFAULT_INPUT,
    output_path: Path = DEFAULT_OUTPUT,
    *,
    verify_source_pdf: Path | None = None,
) -> dict[str, float | int | str]:
    """Convert vector y-coordinates to one-decimal approximate US$ trillion totals."""
    with input_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != RAW_FIELDS:
            raise ValueError(f"Unexpected UNCTAD extraction fields: {reader.fieldnames}")
        raw_rows = [{key: (value or "").strip() for key, value in row.items()} for row in reader]

    years = [int(row["year"]) for row in raw_rows]
    if years != list(range(2016, 2023)):
        raise ValueError(f"Expected continuous ascending years 2016-2022, got {years}")

    if verify_source_pdf is not None:
        _verify_pdf_vector_points(verify_source_pdf, raw_rows)

    output_rows: list[dict[str, str | int]] = []
    sales_values: list[Decimal] = []
    for row in raw_rows:
        line_y = _as_decimal(row["line_top_pdf_points"], "line_top_pdf_points")
        zero_y = _as_decimal(row["axis_zero_top_pdf_points"], "axis_zero_top_pdf_points")
        five_y = _as_decimal(row["axis_five_top_pdf_points"], "axis_five_top_pdf_points")
        points_per_trillion = (zero_y - five_y) / Decimal("5")
        if points_per_trillion <= 0:
            raise ValueError("Invalid UNCTAD axis calibration")
        sales = ((zero_y - line_y) / points_per_trillion).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
        sales_values.append(sales)

        year = int(row["year"])
        status = "approximate central estimate from official figure"
        note = (
            "Digitized from the vector central line; 2016-2021 totals include limited extrapolation "
            "and turnover-based estimates."
        )
        if year == 2022:
            status = "approximate; indicative estimate"
            note = (
                "Digitized from the vector central line; about one third of the 2022 total is estimated, "
                "so UNCTAD says it should be regarded as indicative."
            )
        output_rows.append(
            {
                "year": year,
                "sales_trillion_usd": f"{sales:.1f}",
                "coverage_economies": 43,
                "estimate_status": status,
                "source_page": "Figure 2, printed p. 6 (physical PDF p. 10); total matches Figure 1",
                "notes": note,
            }
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=OUTPUT_FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(output_rows)

    return {
        "unit": "US$ trillion",
        "coverage_economies": 43,
        "coverage_global_gdp_pct_approx": 76,
        "coverage_global_exports_pct_approx": 73,
        "value_2021_trillion_usd_approx": float(sales_values[-2]),
        "value_2022_trillion_usd_approx_indicative": float(sales_values[-1]),
        "source": "UNCTAD/DTL/ECDE/2024/3, Figure 2 (same total as Figure 1)",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--verify-source-pdf",
        type=Path,
        help="Optional path to the official UNCTAD PDF; verifies the committed vector coordinates.",
    )
    args = parser.parse_args()
    metrics = prepare(args.input, args.output, verify_source_pdf=args.verify_source_pdf)
    print(f"Wrote {args.output}")
    print(f"Unit: {metrics['unit']}")
    print("All values are approximate central estimates digitized from the official vector chart.")
    print("The 2022 value is an indicative estimate, not a complete observed global total.")


if __name__ == "__main__":
    main()
