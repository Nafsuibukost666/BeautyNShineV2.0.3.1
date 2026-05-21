"""Sales Order service."""
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.sales import ErpSalesOrder, ErpSalesOrderItem
from app.models.master_data import ErpMasterCustomer, ErpMasterProduct
from app.models.inventory import ErpStockMovement


class SalesOrderService:
    """Business logic for ERP sales orders."""

    @staticmethod
    def _next_sales_number(db: Session, sales_date: date) -> str:
        prefix = f"SAL-001-{sales_date.strftime('%Y%m%d')}"
        count = db.query(ErpSalesOrder).filter(ErpSalesOrder.sales_number.like(f"{prefix}-%")).count() + 1
        return f"{prefix}-{count:04d}"

    @staticmethod
    def _validate_customer(db: Session, customer_id: Optional[int]):
        if not customer_id:
            return None
        customer = db.query(ErpMasterCustomer).filter(ErpMasterCustomer.id == customer_id, ErpMasterCustomer.is_active == True).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        return customer

    @staticmethod
    def _validate_product(db: Session, product_id: int):
        product = db.query(ErpMasterProduct).filter(ErpMasterProduct.id == product_id, ErpMasterProduct.is_active == True).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
        return product

    @staticmethod
    def _current_stock(db: Session, product_id: int) -> int:
        qty = db.query(func.coalesce(func.sum(ErpStockMovement.quantity), 0)).filter(ErpStockMovement.product_id == product_id).scalar()
        return int(qty or 0)

    @staticmethod
    def _recalculate(so: ErpSalesOrder):
        subtotal = 0
        for idx, item in enumerate(so.items, start=1):
            item.line_no = idx
            item.subtotal = max(0, int(item.quantity or 0) * int(item.unit_price or 0) - int(item.discount_amount or 0))
            subtotal += item.subtotal
        so.subtotal_amount = subtotal
        so.total_amount = max(0, subtotal - int(so.discount_amount or 0) + int(so.tax_amount or 0))

    @staticmethod
    def list_sales_orders(db: Session, status: Optional[str] = None, customer_id: Optional[int] = None, search: Optional[str] = None):
        q = db.query(ErpSalesOrder)
        if status:
            q = q.filter(ErpSalesOrder.status == status.upper())
        if customer_id:
            q = q.filter(ErpSalesOrder.customer_id == customer_id)
        if search:
            q = q.filter(ErpSalesOrder.sales_number.ilike(f"%{search}%"))
        return q.order_by(ErpSalesOrder.sales_date.desc(), ErpSalesOrder.id.desc()).all()

    @staticmethod
    def get_sales_order(db: Session, id: int):
        so = db.query(ErpSalesOrder).filter(ErpSalesOrder.id == id).first()
        if not so:
            raise HTTPException(status_code=404, detail="Sales order not found")
        return so

    @staticmethod
    def _append_items(db: Session, so: ErpSalesOrder, items):
        for idx, line in enumerate(items, start=1):
            product = SalesOrderService._validate_product(db, line.product_id)
            unit_price = line.unit_price or int(product.selling_price or 0)
            so.items.append(ErpSalesOrderItem(
                line_no=idx,
                product_id=line.product_id,
                quantity=line.quantity,
                unit_price=unit_price,
                discount_amount=line.discount_amount,
                subtotal=max(0, line.quantity * unit_price - line.discount_amount),
                notes=line.notes,
            ))

    @staticmethod
    def create_sales_order(db: Session, data, created_by: str = "system"):
        if not data.items:
            raise HTTPException(status_code=400, detail="Sales order must have at least one item")
        SalesOrderService._validate_customer(db, data.customer_id)
        so = ErpSalesOrder(
            sales_number=SalesOrderService._next_sales_number(db, data.sales_date),
            customer_id=data.customer_id,
            sales_date=data.sales_date,
            payment_method=data.payment_method,
            discount_amount=data.discount_amount,
            tax_amount=data.tax_amount,
            notes=data.notes,
            created_by=created_by,
            updated_by=created_by,
            status="DRAFT",
        )
        SalesOrderService._append_items(db, so, data.items)
        SalesOrderService._recalculate(so)
        db.add(so)
        db.commit()
        db.refresh(so)
        return so

    @staticmethod
    def update_sales_order(db: Session, id: int, data, updated_by: str = "system"):
        so = SalesOrderService.get_sales_order(db, id)
        if so.status != "DRAFT":
            raise HTTPException(status_code=400, detail="Only DRAFT sales orders can be updated")
        update_data = data.model_dump(exclude_unset=True)
        if "customer_id" in update_data:
            SalesOrderService._validate_customer(db, update_data["customer_id"])
            so.customer_id = update_data["customer_id"]
        for field in ("sales_date", "payment_method", "discount_amount", "tax_amount", "notes"):
            if field in update_data:
                setattr(so, field, update_data[field])
        if data.items is not None:
            so.items.clear()
            db.flush()
            SalesOrderService._append_items(db, so, data.items)
        so.updated_by = updated_by
        SalesOrderService._recalculate(so)
        db.commit()
        db.refresh(so)
        return so

    @staticmethod
    def post_sales_order(db: Session, id: int, user: str = "system"):
        so = SalesOrderService.get_sales_order(db, id)
        if so.status != "DRAFT":
            raise HTTPException(status_code=400, detail="Only DRAFT sales orders can be posted")
        for item in so.items:
            before = SalesOrderService._current_stock(db, item.product_id)
            if before < item.quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for product {item.product_id}")
        for item in so.items:
            before = SalesOrderService._current_stock(db, item.product_id)
            after = before - item.quantity
            db.add(ErpStockMovement(
                product_id=item.product_id,
                movement_type="OUT",
                quantity=-item.quantity,
                unit_cost=0,
                total_cost=0,
                reference_type="SALE",
                reference_id=str(so.id),
                notes=f"Sales {so.sales_number}",
                movement_date=so.sales_date,
                balance_before=before,
                balance_after=after,
                performed_by=user,
            ))
        so.status = "POSTED"
        so.posted_at = datetime.now(timezone.utc)
        so.updated_by = user
        db.commit()
        db.refresh(so)
        return so

    @staticmethod
    def cancel(db: Session, id: int, user: str = "system"):
        so = SalesOrderService.get_sales_order(db, id)
        if so.status != "DRAFT":
            raise HTTPException(status_code=400, detail="Only DRAFT sales orders can be cancelled")
        so.status = "CANCELLED"
        so.cancelled_at = datetime.now(timezone.utc)
        so.updated_by = user
        db.commit()
        db.refresh(so)
        return so
