"""Audit Trail — FastAPI router.

Step 7: Lihat & filter audit log.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.audit import AuditService
from app.api.posting import _safe_serialize

router = APIRouter(prefix="/erp/api/v1/audit", tags=["Audit Trail"])


def _ok(data, status_code: int = 200):
    """Helper untuk mengembalikan response JSON standar.

    Membungkus data dengan format {"success": True, "data": ...} dan
    men-serialize data ORM secara aman.

    Args:
        data: Data yang akan dikembalikan (ORM object atau dict)
        status_code: HTTP status code (default: 200)

    Returns:
        JSONResponse dengan wrapper success
    """
    return JSONResponse({"success": True, "data": _safe_serialize(data)}, status_code=status_code)


@router.get("/logs")
def list_audit_logs(
"""Ambil daftar log audit dengan filter."""
    table_name: Optional[str] = Query(None, description="Filter by table name"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    performed_by: Optional[str] = Query(None, description="Filter by user"),
    record_id: Optional[str] = Query(None, description="Filter by record ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """📋 Daftar audit log — filter berdasarkan tabel, aksi, user, dll."""
    return _ok(AuditService.list_logs(
        db,
        table_name=table_name,
        action=action,
        performed_by=performed_by,
        record_id=record_id,
        start_date=start_date,
        end_date=end_date,
        page=page,
        per_page=per_page,
    ))


@router.get("/logs/{log_id}")
def get_audit_log(
"""Ambil daftar audit log dengan filter.

    Args:
        db: Database session
        entity_type: Filter berdasarkan tipe entitas (opsional)
        entity_id: Filter berdasarkan ID entitas (opsional)
        action: Filter berdasarkan aksi (opsional)
        user_id: Filter berdasarkan user (opsional)
        limit: Jumlah maksimal data
        offset: Halaman data

    Returns:
        JSONResponse berisi daftar audit log"""
    log_id: int,
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """🔍 Detail satu audit log."""
    return _ok(AuditService.get_log(db, log_id))


@router.get("/recent")
def get_recent_logs(
"""Ambil log audit terbaru."""
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """🕐 N audit log terbaru."""
    return _ok(AuditService.get_recent(db, limit=limit))


@router.get("/stats")
def get_audit_stats(
"""Ambil statistik audit log."""
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """📊 Statistik audit log per action type."""
    return _ok(AuditService.count_by_action(db))
