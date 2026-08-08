process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes('sslmode=require') ? { rejectUnauthorized: false } : false, max: 2 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
(async () => {
  try {
    const del = await prisma.$executeRawUnsafe(`DELETE FROM "kkcth".helpdesk_equipment WHERE asset_tag LIKE 'E2E-%'`);
    const del2 = await prisma.$executeRawUnsafe(`DELETE FROM "kkcth".helpdesk_escalations WHERE ticket_id IN (SELECT id FROM "kkcth".helpdesk_tickets WHERE subject LIKE 'E2E %')`);
    const del3 = await prisma.$executeRawUnsafe(`DELETE FROM "kkcth".helpdesk_ticket_notes WHERE ticket_id IN (SELECT id FROM "kkcth".helpdesk_tickets WHERE subject LIKE 'E2E %')`);
    const del4 = await prisma.$executeRawUnsafe(`DELETE FROM "kkcth".helpdesk_tickets WHERE subject LIKE 'E2E %'`);
    console.log('cleaned E2E leftovers:', del, del2, del3, del4);
  } catch (e) {
    console.log('ERROR:', e.message);
  } finally {
    await pool.end();
  }
})();
