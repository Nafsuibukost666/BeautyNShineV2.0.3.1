"""Master Data Service — Business logic untuk semua master data.

Satu class MasterDataService dengan method terorganisir per domain.
Semua method return **ORM object** (bisa dimodifikasi oleh update/delete).
Serialization ke dict dilakukan di layer API (master_data.py routes).
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.master_data import (
    ErpMasterProduct,
    ErpMasterCategory,
    ErpMasterAccount,
    ErpAccountMapping,
    ErpMasterTax,
    ErpMasterCompany,
    ErpMasterBranch,
    ErpMasterStaff,
    ErpMasterBed,
    ErpMasterVoucher,
    ErpMasterService,
    ErpMasterCustomer,
    ErpMasterSupplier,
    ErpFinancialPeriod,
    ErpPeriodCloseLog,
)
from app.models.posting import (
    ErpPostingTransaction,
    ErpJournalEntry,
    ErpJournalLine,
)
from app.services.audit import AuditService


class MasterDataService:
    """Service layer untuk semua operasi CRUD master data."""

    # ═══════════════════════════════════════════════════════
    # PRODUCTS
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_products(
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ):
        """Daftar produk dengan filter pencarian & pagination."""
        q = db.query(ErpMasterProduct)
        if search:
            q = q.filter(
                or_(
                    ErpMasterProduct.name.ilike(f"%{search}%"),
                    ErpMasterProduct.sku.ilike(f"%{search}%"),
                )
            )
        if category:
            q = q.filter(ErpMasterProduct.category == category)
        total = q.count()
        items = q.offset((page - 1) * per_page).limit(per_page).all()
        return {"items": items, "total": total, "page": page, "per_page": per_page}

    @staticmethod
    def get_product(db: Session, id: int):
        """Ambil produk berdasarkan ID."""
        item = db.query(ErpMasterProduct).filter(ErpMasterProduct.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Product not found")
        return item

    @staticmethod
    def create_product(db: Session, data):
        """Buat produk baru."""
        item = ErpMasterProduct(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_product(db: Session, id: int, data):
        """Update produk."""
        item = MasterDataService.get_product(db, id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_product(db: Session, id: int):
        """Hapus (soft-delete dengan is_active=False)."""
        item = MasterDataService.get_product(db, id)
        item.is_active = False
        db.commit()
        return {"detail": "Product deleted"}

    # ═══════════════════════════════════════════════════════
    # CATEGORIES
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_categories(db: Session, type: Optional[str] = None):
        """Daftar kategori, opsional filter by type."""
        q = db.query(ErpMasterCategory)
        if type:
            q = q.filter(ErpMasterCategory.type == type)
        return q.all()

    @staticmethod
    def get_category(db: Session, id: int):
        item = db.query(ErpMasterCategory).filter(ErpMasterCategory.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Category not found")
        return item

    @staticmethod
    def create_category(db: Session, data):
        item = ErpMasterCategory(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_category(db: Session, id: int, data):
        item = MasterDataService.get_category(db, id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_category(db: Session, id: int):
        item = MasterDataService.get_category(db, id)
        item.is_active = False
        db.commit()
        return {"detail": "Category deleted"}

    # ═══════════════════════════════════════════════════════
    # ACCOUNTS (COA)
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_accounts(db: Session, type: Optional[str] = None):
        q = db.query(ErpMasterAccount)
        if type:
            q = q.filter(ErpMasterAccount.type == type)
        return q.all()

    @staticmethod
    def get_account(db: Session, id: int):
        item = db.query(ErpMasterAccount).filter(ErpMasterAccount.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Account not found")
        return item

    @staticmethod
    def create_account(db: Session, data):
        # Cek duplikasi code
        existing = db.query(ErpMasterAccount).filter(ErpMasterAccount.code == data.code).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"Account code '{data.code}' already exists")
        item = ErpMasterAccount(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_account(db: Session, id: int, data):
        item = MasterDataService.get_account(db, id)

        # Protect system accounts (Level 1 & 2)
        if item.is_system:
            raise HTTPException(
                status_code=403,
                detail=f"Cannot edit system account '{item.code} — {item.name}'. "
                       f"System accounts (Level 1 & 2) are fixed and cannot be modified.",
            )

        update_data = data.model_dump(exclude_unset=True)
        # Cek konflik code jika diubah
        if "code" in update_data and update_data["code"] != item.code:
            existing = db.query(ErpMasterAccount).filter(
                ErpMasterAccount.code == update_data["code"],
                ErpMasterAccount.id != id,
            ).first()
            if existing:
                raise HTTPException(status_code=409, detail=f"Account code '{update_data['code']}' already exists")
        for key, val in update_data.items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_account(db: Session, id: int):
        item = MasterDataService.get_account(db, id)

        # Protect system accounts (Level 1 & 2)
        if item.is_system:
            raise HTTPException(
                status_code=403,
                detail=f"Cannot delete system account '{item.code} — {item.name}'. "
                       f"System accounts (Level 1 & 2) are fixed and cannot be removed.",
            )

        # Cek apakah punya child
        children = db.query(ErpMasterAccount).filter(ErpMasterAccount.parent_id == id).count()
        if children > 0:
            raise HTTPException(status_code=409, detail="Cannot delete account with child accounts")
        item.is_active = False
        db.commit()
        return {"detail": "Account deleted"}

    @staticmethod
    def get_account_tree(db: Session) -> list:
        """Kembalikan hierarki akun bersarang (tree)."""
        accounts = db.query(ErpMasterAccount).order_by(ErpMasterAccount.code).all()

        def _build_tree(parent_id=None):
            children = []
            for acc in accounts:
                if acc.parent_id == parent_id:
                    node = {
                        "id": acc.id,
                        "code": acc.code,
                        "name": acc.name,
                        "type": acc.type,
                        "level": acc.level,
                        "is_system": acc.is_system,
                        "parent_id": acc.parent_id,
                        "is_active": acc.is_active,
                        "description": acc.description,
                        "children": _build_tree(acc.id),
                    }
                    children.append(node)
            return children

        return _build_tree(None)

    # ═══════════════════════════════════════════════════════
    # TAXES
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_taxes(db: Session):
        return db.query(ErpMasterTax).all()

    @staticmethod
    def get_tax(db: Session, id: int):
        item = db.query(ErpMasterTax).filter(ErpMasterTax.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Tax not found")
        return item

    @staticmethod
    def create_tax(db: Session, data):
        item = ErpMasterTax(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_tax(db: Session, id: int, data):
        item = MasterDataService.get_tax(db, id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_tax(db: Session, id: int):
        item = MasterDataService.get_tax(db, id)
        item.is_active = False
        db.commit()
        return {"detail": "Tax deleted"}

    # ═══════════════════════════════════════════════════════
    # COMPANY (SINGLETON)
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def get_company(db: Session):
        """Ambil data perusahaan (hanya 1 baris)."""
        item = db.query(ErpMasterCompany).filter(ErpMasterCompany.is_active == True).first()
        if not item:
            raise HTTPException(status_code=404, detail="Company not found")
        return item

    @staticmethod
    def update_company(db: Session, data):
        """Update data perusahaan. Buat jika belum ada."""
        item = db.query(ErpMasterCompany).filter(ErpMasterCompany.is_active == True).first()
        if not item:
            item = ErpMasterCompany(name="")
            db.add(item)
            db.flush()
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    # ═══════════════════════════════════════════════════════
    # BRANCHES
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_branches(db: Session):
        return db.query(ErpMasterBranch).all()

    @staticmethod
    def get_branch(db: Session, id: int):
        item = db.query(ErpMasterBranch).filter(ErpMasterBranch.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Branch not found")
        return item

    @staticmethod
    def create_branch(db: Session, data):
        existing = db.query(ErpMasterBranch).filter(ErpMasterBranch.code == data.code).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"Branch code '{data.code}' already exists")
        item = ErpMasterBranch(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_branch(db: Session, id: int, data):
        item = MasterDataService.get_branch(db, id)
        update_data = data.model_dump(exclude_unset=True)
        if "code" in update_data and update_data["code"] != item.code:
            existing = db.query(ErpMasterBranch).filter(
                ErpMasterBranch.code == update_data["code"],
                ErpMasterBranch.id != id,
            ).first()
            if existing:
                raise HTTPException(status_code=409, detail=f"Branch code '{update_data['code']}' already exists")
        for key, val in update_data.items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_branch(db: Session, id: int):
        item = MasterDataService.get_branch(db, id)
        item.is_active = False
        db.commit()
        return {"detail": "Branch deleted"}

    # ═══════════════════════════════════════════════════════
    # STAFF
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_staff(db: Session, search: Optional[str] = None):
        q = db.query(ErpMasterStaff)
        if search:
            q = q.filter(
                or_(
                    ErpMasterStaff.name.ilike(f"%{search}%"),
                    ErpMasterStaff.staff_id.ilike(f"%{search}%"),
                    ErpMasterStaff.role.ilike(f"%{search}%"),
                    ErpMasterStaff.kabin.ilike(f"%{search}%"),
                )
            )
        return q.all()

    @staticmethod
    def get_staff(db: Session, id: int):
        item = db.query(ErpMasterStaff).filter(ErpMasterStaff.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Staff not found")
        return item

    @staticmethod
    def create_staff(db: Session, data):
        item = ErpMasterStaff(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_staff(db: Session, id: int, data):
        item = MasterDataService.get_staff(db, id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_staff(db: Session, id: int):
        item = MasterDataService.get_staff(db, id)
        item.is_active = False
        db.commit()
        return {"detail": "Staff deleted"}

    # ═══════════════════════════════════════════════════════
    # BEDS
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_beds(db: Session):
        return db.query(ErpMasterBed).all()

    @staticmethod
    def get_bed(db: Session, id: int):
        item = db.query(ErpMasterBed).filter(ErpMasterBed.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Bed not found")
        return item

    @staticmethod
    def create_bed(db: Session, data):
        item = ErpMasterBed(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_bed(db: Session, id: int, data):
        item = MasterDataService.get_bed(db, id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_bed(db: Session, id: int):
        item = MasterDataService.get_bed(db, id)
        item.is_active = False
        db.commit()
        return {"detail": "Bed deleted"}

    # ═══════════════════════════════════════════════════════
    # VOUCHERS
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_vouchers(db: Session):
        return db.query(ErpMasterVoucher).all()

    @staticmethod
    def get_voucher(db: Session, id: int):
        item = db.query(ErpMasterVoucher).filter(ErpMasterVoucher.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Voucher not found")
        return item

    @staticmethod
    def create_voucher(db: Session, data):
        existing = db.query(ErpMasterVoucher).filter(ErpMasterVoucher.code == data.code).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"Voucher code '{data.code}' already exists")
        item = ErpMasterVoucher(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_voucher(db: Session, id: int, data):
        item = MasterDataService.get_voucher(db, id)
        update_data = data.model_dump(exclude_unset=True)
        if "code" in update_data and update_data["code"] != item.code:
            existing = db.query(ErpMasterVoucher).filter(
                ErpMasterVoucher.code == update_data["code"],
                ErpMasterVoucher.id != id,
            ).first()
            if existing:
                raise HTTPException(status_code=409, detail=f"Voucher code '{update_data['code']}' already exists")
        for key, val in update_data.items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_voucher(db: Session, id: int):
        item = MasterDataService.get_voucher(db, id)
        item.is_active = False
        db.commit()
        return {"detail": "Voucher deleted"}

    @staticmethod
    def validate_voucher(db: Session, code: str):
        """Validasi voucher: cek aktif, masa berlaku, dan batas pemakaian."""
        item = db.query(ErpMasterVoucher).filter(ErpMasterVoucher.code == code).first()
        if not item:
            raise HTTPException(status_code=404, detail="Voucher not found")
        if not item.is_active:
            raise HTTPException(status_code=400, detail="Voucher is not active")
        now = datetime.now(timezone.utc)
        if item.valid_from and item.valid_from > now:
            raise HTTPException(status_code=400, detail="Voucher not yet valid")
        if item.valid_until and item.valid_until < now:
            raise HTTPException(status_code=400, detail="Voucher has expired")
        if item.max_use > 0 and item.used_count >= item.max_use:
            raise HTTPException(status_code=400, detail="Voucher usage limit reached")
        return item

    # ═══════════════════════════════════════════════════════
    # SERVICES
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_services(db: Session, search: Optional[str] = None):
        """Daftar layanan aktif dengan filter pencarian."""
        q = db.query(ErpMasterService).filter(ErpMasterService.is_active == True)
        if search:
            q = q.filter(
                or_(
                    ErpMasterService.name.ilike(f"%{search}%"),
                    ErpMasterService.category.ilike(f"%{search}%"),
                )
            )
        return q.all()

    @staticmethod
    def get_service(db: Session, id: int):
        item = db.query(ErpMasterService).filter(ErpMasterService.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Service not found")
        return item

    @staticmethod
    def create_service(db: Session, data):
        item = ErpMasterService(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_service(db: Session, id: int, data):
        item = MasterDataService.get_service(db, id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_service(db: Session, id: int):
        item = MasterDataService.get_service(db, id)
        item.is_active = False
        db.commit()
        return {"detail": "Service deleted"}

    # ═══════════════════════════════════════════════════════
    # CUSTOMERS
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_customers(db: Session, search: Optional[str] = None):
        """Daftar customer aktif dengan filter pencarian."""
        q = db.query(ErpMasterCustomer).filter(ErpMasterCustomer.is_active == True)
        if search:
            q = q.filter(
                or_(
                    ErpMasterCustomer.name.ilike(f"%{search}%"),
                    ErpMasterCustomer.phone.ilike(f"%{search}%"),
                    ErpMasterCustomer.email.ilike(f"%{search}%"),
                )
            )
        return q.order_by(ErpMasterCustomer.name).all()

    @staticmethod
    def get_customer(db: Session, id: int):
        item = db.query(ErpMasterCustomer).filter(ErpMasterCustomer.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Customer not found")
        return item

    @staticmethod
    def create_customer(db: Session, data):
        item = ErpMasterCustomer(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_customer(db: Session, id: int, data):
        item = MasterDataService.get_customer(db, id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_customer(db: Session, id: int):
        item = MasterDataService.get_customer(db, id)
        item.is_active = False
        db.commit()
        return {"detail": "Customer deleted"}

    # ═══════════════════════════════════════════════════════
    # SUPPLIERS
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_suppliers(db: Session, search: Optional[str] = None):
        """Daftar supplier aktif dengan filter pencarian."""
        q = db.query(ErpMasterSupplier).filter(ErpMasterSupplier.is_active == True)
        if search:
            q = q.filter(
                or_(
                    ErpMasterSupplier.name.ilike(f"%{search}%"),
                    ErpMasterSupplier.contact_person.ilike(f"%{search}%"),
                    ErpMasterSupplier.phone.ilike(f"%{search}%"),
                    ErpMasterSupplier.email.ilike(f"%{search}%"),
                )
            )
        return q.order_by(ErpMasterSupplier.name).all()

    @staticmethod
    def get_supplier(db: Session, id: int):
        item = db.query(ErpMasterSupplier).filter(ErpMasterSupplier.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Supplier not found")
        return item

    @staticmethod
    def create_supplier(db: Session, data):
        item = ErpMasterSupplier(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_supplier(db: Session, id: int, data):
        item = MasterDataService.get_supplier(db, id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_supplier(db: Session, id: int):
        item = MasterDataService.get_supplier(db, id)
        item.is_active = False
        db.commit()
        return {"detail": "Supplier deleted"}

    # ═══════════════════════════════════════════════════════
    # FINANCIAL PERIODS
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_periods(db: Session):
        return db.query(ErpFinancialPeriod).order_by(ErpFinancialPeriod.code.desc()).all()

    @staticmethod
    def get_period(db: Session, id: int):
        item = db.query(ErpFinancialPeriod).filter(ErpFinancialPeriod.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Period not found")
        return item

    @staticmethod
    def create_period(db: Session, data):
        existing = db.query(ErpFinancialPeriod).filter(ErpFinancialPeriod.code == data.code).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"Period code '{data.code}' already exists")
        item = ErpFinancialPeriod(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_period(db: Session, id: int, data):
        item = MasterDataService.get_period(db, id)
        update_data = data.model_dump(exclude_unset=True)
        if "code" in update_data and update_data["code"] != item.code:
            existing = db.query(ErpFinancialPeriod).filter(
                ErpFinancialPeriod.code == update_data["code"],
                ErpFinancialPeriod.id != id,
            ).first()
            if existing:
                raise HTTPException(status_code=409, detail=f"Period code '{update_data['code']}' already exists")
        for key, val in update_data.items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_period(db: Session, id: int):
        item = MasterDataService.get_period(db, id)
        db.delete(item)
        db.commit()
        return {"detail": "Period deleted"}

    @staticmethod
    def lock_period(db: Session, id: int, locked_by: str = "system"):
        """Kunci periode agar tidak bisa diedit."""
        item = MasterDataService.get_period(db, id)
        if item.is_locked:
            raise HTTPException(status_code=409, detail="Period is already locked")
        item.is_locked = True
        item.locked_at = datetime.now(timezone.utc)
        item.locked_by = locked_by
        db.commit()
        db.refresh(item)
        AuditService.log(
            db, table_name="erp_financial_period", action="LOCK",
            record_id=str(item.id),
            summary=f"Locked period {item.code} ({item.name})",
            new_values={"is_locked": True, "locked_by": locked_by},
            performed_by=locked_by,
        )
        return item

    @staticmethod
    def unlock_period(db: Session, id: int):
        """Buka kunci periode."""
        item = MasterDataService.get_period(db, id)
        if not item.is_locked:
            raise HTTPException(status_code=409, detail="Period is not locked")
        item.is_locked = False
        item.locked_at = None
        item.locked_by = None
        db.commit()
        db.refresh(item)
        AuditService.log(
            db, table_name="erp_financial_period", action="UNLOCK",
            record_id=str(item.id),
            summary=f"Unlocked period {item.code} ({item.name})",
            new_values={"is_locked": False},
        )
        return item

    # ═══════════════════════════════════════════════════════
    # PERIOD CLOSING
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def check_period_status(db: Session, id: int) -> dict:
        """Cek status periode: bisa di-close atau tidak."""
        period = MasterDataService.get_period(db, id)

        # Count DRAFT and POSTED transactions
        draft_count = db.query(ErpPostingTransaction).filter(
            ErpPostingTransaction.period_id == id,
            ErpPostingTransaction.status == "DRAFT",
        ).count()

        posted_count = db.query(ErpPostingTransaction).filter(
            ErpPostingTransaction.period_id == id,
            ErpPostingTransaction.status == "POSTED",
        ).count()

        # Calculate financial totals from journal entries
        result = db.query(
            func.coalesce(func.sum(ErpJournalLine.debit_amount), 0).label("total_debit"),
            func.coalesce(func.sum(ErpJournalLine.credit_amount), 0).label("total_credit"),
        ).join(
            ErpJournalEntry, ErpJournalLine.journal_entry_id == ErpJournalEntry.id
        ).filter(
            ErpJournalEntry.period_id == id,
            ErpJournalEntry.status == "POSTED",
        ).first()

        total_debit = int(result[0] or 0)
        total_credit = int(result[1] or 0)

        # Calculate revenue and expenses from COA types
        rev_result = db.query(
            func.coalesce(func.sum(ErpJournalLine.credit_amount), 0).label("revenue"),
            func.coalesce(func.sum(ErpJournalLine.debit_amount), 0).label("expense"),
        ).join(
            ErpJournalEntry, ErpJournalLine.journal_entry_id == ErpJournalEntry.id
        ).join(
            ErpMasterAccount, ErpMasterAccount.id == ErpJournalLine.account_id
        ).filter(
            ErpJournalEntry.period_id == id,
            ErpJournalEntry.status == "POSTED",
            ErpMasterAccount.type.in_(["REVENUE", "EXPENSE"]),
        ).first()

        total_revenue = int(rev_result[0] or 0)  # Revenue = credit total
        total_expense = int(rev_result[1] or 0)  # Expense = debit total
        net_income = total_revenue - total_expense

        # Determine if can close
        reasons = []
        if period.is_closed:
            reasons.append("Period is already closed")
        if draft_count > 0:
            reasons.append(f"There are {draft_count} DRAFT transaction(s) — post or delete them first")

        can_close = len(reasons) == 0 and not period.is_closed

        return {
            "period_id": period.id,
            "code": period.code,
            "name": period.name,
            "is_locked": period.is_locked,
            "is_closed": period.is_closed,
            "draft_count": draft_count,
            "posted_count": posted_count,
            "total_revenue": total_revenue,
            "total_expenses": total_expense,
            "net_income": net_income,
            "can_close": can_close,
            "reason": "; ".join(reasons) if reasons else None,
        }

    @staticmethod
    def close_period(
        db: Session, id: int, performed_by: str = "system", notes: Optional[str] = None
    ) -> dict:
        """Tutup periode: zero out revenue/expense → Retained Earnings.

        Process:
        1. Validate period can be closed
        2. Create closing journal entry
           DEBIT Revenue accounts (to close them)
           CREDIT Retained Earnings
           DEBIT Retained Earnings
           CREDIT Expense accounts (to close them)
        3. Lock + close period
        4. Log the closing activity
        """
        period = MasterDataService.get_period(db, id)

        if period.is_closed:
            raise HTTPException(status_code=409, detail="Period is already closed")

        # Check DRAFT transactions
        draft_count = db.query(ErpPostingTransaction).filter(
            ErpPostingTransaction.period_id == id,
            ErpPostingTransaction.status == "DRAFT",
        ).count()
        if draft_count > 0:
            raise HTTPException(
                status_code=409,
                detail=f"Cannot close period: {draft_count} DRAFT transaction(s). Post or delete them first.",
            )

        # Calculate revenue and expense totals
        lines = db.query(
            ErpJournalLine.account_id,
            ErpMasterAccount.code,
            ErpMasterAccount.name,
            ErpMasterAccount.type,
            func.coalesce(func.sum(ErpJournalLine.debit_amount), 0).label("total_debit"),
            func.coalesce(func.sum(ErpJournalLine.credit_amount), 0).label("total_credit"),
        ).join(
            ErpJournalEntry, ErpJournalLine.journal_entry_id == ErpJournalEntry.id
        ).join(
            ErpMasterAccount, ErpMasterAccount.id == ErpJournalLine.account_id
        ).filter(
            ErpJournalEntry.period_id == id,
            ErpJournalEntry.status == "POSTED",
            ErpMasterAccount.type.in_(["REVENUE", "EXPENSE"]),
        ).group_by(
            ErpJournalLine.account_id,
            ErpMasterAccount.code,
            ErpMasterAccount.name,
            ErpMasterAccount.type,
        ).all()

        total_revenue = 0
        total_expense = 0
        closing_lines = []

        for acc_id, code, name, acc_type, tot_debit, tot_credit in lines:
            debit = int(tot_debit or 0)
            credit = int(tot_credit or 0)

            if acc_type == "REVENUE":
                balance = credit - debit  # Normal credit balance
                total_revenue += balance
                if balance > 0:
                    # DEBIT revenue account to zero it
                    closing_lines.append({
                        "account_id": acc_id,
                        "account_code": code,
                        "account_name": name,
                        "debit": balance,
                        "credit": 0,
                    })
            elif acc_type == "EXPENSE":
                balance = debit - credit  # Normal debit balance
                total_expense += balance
                if balance > 0:
                    # CREDIT expense account to zero it
                    closing_lines.append({
                        "account_id": acc_id,
                        "account_code": code,
                        "account_name": name,
                        "debit": 0,
                        "credit": balance,
                    })

        net_income = total_revenue - total_expense

        # Need a Retained Earnings account — use the EQUITY account or create placeholder
        # Find first EQUITY account as Retained Earnings destination
        retained_account = db.query(ErpMasterAccount).filter(
            ErpMasterAccount.type == "EQUITY",
        ).first()

        if not retained_account:
            raise HTTPException(
                status_code=400,
                detail="No EQUITY account found. Create an equity account first (e.g. '3-1000 Modal').",
            )

        if net_income > 0:
            # Profit: CREDIT Retained Earnings
            closing_lines.append({
                "account_id": retained_account.id,
                "account_code": retained_account.code,
                "account_name": f"{retained_account.name} (Retained Earnings)",
                "debit": 0,
                "credit": net_income,
            })
        elif net_income < 0:
            # Loss: DEBIT Retained Earnings
            closing_lines.append({
                "account_id": retained_account.id,
                "account_code": retained_account.code,
                "account_name": f"{retained_account.name} (Retained Earnings)",
                "debit": abs(net_income),
                "credit": 0,
            })

        # Generate closing JE number
        next_je = db.query(func.max(ErpJournalEntry.id)).scalar() or 0
        je_number = f"CLOSING-{period.code}-{next_je + 1:04d}"

        # Create the closing journal entry
        now = datetime.now(timezone.utc)
        closing_je = ErpJournalEntry(
            je_number=je_number,
            transaction_id=None,  # System-generated, no source transaction
            transaction_type="PERIOD_CLOSE",
            period_id=id,
            description=f"Period closing for {period.code} ({period.name})",
            status="POSTED",
            posted_at=now,
            posted_by=performed_by,
            entry_date=period.end_date,
            total_debit=total_revenue + (abs(net_income) if net_income < 0 else 0),
            total_credit=total_expense + (net_income if net_income > 0 else 0),
        )
        db.add(closing_je)
        db.flush()

        # Create journal lines
        for i, cl in enumerate(closing_lines, 1):
            line = ErpJournalLine(
                journal_entry_id=closing_je.id,
                line_no=i,
                account_id=cl["account_id"],
                account_code=cl["account_code"],
                account_name=cl["account_name"],
                debit_amount=cl["debit"],
                credit_amount=cl["credit"],
                description=f"Closing entry: {cl['account_name']}",
            )
            db.add(line)

        # Lock and close the period
        period.is_locked = True
        period.locked_at = now
        period.locked_by = performed_by
        period.is_closed = True
        period.closed_at = now
        period.closed_by = performed_by

        # Log the closing
        log = ErpPeriodCloseLog(
            period_id=id,
            action="CLOSE",
            total_revenue=total_revenue,
            total_expenses=total_expense,
            net_income=net_income,
            je_number=je_number,
            notes=notes,
            performed_by=performed_by,
        )
        db.add(log)
        db.commit()
        db.refresh(closing_je)
        db.refresh(period)

        # Audit log
        AuditService.log(
            db, table_name="erp_financial_period", action="CLOSE",
            record_id=str(period.id),
            summary=f"Closed period {period.code}: Rev=Rp {total_revenue:,} Exp=Rp {total_expense:,} Net=Rp {net_income:,}",
            new_values={"is_closed": True, "je_number": je_number, "net_income": net_income},
            performed_by=performed_by,
        )

        return {
            "period": {
                "id": period.id,
                "code": period.code,
                "name": period.name,
                "is_closed": period.is_closed,
                "closed_at": period.closed_at.isoformat() if period.closed_at else None,
            },
            "closing_je": {
                "je_number": je_number,
                "total_debit": closing_je.total_debit,
                "total_credit": closing_je.total_credit,
            },
            "summary": {
                "total_revenue": total_revenue,
                "total_expenses": total_expense,
                "net_income": net_income,
            },
        }

    @staticmethod
    def reopen_period(
        db: Session, id: int, performed_by: str = "system", notes: Optional[str] = None
    ) -> dict:
        """Buka kembali periode yang sudah di-close.

        Warning: This voids the closing journal entry and reopens the period.
        Use with caution — financial data integrity may be affected.
        """
        period = MasterDataService.get_period(db, id)

        if not period.is_closed:
            raise HTTPException(status_code=409, detail="Period is not closed")

        # Find and void the closing journal entries
        closing_jes = db.query(ErpJournalEntry).filter(
            ErpJournalEntry.period_id == id,
            ErpJournalEntry.transaction_type == "PERIOD_CLOSE",
            ErpJournalEntry.status == "POSTED",
        ).all()

        for je in closing_jes:
            je.status = "VOID"

        # Reopen period
        period.is_closed = False
        period.closed_at = None
        period.closed_by = None
        # Keep it locked to prevent accidental posting
        # User must explicitly unlock if they want to post

        # Log
        log = ErpPeriodCloseLog(
            period_id=id,
            action="REOPEN",
            notes=notes or f"Reopened by {performed_by}",
            performed_by=performed_by,
        )
        db.add(log)
        db.commit()
        db.refresh(period)

        # Audit log
        AuditService.log(
            db, table_name="erp_financial_period", action="REOPEN",
            record_id=str(period.id),
            summary=f"Reopened period {period.code} ({period.name})",
            new_values={"is_closed": False, "voided_jes": [je.je_number for je in closing_jes]},
            performed_by=performed_by,
        )

        return {
            "period": {
                "id": period.id,
                "code": period.code,
                "name": period.name,
                "is_closed": period.is_closed,
            },
            "voided_jes": [je.je_number for je in closing_jes],
        }

    @staticmethod
    def get_close_logs(db: Session, period_id: int):
        """Ambil history closing activity untuk satu periode."""
        return db.query(ErpPeriodCloseLog).filter(
            ErpPeriodCloseLog.period_id == period_id,
        ).order_by(ErpPeriodCloseLog.id.desc()).all()

    # ═══════════════════════════════════════════════════════
    # ACCOUNT MAPPING
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_mappings(db: Session, transaction_type: Optional[str] = None) -> list:
        q = db.query(ErpAccountMapping)
        if transaction_type:
            q = q.filter(ErpAccountMapping.transaction_type == transaction_type)
        return q.order_by(ErpAccountMapping.transaction_type, ErpAccountMapping.priority).all()

    @staticmethod
    def create_mapping(db: Session, data) -> ErpAccountMapping:
        item = ErpAccountMapping(**data.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_mapping(db: Session, id: int, data) -> ErpAccountMapping:
        item = db.query(ErpAccountMapping).filter(ErpAccountMapping.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Account mapping not found")
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_mapping(db: Session, id: int):
        item = db.query(ErpAccountMapping).filter(ErpAccountMapping.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Account mapping not found")
        item.is_active = False
        db.commit()
        return {"detail": "Mapping deleted"}
