const express = require("express");
const router = express.Router();

async function ensureAmbulanceTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".ambulance_trips (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_no VARCHAR(50) NOT NULL,
      ambulance_type VARCHAR(50) DEFAULT 'ALS', -- ALS, BLS, NEONATAL
      driver_name VARCHAR(255) NOT NULL,
      paramedic_name VARCHAR(255),
      pickup_location VARCHAR(255) NOT NULL,
      destination VARCHAR(255) DEFAULT 'EMERGENCY_ROOM',
      patient_name VARCHAR(255),
      trip_status VARCHAR(30) DEFAULT 'DISPATCHED', -- DISPATCHED, EN_ROUTE, ARRIVED, COMPLETED
      eta_minutes INT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/trips", async (req, res) => {
  try {
    await ensureAmbulanceTables(req);
    const trips = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".ambulance_trips ORDER BY created_at DESC
    `);
    res.json({ success: true, trips });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/dispatch", async (req, res) => {
  try {
    await ensureAmbulanceTables(req);
    const { vehicle_no, ambulance_type, driver_name, paramedic_name, pickup_location, destination, patient_name, eta_minutes } = req.body;
    const result = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".ambulance_trips 
        (vehicle_no, ambulance_type, driver_name, paramedic_name, pickup_location, destination, patient_name, eta_minutes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, vehicle_no, ambulance_type || 'ALS', driver_name, paramedic_name, pickup_location, destination || 'EMERGENCY_ROOM', patient_name, eta_minutes ? parseInt(eta_minutes) : 15);
    res.json({ success: true, trip: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
