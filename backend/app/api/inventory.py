"""Inventory API — FastAPI router untuk semua endpoint inventory.

Prefix: /erp/api/v1/inventory
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.inventory import (
    ErpStockMovementCreate,
    ErpStockMovementResponse,
    ErpStockCardGenerate,
    ErpStockCardResponse,
    ErpBillOfMaterialCreate,
    ErpBillOfMaterialUpdate,
    ErpBillOfMaterialResponse,
    ErpStockOpnameCreate,
    ErpStockOpnameResponse,
    ErpStockOpnameItemCreate,
    ErpStockOpnameItemUpdate,
    ErpStockOpnameItemResponse,
    ErpWorkInProgressCreate,
    ErpWorkInProgressUpdate,
    ErpWorkInProgressResponse,
)
from app.services.inventory import InventoryService

router = APIRouter(prefix="/erp/api/v1/inventory", tags=["Inventory"])


_serialize_seen = set()


def _serialize(obj: Any, depth: int = 0) -> Any:
    """Recursively serialize SQLAlchemy ORM objects to plain dicts."""
    if obj is None or depth > 10:
        return None
    # Handle primitives
    if isinstance(obj, (str, int, float, bool)):
        return obj
    # Handle date/time — import here to avoid any namespace issues
    import datetime as _dt
    if isinstance(obj, (_dt.datetime, _dt.date, _dt.time)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: _serialize(v, depth) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_serialize(item, depth + 1) for item in obj]
    # SQLAlchemy model instance
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
            # Include relationships (shallow at higher depths)
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
    """Helper: return JSON response wrapper.

    Automatically serializes SQLAlchemy ORM objects to plain dicts.
    """
    return JSONResponse({"success": True, "data": _serialize(data)}, status_code=status_code)


# ═══════════════════════════════════════════════════════════════════
# STOCK MOVEMENTS
# ═══════════════════════════════════════════════════════════════════

@router.get("/movements")
def list_movements(
"""Ambil daftar pergerakan stok."""
    product_id: Optional[int] = None,
    movement_type: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar pergerakan stok."""
    return _ok(InventoryService.list_movements(db, product_id, movement_type, page, per_page))


@router.post("/movements", status_code=201)
def create_movement(
"""Buat pergerakan stok baru."""
    data: ErpStockMovementCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat pergerakan stok baru."""
    return _ok(InventoryService.create_movement(db, data), status_code=201)


@router.get("/movements/{id}")
def get_movement(
"""Ambil detail pergerakan stok."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil pergerakan stok by ID."""
    return _ok(InventoryService.get_movement(db, id))


# ═══════════════════════════════════════════════════════════════════
# STOCK CARDS
# ═══════════════════════════════════════════════════════════════════

@router.get("/stock-cards")
def list_stock_cards(
"""Ambil daftar kartu stok."""
    product_id: Optional[int] = None,
    period: Optional[str] = None,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar kartu stok."""
    return _ok(InventoryService.list_stock_cards(db, product_id, period))


@router.post("/stock-cards/generate", status_code=201)
def generate_stock_card(
"""Generate kartu stok untuk produk."""
    data: ErpStockCardGenerate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Generate kartu stok untuk periode tertentu."""
    return _ok(InventoryService.generate_stock_card(db, data), status_code=201)


@router.get("/stock-cards/{id}")
def get_stock_card(
"""Ambil kartu stok untuk suatu produk."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil kartu stok by ID."""
    return _ok(InventoryService.get_stock_card(db, id))


# ═══════════════════════════════════════════════════════════════════
# BOM — BILL OF MATERIAL
# ═══════════════════════════════════════════════════════════════════

@router.get("/bom")
def list_bom(
"""Ambil daftar Bill of Materials."""
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar Bill of Materials."""
    return _ok(InventoryService.list_bom(db, search))


@router.post("/bom", status_code=201)
def create_bom(
"""Buat BOM baru."""
    data: ErpBillOfMaterialCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat BOM baru dengan komponen."""
    return _ok(InventoryService.create_bom(db, data), status_code=201)


@router.get("/bom/{id}")
def get_bom(
"""Ambil detail BOM."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil BOM by ID (termasuk komponen)."""
    return _ok(InventoryService.get_bom(db, id))


@router.put("/bom/{id}")
def update_bom(
"""Update BOM."""
    id: int,
    data: ErpBillOfMaterialUpdate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update BOM beserta komponen."""
    return _ok(InventoryService.update_bom(db, id, data))


@router.delete("/bom/{id}")
def delete_bom(
"""Hapus BOM."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Soft-delete BOM (is_active=False)."""
    return _ok(InventoryService.delete_bom(db, id))


# ═══════════════════════════════════════════════════════════════════
# STOCK OPNAME
# ═══════════════════════════════════════════════════════════════════

@router.get("/opname")
def list_opname(
"""Ambil daftar opname stok."""
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar sesi stock opname."""
    return _ok(InventoryService.list_opname(db, status, page, per_page))


@router.post("/opname", status_code=201)
def create_opname(
"""Buat opname stok baru."""
    data: ErpStockOpnameCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat sesi stock opname baru (DRAFT)."""
    return _ok(InventoryService.create_opname(db, data), status_code=201)


@router.get("/opname/{id}")
def get_opname(
"""Ambil detail opname stok."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil sesi opname by ID (termasuk item)."""
    return _ok(InventoryService.get_opname(db, id))


@router.post("/opname/{id}/items", status_code=201)
def add_opname_item(
"""Tambah item ke opname stok."""
    id: int,
    data: ErpStockOpnameItemCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Tambahkan item ke sesi opname."""
    return _ok(InventoryService.add_opname_item(db, id, data), status_code=201)


@router.put("/opname/{id}/items/{item_id}")
def update_opname_item(
"""Update item opname stok."""
    id: int,
    item_id: int,
    data: ErpStockOpnameItemUpdate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update item opname — auto-hitung difference."""
    return _ok(InventoryService.update_opname_item(db, id, item_id, data))


@router.post("/opname/{id}/complete")
def complete_opname(
"""Selesaikan opname stok."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Selesaikan opname — auto-buat StockMovement untuk setiap selisih."""
    performed_by = getattr(_auth, "username", str(_auth.id))
    return _ok(InventoryService.complete_opname(db, id, performed_by))


@router.post("/opname/{id}/cancel")
def cancel_opname(
"""Batalkan opname stok."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Batalkan sesi opname."""
    return _ok(InventoryService.cancel_opname(db, id))


# ═══════════════════════════════════════════════════════════════════
# WIP — WORK IN PROGRESS
# ═══════════════════════════════════════════════════════════════════

@router.get("/wip")
def list_wip(
"""Ambil daftar WIP."""
    status: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar Work In Progress."""
    return _ok(InventoryService.list_wip(db, status, page, per_page))


@router.post("/wip", status_code=201)
def create_wip(
"""Buat Work in Process baru."""
    data: ErpWorkInProgressCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat WIP baru (PLANNED) dengan material."""
    return _ok(InventoryService.create_wip(db, data), status_code=201)


@router.get("/wip/{id}")
def get_wip(
"""Ambil detail WIP."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil WIP by ID (termasuk material)."""
    return _ok(InventoryService.get_wip(db, id))


@router.put("/wip/{id}")
def update_wip(
"""Update data WIP."""
    id: int,
    data: ErpWorkInProgressUpdate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update WIP beserta material."""
    return _ok(InventoryService.update_wip(db, id, data))


@router.post("/wip/{id}/start")
def start_wip(
"""Mulai proses produksi WIP."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Mulai produksi WIP (IN_PROGRESS)."""
    return _ok(InventoryService.start_wip(db, id))


@router.post("/wip/{id}/complete")
def complete_wip(
"""Selesaikan proses WIP."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Selesaikan WIP — auto-buat StockMovement untuk material & finished goods."""
    performed_by = getattr(_auth, "username", str(_auth.id))
    return _ok(InventoryService.complete_wip(db, id, performed_by))


@router.post("/wip/{id}/cancel")
def cancel_wip(
"""Batalkan proses WIP."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Batalkan WIP."""
    return _ok(InventoryService.cancel_wip(db, id))
