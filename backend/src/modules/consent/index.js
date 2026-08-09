const express = require("express");
const router = express.Router();

async function ensureConsentTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".patient_clinical_consents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_name VARCHAR(255) NOT NULL,
      mrn VARCHAR(100),
      consent_type VARCHAR(100) NOT NULL, -- SURGERY, ANESTHESIA, BLOOD_TRANSFUSION, DPDP_DATA_SHARING
      procedure_name VARCHAR(255),
      witness_name VARCHAR(255),
      signature_captured BOOLEAN DEFAULT TRUE,
      language VARCHAR(20) DEFAULT 'EN',
      ip_address VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/records", async (req, res) => {
  try {
    await ensureConsentTables(req);
    const consents = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".patient_clinical_consents ORDER BY created_at DESC
    `);
    res.json({ success: true, consents });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/records", async (req, res) => {
  try {
    await ensureConsentTables(req);
    const { patient_name, mrn, consent_type, procedure_name, witness_name, language, ip_address } = req.body;
    const result = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".patient_clinical_consents 
        (patient_name, mrn, consent_type, procedure_name, witness_name, language, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, patient_name, mrn, consent_type, procedure_name, witness_name, language || 'EN', ip_address || req.ip);
    res.json({ success: true, consent: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
