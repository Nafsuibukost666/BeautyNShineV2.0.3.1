# BBO-9 — POS Polish & Integration

## Tujuan
Memoles modul POS (Point of Sale) agar terintegrasi penuh dengan ERP Sales Order, inventory, dan master data.

## Scope
1. **Fix POS-lite frontend field mapping** — service object pakai `name`/`price` bukan `nama`/`harga`.
2. **POS sync to Sales Order** — setiap transaksi POS membuat `ErpSalesOrder` (status POSTED).
3. **POS stock deduction** — produk yang laku via POS otomatis membuat stock movement OUT.
4. **POS-lite initial-data endpoint** — include product stock levels.

## Out of Scope
- React Native Expo mobile POS native polish (apps/pos/) — ditunda task terpisah.
- Offline POS mode.
- Refund/return flow.

## API Changes
- `POST /erp/api/v1/pos/transactions` — tetap sama, sekarang juga create `ErpSalesOrder` + stock movement

## Acceptance Criteria
1. POS frontend `/pos` menampilkan services dengan benar (field `name`/`price`).
2. POS transaksi membuat Sales Order di ERP.
3. POS transaksi untuk produk mengurangi stock (stock movement OUT).
4. API sync tetap backward-compatible.
5. Local + Cloudflare QA pass.
