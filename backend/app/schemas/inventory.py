"""Inventory — Pydantic schemas untuk Stock Movement, Stock Card, BOM,
Stock Opname, dan Work In Progress.

Setiap model memiliki {Name}Create untuk input dan {Name}Response untuk output.
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


# ═══════════════════════════════════════════════════════════════════
# STOCK MOVEMENT
# ═══════════════════════════════════════════════════════════════════

class ErpStockMovementCreate(BaseModel):
    """Input untuk membuat pergerakan stok baru."""
    product_id: int
    movement_type: str = Field(..., description="IN / OUT / ADJUSTMENT / OPNAME")
    quantity: int = Field(..., description="Positif untuk IN, negatif untuk OUT")
    unit_cost: int = 0
    total_cost: int = 0
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    movement_date: date
    performed_by: Optional[str] = None


class ErpStockMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    movement_type: str
    quantity: int
    unit_cost: int
    total_cost: int
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    movement_date: date
    balance_before: Optional[int] = None
    balance_after: Optional[int] = None
    performed_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ErpStockMovementPaginated(BaseModel):
    """Response daftar movement dengan pagination."""
    items: list[ErpStockMovementResponse]
    total: int
    page: int
    per_page: int


# ═══════════════════════════════════════════════════════════════════
# STOCK CARD
# ═══════════════════════════════════════════════════════════════════

class ErpStockCardGenerate(BaseModel):
    """Request untuk generate stock card."""
    period_code: Optional[str] = Field(None, description="YYYY-MM, default: periode berjalan")
    product_id: Optional[int] = Field(None, description="Jika diisi, hanya untuk 1 produk")


class ErpStockCardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    period_code: str
    opening_qty: int
    in_qty: int
    out_qty: int
    adjustment_qty: int
    closing_qty: int
    avg_unit_cost: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════════════
# BOM — BILL OF MATERIAL
# ═══════════════════════════════════════════════════════════════════

class ErpBomComponentCreate(BaseModel):
    """Input untuk satu komponen BOM."""
    line_no: int = 1
    product_id: int
    quantity: int = 1
    unit_cost: int = 0
    subtotal: int = 0
    notes: Optional[str] = None


class ErpBomComponentUpdate(BaseModel):
    """Input update komponen BOM."""
    line_no: Optional[int] = None
    product_id: Optional[int] = None
    quantity: Optional[int] = None
    unit_cost: Optional[int] = None
    subtotal: Optional[int] = None
    notes: Optional[str] = None


class ErpBomComponentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    bom_id: int
    line_no: int
    product_id: int
    quantity: int
    unit_cost: int
    subtotal: int
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ErpBillOfMaterialCreate(BaseModel):
    """Input untuk membuat BOM baru beserta komponennya."""
    code: str
    name: str
    service_id: Optional[int] = None
    total_standard_cost: int = 0
    is_active: bool = True
    notes: Optional[str] = None
    components: list[ErpBomComponentCreate] = []


class ErpBillOfMaterialUpdate(BaseModel):
    """Input untuk update BOM beserta komponennya."""
    code: Optional[str] = None
    name: Optional[str] = None
    service_id: Optional[int] = None
    total_standard_cost: Optional[int] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    components: Optional[list[ErpBomComponentCreate]] = None


class ErpBillOfMaterialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    service_id: Optional[int] = None
    total_standard_cost: int
    is_active: bool
    notes: Optional[str] = None
    components: list[ErpBomComponentResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════════════
# STOCK OPNAME
# ═══════════════════════════════════════════════════════════════════

class ErpStockOpnameCreate(BaseModel):
    """Input untuk membuat sesi stock opname baru."""
    code: str
    opname_date: date
    notes: Optional[str] = None


class ErpStockOpnameItemCreate(BaseModel):
    """Input untuk menambahkan item ke sesi opname."""
    product_id: int
    system_qty: int = 0
    physical_qty: int = 0
    difference: int = 0
    unit_cost: int = 0
    difference_value: int = 0
    notes: Optional[str] = None


class ErpStockOpnameItemUpdate(BaseModel):
    """Input untuk update item opname (biasanya qty fisik)."""
    physical_qty: int
    notes: Optional[str] = None


class ErpStockOpnameItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    opname_id: int
    product_id: int
    system_qty: int
    physical_qty: int
    difference: int
    unit_cost: int
    difference_value: int
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ErpStockOpnameResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    opname_date: date
    status: str
    total_items: int
    total_difference: int
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    completed_by: Optional[str] = None
    items: list[ErpStockOpnameItemResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ErpStockOpnamePaginated(BaseModel):
    """Response daftar opname dengan pagination."""
    items: list[ErpStockOpnameResponse]
    total: int
    page: int
    per_page: int


# ═══════════════════════════════════════════════════════════════════
# WIP — WORK IN PROGRESS
# ═══════════════════════════════════════════════════════════════════

class ErpWipMaterialCreate(BaseModel):
    """Input untuk satu material WIP."""
    product_id: int
    planned_qty: int = 1
    actual_qty: Optional[int] = None
    unit_cost: int = 0
    subtotal: int = 0


class ErpWipMaterialUpdate(BaseModel):
    """Input update material WIP."""
    product_id: Optional[int] = None
    planned_qty: Optional[int] = None
    actual_qty: Optional[int] = None
    unit_cost: Optional[int] = None
    subtotal: Optional[int] = None


class ErpWipMaterialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    wip_id: int
    product_id: int
    planned_qty: int
    actual_qty: Optional[int] = None
    unit_cost: int
    subtotal: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ErpWorkInProgressCreate(BaseModel):
    """Input untuk membuat WIP baru (status PLANNED)."""
    code: str
    product_id: int
    batch_number: Optional[str] = None
    planned_qty: int = 1
    total_material_cost: int = 0
    total_labor_cost: int = 0
    total_overhead_cost: int = 0
    total_cost: int = 0
    notes: Optional[str] = None
    materials: list[ErpWipMaterialCreate] = []


class ErpWorkInProgressUpdate(BaseModel):
    """Input untuk update WIP."""
    code: Optional[str] = None
    product_id: Optional[int] = None
    batch_number: Optional[str] = None
    planned_qty: Optional[int] = None
    actual_qty: Optional[int] = None
    total_material_cost: Optional[int] = None
    total_labor_cost: Optional[int] = None
    total_overhead_cost: Optional[int] = None
    total_cost: Optional[int] = None
    notes: Optional[str] = None
    materials: Optional[list[ErpWipMaterialCreate]] = None


class ErpWorkInProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    product_id: int
    batch_number: Optional[str] = None
    planned_qty: int
    actual_qty: Optional[int] = None
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_material_cost: int
    total_labor_cost: int
    total_overhead_cost: int
    total_cost: int
    notes: Optional[str] = None
    completed_by: Optional[str] = None
    materials: list[ErpWipMaterialResponse] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ErpWorkInProgressPaginated(BaseModel):
    """Response daftar WIP dengan pagination."""
    items: list[ErpWorkInProgressResponse]
    total: int
    page: int
    per_page: int
