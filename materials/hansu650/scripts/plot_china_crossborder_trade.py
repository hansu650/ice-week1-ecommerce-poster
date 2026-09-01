"""Validate the submitted customs series and render the poster figure.

Input and output paths are resolved relative to this file so the script can be
run from any working directory.
"""

from __future__ import annotations

import csv
from pathlib import Path

import matplotlib.pyplot as plt
from matplotlib.ticker import FuncFormatter, MultipleLocator


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "china-crossborder-ecommerce-2018-2024.csv"
FIGURE_DIR = ROOT / "figures"
PNG_PATH = FIGURE_DIR / "china-crossborder-trade-2018-2024.png"
SVG_PATH = FIGURE_DIR / "china-crossborder-trade-2018-2024.svg"

VALUE_COLUMNS = {
    "total_import_export_100m_cny": "Total",
    "export_100m_cny": "Exports",
    "import_100m_cny": "Imports",
}
EXPECTED_YEARS = list(range(2018, 2025))


def load_and_validate() -> list[dict[str, float]]:
    """Load the CSV and fail early if its evidence-chain invariants break."""
    with DATA_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {"year", *VALUE_COLUMNS}
        missing = required.difference(reader.fieldnames or [])
        if missing:
            raise ValueError(f"Missing required CSV columns: {sorted(missing)}")

        records: list[dict[str, float]] = []
        for source_row in reader:
            row = {"year": float(source_row["year"])}
            for column in VALUE_COLUMNS:
                row[column] = float(source_row[column])
            records.append(row)

    years = [int(row["year"]) for row in records]
    if years != EXPECTED_YEARS:
        raise ValueError(f"Expected years {EXPECTED_YEARS}, found {years}")

    for row in records:
        total = row["total_import_export_100m_cny"]
        parts = row["export_100m_cny"] + row["import_100m_cny"]
        if abs(total - parts) > 0.5:
            raise ValueError(
                f"Accounting check failed for {int(row['year'])}: "
                f"total={total:g}, exports+imports={parts:g}"
            )
    return records


def annotate_endpoint(ax, year: int, value: float, color: str, offset: tuple[int, int]) -> None:
    """Add a compact endpoint label without obscuring the line."""
    ax.annotate(
        f"{value / 10_000:.2f}tn",
        xy=(year, value),
        xytext=offset,
        textcoords="offset points",
        color=color,
        fontsize=10.5,
        fontweight="bold",
        ha="left",
        va="center",
        bbox={"boxstyle": "round,pad=0.25", "facecolor": "#FFFDF8", "edgecolor": "none", "alpha": 0.92},
    )


def render(records: list[dict[str, float]]) -> None:
    """Render a high-resolution PNG and an editable SVG from validated data."""
    FIGURE_DIR.mkdir(parents=True, exist_ok=True)

    years = [int(row["year"]) for row in records]
    palette = {
        "total_import_export_100m_cny": "#213A63",
        "export_100m_cny": "#E45F4F",
        "import_100m_cny": "#2D9186",
    }

    plt.rcParams.update(
        {
            "font.family": "DejaVu Sans",
            "axes.titleweight": "bold",
            "axes.labelcolor": "#384657",
            "xtick.color": "#536171",
            "ytick.color": "#536171",
        }
    )
    fig, ax = plt.subplots(figsize=(40 / 3, 7.5), dpi=240, facecolor="#F5F1E8")
    ax.set_facecolor("#F5F1E8")

    for column, label in VALUE_COLUMNS.items():
        values = [row[column] for row in records]
        ax.plot(
            years,
            values,
            color=palette[column],
            linewidth=3.2,
            marker="o",
            markersize=7,
            markeredgewidth=1.8,
            markeredgecolor="#F5F1E8",
            label=label,
            zorder=3,
        )

    ax.set_title(
        "China's Cross-border E-commerce Trade, 2018–2024",
        loc="left",
        fontsize=24,
        color="#172B4D",
        pad=24,
    )
    ax.text(
        0,
        1.015,
        "Customs-recorded imports and exports · RMB trillion",
        transform=ax.transAxes,
        fontsize=12.5,
        color="#657384",
        va="bottom",
    )

    ax.set_xlim(2017.75, 2024.72)
    ax.set_ylim(0, 30_000)
    ax.set_xticks(years)
    ax.yaxis.set_major_locator(MultipleLocator(5_000))
    ax.yaxis.set_major_formatter(FuncFormatter(lambda value, _: f"{value / 10_000:.1f}"))
    ax.grid(axis="y", color="#D7D1C7", linewidth=0.9, alpha=0.85)
    ax.grid(axis="x", visible=False)
    ax.tick_params(axis="both", labelsize=10.5, length=0, pad=8)
    for spine in ax.spines.values():
        spine.set_visible(False)

    first, last = records[0], records[-1]
    growth_multiple = last["total_import_export_100m_cny"] / first["total_import_export_100m_cny"]
    export_share = last["export_100m_cny"] / last["total_import_export_100m_cny"]
    ax.text(
        0.02,
        0.87,
        f"{growth_multiple:.2f}× total growth since 2018",
        transform=ax.transAxes,
        color="#172B4D",
        fontsize=13,
        fontweight="bold",
        bbox={"boxstyle": "round,pad=0.55", "facecolor": "#FFFDF8", "edgecolor": "#DDD5C9"},
    )
    ax.text(
        0.02,
        0.76,
        f"Exports = {export_share:.1%} of the 2024 total",
        transform=ax.transAxes,
        color="#A33D35",
        fontsize=12,
        fontweight="bold",
        bbox={"boxstyle": "round,pad=0.5", "facecolor": "#FFFDF8", "edgecolor": "#E4D6CE"},
    )

    annotate_endpoint(ax, years[-1], last["total_import_export_100m_cny"], palette["total_import_export_100m_cny"], (12, -2))
    annotate_endpoint(ax, years[-1], last["export_100m_cny"], palette["export_100m_cny"], (12, -2))
    annotate_endpoint(ax, years[-1], last["import_100m_cny"], palette["import_100m_cny"], (12, -2))

    ax.legend(
        loc="upper right",
        bbox_to_anchor=(1.0, 0.98),
        ncol=3,
        frameon=False,
        fontsize=11,
        handlelength=2.5,
        columnspacing=1.8,
    )
    fig.text(
        0.08,
        0.025,
        "Source: General Administration of Customs of China, cited in MOFCOM (2025), Table 11. "
        "Values are current RMB and may be rounded. Chart redrawn by the Week 1 poster team.",
        fontsize=8.8,
        color="#657384",
    )
    fig.subplots_adjust(left=0.08, right=0.9, top=0.82, bottom=0.13)

    fig.savefig(
        PNG_PATH,
        dpi=240,
        facecolor=fig.get_facecolor(),
        metadata={
            "Title": "China's Cross-border E-commerce Trade, 2018–2024",
            "Author": "hansu650 / Week 1 poster team",
            "Description": "Original chart redrawn from GACC data cited in MOFCOM (2025), Table 11.",
        },
    )
    fig.savefig(
        SVG_PATH,
        facecolor=fig.get_facecolor(),
        metadata={
            "Title": "China's Cross-border E-commerce Trade, 2018–2024",
            "Creator": "hansu650 / Week 1 poster team",
            "Description": "Original chart redrawn from GACC data cited in MOFCOM (2025), Table 11.",
            "Date": None,
        },
    )
    plt.close(fig)

    # Matplotlib's SVG writer leaves spaces at the ends of path-data lines.
    # Normalising them keeps repository whitespace checks and later diffs clean.
    svg_text = SVG_PATH.read_text(encoding="utf-8")
    normalised_svg = "\n".join(line.rstrip() for line in svg_text.splitlines()) + "\n"
    SVG_PATH.write_text(normalised_svg, encoding="utf-8", newline="\n")


def main() -> None:
    records = load_and_validate()
    render(records)
    print(f"Validated {len(records)} annual records: {EXPECTED_YEARS[0]}–{EXPECTED_YEARS[-1]}")
    print(f"Wrote {PNG_PATH}")
    print(f"Wrote {SVG_PATH}")


if __name__ == "__main__":
    main()
