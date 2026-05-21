"""POS Integration Service — Business logic untuk menerima sync dari POS.

Mencatat transaksi POS dan settlement ke tabel ERP, serta
mengenerate nomor dokumen ERP otomatis via DocumentRegistryService.

Juga auto-membuat jurnal akuntansi (via Posting Engine) setiap kali
transaksi POS diterima.
"""
import json
from datetime import datetime, date, timezone
from dateutil import parser as dt_parser
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.pos_integration import (
    ErpPosTransactionSync,
    ErpPosSettlement,
)
from app.services.document_registry import DocumentRegistryService
from app.services.posting import PostingEngineService
from app.schemas.posting import (
    ErpPostingTransactionCreate,
    ErpPostingLineCreate,
)
from app.models.sales import ErpSalesOrder, ErpSalesOrderItem
from app.models.inventory import ErpStockMovement
from app.models.master_data import ErpMasterProduct, ErpMasterService, ErpMasterCustomer


class PosIntegrationService:
    """Service layer untuk sinkronisasi POS ke ERP."""

    # ═══════════════════════════════════════════════════════
    # DEFAULT ACCOUNT MAPPINGS (auto-created on first sync)
    # ═══════════════════════════════════════════════════════

    _DEFAULT_SALE_MAPPINGS: list[dict] = [
        {
            "transaction_type": "SALE",
            "account_code": "1-110",      # Kas (Asset)
            "debit_or_credit": "DEBIT",
            "priority": 10,
            "is_active": True,
        },
        {
            "transaction_type": "SALE",
            "account_code": "4-100",      # Pendapatan Jasa (Revenue)
            "debit_or_credit": "CREDIT",
            "priority": 20,
            "is_active": True,
        },
    ]

    @staticmethod
    def _ensure_sale_mappings(db: Session) -> bool:
        """Create default SALE account mappings if none exist.

        Resolves account_code to account_id from the database.
        These mappings are used by AutoJournalService instead of ErpPostingRule.

        Returns True if mappings were created, False if they already existed.
        """
        from app.models.master_data import ErpMasterAccount, ErpAccountMapping

        existing_count = (
            db.query(ErpAccountMapping)
            .filter(
                ErpAccountMapping.transaction_type == "SALE",
                ErpAccountMapping.is_active == True,
            )
            .count()
        )
        if existing_count >= 2:
            return False  # Already have mappings

        for map_data in PosIntegrationService._DEFAULT_SALE_MAPPINGS:
            account_code = map_data.pop("account_code")
            account = db.query(ErpMasterAccount).filter(
                ErpMasterAccount.code == account_code,
                ErpMasterAccount.is_active == True,
            ).first()
            if not account:
                raise HTTPException(
                    status_code=500,
                    detail=f"Account code '{account_code}' not found in COA. "
                            f"Seed the chart of accounts first.",
                )
            map_data["account_id"] = account.id
            mapping = ErpAccountMapping(**map_data)
            db.add(mapping)
        db.flush()
        return True

    # ═══════════════════════════════════════════════════════
    # AUTO JOURNAL FROM POS SYNC
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def _auto_create_journal_from_sync(
        db: Session,
        sync_record: ErpPosTransactionSync,
    ) -> Optional[dict]:
        """Create and post a SALE transaction in the Posting Engine
        from a POS sync record, which auto-generates a journal entry.

        Steps:
          1. Ensure SALE account mappings exist
          2. Create DRAFT posting transaction referencing the POS sync
          3. POST the transaction → triggers AutoJournalService → creates journal

        Returns a dict with transaction info, or None on failure.
        """
        # 1. Ensure account mappings
        PosIntegrationService._ensure_sale_mappings(db)

        # 2. Build transaction date
        raw_date = sync_record.date
        if isinstance(raw_date, datetime):
            tx_date = raw_date.date()
        else:
            tx_date = date.today()

        # 3. Build the create schema
        tx_data = ErpPostingTransactionCreate(
            transaction_type="SALE",
            ref_table="erp_pos_transaction_sync",
            ref_id=str(sync_record.id),
            total_amount=sync_record.grand_total,
            notes=f"Auto-journal from POS: {sync_record.code}",
            transaction_date=tx_date,
            lines=[
                ErpPostingLineCreate(
                    line_no=1,
                    product_name=f"POS Transaction: {sync_record.code}",
                    quantity=1,
                    unit_price=sync_record.grand_total,
                    subtotal=sync_record.grand_total,
                ),
            ],
        )

        # 4. Create draft transaction (calls db.commit internally)
        tx = PostingEngineService.create_transaction(db, tx_data, username="system")

        # 5. Post it → triggers AutoJournalService → creates journal
        tx_posted = PostingEngineService.post_transaction(
            db, tx.id, posted_by="system",
        )

        return {
            "transaction_id": tx_posted.id,
            "doc_number": tx_posted.doc_number,
            "status": tx_posted.status,
        }

    # ═══════════════════════════════════════════════════════
    # POS TRANSACTION
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def _create_sales_order_from_sync(
        db: Session, record: ErpPosTransactionSync, data,
    ) -> Optional[ErpSalesOrder]:
        """Create ErpSalesOrder (POSTED) from a POS sync record.
        
        Also creates stock movement OUT for product-type items.
        Uses the original `data` payload (already parsed) instead of
        the serialized JSON in `record.items` to avoid issues with
        detached instances after intermediate commits.
        Returns the sales order or None if creation fails.
        """
        from app.models.inventory import ErpStockMovement
        from app.models.master_data import ErpMasterProduct, ErpMasterCustomer
        from sqlalchemy import func

        try:
            # Parse record date
            raw_date = record.date
            if isinstance(raw_date, datetime):
                raw_date = raw_date.date()

            # Find or create default customer  
            customer = None
            if record.customer_name and record.customer_name != "Walk-in":
                customer = db.query(ErpMasterCustomer).filter(
                    ErpMasterCustomer.name == record.customer_name,
                    ErpMasterCustomer.is_active == True,
                ).first()
                if not customer:
                    customer = ErpMasterCustomer(
                        name=record.customer_name,
                        is_active=True,
                    )
                    db.add(customer)
                    db.flush()

            # Use data.items directly (already parsed)
            so_items = []
            product_map = {}

            # Get all active products for matching
            all_products = {}
            for p in db.query(ErpMasterProduct).filter(ErpMasterProduct.is_active == True).all():
                all_products[p.name.lower()] = p

            for item in data.items:
                item_name = (item.item_name or "").strip().lower()
                qty = item.qty or 1
                unit_price = item.unit_price or 0

                # Try to match product by name
                product = all_products.get(item_name)
                if product:
                    product_map[product.id] = {"qty": qty, "name": product.name}
                    so_items.append(ErpSalesOrderItem(
                        product_id=product.id,
                        quantity=qty,
                        unit_price=unit_price,
                        discount_amount=item.discount or 0,
                        subtotal=qty * unit_price,
                        notes=f"POS: {item.item_name}",
                    ))

            if not so_items:
                record.notes = (record.notes or "") + "\n[SO: no matching products]"
                return None  # No product items found, skip SO

            subtotal = sum(it.quantity * it.unit_price for it in so_items)
            discount = int(record.discount or 0)
            total = max(0, subtotal - discount)

            # Generate sales number
            prefix = f"POS-{raw_date.strftime('%Y%m%d')}"
            count = db.query(ErpSalesOrder).filter(
                ErpSalesOrder.sales_number.like(f"{prefix}-%"),
            ).count() + 1
            sales_number = f"{prefix}-{count:04d}"

            # Create Sales Order
            so = ErpSalesOrder(
                sales_number=sales_number,
                customer_id=customer.id if customer else None,
                sales_date=raw_date,
                status="POSTED",
                payment_method=None,
                subtotal_amount=subtotal,
                discount_amount=discount,
                tax_amount=0,
                total_amount=total,
                notes=f"Auto from POS sync: {record.code}",
                posted_at=datetime.now(timezone.utc),
                created_by="pos-sync",
                updated_by="pos-sync",
            )
            so.items = so_items
            db.add(so)
            db.flush()

            # Create stock movement OUT for each product
            for product_id, info in product_map.items():
                before = db.query(func.coalesce(func.sum(ErpStockMovement.quantity), 0)).filter(
                    ErpStockMovement.product_id == product_id,
                ).scalar() or 0
                before_int = int(before)
                after_int = before_int - info["qty"]
                move = ErpStockMovement(
                    product_id=product_id,
                    movement_type="OUT",
                    quantity=-info["qty"],
                    unit_cost=0,
                    total_cost=0,
                    reference_type="SALE",
                    reference_id=f"POS-{record.id}",
                    notes=f"POS auto: {info['name']}",
                    movement_date=raw_date,
                    balance_before=before_int,
                    balance_after=after_int,
                    performed_by="pos-sync",
                )
                db.add(move)
            db.flush()
            return so
        except Exception as exc:
            # Don't fail the POS sync if SO creation fails
            record.notes = (record.notes or "") + f"\n[SO creation failed: {exc}]"
            return None

    @staticmethod
    def capture_transaction(db: Session, data) -> ErpPosTransactionSync:
        """Terima dan simpan transaksi dari POS ke ERP.

        1. Serialize items & payments ke JSON string untuk disimpan di Text column
        2. Buat record ErpPosTransactionSync
        3. Generate doc_key via DocumentRegistryService
        4. Auto-create journal entry via Posting Engine
        5. Set synced_at timestamp
        """
        # Serialize JSON fields
        items_json = json.dumps(
            [i.model_dump() for i in data.items],
            default=str,
        ) if data.items else "[]"

        payments_json = json.dumps(
            [p.model_dump() for p in data.payments],
            default=str,
        ) if data.payments else "[]"

        # Parse ISO date strings (Pydantic should have already parsed it)
        raw_date = data.date
        parsed_date = raw_date if isinstance(raw_date, datetime) else dt_parser.parse(raw_date)

        # Buat record
        record = ErpPosTransactionSync(
            pos_transaction_id=data.id,
            code=data.code,
            date=parsed_date,
            customer_name=data.customer_name,
            subtotal=data.subtotal,
            discount=data.discount,
            grand_total=data.grand_total,
            payment_status=data.payment_status,
            notes=data.notes,
            items=items_json,
            payments=payments_json,
            source=data.source,
            synced_at=datetime.now(timezone.utc),
        )
        db.add(record)
        db.flush()

        # Generate doc_key via DocumentRegistry
        try:
            doc_service = DocumentRegistryService()
            doc_record = doc_service.generate_key(
                db,
                module="POS",
                branch="BSD",
                ref_table="erp_pos_transaction_sync",
                ref_id=str(record.id),
                notes=f"POS Transaction: {data.code}",
            )
            record.doc_key = doc_record.doc_key
        except Exception as exc:
            # Jika gagal generate doc_key, tetap simpan transaksi
            # tanpa doc_key — bisa di-retry nanti
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate document key: {str(exc)}",
            ) from exc

        db.commit()
        db.refresh(record)

        # ═══════════════════════════════════════════════════════
        # AUTO-CREATE JOURNAL ENTRY
        # ═══════════════════════════════════════════════════════
        # After saving the POS sync, also create and post a SALE
        # transaction in the Posting Engine. This auto-generates
        # a double-entry journal (Debit Kas, Credit Pendapatan Jasa).
        #
        # We wrap in try/except so journal failure doesn't prevent
        # the POS sync from succeeding — the sync is the primary goal.
        try:
            PosIntegrationService._auto_create_journal_from_sync(db, record)
        except Exception as exc:
            # Journal creation failed — log but don't fail the sync
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"POS sync succeeded but journal creation failed: {str(exc)}",
            ) from exc

        # ═══════════════════════════════════════════════════════
        # AUTO-CREATE SALES ORDER
        # ═══════════════════════════════════════════════════════
        # Also create ErpSalesOrder + stock movement OUT for any
        # product-type items in the POS transaction. This ensures
        # POS sales appear in Sales Order reports and deduct stock.
        try:
            PosIntegrationService._create_sales_order_from_sync(db, record, data)
        except Exception as exc:
            # Don't fail the sync — the SO creation is additive
            record.notes = (record.notes or "") + f"\n[SO creation exception: {exc}]"
        db.commit()

        db.refresh(record)
        return record

    # ═══════════════════════════════════════════════════════
    # POS SETTLEMENT
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def create_settlement(db: Session, data) -> ErpPosSettlement:
        """Terima dan simpan settlement sesi POS ke ERP.

        1. Serialize payment_breakdown ke JSON string
        2. Buat record ErpPosSettlement
        3. Generate doc_key via DocumentRegistryService
        4. Set synced_at timestamp
        """
        # Serialize JSON field
        payment_breakdown_json = json.dumps(
            data.payment_breakdown, default=str,
        ) if data.payment_breakdown else None

        # Buat record
        record = ErpPosSettlement(
            pos_session_id=data.session_id,
            session_code=data.session_code,
            opened_at=data.opened_at,
            closed_at=data.closed_at,
            opened_by=data.opened_by,
            opening_cash=data.opening_cash,
            closing_cash=data.closing_cash,
            expected_cash=data.expected_cash,
            difference=data.difference,
            total_sales=data.total_sales,
            total_transactions=data.total_transactions,
            notes=data.notes,
            payment_breakdown=payment_breakdown_json,
            synced_at=datetime.now(timezone.utc),
        )
        db.add(record)
        db.flush()

        # Generate doc_key via DocumentRegistry
        try:
            doc_service = DocumentRegistryService()
            doc_record = doc_service.generate_key(
                db,
                module="POS",
                branch="BSD",
                ref_table="erp_pos_settlement",
                ref_id=str(record.id),
                notes=f"POS Settlement: {data.session_code}",
            )
            record.doc_key = doc_record.doc_key
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate document key: {str(exc)}",
            ) from exc

        db.commit()
        db.refresh(record)
        return record

    # ═══════════════════════════════════════════════════════
    # QUERY HELPERS
    # ═══════════════════════════════════════════════════════

    @staticmethod
    def list_transactions(
        db: Session,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """Daftar transaksi POS yang sudah di-sync dengan pagination."""
        q = db.query(ErpPosTransactionSync)
        total = q.count()
        items = (
            q.order_by(ErpPosTransactionSync.synced_at.desc(),
                       ErpPosTransactionSync.id.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return {"items": items, "total": total, "page": page, "per_page": per_page}

    @staticmethod
    def list_settlements(
        db: Session,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """Daftar settlement POS yang sudah di-sync dengan pagination."""
        q = db.query(ErpPosSettlement)
        total = q.count()
        items = (
            q.order_by(ErpPosSettlement.synced_at.desc(),
                       ErpPosSettlement.id.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return {"items": items, "total": total, "page": page, "per_page": per_page}
