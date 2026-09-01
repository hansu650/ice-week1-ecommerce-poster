"""Prepare the revised 2018-2024 China cross-border e-commerce series."""

from __future__ import annotations

import argparse
import csv
import math
from decimal import Decimal, InvalidOperation
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "raw" / "china_cbec_trade_2018_2024_verified.csv"
DEFAULT_OUTPUT = ROOT / "data" / "processed" / "china_cbec_trade_2018_2024.csv"

FIELDNAMES = [
    "year",
    "total_import_export_100m_cny",
    "export_100m_cny",
    "import_100m_cny",
    "total_yoy_pct",
    "export_yoy_pct",
    "import_yoy_pct",
]


def _decimal(value: str, field: str, *, allow_blank: bool = False) -> Decimal | None:
    value = value.strip()
    if not value and allow_blank:
        return None
    try:
        return Decimal(value)
    except InvalidOperation as exc:
        raise ValueError(f"{field} must be numeric, got {value!r}") from exc


def prepare(input_path: Path = DEFAULT_INPUT, output_path: Path = DEFAULT_OUTPUT) -> dict[str, float | str]:
    """Validate the source transcription, write a normalized CSV, and return metrics."""
    with input_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != FIELDNAMES:
            raise ValueError(f"Unexpected China CBEC fields: {reader.fieldnames}")
        rows = [{key: (value or "").strip() for key, value in row.items()} for row in reader]

    years = [int(row["year"]) for row in rows]
    if years != list(range(2018, 2025)):
        raise ValueError(f"Expected continuous ascending years 2018-2024, got {years}")

    totals: list[Decimal] = []
    exports: list[Decimal] = []
    imports: list[Decimal] = []
    for index, row in enumerate(rows):
        total = _decimal(row["total_import_export_100m_cny"], "total_import_export_100m_cny")
        export = _decimal(row["export_100m_cny"], "export_100m_cny")
        import_value = _decimal(row["import_100m_cny"], "import_100m_cny")
        assert total is not None and export is not None and import_value is not None
        if total != export + import_value:
            raise ValueError(f"Accounting identity failed for {years[index]}: {total} != {export} + {import_value}")
        totals.append(total)
        exports.append(export)
        imports.append(import_value)

        for field in FIELDNAMES[4:]:
            value = _decimal(row[field], field, allow_blank=index == 0)
            if index == 0 and value is not None:
                raise ValueError(f"2018 {field} must be blank because the report shows no prior-year rate")
            if index > 0 and value is None:
                raise ValueError(f"{years[index]} {field} must not be blank")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    period_count = years[-1] - years[0]
    growth_multiple = float(totals[-1] / totals[0])
    cagr_pct = (math.pow(growth_multiple, 1 / period_count) - 1) * 100
    export_share_pct = float(exports[-1] / totals[-1] * 100)
    import_share_pct = float(imports[-1] / totals[-1] * 100)

    return {
        "unit": "RMB 100 million",
        "growth_multiple_2018_2024": round(growth_multiple, 6),
        "cagr_pct_2018_2024": round(cagr_pct, 6),
        "export_share_pct_2024": round(export_share_pct, 6),
        "import_share_pct_2024": round(import_share_pct, 6),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    metrics = prepare(args.input, args.output)
    print(f"Wrote {args.output}")
    print(f"Unit: {metrics['unit']}")
    print(f"2018-2024 growth multiple: {metrics['growth_multiple_2018_2024']:.3f}x")
    print(f"2018-2024 CAGR: {metrics['cagr_pct_2018_2024']:.2f}%")
    print(
        "2024 export/import shares: "
        f"{metrics['export_share_pct_2024']:.2f}% / {metrics['import_share_pct_2024']:.2f}%"
    )


if __name__ == "__main__":
    main()
