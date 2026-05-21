"""
Salon Eyelash ERP - Python Report Microservice
Generates PDF, CSV, and Excel reports for all modules
"""
import io, csv
from datetime import datetime, date
import psycopg2, psycopg2.extras
import pandas as pd
from fastapi import FastAPI, Query
from fastapi.responses import Response, StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

app = FastAPI(title="Salon Eyelash Reports", docs_url=None, redoc_url=None)

DB_CONFIG = {
    "host": "db",
    "port": 5432,
    "user": "salon",
    "password": "salon123",
    "dbname": "salon_eyelash",
}


def get_conn():
    return psycopg2.connect(**DB_CONFIG)


def fmt_rp(v):
    return "Rp{:,.0f}".format(float(v or 0)).replace(",", ".")


def make_pdf(title, headers, rows, col_widths=None):
    """Generic PDF generator - returns bytes"""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=18*mm, rightMargin=18*mm,
                            topMargin=18*mm, bottomMargin=18*mm)
    styles = getSampleStyleSheet()
    elements = [Paragraph(title, styles["Title"]), Spacer(1, 6*mm)]

    table_data = [headers] + rows
    if col_widths is None:
        col_widths = [180/len(headers)*mm] * len(headers)

    t = Table(table_data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#D48989")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FFF5F5")]),
        ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
    ]))
    elements.append(t)
    doc.build(elements)
    buf.seek(0)
    return buf.read()


# ─── Health ─────────────────────────────────────────────
@app.get("/api/reports/health")
def health():
    return {"status": "ok", "service": "python-reports"}


# ─── Generic query helpers ──────────────────────────────
def _query(sql, params=None):
    """Execute SELECT, return list of dicts"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params or [])
            return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()


def _df(sql, params=None):
    """Execute SELECT, return DataFrame"""
    conn = get_conn()
    try:
        return pd.read_sql_query(sql, conn, params=params or [])
    finally:
        conn.close()


def _date_filter(col):
    return f"({col}::date >= %s AND {col}::date <= %s)"


# ─── 1. TRANSACTIONS ──────────────────────────────────
TRANS_SQL = """SELECT transaction_code AS kode, transaction_date::text AS tanggal,
                      customer_name AS customer, staff_name AS therapist,
                      subtotal, discount, tax, grand_total AS total, payment_status AS status
               FROM transactions
               WHERE {df} ORDER BY transaction_date DESC"""


@app.get("/api/reports/transactions/csv")
def trans_csv(start_date: str = None, end_date: str = None):
    df = _df(TRANS_SQL.format(df=_date_filter("transaction_date")), [start_date, end_date])
    out = io.StringIO()
    df.to_csv(out, index=False)
    out.seek(0)
    return Response(out.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": "attachment; filename=transactions.csv"})


@app.get("/api/reports/transactions/excel")
def trans_excel(start_date: str = None, end_date: str = None):
    df = _df(TRANS_SQL.format(df=_date_filter("transaction_date")), [start_date, end_date])
    out = io.BytesIO()
    with pd.ExcelWriter(out, engine="openpyxl") as w:
        df.to_excel(w, sheet_name="Transaksi", index=False)
    out.seek(0)
    return StreamingResponse(out, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                             headers={"Content-Disposition": "attachment; filename=transactions.xlsx"})


@app.get("/api/reports/transactions/pdf")
def trans_pdf(start_date: str = None, end_date: str = None):
    rows = _query(
        """SELECT transaction_code, transaction_date::text, customer_name, staff_name, grand_total, payment_status
           FROM transactions WHERE {df} ORDER BY transaction_date DESC LIMIT 100""".format(
            df=_date_filter("transaction_date")), [start_date, end_date])
    data = [[r["transaction_code"], (r["transaction_date"] or " ")[:10],
             r["customer_name"] or "-", r["staff_name"] or "-",
             fmt_rp(r["grand_total"]), r["payment_status"]] for r in rows]
    pdf = make_pdf("Laporan Transaksi",
                   ["Kode", "Tanggal", "Customer", "Therapist", "Total", "Status"],
                   data, [40*mm, 28*mm, 35*mm, 30*mm, 30*mm, 22*mm])
    return Response(pdf, media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=transactions.pdf"})


# ─── 2. THERAPIST ──────────────────────────────────────
THER_SQL = """SELECT ti.staff_name AS therapist,
                     COUNT(DISTINCT t.transaction_id) AS transaksi,
                     SUM(ti.qty) AS layanan,
                     SUM(ti.line_total) AS omzet
              FROM transaction_items ti
              JOIN transactions t ON t.transaction_id = ti.transaction_id
              WHERE {df} GROUP BY ti.staff_name ORDER BY omzet DESC"""


@app.get("/api/reports/therapist/csv")
def ther_csv(start_date: str = None, end_date: str = None):
    df = _df(THER_SQL.format(df=_date_filter("t.transaction_date")), [start_date, end_date])
    out = io.StringIO()
    df.to_csv(out, index=False)
    out.seek(0)
    return Response(out.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": "attachment; filename=therapist_revenue.csv"})


@app.get("/api/reports/therapist/excel")
def ther_excel(start_date: str = None, end_date: str = None):
    df = _df(THER_SQL.format(df=_date_filter("t.transaction_date")), [start_date, end_date])
    out = io.BytesIO()
    with pd.ExcelWriter(out, engine="openpyxl") as w:
        df.to_excel(w, sheet_name="Therapist", index=False)
    out.seek(0)
    return StreamingResponse(out, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                             headers={"Content-Disposition": "attachment; filename=therapist_revenue.xlsx"})


@app.get("/api/reports/therapist/pdf")
def ther_pdf(start_date: str = None, end_date: str = None):
    rows = _query(
        """SELECT ti.staff_name, COUNT(DISTINCT t.transaction_id) AS cnt,
                  SUM(ti.qty) AS qty, SUM(ti.line_total) AS rev
           FROM transaction_items ti JOIN transactions t ON t.transaction_id=ti.transaction_id
           WHERE {df} GROUP BY ti.staff_name ORDER BY rev DESC""".format(
            df=_date_filter("t.transaction_date")), [start_date, end_date])
    data = [[r["staff_name"], str(r["cnt"]), str(r["qty"]), fmt_rp(r["rev"])] for r in rows]
    pdf = make_pdf("Performa Therapist", ["Therapist", "Transaksi", "Layanan", "Omzet"],
                   data, [50*mm, 30*mm, 30*mm, 40*mm])
    return Response(pdf, media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=therapist_revenue.pdf"})


# ─── 3. SERVICES ───────────────────────────────────────
SVC_SQL = """SELECT ti.item_name AS layanan, SUM(ti.qty) AS terjual, SUM(ti.line_total) AS omzet
             FROM transaction_items ti JOIN transactions t ON t.transaction_id=ti.transaction_id
             WHERE {df} GROUP BY ti.item_name ORDER BY terjual DESC"""


@app.get("/api/reports/services/csv")
def svc_csv(start_date: str = None, end_date: str = None):
    df = _df(SVC_SQL.format(df=_date_filter("t.transaction_date")), [start_date, end_date])
    out = io.StringIO()
    df.to_csv(out, index=False)
    out.seek(0)
    return Response(out.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": "attachment; filename=layanan_terjual.csv"})


@app.get("/api/reports/services/excel")
def svc_excel(start_date: str = None, end_date: str = None):
    df = _df(SVC_SQL.format(df=_date_filter("t.transaction_date")), [start_date, end_date])
    out = io.BytesIO()
    with pd.ExcelWriter(out, engine="openpyxl") as w:
        df.to_excel(w, sheet_name="Layanan", index=False)
    out.seek(0)
    return StreamingResponse(out, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                             headers={"Content-Disposition": "attachment; filename=layanan_terjual.xlsx"})


@app.get("/api/reports/services/pdf")
def svc_pdf(start_date: str = None, end_date: str = None):
    rows = _query(
        """SELECT ti.item_name, SUM(ti.qty) AS qty, SUM(ti.line_total) AS rev
           FROM transaction_items ti JOIN transactions t ON t.transaction_id=ti.transaction_id
           WHERE {df} GROUP BY ti.item_name ORDER BY qty DESC""".format(
            df=_date_filter("t.transaction_date")), [start_date, end_date])
    data = [[r["item_name"], str(r["qty"]), fmt_rp(r["rev"])] for r in rows]
    pdf = make_pdf("Layanan Terjual", ["Layanan", "Terjual", "Omzet"],
                   data, [70*mm, 30*mm, 40*mm])
    return Response(pdf, media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=layanan_terjual.pdf"})


# ─── 4. EXPENSES ───────────────────────────────────────
EXP_SQL = """SELECT expense_date::text AS tanggal, category AS kategori,
                    description AS deskripsi, amount AS jumlah, payment_method AS metode
             FROM expenses WHERE {df} ORDER BY expense_date DESC"""


@app.get("/api/reports/expenses/csv")
def exp_csv(start_date: str = None, end_date: str = None):
    df = _df(EXP_SQL.format(df=_date_filter("expense_date")), [start_date, end_date])
    out = io.StringIO()
    df.to_csv(out, index=False)
    out.seek(0)
    return Response(out.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": "attachment; filename=pengeluaran.csv"})


@app.get("/api/reports/expenses/excel")
def exp_excel(start_date: str = None, end_date: str = None):
    df = _df(EXP_SQL.format(df=_date_filter("expense_date")), [start_date, end_date])
    out = io.BytesIO()
    with pd.ExcelWriter(out, engine="openpyxl") as w:
        df.to_excel(w, sheet_name="Pengeluaran", index=False)
    out.seek(0)
    return StreamingResponse(out, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                             headers={"Content-Disposition": "attachment; filename=pengeluaran.xlsx"})


@app.get("/api/reports/expenses/pdf")
def exp_pdf(start_date: str = None, end_date: str = None):
    rows = _query(
        """SELECT expense_date::text, category, description, amount, payment_method
           FROM expenses WHERE {df} ORDER BY expense_date DESC""".format(
            df=_date_filter("expense_date")), [start_date, end_date])
    data = [[r["expense_date"][:10], r["category"], (r["description"] or "-")[:30],
             fmt_rp(r["amount"]), r["payment_method"]] for r in rows]
    pdf = make_pdf("Pengeluaran", ["Tanggal", "Kategori", "Deskripsi", "Jumlah", "Metode"],
                   data, [28*mm, 32*mm, 45*mm, 32*mm, 28*mm])
    return Response(pdf, media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=pengeluaran.pdf"})


# ─── 5. PROFIT & LOSS ─────────────────────────────────
@app.get("/api/reports/profit-loss")
def pl_data(start_date: str = None, end_date: str = None):
    rev = _query(f"SELECT COALESCE(SUM(grand_total),0) AS val FROM transactions WHERE {_date_filter('transaction_date')}",
                 [start_date, end_date])
    exp = _query(f"SELECT COALESCE(SUM(amount),0) AS val FROM expenses WHERE {_date_filter('expense_date')}",
                 [start_date, end_date])
    revenue = float(rev[0]["val"]) if rev else 0
    expenses = float(exp[0]["val"]) if exp else 0
    profit = revenue - expenses
    return {"success": True, "data": {
        "revenue": revenue, "expenses": expenses, "profit": profit,
        "revenue_fmt": fmt_rp(revenue), "expenses_fmt": fmt_rp(expenses),
        "profit_fmt": fmt_rp(profit),
    }}


@app.get("/api/reports/profit-loss/pdf")
def pl_pdf(start_date: str = None, end_date: str = None):
    rev = _query(f"SELECT COALESCE(SUM(grand_total),0) AS v FROM transactions WHERE {_date_filter('transaction_date')}",
                 [start_date, end_date])
    exp = _query(f"SELECT COALESCE(SUM(amount),0) AS v FROM expenses WHERE {_date_filter('expense_date')}",
                 [start_date, end_date])
    revenue = float(rev[0]["v"]) if rev else 0
    expenses = float(exp[0]["v"]) if exp else 0
    profit = revenue - expenses

    data = [["Pendapatan", fmt_rp(revenue)], ["Pengeluaran", fmt_rp(expenses)],
            ["Laba Bersih", fmt_rp(profit)]]
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm)
    styles = getSampleStyleSheet()
    elements = [Paragraph("Laporan Laba Rugi", styles["Title"]), Spacer(1, 6*mm)]
    t = Table([["Keterangan", "Jumlah"], *data], colWidths=[80*mm, 50*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#D48989")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#E8F7EC")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#FFF5F5")]),
    ]))
    elements.append(t)
    doc.build(elements)
    buf.seek(0)
    return Response(buf.read(), media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=profit_loss.pdf"})
