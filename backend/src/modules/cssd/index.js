const express = require("express");
const router = express.Router();

async function ensureCssdTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".cssd_batches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_number VARCHAR(100) NOT NULL UNIQUE,
      sterilizer_id VARCHAR(50) NOT NULL,
      sterilization_method VARCHAR(50) DEFAULT 'AUTOCLAVE', -- AUTOCLAVE, ETO, PLASMA
      biological_indicator VARCHAR(20) DEFAULT 'PASS', -- PASS, FAIL
      chemical_indicator VARCHAR(20) DEFAULT 'PASS',
      tray_count INT DEFAULT 1,
      expiry_date TIMESTAMP NOT NULL,
      status VARCHAR(30) DEFAULT 'STERILE', -- WASHING, STERILIZING, STERILE, ISSUED, RECALLED
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/batches", async (req, res) => {
  try {
    await ensureCssdTables(req);
    const batches = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".cssd_batches ORDER BY created_at DESC
    `);
    res.json({ success: true, batches });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/batches", async (req, res) => {
  try {
    await ensureCssdTables(req);
    const { batch_number, sterilizer_id, sterilization_method, biological_indicator, chemical_indicator, tray_count, expiry_days } = req.body;
    const expDays = parseInt(expiry_days) || 30;
    const expiry_date = new Date(Date.now() + expDays * 24 * 60 * 60 * 1000);

    const result = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".cssd_batches 
        (batch_number, sterilizer_id, sterilization_method, biological_indicator, chemical_indicator, tray_count, expiry_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, batch_number, sterilizer_id, sterilization_method || 'AUTOCLAVE', biological_indicator || 'PASS', chemical_indicator || 'PASS', parseInt(tray_count) || 1, expiry_date);
    res.json({ success: true, batch: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
