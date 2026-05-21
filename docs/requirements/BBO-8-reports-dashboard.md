# BBO-8 — Reports & Dashboard

## Tujuan
Membuat dashboard dan laporan ERP membaca data transaksi terbaru dari modul BBO-6 Purchase Order dan BBO-7 Sales Order, bukan hanya dari transaksi posting lama.

## Scope
- Endpoint dashboard summary untuk KPI cepat owner/PM.
- Sales report membaca `erp_sales_order` status `POSTED`.
- Daily summary membaca sales order baru dan expense lama.
- Dashboard frontend menampilkan KPI, grafik 7 hari, recent transactions, dan low stock.
- Reports frontend menampilkan sales report dengan shape response backend yang benar.

## Out of Scope
- Auto journal finance detail tetap ditunda ke BBO-12 Account Mapping.
- Advanced BI export PDF/Excel ditangani task terpisah.

## Dashboard KPIs
- Total sales periode berjalan.
- Total sales hari ini.
- Jumlah sales order POSTED.
- Average order value.
- Total purchase order.
- Jumlah produk/customer/supplier/service aktif.
- Low stock products.
- Recent transactions.
- Daily sales chart.

## API Baru
```text
GET /erp/api/v1/reports/dashboard-summary?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
```

## Acceptance Criteria
1. Dashboard summary API tersedia dan return `success=true`.
2. Sales report `/reports/sales` memakai `erp_sales_order` status `POSTED`.
3. Dashboard UI tidak lagi memakai mock random sales.
4. `/reports` bisa menampilkan sales `periods` dari API.
5. Local API QA pass.
6. Frontend build pass.
7. Cloudflare API dan route dashboard/report pass.
