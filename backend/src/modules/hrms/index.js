const express = require("express");
const { su } = require("../../middleware/sanitize");
const router = express.Router();

const hrmsInfrastructureSynced = new Set();
const hrmsInfrastructureLocks = new Map();

async function ensureHrmsInfrastructure(req) {
  const schema = req.schemaName;
  if (!schema || hrmsInfrastructureSynced.has(schema)) return;
  if (hrmsInfrastructureLocks.has(schema)) return hrmsInfrastructureLocks.get(schema);
  const db = req.prisma;
  const q = (sql) => db.$executeRawUnsafe(sql);
  const run = (async () => {
    try {
      await runHrmsDdl(schema, q);
      hrmsInfrastructureSynced.add(schema);
    } catch (e) {
      console.error(`[HRMS] DDL failed for ${schema}:`, e.message);
      throw e;
    } finally {
      hrmsInfrastructureLocks.delete(schema);
    }
  })();
  hrmsInfrastructureLocks.set(schema, run);
  return run;
}

async function runHrmsDdl(schema, q) {
  const sq = async (sql) => { try { await q(sql); } catch(e) { /* ignore DDL warnings */ } };
  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".duty_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_overnight BOOLEAN DEFAULT FALSE,
    min_staff INTEGER DEFAULT 1,
    applicable_days JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  await sq(`CREATE UNIQUE INDEX IF NOT EXISTS uq_duty_shifts_name ON "${schema}".duty_shifts (name)`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".duty_roster (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_user_id UUID NOT NULL,
    shift_id UUID,
    duty_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'SCHEDULED',
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);
  await sq(`ALTER TABLE "${schema}".duty_roster ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'SCHEDULED'`);
  await sq(`ALTER TABLE "${schema}".duty_roster ADD COLUMN IF NOT EXISTS note TEXT`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".roster_swaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    roster_entry_id UUID NOT NULL,
    requested_by_user_id UUID,
    requested_to_user_id UUID NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    decided_by_user_id UUID,
    decided_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_user_id UUID NOT NULL,
    shift_id UUID,
    work_date DATE NOT NULL,
    check_in TIMESTAMP,
    check_out TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PRESENT',
    source VARCHAR(30) DEFAULT 'MANUAL',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".staff_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    credential_type VARCHAR(100) NOT NULL,
    credential_no VARCHAR(100),
    issued_by VARCHAR(255),
    issued_on DATE,
    expires_on DATE,
    verification_status VARCHAR(30) DEFAULT 'UNVERIFIED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".staff_privileges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    privilege VARCHAR(100) NOT NULL,
    granted_by_user_id UUID,
    granted_on TIMESTAMP DEFAULT NOW(),
    revoked_on TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".on_call_duty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_user_id UUID NOT NULL,
    duty_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    type VARCHAR(50) DEFAULT 'GENERAL',
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`INSERT INTO "${schema}".duty_shifts (name, code, start_time, end_time, is_overnight, min_staff) VALUES
    ('Morning', 'M', '08:00', '14:00', FALSE, 2),
    ('Evening', 'E', '14:00', '20:00', FALSE, 2),
    ('Night', 'N', '20:00', '08:00', TRUE, 1),
    ('General', 'G', '09:00', '17:00', FALSE, 1)
    ON CONFLICT (name) DO NOTHING`);

  await sq(`CREATE INDEX IF NOT EXISTS idx_roster_date ON "${schema}".duty_roster (duty_date)`);
  await sq(`CREATE INDEX IF NOT EXISTS idx_roster_staff ON "${schema}".duty_roster (staff_user_id)`);
  await sq(`CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON "${schema}".attendance (staff_user_id, work_date)`);
  await sq(`CREATE INDEX IF NOT EXISTS idx_oncall_date ON "${schema}".on_call_duty (duty_date)`);
}

router.use(async (req, res, next) => {
  try { await ensureHrmsInfrastructure(req); } catch (e) { console.error("[HRMS] ensure failed:", e.message); }
  next();
});

router.get("/ensure", async (req, res) => {
  await ensureHrmsInfrastructure(req);
  const tables = await req.prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name IN ('duty_shifts','duty_roster','roster_swaps','attendance','staff_credentials','staff_privileges','on_call_duty') ORDER BY table_name`,
    req.schemaName
  );
  res.json({ ok: true, schema: req.schemaName, tables: tables.map((t) => t.table_name) });
});

async function getCurrentUserId(req) {
  if (!req.user) return null;
  const email = typeof req.user === "object" ? req.user.user : req.user;
  try {
    const users = await req.prisma.$queryRawUnsafe(
      `SELECT id FROM "${req.schemaName}".users WHERE LOWER(email) = LOWER($1) LIMIT 1`, email);
    return users[0]?.id || null;
  } catch { return null; }
}

// ---- STAFF ----
router.get("/staff", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT id, name, email, role, department, specialization, employment_type, is_manager, is_active
       FROM "${req.schemaName}".users
       WHERE is_active = TRUE
       ORDER BY name ASC`);
    res.json(rows);
  } catch (error) { next(error); }
});

// ---- SHIFTS ----
router.get("/shifts", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".duty_shifts ORDER BY start_time ASC`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/shifts", async (req, res, next) => {
  try {
    const { name, code, start_time, end_time, is_overnight, min_staff, applicable_days } = req.body;
    if (!name || !start_time || !end_time) return res.status(400).json({ error: "name, start_time, end_time are required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".duty_shifts (name, code, start_time, end_time, is_overnight, min_staff, applicable_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      String(name), code || null, String(start_time), String(end_time),
      is_overnight === true, parseInt(min_staff || "1", 10) || 1,
      JSON.stringify(applicable_days || [])
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.put("/shifts/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const fields = ["name", "code", "start_time", "end_time", "min_staff", "applicable_days"];
    const sets = []; const params = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        params.push(f === "applicable_days" ? JSON.stringify(req.body[f]) : req.body[f]);
        sets.push(`${f} = $${params.length}`);
      }
    }
    if (req.body.is_overnight !== undefined) { params.push(req.body.is_overnight === true); sets.push(`is_overnight = $${params.length}`); }
    if (req.body.is_active !== undefined) { params.push(req.body.is_active === true); sets.push(`is_active = $${params.length}`); }
    if (!sets.length) return res.status(400).json({ error: "Nothing to update" });
    params.push(id);
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".duty_shifts SET ${sets.join(", ")} WHERE id::text = $${params.length} RETURNING *`, ...params);
    if (!result[0]) return res.status(404).json({ error: "Shift not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

router.delete("/shifts/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `DELETE FROM "${req.schemaName}".duty_shifts WHERE id::text = $1 RETURNING id`, id);
    if (!result[0]) return res.status(404).json({ error: "Shift not found" });
    res.json({ ok: true, id: result[0].id });
  } catch (error) { next(error); }
});

// ---- ROSTER ----
const ROSTER_SELECT = (s) => `
  SELECT r.*, u.name AS staff_name, u.role AS staff_role, u.department,
         sh.name AS shift_name, sh.start_time, sh.end_time, sh.is_overnight
  FROM "${s}".duty_roster r
  LEFT JOIN "${s}".users u ON r.staff_user_id = u.id
  LEFT JOIN "${s}".duty_shifts sh ON r.shift_id = sh.id
`;

router.get("/roster", async (req, res, next) => {
  try {
    const { from, to, staffId, date } = req.query;
    const conds = []; const params = [];
    if (from) { params.push(String(from)); conds.push(`r.duty_date >= $${params.length}::date`); }
    if (to) { params.push(String(to)); conds.push(`r.duty_date <= $${params.length}::date`); }
    if (date) { params.push(String(date)); conds.push(`r.duty_date = $${params.length}::date`); }
    if (staffId) { params.push(su(staffId)); conds.push(`r.staff_user_id::text = $${params.length}`); }
    let query = ROSTER_SELECT(req.schemaName);
    if (conds.length) query += ` WHERE ${conds.join(" AND ")}`;
    query += ` ORDER BY r.duty_date ASC, sh.start_time ASC`;
    const rows = await req.prisma.$queryRawUnsafe(query, ...params);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/roster", async (req, res, next) => {
  try {
    const { staffUserId, shiftId, dutyDate, note } = req.body;
    if (!staffUserId || !dutyDate) return res.status(400).json({ error: "staffUserId and dutyDate are required" });
    const staff = su(staffUserId);
    const date = String(dutyDate);

    const conflicts = await req.prisma.$queryRawUnsafe(
      `SELECT r.id, sh.name AS shift_name, sh.start_time, sh.end_time
       FROM "${req.schemaName}".duty_roster r
       LEFT JOIN "${req.schemaName}".duty_shifts sh ON r.shift_id = sh.id
       WHERE r.staff_user_id::text = $1 AND r.duty_date = $2::date AND r.status <> 'CANCELLED'`,
      staff, date
    );

    let effectiveShiftId = shiftId || null;
    if (shiftId) effectiveShiftId = su(shiftId);
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".duty_roster (staff_user_id, shift_id, duty_date, status, note)
       VALUES ($1, $2, $3, 'SCHEDULED', $4) RETURNING *`,
      staff, effectiveShiftId, date, note || null
    );

    res.status(201).json({ entry: result[0], conflicts });
  } catch (error) { next(error); }
});

router.delete("/roster/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `DELETE FROM "${req.schemaName}".duty_roster WHERE id::text = $1 RETURNING id`, id);
    if (!result[0]) return res.status(404).json({ error: "Roster entry not found" });
    res.json({ ok: true, id: result[0].id });
  } catch (error) { next(error); }
});

router.patch("/roster/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const { status, shiftId, note } = req.body;
    const sets = []; const params = [];
    if (status) { params.push(String(status)); sets.push(`status = $${params.length}`); }
    if (shiftId) { params.push(su(shiftId)); sets.push(`shift_id = $${params.length}`); }
    if (note !== undefined) { params.push(note || null); sets.push(`note = $${params.length}`); }
    if (!sets.length) return res.status(400).json({ error: "Nothing to update" });
    params.push(id);
    sets.push("updated_at = NOW()");
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".duty_roster SET ${sets.join(", ")} WHERE id::text = $${params.length} RETURNING *`, ...params);
    if (!result[0]) return res.status(404).json({ error: "Roster entry not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

// ---- ROSTER SWAPS ----
router.get("/swaps", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT sw.*, r.duty_date, sh.name AS shift_name,
              req.name AS requested_by_name, to_.name AS requested_to_name, d.name AS decided_by_name
       FROM "${req.schemaName}".roster_swaps sw
       LEFT JOIN "${req.schemaName}".duty_roster r ON sw.roster_entry_id = r.id
       LEFT JOIN "${req.schemaName}".duty_shifts sh ON r.shift_id = sh.id
       LEFT JOIN "${req.schemaName}".users req ON sw.requested_by_user_id = req.id
       LEFT JOIN "${req.schemaName}".users to_ ON sw.requested_to_user_id = to_.id
       LEFT JOIN "${req.schemaName}".users d ON sw.decided_by_user_id = d.id
       ORDER BY sw.created_at DESC LIMIT 200`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/swaps", async (req, res, next) => {
  try {
    const { rosterEntryId, requestedToUserId, reason } = req.body;
    if (!rosterEntryId || !requestedToUserId) return res.status(400).json({ error: "rosterEntryId and requestedToUserId are required" });
    const requestedBy = await getCurrentUserId(req);
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".roster_swaps (roster_entry_id, requested_by_user_id, requested_to_user_id, reason, status)
       VALUES ($1, $2, $3, $4, 'PENDING') RETURNING *`,
      su(rosterEntryId), requestedBy || null, su(requestedToUserId), reason || null
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.post("/swaps/:id/decide", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const { approve } = req.body;
    const decidedBy = await getCurrentUserId(req);
    const swap = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".roster_swaps WHERE id::text = $1`, id);
    if (!swap[0]) return res.status(404).json({ error: "Swap not found" });

    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".roster_swaps
       SET status = $1, decided_by_user_id = $2, decided_at = NOW()
       WHERE id::text = $3 RETURNING *`,
      approve === true ? "APPROVED" : "REJECTED", decidedBy || null, id
    );

    if (approve === true) {
      await req.prisma.$executeRawUnsafe(
        `UPDATE "${req.schemaName}".duty_roster
         SET staff_user_id = $1, updated_at = NOW()
         WHERE id = $2`,
        su(swap[0].requested_to_user_id), swap[0].roster_entry_id
      );
    }
    res.json(result[0]);
  } catch (error) { next(error); }
});

// ---- ATTENDANCE ----
router.get("/attendance", async (req, res, next) => {
  try {
    const { from, to, staffId, date, status } = req.query;
    const conds = []; const params = [];
    if (from) { params.push(String(from)); conds.push(`a.work_date >= $${params.length}::date`); }
    if (to) { params.push(String(to)); conds.push(`a.work_date <= $${params.length}::date`); }
    if (date) { params.push(String(date)); conds.push(`a.work_date = $${params.length}::date`); }
    if (staffId) { params.push(su(staffId)); conds.push(`a.staff_user_id::text = $${params.length}`); }
    if (status) { params.push(String(status)); conds.push(`a.status = $${params.length}`); }
    let query = `
      SELECT a.*, u.name AS staff_name, u.role AS staff_role, u.department,
             sh.name AS shift_name
      FROM "${req.schemaName}".attendance a
      LEFT JOIN "${req.schemaName}".users u ON a.staff_user_id = u.id
      LEFT JOIN "${req.schemaName}".duty_shifts sh ON a.shift_id = sh.id`;
    if (conds.length) query += ` WHERE ${conds.join(" AND ")}`;
    query += ` ORDER BY a.work_date DESC, a.created_at DESC LIMIT 500`;
    const rows = await req.prisma.$queryRawUnsafe(query, ...params);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/attendance", async (req, res, next) => {
  try {
    const { staffUserId, workDate, checkIn, checkOut, status, shiftId, remarks } = req.body;
    if (!staffUserId || !workDate) return res.status(400).json({ error: "staffUserId and workDate are required" });

    const existing = await req.prisma.$queryRawUnsafe(
      `SELECT id FROM "${req.schemaName}".attendance WHERE staff_user_id::text = $1 AND work_date = $2::date LIMIT 1`,
      su(staffUserId), String(workDate)
    );
    if (existing[0]) {
      const result = await req.prisma.$queryRawUnsafe(
        `UPDATE "${req.schemaName}".attendance
         SET check_in = COALESCE($1, check_in), check_out = COALESCE($2, check_out),
             status = COALESCE($3, status), shift_id = COALESCE($4, shift_id), remarks = COALESCE($5, remarks),
             updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        checkIn || null, checkOut || null, status || null,
        shiftId ? su(shiftId) : null, remarks || null, existing[0].id
      );
      return res.json(result[0]);
    }

    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".attendance (staff_user_id, shift_id, work_date, check_in, check_out, status, source, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, 'MANUAL', $7) RETURNING *`,
      su(staffUserId), shiftId ? su(shiftId) : null, String(workDate),
      checkIn || null, checkOut || null, status || "PRESENT", remarks || null
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.delete("/attendance/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `DELETE FROM "${req.schemaName}".attendance WHERE id::text = $1 RETURNING id`, id);
    if (!result[0]) return res.status(404).json({ error: "Attendance record not found" });
    res.json({ ok: true, id: result[0].id });
  } catch (error) { next(error); }
});

// ---- ON-CALL DUTY ----
router.get("/oncall", async (req, res, next) => {
  try {
    const { from, to, staffId } = req.query;
    const conds = []; const params = [];
    if (from) { params.push(String(from)); conds.push(`o.duty_date >= $${params.length}::date`); }
    if (to) { params.push(String(to)); conds.push(`o.duty_date <= $${params.length}::date`); }
    if (staffId) { params.push(su(staffId)); conds.push(`o.staff_user_id::text = $${params.length}`); }
    let query = `
      SELECT o.*, u.name AS staff_name, u.role AS staff_role
      FROM "${req.schemaName}".on_call_duty o
      LEFT JOIN "${req.schemaName}".users u ON o.staff_user_id = u.id`;
    if (conds.length) query += ` WHERE ${conds.join(" AND ")}`;
    query += ` ORDER BY o.duty_date DESC, o.start_time ASC LIMIT 500`;
    res.json(await req.prisma.$queryRawUnsafe(query, ...params));
  } catch (error) { next(error); }
});

router.post("/oncall", async (req, res, next) => {
  try {
    const { staffUserId, dutyDate, startTime, endTime, type, notes } = req.body;
    if (!staffUserId || !dutyDate) return res.status(400).json({ error: "staffUserId and dutyDate are required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".on_call_duty (staff_user_id, duty_date, start_time, end_time, type, status, notes)
       VALUES ($1, $2, $3, $4, $5, 'SCHEDULED', $6) RETURNING *`,
      su(staffUserId), String(dutyDate), startTime || null, endTime || null, type || "GENERAL", notes || null
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.delete("/oncall/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `DELETE FROM "${req.schemaName}".on_call_duty WHERE id::text = $1 RETURNING id`, id);
    if (!result[0]) return res.status(404).json({ error: "On-call record not found" });
    res.json({ ok: true, id: result[0].id });
  } catch (error) { next(error); }
});

// ---- CREDENTIALS ----
router.get("/credentials", async (req, res, next) => {
  try {
    const { staffId } = req.query;
    const conds = []; const params = [];
    if (staffId) { params.push(su(staffId)); conds.push(`c.user_id::text = $${params.length}`); }
    let query = `
      SELECT c.*, u.name AS staff_name, u.role AS staff_role,
             CASE WHEN c.expires_on IS NOT NULL AND c.expires_on < NOW()::date THEN 'EXPIRED' ELSE 'VALID' END AS expiry_status
      FROM "${req.schemaName}".staff_credentials c
      LEFT JOIN "${req.schemaName}".users u ON c.user_id = u.id`;
    if (conds.length) query += ` WHERE ${conds.join(" AND ")}`;
    query += ` ORDER BY c.created_at DESC LIMIT 500`;
    res.json(await req.prisma.$queryRawUnsafe(query, ...params));
  } catch (error) { next(error); }
});

router.post("/credentials", async (req, res, next) => {
  try {
    const { userId, credentialType, credentialNo, issuedBy, issuedOn, expiresOn, verificationStatus, notes } = req.body;
    if (!userId || !credentialType) return res.status(400).json({ error: "userId and credentialType are required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".staff_credentials (user_id, credential_type, credential_no, issued_by, issued_on, expires_on, verification_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      su(userId), String(credentialType), credentialNo || null, issuedBy || null,
      issuedOn || null, expiresOn || null, verificationStatus || "UNVERIFIED", notes || null
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.patch("/credentials/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const fields = ["credential_type", "credential_no", "issued_by", "issued_on", "expires_on", "verification_status", "notes"];
    const sets = []; const params = [];
    for (const f of fields) {
      if (req.body[f] !== undefined) { params.push(req.body[f]); sets.push(`${f} = $${params.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: "Nothing to update" });
    params.push(id);
    sets.push("updated_at = NOW()");
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".staff_credentials SET ${sets.join(", ")} WHERE id::text = $${params.length} RETURNING *`, ...params);
    if (!result[0]) return res.status(404).json({ error: "Credential not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

router.delete("/credentials/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `DELETE FROM "${req.schemaName}".staff_credentials WHERE id::text = $1 RETURNING id`, id);
    if (!result[0]) return res.status(404).json({ error: "Credential not found" });
    res.json({ ok: true, id: result[0].id });
  } catch (error) { next(error); }
});

// ---- PRIVILEGES ----
router.get("/privileges", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT p.*, u.name AS staff_name, g.name AS granted_by_name
       FROM "${req.schemaName}".staff_privileges p
       LEFT JOIN "${req.schemaName}".users u ON p.user_id = u.id
       LEFT JOIN "${req.schemaName}".users g ON p.granted_by_user_id = g.id
       ORDER BY p.created_at DESC LIMIT 500`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/privileges", async (req, res, next) => {
  try {
    const { userId, privilege, notes } = req.body;
    if (!userId || !privilege) return res.status(400).json({ error: "userId and privilege are required" });
    const grantedBy = await getCurrentUserId(req);
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".staff_privileges (user_id, privilege, granted_by_user_id, is_active, notes)
       VALUES ($1, $2, $3, TRUE, $4) RETURNING *`,
      su(userId), String(privilege), grantedBy || null, notes || null
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.post("/privileges/:id/revoke", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".staff_privileges SET is_active = FALSE, revoked_on = NOW()
       WHERE id::text = $1 RETURNING *`, id);
    if (!result[0]) return res.status(404).json({ error: "Privilege not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

// ---- ANALYTICS ----
router.get("/analytics", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const [dutyToday, attendanceSummary, onCallToday, rosterWeek] = await Promise.all([
      req.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "${s}".duty_roster WHERE duty_date = NOW()::date AND status <> 'CANCELLED'`),
      req.prisma.$queryRawUnsafe(`SELECT status, COUNT(*)::int AS count FROM "${s}".attendance WHERE work_date = NOW()::date GROUP BY status`),
      req.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "${s}".on_call_duty WHERE duty_date = NOW()::date`),
      req.prisma.$queryRawUnsafe(`SELECT duty_date, COUNT(*)::int AS count FROM "${s}".duty_roster WHERE duty_date BETWEEN NOW()::date AND NOW()::date + 6 AND status <> 'CANCELLED' GROUP BY duty_date ORDER BY duty_date`),
    ]);
    res.json({
      dutyToday: dutyToday[0]?.count || 0,
      attendanceSummary,
      onCallToday: onCallToday[0]?.count || 0,
      rosterWeek,
    });
  } catch (error) { next(error); }
});

// ---- ROOT & DEPARTMENTS ----
router.get("/", async (req, res) => {
  try {
    const s = req.schemaName;
    const [staff, shifts] = await Promise.all([
      req.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "${s}".users WHERE is_active = TRUE`).catch(() => [{ count: 0 }]),
      req.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "${s}".duty_shifts`).catch(() => [{ count: 0 }])
    ]);
    res.json({ ok: true, activeStaff: staff[0]?.count || 0, activeShifts: shifts[0]?.count || 0 });
  } catch (error) { res.json({ ok: true, activeStaff: 0, activeShifts: 0 }); }
});

router.get("/departments", async (req, res) => {
  try {
    const s = req.schemaName;
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT DISTINCT department FROM "${s}".users WHERE department IS NOT NULL AND department <> '' ORDER BY department ASC`
    ).catch(() => []);
    res.json(rows.map(r => typeof r === 'string' ? r : r.department));
  } catch (error) { res.json([]); }
});

router.get("/leave-requests", async (req, res) => {
  try {
    const s = req.schemaName;
    const rows = await req.prisma.$queryRawUnsafe(`SELECT * FROM "${s}".attendance WHERE status = 'ON_LEAVE' ORDER BY work_date DESC LIMIT 100`).catch(() => []);
    res.json(rows);
  } catch { res.json([]); }
});

module.exports = router;
module.exports.ensureHrmsInfrastructure = ensureHrmsInfrastructure;
