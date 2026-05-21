"""Audit Trail — Pydantic schemas."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    table_name: str
    record_id: Optional[str] = None
    action: str
    summary: Optional[str] = None
    old_values: Optional[Any] = None
    new_values: Optional[Any] = None
    performed_by: Optional[str] = None
    performed_at: Optional[datetime] = None
    ip_address: Optional[str] = None
    branch_id: Optional[int] = None
    created_at: Optional[datetime] = None


class AuditLogFilter(BaseModel):
    """Filter untuk query audit log."""

    table_name: Optional[str] = None
    action: Optional[str] = None
    performed_by: Optional[str] = None
    record_id: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    page: int = 1
    per_page: int = 20
