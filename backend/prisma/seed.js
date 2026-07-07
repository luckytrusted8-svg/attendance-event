const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding roles...');

  const roleLevel1 = await prisma.role.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Admin Level 1',
      description: 'Admin pengelola/penyelenggara event. Membuat & publish event, mengelola admin lain, melihat seluruh laporan, statistik, dan data peserta.',
    },
  });

  const roleLevel2 = await prisma.role.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Admin Level 2',
      description: 'Admin lapangan/petugas hari-H. Scan QR Code peserta, absensi manual, melihat daftar kehadiran per event.',
    },
  });

  console.log('Seeding default admins...');

  const passwordHash1 = await bcrypt.hash('admin123', 10);
  const passwordHash2 = await bcrypt.hash('admin123', 10);

  await prisma.admin.upsert({
    where: { email: 'admin1@event.com' },
    update: {},
    create: {
      roleId: roleLevel1.id,
      fullname: 'Admin Penyelenggara',
      email: 'admin1@event.com',
      password: passwordHash1,
    },
  });

  await prisma.admin.upsert({
    where: { email: 'admin2@event.com' },
    update: {},
    create: {
      roleId: roleLevel2.id,
      fullname: 'Admin Lapangan',
      email: 'admin2@event.com',
      password: passwordHash2,
    },
  });

  console.log('Seeding done.');
  console.log('Login Admin Level 1 -> admin1@event.com / admin123');
  console.log('Login Admin Level 2 -> admin2@event.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
