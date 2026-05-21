"""POS Integration — SQLAlchemy models for syncing POS transactions
and settlements into the ERP system.

Tables:
  - erp_pos_transaction_sync : Individual POS transaction records
  - erp_pos_settlement       : End-of-session settlement records
"""
from datetime import datetime

from sqlalchemy import (
    Column, String, Integer, BigInteger, DateTime, Text,
    func,
)
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class ErpPosTransactionSync(Base, TimestampMixin):
    """Transaksi yang disinkronisasi dari POS ke ERP.

    Setiap transaksi POS (penjualan) dicatat di sini sebagai referensi
    untuk proses akuntansi dan audit.
    """
    __tablename__ = "erp_pos_transaction_sync"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    pos_transaction_id = Column(
        String(50), nullable=False, index=True, unique=False,
        comment="ID transaksi dari sistem POS (NestJS UUID)",
    )
    code = Column(
        String(50), nullable=False, index=True,
        comment="Nomor transaksi dari POS, e.g. TRX-20260518-001",
    )
    date = Column(
        DateTime(timezone=True), nullable=False, index=True,
        comment="Tanggal & jam transaksi POS",
    )
    customer_name = Column(
        String(200), nullable=True,
        comment="Nama pelanggan dari POS",
    )
    subtotal = Column(
        BigInteger, nullable=False, default=0,
        comment="Subtotal transaksi sebelum diskon (dalam rupiah)",
    )
    discount = Column(
        BigInteger, nullable=False, default=0,
        comment="Diskon transaksi (dalam rupiah)",
    )
    grand_total = Column(
        BigInteger, nullable=False, default=0,
        comment="Total akhir setelah diskon (dalam rupiah)",
    )
    payment_status = Column(
        String(20), nullable=False, default="PAID",
        comment="PAID / UNPAID / PARTIAL / REFUND",
    )
    notes = Column(Text, nullable=True)
    items = Column(
        Text, nullable=True,
        comment="JSON: daftar item/jasa yang dibeli",
    )
    payments = Column(
        Text, nullable=True,
        comment="JSON: daftar pembayaran (metode, jumlah)",
    )
    source = Column(
        String(20), nullable=False, default="POS",
        comment="Sumber data, default: POS",
    )
    doc_key = Column(
        String(50), nullable=True, unique=True,
        comment="Nomor dokumen ERP yang di-generate dari DocumentRegistry",
    )
    synced_at = Column(
        DateTime(timezone=True), nullable=True,
        comment="Timestamp saat data disinkronisasi ke ERP",
    )


class ErpPosSettlement(Base, TimestampMixin):
    """Settlement sesi POS — penutupan kas harian/sesi.

    Digunakan untuk rekonsiliasi antara POS dan ERP, mencocokkan
    saldo kas aktual dengan yang diharapkan.
    """
    __tablename__ = "erp_pos_settlement"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    pos_session_id = Column(
        String(50), nullable=False, index=True,
        comment="ID sesi dari sistem POS (UUID)",
    )
    session_code = Column(
        String(50), nullable=False, index=True,
        comment="Kode sesi POS, e.g. SESSION-20260518-001",
    )
    opened_at = Column(
        DateTime(timezone=True), nullable=True,
        comment="Waktu buka sesi",
    )
    closed_at = Column(
        DateTime(timezone=True), nullable=True,
        comment="Waktu tutup sesi",
    )
    opened_by = Column(
        String(100), nullable=True,
        comment="Nama/user yang membuka sesi",
    )
    opening_cash = Column(
        BigInteger, nullable=False, default=0,
        comment="Kas awal sesi (dalam rupiah)",
    )
    closing_cash = Column(
        BigInteger, nullable=True, default=0,
        comment="Kas fisik akhir sesi (dalam rupiah)",
    )
    expected_cash = Column(
        BigInteger, nullable=True, default=0,
        comment="Kas yang diharapkan (opening + penjualan - pengeluaran)",
    )
    difference = Column(
        BigInteger, nullable=True, default=0,
        comment="Selisih: closing_cash - expected_cash",
    )
    total_sales = Column(
        BigInteger, nullable=False, default=0,
        comment="Total penjualan selama sesi (dalam rupiah)",
    )
    total_transactions = Column(
        Integer, nullable=False, default=0,
        comment="Jumlah transaksi selama sesi",
    )
    total_expenses = Column(
        BigInteger, nullable=False, default=0,
        comment="Total pengeluaran selama sesi (dalam rupiah)",
    )
    notes = Column(Text, nullable=True)
    payment_breakdown = Column(
        Text, nullable=True,
        comment="JSON: rincian pembayaran per metode (cash, qris, dll)",
    )
    doc_key = Column(
        String(50), nullable=True, unique=True,
        comment="Nomor dokumen ERP yang di-generate dari DocumentRegistry",
    )
    synced_at = Column(
        DateTime(timezone=True), nullable=True,
        comment="Timestamp saat data disinkronisasi ke ERP",
    )


class ErpPosSession(Base, TimestampMixin):
    """POS Session/Shift — untuk Buka/Tutup shift dari POS Expo.

    Tabel ini dikelola oleh ERP FastAPI (bukan NestJS) karena
    NestJS backend POS Lite tidak berjalan. Digunakan oleh
    POS Expo untuk mengelola sesi kasir.

    Format kode: SFT-001-YYYYMMDD-NNNN
    """
    __tablename__ = "erp_pos_session"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(
        String(50), nullable=False, unique=True, index=True,
        comment="Kode sesi: SFT-001-YYYYMMDD-NNNN",
    )
    status = Column(
        String(20), nullable=False, default="OPEN",
        comment="OPEN / CLOSED",
    )
    opened_by = Column(
        String(100), nullable=False,
        comment="Nama/user yang membuka sesi",
    )
    closed_by = Column(
        String(100), nullable=True,
        comment="Nama/user yang menutup sesi",
    )
    opened_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False,
        comment="Waktu buka sesi",
    )
    closed_at = Column(
        DateTime(timezone=True), nullable=True,
        comment="Waktu tutup sesi",
    )
    opening_cash = Column(
        BigInteger, nullable=False, default=0,
        comment="Kas awal sesi (dalam rupiah)",
    )
    closing_cash = Column(
        BigInteger, nullable=True,
        comment="Kas fisik akhir sesi (dalam rupiah)",
    )
    expected_cash = Column(
        BigInteger, nullable=True,
        comment="Kas yang diharapkan (opening + penjualan)",
    )
    difference = Column(
        BigInteger, nullable=True,
        comment="Selisih: closing_cash - expected_cash",
    )
    total_sales = Column(
        BigInteger, nullable=False, default=0,
        comment="Total penjualan selama sesi (dalam rupiah)",
    )
    total_transactions = Column(
        Integer, nullable=False, default=0,
        comment="Jumlah transaksi selama sesi",
    )
    total_expenses = Column(
        BigInteger, nullable=False, default=0,
        comment="Total pengeluaran selama sesi (dalam rupiah)",
    )
    notes = Column(Text, nullable=True)
