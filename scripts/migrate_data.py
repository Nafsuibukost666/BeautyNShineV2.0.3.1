#!/usr/bin/env python3
"""
Migrate data from OLD Salon ERP to NEW Salon ERP v2
OLD DB: localhost:5432/salon_eyelash
NEW DB: localhost:5433/salon_v2
"""
import psycopg2
import psycopg2.extras
from datetime import datetime

# Connection params
OLD = {"host": "localhost", "port": 5432, "dbname": "salon_eyelash", "user": "salon", "password": "salon123"}
NEW = {"host": "localhost", "port": 5433, "dbname": "salon_v2", "user": "salon", "password": "salon123"}

def connect(params):
    return psycopg2.connect(**params)

def migrate_users(old, new_conn, new):
    print("\n=== Migrating Users ===")
    cur = old.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM users ORDER BY created_at")
    rows = cur.fetchall()
    print(f"  Found {len(rows)} users")
    for r in rows:
        new.execute(
            """INSERT INTO "User" (id, username, password, role, active, created_at, updated_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (username) DO NOTHING""",
            (str(r['user_id']), r['username'], r['password_hash'],
             r['role'].upper().replace('KASIR','STAFF').replace('OWNER','OWNER') if r['role'] else 'OWNER',
             r['active'], r['created_at'], r['created_at'])
        )
    new_conn.commit()
    print(f"  ✅ {len(rows)} users migrated")

def migrate_customers(old, new_conn, new):
    print("\n=== Migrating Customers ===")
    cur = old.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM customers ORDER BY created_at")
    rows = cur.fetchall()
    print(f"  Found {len(rows)} customers")
    for r in rows:
        new.execute(
            """INSERT INTO "Customer" (id, name, phone, instagram, birthday, notes, total_visit, total_spending, active, created_at, updated_at)
               VALUES (%s, %s, %s, %s, %s, %s, 0, 0, %s, %s, %s)
               ON CONFLICT (id) DO NOTHING""",
            (str(r['customer_id']), r['customer_name'],
             r['phone'] if r['phone'] else None,
             r['instagram'] if r['instagram'] else None,
             r['birthday'], r['notes'] if r['notes'] else None,
             r['active'], r['created_at'], r['updated_at'])
        )
    new_conn.commit()
    print(f"  ✅ {len(rows)} customers migrated")

def migrate_services(old, new_conn, new):
    print("\n=== Migrating Services ===")
    cur = old.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM services ORDER BY created_at")
    rows = cur.fetchall()
    print(f"  Found {len(rows)} services")
    for r in rows:
        new.execute(
            """INSERT INTO "Service" (id, name, category, price, duration_min, active, created_at, updated_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (id) DO NOTHING""",
            (str(r['service_id']), r['service_name'],
             r['category'] if r['category'] else None,
             r['price'], r['duration_min'] or 60,
             r['active'], r['created_at'], r['updated_at'])
        )
    new_conn.commit()
    print(f"  ✅ {len(rows)} services migrated")

def migrate_staff(old, new_conn, new):
    print("\n=== Migrating Staff ===")
    cur = old.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM staff ORDER BY created_at")
    rows = cur.fetchall()
    print(f"  Found {len(rows)} staff")
    for r in rows:
        new.execute(
            """INSERT INTO "Staff" (id, name, role, phone, commission_type, commission_value, active, created_at, updated_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (id) DO NOTHING""",
            (str(r['staff_id']), r['staff_name'],
             r['role'] or 'Therapist',
             r['phone'] if r['phone'] else None,
             r['commission_type'].upper() if r['commission_type'] else 'PERCENTAGE',
             r['commission_value'] or 0,
             r['active'], r['created_at'], r['updated_at'])
        )
    new_conn.commit()
    print(f"  ✅ {len(rows)} staff migrated")

def migrate_transactions(old, new_conn, new):
    print("\n=== Migrating Transactions ===")
    cur = old.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM transactions ORDER BY created_at")
    rows = cur.fetchall()
    print(f"  Found {len(rows)} transactions")
    for r in rows:
        new.execute(
            """INSERT INTO "Transaction" (id, code, date, customer_id, customer_name, staff_id, staff_name,
               subtotal, discount, grand_total, payment_status, notes, created_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (id) DO NOTHING""",
            (str(r['transaction_id']), r['transaction_code'],
             r['transaction_date'], str(r['customer_id']) if r['customer_id'] else None,
             r['customer_name'] or '',
             str(r['staff_id']) if r['staff_id'] else None,
             r['staff_name'] or '',
             r['subtotal'] or 0, r['discount'] or 0,
             r['grand_total'] or 0,
             r['payment_status'].upper() if r['payment_status'] else 'UNPAID',
             r['notes'] if r['notes'] else None, r['created_at'])
        )
    new_conn.commit()
    print(f"  ✅ {len(rows)} transactions migrated")

def migrate_transaction_items(old, new_conn, new):
    print("\n=== Migrating Transaction Items ===")
    cur = old.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM transaction_items ORDER BY item_id")
    rows = cur.fetchall()
    print(f"  Found {len(rows)} transaction items")
    for r in rows:
        new.execute(
            """INSERT INTO "TransactionItem" (id, transaction_id, item_type, item_name,
               qty, unit_price, discount, line_total, staff_id, staff_name)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (id) DO NOTHING""",
            (str(r['item_id']), str(r['transaction_id']),
             r['item_type'] or 'service', r['item_name'],
             r['qty'] or 1, r['unit_price'] or 0,
             r['discount'] or 0, r['line_total'] or 0,
             str(r['staff_id']) if r['staff_id'] else None,
             r['staff_name'] if r['staff_name'] else None)
        )
    new_conn.commit()
    print(f"  ✅ {len(rows)} transaction items migrated")

def migrate_payments(old, new_conn, new):
    print("\n=== Migrating Payments ===")
    cur = old.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM payments ORDER BY created_at")
    rows = cur.fetchall()
    print(f"  Found {len(rows)} payments")
    for r in rows:
        new.execute(
            """INSERT INTO "Payment" (id, transaction_id, method, amount, reference_no, created_at)
               VALUES (%s, %s, %s, %s, %s, %s)
               ON CONFLICT (id) DO NOTHING""",
            (str(r['payment_id']), str(r['transaction_id']),
             r['method'] or 'Cash', r['amount'] or 0,
             r['reference_no'] if r['reference_no'] else None,
             r['created_at'])
        )
    new_conn.commit()
    print(f"  ✅ {len(rows)} payments migrated")

def migrate_bookings(old, new_conn, new):
    print("\n=== Migrating Bookings ===")
    cur = old.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM bookings ORDER BY created_at")
    rows = cur.fetchall()
    print(f"  Found {len(rows)} bookings")
    for r in rows:
        new.execute(
            """INSERT INTO "Booking" (id, date, time, customer_id, customer_name, customer_phone,
               service_id, service_name, staff_id, staff_name, status, notes, created_at, updated_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (id) DO NOTHING""",
            (str(r['booking_id']), r['booking_date'], str(r['booking_time']),
             str(r['customer_id']) if r['customer_id'] else None,
             r['customer_name'] or '',
             None,
             str(r['service_id']) if r['service_id'] else None,
             r['service_name'] if r['service_name'] else None,
             str(r['staff_id']) if r['staff_id'] else None,
             r['staff_name'] if r['staff_name'] else None,
             r['status'].upper() if r['status'] else 'BOOKED',
             r['notes'] if r['notes'] else None,
             r['created_at'], r['updated_at'])
        )
    new_conn.commit()
    print(f"  ✅ {len(rows)} bookings migrated")

def migrate_settings(old, new_conn, new):
    print("\n=== Migrating Settings ===")
    cur = old.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM settings ORDER BY setting_key")
    rows = cur.fetchall()
    print(f"  Found {len(rows)} settings")
    for r in rows:
        new.execute(
            """INSERT INTO "Setting" (id, key, value)
               VALUES (%s, %s, %s)
               ON CONFLICT (key) DO NOTHING""",
            (r['setting_key'], r['setting_key'], r['setting_value'] or '')
        )
    new_conn.commit()
    print(f"  ✅ {len(rows)} settings migrated")

def main():
    print("=" * 50)
    print("  SALON EYELASH ERP v2 - DATA MIGRATION")
    print("=" * 50)
    old = connect(OLD)
    new_conn = connect(NEW)
    new = new_conn.cursor()
    new_conn.autocommit = False
    try:
        migrate_users(old, new_conn, new)
        migrate_customers(old, new_conn, new)
        migrate_services(old, new_conn, new)
        migrate_staff(old, new_conn, new)
        migrate_transactions(old, new_conn, new)
        migrate_transaction_items(old, new_conn, new)
        migrate_payments(old, new_conn, new)
        migrate_bookings(old, new_conn, new)
        migrate_settings(old, new_conn, new)
        print("\n" + "=" * 50)
        print("  ✅ MIGRATION COMPLETE!")
        print("=" * 50)
    except Exception as e:
        new_conn.rollback()
        print(f"\n❌ MIGRATION FAILED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        old.close()
        new_conn.close()

if __name__ == "__main__":
    main()
