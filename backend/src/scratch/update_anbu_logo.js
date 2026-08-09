const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { prisma } = require('../config/prisma');

async function main() {
  try {
    console.log('[MIGRATION] Updating logo for Anbu Hospitals in nexus.tenants...');

    const logoUrl = '/anbu_logo.png';

    const result = await prisma.$executeRawUnsafe(`
      UPDATE nexus.tenants
      SET logo_url = $1,
          ui_settings = jsonb_set(COALESCE(ui_settings, '{}'::jsonb), '{logoUrl}', to_jsonb($1::text))
      WHERE name LIKE '%Anbu%' OR code ILIKE '%anbu%' OR domain ILIKE '%anbu%';
    `, logoUrl);

    console.log(`Updated ${result} rows in nexus.tenants.`);

    const tenant = await prisma.$queryRawUnsafe(`
      SELECT id, name, domain, logo_url, ui_settings FROM nexus.tenants WHERE name LIKE '%Anbu%'
    `);
    console.log('Updated Tenant:', tenant);

  } catch (err) {
    console.error('Error updating logo:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
