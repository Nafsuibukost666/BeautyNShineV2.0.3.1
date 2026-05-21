"""Inventory Service — Business logic untuk Stock Movement, Stock Card,
BOM, Stock Opname, dan Work In Progress.

Semua method return **ORM object** atau dict untuk paginated results.
Serialization ke dict dilakukan di layer API.
"""
from datetime import date, datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.inventory import (
    ErpStockMovement,
    ErpStockCard,
    ErpBillOfMaterial,
    ErpBomComponent,
    ErpStockOpname,
    ErpStockOpnameItem,
    ErpWorkInProgress,
    ErpWipMaterial,
)
from app.models.master_data import ErpMasterProduct


class InventoryService:
    """Service layer untuk semua operasi inventory."""

    # ═══════════════════════════════════════════════════════
    # STOCK MOVEMENTS
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_movements(
        db: Session,
        product_id: Optional[int] = None,
        movement_type: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ):
        """Daftar pergerakan stok dengan filter & pagination."""
        q = db.query(ErpStockMovement)
        if product_id:
            q = q.filter(ErpStockMovement.product_id == product_id)
        if movement_type:
            q = q.filter(ErpStockMovement.movement_type == movement_type.upper())
        total = q.count()
        items = q.order_by(ErpStockMovement.movement_date.desc(),
                           ErpStockMovement.id.desc()) \
                 .offset((page - 1) * per_page).limit(per_page).all()
        return {"items": items, "total": total, "page": page, "per_page": per_page}

    @staticmethod
    def get_movement(db: Session, id: int):
        """Ambil movement berdasarkan ID."""
        item = db.query(ErpStockMovement).filter(ErpStockMovement.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Stock movement not found")
        return item

    @staticmethod
    def create_movement(db: Session, data):
        """Buat pergerakan stok baru, auto-hitung balance_before & balance_after.

        Rules:
        - IN (pembelian, penerimaan): quantity positif → balance_after = balance_before + qty
        - OUT (pemakaian, penjualan): quantity negatif → balance_after = balance_before + qty (qty negatif)
        - ADJUSTMENT / OPNAME: bisa positif atau negatif
        """
        # Validasi produk
        product = db.query(ErpMasterProduct).filter(
            ErpMasterProduct.id == data.product_id
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Hitung balance_before: total movement qty untuk produk ini
        last_movement = db.query(func.sum(ErpStockMovement.quantity)) \
            .filter(ErpStockMovement.product_id == data.product_id).scalar()
        balance_before = int(last_movement or 0)

        # balance_after
        balance_after = balance_before + data.quantity

        # total_cost jika belum diisi
        total_cost = data.total_cost or data.quantity * data.unit_cost

        item = ErpStockMovement(
            product_id=data.product_id,
            movement_type=data.movement_type.upper(),
            quantity=data.quantity,
            unit_cost=data.unit_cost,
            total_cost=total_cost,
            reference_type=data.reference_type,
            reference_id=data.reference_id,
            notes=data.notes,
            movement_date=data.movement_date,
            balance_before=balance_before,
            balance_after=balance_after,
            performed_by=data.performed_by,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    # ═══════════════════════════════════════════════════════
    # STOCK CARDS
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_stock_cards(
        db: Session,
        product_id: Optional[int] = None,
        period_code: Optional[str] = None,
    ):
        """Daftar kartu stok, filter by product dan/atau period."""
        q = db.query(ErpStockCard)
        if product_id:
            q = q.filter(ErpStockCard.product_id == product_id)
        if period_code:
            q = q.filter(ErpStockCard.period_code == period_code)
        return q.order_by(ErpStockCard.period_code.desc(),
                          ErpStockCard.product_id).all()

    @staticmethod
    def get_stock_card(db: Session, id: int):
        """Ambil kartu stok berdasarkan ID."""
        item = db.query(ErpStockCard).filter(ErpStockCard.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Stock card not found")
        return item

    @staticmethod
    def generate_stock_card(db: Session, data):
        """Generate kartu stok untuk periode tertentu.

        Menghitung opening_qty, in_qty, out_qty, adjustment_qty, closing_qty
        berdasarkan data ErpStockMovement untuk setiap produk.
        """
        # Tentukan period_code
        today = date.today()
        period_code = data.period_code or today.strftime("%Y-%m")

        # Ambil semua produk aktif
        products = db.query(ErpMasterProduct).filter(
            ErpMasterProduct.is_active == True
        )
        if data.product_id:
            products = products.filter(ErpMasterProduct.id == data.product_id)
        products = products.all()

        if not products:
            raise HTTPException(status_code=404, detail="No active products found")

        results = []
        for product in products:
            # Hitung opening_qty (balance sebelum periode ini)
            opening = db.query(func.coalesce(func.sum(ErpStockMovement.quantity), 0)) \
                .filter(
                    ErpStockMovement.product_id == product.id,
                    ErpStockMovement.movement_date < func.date_trunc('month',
                        func.to_date(period_code + '-01', 'YYYY-MM-DD')),
                ).scalar()
            opening_qty = int(opening or 0)

            # Hitung movement dalam periode
            from sqlalchemy import and_
            period_start = func.to_date(period_code + '-01', 'YYYY-MM-DD')

            movements = db.query(
                func.coalesce(func.sum(ErpStockMovement.quantity), 0),
            ).filter(
                ErpStockMovement.product_id == product.id,
                ErpStockMovement.movement_date >= period_start,
            )

            # in_qty: IN movements (positive)
            in_qty_obj = db.query(
                func.coalesce(func.sum(ErpStockMovement.quantity), 0)
            ).filter(
                ErpStockMovement.product_id == product.id,
                ErpStockMovement.movement_date >= period_start,
                ErpStockMovement.movement_type == "IN",
                ErpStockMovement.quantity > 0,
            ).scalar()
            in_qty = int(in_qty_obj or 0)

            # out_qty: OUT movements (absolute value of negative quantities)
            out_qty_obj = db.query(
                func.coalesce(func.sum(ErpStockMovement.quantity), 0)
            ).filter(
                ErpStockMovement.product_id == product.id,
                ErpStockMovement.movement_date >= period_start,
                ErpStockMovement.movement_type == "OUT",
                ErpStockMovement.quantity < 0,
            ).scalar()
            out_qty = abs(int(out_qty_obj or 0))

            # adjustment_qty: ADJUSTMENT / OPNAME movements (net)
            adj_qty_obj = db.query(
                func.coalesce(func.sum(ErpStockMovement.quantity), 0)
            ).filter(
                ErpStockMovement.product_id == product.id,
                ErpStockMovement.movement_date >= period_start,
                ErpStockMovement.movement_type.in_(["ADJUSTMENT", "OPNAME"]),
            ).scalar()
            adjustment_qty = int(adj_qty_obj or 0)

            # closing_qty
            closing_qty = opening_qty + in_qty + adjustment_qty - out_qty

            # avg_unit_cost dari unit_cost rata-rata tertimbang
            cost_result = db.query(
                func.coalesce(func.avg(ErpStockMovement.unit_cost), 0)
            ).filter(
                ErpStockMovement.product_id == product.id,
                ErpStockMovement.movement_date >= period_start,
                ErpStockMovement.quantity > 0,
            ).scalar()
            avg_unit_cost = int(cost_result or 0)

            # Cek apakah sudah ada stock card untuk produk & periode ini
            existing = db.query(ErpStockCard).filter(
                ErpStockCard.product_id == product.id,
                ErpStockCard.period_code == period_code,
            ).first()

            if existing:
                # Update
                existing.opening_qty = opening_qty
                existing.in_qty = in_qty
                existing.out_qty = out_qty
                existing.adjustment_qty = adjustment_qty
                existing.closing_qty = closing_qty
                existing.avg_unit_cost = avg_unit_cost
                results.append(existing)
            else:
                # Create baru
                card = ErpStockCard(
                    product_id=product.id,
                    period_code=period_code,
                    opening_qty=opening_qty,
                    in_qty=in_qty,
                    out_qty=out_qty,
                    adjustment_qty=adjustment_qty,
                    closing_qty=closing_qty,
                    avg_unit_cost=avg_unit_cost,
                )
                db.add(card)
                results.append(card)

        db.commit()
        for r in results:
            db.refresh(r)
        return results

    # ═══════════════════════════════════════════════════════
    # BOM — BILL OF MATERIAL
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_bom(db: Session, search: Optional[str] = None):
        """Daftar Bill of Materials."""
        q = db.query(ErpBillOfMaterial).filter(ErpBillOfMaterial.is_active == True)
        if search:
            q = q.filter(
                ErpBillOfMaterial.name.ilike(f"%{search}%")
                | ErpBillOfMaterial.code.ilike(f"%{search}%")
            )
        return q.order_by(ErpBillOfMaterial.code).all()

    @staticmethod
    def get_bom(db: Session, id: int):
        """Ambil BOM beserta komponennya."""
        item = db.query(ErpBillOfMaterial).filter(
            ErpBillOfMaterial.id == id,
            ErpBillOfMaterial.is_active == True,
        ).first()
        if not item:
            raise HTTPException(status_code=404, detail="BOM not found")
        return item

    @staticmethod
    def create_bom(db: Session, data):
        """Buat BOM baru beserta komponen-komponennya."""
        # Cek duplikasi code
        existing = db.query(ErpBillOfMaterial).filter(
            ErpBillOfMaterial.code == data.code
        ).first()
        if existing:
            raise HTTPException(
                status_code=409, detail=f"BOM code '{data.code}' already exists"
            )

        # Hitung total_standard_cost dari komponen jika tidak diset
        total_cost = data.total_standard_cost
        if not total_cost and data.components:
            total_cost = sum(
                (c.quantity * c.unit_cost) for c in data.components
            )

        item = ErpBillOfMaterial(
            code=data.code,
            name=data.name,
            service_id=data.service_id,
            total_standard_cost=total_cost,
            is_active=data.is_active,
            notes=data.notes,
        )
        db.add(item)
        db.flush()

        # Buat komponen
        for i, comp in enumerate(data.components):
            subtotal = comp.subtotal or comp.quantity * comp.unit_cost
            component = ErpBomComponent(
                bom_id=item.id,
                line_no=comp.line_no or (i + 1),
                product_id=comp.product_id,
                quantity=comp.quantity,
                unit_cost=comp.unit_cost,
                subtotal=subtotal,
                notes=comp.notes,
            )
            db.add(component)

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_bom(db: Session, id: int, data):
        """Update BOM dan komponen-komponennya."""
        item = InventoryService.get_bom(db, id)

        update_data = data.model_dump(exclude_unset=True)

        # Handle code uniqueness check
        if "code" in update_data and update_data["code"] != item.code:
            existing = db.query(ErpBillOfMaterial).filter(
                ErpBillOfMaterial.code == update_data["code"],
                ErpBillOfMaterial.id != id,
            ).first()
            if existing:
                raise HTTPException(
                    status_code=409,
                    detail=f"BOM code '{update_data['code']}' already exists",
                )

        # Update field-field BOM (exclude components)
        components_data = update_data.pop("components", None)

        for key, val in update_data.items():
            setattr(item, key, val)

        # Jika ada komponen baru, replace semua komponen lama
        if components_data is not None:
            # Hapus komponen lama
            db.query(ErpBomComponent).filter(
                ErpBomComponent.bom_id == item.id
            ).delete()

            # Buat komponen baru
            for i, comp in enumerate(components_data):
                subtotal = comp.subtotal or comp.quantity * comp.unit_cost
                component = ErpBomComponent(
                    bom_id=item.id,
                    line_no=comp.line_no or (i + 1),
                    product_id=comp.product_id,
                    quantity=comp.quantity,
                    unit_cost=comp.unit_cost,
                    subtotal=subtotal,
                    notes=comp.notes,
                )
                db.add(component)

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_bom(db: Session, id: int):
        """Soft-delete BOM (is_active=False)."""
        item = db.query(ErpBillOfMaterial).filter(
            ErpBillOfMaterial.id == id,
            ErpBillOfMaterial.is_active == True,
        ).first()
        if not item:
            raise HTTPException(status_code=404, detail="BOM not found")
        item.is_active = False
        db.commit()
        return {"detail": "BOM deleted"}

    # ═══════════════════════════════════════════════════════
    # STOCK OPNAME
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_opname(
        db: Session,
        status: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ):
        """Daftar sesi stock opname dengan pagination."""
        q = db.query(ErpStockOpname)
        if status:
            q = q.filter(ErpStockOpname.status == status.upper())
        total = q.count()
        items = q.order_by(ErpStockOpname.id.desc()) \
                 .offset((page - 1) * per_page).limit(per_page).all()
        return {"items": items, "total": total, "page": page, "per_page": per_page}

    @staticmethod
    def get_opname(db: Session, id: int):
        """Ambil sesi opname beserta item-itemnya."""
        item = db.query(ErpStockOpname).filter(ErpStockOpname.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Stock opname not found")
        return item

    @staticmethod
    def create_opname(db: Session, data):
        """Buat sesi stock opname baru (status DRAFT)."""
        # Cek duplikasi code
        existing = db.query(ErpStockOpname).filter(
            ErpStockOpname.code == data.code
        ).first()
        if existing:
            raise HTTPException(
                status_code=409, detail=f"Opname code '{data.code}' already exists"
            )

        item = ErpStockOpname(
            code=data.code,
            opname_date=data.opname_date,
            status="DRAFT",
            notes=data.notes,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def add_opname_item(db: Session, opname_id: int, data):
        """Tambahkan item ke sesi opname."""
        opname = InventoryService.get_opname(db, opname_id)
        if opname.status != "DRAFT":
            raise HTTPException(
                status_code=400,
                detail="Cannot add items to a non-DRAFT opname",
            )

        # Cek duplikasi produk dalam opname
        existing_item = db.query(ErpStockOpnameItem).filter(
            ErpStockOpnameItem.opname_id == opname_id,
            ErpStockOpnameItem.product_id == data.product_id,
        ).first()
        if existing_item:
            raise HTTPException(
                status_code=409,
                detail=f"Product ID {data.product_id} already exists in this opname",
            )

        # Validasi produk
        product = db.query(ErpMasterProduct).filter(
            ErpMasterProduct.id == data.product_id
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Hitung system_qty dari total movements
        last_movement = db.query(func.sum(ErpStockMovement.quantity)) \
            .filter(ErpStockMovement.product_id == data.product_id).scalar()
        system_qty = int(last_movement or 0)

        difference = data.physical_qty - system_qty
        unit_cost = data.unit_cost or product.cost_price
        difference_value = difference * unit_cost

        item = ErpStockOpnameItem(
            opname_id=opname_id,
            product_id=data.product_id,
            system_qty=system_qty,
            physical_qty=data.physical_qty,
            difference=difference,
            unit_cost=unit_cost,
            difference_value=difference_value,
            notes=data.notes,
        )
        db.add(item)

        # Update total_items di opname
        opname.total_items = db.query(ErpStockOpnameItem).filter(
            ErpStockOpnameItem.opname_id == opname_id,
        ).count()

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_opname_item(db: Session, opname_id: int, item_id: int, data):
        """Update item opname — auto-hitung difference & difference_value."""
        opname = InventoryService.get_opname(db, opname_id)
        if opname.status != "DRAFT":
            raise HTTPException(
                status_code=400,
                detail="Cannot update items in a non-DRAFT opname",
            )

        item = db.query(ErpStockOpnameItem).filter(
            ErpStockOpnameItem.id == item_id,
            ErpStockOpnameItem.opname_id == opname_id,
        ).first()
        if not item:
            raise HTTPException(status_code=404, detail="Opname item not found")

        # Update physical_qty
        item.physical_qty = data.physical_qty
        if data.notes is not None:
            item.notes = data.notes

        # Auto-hitung difference & difference_value
        item.difference = item.physical_qty - item.system_qty
        item.difference_value = item.difference * item.unit_cost

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def complete_opname(db: Session, opname_id: int, performed_by: str):
        """Selesaikan sesi opname.

        Untuk setiap item dengan difference != 0, auto-buat StockMovement
        bertipe OPNAME.
        """
        opname = InventoryService.get_opname(db, opname_id)
        if opname.status != "DRAFT":
            raise HTTPException(
                status_code=400,
                detail=f"Opname is already {opname.status}",
            )

        if not opname.items:
            raise HTTPException(
                status_code=400,
                detail="Opname has no items. Add items first.",
            )

        now = datetime.now(timezone.utc)
        total_difference_value = 0

        # Buat StockMovement untuk setiap item dengan difference
        for item in opname.items:
            if item.difference == 0:
                continue

            movement = ErpStockMovement(
                product_id=item.product_id,
                movement_type="OPNAME",
                quantity=item.difference,
                unit_cost=item.unit_cost,
                total_cost=item.difference_value,
                reference_type="OPNAME",
                reference_id=opname.code,
                notes=f"Stock opname: {opname.code}",
                movement_date=opname.opname_date,
                performed_by=performed_by,
            )

            # Hitung balance_before & balance_after
            last_movement = db.query(func.sum(ErpStockMovement.quantity)) \
                .filter(ErpStockMovement.product_id == item.product_id).scalar()
            movement.balance_before = int(last_movement or 0)
            movement.balance_after = movement.balance_before + item.difference

            db.add(movement)
            total_difference_value += item.difference_value

        # Update opname status
        opname.status = "COMPLETED"
        opname.completed_at = now
        opname.completed_by = performed_by
        opname.total_difference = total_difference_value

        db.commit()
        db.refresh(opname)
        return opname

    @staticmethod
    def cancel_opname(db: Session, opname_id: int):
        """Batalkan sesi opname."""
        opname = InventoryService.get_opname(db, opname_id)
        if opname.status != "DRAFT":
            raise HTTPException(
                status_code=400,
                detail=f"Opname is already {opname.status}. Cannot cancel.",
            )

        opname.status = "CANCELLED"
        db.commit()
        db.refresh(opname)
        return opname

    # ═══════════════════════════════════════════════════════
    # WIP — WORK IN PROGRESS
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_wip(
        db: Session,
        status: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ):
        """Daftar Work In Progress dengan pagination."""
        q = db.query(ErpWorkInProgress)
        if status:
            q = q.filter(ErpWorkInProgress.status == status.upper())
        total = q.count()
        items = q.order_by(ErpWorkInProgress.id.desc()) \
                 .offset((page - 1) * per_page).limit(per_page).all()
        return {"items": items, "total": total, "page": page, "per_page": per_page}

    @staticmethod
    def get_wip(db: Session, id: int):
        """Ambil WIP beserta material-materialnya."""
        item = db.query(ErpWorkInProgress).filter(ErpWorkInProgress.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="WIP not found")
        return item

    @staticmethod
    def create_wip(db: Session, data):
        """Buat WIP baru (status PLANNED) beserta materialnya."""
        # Cek duplikasi code
        existing = db.query(ErpWorkInProgress).filter(
            ErpWorkInProgress.code == data.code
        ).first()
        if existing:
            raise HTTPException(
                status_code=409, detail=f"WIP code '{data.code}' already exists"
            )

        # Validasi produk
        product = db.query(ErpMasterProduct).filter(
            ErpMasterProduct.id == data.product_id
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        # Hitung total cost dari material jika tidak diset
        mat_cost = data.total_material_cost
        if not mat_cost and data.materials:
            mat_cost = sum(
                (m.planned_qty * m.unit_cost) for m in data.materials
            )

        total_cost = data.total_cost or (
            mat_cost + data.total_labor_cost + data.total_overhead_cost
        )

        item = ErpWorkInProgress(
            code=data.code,
            product_id=data.product_id,
            batch_number=data.batch_number,
            planned_qty=data.planned_qty,
            status="PLANNED",
            total_material_cost=mat_cost,
            total_labor_cost=data.total_labor_cost,
            total_overhead_cost=data.total_overhead_cost,
            total_cost=total_cost,
            notes=data.notes,
        )
        db.add(item)
        db.flush()

        # Buat material
        for mat in data.materials:
            subtotal = mat.subtotal or mat.planned_qty * mat.unit_cost
            material = ErpWipMaterial(
                wip_id=item.id,
                product_id=mat.product_id,
                planned_qty=mat.planned_qty,
                actual_qty=mat.actual_qty,
                unit_cost=mat.unit_cost,
                subtotal=subtotal,
            )
            db.add(material)

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_wip(db: Session, id: int, data):
        """Update WIP beserta materialnya."""
        item = InventoryService.get_wip(db, id)

        update_data = data.model_dump(exclude_unset=True)

        # Handle code uniqueness check
        if "code" in update_data and update_data["code"] != item.code:
            existing = db.query(ErpWorkInProgress).filter(
                ErpWorkInProgress.code == update_data["code"],
                ErpWorkInProgress.id != id,
            ).first()
            if existing:
                raise HTTPException(
                    status_code=409,
                    detail=f"WIP code '{update_data['code']}' already exists",
                )

        # Update field-field WIP (exclude materials)
        materials_data = update_data.pop("materials", None)

        for key, val in update_data.items():
            setattr(item, key, val)

        # Jika ada material baru, replace semua material lama
        if materials_data is not None:
            db.query(ErpWipMaterial).filter(
                ErpWipMaterial.wip_id == item.id
            ).delete()

            for mat in materials_data:
                subtotal = mat.subtotal or mat.planned_qty * mat.unit_cost
                material = ErpWipMaterial(
                    wip_id=item.id,
                    product_id=mat.product_id,
                    planned_qty=mat.planned_qty,
                    actual_qty=mat.actual_qty,
                    unit_cost=mat.unit_cost,
                    subtotal=subtotal,
                )
                db.add(material)

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def start_wip(db: Session, id: int):
        """Mulai produksi — ubah status ke IN_PROGRESS."""
        item = InventoryService.get_wip(db, id)
        if item.status != "PLANNED":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot start WIP with status '{item.status}'. Must be PLANNED.",
            )

        item.status = "IN_PROGRESS"
        item.start_date = date.today()

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def complete_wip(db: Session, id: int, performed_by: str):
        """Selesaikan produksi — ubah status ke COMPLETED.

        Auto-create StockMovement:
        1. OUT (usage) untuk setiap material (actual_qty, atau planned_qty jika actual null)
        2. IN (production) untuk finished goods (product_id, actual_qty)
        """
        item = InventoryService.get_wip(db, id)
        if item.status != "IN_PROGRESS":
            raise HTTPException(
                status_code=400,
                detail=f"Cannot complete WIP with status '{item.status}'. Must be IN_PROGRESS.",
            )

        now_date = date.today()
        actual_qty = item.actual_qty or item.planned_qty

        # 1. StockMovement OUT untuk setiap material
        for mat in item.materials:
            actual = mat.actual_qty or mat.planned_qty
            if actual <= 0:
                continue

            # Hitung balance
            last_movement = db.query(func.sum(ErpStockMovement.quantity)) \
                .filter(ErpStockMovement.product_id == mat.product_id).scalar()
            balance_before = int(last_movement or 0)

            movement = ErpStockMovement(
                product_id=mat.product_id,
                movement_type="OUT",
                quantity=-actual,  # Negatif = keluar
                unit_cost=mat.unit_cost,
                total_cost=mat.subtotal,
                reference_type="WIP",
                reference_id=item.code,
                notes=f"WIP material usage: {item.code}",
                movement_date=now_date,
                balance_before=balance_before,
                balance_after=balance_before - actual,
                performed_by=performed_by,
            )
            db.add(movement)

        # 2. StockMovement IN untuk finished goods
        if actual_qty > 0:
            # Unit cost = total_cost / actual_qty
            unit_cost = int(item.total_cost / actual_qty) if actual_qty > 0 else 0

            last_movement_fg = db.query(func.sum(ErpStockMovement.quantity)) \
                .filter(ErpStockMovement.product_id == item.product_id).scalar()
            balance_before_fg = int(last_movement_fg or 0)

            fg_movement = ErpStockMovement(
                product_id=item.product_id,
                movement_type="IN",
                quantity=actual_qty,
                unit_cost=unit_cost,
                total_cost=item.total_cost,
                reference_type="WIP",
                reference_id=item.code,
                notes=f"WIP production: {item.code} (batch: {item.batch_number or '-'})",
                movement_date=now_date,
                balance_before=balance_before_fg,
                balance_after=balance_before_fg + actual_qty,
                performed_by=performed_by,
            )
            db.add(fg_movement)

        # Update WIP
        item.status = "COMPLETED"
        item.actual_qty = actual_qty
        item.end_date = now_date
        item.completed_by = performed_by

        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def cancel_wip(db: Session, id: int):
        """Batalkan WIP."""
        item = InventoryService.get_wip(db, id)
        if item.status == "COMPLETED":
            raise HTTPException(
                status_code=400,
                detail="Cannot cancel a COMPLETED WIP",
            )
        if item.status == "CANCELLED":
            raise HTTPException(
                status_code=400,
                detail="WIP is already cancelled",
            )

        item.status = "CANCELLED"
        db.commit()
        db.refresh(item)
        return item
