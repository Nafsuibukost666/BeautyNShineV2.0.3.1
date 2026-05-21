"""Finance / Bank / Asset — Business logic.

Bank: CRUD rekening + catat transaksi dengan auto-update balance.
Asset: CRUD aset tetap + kalkulasi penyusutan straight-line.
"""
from datetime import date, datetime
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.finance import (
    ErpBankAccount,
    ErpBankTransaction,
    ErpFixedAsset,
    ErpAssetDepreciation,
)


class BankAccountService:
    """CRUD & balance management untuk rekening bank."""

    @staticmethod
    def list_accounts(db: Session, account_type: Optional[str] = None):
        q = db.query(ErpBankAccount)
        if account_type:
            q = q.filter(ErpBankAccount.account_type == account_type)
        return q.order_by(ErpBankAccount.account_name).all()

    @staticmethod
    def get_account(db: Session, id: int):
        item = db.query(ErpBankAccount).filter(ErpBankAccount.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Bank account not found")
        return item

    @staticmethod
    def create_account(db: Session, data):
        item = ErpBankAccount(
            account_name=data.account_name,
            bank_name=data.bank_name,
            account_number=data.account_number,
            account_type=data.account_type,
            currency=data.currency,
            opening_balance=data.opening_balance,
            current_balance=data.opening_balance,  # Saldo awal = opening balance
            branch_id=data.branch_id,
            notes=data.notes,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_account(db: Session, id: int, data):
        item = BankAccountService.get_account(db, id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(item, key, val)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def delete_account(db: Session, id: int):
        item = BankAccountService.get_account(db, id)
        item.is_active = False
        db.commit()
        return {"detail": "Bank account deactivated"}

    @staticmethod
    def record_transaction(db: Session, data) -> ErpBankTransaction:
        """Catat transaksi bank + update saldo otomatis."""
        account = BankAccountService.get_account(db, data.bank_account_id)
        balance_before = account.current_balance

        if data.transaction_type == "DEPOSIT":
            balance_after = balance_before + data.amount
        elif data.transaction_type == "WITHDRAWAL":
            if balance_before < data.amount:
                raise HTTPException(status_code=400, detail="Insufficient balance")
            balance_after = balance_before - data.amount
        elif data.transaction_type == "TRANSFER_OUT":
            if balance_before < data.amount:
                raise HTTPException(status_code=400, detail="Insufficient balance")
            balance_after = balance_before - data.amount
            # Credit destination account
            if data.transfer_to_account_id:
                dest = BankAccountService.get_account(db, data.transfer_to_account_id)
                dest.current_balance += data.amount
        elif data.transaction_type == "TRANSFER_IN":
            balance_after = balance_before + data.amount
        else:
            raise HTTPException(status_code=400, detail=f"Invalid transaction type: {data.transaction_type}")

        # Update balance
        account.current_balance = balance_after

        tx = ErpBankTransaction(
            bank_account_id=data.bank_account_id,
            transaction_type=data.transaction_type,
            amount=data.amount,
            transaction_date=data.transaction_date or date.today(),
            description=data.description,
            ref_table=data.ref_table,
            ref_id=data.ref_id,
            transfer_to_account_id=data.transfer_to_account_id,
            balance_before=balance_before,
            balance_after=balance_after,
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def list_transactions(
        db: Session,
        bank_account_id: Optional[int] = None,
        transaction_type: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ):
        q = db.query(ErpBankTransaction)
        if bank_account_id:
            q = q.filter(ErpBankTransaction.bank_account_id == bank_account_id)
        if transaction_type:
            q = q.filter(ErpBankTransaction.transaction_type == transaction_type)
        total = q.count()
        items = q.order_by(ErpBankTransaction.id.desc()).offset((page-1)*per_page).limit(per_page).all()
        return {"items": items, "total": total, "page": page, "per_page": per_page}

    @staticmethod
    def get_transaction(db: Session, id: int):
        tx = db.query(ErpBankTransaction).filter(ErpBankTransaction.id == id).first()
        if not tx:
            raise HTTPException(status_code=404, detail="Bank transaction not found")
        return tx


class FixedAssetService:
    """CRUD & depreciation untuk aset tetap."""

    @staticmethod
    def list_assets(db: Session, category: Optional[str] = None, status: Optional[str] = None):
        q = db.query(ErpFixedAsset)
        if category:
            q = q.filter(ErpFixedAsset.category == category)
        if status:
            q = q.filter(ErpFixedAsset.status == status)
        return q.order_by(ErpFixedAsset.asset_code).all()

    @staticmethod
    def get_asset(db: Session, id: int):
        item = db.query(ErpFixedAsset).filter(ErpFixedAsset.id == id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Fixed asset not found")
        return item

    @staticmethod
    def create_asset(db: Session, data):
        book_value = data.purchase_price - data.residual_value
        item = ErpFixedAsset(
            asset_code=data.asset_code,
            name=data.name,
            category=data.category,
            purchase_date=data.purchase_date,
            purchase_price=data.purchase_price,
            useful_life_years=data.useful_life_years,
            residual_value=data.residual_value,
            depreciation_method=data.depreciation_method,
            book_value=book_value,
            branch_id=data.branch_id,
            notes=data.notes,
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def update_asset(db: Session, id: int, data):
        item = FixedAssetService.get_asset(db, id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(item, key, val)
        # Recalculate book value if relevant fields changed
        if data.model_dump(exclude_unset=True).keys() & {"purchase_price", "residual_value", "accumulated_depreciation"}:
            item.book_value = item.purchase_price - item.accumulated_depreciation
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def dispose_asset(db: Session, id: int, disposed_at: date, disposal_price: int = 0, notes: Optional[str] = None):
        """Menjual / menghapus aset."""
        item = FixedAssetService.get_asset(db, id)
        item.status = "DISPOSED"
        item.disposed_at = disposed_at
        item.disposal_price = disposal_price
        if notes:
            item.notes = (item.notes or "") + f"\nDisposed: {notes}"
        db.commit()
        db.refresh(item)
        return item

    @staticmethod
    def calculate_depreciation(db: Session, id: int, period_code: str) -> ErpAssetDepreciation:
        """Hitung penyusutan untuk satu periode (straight-line).

        Rumus: (purchase_price - residual_value) / useful_life_years / 12
        """
        asset = FixedAssetService.get_asset(db, id)

        if asset.status in ("DISPOSED", "SOLD", "FULLY_DEPRECIATED"):
            raise HTTPException(status_code=400, detail="Asset is already disposed or fully depreciated")

        if asset.accumulated_depreciation >= (asset.purchase_price - asset.residual_value):
            raise HTTPException(status_code=400, detail="Asset is already fully depreciated")

        # Cek duplikasi periode
        existing = db.query(ErpAssetDepreciation).filter(
            ErpAssetDepreciation.asset_id == id,
            ErpAssetDepreciation.period_code == period_code,
        ).first()
        if existing:
            raise HTTPException(status_code=409, detail=f"Depreciation for period {period_code} already exists")

        # Straight-line: (harga beli - residu) / masa manfaat / 12 bulan
        depreciable_amount = asset.purchase_price - asset.residual_value
        monthly_depreciation = depreciable_amount // (asset.useful_life_years * 12)

        # Jika sisa penyusutan kurang dari 1 bulan, ambil sisanya
        remaining = depreciable_amount - asset.accumulated_depreciation
        depreciation_amount = min(monthly_depreciation, remaining)

        accumulated_after = asset.accumulated_depreciation + depreciation_amount
        book_value_after = asset.purchase_price - accumulated_after

        dep = ErpAssetDepreciation(
            asset_id=id,
            period_code=period_code,
            depreciation_amount=depreciation_amount,
            accumulated_after=accumulated_after,
            book_value_after=book_value_after,
        )
        db.add(dep)

        # Update asset
        asset.accumulated_depreciation = accumulated_after
        asset.book_value = book_value_after
        if accumulated_after >= depreciable_amount:
            asset.status = "FULLY_DEPRECIATED"

        db.commit()
        db.refresh(dep)
        return dep

    @staticmethod
    def get_depreciation_history(db: Session, asset_id: int):
        return db.query(ErpAssetDepreciation).filter(
            ErpAssetDepreciation.asset_id == asset_id
        ).order_by(ErpAssetDepreciation.period_code.desc()).all()
