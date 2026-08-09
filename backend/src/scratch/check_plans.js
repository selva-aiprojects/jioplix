const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { prisma } = require('../config/prisma');

async function main() {
  try {
    const tenants = await prisma.$queryRawUnsafe(`SELECT id, name, code, domain, plan FROM nexus.tenants`);
    console.log('Tenants in nexus.tenants:', tenants);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
