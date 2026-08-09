const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { prisma } = require('../config/prisma');

async function main() {
  try {
    console.log('[MIGRATION] Seeding full Enterprise RBAC menus across all tenant schemas...');

    const tenants = await prisma.$queryRawUnsafe(`SELECT db_name, name, plan FROM nexus.tenants`);
    console.log('Found tenants:', tenants);

    for (const t of tenants) {
      const schema = t.db_name.toLowerCase();
      console.log(`\n--- Processing tenant: ${t.name} (Schema: ${schema}, Plan: ${t.plan}) ---`);

      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "${schema}".rbac_roles (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name VARCHAR(50) UNIQUE NOT NULL,
              description TEXT,
              created_at TIMESTAMP DEFAULT NOW()
          );
          CREATE TABLE IF NOT EXISTS "${schema}".rbac_menus (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              label VARCHAR(100) UNIQUE NOT NULL,
              path VARCHAR(100) NOT NULL,
              icon VARCHAR(50),
              required_plan VARCHAR(50) DEFAULT 'basic',
              parent_id UUID REFERENCES "${schema}".rbac_menus(id),
              sort_order INT DEFAULT 0
          );
          CREATE TABLE IF NOT EXISTS "${schema}".rbac_role_menus (
              role_id UUID REFERENCES "${schema}".rbac_roles(id),
              menu_id UUID REFERENCES "${schema}".rbac_menus(id),
              PRIMARY KEY (role_id, menu_id)
          );
        `);

        // Seed all master menus
        await prisma.$executeRawUnsafe(`
          INSERT INTO "${schema}".rbac_menus (label, path, icon, required_plan, sort_order) VALUES
          ('Dashboard', '/tenant/dashboard', 'Dashboard', 'basic', 0),
          ('OPD Registration', '/tenant/opd/registration', 'UserPlus', 'basic', 1),
          ('OPD Queue', '/tenant/opd/queue', 'Users', 'basic', 2),
          ('Doctor''s Queue', '/tenant/opd/doctor-queue', 'Activity', 'basic', 3),
          ('Consultation Desk', '/tenant/opd/consultation', 'Stethoscope', 'basic', 4),
          ('Appointment List', '/tenant/appointments', 'Calendar', 'basic', 5),
          ('Doctor Availability and Book Appointments', '/tenant/appointments/doctor-calendar', 'Calendar', 'basic', 6),
          ('Admission Desk', '/tenant/ipd/admission-desk', 'Building', 'basic', 7),
          ('IPD Bed Map', '/tenant/ipd/beds', 'Map', 'basic', 8),
          ('Laboratory', '/tenant/lab', 'FlaskConical', 'standard', 9),
          ('AI Diagnostic Assistant', '/tenant/lab/ai', 'Cpu', 'standard', 10),
          ('Radiology & Imaging', '/tenant/radiology', 'Activity', 'standard', 11),
          ('Operation Theatre', '/tenant/ot', 'Activity', 'standard', 12),
          ('Blood Bank', '/tenant/blood-bank', 'Activity', 'standard', 13),
          ('Pharmacy Dashboard', '/tenant/pharmacy/dashboard', 'Pill', 'standard', 14),
          ('Stock Inventory', '/tenant/pharmacy/inventory', 'Package', 'standard', 15),
          ('Prescription Queue', '/tenant/pharmacy/queue', 'Receipt', 'standard', 16),
          ('Invoicing & Billing', '/billing', 'Billing', 'basic', 17),
          ('Insurance & Claims', '/tenant/insurance', 'ShieldCheck', 'standard', 18),
          ('Finance & Compliance', '/tenant/finance', 'Receipt', 'professional', 19),
          ('IPD Census & Daycare', '/tenant/ipd/admissions', 'Clipboard', 'professional', 20),
          ('Discharge Summaries', '/tenant/ipd/discharge', 'Receipt', 'professional', 21),
          ('Human Resource Management System', '/tenant/hrms', 'UserCog', 'professional', 22),
          ('Payroll & Compensation Processing', '/tenant/payroll', 'Wallet', 'professional', 23),
          ('Procurement & Supply Chain Management', '/tenant/procurement', 'Box', 'professional', 24),
          ('Pharmacy Inventory & Stock Control', '/tenant/inventory', 'Package', 'professional', 25),
          ('Patient Relationship Management (CRM)', '/tenant/crm', 'Users', 'professional', 26),
          ('Facility Management', '/tenant/facility', 'Building2', 'professional', 27),
          ('Patient Portal', '/tenant/patient-portal', 'Users', 'professional', 28),
          ('Clinical Analytics', '/tenant/analytics/ops', 'BarChart2', 'professional', 29),
          ('Message Board', '/tenant/communication', 'MessageSquare', 'basic', 30),
          ('Mail & Communications', '/tenant/mail', 'Mail', 'basic', 31),
          ('WhatsApp Reminders', '/tenant/reminders', 'PhoneCall', 'basic', 32),
          ('Staff & Access Control (RBAC)', '/tenant/staff', 'Users', 'professional', 33),
          ('Hospital Settings (Masters)', '/tenant/masters', 'Settings', 'professional', 34),
          ('Branding & UI Settings', '/tenant/settings', 'Palette', 'basic', 35),
          ('Secure Configurations', '/tenant/settings/secure', 'ShieldCheck', 'professional', 36),
          ('Help Desk', '/tenant/helpdesk', 'Headset', 'basic', 37),
          ('Ticketing Management System', '/tenant/support/tickets', 'Ticket', 'basic', 38),
          ('Clinical Archives', '/tenant/archives', 'Archive', 'professional', 39)
          ON CONFLICT (label) DO NOTHING;
        `);

        // Link all menus to ADMIN
        await prisma.$executeRawUnsafe(`
          INSERT INTO "${schema}".rbac_role_menus (role_id, menu_id)
          SELECT r.id, m.id 
          FROM "${schema}".rbac_roles r
          CROSS JOIN "${schema}".rbac_menus m
          WHERE r.name = 'ADMIN'
          ON CONFLICT (role_id, menu_id) DO NOTHING;
        `);

        console.log(`Successfully seeded RBAC menus for ${schema}`);
      } catch (err) {
        console.warn(`Skipping schema ${schema}:`, err.message);
      }
    }

    console.log('\n[MIGRATION] Finished seeding RBAC menus for all tenants.');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
