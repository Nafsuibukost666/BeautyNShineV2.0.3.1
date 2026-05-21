"""Suppliers API — FastAPI router untuk endpoint pemasok salon."""

from decimal import Decimal
from typing import Any, Optional

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.master_data import ErpMasterSupplierCreate
from app.services.master_data import MasterDataService

router = APIRouter(prefix="/erp/api/v1/suppliers", tags=["Suppliers"])
_serialize_seen = set()


def _serialize(obj: Any, depth: int = 0) -> Any:
"""Serialisasi data supplier ke format response."""
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
            return {col.key: _serialize(getattr(obj, col.key), depth + 1) for col in mapper.mapper.column_attrs}
        finally:
            _serialize_seen.discard(obj_id)
    return obj


def _ok(data, status_code: int = 200):
"""Return response sukses standar."""
    return JSONResponse({"success": True, "data": _serialize(data)}, status_code=status_code)


@router.get("")
def list_suppliers(search: Optional[str] = None, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
"""Ambil daftar supplier."""
    return _ok(MasterDataService.list_suppliers(db, search))


@router.post("", status_code=201)
def create_supplier(data: ErpMasterSupplierCreate, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
"""Buat supplier baru."""
    return _ok(MasterDataService.create_supplier(db, data), status_code=201)


@router.get("/{id}")
def get_supplier(id: int, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
"""Ambil detail supplier."""
    return _ok(MasterDataService.get_supplier(db, id))


@router.put("/{id}")
def update_supplier(id: int, data: ErpMasterSupplierCreate, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
"""Update data supplier."""
    return _ok(MasterDataService.update_supplier(db, id, data))


@router.delete("/{id}")
def delete_supplier(id: int, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
"""Hapus supplier."""
    return _ok(MasterDataService.delete_supplier(db, id))
