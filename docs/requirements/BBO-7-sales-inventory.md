# BBO-7 — ERP Transaction Sales & Inventory

## Tujuan
Membuat modul transaksi penjualan ERP yang mencatat order penjualan salon dan otomatis mengurangi stok produk ketika transaksi diposting.

## Scope
- Sales Order header dan item.
- Customer optional tetapi bisa dipilih dari master customer.
- Product wajib dipilih dari master product.
- Draft sale bisa dibuat, lalu diposting.
- Posting sale membuat stock movement OUT untuk setiap item.
- Sale bisa dibatalkan selama belum diposting.
- UI ERP untuk list, create, post, cancel sale.

## Out of Scope
- Auto journal finance detail ditunda ke BBO-12 Account Mapping.
- POS mobile/refactor ditangani di BBO-9.
- Refund/return ditangani task terpisah.

## Status Flow
```text
DRAFT → POSTED
  ↘
 CANCELLED
```

## Business Rules
1. Sales harus punya minimal 1 item.
2. Quantity item minimal 1.
3. Unit price minimal 0 dan default dari `selling_price` product.
4. Saat POSTED:
   - sistem cek stok cukup berdasarkan total stock movement existing.
   - membuat stock movement `OUT` dengan quantity negatif.
   - `reference_type = SALE`.
   - `reference_id = sales order id`.
5. Jika stok tidak cukup, posting ditolak.
6. Sales yang sudah POSTED tidak bisa diubah/dibatalkan.

## Acceptance Criteria
- API create/list/get/update/post/cancel sales tersedia.
- Posting sale mengurangi stok lewat `erp_stock_movement`.
- Insufficient stock mengembalikan error 400.
- Frontend `/sales-orders` tersedia dari menu Transaksi.
- QA local dan Cloudflare pass.

## API
```text
GET    /erp/api/v1/sales-orders
POST   /erp/api/v1/sales-orders
GET    /erp/api/v1/sales-orders/{id}
PUT    /erp/api/v1/sales-orders/{id}
POST   /erp/api/v1/sales-orders/{id}/post
POST   /erp/api/v1/sales-orders/{id}/cancel
```
