const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { prisma } = require('../config/prisma');

async function main() {
  try {
    console.log('Upgrading Rainbow and Anbu hospitals...');
    
    // 1. Update the plans to 'Enterprise' in nexus.tenants
    const updateResult = await prisma.$executeRawUnsafe(`
      UPDATE nexus.tenants 
      SET plan = 'Enterprise' 
      WHERE name LIKE '%Rainbow%' OR name LIKE '%Anbu%'
    `);
    
    console.log(`Updated ${updateResult} rows in nexus.tenants.`);
    
    // 2. Fetch updated tenants to verify
    const tenants = await prisma.$queryRawUnsafe(`
      SELECT id, name, db_name, plan FROM nexus.tenants WHERE name LIKE '%Rainbow%' OR name LIKE '%Anbu%'
    `);
    console.log('Updated Tenants:', tenants);
    
  } catch (err) {
    console.error('Error during upgrade:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
