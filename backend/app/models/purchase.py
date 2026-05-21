"""Purchase Order models."""
from sqlalchemy import Column, String, Integer, BigInteger, Date, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class ErpPurchaseOrder(Base, TimestampMixin):
    """Purchase order header."""
    __tablename__ = "erp_purchase_order"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    po_number = Column(String(50), unique=True, nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("public.erp_master_supplier.id"), nullable=False, index=True)
    order_date = Column(Date, nullable=False)
    expected_date = Column(Date, nullable=True)
    status = Column(String(30), default="DRAFT", nullable=False, index=True)
    total_amount = Column(BigInteger, default=0, nullable=False)
    notes = Column(Text, nullable=True)
    ordered_at = Column(DateTime, nullable=True)
    received_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)

    supplier = relationship("ErpMasterSupplier", lazy="selectin")
    items = relationship(
        "ErpPurchaseOrderItem",
        back_populates="purchase_order",
        lazy="selectin",
        cascade="all, delete-orphan",
        order_by="ErpPurchaseOrderItem.line_no",
    )


class ErpPurchaseOrderItem(Base, TimestampMixin):
    """Purchase order line item."""
    __tablename__ = "erp_purchase_order_item"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    purchase_order_id = Column(Integer, ForeignKey("public.erp_purchase_order.id"), nullable=False, index=True)
    line_no = Column(Integer, default=1, nullable=False)
    product_id = Column(Integer, ForeignKey("public.erp_master_product.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    received_quantity = Column(Integer, default=0, nullable=False)
    unit_cost = Column(BigInteger, default=0, nullable=False)
    subtotal = Column(BigInteger, default=0, nullable=False)
    notes = Column(Text, nullable=True)

    purchase_order = relationship("ErpPurchaseOrder", back_populates="items")
    product = relationship("ErpMasterProduct", lazy="selectin")
