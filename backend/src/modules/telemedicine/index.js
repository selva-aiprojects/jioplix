const express = require("express");
const router = express.Router();

async function ensureTelemedicineTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".telemedicine_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_name VARCHAR(255) NOT NULL,
      doctor_name VARCHAR(255) NOT NULL,
      specialty VARCHAR(100),
      scheduled_start TIMESTAMP NOT NULL,
      meeting_link TEXT NOT NULL,
      session_status VARCHAR(30) DEFAULT 'SCHEDULED', -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
      clinical_summary TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/sessions", async (req, res) => {
  try {
    await ensureTelemedicineTables(req);
    const sessions = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".telemedicine_sessions ORDER BY scheduled_start DESC
    `);
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/sessions", async (req, res) => {
  try {
    await ensureTelemedicineTables(req);
    const { patient_name, doctor_name, specialty, scheduled_start } = req.body;
    const roomId = 'room_' + Math.random().toString(36).substring(2, 9);
    const meeting_link = `https://meet.jioplix.com/${roomId}`;

    const result = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".telemedicine_sessions 
        (patient_name, doctor_name, specialty, scheduled_start, meeting_link)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, patient_name, doctor_name, specialty, scheduled_start || new Date(), meeting_link);
    res.json({ success: true, session: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
