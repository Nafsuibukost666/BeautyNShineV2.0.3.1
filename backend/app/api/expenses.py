"""Expenses — FastAPI router.

Endpoints:
  GET    /expenses       — List expense transactions
  POST   /expenses       — Create a new expense
  PUT    /expenses/{id}  — Update an existing expense
  DELETE /expenses/{id}  — Cancel/delete an expense

All expenses are stored as posting transactions with type=EXPENSE.
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.posting import ErpPostingTransactionCreate, ErpPostingLineCreate
from app.services.posting import PostingEngineService
from app.api.posting import _safe_serialize
from app.models.posting import ErpPostingTransaction, ErpPostingLine


class ExpenseCreate(BaseModel):
    """Schema untuk membuat pengeluaran baru.

    Field:
        description: Deskripsi pengeluaran (wajib)
        amount: Jumlah pengeluaran (wajib)
        category: Kategori pengeluaran (opsional)
        transaction_date: Tanggal transaksi (default: hari ini)
        notes: Catatan tambahan (opsional)
    """
    description: str
    amount: int
    category: str = ""
    transaction_date: Optional[date] = None
    notes: str = ""


class ExpenseUpdate(BaseModel):
    """Schema untuk mengupdate pengeluaran.

    Semua field bersifat opsional — hanya field yang dikirim yang akan diubah.
    """
    description: Optional[str] = None
    amount: Optional[int] = None
    category: Optional[str] = None
    transaction_date: Optional[date] = None
    notes: Optional[str] = None


router = APIRouter(prefix="/erp/api/v1", tags=["Expenses"])


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


def _expense_to_dict(tx):
    """Map a posting transaction + its first line to the expense format expected by frontend."""
    line = tx.lines[0] if tx.lines else None
    return {
        "id": tx.id,
        "doc_number": tx.doc_number,
        "description": line.notes if line else "",
        "amount": tx.total_amount,
        "category": line.product_name if line else "",
        "date": tx.transaction_date.isoformat() if tx.transaction_date else None,
        "notes": tx.notes or "",
        "status": tx.status,
        "created_at": tx.created_at.isoformat() if tx.created_at else None,
    }


@router.get("/expenses")
def list_expenses(
"""Ambil daftar pengeluaran dengan filter tanggal dan kategori."""
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """List expense transactions with optional filters."""
    query = (
        db.query(ErpPostingTransaction)
        .filter(ErpPostingTransaction.transaction_type == "EXPENSE")
    )

    if date_from:
        query = query.filter(ErpPostingTransaction.transaction_date >= date_from)
    if date_to:
        query = query.filter(ErpPostingTransaction.transaction_date <= date_to)

    # Eagerly load lines for mapping
    query = query.order_by(ErpPostingTransaction.transaction_date.desc(), ErpPostingTransaction.id.desc())

    expenses = query.all()

    # Filter by category (category is stored in line product_name)
    result = []
    for tx in expenses:
        d = _expense_to_dict(tx)
        if category and d["category"] != category:
            continue
        result.append(d)

    return _ok(result)


@router.post("/expenses", status_code=201)
def create_expense(
"""Buat pengeluaran baru."""
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Create a new expense as a posting transaction (type=EXPENSE)."""
    if not data.description:
        raise HTTPException(status_code=400, detail="Deskripsi wajib diisi")

    username = _auth.get("sub") if isinstance(_auth, dict) else "system"

    tx_data = ErpPostingTransactionCreate(
        transaction_type="EXPENSE",
        total_amount=data.amount,
        notes=data.notes,
        transaction_date=data.transaction_date or date.today(),
        lines=[
            ErpPostingLineCreate(
                line_no=1,
                product_name=data.category or "",
                notes=data.description,
                quantity=1,
                unit_price=data.amount,
                subtotal=data.amount,
            )
        ],
    )

    tx = PostingEngineService.create_transaction(db, tx_data, username=username)
    # Auto-post the expense
    tx = PostingEngineService.post_transaction(db, tx.id, posted_by=username)
    db.commit()

    return _ok(_expense_to_dict(tx), status_code=201)


@router.get("/expenses/{id}")
def get_expense(
"""Ambil detail pengeluaran berdasarkan ID."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Get a single expense by ID."""
    tx = (
        db.query(ErpPostingTransaction)
        .filter(ErpPostingTransaction.id == id, ErpPostingTransaction.transaction_type == "EXPENSE")
        .first()
    )
    if not tx:
        raise HTTPException(status_code=404, detail="Pengeluaran tidak ditemukan")

    return _ok(_expense_to_dict(tx))


@router.put("/expenses/{id}")
def update_expense(
"""Update data pengeluaran."""
    id: int,
    description: Optional[str] = Query(None, description="Deskripsi pengeluaran"),
    amount: Optional[int] = Query(None, description="Jumlah pengeluaran"),
    category: Optional[str] = Query(None, description="Kategori pengeluaran"),
    transaction_date: Optional[date] = Query(None),
    notes: Optional[str] = Query(None, description="Catatan tambahan"),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update an existing expense."""
    tx = (
        db.query(ErpPostingTransaction)
        .filter(ErpPostingTransaction.id == id, ErpPostingTransaction.transaction_type == "EXPENSE")
        .first()
    )
    if not tx:
        raise HTTPException(status_code=404, detail="Pengeluaran tidak ditemukan")

    if tx.status == "POSTED":
        raise HTTPException(status_code=400, detail="Tidak bisa mengubah pengeluaran yang sudah di-posting")

    if description is not None:
        tx.notes = notes or tx.notes  # Keep notes as main tx notes
    if amount is not None:
        tx.total_amount = amount
    if transaction_date is not None:
        tx.transaction_date = transaction_date

    # Update first line (category + description)
    line = tx.lines[0] if tx.lines else None
    if line:
        if description is not None:
            line.notes = description
        if category is not None:
            line.product_name = category
        if amount is not None:
            line.unit_price = amount
            line.subtotal = amount

    db.commit()
    db.refresh(tx)
    return _ok(_expense_to_dict(tx))


@router.delete("/expenses/{id}")
def delete_expense(
"""Hapus pengeluaran."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Delete/cancel an expense transaction."""
    tx = (
        db.query(ErpPostingTransaction)
        .filter(ErpPostingTransaction.id == id, ErpPostingTransaction.transaction_type == "EXPENSE")
        .first()
    )
    if not tx:
        raise HTTPException(status_code=404, detail="Pengeluaran tidak ditemukan")

    if tx.status == "POSTED":
        # Cancel the posted transaction
        tx = PostingEngineService.cancel_transaction(db, id, notes="Deleted via expenses UI")
    else:
        # Hard delete if still DRAFT
        db.query(ErpPostingLine).filter(ErpPostingLine.transaction_id == id).delete()
        db.delete(tx)

    db.commit()
    return _ok({"deleted": True, "id": id})
