const express = require("express");
const router = express.Router();

async function ensureDicomTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".pacs_studies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      study_instance_uid VARCHAR(255) NOT NULL UNIQUE,
      patient_name VARCHAR(255) NOT NULL,
      mrn VARCHAR(100) NOT NULL,
      modality VARCHAR(20) NOT NULL, -- CT, MRI, XRAY, US
      study_description TEXT,
      series_count INT DEFAULT 1,
      instances_count INT DEFAULT 12,
      radiologist_report TEXT,
      report_status VARCHAR(30) DEFAULT 'UNREAD', -- UNREAD, DRAFT, FINAL
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/studies", async (req, res) => {
  try {
    await ensureDicomTables(req);
    const studies = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".pacs_studies ORDER BY created_at DESC
    `);
    res.json({ success: true, studies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/studies", async (req, res) => {
  try {
    await ensureDicomTables(req);
    const { patient_name, mrn, modality, study_description, series_count, instances_count } = req.body;
    const uid = '1.3.6.1.4.1.' + Math.floor(Math.random() * 1000000);
    const result = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".pacs_studies 
        (study_instance_uid, patient_name, mrn, modality, study_description, series_count, instances_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, uid, patient_name, mrn, modality || 'CT', study_description, series_count || 1, instances_count || 12);
    res.json({ success: true, study: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
