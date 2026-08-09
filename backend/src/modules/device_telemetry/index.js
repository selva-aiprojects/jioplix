const express = require("express");
const router = express.Router();

async function ensureDeviceTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".device_streams (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      device_id VARCHAR(100) NOT NULL,
      device_type VARCHAR(50) NOT NULL, -- MONITOR, VENTILATOR, INFUSION_PUMP, TELEMETRY
      location_bed VARCHAR(50) NOT NULL,
      patient_name VARCHAR(255),
      heart_rate INT,
      spo2 INT,
      bp_sys INT,
      bp_dia INT,
      resp_rate INT,
      alarm_active BOOLEAN DEFAULT FALSE,
      alarm_type VARCHAR(100),
      last_ping TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/streams", async (req, res) => {
  try {
    await ensureDeviceTables(req);
    const devices = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".device_streams ORDER BY location_bed ASC
    `);
    res.json({ success: true, devices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/telemetry", async (req, res) => {
  try {
    await ensureDeviceTables(req);
    const { device_id, device_type, location_bed, patient_name, heart_rate, spo2, bp_sys, bp_dia, resp_rate, alarm_active, alarm_type } = req.body;
    const result = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".device_streams 
        (device_id, device_type, location_bed, patient_name, heart_rate, spo2, bp_sys, bp_dia, resp_rate, alarm_active, alarm_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *
    `, device_id, device_type, location_bed, patient_name, heart_rate, spo2, bp_sys, bp_dia, resp_rate, alarm_active || false, alarm_type);
    res.json({ success: true, telemetry: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
