# BBO-5: Master Data CRUD — Customers & Suppliers

## Scope
Implement master data for Customers (pelanggan salon) and Suppliers (pemasok produk/perlengkapan).

## Discovery
- Frontend `Customers.tsx` already exists and calls `/customers`.
- Frontend Suppliers page does not exist yet.
- Backend Customer/Supplier models, schemas, services, and routers do not exist.

## Acceptance Criteria

### Customers
- [x] `GET /erp/api/v1/customers` list active customers, optional `search`.
- [x] `POST /erp/api/v1/customers` create customer.
- [x] `GET /erp/api/v1/customers/{id}` get by ID.
- [x] `PUT /erp/api/v1/customers/{id}` update customer.
- [x] `DELETE /erp/api/v1/customers/{id}` soft-delete.
- [x] Fields: name, phone, email, address, notes, total_visits, is_active.
- [x] Compatible with existing `Customers.tsx`.

### Suppliers
- [x] `GET /erp/api/v1/suppliers` list active suppliers, optional `search`.
- [x] `POST /erp/api/v1/suppliers` create supplier.
- [x] `GET /erp/api/v1/suppliers/{id}` get by ID.
- [x] `PUT /erp/api/v1/suppliers/{id}` update supplier.
- [x] `DELETE /erp/api/v1/suppliers/{id}` soft-delete.
- [x] Fields: name, phone, email, address, contact_person, notes, is_active.
- [x] New frontend page `Suppliers.tsx` available via sidebar Master menu.

### General
- [x] API response wrapper `{success, data}`.
- [x] Auth required.
- [x] Test via localhost and Cloudflare route.
