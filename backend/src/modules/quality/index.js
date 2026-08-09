const express = require("express");
const router = express.Router();

async function ensureQualityTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".quality_incidents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      incident_type VARCHAR(50) NOT NULL, -- SENTINEL, NEAR_MISS, MEDICATION_ERROR, PATIENT_FALL
      department VARCHAR(100) NOT NULL,
      severity VARCHAR(30) DEFAULT 'MODERATE', -- LOW, MODERATE, CRITICAL
      description TEXT NOT NULL,
      root_cause_analysis TEXT,
      action_taken TEXT,
      status VARCHAR(30) DEFAULT 'OPEN', -- OPEN, INVESTIGATING, CLOSED
      reported_by VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/incidents", async (req, res) => {
  try {
    await ensureQualityTables(req);
    const incidents = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".quality_incidents ORDER BY created_at DESC
    `);
    res.json({ success: true, incidents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/incidents", async (req, res) => {
  try {
    await ensureQualityTables(req);
    const { incident_type, department, severity, description, root_cause_analysis, action_taken, status, reported_by } = req.body;
    const result = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".quality_incidents 
        (incident_type, department, severity, description, root_cause_analysis, action_taken, status, reported_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, incident_type, department, severity || 'MODERATE', description, root_cause_analysis, action_taken, status || 'OPEN', reported_by);
    res.json({ success: true, incident: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
