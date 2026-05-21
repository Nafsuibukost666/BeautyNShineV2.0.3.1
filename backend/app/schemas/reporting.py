"""Reporting — Pydantic response schemas.

Step 5: Sales reports, financial statements, and analytics.
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class AccountBalanceItem(BaseModel):
    """Single account with balance info."""

    account_id: int
    account_code: str
    account_name: str
    account_type: str
    total_debit: int = 0
    total_credit: int = 0
    balance: int = 0


class IncomeStatementItem(BaseModel):
    """Single line in P&L report."""

    account_id: int
    account_code: str
    account_name: str
    amount: int = 0


class IncomeStatementReport(BaseModel):
    """Profit & Loss report output."""

    period: str
    start_date: str
    end_date: str
    revenue_items: list[IncomeStatementItem] = []
    total_revenue: int = 0
    expense_items: list[IncomeStatementItem] = []
    total_expenses: int = 0
    gross_profit: int = 0
    net_income: int = 0


class BalanceSheetSection(BaseModel):
    """A section of the balance sheet (Assets / Liabilities / Equity)."""

    section_name: str
    items: list[AccountBalanceItem] = []
    total: int = 0


class BalanceSheetReport(BaseModel):
    """Balance sheet output."""

    as_of_date: str
    assets: BalanceSheetSection
    liabilities: BalanceSheetSection
    equity: BalanceSheetSection
    total_assets: int = 0
    total_liabilities_equity: int = 0


class TrialBalanceRow(BaseModel):
    """Single row in trial balance."""

    account_id: int
    account_code: str
    account_name: str
    account_type: str
    opening_balance: int = 0
    debit_total: int = 0
    credit_total: int = 0
    closing_balance: int = 0


class TrialBalanceReport(BaseModel):
    """Trial balance output."""

    as_of_date: str
    rows: list[TrialBalanceRow] = []
    total_debit: int = 0
    total_credit: int = 0


class GeneralLedgerRow(BaseModel):
    """Single journal line in general ledger."""

    date: str
    je_number: str
    description: str
    debit_amount: int = 0
    credit_amount: int = 0
    running_balance: int = 0


class GeneralLedgerReport(BaseModel):
    """General ledger for one account."""

    account_id: int
    account_code: str
    account_name: str
    period: str
    opening_balance: int = 0
    entries: list[GeneralLedgerRow] = []
    closing_balance: int = 0


class SalesReportItem(BaseModel):
    """Single day or period in sales report."""

    period_key: str  # e.g. "2026-05-18" or "2026-05"
    transaction_count: int = 0
    total_amount: int = 0
    average_per_transaction: int = 0


class SalesReport(BaseModel):
    """Sales report output."""

    group_by: str  # DAILY / MONTHLY
    start_date: str
    end_date: str
    total_transactions: int = 0
    grand_total: int = 0
    periods: list[SalesReportItem] = []


class DailySummary(BaseModel):
    """Summary for a single day."""

    date: str
    total_sales: int = 0
    total_expenses: int = 0
    total_payments_received: int = 0
    net_cash_flow: int = 0
    transaction_count: int = 0


class DailySummaryReport(BaseModel):
    """Daily cash flow summary."""

    start_date: str
    end_date: str
    days: list[DailySummary] = []
    grand_total_sales: int = 0
    grand_total_expenses: int = 0
    grand_net_cash_flow: int = 0


class AccountActivityRow(BaseModel):
    """Single journal entry for account activity."""

    entry_date: str
    je_number: str
    transaction_type: str
    doc_number: Optional[str] = None
    description: str
    debit: int = 0
    credit: int = 0
    balance: int = 0


class AccountActivityReport(BaseModel):
    """Detailed account activity for one account."""

    account_id: int
    account_code: str
    account_name: str
    period: str
    entries: list[AccountActivityRow] = []
    total_debit: int = 0
    total_credit: int = 0
    closing_balance: int = 0
