// ============================================================
// Seed script — run ONCE after database is created
// Run: node src/seed.js
// ============================================================

const pool = require('./db');

async function seed() {
  console.log('🌱 Seeding database...\n');

  try {
    // Check if already seeded
    const existing = await pool.query('SELECT COUNT(*) FROM services');
    if (parseInt(existing.rows[0].count) === 0) {
      // Settings
      await pool.query(`INSERT INTO settings (setting_key, setting_value, description) VALUES
        ('business_name', 'Salon Eyelash', 'Nama usaha salon'),
        ('currency', 'IDR', 'Mata uang'),
        ('tax_rate', '0', 'Pajak dalam persen')`);
      console.log('  ✓ Settings seeded');

      // Services
      await pool.query(`INSERT INTO services (service_name, category, price, duration_min) VALUES
        ('Classic Eyelash', 'Eyelash Extension', 250000, 90),
        ('Volume Eyelash', 'Eyelash Extension', 350000, 120),
        ('Lash Lift', 'Treatment', 200000, 60),
        ('Retouch Eyelash', 'Maintenance', 150000, 60)`);
      console.log('  ✓ Services seeded');

      // Staff
      await pool.query(`INSERT INTO staff (staff_name, role, commission_type, commission_value) VALUES
        ('Therapist 1', 'Therapist', 'percentage', 10),
        ('Therapist 2', 'Therapist', 'percentage', 10)`);
      console.log('  ✓ Staff seeded');
    } else {
      console.log('  ✓ Data already exists (services, staff, settings)');
    }

    // ==========================================================
    // USERS — selalu jalan buat fixing dummy hash dari init.sql
    // ==========================================================
    const bcrypt = require('bcryptjs');

    // Admin user: update hash if dummy, otherwise insert
    const adminHash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET password_hash = $2, full_name = $3, role = $4
       WHERE users.password_hash LIKE '$2b$10$dummy%'`,
      ['admin', adminHash, 'Admin Owner', 'owner']
    );
    console.log('  ✓ Admin user (username: admin, password: admin123)');

    // Kasir user: update hash if dummy, otherwise insert
    const kasirHash = await bcrypt.hash('kasir123', 10);
    await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (username) DO UPDATE SET password_hash = $2, full_name = $3, role = $4
       WHERE users.password_hash LIKE '$2b$10$dummy%'`,
      ['kasir1', kasirHash, 'Kasir 1', 'kasir']
    );
    console.log('  ✓ Kasir user (username: kasir1, password: kasir123)');

    console.log('\n✅ Seeding complete!');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await pool.end();
  }
}

seed();
