"""Master Data API — FastAPI router untuk semua endpoint master data.

Prefix: /erp/api/v1/master
"""
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional, Union
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.master_data import (
    ErpMasterProductCreate,
    ErpMasterProductResponse,
    ErpMasterCategoryCreate,
    ErpMasterCategoryResponse,
    ErpMasterAccountCreate,
    ErpMasterAccountUpdate,
    ErpMasterAccountResponse,
    ErpMasterAccountTreeNode,
    ErpAccountMappingCreate,
    ErpAccountMappingUpdate,
    ErpMasterTaxCreate,
    ErpMasterTaxResponse,
    ErpMasterCompanyUpdate,
    ErpMasterCompanyResponse,
    ErpMasterBranchCreate,
    ErpMasterBranchResponse,
    ErpMasterStaffCreate,
    ErpMasterStaffResponse,
    ErpMasterBedCreate,
    ErpMasterBedResponse,
    ErpMasterVoucherCreate,
    ErpMasterVoucherResponse,
    ErpFinancialPeriodCreate,
    ErpFinancialPeriodResponse,
    PeriodCloseRequest,
    PeriodCloseLogResponse,
)
from app.services.master_data import MasterDataService

router = APIRouter(prefix="/erp/api/v1/master", tags=["Master Data"])


_serialize_seen = set()


def _serialize(obj: Any, depth: int = 0) -> Any:
    """Serialize objek SQLAlchemy ORM secara rekursif ke dictionary biasa.

    Args:
        obj: Objek yang akan diserialisasi
        depth: Kedalaman rekursi saat ini (mencegah infinite loop)

    Returns:
        Dictionary / tipe data primitif yang siap di-JSON-kan
    """
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
        # Identity check to prevent circular loops (e.g. line->txn->line)
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
    # Fallback: try to return as-is (will fail if not serializable)
    return obj


def _ok(data, status_code: int = 200):
    """Helper: return JSON response wrapper.

    Automatically serializes SQLAlchemy ORM objects to plain dicts.
    """
    return JSONResponse({"success": True, "data": _serialize(data)}, status_code=status_code)


# ═══════════════════════════════════════════════════════════════════
# PRODUCTS
# ═══════════════════════════════════════════════════════════════════

@router.get("/products")
def list_products(
"""Ambil daftar semua produk."""
    search: Optional[str] = None,
    category: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar produk dengan filter pencarian dan kategori.

    Endpoint: GET /erp/api/v1/master/products

    Args:
        search: Kata kunci pencarian (opsional)
        category: Filter kategori produk (opsional)
        page: Halaman (default: 1)
        per_page: Item per halaman (default: 20)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Daftar produk terpaginate
    """
    return _ok(MasterDataService.list_products(db, search, category, page, per_page))


@router.post("/products", status_code=201)
def create_product(
"""Buat produk baru."""
    data: ErpMasterProductCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat produk baru.

    Endpoint: POST /erp/api/v1/master/products

    Args:
        data: Data produk baru (ErpMasterProductCreate)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Produk yang baru dibuat (status 201)
    """
    return _ok(MasterDataService.create_product(db, data), status_code=201)


@router.get("/products/{id}")
def get_product(
"""Ambil detail produk berdasarkan ID."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil detail produk berdasarkan ID.

    Endpoint: GET /erp/api/v1/master/products/{id}

    Args:
        id: ID produk
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Detail produk
    """
    return _ok(MasterDataService.get_product(db, id))


@router.put("/products/{id}")
def update_product(
"""Update data produk."""
    id: int,
    data: ErpMasterProductCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update data produk.

    Endpoint: PUT /erp/api/v1/master/products/{id}

    Args:
        id: ID produk
        data: Data produk yang diupdate (ErpMasterProductCreate)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Produk yang sudah diupdate
    """
    return _ok(MasterDataService.update_product(db, id, data))


@router.delete("/products/{id}")
def delete_product(
"""Hapus produk."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Soft-delete produk (set is_active=False).

    Endpoint: DELETE /erp/api/v1/master/products/{id}

    Args:
        id: ID produk
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Konfirmasi penghapusan
    """
    return _ok(MasterDataService.delete_product(db, id))


# ═══════════════════════════════════════════════════════════════════
# CATEGORIES
# ═══════════════════════════════════════════════════════════════════

@router.get("/categories")
def list_categories(
"""Ambil daftar kategori produk."""
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar kategori dengan filter tipe.

    Endpoint: GET /erp/api/v1/master/categories

    Args:
        type: Filter tipe kategori (opsional)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Daftar kategori
    """
    return _ok(MasterDataService.list_categories(db, type))


@router.post("/categories", status_code=201)
def create_category(
"""Buat kategori produk baru."""
    data: ErpMasterCategoryCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat kategori baru.

    Endpoint: POST /erp/api/v1/master/categories

    Args:
        data: Data kategori baru (ErpMasterCategoryCreate)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Kategori yang baru dibuat (status 201)
    """
    return _ok(MasterDataService.create_category(db, data), status_code=201)


@router.get("/categories/{id}")
def get_category(
"""Ambil detail kategori."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil detail kategori berdasarkan ID.

    Endpoint: GET /erp/api/v1/master/categories/{id}

    Args:
        id: ID kategori
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Detail kategori
    """
    return _ok(MasterDataService.get_category(db, id))


@router.put("/categories/{id}")
def update_category(
"""Update kategori produk."""
    id: int,
    data: ErpMasterCategoryCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update data kategori.

    Endpoint: PUT /erp/api/v1/master/categories/{id}

    Args:
        id: ID kategori
        data: Data kategori yang diupdate (ErpMasterCategoryCreate)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Kategori yang sudah diupdate
    """
    return _ok(MasterDataService.update_category(db, id, data))


@router.delete("/categories/{id}")
def delete_category(
"""Hapus kategori produk."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Soft-delete kategori (set is_active=False).

    Endpoint: DELETE /erp/api/v1/master/categories/{id}

    Args:
        id: ID kategori
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Konfirmasi penghapusan
    """
    return _ok(MasterDataService.delete_category(db, id))


# ═══════════════════════════════════════════════════════════════════
# ACCOUNTS (COA)
# ═══════════════════════════════════════════════════════════════════

@router.get("/accounts/tree")
def get_accounts_tree(
"""Ambil tree/hirarki chart of account."""
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil hierarki akun dalam format tree (nested).

    Endpoint: GET /erp/api/v1/master/accounts/tree

    Args:
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Tree akun (parent-child)
    """
    return _ok(MasterDataService.get_account_tree(db))


@router.get("/accounts")
def list_accounts(
"""Ambil daftar chart of account."""
    type: Optional[str] = None,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar akun (COA) dengan filter tipe.

    Endpoint: GET /erp/api/v1/master/accounts

    Args:
        type: Filter tipe akun (opsional)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Daftar akun
    """
    return _ok(MasterDataService.list_accounts(db, type))


@router.post("/accounts", status_code=201)
def create_account(
"""Buat akun baru di chart of account."""
    data: ErpMasterAccountCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat akun (COA) baru.

    Endpoint: POST /erp/api/v1/master/accounts

    Args:
        data: Data akun baru (ErpMasterAccountCreate)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Akun yang baru dibuat (status 201)
    """
    return _ok(MasterDataService.create_account(db, data), status_code=201)


@router.get("/accounts/{id}")
def get_account(
"""Ambil detail akun COA."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil detail akun berdasarkan ID.

    Endpoint: GET /erp/api/v1/master/accounts/{id}

    Args:
        id: ID akun
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Detail akun
    """
    return _ok(MasterDataService.get_account(db, id))


@router.put("/accounts/{id}")
def update_account(
"""Update data akun."""
    id: int,
    data: ErpMasterAccountUpdate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update akun secara partial.

    Endpoint: PUT /erp/api/v1/master/accounts/{id}

    Args:
        id: ID akun
        data: Data akun yang diupdate (ErpMasterAccountUpdate — partial)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Akun yang sudah diupdate
    """
    return _ok(MasterDataService.update_account(db, id, data))


@router.delete("/accounts/{id}")
def delete_account(
"""Hapus akun dari chart of account."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Soft-delete akun (gagal jika masih memiliki child account).

    Endpoint: DELETE /erp/api/v1/master/accounts/{id}

    Args:
        id: ID akun
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Konfirmasi penghapusan
    """
    return _ok(MasterDataService.delete_account(db, id))


# ═══════════════════════════════════════════════════════════════════
# TAXES
# ═══════════════════════════════════════════════════════════════════

@router.get("/taxes")
def list_taxes(
"""Ambil daftar pajak (tax)."""
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar semua pajak.

    Endpoint: GET /erp/api/v1/master/taxes

    Args:
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Daftar pajak
    """
    return _ok(MasterDataService.list_taxes(db))


@router.post("/taxes", status_code=201)
def create_tax(
"""Buat pajak baru."""
    data: ErpMasterTaxCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat pajak baru.

    Endpoint: POST /erp/api/v1/master/taxes

    Args:
        data: Data pajak baru (ErpMasterTaxCreate)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Pajak yang baru dibuat (status 201)
    """
    return _ok(MasterDataService.create_tax(db, data), status_code=201)


@router.get("/taxes/{id}")
def get_tax(
"""Ambil detail pajak."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil detail pajak berdasarkan ID.

    Endpoint: GET /erp/api/v1/master/taxes/{id}

    Args:
        id: ID pajak
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Detail pajak
    """
    return _ok(MasterDataService.get_tax(db, id))


@router.put("/taxes/{id}")
def update_tax(
"""Update pajak."""
    id: int,
    data: ErpMasterTaxCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update data pajak.

    Endpoint: PUT /erp/api/v1/master/taxes/{id}

    Args:
        id: ID pajak
        data: Data pajak yang diupdate (ErpMasterTaxCreate)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Pajak yang sudah diupdate
    """
    return _ok(MasterDataService.update_tax(db, id, data))


@router.delete("/taxes/{id}")
def delete_tax(
"""Hapus pajak."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Soft-delete pajak (set is_active=False).

    Endpoint: DELETE /erp/api/v1/master/taxes/{id}

    Args:
        id: ID pajak
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Konfirmasi penghapusan
    """
    return _ok(MasterDataService.delete_tax(db, id))


# ═══════════════════════════════════════════════════════════════════
# COMPANY (SINGLETON)
# ═══════════════════════════════════════════════════════════════════

@router.get("/company")
def get_company(
"""Ambil data perusahaan."""
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil data perusahaan (singleton).

    Endpoint: GET /erp/api/v1/master/company

    Args:
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Data perusahaan
    """
    return _ok(MasterDataService.get_company(db))


@router.put("/company")
def update_company(
"""Update data perusahaan."""
    data: ErpMasterCompanyUpdate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update data perusahaan.

    Endpoint: PUT /erp/api/v1/master/company

    Args:
        data: Data perusahaan yang diupdate (ErpMasterCompanyUpdate)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Data perusahaan yang sudah diupdate
    """
    return _ok(MasterDataService.update_company(db, data))


# ═══════════════════════════════════════════════════════════════════
# BRANCHES
# ═══════════════════════════════════════════════════════════════════

@router.get("/branches")
def list_branches(
"""Ambil daftar cabang."""
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar semua cabang.

    Endpoint: GET /erp/api/v1/master/branches

    Args:
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Daftar cabang
    """
    return _ok(MasterDataService.list_branches(db))


@router.post("/branches", status_code=201)
def create_branch(
"""Buat cabang baru."""
    data: ErpMasterBranchCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat cabang baru.

    Endpoint: POST /erp/api/v1/master/branches

    Args:
        data: Data cabang baru (ErpMasterBranchCreate)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Cabang yang baru dibuat (status 201)
    """
    return _ok(MasterDataService.create_branch(db, data), status_code=201)


@router.get("/branches/{id}")
def get_branch(
"""Ambil detail cabang."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil detail cabang berdasarkan ID.

    Endpoint: GET /erp/api/v1/master/branches/{id}

    Args:
        id: ID cabang
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Detail cabang
    """
    return _ok(MasterDataService.get_branch(db, id))


@router.put("/branches/{id}")
def update_branch(
"""Update data cabang."""
    id: int,
    data: ErpMasterBranchCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update data cabang.

    Endpoint: PUT /erp/api/v1/master/branches/{id}

    Args:
        id: ID cabang
        data: Data cabang yang diupdate (ErpMasterBranchCreate)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Cabang yang sudah diupdate
    """
    return _ok(MasterDataService.update_branch(db, id, data))


@router.delete("/branches/{id}")
def delete_branch(
"""Hapus cabang."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Soft-delete cabang (set is_active=False).

    Endpoint: DELETE /erp/api/v1/master/branches/{id}

    Args:
        id: ID cabang
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Konfirmasi penghapusan
    """
    return _ok(MasterDataService.delete_branch(db, id))


# ═══════════════════════════════════════════════════════════════════
# STAFF
# ═══════════════════════════════════════════════════════════════════

@router.get("/staff")
def list_staff(
"""Ambil daftar staff/karyawan."""
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar staff dengan filter pencarian.

    Endpoint: GET /erp/api/v1/master/staff

    Args:
        search: Kata kunci pencarian (opsional)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Daftar staff
    """
    return _ok(MasterDataService.list_staff(db, search))


@router.post("/staff", status_code=201)
def create_staff(
"""Buat data staff baru."""
    data: ErpMasterStaffCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat staff baru.

    Endpoint: POST /erp/api/v1/master/staff

    Args:
        data: Data staff baru (ErpMasterStaffCreate)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Staff yang baru dibuat (status 201)
    """
    return _ok(MasterDataService.create_staff(db, data), status_code=201)


@router.get("/staff/{id}")
def get_staff(
"""Ambil detail staff."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil detail staff berdasarkan ID.

    Endpoint: GET /erp/api/v1/master/staff/{id}

    Args:
        id: ID staff
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Detail staff
    """
    return _ok(MasterDataService.get_staff(db, id))


@router.put("/staff/{id}")
def update_staff(
"""Update data staff."""
    id: int,
    data: ErpMasterStaffCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update data staff.

    Endpoint: PUT /erp/api/v1/master/staff/{id}

    Args:
        id: ID staff
        data: Data staff yang diupdate (ErpMasterStaffCreate)
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Staff yang sudah diupdate
    """
    return _ok(MasterDataService.update_staff(db, id, data))


@router.delete("/staff/{id}")
def delete_staff(
"""Hapus data staff."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Soft-delete staff (set is_active=False).

    Endpoint: DELETE /erp/api/v1/master/staff/{id}

    Args:
        id: ID staff
        db: Sesi database
        _auth: User yang terautentikasi

    Returns:
        JSONResponse: Konfirmasi penghapusan
    """
    return _ok(MasterDataService.delete_staff(db, id))


# ═══════════════════════════════════════════════════════════════════
# BEDS
# ═══════════════════════════════════════════════════════════════════

@router.get("/beds")
def list_beds(
"""Ambil daftar bed/ruangan."""
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar bed / kursi treatment."""
    return _ok(MasterDataService.list_beds(db))


@router.post("/beds", status_code=201)
def create_bed(
"""Buat bed/ruangan baru."""
    data: ErpMasterBedCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat bed baru."""
    return _ok(MasterDataService.create_bed(db, data), status_code=201)


@router.get("/beds/{id}")
def get_bed(
"""Ambil detail bed/ruangan."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil bed by ID."""
    return _ok(MasterDataService.get_bed(db, id))


@router.put("/beds/{id}")
def update_bed(
"""Update data bed/ruangan."""
    id: int,
    data: ErpMasterBedCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update bed."""
    return _ok(MasterDataService.update_bed(db, id, data))


@router.delete("/beds/{id}")
def delete_bed(
"""Hapus bed/ruangan."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Soft-delete bed."""
    return _ok(MasterDataService.delete_bed(db, id))


# ═══════════════════════════════════════════════════════════════════
# VOUCHERS
# ═══════════════════════════════════════════════════════════════════

@router.get("/vouchers")
def list_vouchers(
"""Ambil daftar voucher."""
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar voucher."""
    return _ok(MasterDataService.list_vouchers(db))


@router.post("/vouchers", status_code=201)
def create_voucher(
"""Buat voucher baru."""
    data: ErpMasterVoucherCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat voucher baru."""
    return _ok(MasterDataService.create_voucher(db, data), status_code=201)


@router.get("/vouchers/{id}")
def get_voucher(
"""Ambil detail voucher."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil voucher by ID."""
    return _ok(MasterDataService.get_voucher(db, id))


@router.put("/vouchers/{id}")
def update_voucher(
"""Update voucher."""
    id: int,
    data: ErpMasterVoucherCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update voucher."""
    return _ok(MasterDataService.update_voucher(db, id, data))


@router.delete("/vouchers/{id}")
def delete_voucher(
"""Hapus voucher."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Soft-delete voucher."""
    return _ok(MasterDataService.delete_voucher(db, id))


@router.get("/vouchers/validate/{code}")
def validate_voucher(
"""Validasi kode voucher."""
    code: str,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Validasi voucher berdasarkan kode."""
    return _ok(MasterDataService.validate_voucher(db, code))


# ═══════════════════════════════════════════════════════════════════
# FINANCIAL PERIODS
# ═══════════════════════════════════════════════════════════════════

@router.get("/periods")
def list_periods(
"""Ambil daftar periode akuntansi."""
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar periode keuangan."""
    return _ok(MasterDataService.list_periods(db))


@router.post("/periods", status_code=201)
def create_period(
"""Buat periode akuntansi baru."""
    data: ErpFinancialPeriodCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat periode keuangan baru."""
    return _ok(MasterDataService.create_period(db, data), status_code=201)


@router.get("/periods/{id}")
def get_period(
"""Ambil detail periode akuntansi."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Ambil periode by ID."""
    return _ok(MasterDataService.get_period(db, id))


@router.put("/periods/{id}")
def update_period(
"""Update periode akuntansi."""
    id: int,
    data: ErpFinancialPeriodCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update periode keuangan."""
    return _ok(MasterDataService.update_period(db, id, data))


@router.delete("/periods/{id}")
def delete_period(
"""Hapus periode akuntansi."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Hapus periode keuangan."""
    return _ok(MasterDataService.delete_period(db, id))


@router.patch("/periods/{id}/lock")
def lock_period(
"""Kunci periode akuntansi."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Kunci periode keuangan."""
    user = _auth.get("sub", "system") if isinstance(_auth, dict) else "system"
    return _ok(MasterDataService.lock_period(db, id, locked_by=user))


@router.patch("/periods/{id}/unlock")
def unlock_period(
"""Buka kunci periode akuntansi."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buka kunci periode keuangan."""
    return _ok(MasterDataService.unlock_period(db, id))


# ═══════════════════════════════════════════════════════════════════
# PERIOD CLOSING
# ═══════════════════════════════════════════════════════════════════


@router.get("/periods/{id}/status")
def get_period_status(
"""Ambil status periode akuntansi."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """🔍 Cek status periode — bisa di-close atau tidak."""
    return _ok(MasterDataService.check_period_status(db, id))


@router.post("/periods/{id}/close")
def close_period(
"""Tutup periode akuntansi."""
    id: int,
    data: Optional[PeriodCloseRequest] = None,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """🔒 Tutup periode — zero out Revenue/Expense → Retained Earnings.

    Process:
    1. Validasi semua transaksi sudah POSTED
    2. Buat closing journal entry (DEBIT Revenue, CREDIT Ret Earnings,
       DEBIT Ret Earnings, CREDIT Expense)
    3. Lock + close period
    4. Log aktivitas
    """
    user = _auth.get("sub", "system") if isinstance(_auth, dict) else "system"
    notes = data.notes if data else None
    return _ok(MasterDataService.close_period(db, id, performed_by=user, notes=notes))


@router.post("/periods/{id}/reopen")
def reopen_period(
"""Buka kembali periode yang sudah ditutup."""
    id: int,
    data: Optional[PeriodCloseRequest] = None,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """🔓 Buka kembali periode yang sudah di-close.

    Warning: Void closing journal entries. Gunakan dengan hati-hati.
    """
    user = _auth.get("sub", "system") if isinstance(_auth, dict) else "system"
    notes = data.notes if data else None
    return _ok(MasterDataService.reopen_period(db, id, performed_by=user, notes=notes))


@router.get("/periods/{id}/close-logs")
def get_period_close_logs(
"""Ambil log penutupan periode."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """📋 Riwayat closing activity untuk satu periode."""
    return _ok(MasterDataService.get_close_logs(db, id))


# ═══════════════════════════════════════════════════════════════════
# ACCOUNT MAPPING
# ═══════════════════════════════════════════════════════════════════


@router.get("/account-mappings")
def list_account_mappings(
"""Ambil daftar mapping akun."""
    transaction_type: Optional[str] = None,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """📋 Daftar mapping akun per tipe transaksi."""
    return _ok(MasterDataService.list_mappings(db, transaction_type))


@router.post("/account-mappings")
def create_account_mapping(
"""Buat mapping akun baru."""
    data: ErpAccountMappingCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """➕ Tambah mapping akun."""
    return _ok(MasterDataService.create_mapping(db, data))


@router.put("/account-mappings/{id}")
def update_account_mapping(
"""Update mapping akun."""
    id: int,
    data: ErpAccountMappingUpdate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """✏️ Update mapping akun."""
    return _ok(MasterDataService.update_mapping(db, id, data))


@router.delete("/account-mappings/{id}")
def delete_account_mapping(
"""Hapus mapping akun."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """🗑️ Nonaktifkan mapping akun."""
    return _ok(MasterDataService.delete_mapping(db, id))
