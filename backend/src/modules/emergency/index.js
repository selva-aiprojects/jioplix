const express = require("express");
const router = express.Router();

async function ensureEmergencyTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".emergency_triage (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_name VARCHAR(255) NOT NULL,
      mrn VARCHAR(100),
      age INT,
      gender VARCHAR(20),
      esi_level INT NOT NULL, -- 1: Resuscitation, 2: Emergent, 3: Urgent, 4: Less Urgent, 5: Non-Urgent
      chief_complaint TEXT,
      vitals JSONB DEFAULT '{}',
      bed_bay VARCHAR(100),
      status VARCHAR(50) DEFAULT 'WAITING', -- WAITING, IN_TREATMENT, DISPOSING, COMPLETED
      disposition VARCHAR(100), -- ADMIT_IPD, ADMIT_ICU, ER_DISCHARGE, LAMA, DORA, MORTUARY
      triage_nurse VARCHAR(255),
      attending_physician VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "${schema}".emergency_code_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code_type VARCHAR(50) NOT NULL, -- CODE_BLUE, CODE_RED, TRAUMA_TEAM, CODE_STROKE
      location VARCHAR(255) NOT NULL,
      activated_by VARCHAR(255),
      status VARCHAR(30) DEFAULT 'ACTIVE', -- ACTIVE, RESOLVED, CANCELLED
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

// GET active triage cases
router.get("/triage", async (req, res) => {
  try {
    await ensureEmergencyTables(req);
    const cases = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".emergency_triage 
      ORDER BY esi_level ASC, created_at DESC
    `);
    const alerts = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".emergency_code_alerts 
      WHERE status = 'ACTIVE' 
      ORDER BY created_at DESC
    `);
    res.json({ success: true, cases, activeAlerts: alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST new emergency triage case
router.post("/triage", async (req, res) => {
  try {
    await ensureEmergencyTables(req);
    const { patient_name, mrn, age, gender, esi_level, chief_complaint, vitals, bed_bay, triage_nurse } = req.body;
    const result = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".emergency_triage 
        (patient_name, mrn, age, gender, esi_level, chief_complaint, vitals, bed_bay, triage_nurse)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
      RETURNING *
    `, patient_name, mrn, age ? parseInt(age) : null, gender, parseInt(esi_level) || 3, chief_complaint, JSON.stringify(vitals || {}), bed_bay, triage_nurse);
    res.json({ success: true, case: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST code alert trigger
router.post("/code-alert", async (req, res) => {
  try {
    await ensureEmergencyTables(req);
    const { code_type, location, activated_by, notes } = req.body;
    const alert = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".emergency_code_alerts (code_type, location, activated_by, notes)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, code_type, location, activated_by, notes);
    res.json({ success: true, alert: alert[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH triage disposition
router.patch("/triage/:id/disposition", async (req, res) => {
  try {
    await ensureEmergencyTables(req);
    const { id } = req.params;
    const { disposition, attending_physician } = req.body;
    const updated = await req.prisma.$queryRawUnsafe(`
      UPDATE "${req.schemaName}".emergency_triage 
      SET disposition = $1, attending_physician = $2, status = 'COMPLETED', updated_at = NOW()
      WHERE id = $3::uuid RETURNING *
    `, disposition, attending_physician, id);
    res.json({ success: true, case: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
