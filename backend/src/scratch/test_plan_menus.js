const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { prisma } = require('../config/prisma');

async function checkPlanMenus(planName) {
  const allowedPlans = ['basic'];
  const tenantPlan = planName.toLowerCase();
  if (['standard', 'professional', 'enterprise'].includes(tenantPlan)) allowedPlans.push('standard');
  if (['professional', 'enterprise'].includes(tenantPlan)) allowedPlans.push('professional');
  if (['enterprise'].includes(tenantPlan)) allowedPlans.push('enterprise');

  const planFilter = allowedPlans.map(p => `'${p}'`).join(',');
  const schema = 'anbu_hospitals';

  const roleData = await prisma.$queryRawUnsafe(`SELECT id FROM "${schema}".rbac_roles WHERE name = 'ADMIN'`);
  if (!roleData[0]) return [];

  const roleId = roleData[0].id;

  const menus = await prisma.$queryRawUnsafe(`
    SELECT m.label, m.path, m.icon, m.required_plan 
    FROM "${schema}".rbac_menus m
    JOIN "${schema}".rbac_role_menus rm ON m.id = rm.menu_id
    WHERE rm.role_id = '${roleId}'
    AND LOWER(COALESCE(m.required_plan, 'basic')) IN (${planFilter})
    ORDER BY m.sort_order ASC
  `);

  return menus;
}

async function main() {
  try {
    for (const plan of ['Basic', 'Standard', 'Professional', 'Enterprise']) {
      const menus = await checkPlanMenus(plan);
      console.log(`\n=================== ${plan.toUpperCase()} PLAN MENUS (${menus.length} items) ===================`);
      menus.forEach(m => console.log(` - [${m.required_plan.toUpperCase()}] ${m.label} (${m.path})`));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
