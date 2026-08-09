const express = require("express");
const router = express.Router();

async function ensureReferralTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".referral_ledger (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      referral_type VARCHAR(20) DEFAULT 'INBOUND', -- INBOUND, OUTBOUND
      referring_doctor VARCHAR(255) NOT NULL,
      referring_hospital VARCHAR(255),
      patient_name VARCHAR(255) NOT NULL,
      specialty_required VARCHAR(100),
      assigned_doctor VARCHAR(255),
      referral_status VARCHAR(30) DEFAULT 'PENDING', -- PENDING, ACCEPTED, CONSULTED, COMPLETED
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/ledger", async (req, res) => {
  try {
    await ensureReferralTables(req);
    const referrals = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".referral_ledger ORDER BY created_at DESC
    `);
    res.json({ success: true, referrals });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/ledger", async (req, res) => {
  try {
    await ensureReferralTables(req);
    const { referral_type, referring_doctor, referring_hospital, patient_name, specialty_required, assigned_doctor, notes } = req.body;
    const result = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".referral_ledger 
        (referral_type, referring_doctor, referring_hospital, patient_name, specialty_required, assigned_doctor, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, referral_type || 'INBOUND', referring_doctor, referring_hospital, patient_name, specialty_required, assigned_doctor, notes);
    res.json({ success: true, referral: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
