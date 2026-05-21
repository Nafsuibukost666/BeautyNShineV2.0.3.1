"""ERP Posting Engine + Auto Journal — SQLAlchemy models.

Posting Engine: Merekam transaksi bisnis (penjualan, pengeluaran, pembayaran).
Auto Journal: Otomatis generate jurnal double-entry dari transaksi yang di-post.
"""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Column, String, BigInteger, Float, Boolean,
    DateTime, Date, Text, ForeignKey, Integer, Enum as SAEnum,
)
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


# ═══════════════════════════════════════════════════════════════════
# STEP 2: POSTING ENGINE
# ═══════════════════════════════════════════════════════════════════

class ErpPostingTransaction(Base, TimestampMixin):
    """Transaksi bisnis utama — hasil dari POS, pembelian, pengeluaran, dll.

    Setiap transaksi punya doc_number dari Document Number Registry
    dan status workflow: DRAFT → POSTED → CANCELLED.
    """
    __tablename__ = "erp_posting_transaction"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    doc_number = Column(String(50), unique=True, nullable=False, index=True,
                        comment="Document number from registry, e.g. POS-MAIN-20260518-0001")
    transaction_type = Column(String(20), nullable=False, index=True,
                              comment="SALE / EXPENSE / PAYMENT / PURCHASE / ADJUSTMENT")
    ref_table = Column(String(50), nullable=True,
                       comment="Source table, e.g. 'transaction', 'expense'")
    ref_id = Column(String(50), nullable=True,
                    comment="Source record ID (UUID from POS)")
    total_amount = Column(BigInteger, default=0, nullable=False,
                          comment="Total in Rupiah (integer, no decimal)")
    status = Column(String(20), default="DRAFT", nullable=False,
                    comment="DRAFT / POSTED / CANCELLED")
    period_id = Column(Integer, ForeignKey("public.erp_financial_period.id"),
                       nullable=True, comment="Financial period this belongs to")
    posted_at = Column(DateTime, nullable=True)
    posted_by = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    transaction_date = Column(Date, nullable=False,
                              comment="Date the transaction occurred")

    # Relationships
    lines = relationship("ErpPostingLine", back_populates="transaction",
                         lazy="selectin", cascade="all, delete-orphan",
                         order_by="ErpPostingLine.line_no")
    period = relationship("ErpFinancialPeriod", lazy="selectin")


class ErpPostingLine(Base, TimestampMixin):
    """Line item dalam sebuah posting transaction."""
    __tablename__ = "erp_posting_line"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(Integer,
                            ForeignKey("public.erp_posting_transaction.id"),
                            nullable=False, index=True)
    line_no = Column(Integer, nullable=False, default=1)
    product_id = Column(Integer, ForeignKey("public.erp_master_product.id"),
                        nullable=True)
    product_name = Column(String(200), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(BigInteger, default=0, nullable=False)
    subtotal = Column(BigInteger, default=0, nullable=False)
    discount_amount = Column(BigInteger, default=0, nullable=False)
    tax_amount = Column(BigInteger, default=0, nullable=False)
    tax_id = Column(Integer, ForeignKey("public.erp_master_tax.id"),
                    nullable=True)
    notes = Column(Text, nullable=True)

    transaction = relationship("ErpPostingTransaction", back_populates="lines")


# ═══════════════════════════════════════════════════════════════════
# STEP 3: AUTO JOURNAL ENTRY
# ═══════════════════════════════════════════════════════════════════

class ErpPostingRule(Base, TimestampMixin):
    """Aturan posting: tentukan akun mana yang di-Debit/Credit untuk tiap tipe transaksi.

    Contoh:
      - SALE: Debit (1-1000 KAS), Credit (4-1000 PENDAPATAN JASA)
      - EXPENSE: Debit (5-1000 BIAYA), Credit (1-1000 KAS)
    """
    __tablename__ = "erp_posting_rule"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_type = Column(String(20), nullable=False, index=True,
                              comment="SALE / EXPENSE / PAYMENT / PURCHASE / ADJUSTMENT")
    account_id = Column(Integer, ForeignKey("public.erp_master_account.id"),
                        nullable=False, comment="COA account to post")
    debit_or_credit = Column(String(10), nullable=False,
                             comment="DEBIT or CREDIT")
    priority = Column(Integer, default=0, nullable=False,
                      comment="Sort order within transaction type")
    condition_field = Column(String(50), nullable=True,
                             comment="Optional: field to evaluate, e.g. 'payment_method'")
    condition_value = Column(String(50), nullable=True,
                             comment="Optional: expected value, e.g. 'CASH'")
    is_active = Column(Boolean, default=True, nullable=False)

    account = relationship("ErpMasterAccount", lazy="selectin")


class ErpJournalEntry(Base, TimestampMixin):
    """Jurnal akuntansi — hasil auto-generate dari posting transaction.

    Setiap transaksi yang di-POSTED akan menghasilkan satu atau lebih
    jurnal entries. Format: JE-BRANCH-DATE-SEQ.
    """
    __tablename__ = "erp_journal_entry"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    je_number = Column(String(50), unique=True, nullable=False, index=True,
                       comment="Journal entry number, e.g. JE-MAIN-20260518-0001")
    transaction_id = Column(Integer,
                            ForeignKey("public.erp_posting_transaction.id"),
                            nullable=True, index=True)
    transaction_type = Column(String(20), nullable=False)
    period_id = Column(Integer, ForeignKey("public.erp_financial_period.id"),
                       nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="POSTED", nullable=False,
                    comment="DRAFT / POSTED / VOID")
    posted_at = Column(DateTime, nullable=True)
    posted_by = Column(String(100), nullable=True)
    entry_date = Column(Date, nullable=False,
                        comment="Date the journal entry is recorded")
    total_debit = Column(BigInteger, default=0, nullable=False)
    total_credit = Column(BigInteger, default=0, nullable=False)

    # Relationships
    lines = relationship("ErpJournalLine", back_populates="journal_entry",
                         lazy="selectin", cascade="all, delete-orphan",
                         order_by="ErpJournalLine.line_no")
    transaction = relationship("ErpPostingTransaction", lazy="selectin")
    period = relationship("ErpFinancialPeriod", lazy="selectin")


class ErpJournalLine(Base, TimestampMixin):
    """Individual journal line: satu baris debit atau credit."""
    __tablename__ = "erp_journal_line"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    journal_entry_id = Column(Integer,
                              ForeignKey("public.erp_journal_entry.id"),
                              nullable=False, index=True)
    line_no = Column(Integer, nullable=False, default=1)
    account_id = Column(Integer, ForeignKey("public.erp_master_account.id"),
                        nullable=False)
    account_code = Column(String(20), nullable=True,
                          comment="Denormalized for fast reporting")
    account_name = Column(String(200), nullable=True)
    debit_amount = Column(BigInteger, default=0, nullable=False)
    credit_amount = Column(BigInteger, default=0, nullable=False)
    description = Column(Text, nullable=True)

    journal_entry = relationship("ErpJournalEntry", back_populates="lines")
    account = relationship("ErpMasterAccount", lazy="selectin")
