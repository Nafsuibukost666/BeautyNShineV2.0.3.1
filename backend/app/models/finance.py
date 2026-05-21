"""Finance / Bank / Asset — SQLAlchemy models.

Step 4: Bank accounts, transactions, fixed assets & depreciation.
"""
from datetime import datetime, date

from sqlalchemy import (
    Column, String, BigInteger, Boolean, Date, DateTime,
    Text, ForeignKey, Integer, Float,
)
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


# ═══════════════════════════════════════════════════════════════════
# BANK ACCOUNTS
# ═══════════════════════════════════════════════════════════════════

class ErpBankAccount(Base, TimestampMixin):
    """Rekening bank perusahaan."""
    __tablename__ = "erp_bank_account"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_name = Column(String(200), nullable=False, comment="Nama rekening, e.g. 'Kas Tunai', 'BCA 1234'")
    bank_name = Column(String(100), nullable=True, comment="Nama bank, e.g. 'BCA', 'Mandiri'")
    account_number = Column(String(50), nullable=True, comment="No. rekening")
    account_type = Column(String(20), nullable=False, default="CASH",
                          comment="CASH / BANK / E_WALLET")
    currency = Column(String(10), nullable=False, default="IDR")
    opening_balance = Column(BigInteger, default=0, nullable=False)
    current_balance = Column(BigInteger, default=0, nullable=False)
    branch_id = Column(Integer, ForeignKey("public.erp_master_branch.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)


class ErpBankTransaction(Base, TimestampMixin):
    """Transaksi bank: setoran, penarikan, transfer antar rekening."""
    __tablename__ = "erp_bank_transaction"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    bank_account_id = Column(Integer, ForeignKey("public.erp_bank_account.id"),
                             nullable=False, index=True)
    transaction_type = Column(String(20), nullable=False,
                              comment="DEPOSIT / WITHDRAWAL / TRANSFER_IN / TRANSFER_OUT")
    amount = Column(BigInteger, nullable=False)
    transaction_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    ref_table = Column(String(50), nullable=True, comment="Source table, e.g. 'erp_posting_transaction'")
    ref_id = Column(Integer, nullable=True, comment="Source record ID")
    transfer_to_account_id = Column(Integer, ForeignKey("public.erp_bank_account.id"),
                                    nullable=True, comment="For TRANSFER_OUT: destination account")
    is_reconciled = Column(Boolean, default=False, nullable=False)
    reconciled_at = Column(DateTime, nullable=True)
    balance_before = Column(BigInteger, nullable=True)
    balance_after = Column(BigInteger, nullable=True)

    bank_account = relationship("ErpBankAccount", foreign_keys=[bank_account_id], lazy="selectin")
    transfer_to = relationship("ErpBankAccount", foreign_keys=[transfer_to_account_id], lazy="selectin")


# ═══════════════════════════════════════════════════════════════════
# FIXED ASSETS
# ═══════════════════════════════════════════════════════════════════

class ErpFixedAsset(Base, TimestampMixin):
    """Aset tetap perusahaan — peralatan salon, furniture, renovasi, dll."""
    __tablename__ = "erp_fixed_asset"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=True,
                      comment="EQUIPMENT / FURNITURE / VEHICLE / BUILDING / OTHER")
    purchase_date = Column(Date, nullable=False)
    purchase_price = Column(BigInteger, nullable=False)
    useful_life_years = Column(Integer, nullable=False, default=5,
                               comment="Masa manfaat dalam tahun")
    residual_value = Column(BigInteger, default=0, nullable=False,
                            comment="Nilai residu / sisa")
    depreciation_method = Column(String(20), default="STRAIGHT_LINE",
                                  comment="STRAIGHT_LINE / DOUBLE_DECLINING")
    accumulated_depreciation = Column(BigInteger, default=0, nullable=False)
    book_value = Column(BigInteger, nullable=True,
                        comment="Nilai buku = purchase_price - accumulated_depreciation")
    status = Column(String(20), default="ACTIVE",
                    comment="ACTIVE / FULLY_DEPRECIATED / DISPOSED / SOLD")
    disposed_at = Column(Date, nullable=True)
    disposal_price = Column(BigInteger, nullable=True)
    branch_id = Column(Integer, ForeignKey("public.erp_master_branch.id"), nullable=True)
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    depreciations = relationship("ErpAssetDepreciation", back_populates="asset",
                                 lazy="selectin", order_by="ErpAssetDepreciation.period_code.desc()")


class ErpAssetDepreciation(Base, TimestampMixin):
    """Catatan penyusutan aset per periode."""
    __tablename__ = "erp_asset_depreciation"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    asset_id = Column(Integer, ForeignKey("public.erp_fixed_asset.id"),
                      nullable=False, index=True)
    period_code = Column(String(10), nullable=False, comment="e.g. '2026-05'")
    depreciation_amount = Column(BigInteger, nullable=False)
    accumulated_after = Column(BigInteger, nullable=False,
                               comment="Accumulated depreciation after this entry")
    book_value_after = Column(BigInteger, nullable=False)
    journal_entry_id = Column(Integer, ForeignKey("public.erp_journal_entry.id"),
                              nullable=True, comment="Link ke jurnal penyusutan")
    notes = Column(Text, nullable=True)

    asset = relationship("ErpFixedAsset", back_populates="depreciations", lazy="selectin")
    journal_entry = relationship("ErpJournalEntry", lazy="selectin")
