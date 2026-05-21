"""Document Number Registry — SQLAlchemy models for document sequencing and cross-referencing.

DocSequence tracks per-module, per-branch, per-day sequential counters.
DocumentRegistry stores every issued document key with its metadata.
DocCrossReference links documents to each other (generates, references, reverses, groups).
"""
from sqlalchemy import Column, String, Integer, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import Base, TimestampMixin


class DocSequence(Base, TimestampMixin):
    """Per-module, per-branch, per-day counter that ensures gapless numbering."""

    __tablename__ = "erp_doc_sequence"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    module = Column(String(10), nullable=False, index=True)  # e.g. POS, BOOK, JE
    branch = Column(String(10), nullable=False, default="BSD")
    date_key = Column(String(8), nullable=False)  # YYYYMMDD
    seq = Column(Integer, nullable=False, default=0)


class DocumentRegistry(Base, TimestampMixin):
    """Registry of every generated document number with status tracking."""

    __tablename__ = "erp_document_registry"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    doc_key = Column(
        String(50), unique=True, nullable=False, index=True
    )  # POS-BSD-20260518-0001
    module = Column(String(10), nullable=False, index=True)
    branch = Column(String(10), nullable=False, default="BSD")
    doc_date = Column(Date, nullable=False, index=True)
    seq = Column(Integer, nullable=False)
    ref_table = Column(String(50))  # e.g. "transaction", "booking"
    ref_id = Column(String(50))  # UUID from POS DB
    status = Column(
        String(20), default="ACTIVE"
    )  # ACTIVE, CANCELLED, LOCKED
    notes = Column(Text)

    # Relationship back to cross-references
    source_refs = relationship(
        "DocCrossReference",
        foreign_keys="DocCrossReference.source_doc_key",
        primaryjoin="DocumentRegistry.doc_key == DocCrossReference.source_doc_key",
        back_populates="source_doc",
        lazy="selectin",
    )
    target_refs = relationship(
        "DocCrossReference",
        foreign_keys="DocCrossReference.target_doc_key",
        primaryjoin="DocumentRegistry.doc_key == DocCrossReference.target_doc_key",
        back_populates="target_doc",
        lazy="selectin",
    )


class DocCrossReference(Base, TimestampMixin):
    """Links one document to another (e.g. a POS transaction generates a JE)."""

    __tablename__ = "erp_doc_cross_reference"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_doc_key = Column(
        String(50),
        ForeignKey("public.erp_document_registry.doc_key"),
        nullable=False,
        index=True,
    )
    target_doc_key = Column(
        String(50),
        ForeignKey("public.erp_document_registry.doc_key"),
        nullable=False,
        index=True,
    )
    relation_type = Column(
        String(20), nullable=False
    )  # GENERATES, REFERENCES, REVERSES, GROUPS
    notes = Column(Text)

    source_doc = relationship(
        "DocumentRegistry",
        foreign_keys=[source_doc_key],
        primaryjoin="DocumentRegistry.doc_key == DocCrossReference.source_doc_key",
        back_populates="source_refs",
        lazy="selectin",
    )
    target_doc = relationship(
        "DocumentRegistry",
        foreign_keys=[target_doc_key],
        primaryjoin="DocumentRegistry.doc_key == DocCrossReference.target_doc_key",
        back_populates="target_refs",
        lazy="selectin",
    )
