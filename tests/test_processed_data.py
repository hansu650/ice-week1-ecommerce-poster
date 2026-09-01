from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import build_all  # noqa: E402
from validate_processed_data import validate_processed_dir  # noqa: E402


def _rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def test_committed_processed_data_validates() -> None:
    validate_processed_dir(ROOT / "data" / "processed")


def test_clean_build_is_byte_identical(tmp_path: Path) -> None:
    build_all.build(tmp_path)
    for name in build_all.OUTPUT_NAMES:
        assert (tmp_path / name).read_bytes() == (ROOT / "data" / "processed" / name).read_bytes()
    validate_processed_dir(tmp_path)


def test_china_metrics_are_derived_from_levels() -> None:
    summary = json.loads((ROOT / "data" / "processed" / "metrics_summary.json").read_text(encoding="utf-8"))
    china = summary["china_cbec"]
    assert china["growth_multiple_2018_2024"] == pytest.approx(27072 / 10557, abs=1e-6)
    assert china["cagr_pct_2018_2024"] == pytest.approx(((27072 / 10557) ** (1 / 6) - 1) * 100, abs=1e-6)
    assert china["export_share_pct_2024"] == pytest.approx(21520 / 27072 * 100, abs=1e-6)
    assert china["import_share_pct_2024"] == pytest.approx(5552 / 27072 * 100, abs=1e-6)


def test_ipc_has_two_observed_endpoints_only() -> None:
    rows = _rows(ROOT / "data" / "processed" / "ipc_purchase_source_china_2016_2023.csv")
    assert [(int(row["year"]), int(row["share_percent"])) for row in rows] == [(2016, 26), (2023, 37)]


def test_unctad_values_are_qualified() -> None:
    rows = _rows(ROOT / "data" / "processed" / "unctad_business_ecommerce_sales_2016_2022.csv")
    assert len(rows) == 7
    assert all(row["coverage_economies"] == "43" for row in rows)
    assert all("approximate" in row["estimate_status"] for row in rows)
    assert "indicative estimate" in rows[-1]["estimate_status"]
