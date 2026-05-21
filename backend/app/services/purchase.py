"""Purchase Order service."""
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.purchase import ErpPurchaseOrder, ErpPurchaseOrderItem
from app.models.master_data import ErpMasterSupplier, ErpMasterProduct
from app.models.inventory import ErpStockMovement


class PurchaseOrderService:
    """Business logic for Purchase Orders."""

    @staticmethod
    def _next_po_number(db: Session, order_date: date) -> str:
        prefix = f"PUR-001-{order_date.strftime('%Y%m%d')}"
        count = db.query(ErpPurchaseOrder).filter(ErpPurchaseOrder.po_number.like(f"{prefix}-%")).count() + 1
        return f"{prefix}-{count:04d}"

    @staticmethod
    def _validate_supplier(db: Session, supplier_id: int):
        supplier = db.query(ErpMasterSupplier).filter(ErpMasterSupplier.id == supplier_id, ErpMasterSupplier.is_active == True).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return supplier

    @staticmethod
    def _validate_product(db: Session, product_id: int):
        product = db.query(ErpMasterProduct).filter(ErpMasterProduct.id == product_id, ErpMasterProduct.is_active == True).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
        return product

    @staticmethod
    def _recalculate(po: ErpPurchaseOrder):
        total = 0
        for idx, item in enumerate(po.items, start=1):
            item.line_no = idx
            item.subtotal = int(item.quantity or 0) * int(item.unit_cost or 0)
            total += item.subtotal
        po.total_amount = total

    @staticmethod
    def list_purchase_orders(db: Session, status: Optional[str] = None, supplier_id: Optional[int] = None, search: Optional[str] = None):
        q = db.query(ErpPurchaseOrder)
        if status:
            q = q.filter(ErpPurchaseOrder.status == status.upper())
        if supplier_id:
            q = q.filter(ErpPurchaseOrder.supplier_id == supplier_id)
        if search:
            q = q.filter(ErpPurchaseOrder.po_number.ilike(f"%{search}%"))
        return q.order_by(ErpPurchaseOrder.order_date.desc(), ErpPurchaseOrder.id.desc()).all()

    @staticmethod
    def get_purchase_order(db: Session, id: int):
        po = db.query(ErpPurchaseOrder).filter(ErpPurchaseOrder.id == id).first()
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")
        return po

    @staticmethod
    def create_purchase_order(db: Session, data, created_by: str = "system"):
        if not data.items:
            raise HTTPException(status_code=400, detail="Purchase order must have at least one item")
        PurchaseOrderService._validate_supplier(db, data.supplier_id)
        po = ErpPurchaseOrder(
            po_number=PurchaseOrderService._next_po_number(db, data.order_date),
            supplier_id=data.supplier_id,
            order_date=data.order_date,
            expected_date=data.expected_date,
            notes=data.notes,
            created_by=created_by,
            updated_by=created_by,
            status="DRAFT",
        )
        for idx, line in enumerate(data.items, start=1):
            PurchaseOrderService._validate_product(db, line.product_id)
            po.items.append(ErpPurchaseOrderItem(
                line_no=idx,
                product_id=line.product_id,
                quantity=line.quantity,
                unit_cost=line.unit_cost,
                subtotal=line.quantity * line.unit_cost,
                notes=line.notes,
            ))
        PurchaseOrderService._recalculate(po)
        db.add(po)
        db.commit()
        db.refresh(po)
        return po

    @staticmethod
    def update_purchase_order(db: Session, id: int, data, updated_by: str = "system"):
        po = PurchaseOrderService.get_purchase_order(db, id)
        if po.status not in ("DRAFT", "ORDERED"):
            raise HTTPException(status_code=400, detail="Only DRAFT/ORDERED purchase orders can be updated")
        update_data = data.model_dump(exclude_unset=True)
        if "supplier_id" in update_data:
            PurchaseOrderService._validate_supplier(db, update_data["supplier_id"])
            po.supplier_id = update_data["supplier_id"]
        for field in ("order_date", "expected_date", "notes"):
            if field in update_data:
                setattr(po, field, update_data[field])
        if data.items is not None:
            po.items.clear()
            db.flush()
            for idx, line in enumerate(data.items, start=1):
                PurchaseOrderService._validate_product(db, line.product_id)
                po.items.append(ErpPurchaseOrderItem(
                    line_no=idx,
                    product_id=line.product_id,
                    quantity=line.quantity,
                    unit_cost=line.unit_cost,
                    subtotal=line.quantity * line.unit_cost,
                    notes=line.notes,
                ))
        po.updated_by = updated_by
        PurchaseOrderService._recalculate(po)
        db.commit()
        db.refresh(po)
        return po

    @staticmethod
    def mark_ordered(db: Session, id: int, user: str = "system"):
        po = PurchaseOrderService.get_purchase_order(db, id)
        if po.status != "DRAFT":
            raise HTTPException(status_code=400, detail="Only DRAFT purchase orders can be marked ORDERED")
        po.status = "ORDERED"
        po.ordered_at = datetime.now(timezone.utc)
        po.updated_by = user
        db.commit()
        db.refresh(po)
        return po

    @staticmethod
    def cancel(db: Session, id: int, user: str = "system"):
        po = PurchaseOrderService.get_purchase_order(db, id)
        if po.status == "RECEIVED":
            raise HTTPException(status_code=400, detail="Received purchase order cannot be cancelled")
        po.status = "CANCELLED"
        po.cancelled_at = datetime.now(timezone.utc)
        po.updated_by = user
        db.commit()
        db.refresh(po)
        return po

    @staticmethod
    def _current_stock(db: Session, product_id: int) -> int:
        qty = db.query(func.coalesce(func.sum(ErpStockMovement.quantity), 0)).filter(ErpStockMovement.product_id == product_id).scalar()
        return int(qty or 0)

    @staticmethod
    def receive(db: Session, id: int, data, user: str = "system"):
        po = PurchaseOrderService.get_purchase_order(db, id)
        if po.status not in ("ORDERED", "PARTIAL_RECEIVED"):
            raise HTTPException(status_code=400, detail="Only ORDERED/PARTIAL_RECEIVED purchase orders can receive goods")
        item_by_id = {item.id: item for item in po.items}
        for rec in data.items:
            item = item_by_id.get(rec.item_id)
            if not item:
                raise HTTPException(status_code=404, detail=f"PO item {rec.item_id} not found")
            remaining = item.quantity - item.received_quantity
            if rec.quantity > remaining:
                raise HTTPException(status_code=400, detail=f"Receive quantity exceeds remaining for item {rec.item_id}")
            before = PurchaseOrderService._current_stock(db, item.product_id)
            after = before + rec.quantity
            move = ErpStockMovement(
                product_id=item.product_id,
                movement_type="IN",
                quantity=rec.quantity,
                unit_cost=item.unit_cost,
                total_cost=rec.quantity * item.unit_cost,
                reference_type="PURCHASE",
                reference_id=str(po.id),
                notes=data.notes or f"Receive {po.po_number}",
                movement_date=data.receive_date,
                balance_before=before,
                balance_after=after,
                performed_by=user,
            )
            db.add(move)
            item.received_quantity += rec.quantity
        all_received = all(item.received_quantity >= item.quantity for item in po.items)
        po.status = "RECEIVED" if all_received else "PARTIAL_RECEIVED"
        if all_received:
            po.received_at = datetime.now(timezone.utc)
        po.updated_by = user
        db.commit()
        db.refresh(po)
        return po
