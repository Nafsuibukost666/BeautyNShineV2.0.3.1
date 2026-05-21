"""SQLAlchemy Base Model — common columns for all tables."""
from datetime import datetime
from sqlalchemy import Column, DateTime, func
from app.core.database import Base


class TimestampMixin:
    """Adds created_at and updated_at columns."""
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
