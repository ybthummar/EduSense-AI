"""
Pipeline API
────────────
Endpoints for editing data through the medallion pipeline and
inspecting pipeline state (for jury showcase).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, Optional

from services.pipeline_service import (
    PipelineError,
    get_raw_tables,
    update_raw_record,
)

router = APIRouter()


class RecordUpdate(BaseModel):
    table: str
    key_column: str
    key_value: str
    updates: Dict[str, Any]


@router.post("/edit")
def edit_record(payload: RecordUpdate):
    """
    Edit a record in the raw layer and push changes through the full
    medallion pipeline: Raw → Bronze → Silver → Gold.
    """
    try:
        result = update_raw_record(
            table=payload.table,
            key_column=payload.key_column,
            key_value=payload.key_value,
            updates=payload.updates,
        )
        return result
    except PipelineError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/raw-tables")
def list_raw_tables():
    """Show all raw source tables — for pipeline showcase to jury."""
    return get_raw_tables()


@router.get("/layers")
def pipeline_layers():
    """Show file counts and sizes at each pipeline layer."""
    from pathlib import Path

    root = Path(__file__).resolve().parents[2]
    layers = {
        "raw": root / "data" / "raw",
        "bronze": root / "data" / "bronze",
        "silver": root / "data" / "silver",
        "gold": root / "data" / "gold",
    }

    result = {}
    for name, path in layers.items():
        if not path.exists():
            result[name] = {"files": 0, "total_size_kb": 0, "tables": []}
            continue
        files = sorted(path.glob("*.csv"))
        result[name] = {
            "files": len(files),
            "total_size_kb": round(sum(f.stat().st_size for f in files) / 1024, 1),
            "tables": [
                {"name": f.stem, "size_kb": round(f.stat().st_size / 1024, 1)}
                for f in files
            ],
        }
    return result
