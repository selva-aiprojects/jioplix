const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const tenants = await prisma.$queryRawUnsafe('SELECT id, db_name, name, code FROM nexus.tenants');
    console.log('Tenants:', JSON.stringify(tenants, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
