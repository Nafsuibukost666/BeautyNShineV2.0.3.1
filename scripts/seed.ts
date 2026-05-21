/**
 * Seed Data — Data Awal untuk Salon Eyelash ERP v2
 *
 * Skrip ini mengisi database dengan data awal (seed data) yang diperlukan
 * untuk menjalankan sistem. Data yang dibuat meliputi:
 *
 *   1. User Owner
 *      - Username: admin | Password: admin123 | Role: OWNER
 *      - Menggunakan upsert agar aman dijalankan berulang kali
 *
 *   2. Layanan (Services) — 3 layanan sampel:
 *      - Extension Classic  → Rp 150.000 (90 menit)
 *      - Extension Volume   → Rp 200.000 (120 menit)
 *      - Lifting            → Rp 100.000 (60 menit)
 *
 *   3. Staff — 2 terapis sampel:
 *      - Sari  → Therapist, komisi 30% (PERCENTAGE)
 *      - Dinda → Therapist, komisi 30% (PERCENTAGE)
 *
 * Penggunaan:
 *   npx ts-node scripts/seed.ts
 *   atau via Prisma: npx prisma db seed
 */
import { PrismaClient, UserRole, CommissionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ───────────────────────────────────────────────────────────────────────────
  // 1. Create Owner User
  // ───────────────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Use upsert so re-running is safe
  const owner = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPassword,
      role: UserRole.OWNER,
    },
    create: {
      username: 'admin',
      password: hashedPassword,
      role: UserRole.OWNER,
      active: true,
    },
  });

  console.log(`  ✓ User: ${owner.username} (${owner.role})`);

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Create Sample Services
  // ───────────────────────────────────────────────────────────────────────────
  // Delete existing seed services by name to avoid duplicates on re-run
  const existingServiceNames = ['Extension Classic', 'Extension Volume', 'Lifting'];
  await prisma.service.deleteMany({
    where: { name: { in: existingServiceNames } },
  });

  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Extension Classic',
        category: 'Extension',
        price: 150000n,
        duration_min: 90,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Extension Volume',
        category: 'Extension',
        price: 200000n,
        duration_min: 120,
        active: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Lifting',
        category: 'Lifting',
        price: 100000n,
        duration_min: 60,
        active: true,
      },
    }),
  ]);

  for (const s of services) {
    console.log(`  ✓ Service: ${s.name} (Rp ${s.price})`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Create Sample Staff
  // ───────────────────────────────────────────────────────────────────────────
  const existingStaffNames = ['Sari', 'Dinda'];
  await prisma.staff.deleteMany({
    where: { name: { in: existingStaffNames } },
  });

  const staffList = await Promise.all([
    prisma.staff.create({
      data: {
        name: 'Sari',
        role: 'Therapist',
        commission_type: CommissionType.PERCENTAGE,
        commission_value: 30,
        active: true,
      },
    }),
    prisma.staff.create({
      data: {
        name: 'Dinda',
        role: 'Therapist',
        commission_type: CommissionType.PERCENTAGE,
        commission_value: 30,
        active: true,
      },
    }),
  ]);

  for (const stf of staffList) {
    console.log(`  ✓ Staff: ${stf.name} (${stf.role})`);
  }

  console.log('\n✅ Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
