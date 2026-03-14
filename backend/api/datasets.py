from fastapi import APIRouter, HTTPException, Query

from services.dataset_service import (
    DatasetNotFoundError,
    get_dataset_rows,
    get_dataset_status,
)

router = APIRouter()


@router.get("/status")
def dataset_status():
    return {
        "dataset_directory": "data/datasets",
        "datasets": get_dataset_status(),
    }


@router.get("/{dataset_key}")
def fetch_dataset_rows(
    dataset_key: str,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    try:
        return get_dataset_rows(dataset_key=dataset_key, limit=limit, offset=offset)
    except DatasetNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
