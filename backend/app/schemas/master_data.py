"""Master Data — Pydantic schemas for request/response validation.

Setiap model memiliki {Name}Create untuk input dan {Name}Response untuk output.
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


# ─── Product ──────────────────────────────────────────────────────────

class ErpMasterProductCreate(BaseModel):
    name: str
    category: Optional[str] = None
    sub_category: Optional[str] = None
    unit: Optional[str] = None
    sku: Optional[str] = None
    cost_price: int = 0
    selling_price: int = 0
    min_stock: int = 5
    is_active: bool = True


class ErpMasterProductResponse(ErpMasterProductCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Category ─────────────────────────────────────────────────────────

class ErpMasterCategoryCreate(BaseModel):
    name: str
    type: str  # PRODUCT / POS / ACCOUNTING
    parent_id: Optional[int] = None
    sort_order: int = 0
    is_active: bool = True


class ErpMasterCategoryResponse(ErpMasterCategoryCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Account (COA) ────────────────────────────────────────────────────

class ErpMasterAccountCreate(BaseModel):
    code: str
    name: str
    type: str  # ASSET / LIABILITY / EQUITY / REVENUE / EXPENSE
    parent_id: Optional[int] = None
    level: int = 3
    description: Optional[str] = None
    is_active: bool = True


class ErpMasterAccountUpdate(BaseModel):
    """Partial update untuk akun — semua field optional.
    Level 1 & 2 (system accounts) cannot be edited via API.
    """
    name: Optional[str] = None
    type: Optional[str] = None
    parent_id: Optional[int] = None
    level: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ErpMasterAccountResponse(ErpMasterAccountCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ErpMasterAccountTreeNode(ErpMasterAccountResponse):
    """Akun dengan children untuk tree view."""
    children: list["ErpMasterAccountTreeNode"] = []


# ─── Account Mapping ──────────────────────────────────────────────

class ErpAccountMappingCreate(BaseModel):
    transaction_type: str
    account_id: int
    debit_or_credit: str = "DEBIT"
    priority: int = 10
    is_active: bool = True


class ErpAccountMappingUpdate(BaseModel):
    transaction_type: Optional[str] = None
    account_id: Optional[int] = None
    debit_or_credit: Optional[str] = None
    priority: Optional[int] = None
    is_active: Optional[bool] = None


class ErpAccountMappingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_type: str
    account_id: int
    debit_or_credit: str
    priority: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Tax ──────────────────────────────────────────────────────────────

class ErpMasterTaxCreate(BaseModel):
    name: str
    rate: float = 0.0
    is_active: bool = True


class ErpMasterTaxResponse(ErpMasterTaxCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Company ──────────────────────────────────────────────────────────

class ErpMasterCompanyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tax_id: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None


class ErpMasterCompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tax_id: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Branch ───────────────────────────────────────────────────────────

class ErpMasterBranchCreate(BaseModel):
    code: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True


class ErpMasterBranchResponse(ErpMasterBranchCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Staff ────────────────────────────────────────────────────────────

class ErpMasterStaffCreate(BaseModel):
    staff_id: Optional[str] = None
    name: str
    role: Optional[str] = None
    commission_type: Optional[str] = None  # PERCENTAGE / FIXED
    commission_value: float = 0.0
    kabin: Optional[str] = None
    is_active: bool = True


class ErpMasterStaffResponse(ErpMasterStaffCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Bed ──────────────────────────────────────────────────────────────

class ErpMasterBedCreate(BaseModel):
    code: str
    name: str
    section: Optional[str] = None
    is_active: bool = True


class ErpMasterBedResponse(ErpMasterBedCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Service ──────────────────────────────────────────────────────────

class ErpMasterServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    duration: Optional[int] = None
    price: int = 0
    is_active: bool = True


class ErpMasterServiceResponse(ErpMasterServiceCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Customer ─────────────────────────────────────────────────────────

class ErpMasterCustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    total_visits: int = 0
    is_active: bool = True


class ErpMasterCustomerResponse(ErpMasterCustomerCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Supplier ─────────────────────────────────────────────────────────

class ErpMasterSupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True


class ErpMasterSupplierResponse(ErpMasterSupplierCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Voucher ──────────────────────────────────────────────────────────
#

class ErpMasterVoucherCreate(BaseModel):
    code: str
    discount_type: str  # PERCENTAGE / FIXED
    discount_value: float
    min_purchase: int = 0
    max_use: int = 0  # 0 = unlimited
    used_count: int = 0
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    is_active: bool = True


class ErpMasterVoucherResponse(ErpMasterVoucherCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ─── Financial Period ─────────────────────────────────────────────────

class ErpFinancialPeriodCreate(BaseModel):
    code: str  # e.g. "2026-05"
    name: Optional[str] = None  # e.g. "Mei 2026"
    start_date: date
    end_date: date
    is_locked: bool = False


class ErpFinancialPeriodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: Optional[str] = None
    start_date: date
    end_date: date
    is_locked: bool
    locked_at: Optional[datetime] = None
    locked_by: Optional[str] = None
    is_closed: Optional[bool] = False
    closed_at: Optional[datetime] = None
    closed_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════════════
# PERIOD CLOSING
# ═══════════════════════════════════════════════════════════════════

class PeriodCloseRequest(BaseModel):
    """Request untuk menutup / lock / unlock periode."""
    notes: Optional[str] = None


class PeriodCloseLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    period_id: int
    action: str
    total_revenue: int = 0
    total_expenses: int = 0
    net_income: int = 0
    je_number: Optional[str] = None
    notes: Optional[str] = None
    performed_by: Optional[str] = None
    created_at: Optional[datetime] = None


class PeriodStatusResponse(BaseModel):
    """Status periode: bisa di-close atau tidak."""

    period_id: int
    code: str
    name: Optional[str] = None
    is_locked: bool
    is_closed: bool
    draft_count: int = 0
    posted_count: int = 0
    total_revenue: int = 0
    total_expenses: int = 0
    net_income: int = 0
    can_close: bool = False
    reason: Optional[str] = None
