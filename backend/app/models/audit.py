"""Audit Trail — SQLAlchemy model.

Step 7: Mencatat semua perubahan data penting di ERP.
"""

from datetime import datetime

from sqlalchemy import Column, String, BigInteger, Boolean, DateTime, Text, Integer, JSON

from app.models.base import Base, TimestampMixin


class ErpAuditLog(Base, TimestampMixin):
    """Audit log — catat siapa melakukan apa, kapan, dan data sebelum/sesudah.

    Tabel ini APPEND-ONLY: tidak pernah di-update atau di-delete.
    """
    __tablename__ = "erp_audit_log"
    __table_args__ = {"schema": "public"}

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    table_name = Column(String(100), nullable=False, index=True,
                        comment="Nama tabel yang dimodifikasi, e.g. 'erp_posting_transaction'")
    record_id = Column(String(50), nullable=True, index=True,
                       comment="ID record yang diubah")
    action = Column(String(20), nullable=False, index=True,
                    comment="CREATE / UPDATE / DELETE / POST / CANCEL / LOCK / UNLOCK / CLOSE / REOPEN / DEPOSIT / WITHDRAW / TRANSFER / DEPRECIATE / DISPOSE")
    summary = Column(String(500), nullable=True,
                     comment="Deskripsi singkat (human-readable)")
    old_values = Column(JSON, nullable=True,
                        comment="Snapshot data sebelum perubahan")
    new_values = Column(JSON, nullable=True,
                        comment="Snapshot data setelah perubahan")
    performed_by = Column(String(100), nullable=True, index=True,
                          comment="Username / user ID yang melakukan")
    performed_at = Column(DateTime, nullable=False, default=datetime.utcnow,
                          comment="Timestamp kejadian")
    ip_address = Column(String(50), nullable=True)
    branch_id = Column(Integer, nullable=True,
                       comment="Branch tempat kejadian")
