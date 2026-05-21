# BBO-6: ERP Transaction — Purchase Order

## Scope
Implement Purchase Order workflow for purchasing salon products from suppliers.

## Acceptance Criteria
- [x] Create PO with supplier, order date, expected date, notes, and line items.
- [x] PO statuses: DRAFT, ORDERED, PARTIAL_RECEIVED, RECEIVED, CANCELLED.
- [x] List/search PO by status/supplier.
- [x] Get PO detail with supplier and item product info.
- [x] Update DRAFT/ORDERED PO.
- [x] Mark PO as ORDERED.
- [x] Receive goods by quantity per item.
- [x] Receiving creates stock movement IN with reference type PURCHASE.
- [x] PO total amount and received quantity auto-calculated.
- [x] Frontend Purchase Orders page available.
- [x] API auth required and Cloudflare route works.

## API
- `GET /erp/api/v1/purchase-orders`
- `POST /erp/api/v1/purchase-orders`
- `GET /erp/api/v1/purchase-orders/{id}`
- `PUT /erp/api/v1/purchase-orders/{id}`
- `POST /erp/api/v1/purchase-orders/{id}/order`
- `POST /erp/api/v1/purchase-orders/{id}/receive`
- `POST /erp/api/v1/purchase-orders/{id}/cancel`

## Business Rule
- Receive can only happen for ORDERED or PARTIAL_RECEIVED.
- Received quantity cannot exceed ordered quantity.
- Full receive changes status to RECEIVED.
- Partial receive changes status to PARTIAL_RECEIVED.
