"""Booking Record — Model untuk mencatat booking pelanggan di POS.

Mengikuti BPMN Swimlane 1 & 2:
  - Customer booking via telepon/WA/datang langsung
  - Kasir input: Nama, Telepon, Treatment, Therapist
  - Generate BOOK document number → Simpan Booking
  - Check-in: Retrieve by name/phone → Convert to POS Order
  - Status: BOOKED → CHECKED_IN → DONE / CANCELLED / NO_SHOW

Table: erp_booking_record
"""
from datetime import datetime

from sqlalchemy import (
    Column, Integer, BigInteger, String, DateTime, Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB

from app.models.base import Base, TimestampMixin


class ErpBookingRecord(Base, TimestampMixin):
    __tablename__ = "erp_booking_record"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(
        String(50), nullable=False, unique=True, index=True,
        comment="Kode Booking: BOOK-001-YYYYMMDD-NNNN",
    )

    # ── Customer Info ────────────────────────────────────
    customer_name = Column(
        String(200), nullable=False,
        comment="Nama customer",
    )
    customer_phone = Column(
        String(50), nullable=True,
        comment="Nomor telepon customer",
    )

    # ── Treatment & Therapist ────────────────────────────
    services = Column(
        JSONB, nullable=False, default=list,
        comment="JSON array: [{name, price, duration}] — daftar layanan",
    )
    service_names = Column(
        Text, nullable=True,
        comment="Plain text: nama layanan (untuk tampilan cepat)",
    )
    therapist_name = Column(
        String(200), nullable=False,
        comment="Nama therapist yang ditugaskan",
    )
    assigned_bed = Column(
        String(50), nullable=True,
        comment="Nomor bed yang digunakan",
    )

    # ── Schedule ─────────────────────────────────────────
    booking_date = Column(
        DateTime(timezone=True), nullable=False,
        comment="Tanggal & jam booking",
    )
    estimated_duration = Column(
        Integer, nullable=False, default=60,
        comment="Estimasi durasi treatment (menit)",
    )

    # ── Status ───────────────────────────────────────────
    status = Column(
        String(20), nullable=False, default="BOOKED",
        comment="BOOKED / CHECKED_IN / DONE / CANCELLED / NO_SHOW",
    )
    checked_in_at = Column(
        DateTime(timezone=True), nullable=True,
        comment="Waktu check-in (customer datang)",
    )
    completed_at = Column(
        DateTime(timezone=True), nullable=True,
        comment="Waktu selesai (treatment done)",
    )

    # ── Link ke POS Order ────────────────────────────────
    transaction_id = Column(
        String(50), nullable=True, index=True,
        comment="Transaction code yang terbuat saat check-in (POS-...)",
    )

    # ── Pricing ──────────────────────────────────────────
    total_price = Column(
        BigInteger, nullable=False, default=0,
        comment="Total harga treatment (dalam rupiah)",
    )

    # ── Notes ────────────────────────────────────────────
    notes = Column(Text, nullable=True, comment="Catatan kasir/customer")
