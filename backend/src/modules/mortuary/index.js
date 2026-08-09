const express = require("express");
const router = express.Router();

async function ensureMortuaryTables(req) {
  const schema = req.schemaName;
  await req.prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "${schema}".mortuary_records (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      deceased_name VARCHAR(255) NOT NULL,
      mrn VARCHAR(100),
      chamber_no VARCHAR(50) NOT NULL,
      date_of_death TIMESTAMP NOT NULL,
      cause_of_death TEXT,
      autopsy_requested BOOLEAN DEFAULT FALSE,
      is_mlc BOOLEAN DEFAULT FALSE,
      handover_to VARCHAR(255),
      handover_status VARCHAR(30) DEFAULT 'IN_STORAGE', -- IN_STORAGE, AUTOPSY_PENDING, RELEASED
      released_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

router.get("/records", async (req, res) => {
  try {
    await ensureMortuaryTables(req);
    const records = await req.prisma.$queryRawUnsafe(`
      SELECT * FROM "${req.schemaName}".mortuary_records ORDER BY created_at DESC
    `);
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post("/intake", async (req, res) => {
  try {
    await ensureMortuaryTables(req);
    const { deceased_name, mrn, chamber_no, date_of_death, cause_of_death, autopsy_requested, is_mlc } = req.body;
    const result = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${req.schemaName}".mortuary_records 
        (deceased_name, mrn, chamber_no, date_of_death, cause_of_death, autopsy_requested, is_mlc)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, deceased_name, mrn, chamber_no, date_of_death || new Date(), cause_of_death, autopsy_requested || false, is_mlc || false);
    res.json({ success: true, record: result[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
