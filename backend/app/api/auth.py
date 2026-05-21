"""Auth API — Login, Register, and Me endpoints.

Queries the existing POS NestJS ``public.user`` table using raw SQL (text())
since the table uses UUID primary keys and is managed by NestJS/TypeORM.
Passwords are bcrypt-hashed — we verify using passlib (same algorithm as
bcryptjs used by NestJS).
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

__all__ = ["router"]

router = APIRouter(prefix="/erp/api/v1/auth", tags=["Authentication"])


# ---------------------------------------------------------------------------
# Typed request / response schemas (inline, could move to app/schemas later)
# ---------------------------------------------------------------------------


class LoginRequest(BaseModel):
    """Schema request untuk login user.

    Menerima username dan password untuk autentikasi.
    """
    username: str
    password: str


class RegisterRequest(BaseModel):
    """Schema request untuk registrasi user baru.

    Field:
        username: Nama pengguna (min 3, max 50 karakter)
        password: Kata sandi (min 6 karakter)
        role: Peran user, hanya ADMIN atau OWNER (default: ADMIN)
    """
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    role: str = Field(default="ADMIN", pattern=r"^(ADMIN|OWNER)$")


class UserResponse(BaseModel):
    """Schema response data user.

    Berisi informasi dasar user termasuk ID, username, role, cabang, dan status.
    """
    id: str
    username: str
    role: str
    branch: Optional[str] = None
    is_active: bool = True
    created_at: Optional[str] = None


class AuthResponse(BaseModel):
    """Schema response untuk login/register yang berhasil.

    Mengembalikan token JWT beserta data user.
    """
    success: bool = True
    token: str
    user: UserResponse


class MeResponse(BaseModel):
    """Schema response untuk endpoint /me.

    Mengembalikan data user yang sedang login.
    """
    success: bool = True
    user: UserResponse


# ---------------------------------------------------------------------------
# Helpers — raw-SQL queries against POS NestJS `public.user` table
# ---------------------------------------------------------------------------

_USER_SELECT = """
    SELECT
        id,
        username,
        password,
        role::text,
        active,
        created_at
    FROM "User"
"""


def _row_to_user(row) -> UserResponse:
    """Convert a raw SQLAlchemy row (RowMapping) to a UserResponse."""
    return UserResponse(
        id=str(row["id"]),
        username=row["username"],
        role=row["role"],
        is_active=row.get("active", True),
        created_at=str(row["created_at"]) if row.get("created_at") else None,
    )


def _find_user_by_username(db: Session, username: str):
    """Fetch a POS user row by username. Returns RowMapping or None."""
    sql = text(_USER_SELECT + " WHERE username = :username")
    return db.execute(sql, {"username": username}).mappings().first()


def _find_user_by_id(db: Session, user_id: str):
    """Fetch a POS user row by UUID. Returns RowMapping or None."""
    sql = text(_USER_SELECT + " WHERE id::text = :uid")
    return db.execute(sql, {"uid": user_id}).mappings().first()


# ---------------------------------------------------------------------------
# POST /erp/api/v1/auth/login
# ---------------------------------------------------------------------------


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user against the POS ``public.user`` table.

    Expects ``{ "username": "...", "password": "..." }``.
    Returns a JWT access token and basic user info on success.
    """
    row = _find_user_by_username(db, payload.username)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    # The POS DB stores NestJS-bcrypt hashed passwords — passlib's bcrypt
    # verifier is compatible with bcryptjs output.
    if not verify_password(payload.password, row["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not row.get("active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    user = _row_to_user(row)
    token = create_access_token(
        data={
            "sub": user.id,
            "username": user.username,
            "role": user.role,
        }
    )

    return AuthResponse(token=token, user=user)


# ---------------------------------------------------------------------------
# GET /erp/api/v1/auth/me
# ---------------------------------------------------------------------------


@router.get("/me", response_model=MeResponse)
def me(
"""Ambil profil user yang sedang login."""
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the currently authenticated user's profile.

    Requires a valid Bearer JWT token in the ``Authorization`` header.
    """
    user_id = current_user.get("sub")
    row = _find_user_by_id(db, user_id)
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return MeResponse(user=_row_to_user(row))


# ---------------------------------------------------------------------------
# POST /erp/api/v1/auth/register
# ---------------------------------------------------------------------------


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    """Create a new user in the POS ``public.user`` table.

    **Body**::

        {
            "username": "newuser",
            "password": "securepass",
            "role": "ADMIN" | "OWNER"
        }

    The password is bcrypt-hashed before storage.
    Returns a JWT token and user info for the newly created user.
    """
    # Check for duplicate username
    existing = _find_user_by_username(db, payload.username)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{payload.username}' already exists",
        )

    hashed = hash_password(payload.password)

    # Insert new user — let PostgreSQL generate the UUID via gen_random_uuid()
    now = datetime.now(timezone.utc)
    insert_sql = text("""
        INSERT INTO "User" (id, username, password, role, active, created_at, updated_at)
        VALUES (gen_random_uuid(), :username, :password, :role, true, :now, :now)
        RETURNING id, username, role::text, active, created_at
    """)

    result = db.execute(
        insert_sql,
        {
            "username": payload.username,
            "password": hashed,
            "role": payload.role,
            "now": now,
        },
    )
    db.commit()

    row = result.mappings().first()
    if row is None:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user",
        )

    user = _row_to_user(row)
    token = create_access_token(
        data={
            "sub": user.id,
            "username": user.username,
            "role": user.role,
        }
    )

    return AuthResponse(token=token, user=user)
