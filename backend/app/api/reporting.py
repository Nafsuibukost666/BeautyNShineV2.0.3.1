"""Reporting — FastAPI router.

Step 5: 7 report endpoints for business intelligence & accounting.
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.reporting import ReportingService

router = APIRouter(prefix="/erp/api/v1/reports", tags=["Reports"])


def _ok(data, status_code: int = 200):
    """Quick helper — data is already plain dict from report service."""
    return JSONResponse({"success": True, "data": data},
                        status_code=status_code)


# ═══════════════════════════════════════════════════════════════════
# 0. DASHBOARD SUMMARY
# ═══════════════════════════════════════════════════════════════════

@router.get("/dashboard-summary")
def get_dashboard_summary(
"""Ambil ringkasan dashboard."""
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """📌 Dashboard owner summary from Sales, Purchase, Master, and Inventory."""
    return _ok(ReportingService.dashboard_summary(db, start_date, end_date))


# ═══════════════════════════════════════════════════════════════════
# 1. SALES REPORT
# ═══════════════════════════════════════════════════════════════════

@router.get("/sales")
def get_sales_report(
"""Ambil laporan penjualan."""
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    group_by: str = Query("DAILY", regex="^(DAILY|MONTHLY)$"),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """📊 Sales report — daily or monthly.

    Total penjualan, jumlah transaksi, rata-rata per transaksi.
    """
    return _ok(ReportingService.sales_report(db, start_date, end_date, group_by))


# ═══════════════════════════════════════════════════════════════════
# 2. INCOME STATEMENT (P&L)
# ═══════════════════════════════════════════════════════════════════

@router.get("/income-statement")
def get_income_statement(
"""Ambil laporan laba rugi."""
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """💰 Income Statement — Profit & Loss.

    Revenue − Expenses = Net Income untuk periode tertentu.
    """
    return _ok(ReportingService.income_statement(db, start_date, end_date))


# ═══════════════════════════════════════════════════════════════════
# 3. BALANCE SHEET
# ═══════════════════════════════════════════════════════════════════

@router.get("/balance-sheet")
def get_balance_sheet(
"""Ambil laporan neraca (balance sheet)."""
    as_of_date: str = Query(..., description="Tanggal laporan (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """🏦 Balance Sheet — Neraca.

    Aset = Kewajiban + Ekuitas pada tanggal tertentu.
    """
    return _ok(ReportingService.balance_sheet(db, as_of_date))


# ═══════════════════════════════════════════════════════════════════
# 4. TRIAL BALANCE
# ═══════════════════════════════════════════════════════════════════

@router.get("/trial-balance")
def get_trial_balance(
"""Ambil neraca saldo (trial balance)."""
    as_of_date: str = Query(..., description="Tanggal laporan (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """⚖️ Trial Balance — Neraca Saldo.

    Semua akun dengan total DEBIT dan CREDIT. Total DEBIT = Total CREDIT.
    """
    return _ok(ReportingService.trial_balance(db, as_of_date))


# ═══════════════════════════════════════════════════════════════════
# 5. GENERAL LEDGER
# ═══════════════════════════════════════════════════════════════════

@router.get("/general-ledger")
def get_general_ledger(
"""Ambil laporan buku besar."""
    account_id: int = Query(..., description="Account ID"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """📒 General Ledger — Buku Besar.

    Detail jurnal per akun dengan saldo berjalan (running balance).
    """
    return _ok(ReportingService.general_ledger(db, account_id, start_date, end_date))


# ═══════════════════════════════════════════════════════════════════
# 6. DAILY SUMMARY
# ═══════════════════════════════════════════════════════════════════

@router.get("/daily-summary")
def get_daily_summary(
"""Ambil ringkasan penjualan harian."""
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """📅 Daily Summary — Ringkasan Harian.

    Per hari: total sales, expenses, net cash flow.
    """
    return _ok(ReportingService.daily_summary(db, start_date, end_date))


# ═══════════════════════════════════════════════════════════════════
# 7. ACCOUNT ACTIVITY
# ═══════════════════════════════════════════════════════════════════

@router.get("/account-activity")
def get_account_activity(
"""Ambil aktivitas per akun."""
    account_id: int = Query(..., description="Account ID"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    _auth=Depends(get_current_user),
):
    """📋 Account Activity — Aktivitas Akun.

    Semua entry jurnal untuk satu akun dengan detail transaksi.
    """
    return _ok(ReportingService.account_activity(db, account_id, start_date, end_date))
