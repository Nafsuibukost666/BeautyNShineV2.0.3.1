"""Sales Order schemas."""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class SalesOrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1)
    unit_price: int = Field(0, ge=0)
    discount_amount: int = Field(0, ge=0)
    notes: Optional[str] = None


class SalesOrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    line_no: int
    product_id: int
    quantity: int
    unit_price: int
    discount_amount: int
    subtotal: int
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class SalesOrderCreate(BaseModel):
    customer_id: Optional[int] = None
    sales_date: date
    payment_method: Optional[str] = None
    discount_amount: int = Field(0, ge=0)
    tax_amount: int = Field(0, ge=0)
    notes: Optional[str] = None
    items: list[SalesOrderItemCreate]


class SalesOrderUpdate(BaseModel):
    customer_id: Optional[int] = None
    sales_date: Optional[date] = None
    payment_method: Optional[str] = None
    discount_amount: Optional[int] = Field(None, ge=0)
    tax_amount: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None
    items: Optional[list[SalesOrderItemCreate]] = None


class SalesOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sales_number: str
    customer_id: Optional[int] = None
    sales_date: date
    status: str
    payment_method: Optional[str] = None
    subtotal_amount: int
    discount_amount: int
    tax_amount: int
    total_amount: int
    notes: Optional[str] = None
    posted_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: list[SalesOrderItemResponse] = []
