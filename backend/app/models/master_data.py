"""Master Data — SQLAlchemy models for ERP master tables.

Semua tabel master data dengan awalan 'erp_' di schema public.
"""
from app.models.base import Base, TimestampMixin
from sqlalchemy import (
    Column, String, Integer, BigInteger, Float, Boolean,
    DateTime, Date, Text, ForeignKey,
)


class ErpMasterProduct(Base, TimestampMixin):
    """Produk / jasa yang dijual salon."""
    __tablename__ = "erp_master_product"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=True)
    sub_category = Column(String(100), nullable=True)
    unit = Column(String(20), nullable=True)
    sku = Column(String(50), unique=True, nullable=True)
    cost_price = Column(BigInteger, default=0, nullable=False)
    selling_price = Column(BigInteger, default=0, nullable=False)
    min_stock = Column(Integer, default=5, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class ErpMasterCategory(Base, TimestampMixin):
    """Kategori multi-purpose: PRODUK, POS, AKUNTANSI (chart of account group)."""
    __tablename__ = "erp_master_category"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False, comment="PRODUCT / POS / ACCOUNTING")
    parent_id = Column(Integer, ForeignKey("public.erp_master_category.id"), nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class ErpMasterAccount(Base, TimestampMixin):
    """Chart of Account — Bagan Akun Standard."""
    __tablename__ = "erp_master_account"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    type = Column(String(20), nullable=False, comment="ASSET / LIABILITY / EQUITY / REVENUE / EXPENSE")
    parent_id = Column(Integer, ForeignKey("public.erp_master_account.id"), nullable=True)
    level = Column(Integer, nullable=False, default=3, comment="1=Main Category, 2=Sub Category, 3=Account Group, 4=Detail")
    is_system = Column(Boolean, default=False, nullable=False, comment="System account (Level 1&2) — cannot be edited/deleted")
    description = Column(Text, nullable=True, comment="Deskripsi / keterangan akun")
    is_active = Column(Boolean, default=True, nullable=False)


class ErpAccountMapping(Base, TimestampMixin):
    """Account Mapping — maps transaction types to COA accounts.

    Replaces hardcoded posting rules. Used by AutoJournalService
    to determine which accounts to debit/credit for each transaction type.
    """
    __tablename__ = "erp_account_mapping"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_type = Column(String(20), nullable=False, comment="SALE / PURCHASE / etc.")
    account_id = Column(Integer, ForeignKey("public.erp_master_account.id"), nullable=False)
    debit_or_credit = Column(String(10), nullable=False, default="DEBIT")
    priority = Column(Integer, nullable=False, default=10)
    is_active = Column(Boolean, default=True, nullable=False)


class ErpMasterTax(Base, TimestampMixin):
    """Pajak (PPN, PPh, dsb)."""
    __tablename__ = "erp_master_tax"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    rate = Column(Float, default=0.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class ErpMasterCompany(Base, TimestampMixin):
    """Data perusahaan — singleton table (hanya 1 baris aktif)."""
    __tablename__ = "erp_master_company"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    address = Column(Text, nullable=True)
    phone = Column(String(30), nullable=True)
    email = Column(String(100), nullable=True)
    tax_id = Column(String(50), nullable=True)
    logo_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)


class ErpMasterBranch(Base, TimestampMixin):
    """Cabang / outlet salon."""
    __tablename__ = "erp_master_branch"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    address = Column(Text, nullable=True)
    phone = Column(String(30), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)


class ErpMasterStaff(Base, TimestampMixin):
    """Karyawan / staff salon (therapist, CS, dll)."""
    __tablename__ = "erp_master_staff"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    staff_id = Column(String(50), nullable=True, comment="ID dari sistem POS")
    name = Column(String(150), nullable=False)
    role = Column(String(50), nullable=True)
    commission_type = Column(String(20), nullable=True, comment="PERCENTAGE / FIXED")
    commission_value = Column(Float, default=0.0, nullable=True)
    kabin = Column(String(10), nullable=True, comment="Nomor kabin / ruangan therapist")
    is_active = Column(Boolean, default=True, nullable=False)


class ErpMasterBed(Base, TimestampMixin):
    """Bed / kursi treatment di salon."""
    __tablename__ = "erp_master_bed"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(20), nullable=False)
    name = Column(String(100), nullable=False)
    section = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)


class ErpMasterVoucher(Base, TimestampMixin):
    """Voucher diskon."""
    __tablename__ = "erp_master_voucher"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False)
    discount_type = Column(String(20), nullable=False, comment="PERCENTAGE / FIXED")
    discount_value = Column(Float, default=0.0, nullable=False)
    min_purchase = Column(BigInteger, default=0, nullable=False)
    max_use = Column(Integer, default=0, nullable=False, comment="0 = unlimited")
    used_count = Column(Integer, default=0, nullable=False)
    valid_from = Column(DateTime, nullable=True)
    valid_until = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)


class ErpMasterService(Base, TimestampMixin):
    """Layanan jasa salon (lash extension, brow, facial, dll)."""
    __tablename__ = "erp_master_service"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    duration = Column(Integer, nullable=True, comment="Durasi dalam menit")
    price = Column(BigInteger, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class ErpMasterCustomer(Base, TimestampMixin):
    """Pelanggan salon."""
    __tablename__ = "erp_master_customer"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    phone = Column(String(30), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    total_visits = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)


class ErpMasterSupplier(Base, TimestampMixin):
    """Pemasok produk / perlengkapan salon."""
    __tablename__ = "erp_master_supplier"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(200), nullable=False)
    contact_person = Column(String(150), nullable=True)
    phone = Column(String(30), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)


class ErpFinancialPeriod(Base, TimestampMixin):
    """Periode keuangan (bulanan)."""
    __tablename__ = "erp_financial_period"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(10), unique=True, nullable=False, comment="contoh: '2026-05'")
    name = Column(String(50), nullable=True, comment="contoh: 'Mei 2026'")
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    locked_at = Column(DateTime, nullable=True)
    locked_by = Column(String(100), nullable=True)
    is_closed = Column(Boolean, default=False, nullable=False,
                       comment="TRUE setelah period closing dilakukan")
    closed_at = Column(DateTime, nullable=True)
    closed_by = Column(String(100), nullable=True)


class ErpPeriodCloseLog(Base, TimestampMixin):
    """Log aktivitas period closing — siapa, kapan, dan hasilnya."""
    __tablename__ = "erp_period_close_log"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    period_id = Column(Integer, ForeignKey("public.erp_financial_period.id"),
                       nullable=False, index=True)
    action = Column(String(20), nullable=False,
                    comment="CLOSE / REOPEN / LOCK / UNLOCK")
    total_revenue = Column(BigInteger, default=0, nullable=False)
    total_expenses = Column(BigInteger, default=0, nullable=False)
    net_income = Column(BigInteger, default=0, nullable=False)
    je_number = Column(String(50), nullable=True,
                       comment="Closing journal entry number, if CLOSE action")
    notes = Column(Text, nullable=True)
    performed_by = Column(String(100), nullable=True)
