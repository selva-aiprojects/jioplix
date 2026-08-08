const express = require("express");
const { su } = require("../../middleware/sanitize");
const router = express.Router();

const crmInfrastructureSynced = new Set();
const crmInfrastructureLocks = new Map();

async function ensureCrmInfrastructure(req) {
  const schema = req.schemaName;
  if (!schema || crmInfrastructureSynced.has(schema)) return;
  if (crmInfrastructureLocks.has(schema)) return crmInfrastructureLocks.get(schema);
  const db = req.prisma;
  const q = (sql) => db.$executeRawUnsafe(sql);
  const run = (async () => {
    try {
      await runCrmDdl(schema, q);
      crmInfrastructureSynced.add(schema);
    } catch (e) {
      console.error(`[CRM] DDL failed for ${schema}:`, e.message);
      throw e;
    } finally {
      crmInfrastructureLocks.delete(schema);
    }
  })();
  crmInfrastructureLocks.set(schema, run);
  return run;
}

async function runCrmDdl(schema, q) {
  try {
    await q(`CREATE TABLE IF NOT EXISTS "${schema}".patient_identifiers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_id UUID,
      id_type VARCHAR(20),
      id_value VARCHAR(255),
      is_primary BOOLEAN DEFAULT FALSE,
      verified BOOLEAN DEFAULT FALSE,
      verified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await q(`CREATE INDEX IF NOT EXISTS idx_patient_identifiers_patient ON "${schema}".patient_identifiers (patient_id)`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".patient_duplicates (
      id UUID PRIMARY KEY,
      patient_id UUID,
      duplicate_of_id UUID,
      match_score NUMERIC(5,2),
      matched_rules JSONB DEFAULT '[]'::jsonb,
      status VARCHAR(20) DEFAULT 'PENDING',
      merged_by VARCHAR(255),
      merged_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await q(`CREATE INDEX IF NOT EXISTS idx_patient_duplicates_status ON "${schema}".patient_duplicates (status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_patient_duplicates_patient ON "${schema}".patient_duplicates (patient_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_patient_duplicates_dup ON "${schema}".patient_duplicates (duplicate_of_id)`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".patient_groups (
      id UUID PRIMARY KEY,
      group_name VARCHAR(255),
      primary_patient_id UUID,
      billing_account_id UUID,
      created_by VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".patient_links (
      id UUID PRIMARY KEY,
      group_id UUID REFERENCES "${schema}".patient_groups(id) ON DELETE CASCADE,
      patient_id UUID,
      link_type VARCHAR(30) DEFAULT 'SELF',
      is_primary BOOLEAN DEFAULT FALSE,
      created_by VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await q(`CREATE INDEX IF NOT EXISTS idx_patient_links_group ON "${schema}".patient_links (group_id)`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".patient_consents (
      id UUID PRIMARY KEY,
      patient_id UUID,
      consent_type VARCHAR(50),
      scope JSONB DEFAULT '{}'::jsonb,
      status VARCHAR(20) DEFAULT 'GRANTED',
      granted_at TIMESTAMP DEFAULT NOW(),
      revoked_at TIMESTAMP,
      evidence VARCHAR(30) DEFAULT 'IN_PERSON',
      version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await q(`CREATE INDEX IF NOT EXISTS idx_patient_consents_patient ON "${schema}".patient_consents (patient_id)`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".referrals (
      id UUID PRIMARY KEY,
      patient_id UUID,
      referring_doctor_id UUID,
      referred_to_doctor_id UUID,
      external_source VARCHAR(255),
      reason TEXT,
      status VARCHAR(20) DEFAULT 'PENDING',
      referred_on DATE DEFAULT CURRENT_DATE,
      commission_rate NUMERIC(5,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await q(`CREATE INDEX IF NOT EXISTS idx_referrals_patient ON "${schema}".referrals (patient_id)`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".corporate_accounts (
      id UUID PRIMARY KEY,
      name VARCHAR(255),
      type VARCHAR(30) DEFAULT 'CORPORATE',
      provider_id VARCHAR(255),
      contract_terms JSONB DEFAULT '{}'::jsonb,
      credit_limit NUMERIC(14,2) DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    try {
      await q(`INSERT INTO "${schema}".rbac_permissions (key, description) VALUES
        ('CRM_VIEW', 'View CRM patient records, groups and consents'),
        ('CRM_MANAGE', 'Create and manage CRM patient data'),
        ('CRM_DEDUP', 'Run patient deduplication and merge')
        ON CONFLICT (key) DO NOTHING`);
      await q(`INSERT INTO "${schema}".rbac_role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM "${schema}".rbac_roles r, "${schema}".rbac_permissions p
        WHERE r.name = 'ADMIN' AND p.key IN ('CRM_VIEW','CRM_MANAGE','CRM_DEDUP')
        ON CONFLICT DO NOTHING`);
      await q(`INSERT INTO "${schema}".rbac_role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM "${schema}".rbac_roles r, "${schema}".rbac_permissions p
        WHERE r.name = 'NURSE' AND p.key = 'CRM_VIEW'
        ON CONFLICT DO NOTHING`);
      await q(`INSERT INTO "${schema}".rbac_role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM "${schema}".rbac_roles r, "${schema}".rbac_permissions p
        WHERE r.name = 'RECEPTIONIST' AND p.key = 'CRM_DEDUP'
        ON CONFLICT DO NOTHING`);
    } catch (e) { console.error(`[CRM] RBAC seed failed for ${schema}:`, e.message); }
  } catch (e) {
    console.error(`[CRM] DDL failed for ${schema}:`, e.message);
    throw e;
  }
}

router.use(async (req, res, next) => {
  try { await ensureCrmInfrastructure(req); } catch (e) { console.error("[CRM] ensure failed:", e.message); }
  next();
});

router.get("/ensure", async (req, res) => {
  await ensureCrmInfrastructure(req);
  const tables = await req.prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name IN ('patient_identifiers','patient_duplicates','patient_groups','patient_links','patient_consents','referrals','corporate_accounts') ORDER BY table_name`,
    req.schemaName
  );
  res.json({ ok: true, schema: req.schemaName, tables: tables.map((t) => t.table_name) });
});

function currentUserString(req) {
  if (!req.user) return "system";
  return typeof req.user === "object" ? req.user.user : req.user;
}

async function getTableColumns(req, schema, table) {
  try {
    const cols = await req.prisma.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
      schema, table
    );
    return cols.map((c) => c.column_name);
  } catch { return null; }
}

function normalizeVal(v) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function nameMatches(a, b) {
  const x = normalizeVal(a), y = normalizeVal(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

function dobMatches(a, b) {
  if (!a || !b) return false;
  return String(a).slice(0, 10) === String(b).slice(0, 10);
}

// ---- IDENTIFIERS ----
router.get("/identifiers", async (req, res, next) => {
  try {
    const { patientId } = req.query;
    if (patientId) {
      const rows = await req.prisma.$queryRawUnsafe(
        `SELECT * FROM "${req.schemaName}".patient_identifiers WHERE patient_id::text = $1 ORDER BY is_primary DESC, created_at ASC`,
        su(patientId)
      );
      return res.json(rows);
    }
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".patient_identifiers ORDER BY is_primary DESC, created_at ASC LIMIT 500`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/identifiers", async (req, res, next) => {
  try {
    const { patientId, idType, idValue, isPrimary } = req.body;
    if (!patientId || !idType || !idValue) return res.status(400).json({ error: "patientId, idType and idValue are required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".patient_identifiers (patient_id, id_type, id_value, is_primary)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      su(patientId), String(idType), String(idValue), isPrimary === true
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.delete("/identifiers/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `DELETE FROM "${req.schemaName}".patient_identifiers WHERE id::text = $1 RETURNING id`, id);
    if (!result[0]) return res.status(404).json({ error: "Identifier not found" });
    res.json({ ok: true, id: result[0].id });
  } catch (error) { next(error); }
});

// ---- DEDUPLICATION ----
async function fetchPatientPool(req, schema) {
  try {
    return await req.prisma.$queryRawUnsafe(
      `SELECT id, name, phone, email, dob FROM "${schema}".patients ORDER BY created_at DESC LIMIT 2000`);
  } catch (e) {
    try {
      return await req.prisma.$queryRawUnsafe(
        `SELECT id, name, dob FROM "${schema}".patients ORDER BY created_at DESC LIMIT 2000`);
    } catch { return []; }
  }
}

router.post("/patients/deduplicate", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const { patientId, name, phone, email, dob } = req.body;

    let subject = { id: patientId ? su(patientId) : null, name, phone, email, dob };
    const pool = await fetchPatientPool(req, s);

    if (patientId) {
      const found = pool.find((p) => String(p.id) === String(subject.id));
      if (found) subject = { ...subject, name: found.name, phone: found.phone, email: found.email, dob: found.dob };
    }

    const matches = [];
    for (const cand of pool) {
      if (subject.id && String(cand.id) === String(subject.id)) continue;
      const rules = [];
      if (subject.phone && cand.phone && normalizeVal(subject.phone) === normalizeVal(cand.phone)) {
        rules.push({ rule: "phone_exact", score: 0.95 });
      }
      if (subject.email && cand.email && normalizeVal(subject.email) === normalizeVal(cand.email)) {
        rules.push({ rule: "email_exact", score: 0.9 });
      }
      if (subject.name && cand.name && nameMatches(subject.name, cand.name) && dobMatches(subject.dob, cand.dob)) {
        rules.push({ rule: "name_dob", score: 0.75 });
      }
      if (!rules.length) continue;

      const matchScore = Math.max(...rules.map((r) => r.score));
      let dupId = null;
      try {
        const ins = await req.prisma.$queryRawUnsafe(
          `INSERT INTO "${s}".patient_duplicates (id, patient_id, duplicate_of_id, match_score, matched_rules, status)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, 'PENDING') RETURNING id`,
          subject.id || null, cand.id, matchScore, JSON.stringify(rules)
        );
        dupId = ins[0]?.id || null;
      } catch (e) { console.error(`[CRM] duplicate insert failed for ${s}:`, e.message); }

      if (matchScore >= 0.6) {
        matches.push({
          id: dupId,
          patient_id: subject.id || null,
          duplicate_of_id: cand.id,
          patient_name: subject.name || null,
          duplicate_of_name: cand.name || null,
          match_score: matchScore,
          matched_rules: rules,
          status: "PENDING",
        });
      }
    }

    matches.sort((a, b) => b.match_score - a.match_score);
    res.json({ matches });
  } catch (error) { next(error); }
});

router.get("/patients/duplicates", async (req, res, next) => {
  try {
    const s = req.schemaName;
    try {
      const rows = await req.prisma.$queryRawUnsafe(
        `SELECT d.id, d.patient_id, d.duplicate_of_id, d.match_score, d.matched_rules, d.status, d.created_at,
                p1.name AS patient_name, p2.name AS duplicate_of_name
         FROM "${s}".patient_duplicates d
         LEFT JOIN "${s}".patients p1 ON d.patient_id = p1.id
         LEFT JOIN "${s}".patients p2 ON d.duplicate_of_id = p2.id
         WHERE d.status = 'PENDING'
         ORDER BY d.match_score DESC, d.created_at DESC LIMIT 500`);
      return res.json(rows);
    } catch (e) {
      const rows = await req.prisma.$queryRawUnsafe(
        `SELECT id, patient_id, duplicate_of_id, match_score, matched_rules, status, created_at
         FROM "${s}".patient_duplicates WHERE status = 'PENDING'
         ORDER BY match_score DESC, created_at DESC LIMIT 500`);
      return res.json(rows);
    }
  } catch (error) { next(error); }
});

router.post("/patients/merge", async (req, res, next) => {
  try {
    const { duplicateId, keepPatientId } = req.body;
    if (!duplicateId || !keepPatientId) return res.status(400).json({ error: "duplicateId and keepPatientId are required" });
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".patient_duplicates
       SET status = 'MERGED', merged_by = $1, merged_at = NOW()
       WHERE id::text = $2 RETURNING *`,
      currentUserString(req), su(duplicateId)
    );
    if (!result[0]) return res.status(404).json({ error: "Duplicate not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

router.post("/patients/dismiss", async (req, res, next) => {
  try {
    const { duplicateId } = req.body;
    if (!duplicateId) return res.status(400).json({ error: "duplicateId is required" });
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".patient_duplicates
       SET status = 'DISMISSED'
       WHERE id::text = $1 RETURNING *`,
      su(duplicateId)
    );
    if (!result[0]) return res.status(404).json({ error: "Duplicate not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

// ---- GROUPS & LINKS ----
router.get("/groups", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT g.*,
              (SELECT COUNT(*)::int FROM "${req.schemaName}".patient_links l WHERE l.group_id = g.id) AS member_count
       FROM "${req.schemaName}".patient_groups g
       ORDER BY g.created_at DESC LIMIT 500`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/groups", async (req, res, next) => {
  try {
    const { groupName, primaryPatientId, billingAccountId } = req.body;
    if (!groupName) return res.status(400).json({ error: "groupName is required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".patient_groups (group_name, primary_patient_id, billing_account_id, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      String(groupName), primaryPatientId ? su(primaryPatientId) : null,
      billingAccountId ? su(billingAccountId) : null, currentUserString(req)
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.get("/groups/:id/links", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    try {
      const rows = await req.prisma.$queryRawUnsafe(
        `SELECT l.*, p.name AS patient_name
         FROM "${req.schemaName}".patient_links l
         LEFT JOIN "${req.schemaName}".patients p ON l.patient_id = p.id
         WHERE l.group_id::text = $1
         ORDER BY l.is_primary DESC, l.created_at ASC`, id);
      return res.json(rows);
    } catch (e) {
      const rows = await req.prisma.$queryRawUnsafe(
        `SELECT * FROM "${req.schemaName}".patient_links WHERE group_id::text = $1
         ORDER BY is_primary DESC, created_at ASC`, id);
      return res.json(rows);
    }
  } catch (error) { next(error); }
});

router.post("/links", async (req, res, next) => {
  try {
    const { groupId, patientId, linkType, isPrimary } = req.body;
    if (!groupId || !patientId) return res.status(400).json({ error: "groupId and patientId are required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".patient_links (group_id, patient_id, link_type, is_primary, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      su(groupId), su(patientId), linkType || "SELF", isPrimary === true, currentUserString(req)
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.delete("/links/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `DELETE FROM "${req.schemaName}".patient_links WHERE id::text = $1 RETURNING id`, id);
    if (!result[0]) return res.status(404).json({ error: "Link not found" });
    res.json({ ok: true, id: result[0].id });
  } catch (error) { next(error); }
});

// ---- CONSENTS ----
router.get("/consents", async (req, res, next) => {
  try {
    const { patientId } = req.query;
    if (patientId) {
      const rows = await req.prisma.$queryRawUnsafe(
        `SELECT * FROM "${req.schemaName}".patient_consents WHERE patient_id::text = $1 ORDER BY created_at DESC`,
        su(patientId)
      );
      return res.json(rows);
    }
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".patient_consents ORDER BY created_at DESC LIMIT 500`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/consents", async (req, res, next) => {
  try {
    const { patientId, consentType, scope, status, evidence } = req.body;
    if (!patientId || !consentType) return res.status(400).json({ error: "patientId and consentType are required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".patient_consents (patient_id, consent_type, scope, status, evidence)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      su(patientId), String(consentType), JSON.stringify(scope || {}),
      status || "GRANTED", evidence || "IN_PERSON"
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.post("/consents/:id/revoke", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".patient_consents SET status = 'REVOKED', revoked_at = NOW()
       WHERE id::text = $1 RETURNING *`, id);
    if (!result[0]) return res.status(404).json({ error: "Consent not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

router.get("/consents/export/:patientId", async (req, res, next) => {
  try {
    const patientId = su(req.params.patientId);
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".patient_consents WHERE patient_id::text = $1 ORDER BY created_at ASC`,
      patientId
    );
    res.json({ patient_id: patientId, count: rows.length, consents: rows });
  } catch (error) { next(error); }
});

// ---- REFERRALS ----
router.get("/referrals", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".referrals ORDER BY created_at DESC LIMIT 500`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/referrals", async (req, res, next) => {
  try {
    const { patientId, referringDoctorId, referredToDoctorId, externalSource, reason, status, commissionRate } = req.body;
    if (!patientId) return res.status(400).json({ error: "patientId is required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".referrals (patient_id, referring_doctor_id, referred_to_doctor_id, external_source, reason, status, commission_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      su(patientId),
      referringDoctorId ? su(referringDoctorId) : null,
      referredToDoctorId ? su(referredToDoctorId) : null,
      externalSource || null, reason || null, status || "PENDING",
      parseFloat(commissionRate || 0)
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.patch("/referrals/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "status is required" });
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".referrals SET status = $1 WHERE id::text = $2 RETURNING *`,
      String(status), id
    );
    if (!result[0]) return res.status(404).json({ error: "Referral not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

// ---- CORPORATE ACCOUNTS ----
router.get("/corporate", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".corporate_accounts ORDER BY created_at DESC LIMIT 500`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/corporate", async (req, res, next) => {
  try {
    const { name, type, providerId, contractTerms, creditLimit, isActive } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".corporate_accounts (name, type, provider_id, contract_terms, credit_limit, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      String(name), type || "CORPORATE", providerId || null,
      JSON.stringify(contractTerms || {}), parseFloat(creditLimit || 0),
      isActive === undefined ? true : isActive === true
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.patch("/corporate/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const sets = []; const params = [];
    if (req.body.name !== undefined) { params.push(String(req.body.name)); sets.push(`name = $${params.length}`); }
    if (req.body.creditLimit !== undefined) { params.push(parseFloat(req.body.creditLimit || 0)); sets.push(`credit_limit = $${params.length}`); }
    if (req.body.isActive !== undefined) { params.push(req.body.isActive === true); sets.push(`is_active = $${params.length}`); }
    if (!sets.length) return res.status(400).json({ error: "Nothing to update" });
    params.push(id);
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".corporate_accounts SET ${sets.join(", ")} WHERE id::text = $${params.length} RETURNING *`, ...params);
    if (!result[0]) return res.status(404).json({ error: "Corporate account not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

// ---- SLOTS ----
function generateSlots(date) {
  const times = [];
  const ranges = [["09:00", "13:00"], ["14:00", "18:00"]];
  for (const [start, end] of ranges) {
    let t = start;
    while (t < end) {
      times.push(t);
      const [h, m] = t.split(":").map(Number);
      let mm = m + 30, hh = h;
      if (mm >= 60) { mm -= 60; hh += 1; }
      t = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    }
  }
  return times.map((time) => ({ time, date: date || null, available: true }));
}

router.get("/slots/availability", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const { date, doctorId, location } = { ...req.query, ...req.body };

    const cols = await getTableColumns(req, s, "appointment_slots");
    if (cols && cols.length) {
      const lower = cols.map((c) => c.toLowerCase());
      const dateCol = ["date", "slot_date", "appointment_date", "available_date"].find((c) => lower.includes(c));
      const drCol = ["doctor_id", "doctorid"].find((c) => lower.includes(c));
      try {
        let sql = `SELECT * FROM "${s}".appointment_slots`;
        const conds = []; const params = [];
        if (date && dateCol) { params.push(String(date)); conds.push(`${dateCol} = $${params.length}::date`); }
        if (doctorId && drCol) { params.push(doctorId); conds.push(`${drCol}::text = $${params.length}`); }
        if (conds.length) sql += ` WHERE ${conds.join(" AND ")}`;
        sql += ` LIMIT 500`;
        const rows = await req.prisma.$queryRawUnsafe(sql, ...params);
        if (rows.length) {
          const slots = rows.map((r) => ({
            time: r.time || r.slot_time || r.start_time || r.appointment_time || null,
            start_time: r.start_time || null,
            end_time: r.end_time || null,
            doctor_id: r.doctor_id || null,
            available: r.available === undefined || r.available === true || r.available === "true",
            raw: r,
          }));
          return res.json({ slots, source: "appointment_slots", date: date || null, doctor_id: doctorId || null, location: location || null });
        }
      } catch (e) { console.error(`[CRM] appointment_slots query failed for ${s}:`, e.message); }
    }

    res.json({ slots: generateSlots(date), source: "generated", date: date || null, doctor_id: doctorId || null, location: location || null });
  } catch (error) { next(error); }
});

router.post("/slots/book", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const { patientId, date, time, doctorId, location } = req.body;
    if (!patientId) return res.status(400).json({ error: "patientId is required" });

    const cols = await getTableColumns(req, s, "appointments");
    if (!cols || !cols.length) return res.status(500).json({ ok: false, error: "schema incompatible" });

    const lower = cols.map((c) => c.toLowerCase());
    const patientCol = ["patient_id"].find((c) => lower.includes(c)) || cols.find((c) => c.toLowerCase() === "patientid");
    const doctorCol = ["doctor_id"].find((c) => lower.includes(c)) || cols.find((c) => c.toLowerCase() === "doctorid");
    const timeCol = ["appointment_time", "time", "slot_time"].find((c) => lower.includes(c));
    const dateCol = ["appointment_date", "date", "booking_date"].find((c) => lower.includes(c));
    const statusCol = ["status"].find((c) => lower.includes(c));
    const locCol = ["location", "location_id", "clinic_location"].find((c) => lower.includes(c));

    if (!patientCol) return res.status(500).json({ ok: false, error: "schema incompatible" });
    if (!timeCol && !dateCol) return res.status(500).json({ ok: false, error: "schema incompatible" });

    const insertCols = [patientCol];
    const params = [su(patientId)];
    if (doctorCol && doctorId) { insertCols.push(doctorCol); params.push(doctorId); }
    if (timeCol) {
      const val = date && time ? `${date} ${time}` : (date || time || null);
      insertCols.push(timeCol); params.push(val);
    } else if (dateCol) {
      insertCols.push(dateCol); params.push(date || null);
    }
    if (statusCol) { insertCols.push(statusCol); params.push("SCHEDULED"); }
    if (locCol && location) { insertCols.push(locCol); params.push(String(location)); }

    const placeholders = insertCols.map((_, i) => `$${i + 1}`).join(", ");
    try {
      const result = await req.prisma.$queryRawUnsafe(
        `INSERT INTO "${s}".appointments (${insertCols.join(", ")})
         VALUES (${placeholders}) RETURNING *`, ...params);
      res.status(201).json(result[0]);
    } catch (e) {
      console.error(`[CRM] appointment insert failed for ${s}:`, e.message);
      res.status(500).json({ ok: false, error: "schema incompatible" });
    }
  } catch (error) { next(error); }
});

module.exports = router;
module.exports.ensureCrmInfrastructure = ensureCrmInfrastructure;
