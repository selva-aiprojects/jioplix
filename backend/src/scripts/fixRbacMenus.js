const { prisma } = require("../config/prisma");
const S = '"anbu_hospitals"';

async function main() {
  const missing = [
    ["Help & Support", "/tenant/support", "HelpCircle", "basic", 15],
    ["Doctor Availability and Book Appointments", "/tenant/appointments/doctor-calendar", "Calendar", "basic", 6]
  ];
  for (const [l, p, ic, pl, so] of missing) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO ${S}.rbac_menus (label, path, icon, required_plan, sort_order)
      SELECT '${l}', '${p}', '${ic}', '${pl}', ${so}
      WHERE NOT EXISTS (SELECT 1 FROM ${S}.rbac_menus WHERE label = '${l}')
    `);
    console.log("Added:", l);
  }

  await prisma.$executeRawUnsafe(`DELETE FROM ${S}.rbac_role_menus`);
  console.log("Cleared role-menu links");

  // ADMIN - all menus
  await prisma.$executeRawUnsafe(`
    INSERT INTO ${S}.rbac_role_menus (role_id, menu_id)
    SELECT r.id, m.id FROM ${S}.rbac_roles r CROSS JOIN ${S}.rbac_menus m WHERE r.name = 'ADMIN'
    ON CONFLICT DO NOTHING
  `);

  const roles = {
    DOCTOR: ["Dashboard", "OPD Registration", "OPD Queue", "Doctor's Queue", "Consultation Desk", "Appointment List", "Doctor Availability and Book Appointments", "Laboratory", "Pharmacy Dashboard", "Stock Inventory", "Prescription Queue", "IPD Bed Map", "IPD Census & Daycare", "Help & Support", "Ticketing Management System"],
    NURSE: ["Dashboard", "OPD Registration", "Doctor's Queue", "Prescription Queue", "IPD Bed Map", "IPD Census & Daycare", "Admission Desk", "Discharge Summaries", "Help & Support"],
    RECEPTIONIST: ["Dashboard", "OPD Registration", "OPD Queue", "Doctor's Queue", "Appointment List", "Doctor Availability and Book Appointments", "Invoicing & Billing", "Help & Support", "Ticketing Management System"],
    PHARMACIST: ["Pharmacy Dashboard", "Stock Inventory", "Prescription Queue", "Help & Support", "Ticketing Management System"],
    LAB_ASSISTANT: ["Laboratory", "Help & Support", "Ticketing Management System"],
    SUPPORT: ["Dashboard", "Help & Support", "Ticketing Management System", "Invoicing & Billing"]
  };

  for (const [role, labels] of Object.entries(roles)) {
    const lb = labels.map(l => "'" + l.replace(/'/g, "''") + "'").join(", ");
    await prisma.$executeRawUnsafe(`
      INSERT INTO ${S}.rbac_role_menus (role_id, menu_id)
      SELECT r.id, m.id FROM ${S}.rbac_roles r, ${S}.rbac_menus m
      WHERE r.name = '${role}' AND m.label IN (${lb})
      ON CONFLICT DO NOTHING
    `);
  }

  const counts = await prisma.$queryRawUnsafe(`
    SELECT r.name, COUNT(rm.menu_id)::int as cnt
    FROM ${S}.rbac_roles r LEFT JOIN ${S}.rbac_role_menus rm ON r.id = rm.role_id
    GROUP BY r.name ORDER BY r.name
  `);
  console.log("\nFinal counts:");
  for (const c of counts) console.log(`  ${c.name}: ${c.cnt}`);
  
  const menus = await prisma.$queryRawUnsafe(`SELECT label FROM ${S}.rbac_menus ORDER BY sort_order`);
  console.log("\nMenus (" + menus.length + "):");
  for (const m of menus) console.log("  " + m.label);

  await prisma.$disconnect();
}

main().catch(e => { console.error(e.message.substring(0, 200)); process.exit(1); });
