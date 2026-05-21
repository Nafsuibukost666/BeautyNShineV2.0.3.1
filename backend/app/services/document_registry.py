"""Document Number Registry — business logic layer.

Provides gapless document key generation, lookups, cross-referencing,
and cancellation.  Thread-safe via database-level row locks on the
sequence counter.
"""
from datetime import date, datetime
from typing import List, Optional, Tuple

from sqlalchemy import and_
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.core.config import settings
from app.models.document_registry import (
    DocCrossReference,
    DocSequence,
    DocumentRegistry,
)

# ---------------------------------------------------------------------------
# Module-level constants
# ---------------------------------------------------------------------------

VALID_MODULES: set = {
    "BOOK",  # Booking
    "POS",  # Transaction (POS)
    "TRM",  # Treatment
    "STK",  # Stock
    "WIP",  # Manufacture / Work-in-Progress
    "AP",  # Accounts Payable
    "BP",  # Payment / Bank
    "JE",  # Journal Entry
    "FA",  # Fixed Asset
    "EOP",  # End of Period
    "EXP",  # Expense
    "PMT",  # Payment
    "PUR",  # Purchase
    "ADJ",  # Adjustment
}

VALID_RELATION_TYPES: set = {
    "GENERATES",
    "REFERENCES",
    "REVERSES",
    "GROUPS",
}

VALID_STATUSES: set = {
    "ACTIVE",
    "CANCELLED",
    "LOCKED",
}


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------


class DocumentRegistryError(Exception):
    """Base exception for document registry operations."""


class InvalidModuleError(DocumentRegistryError):
    """Raised when an unknown module code is supplied."""


class DocumentNotFoundError(DocumentRegistryError):
    """Raised when a doc_key is not found."""


class DocumentAlreadyExistsError(DocumentRegistryError):
    """Raised when trying to create a duplicate document key."""


class CrossReferenceError(DocumentRegistryError):
    """Raised when a cross-reference operation fails."""


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class DocumentRegistryService:
    """Business logic for managing the Document Number Registry."""

    MODULES = sorted(VALID_MODULES)

    # ------------------------------------------------------------------
    # Key Generation
    # ------------------------------------------------------------------

    def generate_key(
        self,
        db: Session,
        module: str,
        branch: Optional[str] = None,
        doc_date: Optional[date] = None,
        ref_table: Optional[str] = None,
        ref_id: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> DocumentRegistry:
        """Atomically generate the next sequential document number.

        Steps:
          1. Validate the module code.
          2. Build the date key (YYYYMMDD) from *doc_date* or today.
          3. Acquire a row-level lock on the matching ``DocSequence`` row
             (or create one if it does not exist yet).
          4. Increment the counter.
          5. Format the full doc_key.
          6. Persist a ``DocumentRegistry`` record.
          7. Return the new record.

        Parameters
        ----------
        db : Session
            Active SQLAlchemy database session.
        module : str
            Two-to-ten-character module code (e.g. ``"POS"``, ``"JE"``).
        branch : str or None
            Branch code; defaults to ``settings.DEFAULT_BRANCH``.
        doc_date : date or None
            Transaction date; defaults to today.
        ref_table : str or None
            Name of the source table (for traceability).
        ref_id : str or None
            Primary-key / UUID of the source record.
        notes : str or None
            Optional free-text notes.

        Returns
        -------
        DocumentRegistry
            The newly created registry record.

        Raises
        ------
        InvalidModuleError
            If *module* is not in the approved list.
        """
        # --- validate module ---------------------------------------------------
        module = module.upper().strip()
        if module not in VALID_MODULES:
            raise InvalidModuleError(
                f"Invalid module '{module}'.  Valid options: {', '.join(sorted(VALID_MODULES))}"
            )

        # --- defaults ---------------------------------------------------------
        if branch is None:
            branch = settings.DEFAULT_BRANCH
        branch = branch.upper().strip()

        if doc_date is None:
            doc_date = date.today()

        date_key = doc_date.strftime("%Y%m%d")

        # --- atomic upsert + increment ----------------------------------------
        seq_row = (
            db.query(DocSequence)
            .filter(
                and_(
                    DocSequence.module == module,
                    DocSequence.branch == branch,
                    DocSequence.date_key == date_key,
                )
            )
            .with_for_update()
            .first()
        )

        if seq_row is None:
            seq_row = DocSequence(
                module=module, branch=branch, date_key=date_key, seq=1
            )
            db.add(seq_row)
            next_seq = 1
        else:
            seq_row.seq += 1
            next_seq = seq_row.seq

        db.flush()  # ensure seq is written before we use it

        # --- build doc_key ----------------------------------------------------
        doc_key = settings.DOC_SEQ_FORMAT.format(
            module=module, branch=branch, date=date_key, seq=next_seq
        )

        # --- persist DocumentRegistry record -----------------------------------
        record = DocumentRegistry(
            doc_key=doc_key,
            module=module,
            branch=branch,
            doc_date=doc_date,
            seq=next_seq,
            ref_table=ref_table,
            ref_id=ref_id,
            status="ACTIVE",
            notes=notes,
        )
        db.add(record)
        db.flush()

        return record

    # ------------------------------------------------------------------
    # Lookup
    # ------------------------------------------------------------------

    def get_by_key(self, db: Session, doc_key: str) -> DocumentRegistry:
        """Retrieve a single document by its full key.

        Parameters
        ----------
        db : Session
            Active database session.
        doc_key : str
            The full document key (e.g. ``"POS-BSD-20260518-0001"``).

        Returns
        -------
        DocumentRegistry

        Raises
        ------
        DocumentNotFoundError
            If the key does not exist.
        """
        record = (
            db.query(DocumentRegistry)
            .filter(DocumentRegistry.doc_key == doc_key)
            .first()
        )
        if record is None:
            raise DocumentNotFoundError(f"Document '{doc_key}' not found.")
        return record

    def search(
        self,
        db: Session,
        module: Optional[str] = None,
        branch: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[DocumentRegistry], int]:
        """Search document registry records with optional filters.

        Parameters
        ----------
        db : Session
            Active database session.
        module : str or None
            Filter by module code.
        branch : str or None
            Filter by branch code.
        start_date : date or None
            Filter by doc_date >= start_date.
        end_date : date or None
            Filter by doc_date <= end_date.
        status : str or None
            Filter by status (ACTIVE, CANCELLED, LOCKED).
        limit : int
            Maximum number of records to return (default 50).
        offset : int
            Number of records to skip (default 0).

        Returns
        -------
        tuple of (list[DocumentRegistry], int)
            The matched records and the total count (ignoring pagination).
        """
        query = db.query(DocumentRegistry)

        if module:
            query = query.filter(DocumentRegistry.module == module.upper().strip())
        if branch:
            query = query.filter(DocumentRegistry.branch == branch.upper().strip())
        if start_date:
            query = query.filter(DocumentRegistry.doc_date >= start_date)
        if end_date:
            query = query.filter(DocumentRegistry.doc_date <= end_date)
        if status:
            s = status.upper().strip()
            if s not in VALID_STATUSES:
                raise DocumentRegistryError(
                    f"Invalid status '{status}'.  Valid options: {', '.join(sorted(VALID_STATUSES))}"
                )
            query = query.filter(DocumentRegistry.status == s)

        total = query.count()
        records = (
            query.order_by(DocumentRegistry.doc_date.desc(), DocumentRegistry.seq.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return records, total

    # ------------------------------------------------------------------
    # Cross-referencing
    # ------------------------------------------------------------------

    def add_cross_reference(
        self,
        db: Session,
        source_doc_key: str,
        target_doc_key: str,
        relation_type: str,
        notes: Optional[str] = None,
    ) -> DocCrossReference:
        """Create a link between two documents.

        Both document keys are validated to exist before the reference is
        created.

        Parameters
        ----------
        db : Session
            Active database session.
        source_doc_key : str
            The source document key.
        target_doc_key : str
            The target document key.
        relation_type : str
            One of ``GENERATES``, ``REFERENCES``, ``REVERSES``, ``GROUPS``.
        notes : str or None
            Optional explanatory notes.

        Returns
        -------
        DocCrossReference

        Raises
        ------
        DocumentNotFoundError
            If either document key does not exist.
        CrossReferenceError
            If *relation_type* is invalid or the link already exists.
        """
        # validate relation type
        rt = relation_type.upper().strip()
        if rt not in VALID_RELATION_TYPES:
            raise CrossReferenceError(
                f"Invalid relation_type '{relation_type}'.  "
                f"Valid options: {', '.join(sorted(VALID_RELATION_TYPES))}"
            )

        # verify both documents exist
        source = self.get_by_key(db, source_doc_key)
        target = self.get_by_key(db, target_doc_key)

        # prevent self-references
        if source_doc_key == target_doc_key:
            raise CrossReferenceError("A document cannot reference itself.")

        # check for duplicate
        existing = (
            db.query(DocCrossReference)
            .filter(
                and_(
                    DocCrossReference.source_doc_key == source_doc_key,
                    DocCrossReference.target_doc_key == target_doc_key,
                    DocCrossReference.relation_type == rt,
                )
            )
            .first()
        )
        if existing is not None:
            raise CrossReferenceError(
                f"Cross-reference already exists: {source_doc_key} "
                f"{rt} {target_doc_key}"
            )

        ref = DocCrossReference(
            source_doc_key=source_doc_key,
            target_doc_key=target_doc_key,
            relation_type=rt,
            notes=notes,
        )
        db.add(ref)
        db.flush()
        return ref

    def get_cross_references(
        self, db: Session, doc_key: str
    ) -> Tuple[List[DocCrossReference], List[DocCrossReference]]:
        """Retrieve all cross-references for a given document.

        Returns two lists: references where the document is the **source**
        (outgoing), and references where it is the **target** (incoming).

        Parameters
        ----------
        db : Session
            Active database session.
        doc_key : str
            The document key to look up.

        Returns
        -------
        tuple of (list[DocCrossReference], list[DocCrossReference])
            ``(outgoing, incoming)`` references.

        Raises
        ------
        DocumentNotFoundError
            If the document key does not exist.
        """
        # validate document exists
        self.get_by_key(db, doc_key)

        outgoing = (
            db.query(DocCrossReference)
            .filter(DocCrossReference.source_doc_key == doc_key)
            .all()
        )
        incoming = (
            db.query(DocCrossReference)
            .filter(DocCrossReference.target_doc_key == doc_key)
            .all()
        )
        return outgoing, incoming

    # ------------------------------------------------------------------
    # Cancellation
    # ------------------------------------------------------------------

    def cancel(
        self,
        db: Session,
        doc_key: str,
        notes: Optional[str] = None,
    ) -> DocumentRegistry:
        """Mark a document as cancelled.

        Once cancelled a document cannot be re-activated via this method
        (clients must use a direct DB update if truly needed).

        Parameters
        ----------
        db : Session
            Active database session.
        doc_key : str
            The document key to cancel.
        notes : str or None
            Reason for cancellation.

        Returns
        -------
        DocumentRegistry
            The updated record.

        Raises
        ------
        DocumentNotFoundError
            If the document key does not exist.
        DocumentRegistryError
            If the document is already cancelled or locked.
        """
        record = self.get_by_key(db, doc_key)

        if record.status == "CANCELLED":
            raise DocumentRegistryError(
                f"Document '{doc_key}' is already cancelled."
            )

        if record.status == "LOCKED":
            raise DocumentRegistryError(
                f"Document '{doc_key}' is LOCKED and cannot be cancelled."
            )

        record.status = "CANCELLED"
        if notes:
            # Append cancellation reason to existing notes if any
            existing = record.notes or ""
            record.notes = (existing + "\n--- CANCELLED ---\n" + notes).strip()
        else:
            existing = record.notes or ""
            record.notes = (existing + "\n--- CANCELLED ---").strip()

        db.flush()
        return record
