"""POS Integration — Pydantic schemas untuk sinkronisasi data dari POS ke ERP.

Menyediakan input schemas untuk menerima data dari POS (NestJS backend)
dan response schemas untuk mengembalikan hasil ke POS.
"""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


# ═══════════════════════════════════════════════════════════════════
# POS TRANSACTION SYNC
# ═══════════════════════════════════════════════════════════════════

class PosTransactionItem(BaseModel):
    """Item dalam transaksi POS."""
    item_type: str = Field(..., description="Tipe item: service / product")
    item_name: str = Field(..., description="Nama produk/jasa")
    qty: int = Field(..., ge=1, description="Jumlah item")
    unit_price: int = Field(..., ge=0, description="Harga satuan (dalam rupiah)")
    discount: int = 0
    line_total: int = Field(..., ge=0, description="Total baris")
    staff_id: Optional[str] = None
    staff_name: Optional[str] = None


class PosTransactionPayment(BaseModel):
    """Pembayaran dalam transaksi POS."""
    method: str = Field(..., description="Metode bayar: CASH / QRIS / DEBIT / KREDIT / TRANSFER")
    amount: int = Field(..., ge=0, description="Jumlah bayar")
    reference_no: Optional[str] = Field(None, alias="referenceNo", description="No referensi")
    model_config = ConfigDict(populate_by_name=True)


class PosTransactionSyncCreate(BaseModel):
    """Input dari POS untuk menyinkronisasi sebuah transaksi."""
    id: str = Field(..., description="UUID transaksi dari POS")
    code: str = Field(..., description="Kode transaksi dari POS")
    date: datetime = Field(..., description="Tanggal transaksi")
    customer_name: Optional[str] = None
    customer_id: Optional[str] = None
    staff_name: Optional[str] = None
    staff_id: Optional[str] = None
    subtotal: int = 0
    discount: int = 0
    grand_total: int = 0
    payment_status: str = "PAID"
    notes: Optional[str] = None
    items: list[PosTransactionItem] = []
    payments: list[PosTransactionPayment] = []
    source: str = "POS"


class PosTransactionSyncResponse(BaseModel):
    """Response setelah transaksi POS berhasil disinkronisasi."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    pos_transaction_id: int
    code: str
    date: datetime
    customer_name: Optional[str] = None
    subtotal: int
    discount: int
    grand_total: int
    payment_status: str
    notes: Optional[str] = None
    items: Optional[Any] = None
    payments: Optional[Any] = None
    source: str
    doc_key: Optional[str] = None
    synced_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ═══════════════════════════════════════════════════════════════════
# POS SETTLEMENT
# ═══════════════════════════════════════════════════════════════════

class PosSettlementCreate(BaseModel):
    """Input dari POS untuk menyinkronisasi settlement sesi."""
    session_id: str = Field(..., description="UUID sesi dari POS")
    session_code: str = Field(..., description="Kode sesi POS")
    opened_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    opened_by: Optional[str] = None
    opening_cash: int = 0
    closing_cash: Optional[int] = 0
    expected_cash: Optional[int] = 0
    difference: Optional[int] = 0
    total_sales: int = 0
    total_transactions: int = 0
    notes: Optional[str] = None
    payment_breakdown: Optional[dict[str, Any]] = None
    """Rincian pembayaran per metode, e.g. {"CASH": 500000, "QRIS": 250000}"""


class PosSettlementResponse(BaseModel):
    """Response setelah settlement POS berhasil disinkronisasi."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    pos_session_id: str
    session_code: str
    opened_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    opened_by: Optional[str] = None
    opening_cash: int
    closing_cash: Optional[int] = None
    expected_cash: Optional[int] = None
    difference: Optional[int] = None
    total_sales: int
    total_transactions: int
    notes: Optional[str] = None
    payment_breakdown: Optional[Any] = None
    doc_key: Optional[str] = None
    synced_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
