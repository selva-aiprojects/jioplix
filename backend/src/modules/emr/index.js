const express = require("express");
const router = express.Router();

async function ensureEmrTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".emr_soap_notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      encounter_id VARCHAR(100) NOT NULL,
      patient_id VARCHAR(100) NOT NULL,
      doctor_name VARCHAR(255) NOT NULL,
      specialty VARCHAR(100),
      subjective TEXT,
      objective TEXT,
      assessment TEXT,
      plan TEXT,
      cpoe_orders JSONB DEFAULT '[]',
      is_locked BOOLEAN DEFAULT FALSE,
      signed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/notes", async (req, res) => {
  try {
    await ensureEmrTables(req);
    const notes = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".emr_soap_notes ORDER BY created_at DESC LIMIT 30
    `);
    res.json({ success: true, notes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/notes", async (req, res) => {
  try {
    await ensureEmrTables(req);
    const { encounter_id, patient_id, doctor_name, specialty, subjective, objective, assessment, plan, cpoe_orders, is_locked } = req.body;
    const note = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".emr_soap_notes 
        (encounter_id, patient_id, doctor_name, specialty, subjective, objective, assessment, plan, cpoe_orders, is_locked, signed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
      RETURNING *
    `, encounter_id, patient_id, doctor_name, specialty, subjective, objective, assessment, plan, JSON.stringify(cpoe_orders || []), is_locked || false, is_locked ? new Date() : null);
    res.json({ success: true, note: note[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
