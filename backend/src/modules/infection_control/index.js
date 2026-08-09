const express = require("express");
const router = express.Router();

async function ensureInfectionTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".infection_surveillance (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_name VARCHAR(255) NOT NULL,
      ward_location VARCHAR(100) NOT NULL,
      hai_type VARCHAR(50) NOT NULL, -- CLABSI, CAUTI, VAE, SSI, MRSA
      organism_identified VARCHAR(255),
      isolation_type VARCHAR(50) DEFAULT 'NONE', -- CONTACT, DROPLET, AIRBORNE
      asp_authorization_status VARCHAR(50) DEFAULT 'APPROVED', -- PENDING, APPROVED, REJECTED
      reported_by VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/surveillance", async (req, res) => {
  try {
    await ensureInfectionTables(req);
    const records = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".infection_surveillance ORDER BY created_at DESC
    `);
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/surveillance", async (req, res) => {
  try {
    await ensureInfectionTables(req);
    const { patient_name, ward_location, hai_type, organism_identified, isolation_type, asp_authorization_status, reported_by } = req.body;
    const rec = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".infection_surveillance 
        (patient_name, ward_location, hai_type, organism_identified, isolation_type, asp_authorization_status, reported_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, patient_name, ward_location, hai_type, organism_identified, isolation_type || 'NONE', asp_authorization_status || 'APPROVED', reported_by);
    res.json({ success: true, record: rec[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
