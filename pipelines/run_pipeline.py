"""
Pipeline Runner
───────────────
Executes the full Bronze → Silver → Gold medallion pipeline end-to-end.

Usage:
    python -m pipelines.run_pipeline          # run all layers
    python -m pipelines.run_pipeline bronze    # extract only
    python -m pipelines.run_pipeline silver    # bronze→silver only
    python -m pipelines.run_pipeline gold      # silver→gold only
"""

import argparse
import sys
import time
from pathlib import Path

# Ensure the project root is on sys.path so `etl.*` imports resolve
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from etl.utils import get_logger
from etl.extract_to_bronze import extract_all
from etl.bronze_to_silver import transform_all
from etl.silver_to_gold import aggregate_all

log = get_logger("pipeline")


def run_pipeline(layers: list[str] | None = None) -> None:
    """
    Execute one or more pipeline layers.

    Parameters
    ----------
    layers : list of {"bronze", "silver", "gold"} or None (= all)
    """
    all_layers = ["bronze", "silver", "gold"]
    layers = layers or all_layers

    t0 = time.time()
    log.info("=" * 60)
    log.info("EduSense-AI  Medallion ETL Pipeline")
    log.info("Layers to run: %s", ", ".join(layers))
    log.info("=" * 60)

    if "bronze" in layers:
        log.info("─── STAGE 1 / Bronze  (Raw → Bronze) ────────────────────")
        extract_all()
        log.info("")

    if "silver" in layers:
        log.info("─── STAGE 2 / Silver  (Bronze → Silver) ─────────────────")
        transform_all()
        log.info("")

    if "gold" in layers:
        log.info("─── STAGE 3 / Gold  (Silver → Gold) ─────────────────────")
        aggregate_all()
        log.info("")

    elapsed = time.time() - t0
    log.info("=" * 60)
    log.info("Pipeline finished in %.1f seconds", elapsed)
    log.info("=" * 60)


# ── CLI entry point ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="EduSense-AI Medallion ETL Pipeline")
    parser.add_argument(
        "layers",
        nargs="*",
        default=None,
        help="Which layer(s) to run: bronze, silver, gold. Omit for all.",
    )
    args = parser.parse_args()
    layers = args.layers if args.layers else None
    # Validate choices
    if layers:
        valid = {"bronze", "silver", "gold"}
        for l in layers:
            if l not in valid:
                parser.error(f"invalid choice: {l} (choose from {', '.join(sorted(valid))})")
    run_pipeline(layers)
