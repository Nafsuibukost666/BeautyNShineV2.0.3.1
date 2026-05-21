# BBO-10: Integration Testing & QA

## Scope

Comprehensive integration testing for all ERP Core API endpoints.

## Backend Structure

| File | Prefix | Key Endpoints | Status |
|---|---|---|---|
| `auth.py` | `/erp/api/v1/auth` | Login | BBO-4 |
| `services.py` | `/erp/api/v1/services` | CRUD + search + soft-delete | BBO-4 |
| `customers.py` | `/erp/api/v1/customers` | CRUD | BBO-5 |
| `suppliers.py` | `/erp/api/v1/suppliers` | CRUD | BBO-5 |
| `purchase_orders.py` | `/erp/api/v1/purchase-orders` | CRUD + POST + RECEIVE + CANCEL | BBO-6 |
| `sales_orders.py` | `/erp/api/v1/sales-orders` | CRUD + POST + CANCEL | BBO-7 |
| `inventory.py` | `/erp/api/v1/inventory` | Stock movements, stock list | BBO-7 |
| `master_data.py` | `/erp/api/v1/master` | Products, Categories, Accounts, Taxes, Branches, Staff | BBO-4 |
| `pos_integration.py` | `/erp/api/v1/pos` | POS sync transactions, settlements | BBO-9 |
| `reporting.py` | `/erp/api/v1/reports` | Dashboard summary, sales, purchase, finance | BBO-8 |
| `posting.py` | `/erp/api/v1` | Posting engine, journals | BBO-4 |

## Test Coverage

1. **Health Check** — `/erp/health`
2. **Auth** — POST login
3. **Services** — CRUD + search (`/search`) + soft-delete
4. **Customers** — CRUD
5. **Suppliers** — CRUD
6. **Purchase Orders** — CRUD + POST + RECEIVE + CANCEL
7. **Sales Orders** — CRUD + POST + CANCEL
8. **Inventory** — Stock list
9. **Master Data** — Products, Categories, Accounts, Taxes, Branches, Staff
10. **POS Integration** — Sync transaction + list
11. **Reports** — Dashboard summary
