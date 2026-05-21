"""Reporting — Business logic for all ERP reports.

Step 5: 7 report types — all using direct JOIN + FILTER (no subqueries).

  1. SALES REPORT — Daily/monthly sales breakdown
  2. INCOME STATEMENT — Profit & Loss (Revenue - Expenses)
  3. BALANCE SHEET — Assets = Liabilities + Equity
  4. TRIAL BALANCE — All accounts with debit/credit totals
  5. GENERAL LEDGER — Per-account journal details with running balance
  6. DAILY SUMMARY — Cash flow per day
  7. ACCOUNT ACTIVITY — Detailed account journal entries
"""

from datetime import date, timedelta

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.master_data import (
    ErpMasterAccount,
    ErpMasterProduct,
    ErpMasterCustomer,
    ErpMasterSupplier,
    ErpMasterService,
)
from app.models.inventory import ErpStockMovement
from app.models.purchase import ErpPurchaseOrder
from app.models.sales import ErpSalesOrder
from app.models.posting import (
    ErpPostingTransaction,
    ErpJournalEntry,
    ErpJournalLine,
)
from app.models.finance import ErpBankTransaction


class ReportingService:
    """All reporting business logic — no subqueries, always direct JOINs."""

    # ════════════════════════════════════════════════════════════════
    # 1. SALES REPORT
    # ════════════════════════════════════════════════════════════════

    @staticmethod
    def sales_report(
        db: Session,
        start_date: str,
        end_date: str,
        group_by: str = "DAILY",
    ) -> dict:
        """Sales report grouped by day or month, sourced from ERP Sales Order."""
        start_dt = date.fromisoformat(start_date)
        end_dt = date.fromisoformat(end_date)
        q = db.query(ErpSalesOrder).filter(
            ErpSalesOrder.status == "POSTED",
            ErpSalesOrder.sales_date >= start_dt,
            ErpSalesOrder.sales_date <= end_dt,
        ).order_by(ErpSalesOrder.sales_date.asc()).all()

        if not q:
            return {
                "group_by": group_by,
                "start_date": start_date,
                "end_date": end_date,
                "total_transactions": 0,
                "grand_total": 0,
                "average_order_value": 0,
                "periods": [],
            }

        periods: dict[str, dict] = {}
        total_count = 0
        grand_total = 0

        for tx in q:
            tx_date = tx.sales_date
            if group_by == "DAILY":
                key = tx_date.isoformat()
            else:
                key = tx_date.strftime("%Y-%m")

            if key not in periods:
                periods[key] = {"count": 0, "total": 0}

            periods[key]["count"] += 1
            periods[key]["total"] += tx.total_amount or 0
            total_count += 1
            grand_total += tx.total_amount or 0

        sorted_keys = sorted(periods.keys())
        items = []
        for key in sorted_keys:
            p = periods[key]
            items.append({
                "period_key": key,
                "transaction_count": p["count"],
                "total_amount": p["total"],
                "average_per_transaction": p["total"] // p["count"] if p["count"] else 0,
            })

        return {
            "group_by": group_by,
            "start_date": start_date,
            "end_date": end_date,
            "total_transactions": total_count,
            "grand_total": grand_total,
            "average_order_value": grand_total // total_count if total_count else 0,
            "periods": items,
        }

    @staticmethod
    def dashboard_summary(
        db: Session,
        start_date: str,
        end_date: str,
    ) -> dict:
        """Owner dashboard summary sourced from current ERP transaction modules."""
        start_dt = date.fromisoformat(start_date)
        end_dt = date.fromisoformat(end_date)
        today = date.today()

        posted_sales = db.query(ErpSalesOrder).filter(
            ErpSalesOrder.status == "POSTED",
            ErpSalesOrder.sales_date >= start_dt,
            ErpSalesOrder.sales_date <= end_dt,
        ).all()
        today_sales = [s for s in posted_sales if s.sales_date == today]
        sales_total = sum(int(s.total_amount or 0) for s in posted_sales)
        today_total = sum(int(s.total_amount or 0) for s in today_sales)

        purchase_orders = db.query(ErpPurchaseOrder).filter(
            ErpPurchaseOrder.order_date >= start_dt,
            ErpPurchaseOrder.order_date <= end_dt,
        ).all()
        purchase_total = sum(int(po.total_amount or 0) for po in purchase_orders if po.status != "CANCELLED")

        daily_map: dict[str, dict] = {}
        current = start_dt
        while current <= end_dt:
            key = current.isoformat()
            daily_map[key] = {"date": key, "sales_total": 0, "sales_count": 0}
            current += timedelta(days=1)
        for sale in posted_sales:
            key = sale.sales_date.isoformat()
            if key in daily_map:
                daily_map[key]["sales_total"] += int(sale.total_amount or 0)
                daily_map[key]["sales_count"] += 1

        recent_sales = sorted(posted_sales, key=lambda s: (s.sales_date, s.id), reverse=True)[:5]
        recent_purchase = sorted(purchase_orders, key=lambda p: (p.order_date, p.id), reverse=True)[:5]
        recent_transactions = [
            {
                "type": "SALE",
                "number": s.sales_number,
                "date": s.sales_date.isoformat(),
                "status": s.status,
                "total_amount": int(s.total_amount or 0),
            }
            for s in recent_sales
        ] + [
            {
                "type": "PURCHASE",
                "number": p.po_number,
                "date": p.order_date.isoformat(),
                "status": p.status,
                "total_amount": int(p.total_amount or 0),
            }
            for p in recent_purchase
        ]
        recent_transactions = sorted(recent_transactions, key=lambda x: (x["date"], x["number"]), reverse=True)[:10]

        product_rows = db.query(ErpMasterProduct).filter(ErpMasterProduct.is_active == True).all()
        stock_rows = db.query(
            ErpStockMovement.product_id,
            func.coalesce(func.sum(ErpStockMovement.quantity), 0).label("stock_qty"),
        ).group_by(ErpStockMovement.product_id).all()
        stock_by_product = {pid: int(qty or 0) for pid, qty in stock_rows}
        low_stock_products = []
        for product in product_rows:
            stock_qty = stock_by_product.get(product.id, 0)
            min_stock = int(product.min_stock or 0)
            if stock_qty <= min_stock:
                low_stock_products.append({
                    "id": product.id,
                    "name": product.name,
                    "sku": product.sku,
                    "stock_qty": stock_qty,
                    "min_stock": min_stock,
                })

        return {
            "start_date": start_date,
            "end_date": end_date,
            "kpis": {
                "sales_total": sales_total,
                "today_sales_total": today_total,
                "sales_order_count": len(posted_sales),
                "average_order_value": sales_total // len(posted_sales) if posted_sales else 0,
                "purchase_order_count": len(purchase_orders),
                "purchase_total": purchase_total,
                "active_products": len(product_rows),
                "active_customers": db.query(ErpMasterCustomer).filter(ErpMasterCustomer.is_active == True).count(),
                "active_suppliers": db.query(ErpMasterSupplier).filter(ErpMasterSupplier.is_active == True).count(),
                "active_services": db.query(ErpMasterService).filter(ErpMasterService.is_active == True).count(),
                "low_stock_count": len(low_stock_products),
            },
            "daily_sales": list(daily_map.values()),
            "recent_transactions": recent_transactions,
            "low_stock_products": low_stock_products[:10],
        }

    # ════════════════════════════════════════════════════════════════
    # 2. INCOME STATEMENT (Profit & Loss)
    # ════════════════════════════════════════════════════════════════

    @staticmethod
    def income_statement(
        db: Session,
        start_date: str,
        end_date: str,
    ) -> dict:
        """Income Statement: Revenue - Expenses = Net Income.

        Direct JOIN between journal_line → journal_entry → master_account.
        """
        start_dt = date.fromisoformat(start_date)
        end_dt = date.fromisoformat(end_date)

        # Aggregate journal lines by account using direct joins
        lines = (
            db.query(
                ErpJournalLine.account_id,
                ErpMasterAccount.code,
                ErpMasterAccount.name,
                ErpMasterAccount.type,
                func.coalesce(func.sum(ErpJournalLine.debit_amount), 0).label("total_debit"),
                func.coalesce(func.sum(ErpJournalLine.credit_amount), 0).label("total_credit"),
            )
            .join(
                ErpJournalEntry,
                ErpJournalLine.journal_entry_id == ErpJournalEntry.id,
            )
            .join(
                ErpMasterAccount,
                ErpMasterAccount.id == ErpJournalLine.account_id,
            )
            .filter(
                ErpJournalEntry.status == "POSTED",
                ErpJournalEntry.entry_date >= start_dt,
                ErpJournalEntry.entry_date <= end_dt,
            )
            .group_by(
                ErpJournalLine.account_id,
                ErpMasterAccount.code,
                ErpMasterAccount.name,
                ErpMasterAccount.type,
            )
            .all()
        )

        revenue_items = []
        expense_items = []
        total_revenue = 0
        total_expenses = 0

        for acc_id, code, name, acc_type, tot_debit, tot_credit in lines:
            amount = int(tot_credit or 0) - int(tot_debit or 0)

            if acc_type == "REVENUE":
                revenue_items.append({
                    "account_id": acc_id,
                    "account_code": code,
                    "account_name": name,
                    "amount": amount,
                })
                total_revenue += amount
            elif acc_type == "EXPENSE":
                expense_items.append({
                    "account_id": acc_id,
                    "account_code": code,
                    "account_name": name,
                    "amount": abs(amount),
                })
                total_expenses += abs(amount)

        net_income = total_revenue - total_expenses

        return {
            "period": f"{start_date} — {end_date}",
            "start_date": start_date,
            "end_date": end_date,
            "revenue_items": revenue_items,
            "total_revenue": total_revenue,
            "expense_items": expense_items,
            "total_expenses": total_expenses,
            "gross_profit": total_revenue,
            "net_income": net_income,
        }

    # ════════════════════════════════════════════════════════════════
    # 3. BALANCE SHEET
    # ════════════════════════════════════════════════════════════════

    @staticmethod
    def balance_sheet(
        db: Session,
        as_of_date: str,
    ) -> dict:
        """Balance Sheet: Assets = Liabilities + Equity.

        Direct JOIN journal_line → journal_entry → master_account.
        """
        as_of = date.fromisoformat(as_of_date)

        # Aggregate journal lines by account using direct join
        lines = (
            db.query(
                ErpJournalLine.account_id,
                ErpMasterAccount.code,
                ErpMasterAccount.name,
                ErpMasterAccount.type,
                func.coalesce(func.sum(ErpJournalLine.debit_amount), 0).label("total_debit"),
                func.coalesce(func.sum(ErpJournalLine.credit_amount), 0).label("total_credit"),
            )
            .join(
                ErpJournalEntry,
                ErpJournalLine.journal_entry_id == ErpJournalEntry.id,
            )
            .join(
                ErpMasterAccount,
                ErpMasterAccount.id == ErpJournalLine.account_id,
            )
            .filter(
                ErpJournalEntry.status == "POSTED",
                ErpJournalEntry.entry_date <= as_of,
            )
            .group_by(
                ErpJournalLine.account_id,
                ErpMasterAccount.code,
                ErpMasterAccount.name,
                ErpMasterAccount.type,
            )
            .all()
        )

        assets = []
        liabilities = []
        equity = []
        total_assets = 0
        total_liabilities = 0
        total_equity = 0
        revenue_total = 0
        expense_total = 0

        for acc_id, code, name, acc_type, tot_debit, tot_credit in lines:
            debit = int(tot_debit or 0)
            credit = int(tot_credit or 0)

            if acc_type == "ASSET":
                balance = debit - credit
                if balance != 0:
                    assets.append({
                        "account_id": acc_id,
                        "account_code": code,
                        "account_name": name,
                        "account_type": acc_type,
                        "total_debit": debit,
                        "total_credit": credit,
                        "balance": balance,
                    })
                    total_assets += balance
            elif acc_type == "EQUITY":
                balance = credit - debit
                if balance != 0:
                    equity.append({
                        "account_id": acc_id,
                        "account_code": code,
                        "account_name": name,
                        "account_type": acc_type,
                        "total_debit": debit,
                        "total_credit": credit,
                        "balance": balance,
                    })
                    total_equity += balance
            elif acc_type == "REVENUE":
                revenue_total += credit - debit
            elif acc_type == "EXPENSE":
                expense_total += debit - credit

        # Retained Earnings = Net Income (Revenue - Expenses)
        retained_earnings = revenue_total - expense_total
        if retained_earnings != 0:
            equity.append({
                "account_id": 0,
                "account_code": "3-2000",
                "account_name": "Laba Ditahan (Retained Earnings)",
                "account_type": "EQUITY",
                "total_debit": 0,
                "total_credit": retained_earnings,
                "balance": retained_earnings,
            })
            total_equity += retained_earnings

        total_liab_equity = total_liabilities + total_equity

        return {
            "as_of_date": as_of_date,
            "assets": {
                "section_name": "ASET (Assets)",
                "items": assets,
                "total": total_assets,
            },
            "liabilities": {
                "section_name": "KEWAJIBAN (Liabilities)",
                "items": liabilities,
                "total": total_liabilities,
            },
            "equity": {
                "section_name": "EKUITAS (Equity)",
                "items": equity,
                "total": total_equity,
            },
            "total_assets": total_assets,
            "total_liabilities_equity": total_liab_equity,
        }

    # ════════════════════════════════════════════════════════════════
    # 4. TRIAL BALANCE
    # ════════════════════════════════════════════════════════════════

    @staticmethod
    def trial_balance(
        db: Session,
        as_of_date: str,
    ) -> dict:
        """Trial Balance: All accounts with debit/credit totals.

        Direct JOIN journal_line → journal_entry → master_account.
        """
        as_of = date.fromisoformat(as_of_date)

        lines = (
            db.query(
                ErpJournalLine.account_id,
                ErpMasterAccount.code,
                ErpMasterAccount.name,
                ErpMasterAccount.type,
                func.coalesce(func.sum(ErpJournalLine.debit_amount), 0).label("total_debit"),
                func.coalesce(func.sum(ErpJournalLine.credit_amount), 0).label("total_credit"),
            )
            .join(
                ErpJournalEntry,
                ErpJournalLine.journal_entry_id == ErpJournalEntry.id,
            )
            .join(
                ErpMasterAccount,
                ErpMasterAccount.id == ErpJournalLine.account_id,
            )
            .filter(
                ErpJournalEntry.status == "POSTED",
                ErpJournalEntry.entry_date <= as_of,
            )
            .group_by(
                ErpJournalLine.account_id,
                ErpMasterAccount.code,
                ErpMasterAccount.name,
                ErpMasterAccount.type,
            )
            .order_by(ErpMasterAccount.code)
            .all()
        )

        rows = []
        total_debit = 0
        total_credit = 0

        for acc_id, code, name, acc_type, tot_debit, tot_credit in lines:
            debit = int(tot_debit or 0)
            credit = int(tot_credit or 0)

            if acc_type in ("ASSET", "EXPENSE"):
                closing_balance = debit - credit
            else:
                closing_balance = credit - debit

            rows.append({
                "account_id": acc_id,
                "account_code": code,
                "account_name": name,
                "account_type": acc_type,
                "opening_balance": 0,
                "debit_total": debit,
                "credit_total": credit,
                "closing_balance": closing_balance,
            })
            total_debit += debit
            total_credit += credit

        return {
            "as_of_date": as_of_date,
            "rows": rows,
            "total_debit": total_debit,
            "total_credit": total_credit,
        }

    # ════════════════════════════════════════════════════════════════
    # 5. GENERAL LEDGER
    # ════════════════════════════════════════════════════════════════

    @staticmethod
    def general_ledger(
        db: Session,
        account_id: int,
        start_date: str,
        end_date: str,
    ) -> dict:
        """General Ledger for one account with running balance."""
        account = db.query(ErpMasterAccount).filter(
            ErpMasterAccount.id == account_id
        ).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        start_dt = date.fromisoformat(start_date)
        end_dt = date.fromisoformat(end_date)

        # Opening balance: sum all entry lines BEFORE start_date (direct JOIN)
        opening = (
            db.query(
                func.coalesce(func.sum(ErpJournalLine.debit_amount), 0),
                func.coalesce(func.sum(ErpJournalLine.credit_amount), 0),
            )
            .join(
                ErpJournalEntry,
                ErpJournalLine.journal_entry_id == ErpJournalEntry.id,
            )
            .filter(
                ErpJournalLine.account_id == account_id,
                ErpJournalEntry.status == "POSTED",
                ErpJournalEntry.entry_date < start_dt,
            )
            .first()
        )

        opening_debit = opening[0] or 0
        opening_credit = opening[1] or 0
        if account.type in ("ASSET", "EXPENSE"):
            opening_balance = opening_debit - opening_credit
        else:
            opening_balance = opening_credit - opening_debit

        # Journal entries in period (direct JOIN)
        entries = (
            db.query(
                ErpJournalEntry.entry_date,
                ErpJournalEntry.je_number,
                ErpJournalEntry.description,
                ErpJournalLine.debit_amount,
                ErpJournalLine.credit_amount,
            )
            .join(
                ErpJournalLine,
                ErpJournalLine.journal_entry_id == ErpJournalEntry.id,
            )
            .filter(
                ErpJournalLine.account_id == account_id,
                ErpJournalEntry.status == "POSTED",
                ErpJournalEntry.entry_date >= start_dt,
                ErpJournalEntry.entry_date <= end_dt,
            )
            .order_by(
                ErpJournalEntry.entry_date.asc(),
                ErpJournalEntry.id.asc(),
                ErpJournalLine.line_no.asc(),
            )
            .all()
        )

        running_balance = opening_balance
        entry_list = []

        for entry_date, je_number, description, debit_amt, credit_amt in entries:
            debit = debit_amt or 0
            credit = credit_amt or 0

            if account.type in ("ASSET", "EXPENSE"):
                running_balance += debit - credit
            else:
                running_balance += credit - debit

            entry_list.append({
                "date": entry_date.isoformat(),
                "je_number": je_number,
                "description": description or "",
                "debit_amount": debit,
                "credit_amount": credit,
                "running_balance": running_balance,
            })

        return {
            "account_id": account_id,
            "account_code": account.code,
            "account_name": account.name,
            "period": f"{start_date} — {end_date}",
            "opening_balance": opening_balance,
            "entries": entry_list,
            "closing_balance": running_balance,
        }

    # ════════════════════════════════════════════════════════════════
    # 6. DAILY SUMMARY
    # ════════════════════════════════════════════════════════════════

    @staticmethod
    def daily_summary(
        db: Session,
        start_date: str,
        end_date: str,
    ) -> dict:
        """Daily cash flow summary — sales, expenses, net per day."""
        start_dt = date.fromisoformat(start_date)
        end_dt = date.fromisoformat(end_date)

        # Sales per day from ERP Sales Order
        sales = (
            db.query(
                ErpSalesOrder.sales_date,
                func.count(ErpSalesOrder.id).label("tx_count"),
                func.coalesce(func.sum(ErpSalesOrder.total_amount), 0).label("total"),
            )
            .filter(
                ErpSalesOrder.status == "POSTED",
                ErpSalesOrder.sales_date >= start_dt,
                ErpSalesOrder.sales_date <= end_dt,
            )
            .group_by(ErpSalesOrder.sales_date)
            .order_by(ErpSalesOrder.sales_date)
            .all()
        )

        # Expenses per day
        expenses = (
            db.query(
                ErpPostingTransaction.transaction_date,
                func.coalesce(func.sum(ErpPostingTransaction.total_amount), 0).label("total"),
            )
            .filter(
                ErpPostingTransaction.transaction_type == "EXPENSE",
                ErpPostingTransaction.status == "POSTED",
                ErpPostingTransaction.transaction_date >= start_dt,
                ErpPostingTransaction.transaction_date <= end_dt,
            )
            .group_by(ErpPostingTransaction.transaction_date)
            .all()
        )

        # Build daily map
        day_map: dict[str, dict] = {}

        for tx_date, tx_count, total in sales:
            key = tx_date.isoformat()
            day_map[key] = {
                "date": key,
                "total_sales": int(total or 0),
                "total_expenses": 0,
                "total_payments_received": 0,
                "net_cash_flow": 0,
                "transaction_count": int(tx_count or 0),
            }

        for tx_date, total in expenses:
            key = tx_date.isoformat()
            if key in day_map:
                day_map[key]["total_expenses"] += int(total or 0)

        # Fill missing days
        current = start_dt
        while current <= end_dt:
            key = current.isoformat()
            if key not in day_map:
                day_map[key] = {
                    "date": key,
                    "total_sales": 0,
                    "total_expenses": 0,
                    "total_payments_received": 0,
                    "net_cash_flow": 0,
                    "transaction_count": 0,
                }
            current += timedelta(days=1)

        # Calculate net cash flow
        grand_sales = 0
        grand_expenses = 0
        days_list = []

        for key in sorted(day_map.keys()):
            d = day_map[key]
            d["net_cash_flow"] = d["total_sales"] - d["total_expenses"]
            grand_sales += d["total_sales"]
            grand_expenses += d["total_expenses"]
            days_list.append(d)

        return {
            "start_date": start_date,
            "end_date": end_date,
            "days": days_list,
            "grand_total_sales": grand_sales,
            "grand_total_expenses": grand_expenses,
            "grand_net_cash_flow": grand_sales - grand_expenses,
        }

    # ════════════════════════════════════════════════════════════════
    # 7. ACCOUNT ACTIVITY
    # ════════════════════════════════════════════════════════════════

    @staticmethod
    def account_activity(
        db: Session,
        account_id: int,
        start_date: str,
        end_date: str,
    ) -> dict:
        """Detailed account activity with all journal entries."""
        account = db.query(ErpMasterAccount).filter(
            ErpMasterAccount.id == account_id
        ).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

        start_dt = date.fromisoformat(start_date)
        end_dt = date.fromisoformat(end_date)

        entries = (
            db.query(
                ErpJournalEntry.entry_date,
                ErpJournalEntry.je_number,
                ErpJournalEntry.transaction_type,
                ErpPostingTransaction.doc_number,
                ErpJournalLine.description,
                ErpJournalLine.debit_amount,
                ErpJournalLine.credit_amount,
            )
            .join(
                ErpJournalLine,
                ErpJournalLine.journal_entry_id == ErpJournalEntry.id,
            )
            .outerjoin(
                ErpPostingTransaction,
                ErpPostingTransaction.id == ErpJournalEntry.transaction_id,
            )
            .filter(
                ErpJournalLine.account_id == account_id,
                ErpJournalEntry.status == "POSTED",
                ErpJournalEntry.entry_date >= start_dt,
                ErpJournalEntry.entry_date <= end_dt,
            )
            .order_by(
                ErpJournalEntry.entry_date.asc(),
                ErpJournalEntry.id.asc(),
                ErpJournalLine.line_no.asc(),
            )
            .all()
        )

        running_balance = 0
        entry_list = []
        total_debit = 0
        total_credit = 0

        for entry_date, je_number, tx_type, doc_number, desc, debit_amt, credit_amt in entries:
            debit = debit_amt or 0
            credit = credit_amt or 0

            if account.type in ("ASSET", "EXPENSE"):
                running_balance += debit - credit
            else:
                running_balance += credit - debit

            total_debit += debit
            total_credit += credit

            entry_list.append({
                "entry_date": entry_date.isoformat(),
                "je_number": je_number,
                "transaction_type": tx_type,
                "doc_number": doc_number,
                "description": desc or "",
                "debit": debit,
                "credit": credit,
                "balance": running_balance,
            })

        return {
            "account_id": account_id,
            "account_code": account.code,
            "account_name": account.name,
            "period": f"{start_date} — {end_date}",
            "entries": entry_list,
            "total_debit": total_debit,
            "total_credit": total_credit,
            "closing_balance": running_balance,
        }
