const express = require("express");
const router = express.Router();

async function ensureIcuTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".icu_telemetry (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bed_no VARCHAR(50) NOT NULL,
      patient_name VARCHAR(255) NOT NULL,
      ventilator_mode VARCHAR(50),
      fio2 INT, -- %
      peep INT, -- cmH2O
      abg_ph NUMERIC(3,2),
      abg_paco2 INT,
      abg_pao2 INT,
      gcs_score INT DEFAULT 15,
      sofa_score INT DEFAULT 0,
      apache_score INT DEFAULT 0,
      critical_alarm BOOLEAN DEFAULT FALSE,
      alarm_reason VARCHAR(255),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/dashboard", async (req, res) => {
  try {
    await ensureIcuTables(req);
    const beds = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".icu_telemetry ORDER BY bed_no ASC
    `);
    res.json({ success: true, beds });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/flowsheet", async (req, res) => {
  try {
    await ensureIcuTables(req);
    const { bed_no, patient_name, ventilator_mode, fio2, peep, abg_ph, abg_paco2, abg_pao2, gcs_score, sofa_score, apache_score, critical_alarm, alarm_reason } = req.body;
    const record = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".icu_telemetry 
        (bed_no, patient_name, ventilator_mode, fio2, peep, abg_ph, abg_paco2, abg_pao2, gcs_score, sofa_score, apache_score, critical_alarm, alarm_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, bed_no, patient_name, ventilator_mode, fio2, peep, abg_ph, abg_paco2, abg_pao2, gcs_score, sofa_score, apache_score, critical_alarm || false, alarm_reason);
    res.json({ success: true, record: record[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
