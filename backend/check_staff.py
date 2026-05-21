"""Check staff/user data."""
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    # Check Prisma Staff table
    r = conn.execute(text(
        "SELECT table_name, column_name FROM information_schema.columns "
        "WHERE table_schema='public' AND (table_name = 'Staff' OR table_name = 'User') "
        "ORDER BY table_name, ordinal_position"
    ))
    current_table = None
    for row in r:
        if row.table_name != current_table:
            print(f"\n=== {row.table_name} ===")
            current_table = row.table_name
        print(f"  {row.column_name}")

    # Check erp_master_staff
    print("\n=== erp_master_staff ===")
    r = conn.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_schema='public' AND table_name = 'erp_master_staff' "
        "ORDER BY ordinal_position"
    ))
    for row in r:
        print(f"  {row.column_name}")

    # Check data count
    tables = ['Staff', 'User', 'erp_master_staff']
    for t in tables:
        try:
            r = conn.execute(text(f"SELECT count(*) FROM public.\"{t}\"") if t != t.lower() 
                           else text(f"SELECT count(*) FROM public.{t}"))
            print(f"\n{t}: {r.scalar()} records")
        except Exception as e:
            print(f"\n{t}: error - {e}")
