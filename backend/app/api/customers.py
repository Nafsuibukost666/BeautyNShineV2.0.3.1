"""Customers API — FastAPI router untuk endpoint pelanggan salon."""

from decimal import Decimal
from typing import Any, Optional

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.master_data import ErpMasterCustomerCreate
from app.services.master_data import MasterDataService

router = APIRouter(prefix="/erp/api/v1/customers", tags=["Customers"])
_serialize_seen = set()


def _serialize(obj: Any, depth: int = 0) -> Any:
    """Serialize objek ORM atau nilai Python ke format JSON-safe.

    Menangani circular reference dengan melacak object ID yang sudah diproses.
    Mendukung tipe: str, int, float, bool, datetime, date, time, Decimal,
    dict, list, dan SQLAlchemy model instances.

    Args:
        obj: Objek yang akan di-serialize
        depth: Level kedalaman rekursi saat ini (default: 0, max: 10)

    Returns:
        Nilai yang JSON-safe
    """
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
def list_customers(search: Optional[str] = None, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
    """Daftar semua pelanggan.

    **GET** /erp/api/v1/customers

    Args:
        search: Filter pencarian berdasarkan nama (opsional)
        db: Database session (dependency injection)
        _auth: User yang terautentikasi (dependency injection)

    Returns:
        Daftar pelanggan yang terdaftar
    """
    return _ok(MasterDataService.list_customers(db, search))


@router.post("", status_code=201)
def create_customer(data: ErpMasterCustomerCreate, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
    """Buat pelanggan baru.

    **POST** /erp/api/v1/customers

    Args:
        data: Data pelanggan baru (ErpMasterCustomerCreate)
        db: Database session (dependency injection)
        _auth: User yang terautentikasi (dependency injection)

    Returns:
        Data pelanggan yang baru dibuat (status 201)
    """
    return _ok(MasterDataService.create_customer(db, data), status_code=201)


@router.get("/{id}")
def get_customer(id: int, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
    """Ambil detail pelanggan berdasarkan ID.

    **GET** /erp/api/v1/customers/{id}

    Args:
        id: ID pelanggan
        db: Database session (dependency injection)
        _auth: User yang terautentikasi (dependency injection)

    Returns:
        Data pelanggan dengan ID yang dimaksud

    Raises:
        HTTPException 404 jika pelanggan tidak ditemukan
    """
    return _ok(MasterDataService.get_customer(db, id))


@router.put("/{id}")
def update_customer(id: int, data: ErpMasterCustomerCreate, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
    """Update data pelanggan.

    **PUT** /erp/api/v1/customers/{id}

    Args:
        id: ID pelanggan yang akan diupdate
        data: Data pelanggan baru (ErpMasterCustomerCreate)
        db: Database session (dependency injection)
        _auth: User yang terautentikasi (dependency injection)

    Returns:
        Data pelanggan yang sudah diupdate
    """
    return _ok(MasterDataService.update_customer(db, id, data))


@router.delete("/{id}")
def delete_customer(id: int, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
    """Hapus (soft-delete) pelanggan.

    **DELETE** /erp/api/v1/customers/{id}

    Args:
        id: ID pelanggan yang akan dihapus
        db: Database session (dependency injection)
        _auth: User yang terautentikasi (dependency injection)

    Returns:
        Konfirmasi penghapusan
    """
    return _ok(MasterDataService.delete_customer(db, id))
