const express = require("express");
const router = express.Router();

async function ensureDieteticsTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".dietetics_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_name VARCHAR(255) NOT NULL,
      bed_no VARCHAR(50) NOT NULL,
      diet_type VARCHAR(100) NOT NULL, -- REGULAR, DIABETIC, RENAL, LOW_SODIUM, TUBE_FEED, NPO
      allergies TEXT,
      calories_target INT,
      protein_g INT,
      kitchen_status VARCHAR(30) DEFAULT 'ORDERED', -- ORDERED, PREPARING, DELIVERED
      dietitian_name VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/orders", async (req, res) => {
  try {
    await ensureDieteticsTables(req);
    const orders = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".dietetics_orders ORDER BY created_at DESC
    `);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/orders", async (req, res) => {
  try {
    await ensureDieteticsTables(req);
    const { patient_name, bed_no, diet_type, allergies, calories_target, protein_g, dietitian_name } = req.body;
    const result = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".dietetics_orders 
        (patient_name, bed_no, diet_type, allergies, calories_target, protein_g, dietitian_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, patient_name, bed_no, diet_type, allergies, calories_target ? parseInt(calories_target) : null, protein_g ? parseInt(protein_g) : null, dietitian_name);
    res.json({ success: true, order: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
