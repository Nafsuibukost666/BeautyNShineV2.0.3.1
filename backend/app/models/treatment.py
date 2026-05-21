"""Treatment Record — Model untuk mencatat perawatan real-time di salon.

Mengikuti BPMN Swimlane 2 (POS App):
  - Treatment Check-in → Record Treatment (foto, catatan, status)
  - Status: PENDING → IN_PROGRESS → COMPLETED
  - Terkait dengan transaksi POS, customer, therapist, dan services

Table: erp_treatment_record
"""
from datetime import datetime

from sqlalchemy import (
    Column, Integer, BigInteger, String, DateTime, Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB

from app.models.base import Base, TimestampMixin


class ErpTreatmentRecord(Base, TimestampMixin):
    __tablename__ = "erp_treatment_record"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(
        String(50), nullable=False, unique=True, index=True,
        comment="Kode Treatment Record: TRM-001-YYYYMMDD-NNNN",
    )
    transaction_id = Column(
        String(50), nullable=True, index=True,
        comment="ID/Code transaksi POS terkait (nullable untuk walk-in tanpa transaksi)",
    )

    # ── Customer & Therapist ─────────────────────────────
    customer_id = Column(
        Integer, nullable=True,
        comment="ID dari ErpMasterCustomer (nullable untuk customer baru)",
    )
    customer_name = Column(
        String(200), nullable=False,
        comment="Nama customer (copy dari master atau input langsung)",
    )
    customer_phone = Column(
        String(50), nullable=True,
        comment="Nomor telepon customer",
    )
    therapist_id = Column(
        Integer, nullable=True,
        comment="ID dari ErpMasterStaff (nullable untuk walk-in)",
    )
    therapist_name = Column(
        String(200), nullable=False,
        comment="Nama terapis yang menangani",
    )

    # ── Services ─────────────────────────────────────────
    services = Column(
        JSONB, nullable=False, default=list,
        comment="JSON array: [{id, name, price, duration}] — daftar layanan",
    )
    assigned_bed = Column(
        String(50), nullable=True,
        comment="Nomor bed yang digunakan (e.g. 'Bed 1', 'Bed 2')",
    )

    # ── Status & Timing ──────────────────────────────────
    status = Column(
        String(20), nullable=False, default="PENDING",
        comment="PENDING / IN_PROGRESS / COMPLETED",
    )
    started_at = Column(
        DateTime(timezone=True), nullable=True,
        comment="Waktu treatment dimulai (saat terapis klik Mulai)",
    )
    completed_at = Column(
        DateTime(timezone=True), nullable=True,
        comment="Waktu treatment selesai (saat terapis klik Selesai)",
    )

    # ── Documentation ────────────────────────────────────
    before_photos = Column(
        JSONB, nullable=True, default=list,
        comment="JSON array of photo URLs — foto sebelum treatment",
    )
    after_photos = Column(
        JSONB, nullable=True, default=list,
        comment="JSON array of photo URLs — foto sesudah treatment",
    )
    therapist_notes = Column(
        Text, nullable=True,
        comment="Catatan terapis selama/setelah treatment",
    )

    # ── Pricing ──────────────────────────────────────────
    total_price = Column(
        BigInteger, nullable=False, default=0,
        comment="Total harga treatment (dalam rupiah)",
    )
    discount = Column(
        BigInteger, nullable=False, default=0,
        comment="Diskon (dalam rupiah)",
    )

    # ── Sync Status ──────────────────────────────────────
    sync_status = Column(
        String(20), nullable=False, default="PENDING",
        comment="PENDING / SYNCED / FAILED — status sinkronisasi ke ERP",
    )
    synced_at = Column(
        DateTime(timezone=True), nullable=True,
        comment="Timestamp sinkronisasi ke ERP",
    )
