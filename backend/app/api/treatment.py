"""Treatment Record API — Endpoints untuk mengelola Treatment Record di POS.

Prefix: /erp/api/v1
Diakses dari POS Expo via nginx rewrite: /api/* → /erp/api/v1/*

BPMN Swimlane 2 (POS App):
  - Treatment Check-in → Record Treatment → Start → Complete
  - Status: PENDING → IN_PROGRESS → COMPLETED
"""
import json as _json
import datetime as _dt
from typing import Optional, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.treatment import ErpTreatmentRecord

router = APIRouter(prefix="/erp/api/v1", tags=["Treatment"])


# ── Helpers ────────────────────────────────────────────


def _serialize(obj: Any) -> Any:
    """Convert ORM object or value to JSON-safe dict."""
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
"""Return response sukses standar."""
    return JSONResponse({"success": True, "data": data}, status_code=status_code)


def _record_to_api(r: ErpTreatmentRecord) -> dict:
    """Convert ORM TreatmentRecord to frontend-compatible dict."""
    services_raw = r.services or []
    if isinstance(services_raw, (list, tuple)):
        service_names = [s.get("name", "") if isinstance(s, dict) else str(s) for s in services_raw]
    else:
        service_names = []

    return {
        "id": str(r.id),
        "code": r.code,
        "transactionId": r.transaction_id or "",
        "customerName": r.customer_name or "",
        "customerPhone": r.customer_phone or "",
        "therapistName": r.therapist_name or "",
        "services": service_names,
        "assignedBed": r.assigned_bed or "",
        "beforePhotos": r.before_photos or [],
        "afterPhotos": r.after_photos or [],
        "therapistNotes": r.therapist_notes or "",
        "status": r.status,
        "startedAt": r.started_at.isoformat() if r.started_at else None,
        "completedAt": r.completed_at.isoformat() if r.completed_at else None,
        "totalPrice": r.total_price or 0,
        "discount": r.discount or 0,
        "createdAt": r.created_at.isoformat() if hasattr(r, 'created_at') and r.created_at else None,
    }


# ── Generate Treatment Code ────────────────────────────


def _generate_treatment_code(db: Session) -> str:
    """Generate TRM code: TRM-001-YYYYMMDD-NNNN"""
    now = _dt.datetime.now()
    date_str = now.strftime("%Y%m%d")
    prefix = f"TRM-001-{date_str}-"
    last = db.query(ErpTreatmentRecord).filter(
        ErpTreatmentRecord.code.like(f"{prefix}%")
    ).order_by(ErpTreatmentRecord.code.desc()).first()
    seq = 1
    if last:
        try:
            parts = last.code.split("-")
            seq = int(parts[-1]) + 1
        except (ValueError, IndexError):
            seq = 1
    return f"{prefix}{seq:04d}"


# ── Endpoints ──────────────────────────────────────────


@router.get("/treatments")
def list_treatments(
"""Ambil daftar treatment records."""
    status: Optional[str] = Query(None, description="Filter by status: PENDING, IN_PROGRESS, COMPLETED"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Get treatment records. Today's records first, newest first."""
    today = _dt.date.today()
    q = db.query(ErpTreatmentRecord)

    if status:
        q = q.filter(ErpTreatmentRecord.status == status.upper())

    records = q.order_by(
        ErpTreatmentRecord.created_at.desc()
    ).limit(limit).all()

    return _ok([_record_to_api(r) for r in records])


@router.get("/treatments/{record_id}")
def get_treatment(record_id: int, db: Session = Depends(get_db)):
    """Get a single treatment record by ID."""
    record = db.query(ErpTreatmentRecord).filter(
        ErpTreatmentRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(404, "Treatment record tidak ditemukan")
    return _ok(_record_to_api(record))


@router.post("/treatments", status_code=201)
def create_treatment(body: dict, db: Session = Depends(get_db)):
    """Create a new treatment record from POS.

    Request:
    {
        customerName (required),
        customerPhone?,
        therapistName (required),
        services: ["Classic Lashes", ...] or [{id, name, price, duration}, ...],
        transactionId?,
        assignedBed?,
        totalPrice?,
        discount?,
        therapistNotes?,
        beforePhotos?,
        afterPhotos?
    }
    """
    customer_name = (body.get("customerName") or "").strip()
    therapist_name = (body.get("therapistName") or "").strip()

    if not customer_name:
        raise HTTPException(400, "Nama customer wajib diisi")
    if not therapist_name:
        raise HTTPException(400, "Nama therapist wajib diisi")

    services_raw = body.get("services", [])
    services_json = []
    for s in services_raw:
        if isinstance(s, dict):
            services_json.append(s)
        else:
            services_json.append({"name": str(s)})

    total_price = int(body.get("totalPrice", 0) or 0)
    discount = int(body.get("discount", 0) or 0)

    code = _generate_treatment_code(db)

    record = ErpTreatmentRecord(
        code=code,
        transaction_id=body.get("transactionId"),
        customer_name=customer_name,
        customer_phone=body.get("customerPhone"),
        therapist_name=therapist_name,
        services=services_json,
        assigned_bed=body.get("assignedBed"),
        status="PENDING",
        before_photos=body.get("beforePhotos", []),
        after_photos=body.get("afterPhotos", []),
        therapist_notes=body.get("therapistNotes"),
        total_price=total_price,
        discount=discount,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return _ok(_record_to_api(record), status_code=201)


@router.post("/treatments/{record_id}/start")
def start_treatment(record_id: int, db: Session = Depends(get_db)):
    """Start a treatment: set status to IN_PROGRESS, record started_at."""
    record = db.query(ErpTreatmentRecord).filter(
        ErpTreatmentRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(404, "Treatment record tidak ditemukan")
    if record.status != "PENDING":
        raise HTTPException(400, f"Treatment sudah {record.status}, tidak bisa memulai ulang")

    record.status = "IN_PROGRESS"
    record.started_at = _dt.datetime.now()
    db.commit()
    db.refresh(record)

    return _ok(_record_to_api(record))


@router.post("/treatments/{record_id}/complete")
def complete_treatment(record_id: int, body: dict = {}, db: Session = Depends(get_db)):
    """Complete a treatment: set status to COMPLETED, record completed_at.

    Optional body:
    {
        therapistNotes?,
        afterPhotos?,
        completedAt? (ISO datetime, defaults to now)
    }
    """
    record = db.query(ErpTreatmentRecord).filter(
        ErpTreatmentRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(404, "Treatment record tidak ditemukan")
    if record.status == "COMPLETED":
        raise HTTPException(400, "Treatment sudah selesai")
    if record.status not in ("PENDING", "IN_PROGRESS"):
        raise HTTPException(400, f"Status treatment {record.status} tidak bisa diselesaikan")

    # Update optional fields
    if body.get("therapistNotes"):
        record.therapist_notes = body["therapistNotes"]
    if body.get("afterPhotos"):
        record.after_photos = body["afterPhotos"]
    if body.get("beforePhotos"):
        record.before_photos = body["beforePhotos"]

    record.status = "COMPLETED"
    record.completed_at = body.get("completedAt") or _dt.datetime.now()
    db.commit()
    db.refresh(record)

    return _ok(_record_to_api(record))


@router.put("/treatments/{record_id}")
def update_treatment(record_id: int, body: dict, db: Session = Depends(get_db)):
    """Update treatment record fields (notes, photos, etc).

    Supports partial update. Only provided fields are updated.
    """
    record = db.query(ErpTreatmentRecord).filter(
        ErpTreatmentRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(404, "Treatment record tidak ditemukan")

    updatable_fields = [
        "therapist_notes", "before_photos", "after_photos",
        "customer_name", "customer_phone", "therapist_name",
        "assigned_bed", "therapistNotes", "beforePhotos", "afterPhotos",
        "customerName", "customerPhone", "therapistName", "assignedBed",
    ]

    for field in updatable_fields:
        if field in body:
            # Map camelCase snake_case
            snake = {
                "therapistNotes": "therapist_notes",
                "beforePhotos": "before_photos",
                "afterPhotos": "after_photos",
                "customerName": "customer_name",
                "customerPhone": "customer_phone",
                "therapistName": "therapist_name",
                "assignedBed": "assigned_bed",
            }.get(field, field)
            setattr(record, snake, body[field])

    db.commit()
    db.refresh(record)

    return _ok(_record_to_api(record))
