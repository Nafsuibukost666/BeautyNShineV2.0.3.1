-- ============================================================
-- Database Schema for Salon Eyelash ERP
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) DEFAULT '',
  instagram VARCHAR(255) DEFAULT '',
  birthday DATE,
  notes TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Services (layanan salon)
CREATE TABLE IF NOT EXISTS services (
  service_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT '',
  price BIGINT NOT NULL DEFAULT 0,
  duration_min INT DEFAULT 60,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Staff / Therapists
CREATE TABLE IF NOT EXISTS staff (
  staff_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_name VARCHAR(255) NOT NULL,
  role VARCHAR(100) DEFAULT 'Therapist',
  phone VARCHAR(50) DEFAULT '',
  commission_type VARCHAR(20) DEFAULT 'percentage',
  commission_value NUMERIC(10,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products (stok produk & bahan baku)
CREATE TABLE IF NOT EXISTS products (
  product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT '',
  sku VARCHAR(100) DEFAULT '',
  cost_price BIGINT DEFAULT 0,
  selling_price BIGINT DEFAULT 0,
  stock_qty INT DEFAULT 0,
  min_stock INT DEFAULT 5,
  unit VARCHAR(50) DEFAULT 'pcs',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions (POS)
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_code VARCHAR(50) UNIQUE NOT NULL,
  transaction_date TIMESTAMP DEFAULT NOW(),
  customer_id UUID REFERENCES customers(customer_id),
  customer_name VARCHAR(255),
  staff_id UUID REFERENCES staff(staff_id),
  staff_name VARCHAR(255),
  subtotal BIGINT DEFAULT 0,
  discount BIGINT DEFAULT 0,
  tax BIGINT DEFAULT 0,
  grand_total BIGINT DEFAULT 0,
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transaction Items
CREATE TABLE IF NOT EXISTS transaction_items (
  item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(transaction_id) ON DELETE CASCADE,
  item_type VARCHAR(20) DEFAULT 'service',
  item_id_ref VARCHAR(255),
  item_name VARCHAR(255) NOT NULL,
  qty INT DEFAULT 1,
  unit_price BIGINT DEFAULT 0,
  discount BIGINT DEFAULT 0,
  line_total BIGINT DEFAULT 0,
  staff_id UUID REFERENCES staff(staff_id),
  staff_name VARCHAR(255)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES transactions(transaction_id) ON DELETE CASCADE,
  payment_date TIMESTAMP DEFAULT NOW(),
  method VARCHAR(50) DEFAULT 'Cash',
  amount BIGINT DEFAULT 0,
  reference_no VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  booking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  customer_id UUID REFERENCES customers(customer_id),
  customer_name VARCHAR(255),
  service_id UUID REFERENCES services(service_id),
  service_name VARCHAR(255),
  staff_id UUID REFERENCES staff(staff_id),
  staff_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'booked',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Expenses (pengeluaran)
CREATE TABLE IF NOT EXISTS expenses (
  expense_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_date DATE DEFAULT CURRENT_DATE,
  category VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  amount BIGINT NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'Cash',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT DEFAULT '',
  description TEXT DEFAULT ''
);

-- Users (untuk hak akses nanti)
CREATE TABLE IF NOT EXISTS users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) DEFAULT '',
  role VARCHAR(20) DEFAULT 'kasir',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO settings (setting_key, setting_value, description) VALUES
  ('business_name', 'Salon Eyelash', 'Nama usaha salon'),
  ('currency', 'IDR', 'Mata uang'),
  ('tax_rate', '0', 'Pajak dalam persen')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO services (service_name, category, price, duration_min) VALUES
  ('Classic Eyelash', 'Eyelash Extension', 250000, 90),
  ('Volume Eyelash', 'Eyelash Extension', 350000, 120),
  ('Lash Lift', 'Treatment', 200000, 60),
  ('Retouch Eyelash', 'Maintenance', 150000, 60)
ON CONFLICT DO NOTHING;

INSERT INTO staff (staff_name, role, commission_type, commission_value) VALUES
  ('Therapist 1', 'Therapist', 'percentage', 10),
  ('Therapist 2', 'Therapist', 'percentage', 10)
ON CONFLICT DO NOTHING;

-- Users: jangan seed di sini. Seed.js yang handle (biar bcrypt hash-nya bener)
-- Lihat backend/src/seed.js untuk user seeding
