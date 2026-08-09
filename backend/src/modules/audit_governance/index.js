const express = require("express");
const router = express.Router();

async function ensureAuditTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".clinical_governance_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      actor_user VARCHAR(255) NOT NULL,
      role VARCHAR(100),
      action_type VARCHAR(100) NOT NULL, -- PHI_VIEW, PHI_EXPORT, BREAK_GLASS, DELETE_RECORD
      resource_affected VARCHAR(255) NOT NULL,
      reason_given TEXT,
      ip_address VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/logs", async (req, res) => {
  try {
    await ensureAuditTables(req);
    const logs = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".clinical_governance_logs ORDER BY created_at DESC LIMIT 50
    `);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/break-glass", async (req, res) => {
  try {
    await ensureAuditTables(req);
    const { actor_user, role, resource_affected, reason_given } = req.body;
    const log = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".clinical_governance_logs 
        (actor_user, role, action_type, resource_affected, reason_given, ip_address)
      VALUES ($1, $2, 'BREAK_GLASS', $3, $4, $5) RETURNING *
    `, actor_user, role, resource_affected, reason_given, req.ip);
    res.json({ success: true, log: log[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
