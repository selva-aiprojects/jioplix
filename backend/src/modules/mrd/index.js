const express = require("express");
const router = express.Router();

async function ensureMrdTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".mrd_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      mrn VARCHAR(100) NOT NULL UNIQUE,
      patient_name VARCHAR(255) NOT NULL,
      rack_no VARCHAR(50),
      shelf_no VARCHAR(50),
      box_no VARCHAR(50),
      icd10_codes JSONB DEFAULT '[]',
      cpt_codes JSONB DEFAULT '[]',
      is_mlc BOOLEAN DEFAULT FALSE,
      mlc_number VARCHAR(100),
      police_station VARCHAR(255),
      chart_status VARCHAR(50) DEFAULT 'INCOMPLETE', -- INCOMPLETE, CODED, AUDITED, ARCHIVED
      missing_signatures TEXT[],
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/records", async (req, res) => {
  try {
    await ensureMrdTables(req);
    const records = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".mrd_records ORDER BY created_at DESC LIMIT 50
    `);
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/records", async (req, res) => {
  try {
    await ensureMrdTables(req);
    const { mrn, patient_name, rack_no, shelf_no, box_no, icd10_codes, cpt_codes, is_mlc, mlc_number, police_station, chart_status } = req.body;
    const rec = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".mrd_records 
        (mrn, patient_name, rack_no, shelf_no, box_no, icd10_codes, cpt_codes, is_mlc, mlc_number, police_station, chart_status)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, $11)
      RETURNING *
    `, mrn, patient_name, rack_no, shelf_no, box_no, JSON.stringify(icd10_codes || []), JSON.stringify(cpt_codes || []), is_mlc || false, mlc_number, police_station, chart_status || 'INCOMPLETE');
    res.json({ success: true, record: rec[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
