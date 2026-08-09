const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { prisma } = require('../config/prisma');

async function main() {
  try {
    const schema = 'anbu_hospitals';
    console.log(`Checking schema ${schema}...`);

    const menus = await prisma.$queryRawUnsafe(`SELECT id, label, path, required_plan, sort_order FROM "${schema}".rbac_menus ORDER BY sort_order ASC`);
    console.log('RBAC Menus in schema:', menus);

    const roles = await prisma.$queryRawUnsafe(`SELECT id, name FROM "${schema}".rbac_roles`);
    console.log('RBAC Roles in schema:', roles);

    const roleMenus = await prisma.$queryRawUnsafe(`
      SELECT r.name as role_name, m.label, m.required_plan
      FROM "${schema}".rbac_roles r
      JOIN "${schema}".rbac_role_menus rm ON r.id = rm.role_id
      JOIN "${schema}".rbac_menus m ON m.id = rm.menu_id
      ORDER BY r.name, m.sort_order ASC
    `);
    console.log('Role Menu mappings:', roleMenus);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
