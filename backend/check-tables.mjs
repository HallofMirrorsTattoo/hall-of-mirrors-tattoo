import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const tables = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log('Tables in database:');
  tables.forEach((row) => {
    console.log(`  - ${row.table_name}`);
  });
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await prisma.$disconnect();
}
