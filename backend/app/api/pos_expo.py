"""POS Expo API — Endpoints khusus untuk POS Expo frontend.

Prefix: /erp/api/v1
Berisi endpoint yang POS Expo panggil langsung via nginx rewrite:
  /api/* → /erp/api/v1/*

Endpoint:
  GET /initial-data  → services, products, customers, staff
"""
from typing import Any, Optional

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.master_data import (
    ErpMasterService,
    ErpMasterProduct,
    ErpMasterCustomer,
    ErpMasterStaff,
)

router = APIRouter(prefix="/erp/api/v1", tags=["POS Expo"])


def _serialize_simple(obj: Any) -> Any:
    """Serialize ORM object to plain dict."""
    if obj is None:
        return None
    if isinstance(obj, (str, int, float, bool)):
        return obj
    import datetime as _dt
    if isinstance(obj, (_dt.datetime, _dt.date, _dt.time)):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: _serialize_simple(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_serialize_simple(item) for item in obj]
    mapper = sa_inspect(obj)
    if mapper is not None:
        return {c.key: _serialize_simple(getattr(obj, c.key))
                for c in mapper.mapper.column_attrs}
    return obj


def _ok(data, status_code: int = 200):
    """Helper untuk mengembalikan response JSON standar.

    Membungkus data dalam format {"success": True, "data": ...}.

    Args:
        data: Data response
        status_code: HTTP status code (default: 200)

    Returns:
        JSONResponse dengan wrapper success
    """
    return JSONResponse({"success": True, "data": data}, status_code=status_code)


@router.get("/initial-data")
def get_initial_data(db: Session = Depends(get_db)):
    """Return initial data for POS Expo: services, products, customers, staff."""

    # Services
    services_q = db.query(ErpMasterService).filter(
        ErpMasterService.is_active == True
    ).all()
    services = []
    for s in services_q:
        services.append({
            "id": str(s.id),
            "name": s.name,
            "category": s.category or "",
            "price": s.price,
            "duration_min": s.duration,
        })

    # Products
    products_q = db.query(ErpMasterProduct).filter(
        ErpMasterProduct.is_active == True
    ).all()
    products = []
    for p in products_q:
        products.append({
            "id": str(p.id),
            "name": p.name,
            "category": p.category or "",
            "sku": p.sku or "",
            "selling_price": p.selling_price,
            "stock_qty": 0,  # simplified for now
        })

    # Customers
    customers_q = db.query(ErpMasterCustomer).filter(
        ErpMasterCustomer.is_active == True
    ).all()
    customers = []
    for c in customers_q:
        customers.append({
            "id": str(c.id),
            "name": c.name,
            "phone": c.phone or "",
            "instagram": "",
            "notes": c.notes or "",
            "total_visit": c.total_visits,
            "total_spending": 0,
        })

    # Staff
    staff_q = db.query(ErpMasterStaff).filter(
        ErpMasterStaff.is_active == True
    ).all()
    staff = []
    for s in staff_q:
        staff.append({
            "id": str(s.id),
            "name": s.name,
            "role": s.role or "",
            "commission_type": s.commission_type or "",
            "commission_value": s.commission_value or 0,
            "kabin": s.kabin or "",
        })

    return _ok({
        "services": services,
        "products": products,
        "customers": customers,
        "staff": staff,
    })


@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Return dashboard statistics: today's transactions, revenue, customers, bookings."""
    import datetime as _dt

    today_start = _dt.datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + _dt.timedelta(days=1)

    # Today's transactions
    from app.models.pos_integration import ErpPosTransactionSync
    today_trx = db.query(ErpPosTransactionSync).filter(
        ErpPosTransactionSync.date >= today_start,
        ErpPosTransactionSync.date < today_end,
    ).all()
    today_count = len(today_trx)
    today_revenue = sum(t.grand_total or 0 for t in today_trx)

    # Total customers
    from app.models.master_data import ErpMasterCustomer
    total_customers = db.query(ErpMasterCustomer).filter(
        ErpMasterCustomer.is_active == True
    ).count()

    # Pending bookings (not DONE)
    from app.models.booking import ErpBookingRecord
    pending_bookings = db.query(ErpBookingRecord).filter(
        ErpBookingRecord.status != "DONE"
    ).count()

    return _ok({
        "todayTransactions": today_count,
        "todayRevenue": today_revenue,
        "totalCustomers": total_customers,
        "pendingBookings": pending_bookings,
    })


import json as _json
import datetime as _dt


@router.post("/transaction", status_code=201)
def create_pos_transaction(
"""Buat transaksi POS baru."""
    body: dict,
    db: Session = Depends(get_db),
):
    """Buat transaksi POS baru.

    Request body:
    {
        customer?: { name: string, phone?: string, instagram?: string },
        items: [{ item_type, item_name, qty, unit_price, discount, staff_id?, staff_name? }],
        payments: [{ method, amount, reference_no? }],
        discount?: number,
        session_id?: string,
        notes?: string
    }
    Response: { success: true, data: { code, ... } }
    """
    items = body.get("items", [])
    payments = body.get("payments", [])
    discount = int(body.get("discount", 0))
    session_id = body.get("session_id")
    notes = body.get("notes")

    if not items:
        from fastapi import HTTPException
        raise HTTPException(400, "Minimal satu item diperlukan")

    # Hitung subtotal & grand total
    subtotal = sum(
        (int(i.get("unit_price", 0)) * int(i.get("qty", 1)))
        - int(i.get("discount", 0))
        for i in items
    )
    grand_total = max(0, subtotal - discount)

    # Generate transaction code: TRX-001-YYYYMMDD-NNNN
    now = _dt.datetime.now()
    date_str = now.strftime("%Y%m%d")
    prefix = f"TRX-001-{date_str}-"

    # Use existing ErpPosTransactionSync table
    from app.models.pos_integration import ErpPosTransactionSync

    last_tx = db.query(ErpPosTransactionSync).filter(
        ErpPosTransactionSync.code.like(f"{prefix}%")
    ).order_by(ErpPosTransactionSync.code.desc()).first()

    seq = 1
    if last_tx:
        parts = last_tx.code.split("-")
        try:
            seq = int(parts[-1]) + 1
        except (ValueError, IndexError):
            seq = 1

    code = f"{prefix}{seq:04d}"

    # Build items JSON
    items_json = _json.dumps([{
        "item_type": i.get("item_type"),
        "item_name": i.get("item_name"),
        "qty": int(i.get("qty", 1)),
        "unit_price": int(i.get("unit_price", 0)),
        "discount": int(i.get("discount", 0)),
        "line_total": int(i.get("unit_price", 0)) * int(i.get("qty", 1)),
        "staff_id": i.get("staff_id"),
        "staff_name": i.get("staff_name"),
    } for i in items])

    payments_json = _json.dumps([{
        "method": p.get("method"),
        "amount": int(p.get("amount", 0)),
        "reference_no": p.get("reference_no"),
    } for p in payments])

    customer_name = ""
    if body.get("customer") and body["customer"].get("name"):
        customer_name = body["customer"]["name"]

    record = ErpPosTransactionSync(
        pos_transaction_id=code,
        code=code,
        date=now,
        customer_name=customer_name or None,
        subtotal=subtotal,
        discount=discount,
        grand_total=grand_total,
        payment_status="PAID",
        notes=notes,
        items=items_json,
        payments=payments_json,
        source="POS_EXPO",
        synced_at=now,
    )
    db.add(record)

    # Update session total_sales if session_id provided
    if session_id:
        try:
            from app.models.pos_integration import ErpPosSession
            sid = int(session_id)
            session = db.query(ErpPosSession).filter(
                ErpPosSession.id == sid
            ).first()
            if session and session.status == "OPEN":
                session.total_sales = (session.total_sales or 0) + grand_total
                session.total_transactions = (session.total_transactions or 0) + 1
        except (ValueError, TypeError):
            pass

    db.commit()
    db.refresh(record)

    return _ok({
        "id": record.id,
        "code": record.code,
        "date": record.date.isoformat(),
        "subtotal": record.subtotal,
        "discount": record.discount,
        "grand_total": record.grand_total,
        "customer_name": record.customer_name,
        "payment_status": record.payment_status,
    }, status_code=201)


@router.get("/transactions")
def list_transactions(
"""Ambil daftar transaksi."""
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """List recent POS transactions."""
    from app.models.pos_integration import ErpPosTransactionSync
    records = db.query(ErpPosTransactionSync).order_by(
        ErpPosTransactionSync.date.desc()
    ).limit(limit).all()

    transactions = []
    for r in records:
        transactions.append({
            "code": r.code,
            "date": r.date.isoformat() if r.date else "",
            "customer_name": r.customer_name or "",
            "grand_total": r.grand_total or 0,
            "payment_status": r.payment_status or "PAID",
            "items_count": len(r.items) if hasattr(r, 'items') and r.items else 0,
        })

    return _ok(transactions)


@router.get("/receipt/{code}")
def get_receipt(code: str, db: Session = Depends(get_db)):
    """Get transaction receipt data by code."""
    from app.models.pos_integration import ErpPosTransactionSync

    record = db.query(ErpPosTransactionSync).filter(
        ErpPosTransactionSync.code == code
    ).first()

    if not record:
        from fastapi import HTTPException
        raise HTTPException(404, "Transaksi tidak ditemukan")

    return _ok({
        "code": record.code,
        "date": record.date.isoformat(),
        "customer_name": record.customer_name,
        "subtotal": record.subtotal,
        "discount": record.discount,
        "grand_total": record.grand_total,
        "payment_status": record.payment_status,
        "items": _json.loads(record.items) if record.items else [],
        "payments": _json.loads(record.payments) if record.payments else [],
    })


@router.post("/customer", status_code=201)
def create_pos_customer(
"""Buat customer baru dari POS."""
    body: dict,
    db: Session = Depends(get_db),
):
    """Buat customer baru dari POS."""
    name = (body.get("name") or "").strip()
    phone = (body.get("phone") or "").strip() or None

    if not name:
        from fastapi import HTTPException
        raise HTTPException(400, "Nama customer wajib diisi")

    existing = db.query(ErpMasterCustomer).filter(
        ErpMasterCustomer.name == name
    ).first()

    if existing:
        return _ok({
            "id": str(existing.id),
            "name": existing.name,
            "phone": existing.phone or "",
        })

    customer = ErpMasterCustomer(
        name=name,
        phone=phone,
        is_active=True,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    return _ok({
        "id": str(customer.id),
        "name": customer.name,
        "phone": customer.phone or "",
    }, status_code=201)
