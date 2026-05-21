"""Finance / Bank / Asset — Pydantic schemas."""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ═══════════════════════════════════════════════════════════════════
# BANK ACCOUNTS
# ═══════════════════════════════════════════════════════════════════

class ErpBankAccountCreate(BaseModel):
    account_name: str
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    account_type: str = "CASH"  # CASH / BANK / E_WALLET
    currency: str = "IDR"
    opening_balance: int = 0
    branch_id: Optional[int] = None
    notes: Optional[str] = None


class ErpBankAccountUpdate(BaseModel):
    account_name: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    account_type: Optional[str] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class ErpBankAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    account_name: str
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    account_type: str
    currency: str
    opening_balance: int
    current_balance: int
    branch_id: Optional[int] = None
    is_active: bool
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════════════
# BANK TRANSACTIONS
# ═══════════════════════════════════════════════════════════════════

class ErpBankTransactionCreate(BaseModel):
    bank_account_id: int
    transaction_type: str  # DEPOSIT / WITHDRAWAL / TRANSFER_IN / TRANSFER_OUT
    amount: int
    transaction_date: date
    description: Optional[str] = None
    ref_table: Optional[str] = None
    ref_id: Optional[int] = None
    transfer_to_account_id: Optional[int] = None


class ErpBankTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    bank_account_id: int
    transaction_type: str
    amount: int
    transaction_date: date
    description: Optional[str] = None
    ref_table: Optional[str] = None
    ref_id: Optional[int] = None
    transfer_to_account_id: Optional[int] = None
    is_reconciled: bool
    reconciled_at: Optional[datetime] = None
    balance_before: Optional[int] = None
    balance_after: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════════════
# FIXED ASSETS
# ═══════════════════════════════════════════════════════════════════

class ErpFixedAssetCreate(BaseModel):
    asset_code: str
    name: str
    category: Optional[str] = None
    purchase_date: date
    purchase_price: int
    useful_life_years: int = 5
    residual_value: int = 0
    depreciation_method: str = "STRAIGHT_LINE"
    branch_id: Optional[int] = None
    notes: Optional[str] = None


class ErpFixedAssetUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    useful_life_years: Optional[int] = None
    residual_value: Optional[int] = None
    depreciation_method: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ErpAssetDepreciationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    asset_id: int
    period_code: str
    depreciation_amount: int
    accumulated_after: int
    book_value_after: int
    journal_entry_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None


class ErpFixedAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    asset_code: str
    name: str
    category: Optional[str] = None
    purchase_date: date
    purchase_price: int
    useful_life_years: int
    residual_value: int
    depreciation_method: str
    accumulated_depreciation: int
    book_value: Optional[int] = None
    status: str
    disposed_at: Optional[date] = None
    disposal_price: Optional[int] = None
    branch_id: Optional[int] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ErpFixedAssetDetailResponse(ErpFixedAssetResponse):
    """Asset response with depreciation history."""
    depreciations: list[ErpAssetDepreciationResponse] = []
