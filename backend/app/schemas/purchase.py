"""Purchase Order schemas."""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PurchaseOrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1)
    unit_cost: int = Field(0, ge=0)
    notes: Optional[str] = None


class PurchaseOrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    line_no: int
    product_id: int
    quantity: int
    received_quantity: int
    unit_cost: int
    subtotal: int
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    order_date: date
    expected_date: Optional[date] = None
    notes: Optional[str] = None
    items: list[PurchaseOrderItemCreate]


class PurchaseOrderUpdate(BaseModel):
    supplier_id: Optional[int] = None
    order_date: Optional[date] = None
    expected_date: Optional[date] = None
    notes: Optional[str] = None
    items: Optional[list[PurchaseOrderItemCreate]] = None


class PurchaseOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    po_number: str
    supplier_id: int
    order_date: date
    expected_date: Optional[date] = None
    status: str
    total_amount: int
    notes: Optional[str] = None
    ordered_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: list[PurchaseOrderItemResponse] = []


class PurchaseReceiveItem(BaseModel):
    item_id: int
    quantity: int = Field(..., ge=1)


class PurchaseReceiveRequest(BaseModel):
    receive_date: date
    notes: Optional[str] = None
    items: list[PurchaseReceiveItem]
