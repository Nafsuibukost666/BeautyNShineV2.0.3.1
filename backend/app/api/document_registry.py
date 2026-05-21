"""Document Number Registry — FastAPI router.

Endpoints for generating, looking up, cross-referencing, and cancelling
ERP document numbers.  All responses follow the format::

    {"success": true, "data": ...}
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.document_registry import (
    CrossReferenceCreate,
    CrossReferenceResponse,
    DocKeyResponse,
    DocRegistryCreate,
    DocRegistryResponse,
)
from app.services.document_registry import (
    CrossReferenceError,
    DocumentNotFoundError,
    DocumentRegistryError,
    DocumentRegistryService,
    InvalidModuleError,
)

router = APIRouter(prefix="/erp/api/v1/documents", tags=["Document Registry"])

service = DocumentRegistryService()


# ---------------------------------------------------------------------------
# Helper — map service exceptions to HTTP errors
# ---------------------------------------------------------------------------


def _http_error(exc: Exception) -> HTTPException:
    """Convert a known service-layer exception to a 4xx HTTP response."""
    if isinstance(exc, InvalidModuleError):
        return HTTPException(status_code=400, detail=str(exc))
    if isinstance(exc, DocumentNotFoundError):
        return HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, CrossReferenceError):
        return HTTPException(status_code=409, detail=str(exc))
    if isinstance(exc, DocumentRegistryError):
        return HTTPException(status_code=400, detail=str(exc))
    # Fallback for unexpected errors
    return HTTPException(status_code=500, detail="Internal server error")


# ---------------------------------------------------------------------------
# POST /erp/api/v1/documents/generate
# ---------------------------------------------------------------------------


@router.post("/generate", response_model=dict)
def generate_document(
"""Generate nomor dokumen baru."""
    payload: DocRegistryCreate,
    db: Session = Depends(get_db),
):
    """Generate a new sequential document number and register it.

    The document key format is: ``{MODULE}-{BRANCH}-{YYYYMMDD}-{NNNN}``.
    The sequence counter is per-module, per-branch, per-day and is
    incremented atomically inside a database transaction.

    **Request body** (``DocRegistryCreate``):

    - ``module`` (required): module code, e.g. ``POS``, ``JE``, ``BOOK``
    - ``branch`` (optional): branch code, defaults to ``BSD``
    - ``ref_table`` (optional): name of the source table
    - ``ref_id`` (optional): UUID or PK of the source record
    - ``notes`` (optional): free-text notes
    """
    try:
        record = service.generate_key(
            db,
            module=payload.module,
            branch=payload.branch,
            doc_date=None,  # use today
            ref_table=payload.ref_table,
            ref_id=payload.ref_id,
            notes=payload.notes,
        )
        db.commit()
        return {
            "success": True,
            "data": DocKeyResponse(
                doc_key=record.doc_key,
                doc_date=record.doc_date,
                seq=record.seq,
            ).model_dump(),
        }
    except DocumentRegistryError as exc:
        db.rollback()
        raise _http_error(exc) from exc


# ---------------------------------------------------------------------------
# GET /erp/api/v1/documents/{doc_key}
# ---------------------------------------------------------------------------


@router.get("/{doc_key}", response_model=dict)
def get_document(
"""Ambil detail dokumen berdasarkan ID.

    Args:
        doc_id: ID dokumen
        db: Database session

    Returns:
        JSONResponse berisi data dokumen"""
    doc_key: str,
    db: Session = Depends(get_db),
):
    """Retrieve a single document registry record by its key.

    **Path parameter**:

    - ``doc_key``: the full document key, e.g. ``POS-BSD-20260518-0001``
    """
    try:
        record = service.get_by_key(db, doc_key)
        return {
            "success": True,
            "data": DocRegistryResponse.model_validate(record).model_dump(),
        }
    except DocumentRegistryError as exc:
        raise _http_error(exc) from exc


# ---------------------------------------------------------------------------
# GET /erp/api/v1/documents
# ---------------------------------------------------------------------------


@router.get("", response_model=dict)
def search_documents(
"""Cari dokumen berdasarkan kata kunci."""
    module: Optional[str] = Query(None, description="Filter by module code"),
    branch: Optional[str] = Query(None, description="Filter by branch code"),
    start_date: Optional[date] = Query(None, description="Start date (inclusive)"),
    end_date: Optional[date] = Query(None, description="End date (inclusive)"),
    status: Optional[str] = Query(
        None, description="Filter by status: ACTIVE, CANCELLED, LOCKED"
    ),
    limit: int = Query(50, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    db: Session = Depends(get_db),
):
    """Search document registry records with optional filters.

    Supports filtering by module, branch, date range, and status.  Results
    are ordered by document date descending then sequence number descending.
    """
    try:
        records, total = service.search(
            db,
            module=module,
            branch=branch,
            start_date=start_date,
            end_date=end_date,
            status=status,
            limit=limit,
            offset=offset,
        )
        return {
            "success": True,
            "data": {
                "items": [
                    DocRegistryResponse.model_validate(r).model_dump()
                    for r in records
                ],
                "total": total,
                "limit": limit,
                "offset": offset,
            },
        }
    except DocumentRegistryError as exc:
        raise _http_error(exc) from exc


# ---------------------------------------------------------------------------
# POST /erp/api/v1/documents/cross-reference
# ---------------------------------------------------------------------------


@router.post("/cross-reference", response_model=dict)
def create_cross_reference(
"""Buat cross-reference antar dokumen."""
    payload: CrossReferenceCreate,
    db: Session = Depends(get_db),
):
    """Create a cross-reference link between two documents.

    **Request body** (``CrossReferenceCreate``):

    - ``source_doc_key``: the source document key
    - ``target_doc_key``: the target document key
    - ``relation_type``: one of ``GENERATES``, ``REFERENCES``, ``REVERSES``,
      ``GROUPS``
    - ``notes`` (optional): explanatory notes

    Both document keys must exist.  Self-references and duplicate links
    are rejected.
    """
    try:
        ref = service.add_cross_reference(
            db,
            source_doc_key=payload.source_doc_key,
            target_doc_key=payload.target_doc_key,
            relation_type=payload.relation_type,
            notes=payload.notes,
        )
        db.commit()
        return {
            "success": True,
            "data": CrossReferenceResponse.model_validate(ref).model_dump(),
        }
    except DocumentRegistryError as exc:
        db.rollback()
        raise _http_error(exc) from exc


# ---------------------------------------------------------------------------
# GET /erp/api/v1/documents/{doc_key}/references
# ---------------------------------------------------------------------------


@router.get("/{doc_key}/references", response_model=dict)
def get_document_references(
"""Ambil referensi untuk suatu dokumen."""
    doc_key: str,
    db: Session = Depends(get_db),
):
    """Retrieve all cross-references (incoming and outgoing) for a document.

    **Path parameter**:

    - ``doc_key``: the document key to look up

    Returns two lists: ``outgoing`` (this document is the source) and
    ``incoming`` (this document is the target).
    """
    try:
        outgoing, incoming = service.get_cross_references(db, doc_key)
        return {
            "success": True,
            "data": {
                "outgoing": [
                    CrossReferenceResponse.model_validate(r).model_dump()
                    for r in outgoing
                ],
                "incoming": [
                    CrossReferenceResponse.model_validate(r).model_dump()
                    for r in incoming
                ],
            },
        }
    except DocumentRegistryError as exc:
        raise _http_error(exc) from exc


# ---------------------------------------------------------------------------
# PATCH /erp/api/v1/documents/{doc_key}/cancel
# ---------------------------------------------------------------------------


@router.patch("/{doc_key}/cancel", response_model=dict)
def cancel_document(
"""Batalkan dokumen yang sudah terdaftar."""
    doc_key: str,
    notes: Optional[str] = Query(None, description="Reason for cancellation"),
    db: Session = Depends(get_db),
):
    """Cancel an active document.

    **Path parameter**:

    - ``doc_key``: the document key to cancel

    **Query parameter**:

    - ``notes`` (optional): reason for cancellation

    Once cancelled a document cannot be re-activated through this API.
    A LOCKED document cannot be cancelled.
    """
    try:
        record = service.cancel(db, doc_key=doc_key, notes=notes)
        db.commit()
        return {
            "success": True,
            "data": DocRegistryResponse.model_validate(record).model_dump(),
        }
    except DocumentRegistryError as exc:
        db.rollback()
        raise _http_error(exc) from exc
