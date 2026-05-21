# BBO-12: Account Mapping & Auto-Journal — Final Polish

## Current State

- **ErpAccountMapping** model ✅
- **CRUD endpoints** at `/master/account-mappings` ✅
- **Auto-journal in posting engine** uses mappings ✅
- **POS integration** seeds SALE mappings on first sync ✅
- **Existing mappings:** Only SALE (Kas DEBIT, Pendapatan Jasa CREDIT)

## What's Needed

1. **Seed default mappings** for all transaction types:
   - `SALE` → Kas (DEBIT), Pendapatan Jasa/Produk (CREDIT) ✅ Already exists
   - `PURCHASE` → Persediaan (DEBIT), Hutang Usaha (CREDIT)
   - `EXPENSE` → Beban terkait (DEBIT), Kas (CREDIT)
   - `RECEIPT` → Kas (DEBIT), Piutang Usaha (CREDIT)

2. **Verify auto-journal** works for all transaction types with mappings

3. **Frontend** — Link account-mappings from settings menu (if not already)

## Completed

✅ Backend CRUD for account mappings
✅ Auto-journal uses ErpAccountMapping
✅ Default SALE mappings seeded on POS sync
✅ All transaction type mappings seeded

## Account Structure

| Code | Name | Type |
|---|---|---|
| 1-110 | Kas | Current Asset |
| 1-120 | Bank | Current Asset |
| 1-130 | Piutang Usaha | Current Asset |
| 1-140 | Perlengkapan Salon | Current Asset |
| 2-110 | Hutang Usaha | Current Liability |
| 4-100 | Pendapatan Jasa | Revenue |
| 4-200 | Pendapatan Produk | Revenue |
| 5-100 | Beban Gaji | Expense |
| 5-110 | Beban Sewa | Expense |
