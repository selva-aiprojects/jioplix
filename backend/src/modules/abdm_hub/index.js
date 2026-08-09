const express = require("express");
const router = express.Router();

async function ensureAbdmTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".abdm_care_contexts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id VARCHAR(100) NOT NULL,
      abha_id VARCHAR(100) NOT NULL,
      care_context_reference VARCHAR(100) NOT NULL UNIQUE,
      display_name VARCHAR(255) NOT NULL,
      hip_status VARCHAR(30) DEFAULT 'LINKED', -- LINKED, PUSHED, REVOKED
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/contexts", async (req, res) => {
  try {
    await ensureAbdmTables(req);
    const contexts = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".abdm_care_contexts ORDER BY created_at DESC
    `);
    res.json({ success: true, contexts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/link-context", async (req, res) => {
  try {
    await ensureAbdmTables(req);
    const { patient_id, abha_id, care_context_reference, display_name } = req.body;
    const result = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".abdm_care_contexts 
        (patient_id, abha_id, care_context_reference, display_name)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, patient_id, abha_id, care_context_reference, display_name);
    res.json({ success: true, context: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
