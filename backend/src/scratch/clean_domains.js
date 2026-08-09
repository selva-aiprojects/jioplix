const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { prisma } = require('../config/prisma');

async function main() {
  try {
    console.log('[MIGRATION] Sanitizing nexus.tenants domain column...');

    const before = await prisma.$queryRawUnsafe(`SELECT id, name, code, domain FROM nexus.tenants`);
    console.log('Tenants before update:', before);

    const result = await prisma.$executeRawUnsafe(`
      UPDATE nexus.tenants
      SET domain = LOWER(REGEXP_REPLACE(COALESCE(domain, code, name), '[^a-zA-Z0-9]', '', 'g'))
      WHERE domain IS NULL OR domain ~ '[^a-zA-Z0-9]';
    `);

    console.log(`Updated ${result} rows in nexus.tenants.`);

    const after = await prisma.$queryRawUnsafe(`SELECT id, name, code, domain FROM nexus.tenants`);
    console.log('Tenants after update:', after);
  } catch (err) {
    console.error('Error during domain cleanup:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
