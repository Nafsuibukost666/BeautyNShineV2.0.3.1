"""Check what data exists in the ERP database."""
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    # Count services
    r = conn.execute(text("SELECT count(*) FROM public.erp_master_service"))
    services_count = r.scalar()
    print(f"Services: {services_count}")

    if services_count > 0:
        r = conn.execute(text("SELECT id, name, price FROM public.erp_master_service WHERE is_active = true LIMIT 10"))
        for row in r:
            print(f"  - {row.id}: {row.name} (Rp {row.price})")

    # Count products
    r = conn.execute(text("SELECT count(*) FROM public.erp_master_product"))
    products_count = r.scalar()
    print(f"\nProducts: {products_count}")

    if products_count > 0:
        r = conn.execute(text("SELECT id, name, selling_price, category FROM public.erp_master_product WHERE is_active = true LIMIT 10"))
        for row in r:
            print(f"  - {row.id}: {row.name} (Rp {row.selling_price})")

    # Count customers
    r = conn.execute(text("SELECT count(*) FROM public.erp_master_customer"))
    cust_count = r.scalar()
    print(f"\nCustomers: {cust_count}")

    if cust_count > 0:
        r = conn.execute(text("SELECT id, name, phone FROM public.erp_master_customer LIMIT 10"))
        for row in r:
            print(f"  - {row.id}: {row.name} ({row.phone})")

    # List all tables
    r = conn.execute(text(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema='public' ORDER BY table_name"
    ))
    tables = [row[0] for row in r]
    print(f"\nAll tables ({len(tables)}):")
    for t in tables:
        print(f"  - {t}")
