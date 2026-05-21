"""Sales Order API — FastAPI router untuk pesanan penjualan.

Prefix: /erp/api/v1/sales-orders
"""
from decimal import Decimal
from typing import Any, Optional

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.sales import SalesOrderCreate, SalesOrderUpdate
from app.services.sales import SalesOrderService

router = APIRouter(prefix="/erp/api/v1/sales-orders", tags=["Sales Orders"])
_serialize_seen = set()


def _serialize(obj: Any, depth: int = 0) -> Any:
    """Serialize objek ORM atau nilai Python ke format JSON-safe.

    Menangani circular reference, datetime, date, time, Decimal,
    dict, list, dan SQLAlchemy model instances.

    Args:
        obj: Objek yang akan di-serialize
        depth: Level kedalaman rekursi (default: 0, max: 10)

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
            result = {}
            for col in mapper.mapper.column_attrs:
                result[col.key] = _serialize(getattr(obj, col.key), depth + 1)
            if depth < 5:
                for rel in mapper.mapper.relationships:
                    if rel.key == "sales_order":
                        continue
                    if rel.key not in {"customer", "items", "product"}:
                        continue
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


def _user(auth_data) -> str:
    """Ekstrak username dari data autentikasi.

    Args:
        auth_data: Dict data autentikasi dari get_current_user

    Returns:
        Username atau 'system' jika tidak ditemukan
    """
    return auth_data.get("sub", "system") if isinstance(auth_data, dict) else "system"


@router.get("")
def list_sales_orders(status: Optional[str] = None, customer_id: Optional[int] = None, search: Optional[str] = None, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
    """Daftar sales order.

    **GET** /erp/api/v1/sales-orders

    Args:
        status: Filter berdasarkan status (opsional)
        customer_id: Filter berdasarkan ID customer (opsional)
        search: Pencarian berdasarkan keyword (opsional)
        db: Database session (dependency injection)
        _auth: User yang terautentikasi (dependency injection)

    Returns:
        Daftar sales order
    """
    return _ok(SalesOrderService.list_sales_orders(db, status, customer_id, search))


@router.post("", status_code=201)
def create_sales_order(data: SalesOrderCreate, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
    """Buat sales order baru.

    **POST** /erp/api/v1/sales-orders

    Args:
        data: Data sales order baru (SalesOrderCreate)
        db: Database session (dependency injection)
        _auth: User yang terautentikasi (dependency injection)

    Returns:
        Data sales order yang baru dibuat (status 201)
    """
    return _ok(SalesOrderService.create_sales_order(db, data, created_by=_user(_auth)), status_code=201)


@router.get("/{id}")
def get_sales_order(id: int, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
    """Ambil sales order berdasarkan ID.

    **GET** /erp/api/v1/sales-orders/{id}

    Args:
        id: ID sales order
        db: Database session (dependency injection)
        _auth: User yang terautentikasi (dependency injection)

    Returns:
        Data sales order lengkap dengan items

    Raises:
        HTTPException 404 jika tidak ditemukan
    """
    return _ok(SalesOrderService.get_sales_order(db, id))


@router.put("/{id}")
def update_sales_order(id: int, data: SalesOrderUpdate, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
    """Update sales order.

    **PUT** /erp/api/v1/sales-orders/{id}

    Args:
        id: ID sales order
        data: Data update (SalesOrderUpdate)
        db: Database session (dependency injection)
        _auth: User yang terautentikasi (dependency injection)

    Returns:
        Data sales order yang sudah diupdate
    """
    return _ok(SalesOrderService.update_sales_order(db, id, data, updated_by=_user(_auth)))


@router.post("/{id}/post")
def post_sales_order(id: int, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
    """Post sales order — ubah status menjadi POSTED.

    **POST** /erp/api/v1/sales-orders/{id}/post

    Args:
        id: ID sales order
        db: Database session (dependency injection)
        _auth: User yang terautentikasi (dependency injection)

    Returns:
        Data sales order dengan status POSTED
    """
    return _ok(SalesOrderService.post_sales_order(db, id, user=_user(_auth)))


@router.post("/{id}/cancel")
def cancel_sales_order(id: int, db: Session = Depends(get_db), _auth=Depends(get_current_user)):
    """Batalkan sales order.

    **POST** /erp/api/v1/sales-orders/{id}/cancel

    Args:
        id: ID sales order
        db: Database session (dependency injection)
        _auth: User yang terautentikasi (dependency injection)

    Returns:
        Data sales order dengan status CANCELLED
    """
    return _ok(SalesOrderService.cancel(db, id, user=_user(_auth)))
