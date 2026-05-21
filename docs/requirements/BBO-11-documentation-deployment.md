# BBO-11: Dokumentasi & Deployment

## Scope

1. **Dokumentasi API** — OpenAPI/Swagger docs sudah aktif di `/erp/docs`
2. **Deployment POS Expo** — Build web version of Expo POS and deploy via nginx
3. **Dokumentasi fitur per modul**

## POS Expo Deployment Steps

1. Build web export: `npx expo export --platform web`
2. Output to `/home/ubuntu/salon-eyelash-v2/apps/pos/dist-web/`
3. Add nginx location `/pos-expo/`
4. Reload nginx

## Documented Modules

| Module | Status |
|---|---|
| Health/Auth | ✅ Live |
| Services | ✅ Live |
| Customers | ✅ Live |
| Suppliers | ✅ Live |
| Master Data | ✅ Live |
| Purchase Orders | ✅ Live |
| Sales Orders | ✅ Live |
| Inventory | ✅ Live |
| POS Integration | ✅ Live |
| Reports | ✅ Live |
| Posting Engine | ✅ Live |
| Document Registry | ✅ Live |
