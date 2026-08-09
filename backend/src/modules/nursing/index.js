const express = require("express");
const router = express.Router();

async function ensureNursingTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".nursing_emar (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id VARCHAR(100) NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      bed_no VARCHAR(50),
      medication_name VARCHAR(255) NOT NULL,
      dosage VARCHAR(100) NOT NULL,
      route VARCHAR(50) DEFAULT 'ORAL',
      scheduled_time TIMESTAMP NOT NULL,
      status VARCHAR(30) DEFAULT 'PENDING', -- PENDING, GIVEN, OMITTED, REFUSED
      administered_at TIMESTAMP,
      administered_by VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "${schema}".nursing_vitals_news (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id VARCHAR(100) NOT NULL,
      respiration_rate INT,
      spo2 INT,
      sys_bp INT,
      dia_bp INT,
      pulse INT,
      temperature NUMERIC(4,1),
      consciousness VARCHAR(30) DEFAULT 'ALERT', -- ALERT, CVPU
      news2_score INT DEFAULT 0,
      risk_level VARCHAR(30) DEFAULT 'LOW', -- LOW, MEDIUM, HIGH
      recorded_by VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "${schema}".nursing_sbar_handovers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ward_name VARCHAR(100) NOT NULL,
      outgoing_nurse VARCHAR(255) NOT NULL,
      incoming_nurse VARCHAR(255) NOT NULL,
      situation TEXT NOT NULL,
      background TEXT NOT NULL,
      assessment TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      shift_type VARCHAR(30) DEFAULT 'DAY',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/emar", async (req, res) => {
  try {
    await ensureNursingTables(req);
    const emar = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".nursing_emar ORDER BY scheduled_time ASC
    `);
    res.json({ success: true, emar });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/emar/administer", async (req, res) => {
  try {
    await ensureNursingTables(req);
    const { id, administered_by, status, notes } = req.body;
    const updated = await req.prisma.$queryRawUnsafe(`
      UPDATE "${req.schemaName}".nursing_emar
      SET status = $1, administered_by = $2, administered_at = NOW(), notes = $3
      WHERE id = $4::uuid RETURNING *
    `, status || 'GIVEN', administered_by, notes, id);
    res.json({ success: true, record: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/vitals", async (req, res) => {
  try {
    await ensureNursingTables(req);
    const { patient_id, respiration_rate, spo2, sys_bp, dia_bp, pulse, temperature, consciousness, recorded_by } = req.body;
    
    // Simple NEWS2 calculation
    let news = 0;
    if (respiration_rate <= 8 || respiration_rate >= 25) news += 3;
    else if (respiration_rate >= 21) news += 2;
    if (spo2 <= 91) news += 3;
    else if (spo2 <= 93) news += 2;
    if (sys_bp <= 90) news += 3;
    else if (sys_bp <= 100) news += 2;
    if (pulse <= 40 || pulse >= 131) news += 3;
    else if (pulse >= 111) news += 2;
    if (temperature <= 35.0) news += 3;
    else if (temperature >= 39.1) news += 2;
    if (consciousness !== 'ALERT') news += 3;

    const risk = news >= 7 ? 'HIGH' : news >= 5 ? 'MEDIUM' : 'LOW';

    const result = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".nursing_vitals_news
        (patient_id, respiration_rate, spo2, sys_bp, dia_bp, pulse, temperature, consciousness, news2_score, risk_level, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, patient_id, respiration_rate, spo2, sys_bp, dia_bp, pulse, temperature, consciousness, news, risk, recorded_by);

    res.json({ success: true, vitals: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/handovers", async (req, res) => {
  try {
    await ensureNursingTables(req);
    const handovers = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".nursing_sbar_handovers ORDER BY created_at DESC LIMIT 30
    `);
    res.json({ success: true, handovers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/handovers", async (req, res) => {
  try {
    await ensureNursingTables(req);
    const { ward_name, outgoing_nurse, incoming_nurse, situation, background, assessment, recommendation, shift_type } = req.body;
    const handover = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".nursing_sbar_handovers 
        (ward_name, outgoing_nurse, incoming_nurse, situation, background, assessment, recommendation, shift_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, ward_name, outgoing_nurse, incoming_nurse, situation, background, assessment, recommendation, shift_type);
    res.json({ success: true, handover: handover[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
