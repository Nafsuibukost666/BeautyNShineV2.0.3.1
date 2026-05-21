"""Finance / Bank / Asset — FastAPI router."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.finance import (
    ErpBankAccountCreate,
    ErpBankAccountUpdate,
    ErpBankTransactionCreate,
    ErpFixedAssetCreate,
    ErpFixedAssetUpdate,
)
from app.services.finance import BankAccountService, FixedAssetService
from app.api.posting import _safe_serialize

router = APIRouter(prefix="/erp/api/v1/finance", tags=["Finance / Bank / Asset"])


def _ok(data, status_code: int = 200):
    """Helper untuk mengembalikan response JSON standar.

    Membungkus data dalam format {"success": True, "data": ...} dengan
    serialisasi aman melalui _safe_serialize.

    Args:
        data: Data response
        status_code: HTTP status code (default: 200)

    Returns:
        JSONResponse dengan wrapper success
    """
    return JSONResponse({"success": True, "data": _safe_serialize(data)}, status_code=status_code)


# ═══════════════════════════════════════════════════════════════════
# BANK ACCOUNTS
# ═══════════════════════════════════════════════════════════════════

@router.get("/bank-accounts")
def list_bank_accounts(
"""Ambil daftar rekening bank."""
    account_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar rekening bank."""
    return _ok(BankAccountService.list_accounts(db, account_type=account_type))


@router.post("/bank-accounts", status_code=201)
def create_bank_account(
"""Buat rekening bank baru."""
    data: ErpBankAccountCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat rekening bank baru."""
    return _ok(BankAccountService.create_account(db, data), status_code=201)


@router.get("/bank-accounts/{id}")
def get_bank_account(
"""Ambil detail rekening bank."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Detail rekening bank."""
    return _ok(BankAccountService.get_account(db, id))


@router.put("/bank-accounts/{id}")
def update_bank_account(
"""Update rekening bank."""
    id: int,
    data: ErpBankAccountUpdate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update rekening bank."""
    return _ok(BankAccountService.update_account(db, id, data))


@router.delete("/bank-accounts/{id}")
def deactivate_bank_account(
"""Nonaktifkan rekening bank."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Non-aktifkan rekening bank."""
    return _ok(BankAccountService.delete_account(db, id))


# ═══════════════════════════════════════════════════════════════════
# BANK TRANSACTIONS
# ═══════════════════════════════════════════════════════════════════

@router.post("/bank-transactions", status_code=201)
def create_bank_transaction(
"""Buat transaksi bank baru."""
    data: ErpBankTransactionCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Catat transaksi bank (DEPOSIT / WITHDRAWAL / TRANSFER).

    Saldo rekening otomatis terupdate.
    """
    return _ok(BankAccountService.record_transaction(db, data), status_code=201)


@router.get("/bank-transactions")
def list_bank_transactions(
"""Ambil daftar transaksi bank."""
    bank_account_id: Optional[int] = Query(None),
    transaction_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar transaksi bank."""
    return _ok(BankAccountService.list_transactions(
        db, bank_account_id=bank_account_id, transaction_type=transaction_type,
        page=page, per_page=per_page,
    ))


@router.get("/bank-transactions/{id}")
def get_bank_transaction(
"""Ambil detail transaksi bank."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Detail transaksi bank."""
    return _ok(BankAccountService.get_transaction(db, id))


# ═══════════════════════════════════════════════════════════════════
# FIXED ASSETS
# ═══════════════════════════════════════════════════════════════════

@router.get("/assets")
def list_assets(
"""Ambil daftar aset tetap."""
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Daftar aset tetap."""
    return _ok(FixedAssetService.list_assets(db, category=category, status=status))


@router.post("/assets", status_code=201)
def create_asset(
"""Buat aset tetap baru."""
    data: ErpFixedAssetCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Buat aset tetap baru."""
    return _ok(FixedAssetService.create_asset(db, data), status_code=201)


@router.get("/assets/{id}")
def get_asset(
"""Ambil detail aset tetap."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Detail aset tetap."""
    return _ok(FixedAssetService.get_asset(db, id))


@router.put("/assets/{id}")
def update_asset(
"""Update data aset tetap."""
    id: int,
    data: ErpFixedAssetUpdate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update aset tetap."""
    return _ok(FixedAssetService.update_asset(db, id, data))


@router.post("/assets/{id}/depreciate")
def depreciate_asset(
"""Lakukan depresiasi aset tetap."""
    id: int,
    period_code: str = Query(..., description="e.g. '2026-05'"),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Hitung penyusutan aset untuk satu periode."""
    return _ok(FixedAssetService.calculate_depreciation(db, id, period_code), status_code=201)


@router.get("/assets/{id}/depreciation")
def get_depreciation_history(
"""Ambil riwayat depresiasi aset."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Riwayat penyusutan aset."""
    return _ok(FixedAssetService.get_depreciation_history(db, id))


@router.post("/assets/{id}/dispose")
def dispose_asset(
"""Hapus/hentikan aset tetap."""
    id: int,
    disposed_at: date = Query(...),
    disposal_price: int = Query(0),
    notes: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Hapus / jual aset tetap."""
    return _ok(FixedAssetService.dispose_asset(db, id, disposed_at, disposal_price, notes))
