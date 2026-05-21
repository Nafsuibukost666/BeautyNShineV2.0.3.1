"""Booking API — Endpoints untuk mengelola Booking di POS.

Prefix: /erp/api/v1
Diakses dari POS Expo via nginx rewrite: /api/* → /erp/api/v1/*

Flow sesuai BPMN:
  1. Create Booking → input Nama, Telepon, Treatment, Therapist
  2. Generate BOOK No. → Simpan Booking
  3. Check-in → Retrieve by name/phone → Convert to POS Order
  4. Treatment → Payment → Receipt
"""
import json as _json
import datetime as _dt
from typing import Optional, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.booking import ErpBookingRecord
from app.models.pos_integration import ErpPosTransactionSync

router = APIRouter(prefix="/erp/api/v1", tags=["Booking"])


# ── Helpers ────────────────────────────────────────────


def _serialize(obj: Any) -> Any:
    """Serialize objek ORM atau nilai Python ke format JSON-safe.

    Menangani datetime, date, time, dict, list, dan SQLAlchemy ORM objects
    secara rekursif.

    Args:
        obj: Objek yang akan di-serialize

    Returns:
        Nilai yang JSON-safe (dict, list, str, int, float, bool, atau None)
    """
    if obj is None:
        return None
    if isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, (_dt.datetime, _dt.date, _dt.time)):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_serialize(item) for item in obj]
    mapper = sa_inspect(obj)
    if mapper is not None:
        return {c.key: _serialize(getattr(obj, c.key))
                for c in mapper.mapper.column_attrs}
    return obj


def _ok(data, status_code: int = 200):
    """Helper untuk mengembalikan response JSON standar.

    Membungkus data dalam format {"success": True, "data": ...}.

    Args:
        data: Data response (dict, list, atau ORM object)
        status_code: HTTP status code (default: 200)

    Returns:
        JSONResponse dengan wrapper success
    """
    return JSONResponse({"success": True, "data": data}, status_code=status_code)


def _booking_to_api(b: ErpBookingRecord) -> dict:
    """Convert ORM BookingRecord to frontend-compatible dict."""
    service_names_str = b.service_names or ""
    services_raw = b.services or []
    if isinstance(services_raw, (list, tuple)):
        if not service_names_str:
            names = [s.get("name", "") if isinstance(s, dict) else str(s) for s in services_raw]
            service_names_str = ", ".join(n for n in names if n)
    
    return {
        "id": str(b.id),
        "code": b.code,
        "customerName": b.customer_name or "",
        "customerPhone": b.customer_phone or "",
        "serviceName": service_names_str,
        "services": [s.get("name", "") if isinstance(s, dict) else str(s) for s in (services_raw or [])],
        "therapistName": b.therapist_name or "",
        "staffName": b.therapist_name or "",
        "assignedBed": b.assigned_bed or "",
        "date": b.booking_date.isoformat() if b.booking_date else "",
        "time": b.booking_date.strftime("%H:%M") if b.booking_date else "",
        "estimatedDuration": b.estimated_duration or 60,
        "status": b.status,
        "totalPrice": b.total_price or 0,
        "checkedInAt": b.checked_in_at.isoformat() if b.checked_in_at else None,
        "completedAt": b.completed_at.isoformat() if b.completed_at else None,
        "transactionId": b.transaction_id or "",
        "notes": b.notes or "",
        "createdAt": b.created_at.isoformat() if hasattr(b, 'created_at') and b.created_at else None,
    }


def _generate_booking_code(db: Session) -> str:
    """Generate BOOK code: BOOK-001-YYYYMMDD-NNNN"""
    now = _dt.datetime.now()
    date_str = now.strftime("%Y%m%d")
    prefix = f"BOOK-001-{date_str}-"
    last = db.query(ErpBookingRecord).filter(
        ErpBookingRecord.code.like(f"{prefix}%")
    ).order_by(ErpBookingRecord.code.desc()).first()
    seq = 1
    if last:
        try:
            parts = last.code.split("-")
            seq = int(parts[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    return f"{prefix}{seq:04d}"


def _generate_trx_code(db: Session) -> str:
    """Generate transaction code: TRX-001-YYYYMMDD-NNNN"""
    now = _dt.datetime.now()
    date_str = now.strftime("%Y%m%d")
    prefix = f"TRX-001-{date_str}-"
    last = db.query(ErpPosTransactionSync).filter(
        ErpPosTransactionSync.code.like(f"{prefix}%")
    ).order_by(ErpPosTransactionSync.code.desc()).first()
    seq = 1
    if last:
        try:
            parts = last.code.split("-")
            seq = int(parts[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    return f"{prefix}{seq:04d}"


# ── Endpoints ──────────────────────────────────────────


@router.get("/bookings")
def list_bookings(
"""Ambil daftar booking dengan filter tanggal dan status."""
    status: Optional[str] = Query(None, description="Filter by status"),
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List all bookings. Newest first."""
    q = db.query(ErpBookingRecord)

    if status:
        q = q.filter(ErpBookingRecord.status == status.upper())

    if date:
        try:
            day = _dt.datetime.strptime(date, "%Y-%m-%d").date()
            q = q.filter(
                ErpBookingRecord.booking_date >= _dt.datetime.combine(day, _dt.time.min),
                ErpBookingRecord.booking_date <= _dt.datetime.combine(day, _dt.time.max),
            )
        except ValueError:
            raise HTTPException(400, "Format tanggal tidak valid. Gunakan YYYY-MM-DD")

    records = q.order_by(ErpBookingRecord.booking_date.desc()).limit(limit).all()
    return _ok([_booking_to_api(b) for b in records])


@router.get("/bookings/search")
def search_bookings(
"""Cari booking berdasarkan kata kunci."""
    q: str = Query(..., min_length=1, description="Search keyword (name or phone)"),
    db: Session = Depends(get_db),
):
    """Search bookings by customer name or phone."""
    keyword = f"%{q}%"
    records = db.query(ErpBookingRecord).filter(
        (ErpBookingRecord.customer_name.ilike(keyword)) |
        (ErpBookingRecord.customer_phone.ilike(keyword))
    ).order_by(ErpBookingRecord.booking_date.desc()).limit(20).all()

    return _ok([_booking_to_api(b) for b in records])


@router.get("/bookings/{booking_id}")
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    """Get a single booking by ID."""
    b = db.query(ErpBookingRecord).filter(ErpBookingRecord.id == booking_id).first()
    if not b:
        raise HTTPException(404, "Booking tidak ditemukan")
    return _ok(_booking_to_api(b))


@router.post("/bookings", status_code=201)
def create_booking(body: dict, db: Session = Depends(get_db)):
    """Create a new booking.

    Flow: Kasir input data → Generate BOOK No. → Simpan Booking

    Request:
    {
        customerName (required),
        customerPhone?,
        services: ["Classic Lashes", ...] or [{name, price, duration}, ...],
        therapistName (required),
        assignedBed?,
        bookingDate (ISO datetime, required),
        estimatedDuration? (minutes, default 60),
        totalPrice?,
        notes?
    }
    """
    customer_name = (body.get("customerName") or "").strip()
    therapist_name = (body.get("therapistName") or "").strip()

    if not customer_name:
        raise HTTPException(400, "Nama customer wajib diisi")
    if not therapist_name:
        raise HTTPException(400, "Nama therapist wajib diisi")

    booking_date_str = body.get("bookingDate")
    if not booking_date_str:
        raise HTTPException(400, "Tanggal booking (bookingDate) wajib diisi")

    try:
        booking_date = _dt.datetime.fromisoformat(booking_date_str)
    except (ValueError, TypeError):
        raise HTTPException(400, "Format bookingDate tidak valid. Gunakan ISO datetime")

    # Parse services
    services_raw = body.get("services", [])
    services_json = []
    service_names_list = []
    for s in services_raw:
        if isinstance(s, dict):
            services_json.append(s)
            service_names_list.append(s.get("name", ""))
        else:
            services_json.append({"name": str(s)})
            service_names_list.append(str(s))

    service_names_str = ", ".join(n for n in service_names_list if n)
    total_price = int(body.get("totalPrice", 0) or 0)
    estimated_duration = int(body.get("estimatedDuration", 60) or 60)

    # Generate BOOK code
    code = _generate_booking_code(db)

    booking = ErpBookingRecord(
        code=code,
        customer_name=customer_name,
        customer_phone=body.get("customerPhone"),
        services=services_json,
        service_names=service_names_str,
        therapist_name=therapist_name,
        assigned_bed=body.get("assignedBed"),
        booking_date=booking_date,
        estimated_duration=estimated_duration,
        status="BOOKED",
        total_price=total_price,
        notes=body.get("notes"),
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    return _ok(_booking_to_api(booking), status_code=201)


@router.put("/bookings/{booking_id}/status")
def update_booking_status(booking_id: int, body: dict, db: Session = Depends(get_db)):
    """Update booking status.

    Status flow: BOOKED → CHECKED_IN → DONE
                         ↘ CANCELLED / NO_SHOW

    Body: { "status": "done" | "cancelled" | "no_show" }
    """
    valid_statuses = {"done": "DONE", "cancelled": "CANCELLED", "no_show": "NO_SHOW", "rescheduled": "RESCHEDULED"}
    new_status_raw = (body.get("status") or "").strip().lower()

    if new_status_raw not in valid_statuses:
        raise HTTPException(400, f"Status tidak valid. Pilihan: {', '.join(valid_statuses.keys())}")

    new_status = valid_statuses[new_status_raw]

    b = db.query(ErpBookingRecord).filter(ErpBookingRecord.id == booking_id).first()
    if not b:
        raise HTTPException(404, "Booking tidak ditemukan")

    b.status = new_status
    if new_status == "DONE":
        b.completed_at = _dt.datetime.now()

    db.commit()
    db.refresh(b)

    return _ok(_booking_to_api(b))


@router.post("/bookings/{booking_id}/check-in")
def check_in_booking(booking_id: int, body: dict = {}, db: Session = Depends(get_db)):
    """Check-in booking: customer datang.

    Flow:
      1. Retrieve booking by ID
      2. Set status to CHECKED_IN
      3. Generate POS transaction code
      4. Create transaction record in erp_pos_transaction_sync

    Body (optional):
    {
        transactionItems? (default: from booking services),
        note?
    }
    """
    b = db.query(ErpBookingRecord).filter(ErpBookingRecord.id == booking_id).first()
    if not b:
        raise HTTPException(404, "Booking tidak ditemukan")

    if b.status != "BOOKED":
        raise HTTPException(400, f"Booking sudah {b.status}, tidak bisa check-in")

    # Generate POS transaction
    trx_code = _generate_trx_code(db)
    now = _dt.datetime.now()

    # Build items from booking services
    items = body.get("transactionItems", [])
    if not items and b.services:
        # Auto-create items from booking services
        for s in (b.services or []):
            item_name = s.get("name", "") if isinstance(s, dict) else str(s)
            item_price = int(s.get("price", 0)) if isinstance(s, dict) else 0
            items.append({
                "item_type": "service",
                "item_name": item_name,
                "qty": 1,
                "unit_price": item_price,
                "discount": 0,
                "line_total": item_price,
                "staff_id": None,
                "staff_name": b.therapist_name,
            })

    items_json = _json.dumps(items) if items else "[]"

    # Calculate total from items if not from booking
    if not items and b.total_price:
        grand_total = b.total_price
    else:
        grand_total = sum(
            int(i.get("unit_price", 0)) * int(i.get("qty", 1))
            - int(i.get("discount", 0))
            for i in items
        )

    # Create POS transaction record
    trx = ErpPosTransactionSync(
        pos_transaction_id=trx_code,
        code=trx_code,
        date=now,
        customer_name=b.customer_name,
        subtotal=grand_total,
        discount=0,
        grand_total=grand_total,
        payment_status="UNPAID",
        notes=f"Booking check-in: {b.code}",
        items=items_json,
        payments="[]",
        source="BOOKING",
        synced_at=now,
    )
    db.add(trx)

    # Update booking
    b.status = "CHECKED_IN"
    b.checked_in_at = now
    b.transaction_id = trx_code

    db.commit()
    db.refresh(b)
    db.refresh(trx)

    return _ok({
        "booking": _booking_to_api(b),
        "transaction": {
            "code": trx.code,
            "grand_total": trx.grand_total,
            "items": _json.loads(trx.items) if trx.items else [],
        },
    })
