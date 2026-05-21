"""POS Integration API — FastAPI router untuk menerima sync dari POS.

Prefix: /erp/api/v1/pos

Endpoint ini dipanggil oleh POS NestJS backend untuk mengirimkan
data transaksi dan settlement ke ERP.
"""
from typing import Any, Optional

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.pos_integration import (
    PosSettlementCreate,
    PosSettlementResponse,
    PosTransactionSyncCreate,
    PosTransactionSyncResponse,
)
from app.services.pos_integration import PosIntegrationService

router = APIRouter(prefix="/erp/api/v1/pos", tags=["POS Integration"])


_serialize_seen = set()


def _serialize(obj: Any, depth: int = 0) -> Any:
    """Recursively serialize SQLAlchemy ORM objects to plain dicts."""
    if obj is None or depth > 10:
        return None
    # Handle primitives
    if isinstance(obj, (str, int, float, bool)):
        return obj
    # Handle date/time
    import datetime as _dt
    if isinstance(obj, (_dt.datetime, _dt.date, _dt.time)):
        return obj.isoformat()
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
# POS TRANSACTIONS
# ═══════════════════════════════════════════════════════════════════


@router.post("/transactions", status_code=201)
def capture_transaction(
"""Capture/ambil transaksi POS."""
    payload: PosTransactionSyncCreate,
    db: Session = Depends(get_db),
):
    """Terima transaksi dari POS, simpan ke ERP, dan generate doc_key.

    Payload berisi data transaksi lengkap termasuk items dan payments.
    Response mencakup doc_key yang di-generate oleh DocumentRegistry.
    """
    record = PosIntegrationService.capture_transaction(db, payload)
    return _ok(record, status_code=201)


@router.get("/transactions")
def list_transactions(
"""Ambil daftar transaksi."""
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
):
    """Daftar transaksi POS yang sudah di-sync."""
    return _ok(PosIntegrationService.list_transactions(db, page, per_page))


# ═══════════════════════════════════════════════════════════════════
# POS SETTLEMENTS
# ═══════════════════════════════════════════════════════════════════


@router.post("/settlement", status_code=201)
def create_settlement(
"""Buat settlement baru."""
    payload: PosSettlementCreate,
    db: Session = Depends(get_db),
):
    """Terima settlement sesi POS, simpan ke ERP, dan generate doc_key.

    Payload berisi data penutupan sesi termasuk rincian kas
    dan rincian pembayaran per metode.
    """
    record = PosIntegrationService.create_settlement(db, payload)
    return _ok(record, status_code=201)


@router.get("/settlements")
def list_settlements(
"""Ambil daftar settlement."""
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
):
    """Daftar settlement POS yang sudah di-sync."""
    return _ok(PosIntegrationService.list_settlements(db, page, per_page))


# ═══════════════════════════════════════════════════════════════════
# POS SESSIONS (ERP-managed — for POS Expo)
# ═══════════════════════════════════════════════════════════════════

import datetime as _dt
from fastapi import HTTPException as FastAPIHTTPException
from app.models.pos_integration import ErpPosSession


@router.post("/session/open", status_code=201)
def open_session(
"""Buka sesi POS baru."""
    body: dict,
    db: Session = Depends(get_db),
):
    """Buka shift/sesi POS baru.

    Request body: { "openedBy": string, "openingCash": number }
    Response: { success: true, data: { id, code, status, openedBy, ... } }
    """
    opened_by = (body.get("openedBy") or "").strip()
    opening_cash = body.get("openingCash", 0)

    if not opened_by:
        raise FastAPIHTTPException(400, "Nama petugas (openedBy) wajib diisi")
    if opening_cash is None or opening_cash < 0:
        raise FastAPIHTTPException(400, "Jumlah uang awal (openingCash) harus diisi dan tidak negatif")

    opening_cash = int(opening_cash)

    # Cek apakah masih ada sesi OPEN
    active = db.query(ErpPosSession).filter(
        ErpPosSession.status == "OPEN"
    ).first()
    if active:
        raise FastAPIHTTPException(
            400, f"Masih ada sesi aktif: {active.code}. Tutup sesi terlebih dahulu."
        )

    # Generate session code: SFT-001-YYYYMMDD-NNNN
    now = _dt.datetime.now()
    date_str = now.strftime("%Y%m%d")
    prefix = f"SFT-001-{date_str}-"

    last_session = db.query(ErpPosSession).filter(
        ErpPosSession.code.like(f"{prefix}%")
    ).order_by(ErpPosSession.code.desc()).first()

    seq = 1
    if last_session:
        parts = last_session.code.split("-")
        try:
            seq = int(parts[-1]) + 1
        except (ValueError, IndexError):
            seq = 1

    code = f"{prefix}{seq:04d}"

    session = ErpPosSession(
        code=code,
        status="OPEN",
        opened_by=opened_by,
        opening_cash=opening_cash,
        total_sales=0,
        total_transactions=0,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return _ok(session, status_code=201)


@router.post("/session/{session_id}/close")
def close_session(
"""Tutup sesi POS."""
    session_id: int,
    body: dict,
    db: Session = Depends(get_db),
):
    """Tutup sesi POS.

    Request body: { "closingCash": number, "notes?": string }
    """
    closing_cash = body.get("closingCash")
    notes = (body.get("notes") or "").strip() or None

    if closing_cash is None or closing_cash < 0:
        raise FastAPIHTTPException(400, "Jumlah uang akhir (closingCash) harus diisi dan tidak negatif")

    closing_cash = int(closing_cash)

    session = db.query(ErpPosSession).filter(
        ErpPosSession.id == session_id
    ).first()

    if not session:
        raise FastAPIHTTPException(404, f"Sesi dengan ID {session_id} tidak ditemukan")

    if session.status != "OPEN":
        raise FastAPIHTTPException(
            400, f"Sesi {session.code} sudah ditutup pada {session.closed_at}"
        )

    # Hitung expected cash (opening + sales - expenses)
    expected_cash = session.opening_cash + session.total_sales - (session.total_expenses or 0)
    difference = closing_cash - expected_cash

    session.status = "CLOSED"
    session.closed_at = _dt.datetime.now(_dt.timezone.utc)
    session.closing_cash = closing_cash
    session.expected_cash = expected_cash
    session.difference = difference
    if notes:
        session.notes = notes

    db.commit()
    db.refresh(session)

    return _ok(session)


@router.post("/session/{session_id}/expense", status_code=201)
def add_session_expense(
"""Tambah pengeluaran ke sesi POS."""
    session_id: int,
    body: dict,
    db: Session = Depends(get_db),
):
    """Catat pengeluaran selama sesi POS berlangsung.

    Request body: { "description": string, "amount": number }
    """
    description = (body.get("description") or "").strip()
    amount = body.get("amount")

    if not description:
        raise FastAPIHTTPException(400, "Deskripsi pengeluaran wajib diisi")
    if amount is None or amount <= 0:
        raise FastAPIHTTPException(400, "Jumlah pengeluaran harus lebih dari 0")

    amount = int(amount)

    session = db.query(ErpPosSession).filter(
        ErpPosSession.id == session_id
    ).first()

    if not session:
        raise FastAPIHTTPException(404, f"Sesi dengan ID {session_id} tidak ditemukan")
    if session.status != "OPEN":
        raise FastAPIHTTPException(400, f"Sesi {session.code} sudah ditutup, tidak bisa menambah pengeluaran")

    session.total_expenses = (session.total_expenses or 0) + amount

    # Simpan detail pengeluaran di notes
    expense_note = f"[PENGELUARAN] {description}: Rp {amount:,}"
    if session.notes:
        session.notes += "\n" + expense_note
    else:
        session.notes = expense_note

    db.commit()
    db.refresh(session)

    return _ok({
        "message": f"Pengeluaran '{description}' sebesar Rp {amount:,} tercatat",
        "total_expenses": session.total_expenses,
        "session_id": session.id,
    }, status_code=201)


@router.get("/session/{session_id}/expenses")
def list_session_expenses(session_id: int, db: Session = Depends(get_db)):
    """Parse dan kembalikan daftar pengeluaran dari notes sesi."""
    session = db.query(ErpPosSession).filter(
        ErpPosSession.id == session_id
    ).first()

    if not session:
        raise FastAPIHTTPException(404, "Sesi tidak ditemukan")

    expenses = []
    if session.notes:
        for line in session.notes.split("\n"):
            if line.startswith("[PENGELUARAN]"):
                parts = line.replace("[PENGELUARAN] ", "").split(": Rp ")
                desc = parts[0] if len(parts) > 0 else ""
                amt_str = parts[-1].replace(",", "") if len(parts) > 1 else "0"
                try:
                    amt = int(amt_str)
                except ValueError:
                    amt = 0
                expenses.append({"description": desc, "amount": amt})

    return _ok({
        "total_expenses": session.total_expenses or 0,
        "items": expenses,
    })


@router.get("/session/active")
def get_active_session(db: Session = Depends(get_db)):
    """Dapatkan sesi POS yang sedang aktif (OPEN)."""
    session = db.query(ErpPosSession).filter(
        ErpPosSession.status == "OPEN"
    ).order_by(ErpPosSession.opened_at.desc()).first()

    return _ok(session)  # null if no active session


@router.get("/session")
def list_sessions(
"""Ambil daftar sesi POS."""
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """Daftar semua sesi POS."""
    sessions = db.query(ErpPosSession).order_by(
        ErpPosSession.opened_at.desc()
    ).offset(offset).limit(limit).all()

    total = db.query(ErpPosSession).count()

    return _ok({
        "sessions": _serialize(sessions),
        "total": total,
        "limit": limit,
        "offset": offset,
    })
