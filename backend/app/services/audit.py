"""Audit Trail — Business logic untuk mencatat & menampilkan audit log.

Step 7: Append-only logging untuk semua perubahan data kritis.
"""

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.audit import ErpAuditLog


class AuditService:
    """Audit trail service — log events & query history."""

    VALID_ACTIONS = {
        "CREATE", "UPDATE", "DELETE",
        "POST", "CANCEL", "VOID",
        "LOCK", "UNLOCK",
        "CLOSE", "REOPEN",
        "DEPOSIT", "WITHDRAWAL", "TRANSFER",
        "DEPRECIATE", "DISPOSE",
    }

    @staticmethod
    def log(
        db: Session,
        table_name: str,
        action: str,
        record_id: Optional[str] = None,
        summary: Optional[str] = None,
        old_values: Optional[dict] = None,
        new_values: Optional[dict] = None,
        performed_by: Optional[str] = None,
        ip_address: Optional[str] = None,
        branch_id: Optional[int] = None,
    ) -> ErpAuditLog:
        """Catat satu event audit.

        Args:
            db: Database session
            table_name: Nama tabel, e.g. 'erp_posting_transaction'
            action: Jenis aksi (CREATE, UPDATE, POST, CLOSE, dll)
            record_id: ID record yang diubah (as string)
            summary: Deskripsi human-readable
            old_values: Snapshot sebelum perubahan (dict)
            new_values: Snapshot setelah perubahan (dict)
            performed_by: Username pelaku
            ip_address: IP address (optional)
            branch_id: Branch ID (optional)

        Returns:
            ErpAuditLog instance
        """
        if action not in AuditService.VALID_ACTIONS:
            # Allow custom actions but warn
            pass

        log_entry = ErpAuditLog(
            table_name=table_name,
            record_id=str(record_id) if record_id is not None else None,
            action=action,
            summary=summary,
            old_values=old_values,
            new_values=new_values,
            performed_by=performed_by or "system",
            performed_at=datetime.now(timezone.utc),
            ip_address=ip_address,
            branch_id=branch_id,
        )
        db.add(log_entry)
        db.flush()  # Don't commit — let caller manage transaction
        return log_entry

    # ────────────────────────────────────────────────────────────────
    # QUERY METHODS
    # ────────────────────────────────────────────────────────────────

    @staticmethod
    def list_logs(
        db: Session,
        table_name: Optional[str] = None,
        action: Optional[str] = None,
        performed_by: Optional[str] = None,
        record_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """List audit logs dengan filter."""
        q = db.query(ErpAuditLog)

        if table_name:
            q = q.filter(ErpAuditLog.table_name == table_name)
        if action:
            q = q.filter(ErpAuditLog.action == action)
        if performed_by:
            q = q.filter(ErpAuditLog.performed_by == performed_by)
        if record_id:
            q = q.filter(ErpAuditLog.record_id == record_id)
        if start_date:
            from datetime import date
            q = q.filter(ErpAuditLog.performed_at >= date.fromisoformat(start_date))
        if end_date:
            from datetime import date
            q = q.filter(ErpAuditLog.performed_at <= date.fromisoformat(end_date) + __import__("datetime").timedelta(days=1))

        total = q.count()
        items = q.order_by(desc(ErpAuditLog.id)).offset(
            (page - 1) * per_page
        ).limit(per_page).all()

        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
        }

    @staticmethod
    def get_log(db: Session, log_id: int) -> ErpAuditLog:
        """Ambil satu audit log by ID."""
        log = db.query(ErpAuditLog).filter(ErpAuditLog.id == log_id).first()
        if not log:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Audit log not found")
        return log

    @staticmethod
    def get_recent(db: Session, limit: int = 10) -> list[ErpAuditLog]:
        """Ambil N audit log terbaru."""
        return db.query(ErpAuditLog).order_by(
            desc(ErpAuditLog.id)
        ).limit(limit).all()

    @staticmethod
    def count_by_action(db: Session) -> list[dict]:
        """Statistik: jumlah log per action."""
        from sqlalchemy import func
        results = db.query(
            ErpAuditLog.action,
            func.count(ErpAuditLog.id).label("count"),
        ).group_by(ErpAuditLog.action).order_by(desc("count")).all()
        return [{"action": r[0], "count": r[1]} for r in results]
