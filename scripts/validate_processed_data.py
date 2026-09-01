"""Validate committed processed datasets and their cross-file metrics."""

from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PROCESSED_DIR = ROOT / "data" / "processed"

CHINA_FIELDS = [
    "year",
    "total_import_export_100m_cny",
    "export_100m_cny",
    "import_100m_cny",
    "total_yoy_pct",
    "export_yoy_pct",
    "import_yoy_pct",
]
IPC_FIELDS = ["year", "share_percent", "measure", "sample_note"]
UNCTAD_FIELDS = [
    "year",
    "sales_trillion_usd",
    "coverage_economies",
    "estimate_status",
    "source_page",
    "notes",
]
IPC_MEASURE = "Share of surveyed cross-border shoppers whose latest purchase came from China."


class DataValidationError(ValueError):
    """Raised when a processed artifact violates the documented contract."""


def _read_csv(path: Path, expected_fields: list[str]) -> list[dict[str, str]]:
    if not path.exists():
        raise DataValidationError(f"Missing processed file: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != expected_fields:
            raise DataValidationError(f"Unexpected fields in {path.name}: {reader.fieldnames}")
        return [{key: (value or "").strip() for key, value in row.items()} for row in reader]


def _validate_china(processed_dir: Path) -> dict[str, float]:
    rows = _read_csv(processed_dir / "china_cbec_trade_2018_2024.csv", CHINA_FIELDS)
    years = [int(row["year"]) for row in rows]
    if years != list(range(2018, 2025)):
        raise DataValidationError(f"China years must be continuous 2018-2024: {years}")

    for index, row in enumerate(rows):
        required = CHINA_FIELDS[:4] + ([] if index == 0 else CHINA_FIELDS[4:])
        if any(not row[field] for field in required):
            raise DataValidationError(f"Unexpected China null in {row['year']}")
        if index == 0 and any(row[field] for field in CHINA_FIELDS[4:]):
            raise DataValidationError("2018 year-over-year fields must be blank")
        total = float(row["total_import_export_100m_cny"])
        export = float(row["export_100m_cny"])
        import_value = float(row["import_100m_cny"])
        if not math.isclose(total, export + import_value, abs_tol=1e-9):
            raise DataValidationError(f"China accounting identity failed in {row['year']}")
        for field in CHINA_FIELDS[4:]:
            if row[field] and not -100 <= float(row[field]) <= 1000:
                raise DataValidationError(f"Implausible percentage in {row['year']} {field}")

    first, last = rows[0], rows[-1]
    first_total = float(first["total_import_export_100m_cny"])
    last_total = float(last["total_import_export_100m_cny"])
    growth = last_total / first_total
    return {
        "growth": growth,
        "cagr": (growth ** (1 / 6) - 1) * 100,
        "export_share": float(last["export_100m_cny"]) / last_total * 100,
        "import_share": float(last["import_100m_cny"]) / last_total * 100,
    }


def _validate_ipc(processed_dir: Path) -> int:
    rows = _read_csv(processed_dir / "ipc_purchase_source_china_2016_2023.csv", IPC_FIELDS)
    years = [int(row["year"]) for row in rows]
    shares = [float(row["share_percent"]) for row in rows]
    if years != [2016, 2023] or shares != [26.0, 37.0]:
        raise DataValidationError(f"IPC must contain only 2016=26 and 2023=37, got {list(zip(years, shares))}")
    if any(not 0 <= share <= 100 for share in shares):
        raise DataValidationError("IPC percentage outside 0-100")
    if any(row["measure"] != IPC_MEASURE for row in rows):
        raise DataValidationError("IPC measure definition is missing or altered")
    if any(not row["sample_note"] for row in rows):
        raise DataValidationError("IPC sample notes must be retained")
    return int(shares[-1] - shares[0])


def _validate_unctad(processed_dir: Path) -> None:
    rows = _read_csv(processed_dir / "unctad_business_ecommerce_sales_2016_2022.csv", UNCTAD_FIELDS)
    years = [int(row["year"]) for row in rows]
    if years != list(range(2016, 2023)):
        raise DataValidationError(f"UNCTAD years must be continuous 2016-2022: {years}")
    for row in rows:
        if any(not row[field] for field in UNCTAD_FIELDS):
            raise DataValidationError(f"UNCTAD null in {row['year']}")
        if not 0 < float(row["sales_trillion_usd"]) < 100:
            raise DataValidationError(f"UNCTAD value outside expected range in {row['year']}")
        if int(row["coverage_economies"]) != 43:
            raise DataValidationError("UNCTAD coverage must remain 43 economies")
        if "approximate" not in row["estimate_status"]:
            raise DataValidationError(f"UNCTAD digitized value not marked approximate in {row['year']}")
    if "indicative estimate" not in rows[-1]["estimate_status"]:
        raise DataValidationError("UNCTAD 2022 must be marked as an indicative estimate")


def validate_processed_dir(processed_dir: Path = DEFAULT_PROCESSED_DIR) -> None:
    china = _validate_china(processed_dir)
    ipc_change = _validate_ipc(processed_dir)
    _validate_unctad(processed_dir)

    summary_path = processed_dir / "metrics_summary.json"
    if not summary_path.exists():
        raise DataValidationError(f"Missing metrics summary: {summary_path}")
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    if summary.get("schema_version") != 1:
        raise DataValidationError("Unexpected metrics summary schema version")
    china_summary = summary["china_cbec"]
    ipc_summary = summary["ipc_consumer_reach"]
    unctad_summary = summary["unctad_business_ecommerce"]
    expected_china = {
        "growth_multiple_2018_2024": china["growth"],
        "cagr_pct_2018_2024": china["cagr"],
        "export_share_pct_2024": china["export_share"],
        "import_share_pct_2024": china["import_share"],
    }
    for key, expected in expected_china.items():
        if not math.isclose(float(china_summary[key]), expected, abs_tol=1e-6):
            raise DataValidationError(f"Metrics summary mismatch for {key}")
    if china_summary.get("unit") != "RMB 100 million":
        raise DataValidationError("China unit must be explicit: RMB 100 million")
    if ipc_summary.get("change_percentage_points_2016_2023") != ipc_change:
        raise DataValidationError("IPC change must be computed as +11 percentage points")
    if ipc_summary.get("not_sales_market_share") is not True:
        raise DataValidationError("IPC summary must warn that this is not a sales market share")
    if unctad_summary.get("coverage_economies") != 43:
        raise DataValidationError("UNCTAD summary coverage mismatch")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--processed-dir", type=Path, default=DEFAULT_PROCESSED_DIR)
    args = parser.parse_args()
    validate_processed_dir(args.processed_dir)
    print(f"Validation passed for {args.processed_dir}")
    print("Checked years, units, null policy, percentages, accounting identity, estimates, and summary metrics.")


if __name__ == "__main__":
    main()
