const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create owner user
  const existing = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: { username: 'admin', password: hash, role: 'OWNER' },
    });
    console.log('✅ Owner: admin / admin123');
  }

  // 2. Services
  await prisma.service.deleteMany({});
  const svcs = [
    { name: 'Extension Classic', category: 'Extension', price: 150000, duration_min: 90 },
    { name: 'Extension Volume', category: 'Extension', price: 200000, duration_min: 120 },
    { name: 'Lifting', category: 'Lifting', price: 100000, duration_min: 60 },
    { name: 'Coloring', category: 'Coloring', price: 120000, duration_min: 45 },
  ];
  for (const s of svcs) await prisma.service.create({ data: s });
  console.log(`✅ ${svcs.length} services`);

  // 3. Staff
  await prisma.staff.deleteMany({});
  const stf = [
    { name: 'Sari', role: 'Therapist', commission_type: 'PERCENTAGE', commission_value: 30 },
    { name: 'Dinda', role: 'Therapist', commission_type: 'PERCENTAGE', commission_value: 30 },
  ];
  for (const s of stf) await prisma.staff.create({ data: s });
  console.log(`✅ ${stf.length} staff`);

  // 4. Settings
  for (const { key, value } of [
    { key: 'business_name', value: 'Salon Eyelash' },
    { key: 'payment_methods', value: 'Cash,QRIS,Transfer,Debit,Credit' },
  ]) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log('✅ Settings');
  console.log('🎉 Seed complete!');
}

main().catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
