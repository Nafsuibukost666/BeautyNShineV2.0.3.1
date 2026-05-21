"""List POS users from the database."""
import sys; sys.path.insert(0, '.')
from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
rows = db.execute(text('SELECT id, username, role, active FROM "User" ORDER BY created_at DESC LIMIT 30')).mappings().all()
for r in rows:
    active = 'ACTIVE' if r['active'] else 'inactive'
    print(f'{str(r["id"]):38s} {r["username"]:20s} {r["role"]:10s} [{active}]')
db.close()
