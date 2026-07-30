const { prisma } = require("../config/prisma");
(async () => {
  await prisma.$executeRawUnsafe("SET search_path TO anbu_hospitals, public");
  const r = await prisma.$queryRawUnsafe("SELECT label, sort_order FROM rbac_menus ORDER BY sort_order");
  console.log(r.map(m => m.label).join("\n"));
  console.log("Total: " + r.length);
  await prisma.$disconnect();
})();
