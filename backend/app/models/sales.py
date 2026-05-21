"""Sales Order models."""
from sqlalchemy import Column, String, Integer, BigInteger, Date, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class ErpSalesOrder(Base, TimestampMixin):
    """Sales order header."""
    __tablename__ = "erp_sales_order"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    sales_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("public.erp_master_customer.id"), nullable=True, index=True)
    sales_date = Column(Date, nullable=False)
    status = Column(String(30), default="DRAFT", nullable=False, index=True)
    payment_method = Column(String(50), nullable=True)
    subtotal_amount = Column(BigInteger, default=0, nullable=False)
    discount_amount = Column(BigInteger, default=0, nullable=False)
    tax_amount = Column(BigInteger, default=0, nullable=False)
    total_amount = Column(BigInteger, default=0, nullable=False)
    notes = Column(Text, nullable=True)
    posted_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    created_by = Column(String(100), nullable=True)
    updated_by = Column(String(100), nullable=True)

    customer = relationship("ErpMasterCustomer", lazy="selectin")
    items = relationship(
        "ErpSalesOrderItem",
        back_populates="sales_order",
        lazy="selectin",
        cascade="all, delete-orphan",
        order_by="ErpSalesOrderItem.line_no",
    )


class ErpSalesOrderItem(Base, TimestampMixin):
    """Sales order line item."""
    __tablename__ = "erp_sales_order_item"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    sales_order_id = Column(Integer, ForeignKey("public.erp_sales_order.id"), nullable=False, index=True)
    line_no = Column(Integer, default=1, nullable=False)
    product_id = Column(Integer, ForeignKey("public.erp_master_product.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(BigInteger, default=0, nullable=False)
    discount_amount = Column(BigInteger, default=0, nullable=False)
    subtotal = Column(BigInteger, default=0, nullable=False)
    notes = Column(Text, nullable=True)

    sales_order = relationship("ErpSalesOrder", back_populates="items")
    product = relationship("ErpMasterProduct", lazy="selectin")
