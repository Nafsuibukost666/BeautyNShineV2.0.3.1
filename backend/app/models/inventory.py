"""Inventory / WIP / BOM — SQLAlchemy models.

Swimlane 4 dari BPMN: Manajemen stok, Bill of Materials, Work In Progress,
Stock Opname, Kartu Stok, dan Stock Adjustment.
"""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Column, String, Integer, BigInteger, Float, Boolean,
    DateTime, Date, Text, ForeignKey, Enum as SAEnum,
)
from sqlalchemy.orm import relationship

from app.models.base import Base, TimestampMixin


class ErpStockMovement(Base, TimestampMixin):
    """Pergerakan stok barang — masuk (IN) atau keluar (OUT).

    Setiap kali barang bergerak (pembelian, pemakaian treatment,
    penjualan, opname, adjustment), dicatat di sini.
    """
    __tablename__ = "erp_stock_movement"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("public.erp_master_product.id"),
                        nullable=False, index=True)
    movement_type = Column(String(20), nullable=False, index=True,
                           comment="IN / OUT / ADJUSTMENT / OPNAME")
    quantity = Column(Integer, nullable=False,
                      comment="Jumlah: positif untuk IN, negatif untuk OUT")
    unit_cost = Column(BigInteger, default=0, nullable=False,
                       comment="Harga satuan saat movement")
    total_cost = Column(BigInteger, default=0, nullable=False,
                        comment="quantity * unit_cost")
    reference_type = Column(String(20), nullable=True,
                            comment="PURCHASE / TREATMENT / SALE / OPNAME / ADJUSTMENT")
    reference_id = Column(String(50), nullable=True,
                          comment="ID dokumen referensi (POS, TRM, STK)")
    notes = Column(Text, nullable=True)
    movement_date = Column(Date, nullable=False,
                           comment="Tanggal pergerakan")
    balance_before = Column(Integer, nullable=True,
                            comment="Stok sebelum movement")
    balance_after = Column(Integer, nullable=True,
                           comment="Stok setelah movement")
    performed_by = Column(String(100), nullable=True)

    # Relationship
    product = relationship("ErpMasterProduct", lazy="selectin")


class ErpStockCard(Base, TimestampMixin):
    """Kartu Stok — snapshot stok per produk per periode.

    Digunakan untuk tracking riwayat stok dan audit.
    """
    __tablename__ = "erp_stock_card"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("public.erp_master_product.id"),
                        nullable=False, index=True)
    period_code = Column(String(10), nullable=False, index=True,
                         comment="YYYY-MM")
    opening_qty = Column(Integer, default=0, nullable=False)
    in_qty = Column(Integer, default=0, nullable=False)
    out_qty = Column(Integer, default=0, nullable=False)
    adjustment_qty = Column(Integer, default=0, nullable=False)
    closing_qty = Column(Integer, default=0, nullable=False)
    avg_unit_cost = Column(BigInteger, default=0, nullable=False)

    product = relationship("ErpMasterProduct", lazy="selectin")


class ErpBillOfMaterial(Base, TimestampMixin):
    """Bill of Material — resep standar bahan untuk tiap treatment.

    Contoh: Treatment 'Classic Lash Extension' butuh:
      - 1 box Lem Lash
      - 2 strip Lash Extension
      - 1 set Aplikator
    """
    __tablename__ = "erp_bill_of_material"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False,
                  comment="Kode BOM, e.g. BOM-CLASSIC-001")
    name = Column(String(200), nullable=False, comment="Nama BOM")
    service_id = Column(Integer, ForeignKey("public.erp_master_product.id"),
                        nullable=True,
                        comment="Treatment/service yang menggunakan BOM ini")
    total_standard_cost = Column(BigInteger, default=0, nullable=False,
                                 comment="Total biaya standar dari semua komponen")
    is_active = Column(Boolean, default=True, nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    components = relationship("ErpBomComponent", back_populates="bom",
                              lazy="selectin", cascade="all, delete-orphan",
                              order_by="ErpBomComponent.line_no")
    service = relationship("ErpMasterProduct", lazy="selectin",
                           foreign_keys=[service_id])


class ErpBomComponent(Base, TimestampMixin):
    """Komponen dalam sebuah BOM.

    Satu BOM bisa punya banyak komponen (bahan baku).
    """
    __tablename__ = "erp_bom_component"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    bom_id = Column(Integer, ForeignKey("public.erp_bill_of_material.id"),
                    nullable=False, index=True)
    line_no = Column(Integer, nullable=False, default=1)
    product_id = Column(Integer, ForeignKey("public.erp_master_product.id"),
                        nullable=False, comment="Produk/bahan yang dibutuhkan")
    quantity = Column(Integer, nullable=False, default=1,
                      comment="Jumlah bahan yang dibutuhkan")
    unit_cost = Column(BigInteger, default=0, nullable=False,
                       comment="Biaya satuan saat BOM dibuat/diupdate")
    subtotal = Column(BigInteger, default=0, nullable=False,
                      comment="quantity * unit_cost")
    notes = Column(Text, nullable=True)

    # Relationships
    bom = relationship("ErpBillOfMaterial", back_populates="components")
    product = relationship("ErpMasterProduct", lazy="selectin",
                           foreign_keys=[product_id])


class ErpStockOpname(Base, TimestampMixin):
    """Stock Opname / Stock Take — sesi pencocokan stok fisik.

    Digunakan untuk mencocokkan stok di sistem dengan stok fisik.
    """
    __tablename__ = "erp_stock_opname"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False,
                  comment="Kode opname, e.g. OPN-20260518-001")
    opname_date = Column(Date, nullable=False)
    status = Column(String(20), default="DRAFT", nullable=False,
                    comment="DRAFT / COMPLETED / CANCELLED")
    total_items = Column(Integer, default=0, nullable=False)
    total_difference = Column(BigInteger, default=0, nullable=False,
                              comment="Total selisih rupiah")
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    completed_by = Column(String(100), nullable=True)

    # Relationships
    items = relationship("ErpStockOpnameItem", back_populates="opname",
                         lazy="selectin", cascade="all, delete-orphan")


class ErpStockOpnameItem(Base, TimestampMixin):
    """Item dalam sesi Stock Opname.

    Mencatat stok sistem vs stok fisik untuk tiap produk.
    """
    __tablename__ = "erp_stock_opname_item"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    opname_id = Column(Integer, ForeignKey("public.erp_stock_opname.id"),
                       nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("public.erp_master_product.id"),
                        nullable=False)
    system_qty = Column(Integer, nullable=False,
                        comment="Stok menurut sistem")
    physical_qty = Column(Integer, nullable=False,
                          comment="Stok fisik hasil hitungan")
    difference = Column(Integer, nullable=False,
                        comment="physical_qty - system_qty")
    unit_cost = Column(BigInteger, default=0, nullable=False,
                       comment="Harga satuan produk")
    difference_value = Column(BigInteger, default=0, nullable=False,
                              comment="difference * unit_cost")
    notes = Column(Text, nullable=True)

    # Relationships
    opname = relationship("ErpStockOpname", back_populates="items")
    product = relationship("ErpMasterProduct", lazy="selectin",
                           foreign_keys=[product_id])


class ErpWorkInProgress(Base, TimestampMixin):
    """Work In Progress — tracking produksi.

    Untuk produksi barang jadi dari bahan baku (batch).
    Misalnya: membuat serum bulu mata dalam batch.
    """
    __tablename__ = "erp_work_in_progress"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False,
                  comment="Kode WIP, e.g. WIP-BATCH-001")
    product_id = Column(Integer, ForeignKey("public.erp_master_product.id"),
                        nullable=False,
                        comment="Produk yang diproduksi (barang jadi)")
    batch_number = Column(String(50), nullable=True,
                          comment="Nomor batch produksi")
    planned_qty = Column(Integer, nullable=False, default=1,
                         comment="Jumlah yang direncanakan")
    actual_qty = Column(Integer, nullable=True,
                        comment="Jumlah aktual yang dihasilkan")
    status = Column(String(20), default="PLANNED", nullable=False,
                    comment="PLANNED / IN_PROGRESS / COMPLETED / CANCELLED")
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    total_material_cost = Column(BigInteger, default=0, nullable=False,
                                 comment="Biaya bahan baku")
    total_labor_cost = Column(BigInteger, default=0, nullable=False,
                              comment="Biaya tenaga kerja")
    total_overhead_cost = Column(BigInteger, default=0, nullable=False,
                                 comment="Biaya overhead")
    total_cost = Column(BigInteger, default=0, nullable=False,
                        comment="Total biaya produksi")
    notes = Column(Text, nullable=True)
    completed_by = Column(String(100), nullable=True)

    # Relationships
    product = relationship("ErpMasterProduct", lazy="selectin",
                           foreign_keys=[product_id])
    materials = relationship("ErpWipMaterial", back_populates="wip",
                             lazy="selectin", cascade="all, delete-orphan")


class ErpWipMaterial(Base, TimestampMixin):
    """Bahan baku yang digunakan dalam produksi WIP."""
    __tablename__ = "erp_wip_material"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    wip_id = Column(Integer, ForeignKey("public.erp_work_in_progress.id"),
                    nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("public.erp_master_product.id"),
                        nullable=False,
                        comment="Bahan baku yang digunakan")
    planned_qty = Column(Integer, nullable=False, default=1)
    actual_qty = Column(Integer, nullable=True,
                        comment="Pemakaian aktual")
    unit_cost = Column(BigInteger, default=0, nullable=False)
    subtotal = Column(BigInteger, default=0, nullable=False,
                      comment="actual_qty * unit_cost")

    # Relationships
    wip = relationship("ErpWorkInProgress", back_populates="materials")
    product = relationship("ErpMasterProduct", lazy="selectin",
                           foreign_keys=[product_id])
