"""Build every processed dataset and the deterministic metrics summary."""

from __future__ import annotations

import argparse
import json
import tempfile
from pathlib import Path

from prepare_china_cbec import prepare as prepare_china
from prepare_ipc_consumer_reach import prepare as prepare_ipc
from prepare_unctad_global_ecommerce import prepare as prepare_unctad


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
COMMITTED_PROCESSED_DIR = ROOT / "data" / "processed"
OUTPUT_NAMES = [
    "china_cbec_trade_2018_2024.csv",
    "ipc_purchase_source_china_2016_2023.csv",
    "unctad_business_ecommerce_sales_2016_2022.csv",
    "metrics_summary.json",
]


def build(output_dir: Path, *, verify_unctad_pdf: Path | None = None) -> dict[str, object]:
    """Build all processed artifacts under output_dir."""
    output_dir.mkdir(parents=True, exist_ok=True)

    china = prepare_china(
        RAW_DIR / "china_cbec_trade_2018_2024_verified.csv",
        output_dir / "china_cbec_trade_2018_2024.csv",
    )
    ipc = prepare_ipc(
        RAW_DIR / "ipc_purchase_source_china_2016_2023.csv",
        output_dir / "ipc_purchase_source_china_2016_2023.csv",
    )
    unctad = prepare_unctad(
        RAW_DIR / "unctad_business_ecommerce_figure2_vector_points_2016_2022.csv",
        output_dir / "unctad_business_ecommerce_sales_2016_2022.csv",
        verify_source_pdf=verify_unctad_pdf,
    )

    summary: dict[str, object] = {
        "schema_version": 1,
        "china_cbec": china,
        "ipc_consumer_reach": ipc,
        "unctad_business_ecommerce": unctad,
    }
    summary_path = output_dir / "metrics_summary.json"
    summary_path.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    return summary


def _compare_with_committed(generated_dir: Path) -> None:
    mismatches: list[str] = []
    for name in OUTPUT_NAMES:
        generated = generated_dir / name
        committed = COMMITTED_PROCESSED_DIR / name
        if not committed.exists():
            mismatches.append(f"missing committed file: {committed}")
        elif generated.read_bytes() != committed.read_bytes():
            mismatches.append(f"generated output differs: {name}")
    if mismatches:
        raise SystemExit("Reproducibility check failed:\n- " + "\n- ".join(mismatches))


def _print_summary(summary: dict[str, object]) -> None:
    china = summary["china_cbec"]
    ipc = summary["ipc_consumer_reach"]
    unctad = summary["unctad_business_ecommerce"]
    assert isinstance(china, dict) and isinstance(ipc, dict) and isinstance(unctad, dict)
    print(
        "China CBEC: "
        f"{china['growth_multiple_2018_2024']:.3f}x, "
        f"CAGR {china['cagr_pct_2018_2024']:.2f}%, "
        f"2024 export/import {china['export_share_pct_2024']:.2f}%/"
        f"{china['import_share_pct_2024']:.2f}% (RMB 100 million)."
    )
    print(f"IPC consumer reach: +{ipc['change_percentage_points_2016_2023']} percentage points; no interpolation.")
    print(
        "UNCTAD business e-commerce: "
        f"2021 about ${unctad['value_2021_trillion_usd_approx']:.1f}tn; "
        f"2022 about ${unctad['value_2022_trillion_usd_approx_indicative']:.1f}tn, indicative; "
        "43-economy coverage."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Build in a temporary directory and compare byte-for-byte with committed outputs.",
    )
    parser.add_argument(
        "--verify-unctad-pdf",
        type=Path,
        help="Optional local copy of the official report for vector-coordinate verification.",
    )
    args = parser.parse_args()

    if args.check:
        with tempfile.TemporaryDirectory(prefix="ice-week1-build-") as temporary:
            generated_dir = Path(temporary)
            summary = build(generated_dir, verify_unctad_pdf=args.verify_unctad_pdf)
            _compare_with_committed(generated_dir)
        print("Reproducibility check passed: generated files match committed outputs byte-for-byte.")
    else:
        summary = build(COMMITTED_PROCESSED_DIR, verify_unctad_pdf=args.verify_unctad_pdf)
        print(f"Built {len(OUTPUT_NAMES)} artifacts in {COMMITTED_PROCESSED_DIR}")
    _print_summary(summary)


if __name__ == "__main__":
    main()
