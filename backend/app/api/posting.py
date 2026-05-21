"""Posting Engine + Auto Journal — FastAPI router.

Endpoints:
  POST /transactions        — Create DRAFT transaction (Step 2)
  GET  /transactions        — List transactions
  GET  /transactions/{id}   — Get transaction details
  POST /transactions/{id}/post   — Post → auto-journal (Step 2 → 3)
  POST /transactions/{id}/cancel — Cancel transaction + void journals

  GET  /journals             — List journal entries (Step 3)
  GET  /journals/{id}        — Get journal entry with lines
  GET  /journals/by-tx/{tx_id} — Get journals for a transaction

  CRUD /posting-rules       — Manage posting rules (Step 3 config)
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.posting import (
    ErpPostingTransactionCreate,
    ErpPostingTransactionResponse,
    ErpPostingRuleCreate,
    ErpPostingRuleUpdate,
)
from app.services.posting import (
    PostingEngineService,
    AutoJournalService,
    PostingRuleService,
)
router = APIRouter(prefix="/erp/api/v1", tags=["Posting Engine & Journals"])


def _safe_serialize(obj, depth=0, seen=None):
    """Serialize ORM objects to dicts safely, avoiding circular refs."""
    if obj is None or depth > 8:
        return None
    if seen is None:
        seen = set()
    # Primitives
    if isinstance(obj, (str, int, float, bool)):
        return obj
    from datetime import date, datetime
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    # Collections
    if isinstance(obj, dict):
        return {k: _safe_serialize(v, depth + 1, seen) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_safe_serialize(x, depth + 1, seen) for x in obj]
    # SQLAlchemy model
    from sqlalchemy import inspect as sa_inspect
    mapper = sa_inspect(obj)
    if mapper is not None:
        obj_id = id(obj)
        if obj_id in seen:
            # Return just column values to break circular refs
            return {c.key: _safe_serialize(getattr(obj, c.key), depth + 1, seen)
                    for c in mapper.mapper.column_attrs}
        seen.add(obj_id)
        result = {}
        for col in mapper.mapper.column_attrs:
            result[col.key] = _safe_serialize(getattr(obj, col.key), depth + 1, seen)
        if depth < 5:
            for rel in mapper.mapper.relationships:
                val = getattr(obj, rel.key)
                if val is not None:
                    result[rel.key] = _safe_serialize(val, depth + 2, seen)
        return result
    return str(obj)


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
# STEP 2: POSTING TRANSACTIONS
# ═══════════════════════════════════════════════════════════════════

@router.post("/transactions", status_code=201)
def create_transaction(
"""Buat transaksi posting baru."""
    data: ErpPostingTransactionCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Create a new DRAFT posting transaction with auto-generated doc number."""
    username = _auth.get("sub") if isinstance(_auth, dict) else "system"
    tx = PostingEngineService.create_transaction(db, data, username=username)
    db.commit()
    return _ok(tx, status_code=201)


@router.get("/transactions")
def list_transactions(
"""Ambil daftar transaksi."""
    transaction_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """List posting transactions with optional filters."""
    return _ok(PostingEngineService.list_transactions(
        db, transaction_type=transaction_type, status=status, page=page, per_page=per_page
    ))


@router.get("/transactions/{id}")
def get_transaction(
"""Ambil detail transaksi posting."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Get a single posting transaction with its lines."""
    return _ok(PostingEngineService.get_transaction(db, id))


@router.post("/transactions/{id}/post")
def post_transaction(
"""Post transaksi ke buku besar."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Post a DRAFT transaction → POSTED + auto-generate journal entry.

    This is the Step 2 → Step 3 handoff.
    Posting rules MUST be defined for the transaction type first.
    """
    username = _auth.get("sub") if isinstance(_auth, dict) else "system"
    tx = PostingEngineService.post_transaction(db, id, posted_by=username)
    db.commit()
    return _ok(tx)


@router.post("/transactions/{id}/cancel")
def cancel_transaction(
"""Batalkan transaksi posting."""
    id: int,
    notes: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Cancel a POSTED transaction → CANCELLED + void journal entries."""
    tx = PostingEngineService.cancel_transaction(db, id, notes=notes)
    db.commit()
    return _ok(tx)


@router.get("/transactions/{id}/totals")
def transaction_totals(
"""Ambil total dari transaksi posting."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Check debit/credit balance for a transaction's journals."""
    return _ok(PostingEngineService.calculate_totals(db, id))


# ═══════════════════════════════════════════════════════════════════
# STEP 3: JOURNAL ENTRIES
# ═══════════════════════════════════════════════════════════════════

@router.get("/journals")
def list_journals(
"""Ambil daftar jurnal akuntansi."""
    transaction_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """List journal entries."""
    return _ok(AutoJournalService.list_journals(
        db, transaction_type=transaction_type, page=page, per_page=per_page
    ))


@router.get("/journals/{id}")
def get_journal(
"""Ambil detail jurnal berdasarkan ID."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Get a journal entry with its debit/credit lines."""
    return _ok(AutoJournalService.get_journal(db, id))


@router.get("/journals/by-tx/{transaction_id}")
def get_journals_by_transaction(
"""Ambil jurnal berdasarkan transaksi."""
    transaction_id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Get all journal entries for a given transaction."""
    return _ok(AutoJournalService.get_journal_by_transaction(db, transaction_id))


# ═══════════════════════════════════════════════════════════════════
# POSTING RULES (configure Step 3 behavior)
# ═══════════════════════════════════════════════════════════════════

@router.get("/posting-rules")
def list_posting_rules(
"""Ambil daftar aturan posting."""
    transaction_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """List posting rules, optionally filtered by transaction type."""
    return _ok(PostingRuleService.list_rules(db, transaction_type=transaction_type))


@router.post("/posting-rules", status_code=201)
def create_posting_rule(
"""Buat aturan posting baru."""
    data: ErpPostingRuleCreate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Create a new posting rule."""
    return _ok(PostingRuleService.create_rule(db, data), status_code=201)


@router.get("/posting-rules/{id}")
def get_posting_rule(
"""Ambil detail aturan posting."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Get a single posting rule."""
    return _ok(PostingRuleService.get_rule(db, id))


@router.put("/posting-rules/{id}")
def update_posting_rule(
"""Update aturan posting."""
    id: int,
    data: ErpPostingRuleUpdate,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Update a posting rule."""
    return _ok(PostingRuleService.update_rule(db, id, data))


@router.delete("/posting-rules/{id}")
def delete_posting_rule(
"""Hapus aturan posting."""
    id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """Delete a posting rule."""
    return _ok(PostingRuleService.delete_rule(db, id))
