const { prisma } = require("../config/prisma");

async function main() {
  const schema = "anbu_hospitals";
  await prisma.$executeRawUnsafe(`SET search_path TO "${schema}", public`);

  // Deduplicate rbac_menus: keep only one row per label (the one with lowest sort_order)
  const dups = await prisma.$queryRawUnsafe(`
    SELECT label, COUNT(*)::int as cnt FROM rbac_menus GROUP BY label HAVING COUNT(*) > 1
  `);
  console.log("Duplicate labels:", dups.map(d => `${d.label} (${d.cnt})`).join(", "));

  for (const d of dups) {
    await prisma.$executeRawUnsafe(`
      DELETE FROM rbac_menus WHERE id IN (
        SELECT id FROM (
          SELECT id, ROW_NUMBER() OVER (PARTITION BY label ORDER BY sort_order, id) AS rn
          FROM rbac_menus WHERE label = '${d.label.replace(/'/g, "''")}'
        ) t WHERE t.rn > 1
      )
    `);
    console.log(`  Deduplicated: ${d.label}`);
  }

  // Also remove old duplicate-style menus that conflict with new labels
  // e.g. "IPD Admission Desk" vs "Admission Desk" — keep the new one
  await prisma.$executeRawUnsafe(`DELETE FROM rbac_menus WHERE label = 'IPD Admission Desk'`);
  console.log("  Removed legacy: IPD Admission Desk");

  // Ensure unique constraint exists
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE rbac_menus ADD CONSTRAINT rbac_menus_label_key UNIQUE (label)`);
  } catch (e) {
    if (!e.message.includes("already exists")) console.warn("  Constraint add warning:", e.message.substring(0, 80));
  }

  // Re-run full schema hardening (force refresh role-menu links)
  // Clear existing role-menu links and re-link
  await prisma.$executeRawUnsafe(`DELETE FROM rbac_role_menus`);

  const menus = await prisma.$queryRawUnsafe(`SELECT id, label FROM rbac_menus`);
  console.log(`\nAfter cleanup — ${menus.length} unique menus:`);
  for (const m of menus) console.log(`  ${m.label}`);

  // Re-link ADMIN to all menus
  await prisma.$executeRawUnsafe(`
    INSERT INTO rbac_role_menus (role_id, menu_id)
    SELECT r.id, m.id FROM rbac_roles r CROSS JOIN rbac_menus m WHERE r.name = 'ADMIN'
    ON CONFLICT DO NOTHING
  `);

  const roleMenuMap = {
    DOCTOR: ['Dashboard', 'OPD Registration', 'OPD Queue', "Doctor's Queue", 'Consultation Desk', 'Appointment List', 'Doctor Availability and Book Appointments', 'Laboratory', 'Pharmacy Dashboard', 'Stock Inventory', 'Prescription Queue', 'IPD Bed Map', 'IPD Census & Daycare', 'Help & Support', 'Ticketing Management System'],
    NURSE: ['Dashboard', 'OPD Registration', "Doctor's Queue", 'Prescription Queue', 'IPD Bed Map', 'IPD Census & Daycare', 'Admission Desk', 'Discharge Summaries', 'Help & Support'],
    RECEPTIONIST: ['Dashboard', 'OPD Registration', 'OPD Queue', "Doctor's Queue", 'Appointment List', 'Doctor Availability and Book Appointments', 'Invoicing & Billing', 'Help & Support', 'Ticketing Management System'],
    PHARMACIST: ['Pharmacy Dashboard', 'Stock Inventory', 'Prescription Queue', 'Help & Support', 'Ticketing Management System'],
    LAB_ASSISTANT: ['Laboratory', 'Help & Support', 'Ticketing Management System'],
    SUPPORT: ['Dashboard', 'Help & Support', 'Ticketing Management System', 'Invoicing & Billing']
  };

  for (const [role, labels] of Object.entries(roleMenuMap)) {
    const labelsStr = labels.map(l => `'${l.replace(/'/g, "''")}'`).join(", ");
    await prisma.$executeRawUnsafe(`
      INSERT INTO rbac_role_menus (role_id, menu_id)
      SELECT r.id, m.id FROM rbac_roles r, rbac_menus m
      WHERE r.name = '${role}' AND m.label IN (${labelsStr})
      ON CONFLICT DO NOTHING
    `);
  }

  // Verify
  const counts = await prisma.$queryRawUnsafe(`
    SELECT r.name, COUNT(rm.menu_id)::int as cnt
    FROM rbac_roles r LEFT JOIN rbac_role_menus rm ON r.id = rm.role_id
    GROUP BY r.name ORDER BY r.name
  `);
  console.log("\nRole-menu counts after fix:");
  for (const c of counts) console.log(`  ${c.name}: ${c.cnt}`);

  // Also link our 7 new users to their RBAC roles
  const userEmails = ['admin@anbuhospitals.com', 'doctor@anbuhospitals.com', 'nurse@anbuhospitals.com', 'reception@anbuhospitals.com', 'pharmacy@anbuhospitals.com', 'lab@anbuhospitals.com', 'support@anbuhospitals.com'];
  for (const email of userEmails) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO rbac_user_roles (user_id, role_id)
      SELECT u.id, r.id FROM "${schema}".users u, rbac_roles r
      WHERE u.email = '${email}' AND LOWER(r.name) = LOWER(
        CASE 
          WHEN u.role = 'staff' THEN 'SUPPORT'
          ELSE u.role
        END
      )
      ON CONFLICT DO NOTHING
    `);
    console.log(`  Linked RBAC role for: ${email}`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
