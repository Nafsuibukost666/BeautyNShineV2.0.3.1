"""Services API — FastAPI router untuk endpoint layanan salon.

Prefix: /erp/api/v1/services
Frontend hits: /services (via api baseURL /erp/api → nginx rewrite → /erp/api/v1/services)
"""

from decimal import Decimal
from typing import Any, Optional

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.master_data import ErpMasterServiceCreate, ErpMasterServiceResponse
from app.services.master_data import MasterDataService

router = APIRouter(prefix="/erp/api/v1/services", tags=["Services"])

_serialize_seen = set()


def _serialize(obj: Any, depth: int = 0) -> Any:
    """Recursively serialize SQLAlchemy ORM objects to plain dicts."""
    if obj is None or depth > 10:
        return None
    if isinstance(obj, (str, int, float, bool)):
        return obj
    import datetime as _dt
    if isinstance(obj, (_dt.datetime, _dt.date, _dt.time)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: _serialize(v, depth) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_serialize(item, depth + 1) for item in obj]
    mapper = sa_inspect(obj)
    if mapper is not None:
        obj_id = id(obj)
        if obj_id in _serialize_seen:
            return {c.key: getattr(obj, c.key) for c in mapper.mapper.column_attrs}
        _serialize_seen.add(obj_id)
        try:
            result = {}
            for col in mapper.mapper.column_attrs:
                val = getattr(obj, col.key)
                result[col.key] = _serialize(val, depth + 1)
            if depth < 5:
                for rel in mapper.mapper.relationships:
                    val = getattr(obj, rel.key)
                    if val is not None:
                        result[rel.key] = _serialize(val, depth + 2)
            return result
        finally:
            _serialize_seen.discard(obj_id)
    return obj


def _ok(data, status_code: int = 200):
    """Helper untuk mengembalikan response JSON standar.

    Membungkus data dalam format {"success": True, "data": ...} dengan
    serialisasi otomatis untuk objek ORM.

    Args:
        data: Data response
        status_code: HTTP status code (default: 200)

    Returns:
        JSONResponse dengan wrapper success
    """
    return JSONResponse({"success": True, "data": _serialize(data)}, status_code=status_code)


@router.get("")
def list_services(
"""Ambil daftar layanan beauty."""
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar layanan salon."""
    return _ok(MasterDataService.list_services(db, search))


@router.post("", status_code=201)
def create_service(
"""Buat layanan baru."""
    data: ErpMasterServiceCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat layanan baru."""
    return _ok(MasterDataService.create_service(db, data), status_code=201)


@router.get("/{id}")
def get_service(
"""Ambil detail layanan berdasarkan ID."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil layanan by ID."""
    return _ok(MasterDataService.get_service(db, id))


@router.put("/{id}")
def update_service(
"""Update data layanan."""
    id: int,
    data: ErpMasterServiceCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update layanan."""
    return _ok(MasterDataService.update_service(db, id, data))


@router.delete("/{id}")
def delete_service(
"""Hapus layanan."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Soft-delete layanan."""
    return _ok(MasterDataService.delete_service(db, id))
