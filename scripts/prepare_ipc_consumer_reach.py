"""Prepare the two observed IPC consumer-reach endpoints without interpolation."""

from __future__ import annotations

import argparse
import csv
from decimal import Decimal, InvalidOperation
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "raw" / "ipc_purchase_source_china_2016_2023.csv"
DEFAULT_OUTPUT = ROOT / "data" / "processed" / "ipc_purchase_source_china_2016_2023.csv"

FIELDNAMES = ["year", "share_percent", "measure", "sample_note"]
MEASURE_DEFINITION = "Share of surveyed cross-border shoppers whose latest purchase came from China."


def prepare(input_path: Path = DEFAULT_INPUT, output_path: Path = DEFAULT_OUTPUT) -> dict[str, float | int | str]:
    """Validate the two real observations and write a normalized endpoint file."""
    with input_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != FIELDNAMES:
            raise ValueError(f"Unexpected IPC fields: {reader.fieldnames}")
        rows = [{key: (value or "").strip() for key, value in row.items()} for row in reader]

    years = [int(row["year"]) for row in rows]
    if years != [2016, 2023]:
        raise ValueError(f"Only the observed 2016 and 2023 endpoints are allowed, got {years}")

    shares: list[Decimal] = []
    for row in rows:
        try:
            share = Decimal(row["share_percent"])
        except InvalidOperation as exc:
            raise ValueError(f"Invalid IPC share: {row['share_percent']!r}") from exc
        if not Decimal("0") <= share <= Decimal("100"):
            raise ValueError(f"IPC share outside 0-100: {share}")
        if not row["sample_note"]:
            raise ValueError(f"Missing sample note for {row['year']}")
        row["measure"] = MEASURE_DEFINITION
        shares.append(share)

    if shares != [Decimal("26"), Decimal("37")]:
        raise ValueError(f"Expected IPC endpoints 26% and 37%, got {shares}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDNAMES, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    return {
        "measure_definition": MEASURE_DEFINITION,
        "change_percentage_points_2016_2023": int(shares[-1] - shares[0]),
        "trend_sample_2023": 23005,
        "full_survey_sample_2023": 32510,
        "full_survey_markets_2023": 41,
        "trend_economies": 24,
        "not_sales_market_share": True,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    metrics = prepare(args.input, args.output)
    print(f"Wrote {args.output}")
    print(f"2016-2023 change: +{metrics['change_percentage_points_2016_2023']} percentage points")
    print("No intermediate years were interpolated or generated.")
    print("This is a shopper-response share, not China's share of global e-commerce sales.")


if __name__ == "__main__":
    main()
