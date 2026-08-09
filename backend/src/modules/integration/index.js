const express = require("express");
const router = express.Router();

async function ensureIntegrationTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".integration_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      protocol VARCHAR(50) NOT NULL, -- HL7_V2, FHIR_R4, DICOM_WADO, REST_WEBHOOK
      message_type VARCHAR(100), -- ADT_A01, ORM_O01, ORU_R01, Patient
      direction VARCHAR(20) DEFAULT 'INBOUND', -- INBOUND, OUTBOUND
      status VARCHAR(30) DEFAULT 'SUCCESS', -- SUCCESS, FAILED, RETRYING
      payload TEXT,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/logs", async (req, res) => {
  try {
    await ensureIntegrationTables(req);
    const logs = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".integration_logs ORDER BY created_at DESC LIMIT 50
    `);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/log", async (req, res) => {
  try {
    await ensureIntegrationTables(req);
    const { protocol, message_type, direction, status, payload, error_message } = req.body;
    const log = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".integration_logs 
        (protocol, message_type, direction, status, payload, error_message)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, protocol, message_type, direction || 'INBOUND', status || 'SUCCESS', payload, error_message);
    res.json({ success: true, log: log[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
