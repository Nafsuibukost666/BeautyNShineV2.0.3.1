"""Posting Engine + Auto Journal Service.

Step 2: Create/manage posting transactions (SALE, EXPENSE, PAYMENT, etc.)
Step 3: Auto-generate journal entries when a transaction is POSTED.
"""
from datetime import datetime, date
from typing import Optional, Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.posting import (
    ErpPostingTransaction,
    ErpPostingLine,
    ErpPostingRule,
    ErpJournalEntry,
    ErpJournalLine,
)
from app.models.master_data import ErpFinancialPeriod, ErpMasterAccount, ErpAccountMapping
from app.services.document_registry import DocumentRegistryService
from app.services.audit import AuditService

_doc_registry = DocumentRegistryService()


class PostingEngineService:
    """ERP Posting Engine — business logic for transaction recording."""

    @staticmethod
    def _get_period_id(db: Session, transaction_date: date) -> int:
        """Find the financial period for a given date. Auto-create if missing."""
        period = (
            db.query(ErpFinancialPeriod)
            .filter(
                ErpFinancialPeriod.start_date <= transaction_date,
                ErpFinancialPeriod.end_date >= transaction_date,
            )
            .first()
        )
        if period:
            return period.id
        # Auto-create period
        code = transaction_date.strftime("%Y-%m")
        name = transaction_date.strftime("%B %Y")
        period = ErpFinancialPeriod(
            code=code,
            name=name,
            start_date=transaction_date.replace(day=1),
            end_date=date(transaction_date.year, transaction_date.month, 28 if transaction_date.month != 2 else 28),  # simplified
        )
        db.add(period)
        db.flush()
        return period.id

    @staticmethod
    def create_transaction(
        db: Session, data, username: str = "system"
    ) -> ErpPostingTransaction:
        """Create a new posting transaction (DRAFT status).

        Generates document number from registry.
        """
        # Auto-assign period
        period_id = data.period_id or PostingEngineService._get_period_id(
            db, data.transaction_date
        )

        # Generate document number
        branch = "MAIN"
        module_map = {
            "SALE": "POS",
            "EXPENSE": "EXP",
            "PAYMENT": "PMT",
            "PURCHASE": "PUR",
            "ADJUSTMENT": "ADJ",
        }
        doc_module = module_map.get(data.transaction_type, "TRX")
        doc_record = _doc_registry.generate_key(
            db, module=doc_module, branch=branch
        )
        doc_number = doc_record.doc_key

        # Create transaction
        tx = ErpPostingTransaction(
            doc_number=doc_number,
            transaction_type=data.transaction_type,
            ref_table=data.ref_table,
            ref_id=data.ref_id,
            total_amount=data.total_amount,
            status="DRAFT",
            period_id=period_id,
            notes=data.notes,
            transaction_date=data.transaction_date,
        )
        db.add(tx)
        db.flush()

        # Create lines
        total_calc = 0
        for i, line_data in enumerate(data.lines):
            subtotal = line_data.subtotal or (
                line_data.quantity * line_data.unit_price
            )
            total_calc += subtotal
            line = ErpPostingLine(
                transaction_id=tx.id,
                line_no=i + 1,
                product_id=line_data.product_id,
                product_name=line_data.product_name,
                quantity=line_data.quantity,
                unit_price=line_data.unit_price,
                subtotal=subtotal,
                discount_amount=line_data.discount_amount or 0,
                tax_amount=line_data.tax_amount or 0,
                tax_id=line_data.tax_id,
                notes=line_data.notes,
            )
            db.add(line)

        # Use calculated total if not provided
        if data.total_amount == 0 and total_calc > 0:
            tx.total_amount = total_calc

        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def get_transaction(db: Session, id: int) -> ErpPostingTransaction:
        tx = db.query(ErpPostingTransaction).filter(
            ErpPostingTransaction.id == id
        ).first()
        if not tx:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return tx

    @staticmethod
    def list_transactions(
        db: Session,
        transaction_type: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ):
        q = db.query(ErpPostingTransaction)
        if transaction_type:
            q = q.filter(ErpPostingTransaction.transaction_type == transaction_type)
        if status:
            q = q.filter(ErpPostingTransaction.status == status)
        total = q.count()
        items = (
            q.order_by(ErpPostingTransaction.id.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return {"items": items, "total": total, "page": page, "per_page": per_page}

    @staticmethod
    def post_transaction(
        db: Session, id: int, posted_by: str = "system"
    ) -> ErpPostingTransaction:
        """Post a DRAFT transaction → POSTED + auto-generate journal entries.

        Step 2 → Step 3 handoff.
        """
        tx = PostingEngineService.get_transaction(db, id)
        if tx.status != "DRAFT":
            raise HTTPException(
                status_code=409,
                detail=f"Transaction is already {tx.status}",
            )

        # Check period is not locked
        if tx.period_id:
            period = db.query(ErpFinancialPeriod).filter(
                ErpFinancialPeriod.id == tx.period_id
            ).first()
            if period and period.is_locked:
                raise HTTPException(
                    status_code=409,
                    detail="Financial period is locked. Cannot post transaction.",
                )

        tx.status = "POSTED"
        tx.posted_at = datetime.now()
        tx.posted_by = posted_by
        db.flush()

        # ═══════════════════════════════════════════════════════
        # Step 3: Auto-generate journal entry
        # ═══════════════════════════════════════════════════════
        AutoJournalService.generate_journal(db, tx)

        db.commit()
        db.refresh(tx)

        # Audit log: POST transaction
        AuditService.log(
            db, table_name="erp_posting_transaction", action="POST",
            record_id=str(tx.id),
            summary=f"Posted {tx.doc_number} ({tx.transaction_type}) Rp {tx.total_amount:,}",
            new_values={"status": "POSTED", "doc_number": tx.doc_number,
                        "total_amount": tx.total_amount, "transaction_type": tx.transaction_type},
            performed_by=posted_by,
        )

        return tx

    @staticmethod
    def cancel_transaction(
        db: Session, id: int, notes: Optional[str] = None
    ) -> ErpPostingTransaction:
        """Cancel a POSTED transaction → CANCELLED + void journal entries."""
        tx = PostingEngineService.get_transaction(db, id)
        if tx.status != "POSTED":
            raise HTTPException(
                status_code=409,
                detail=f"Cannot cancel transaction with status {tx.status}",
            )

        # Void associated journal entries
        journals = db.query(ErpJournalEntry).filter(
            ErpJournalEntry.transaction_id == id,
            ErpJournalEntry.status == "POSTED",
        ).all()
        for je in journals:
            je.status = "VOID"

        tx.status = "CANCELLED"
        tx.notes = (tx.notes or "") + (f"\nCancelled: {notes}" if notes else "\nCancelled")
        db.commit()
        db.refresh(tx)

        # Audit log: CANCEL transaction
        AuditService.log(
            db, table_name="erp_posting_transaction", action="CANCEL",
            record_id=str(tx.id),
            summary=f"Cancelled {tx.doc_number} ({tx.transaction_type})",
            old_values={"status": "POSTED"},
            new_values={"status": "CANCELLED"},
            performed_by="system",
        )

        return tx

    @staticmethod
    def calculate_totals(db: Session, id: int) -> dict:
        """Recalculate total_debit and total_credit for a transaction's journals."""
        journals = (
            db.query(ErpJournalEntry)
            .filter(ErpJournalEntry.transaction_id == id)
            .all()
        )
        total_debit = sum(je.total_debit for je in journals)
        total_credit = sum(je.total_credit for je in journals)
        return {
            "total_debit": total_debit,
            "total_credit": total_credit,
            "balanced": total_debit == total_credit,
        }


class AutoJournalService:
    """Auto Journal Entry — generates double-entry journals from transactions.

    Uses ErpAccountMapping to determine which accounts to debit/credit.
    """

    @staticmethod
    def generate_journal(db: Session, tx: ErpPostingTransaction) -> ErpJournalEntry:
        """Generate journal entry for a posted transaction based on account mappings.

        Returns the created journal entry.
        """
        # Get active account mappings for this transaction type
        rules = (
            db.query(ErpAccountMapping)
            .filter(
                ErpAccountMapping.transaction_type == tx.transaction_type,
                ErpAccountMapping.is_active == True,
            )
            .order_by(ErpAccountMapping.priority)
            .all()
        )

        if not rules:
            # No mappings defined — cannot auto-generate journal
            raise HTTPException(
                status_code=400,
                detail=f"No account mappings defined for transaction type '{tx.transaction_type}'. "
                        f"Create account mappings first, then post the transaction.",
            )

        # Generate JE number
        branch = "MAIN"
        je_record = _doc_registry.generate_key(
            db, module="JE", branch=branch
        )
        je_number = je_record.doc_key

        # Create journal entry
        je = ErpJournalEntry(
            je_number=je_number,
            transaction_id=tx.id,
            transaction_type=tx.transaction_type,
            period_id=tx.period_id,
            description=f"Auto-journal for {tx.doc_number} ({tx.transaction_type})",
            status="POSTED",
            posted_at=datetime.now(),
            posted_by=tx.posted_by or "system",
            entry_date=tx.transaction_date,
            total_debit=0,
            total_credit=0,
        )
        db.add(je)
        db.flush()

        # Create journal lines from rules
        total_debit = 0
        total_credit = 0
        for i, rule in enumerate(rules):
            account = db.query(ErpMasterAccount).filter(
                ErpMasterAccount.id == rule.account_id
            ).first()
            account_code = account.code if account else ""
            account_name = account.name if account else ""

            amount = AutoJournalService._calculate_rule_amount(tx, rule)

            if rule.debit_or_credit == "DEBIT":
                debit_amount = amount
                credit_amount = 0
                total_debit += amount
            else:
                debit_amount = 0
                credit_amount = amount
                total_credit += amount

            line = ErpJournalLine(
                journal_entry_id=je.id,
                line_no=i + 1,
                account_id=rule.account_id,
                account_code=account_code,
                account_name=account_name,
                debit_amount=debit_amount,
                credit_amount=credit_amount,
                description=f"{tx.transaction_type} - {tx.doc_number}",
            )
            db.add(line)

        # Update totals
        je.total_debit = total_debit
        je.total_credit = total_credit

        return je

    @staticmethod
    def _calculate_rule_amount(tx: ErpPostingTransaction, rule: Any) -> int:
        """Calculate the amount for a posting rule based on transaction data.

        For now: uses total_amount. In production, could use line-level logic.
        """
        return tx.total_amount

    @staticmethod
    def list_journals(
        db: Session,
        transaction_type: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ):
        q = db.query(ErpJournalEntry)
        if transaction_type:
            q = q.filter(ErpJournalEntry.transaction_type == transaction_type)
        total = q.count()
        items = (
            q.order_by(ErpJournalEntry.id.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return {"items": items, "total": total, "page": page, "per_page": per_page}

    @staticmethod
    def get_journal(db: Session, id: int) -> ErpJournalEntry:
        je = db.query(ErpJournalEntry).filter(ErpJournalEntry.id == id).first()
        if not je:
            raise HTTPException(status_code=404, detail="Journal entry not found")
        return je

    @staticmethod
    def get_journal_by_transaction(
        db: Session, transaction_id: int
    ) -> list[ErpJournalEntry]:
        return (
            db.query(ErpJournalEntry)
            .filter(ErpJournalEntry.transaction_id == transaction_id)
            .all()
        )


# ─── Posting Rules CRUD ───────────────────────────────────────────

class PostingRuleService:
    """CRUD for posting rules."""

    @staticmethod
    def list_rules(
        db: Session,
        transaction_type: Optional[str] = None,
    ):
        q = db.query(ErpPostingRule)
        if transaction_type:
            q = q.filter(ErpPostingRule.transaction_type == transaction_type)
        return q.order_by(ErpPostingRule.transaction_type, ErpPostingRule.priority).all()

    @staticmethod
    def get_rule(db: Session, id: int):
        rule = db.query(ErpPostingRule).filter(ErpPostingRule.id == id).first()
        if not rule:
            raise HTTPException(status_code=404, detail="Posting rule not found")
        return rule

    @staticmethod
    def create_rule(db: Session, data):
        rule = ErpPostingRule(**data.model_dump())
        db.add(rule)
        db.commit()
        db.refresh(rule)
        return rule

    @staticmethod
    def update_rule(db: Session, id: int, data):
        rule = PostingRuleService.get_rule(db, id)
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(rule, key, val)
        db.commit()
        db.refresh(rule)
        return rule

    @staticmethod
    def delete_rule(db: Session, id: int):
        rule = PostingRuleService.get_rule(db, id)
        db.delete(rule)
        db.commit()
        return {"detail": "Posting rule deleted"}
