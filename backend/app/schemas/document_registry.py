"""Pydantic schemas for the Document Number Registry module.

Defines request/response models for document key generation, lookup,
cancellation, and cross-reference management.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Document Registry schemas
# ---------------------------------------------------------------------------


class DocRegistryCreate(BaseModel):
    """Payload for requesting a new document key."""

    module: str = Field(
        ...,
        description="ERP module code (e.g. POS, BOOK, JE)",
        min_length=2,
        max_length=10,
    )
    branch: Optional[str] = Field(
        None, description="Branch code (defaults to BSD)", max_length=10
    )
    ref_table: Optional[str] = Field(
        None, description="Name of the source table (e.g. transaction, booking)"
    )
    ref_id: Optional[str] = Field(
        None, description="UUID or PK of the source record"
    )
    notes: Optional[str] = Field(None, description="Optional notes about this document")


class DocRegistryUpdate(BaseModel):
    """Partial update fields for a document registry record."""

    status: Optional[str] = Field(
        None, description="New status (ACTIVE, CANCELLED, LOCKED)"
    )
    notes: Optional[str] = Field(None, description="Updated notes")
    ref_table: Optional[str] = Field(None, description="Updated source table name")
    ref_id: Optional[str] = Field(None, description="Updated source record ID")


class DocRegistryResponse(BaseModel):
    """Full document registry record returned to clients."""

    id: int
    doc_key: str
    module: str
    branch: str
    doc_date: date
    seq: int
    ref_table: Optional[str] = None
    ref_id: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocKeyResponse(BaseModel):
    """Minimal response containing just the generated document key."""

    doc_key: str
    doc_date: date
    seq: int


# ---------------------------------------------------------------------------
# Cross-reference schemas
# ---------------------------------------------------------------------------


class CrossReferenceCreate(BaseModel):
    """Payload for creating a link between two documents."""

    source_doc_key: str = Field(
        ..., description="Source document key (e.g. POS-BSD-20260518-0001)"
    )
    target_doc_key: str = Field(
        ..., description="Target document key (e.g. JE-BSD-20260518-0005)"
    )
    relation_type: str = Field(
        ...,
        description="Relation type: GENERATES, REFERENCES, REVERSES, GROUPS",
    )
    notes: Optional[str] = Field(None, description="Optional notes about this relation")


class CrossReferenceResponse(BaseModel):
    """Cross-reference record returned to clients."""

    id: int
    source_doc_key: str
    target_doc_key: str
    relation_type: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
