"""
ETL Utilities
─────────────
Shared helpers for the Bronze → Silver → Gold medallion pipeline.
"""

import logging
import datetime
from pathlib import Path

import pandas as pd

# ── Project Paths ──────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DATA_DIR = PROJECT_ROOT / "data" / "raw"
BRONZE_DIR   = PROJECT_ROOT / "data" / "bronze"
SILVER_DIR   = PROJECT_ROOT / "data" / "silver"
GOLD_DIR     = PROJECT_ROOT / "data" / "gold"

# ── Logging ────────────────────────────────────────────────────────────────────
LOG_FORMAT = "%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s"


def get_logger(name: str, level: int = logging.INFO) -> logging.Logger:
    """Return a consistently-formatted logger."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter(LOG_FORMAT, datefmt="%H:%M:%S"))
        logger.addHandler(handler)
    logger.setLevel(level)
    return logger


# ── I/O Helpers ────────────────────────────────────────────────────────────────

def ensure_dir(path: Path) -> Path:
    """Create directory (and parents) if it doesn't exist."""
    path.mkdir(parents=True, exist_ok=True)
    return path


def read_csv_safe(path: Path, **kwargs) -> pd.DataFrame:
    """Read a CSV and return an empty DataFrame on failure."""
    logger = get_logger("utils")
    if not path.exists():
        logger.warning("File not found: %s", path)
        return pd.DataFrame()
    try:
        df = pd.read_csv(path, **kwargs)
        logger.info("Loaded %s  (%d rows × %d cols)", path.name, len(df), len(df.columns))
        return df
    except Exception as exc:
        logger.error("Failed to read %s: %s", path, exc)
        return pd.DataFrame()


def save_csv(df: pd.DataFrame, path: Path, *, index: bool = False) -> Path:
    """Write a DataFrame to CSV and log the result."""
    logger = get_logger("utils")
    ensure_dir(path.parent)
    df.to_csv(path, index=index)
    logger.info("Saved %s  (%d rows × %d cols)", path.name, len(df), len(df.columns))
    return path


def add_metadata(df: pd.DataFrame, source_file: str) -> pd.DataFrame:
    """Add ingestion metadata columns to a DataFrame."""
    df = df.copy()
    df["_ingestion_time"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    df["_source_file"] = source_file
    return df


# ── Column Standardisation ────────────────────────────────────────────────────

DEPARTMENT_ALIASES = {
    "aiml": "Artificial Intelligence and Machine Learning",
    "ai & ml": "Artificial Intelligence and Machine Learning",
    "artificial intelligence and machine learning": "Artificial Intelligence and Machine Learning",
    "ce": "Computer Engineering",
    "computer engineering": "Computer Engineering",
    "comp": "Computer Engineering",
    "cs": "Computer Science and Engineering",
    "cse": "Computer Science and Engineering",
    "computer science and engineering": "Computer Science and Engineering",
    "csbs": "Computer Science and Business Systems",
    "computer science and business systems": "Computer Science and Business Systems",
    "it": "Information Technology",
    "information technology": "Information Technology",
    "ec": "Electronics and Communication",
    "ece": "Electronics and Communication",
    "electronics and communication": "Electronics and Communication",
    "ee": "Electrical Engineering",
    "electrical engineering": "Electrical Engineering",
    "me": "Mechanical Engineering",
    "mechanical engineering": "Mechanical Engineering",
    "civil": "Civil Engineering",
    "civil engineering": "Civil Engineering",
}


def normalize_department(val: str) -> str:
    """Map department codes/abbreviations to a canonical name."""
    if pd.isna(val):
        return val
    return DEPARTMENT_ALIASES.get(str(val).strip().lower(), str(val).strip())


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Standardise column names: strip whitespace, lower-case, underscores.
    """
    df = df.copy()
    df.columns = (
        df.columns.str.strip()
        .str.lower()
        .str.replace(r"[^a-z0-9]+", "_", regex=True)
        .str.strip("_")
    )
    return df
