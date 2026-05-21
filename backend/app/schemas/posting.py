"""Posting Engine + Auto Journal — Pydantic schemas.

Request schemas for creating transactions,
Response schemas for returning data.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ═══════════════════════════════════════════════════════════════════
# POSTING ENGINE SCHEMAS
# ═══════════════════════════════════════════════════════════════════

# ─── Line Item ────────────────────────────────────────────────────

class ErpPostingLineCreate(BaseModel):
    line_no: int = 1
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    quantity: int = 1
    unit_price: int = 0
    subtotal: int = 0
    discount_amount: int = 0
    tax_amount: int = 0
    tax_id: Optional[int] = None
    notes: Optional[str] = None


class ErpPostingLineResponse(ErpPostingLineCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    transaction_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Transaction ──────────────────────────────────────────────────

class ErpPostingTransactionCreate(BaseModel):
    transaction_type: str  # SALE / EXPENSE / PAYMENT / PURCHASE / ADJUSTMENT
    ref_table: Optional[str] = None
    ref_id: Optional[str] = None
    total_amount: int = 0
    notes: Optional[str] = None
    transaction_date: date
    period_id: Optional[int] = None
    lines: list[ErpPostingLineCreate] = []


class ErpPostingTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    doc_number: str
    transaction_type: str
    ref_table: Optional[str] = None
    ref_id: Optional[str] = None
    total_amount: int
    status: str
    period_id: Optional[int] = None
    posted_at: Optional[datetime] = None
    posted_by: Optional[str] = None
    notes: Optional[str] = None
    transaction_date: date
    lines: list[ErpPostingLineResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════════════
# AUTO JOURNAL SCHEMAS
# ═══════════════════════════════════════════════════════════════════

# ─── Posting Rule ─────────────────────────────────────────────────

class ErpPostingRuleCreate(BaseModel):
    transaction_type: str
    account_id: int
    debit_or_credit: str  # DEBIT or CREDIT
    priority: int = 0
    condition_field: Optional[str] = None
    condition_value: Optional[str] = None
    is_active: bool = True


class ErpPostingRuleUpdate(BaseModel):
    transaction_type: Optional[str] = None
    account_id: Optional[int] = None
    debit_or_credit: Optional[str] = None
    priority: Optional[int] = None
    condition_field: Optional[str] = None
    condition_value: Optional[str] = None
    is_active: Optional[bool] = None


class ErpPostingRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    transaction_type: str
    account_id: int
    debit_or_credit: str
    priority: int
    condition_field: Optional[str] = None
    condition_value: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Journal Line ─────────────────────────────────────────────────

class ErpJournalLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    journal_entry_id: int
    line_no: int
    account_id: int
    account_code: Optional[str] = None
    account_name: Optional[str] = None
    debit_amount: int = 0
    credit_amount: int = 0
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Journal Entry ────────────────────────────────────────────────

class ErpJournalEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    je_number: str
    transaction_id: int
    transaction_type: str
    period_id: Optional[int] = None
    description: Optional[str] = None
    status: str
    posted_at: Optional[datetime] = None
    posted_by: Optional[str] = None
    entry_date: date
    total_debit: int
    total_credit: int
    lines: list[ErpJournalLineResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ErpJournalEntryListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    je_number: str
    transaction_type: str
    status: str
    entry_date: date
    total_debit: int
    total_credit: int
    description: Optional[str] = None
    created_at: Optional[datetime] = None
