const express = require("express");
const axios = require("axios");
const { si, su } = require("../../middleware/sanitize");
const router = express.Router();

const helpdeskInfrastructureSynced = new Set();

const s = (val) => (val === undefined || val === null ? "" : String(val).replace(/'/g, "''"));

async function getCurrentUserId(req) {
  if (!req.user) return null;
  const email = typeof req.user === "object" ? req.user.user : req.user;
  try {
    const users = await req.prisma.$queryRawUnsafe(
      `SELECT id FROM "${req.schemaName}".users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      email
    );
    return users[0]?.id || null;
  } catch {
    return null;
  }
}

async function sendEmail(req, to, subject, html) {
  if (!process.env.RESEND_API_KEY || !to) return false;
  try {
    await axios.post(
      "https://api.resend.com/emails",
      {
        from: process.env.RESEND_FROM || "HIMS Support",
        to: [to],
        subject,
        html,
      },
      { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" } }
    );
    try {
      await req.prisma.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "${req.schemaName}".helpdesk_email_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          recipient VARCHAR(255),
          subject VARCHAR(255),
          status VARCHAR(30) DEFAULT 'SENT',
          created_at TIMESTAMP DEFAULT NOW()
        )`
      );
      await req.prisma.$executeRawUnsafe(
        `INSERT INTO "${req.schemaName}".helpdesk_email_logs (recipient, subject, status) VALUES ($1, $2, 'SENT')`,
        to, subject
      );
    } catch (e) { /* non-critical log */ }
    return true;
  } catch (e) {
    console.error("[HELPDESK] email failed:", e.message);
    return false;
  }
}

async function getSlaPolicy(req, priority) {
  const rows = await req.prisma.$queryRawUnsafe(
    `SELECT response_hours, resolution_hours, auto_escalate_minutes, max_escalation_level
     FROM "${req.schemaName}".helpdesk_sla_policies WHERE priority = $1 AND is_active = TRUE LIMIT 1`,
    priority || "MEDIUM"
  );
  return rows[0] || { response_hours: 8, resolution_hours: 48, auto_escalate_minutes: 720, max_escalation_level: 3 };
}

async function nextTicketNo(req) {
  const rows = await req.prisma.$queryRawUnsafe(
    `SELECT COALESCE(MAX(NULLIF(regexp_replace(ticket_no, '[^0-9]', '', 'g'), '')::int), 0) + 1 AS n FROM "${req.schemaName}".helpdesk_tickets`
  );
  const n = parseInt(rows[0]?.n || 1, 10);
  return `TK-${String(n).padStart(4, "0")}`;
}

async function pickDefaultAssignee(req, departmentId) {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT u.id FROM "${req.schemaName}".users u
       WHERE UPPER(u.role) IN ('SUPPORT','ADMIN') AND u.is_active = TRUE
       ORDER BY u.is_manager DESC, u.created_at ASC LIMIT 1`
    );
    return rows[0]?.id || null;
  } catch {
    return null;
  }
}

async function ensureHelpdeskInfrastructure(req) {
  const schema = req.schemaName;
  if (!schema || helpdeskInfrastructureSynced.has(schema)) return;
  const db = req.prisma;
  const q = (sql) => db.$executeRawUnsafe(sql);
  try {
    await q(`CREATE TABLE IF NOT EXISTS "${schema}".helpdesk_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL UNIQUE,
      type VARCHAR(30) NOT NULL DEFAULT 'INTERNAL',
      default_priority VARCHAR(20) DEFAULT 'MEDIUM',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".helpdesk_sla_policies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      priority VARCHAR(20) NOT NULL UNIQUE,
      response_hours NUMERIC DEFAULT 8,
      resolution_hours NUMERIC DEFAULT 24,
      auto_escalate_minutes INTEGER DEFAULT 120,
      max_escalation_level INTEGER DEFAULT 3,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".helpdesk_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_no VARCHAR(20) NOT NULL UNIQUE,
      category_id UUID REFERENCES "${schema}".helpdesk_categories(id),
      channel VARCHAR(30) DEFAULT 'INTERNAL',
      subject VARCHAR(255) NOT NULL,
      description TEXT,
      priority VARCHAR(20) DEFAULT 'MEDIUM',
      status VARCHAR(30) DEFAULT 'OPEN',
      source_type VARCHAR(30),
      source_id UUID,
      patient_id UUID REFERENCES "${schema}".patients(id),
      department_id UUID REFERENCES "${schema}".departments(id),
      reported_by_user_id UUID REFERENCES "${schema}".users(id),
      assigned_user_id UUID REFERENCES "${schema}".users(id),
      escalation_level INTEGER DEFAULT 0,
      sla_due_at TIMESTAMP,
      first_response_due_at TIMESTAMP,
      last_escalated_at TIMESTAMP,
      first_response_at TIMESTAMP,
      resolved_at TIMESTAMP,
      closed_at TIMESTAMP,
      attachments JSONB,
      rating INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await q(`ALTER TABLE "${schema}".helpdesk_tickets ADD COLUMN IF NOT EXISTS first_response_due_at TIMESTAMP`);
    await q(`ALTER TABLE "${schema}".helpdesk_tickets ADD COLUMN IF NOT EXISTS last_escalated_at TIMESTAMP`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".helpdesk_escalations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id UUID NOT NULL REFERENCES "${schema}".helpdesk_tickets(id),
      from_level INTEGER DEFAULT 0,
      to_level INTEGER DEFAULT 1,
      reason TEXT,
      triggered_at TIMESTAMP DEFAULT NOW(),
      assigned_to_user_id UUID REFERENCES "${schema}".users(id)
    )`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".helpdesk_ticket_notes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id UUID NOT NULL REFERENCES "${schema}".helpdesk_tickets(id),
      user_id UUID REFERENCES "${schema}".users(id),
      body TEXT NOT NULL,
      is_internal BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".helpdesk_equipment (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      asset_tag VARCHAR(50) UNIQUE,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      department_id UUID REFERENCES "${schema}".departments(id),
      status VARCHAR(30) DEFAULT 'OPERATIONAL',
      vendor_id UUID,
      purchase_date DATE,
      warranty_till DATE,
      last_maintenance_at TIMESTAMP,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);

    await q(`INSERT INTO "${schema}".helpdesk_categories (name, type, default_priority) VALUES
      ('IT / Software', 'INTERNAL', 'MEDIUM'),
      ('Hardware / Equipment', 'INTERNAL', 'HIGH'),
      ('Housekeeping', 'INTERNAL', 'MEDIUM'),
      ('Staff Services', 'INTERNAL', 'LOW'),
      ('Patient Care Quality', 'PATIENT_GRIEVANCE', 'HIGH'),
      ('Billing / Payment', 'PATIENT_GRIEVANCE', 'MEDIUM'),
      ('Facilities / Infrastructure', 'PATIENT_GRIEVANCE', 'MEDIUM')
      ON CONFLICT (name) DO NOTHING`);

    await q(`INSERT INTO "${schema}".helpdesk_sla_policies (priority, response_hours, resolution_hours, auto_escalate_minutes, max_escalation_level) VALUES
      ('LOW', 24, 72, 1440, 2),
      ('MEDIUM', 8, 48, 720, 3),
      ('HIGH', 4, 24, 240, 3),
      ('CRITICAL', 1, 4, 60, 3)
      ON CONFLICT (priority) DO NOTHING`);

    await q(`CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_status ON "${schema}".helpdesk_tickets (status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_priority ON "${schema}".helpdesk_tickets (priority)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_patient ON "${schema}".helpdesk_tickets (patient_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_assigned ON "${schema}".helpdesk_tickets (assigned_user_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_department ON "${schema}".helpdesk_tickets (department_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_sla_due ON "${schema}".helpdesk_tickets (sla_due_at)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_created_at ON "${schema}".helpdesk_tickets (created_at DESC)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_helpdesk_notes_ticket ON "${schema}".helpdesk_ticket_notes (ticket_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_helpdesk_escalations_ticket ON "${schema}".helpdesk_escalations (ticket_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_helpdesk_equipment_department ON "${schema}".helpdesk_equipment (department_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_helpdesk_equipment_status ON "${schema}".helpdesk_equipment (status)`);

    // RBAC permissions (best-effort; roles may be absent on minimal shards)
    try {
      await q(`INSERT INTO "${schema}".rbac_permissions (key, description) VALUES
        ('HELPDESK_VIEW', 'View help desk tickets'),
        ('HELPDESK_MANAGE', 'Create and manage help desk tickets'),
        ('HELPDESK_APPROVE', 'Approve escalations and help desk overrides')
        ON CONFLICT (key) DO NOTHING`);
      await q(`INSERT INTO "${schema}".rbac_role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM "${schema}".rbac_roles r, "${schema}".rbac_permissions p
        WHERE r.name = 'ADMIN' AND p.key IN ('HELPDESK_VIEW','HELPDESK_MANAGE','HELPDESK_APPROVE')
        ON CONFLICT DO NOTHING`);
      await q(`INSERT INTO "${schema}".rbac_role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM "${schema}".rbac_roles r, "${schema}".rbac_permissions p
        WHERE r.name = 'SUPPORT' AND p.key IN ('HELPDESK_VIEW','HELPDESK_MANAGE')
        ON CONFLICT DO NOTHING`);
      await q(`INSERT INTO "${schema}".rbac_role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM "${schema}".rbac_roles r, "${schema}".rbac_permissions p
        WHERE r.name = 'NURSE' AND p.key = 'HELPDESK_VIEW'
        ON CONFLICT DO NOTHING`);
    } catch (e) { console.error(`[HELPDESK] RBAC seed failed for ${schema}:`, e.message); }
  } catch (e) {
    console.error(`[HELPDESK] DDL failed for ${schema}:`, e.message);
  }
  helpdeskInfrastructureSynced.add(schema);
}

router.use(async (req, res, next) => {
  try {
    await ensureHelpdeskInfrastructure(req);
  } catch (e) {
    console.error("[HELPDESK] ensure failed:", e.message);
  }
  next();
});

// Health / provisioning check
router.get("/ensure", async (req, res) => {
  await ensureHelpdeskInfrastructure(req);
  const tables = await req.prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name LIKE 'helpdesk_%' ORDER BY table_name`,
    req.schemaName
  );
  res.json({ ok: true, schema: req.schemaName, tables: tables.map((t) => t.table_name) });
});

// --- CATEGORIES ---
router.get("/categories", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".helpdesk_categories WHERE is_active = TRUE ORDER BY type ASC, name ASC`
    );
    res.json(rows);
  } catch (error) { next(error); }
});

// --- TICKETS: CREATE ---
router.post("/tickets", async (req, res, next) => {
  try {
    const {
      categoryId, categoryName, subject, description, priority,
      sourceType, sourceId, patientId, departmentId, attachments, channel,
    } = req.body;

    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ error: "Subject is required" });
    }

    let catId = categoryId || null;
    let cat = null;
    if (categoryName && !catId) {
      const found = await req.prisma.$queryRawUnsafe(
        `SELECT id, default_priority FROM "${req.schemaName}".helpdesk_categories WHERE LOWER(name) = LOWER($1) LIMIT 1`,
        categoryName
      );
      cat = found[0] || null;
      catId = cat?.id || null;
    } else if (catId) {
      const found = await req.prisma.$queryRawUnsafe(
        `SELECT id, default_priority FROM "${req.schemaName}".helpdesk_categories WHERE id::text = $1 LIMIT 1`,
        catId
      );
      cat = found[0] || null;
    }

    const effectivePriority = priority || cat?.default_priority || "MEDIUM";
    const sla = await getSlaPolicy(req, effectivePriority);
    const reportedBy = await getCurrentUserId(req);
    const assignee = (req.body.assignToUserId && su(req.body.assignToUserId, "assignToUserId")) || null;

    const ticketNo = await nextTicketNo(req);
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".helpdesk_tickets
        (ticket_no, category_id, channel, subject, description, priority, source_type, source_id,
         patient_id, department_id, reported_by_user_id, assigned_user_id,
         sla_due_at, first_response_due_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW() + ($13 || ' hours')::interval, NOW() + ($14 || ' hours')::interval)
       RETURNING *`,
      ticketNo, catId, channel || "INTERNAL", String(subject), String(description || ""),
      effectivePriority, sourceType || null, sourceId || null, patientId || null, departmentId || null,
      reportedBy || null, assignee, String(sla.resolution_hours), String(sla.response_hours)
    );
    const ticket = result[0];

    if (ticket && !assignee) {
      const auto = await pickDefaultAssignee(req, departmentId);
      if (auto) {
        await req.prisma.$executeRawUnsafe(
          `UPDATE "${req.schemaName}".helpdesk_tickets SET assigned_user_id = $1 WHERE id = $2`,
          auto, ticket.id
        );
        ticket.assigned_user_id = auto;
      }
    }

    if (ticket && process.env.RESEND_API_KEY) {
      const reporter = await req.prisma.$queryRawUnsafe(
        `SELECT email FROM "${req.schemaName}".users WHERE id::text = $1 LIMIT 1`,
        ticket.assigned_user_id || ""
      );
      if (reporter[0]?.email) {
        await sendEmail(req, reporter[0].email, `[NEW TICKET] ${ticket.ticket_no}: ${ticket.subject}`,
          `<p>A new help desk ticket <strong>${ticket.ticket_no}</strong> has been assigned to you.</p><p><strong>Subject:</strong> ${s(ticket.subject)}</p><p><strong>Priority:</strong> ${ticket.priority}</p><p><strong>SLA due:</strong> ${ticket.sla_due_at}</p>`);
      }
    }

    res.status(201).json(ticket);
  } catch (error) { next(error); }
});

const TICKET_LIST_SELECT = (s) => `
  SELECT t.*,
    c.name AS category_name, c.type AS category_type,
    a.name AS assigned_name, r.name AS reported_name,
    d.name AS department_name, p.name AS patient_name, p.phone AS patient_phone, p.mrn AS patient_mrn,
    CASE
      WHEN t.status IN ('RESOLVED','CLOSED') THEN 'CLOSED'
      WHEN t.sla_due_at IS NULL THEN 'NO_SLA'
      WHEN NOW() > t.sla_due_at THEN 'BREACHED'
      WHEN NOW() > t.sla_due_at - (t.sla_due_at - t.created_at) * 0.25 THEN 'AT_RISK'
      ELSE 'ON_TRACK'
    END AS sla_status
  FROM "${s}".helpdesk_tickets t
  LEFT JOIN "${s}".helpdesk_categories c ON t.category_id = c.id
  LEFT JOIN "${s}".users a ON t.assigned_user_id = a.id
  LEFT JOIN "${s}".users r ON t.reported_by_user_id = r.id
  LEFT JOIN "${s}".departments d ON t.department_id = d.id
  LEFT JOIN "${s}".patients p ON t.patient_id = p.id
`;

// --- TICKETS: LIST ---
router.get("/tickets", async (req, res, next) => {
  try {
    const { status, priority, category, sourceType, assignedTo, search, channel, from, to, limit } = req.query;
    const conds = [];
    const params = [];
    if (status) { params.push(String(status)); conds.push(`t.status = $${params.length}`); }
    if (priority) { params.push(String(priority)); conds.push(`t.priority = $${params.length}`); }
    if (category) { params.push(String(category)); conds.push(`t.category_id::text = $${params.length}`); }
    if (sourceType) { params.push(String(sourceType)); conds.push(`t.source_type = $${params.length}`); }
    if (assignedTo) { params.push(String(assignedTo)); conds.push(`t.assigned_user_id::text = $${params.length}`); }
    if (channel) { params.push(String(channel)); conds.push(`t.channel = $${params.length}`); }
    if (from) { params.push(String(from)); conds.push(`t.created_at >= $${params.length}::date`); }
    if (to) { params.push(String(to)); conds.push(`t.created_at < ($${params.length}::date + INTERVAL '1 day')`); }
    if (search) {
      params.push(`%${String(search)}%`);
      conds.push(`(t.subject ILIKE $${params.length} OR t.ticket_no ILIKE $${params.length} OR p.name ILIKE $${params.length} OR t.description ILIKE $${params.length})`);
    }

    let query = TICKET_LIST_SELECT(req.schemaName);
    if (conds.length) query += ` WHERE ${conds.join(" AND ")}`;
    query += ` ORDER BY t.created_at DESC LIMIT ${Math.min(parseInt(limit || "200", 10) || 200, 500)}`;

    const rows = await req.prisma.$queryRawUnsafe(query, ...params);
    res.json(rows);
  } catch (error) { next(error); }
});

// --- TICKETS: DETAIL ---
router.get("/tickets/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const rows = await req.prisma.$queryRawUnsafe(
      TICKET_LIST_SELECT(req.schemaName) + ` WHERE t.id::text = $1`, id
    );
    if (!rows[0]) return res.status(404).json({ error: "Ticket not found" });

    const [notes, escalations] = await Promise.all([
      req.prisma.$queryRawUnsafe(
        `SELECT n.*, u.name AS user_name FROM "${req.schemaName}".helpdesk_ticket_notes n
         LEFT JOIN "${req.schemaName}".users u ON n.user_id = u.id
         WHERE n.ticket_id::text = $1 ORDER BY n.created_at ASC`, id),
      req.prisma.$queryRawUnsafe(
        `SELECT e.*, u.name AS assigned_to_name FROM "${req.schemaName}".helpdesk_escalations e
         LEFT JOIN "${req.schemaName}".users u ON e.assigned_to_user_id = u.id
         WHERE e.ticket_id::text = $1 ORDER BY e.triggered_at ASC`, id),
    ]);

    res.json({ ...rows[0], notes, escalations });
  } catch (error) { next(error); }
});

// --- TICKETS: UPDATE (status / reassign / priority / note) ---
router.patch("/tickets/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const { status, assignedToUserId, priority, note, isInternal, departmentId } = req.body;

    const current = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".helpdesk_tickets WHERE id::text = $1`, id);
    if (!current[0]) return res.status(404).json({ error: "Ticket not found" });

    const sets = [];
    const params = [];
    const push = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };

    if (status) {
      push("status", String(status));
      if (["RESOLVED"].includes(String(status))) push("resolved_at", new Date());
      if (["CLOSED"].includes(String(status))) push("closed_at", new Date());
      if (["IN_PROGRESS", "PENDING_CUSTOMER"].includes(String(status)) && !current[0].first_response_at) {
        push("first_response_at", new Date());
      }
    }
    if (assignedToUserId) push("assigned_user_id", su(assignedToUserId, "assignedToUserId"));
    if (priority && priority !== current[0].priority) {
      push("priority", String(priority));
      const sla = await getSlaPolicy(req, priority);
      push("sla_due_at", new Date(Date.now() + parseFloat(sla.resolution_hours || 48) * 3600 * 1000));
      push("first_response_due_at", new Date(Date.now() + parseFloat(sla.response_hours || 8) * 3600 * 1000));
      push("last_escalated_at", new Date());
      push("escalation_level", 0);
    }
    if (departmentId) push("department_id", su(departmentId, "departmentId"));

    let updated;
    if (sets.length) {
      push("updated_at", new Date());
      const result = await req.prisma.$queryRawUnsafe(
        `UPDATE "${req.schemaName}".helpdesk_tickets SET ${sets.join(", ")} WHERE id::text = $${params.length + 1} RETURNING *`,
        ...params, id
      );
      updated = result[0];
    }

    if (note) {
      const userId = await getCurrentUserId(req);
      await req.prisma.$executeRawUnsafe(
        `INSERT INTO "${req.schemaName}".helpdesk_ticket_notes (ticket_id, user_id, body, is_internal) VALUES ($1, $2, $3, $4)`,
        id, userId || null, String(note), isInternal !== false
      );
    }

    const detail = await req.prisma.$queryRawUnsafe(
      TICKET_LIST_SELECT(req.schemaName) + ` WHERE t.id::text = $1`, id);
    res.json(detail[0]);
  } catch (error) { next(error); }
});

// --- TICKETS: ADD NOTE ---
router.post("/tickets/:id/notes", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const { body, isInternal } = req.body;
    if (!body || !String(body).trim()) return res.status(400).json({ error: "Note body is required" });
    const userId = await getCurrentUserId(req);
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".helpdesk_ticket_notes (ticket_id, user_id, body, is_internal)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      id, userId || null, String(body), isInternal !== false
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

// --- TICKETS: ESCALATION TRAIL ---
router.get("/tickets/:id/escalations", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT e.*, u.name AS assigned_to_name FROM "${req.schemaName}".helpdesk_escalations e
       LEFT JOIN "${req.schemaName}".users u ON e.assigned_to_user_id = u.id
       WHERE e.ticket_id::text = $1 ORDER BY e.triggered_at ASC`, id);
    res.json(rows);
  } catch (error) { next(error); }
});

// --- MANUAL ESCALATION ---
router.post("/tickets/:id/escalate", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const { reason } = req.body || {};
    const ticket = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".helpdesk_tickets WHERE id::text = $1`, id);
    if (!ticket[0]) return res.status(404).json({ error: "Ticket not found" });

    const sla = await getSlaPolicy(req, ticket[0].priority);
    const fromLevel = ticket[0].escalation_level || 0;
    const toLevel = Math.min(fromLevel + 1, sla.max_escalation_level || 3);

    const nextAssignee = await req.prisma.$queryRawUnsafe(
      `SELECT u.id, u.email FROM "${req.schemaName}".users u
       WHERE UPPER(u.role) = 'ADMIN' AND u.is_active = TRUE ORDER BY u.is_manager DESC, u.created_at ASC LIMIT 1`);

    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".helpdesk_escalations
        (ticket_id, from_level, to_level, reason, assigned_to_user_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      id, fromLevel, toLevel, String(reason || "Manual escalation"), nextAssignee[0]?.id || null
    );

    await req.prisma.$executeRawUnsafe(
      `UPDATE "${req.schemaName}".helpdesk_tickets
       SET escalation_level = $1, assigned_user_id = COALESCE($2, assigned_user_id),
           status = CASE WHEN status = 'OPEN' THEN 'IN_PROGRESS' ELSE status END,
           last_escalated_at = NOW(), updated_at = NOW()
       WHERE id::text = $3`,
      toLevel, nextAssignee[0]?.id || null, id
    );

    if (nextAssignee[0]?.email) {
      await sendEmail(req, nextAssignee[0].email, `[ESCALATED] ${ticket[0].ticket_no}: ${ticket[0].subject}`,
        `<p>Ticket <strong>${ticket[0].ticket_no}</strong> was escalated to level ${toLevel}.</p><p><strong>Reason:</strong> ${s(reason || "Manual escalation")}</p>`);
    }

    const updated = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".helpdesk_tickets WHERE id::text = $1`, id);
    res.json(updated[0]);
  } catch (error) { next(error); }
});

// --- ESCALATION SWEEP (called by frontend poll / cron) ---
router.get("/escalations/pending", async (req, res, next) => {
  try {
    const candidates = await req.prisma.$queryRawUnsafe(
      `SELECT t.id, t.ticket_no, t.subject, t.priority, t.escalation_level, t.sla_due_at, t.last_escalated_at, t.assigned_user_id
       FROM "${req.schemaName}".helpdesk_tickets t
       WHERE t.status IN ('OPEN','IN_PROGRESS','PENDING_CUSTOMER','ESCALATED')
         AND t.sla_due_at IS NOT NULL
         AND NOW() > t.sla_due_at
         AND t.escalation_level < (SELECT COALESCE(MAX(max_escalation_level),3) FROM "${req.schemaName}".helpdesk_sla_policies WHERE priority = t.priority)
         AND (t.last_escalated_at IS NULL OR NOW() > t.last_escalated_at)
       ORDER BY t.sla_due_at ASC LIMIT 50`
    );

    const escalated = [];
    for (const t of candidates) {
      const sla = await getSlaPolicy(req, t.priority);
      const toLevel = Math.min((t.escalation_level || 0) + 1, sla.max_escalation_level || 3);
      const nextAssignee = await req.prisma.$queryRawUnsafe(
        `SELECT u.id, u.email FROM "${req.schemaName}".users u
         WHERE UPPER(u.role) = 'ADMIN' AND u.is_active = TRUE ORDER BY u.is_manager DESC, u.created_at ASC LIMIT 1`);
      try {
        await req.prisma.$executeRawUnsafe(
          `INSERT INTO "${req.schemaName}".helpdesk_escalations (ticket_id, from_level, to_level, reason, assigned_to_user_id)
           VALUES ($1, $2, $3, $4, $5)`,
          t.id, t.escalation_level || 0, toLevel, "SLA breach auto-escalation", nextAssignee[0]?.id || null
        );
        await req.prisma.$executeRawUnsafe(
          `UPDATE "${req.schemaName}".helpdesk_tickets
           SET escalation_level = $1, assigned_user_id = COALESCE($2, assigned_user_id),
               status = 'ESCALATED', last_escalated_at = NOW(), updated_at = NOW()
           WHERE id::text = $3`,
          toLevel, nextAssignee[0]?.id || null, t.id
        );
        if (nextAssignee[0]?.email) {
          await sendEmail(req, nextAssignee[0].email, `[SLA BREACH] ${t.ticket_no}: ${t.subject}`,
            `<p>Ticket <strong>${t.ticket_no}</strong> breached its SLA and was auto-escalated to level ${toLevel}.</p>`);
        }
        escalated.push({ id: t.id, ticket_no: t.ticket_no, to_level: toLevel });
      } catch (e) { console.error("[HELPDESK] sweep escalation failed:", e.message); }
    }

    res.json({ scanned: candidates.length, escalated });
  } catch (error) { next(error); }
});

// --- EQUIPMENT REGISTRY ---
const EQUIP_FIELDS = ["asset_tag", "name", "category", "status", "vendor_id", "purchase_date", "warranty_till", "notes"];
router.get("/equipment", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT e.*, d.name AS department_name FROM "${req.schemaName}".helpdesk_equipment e
       LEFT JOIN "${req.schemaName}".departments d ON e.department_id = d.id
       ORDER BY e.created_at DESC LIMIT 500`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/equipment", async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Equipment name is required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".helpdesk_equipment
        (asset_tag, name, category, department_id, status, vendor_id, purchase_date, warranty_till, last_maintenance_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      req.body.asset_tag || null, String(name), req.body.category || null,
      req.body.department_id || null, req.body.status || "OPERATIONAL",
      req.body.vendor_id || null, req.body.purchase_date || null, req.body.warranty_till || null,
      req.body.last_maintenance_at || null, req.body.notes || null
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.put("/equipment/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const sets = [];
    const params = [];
    for (const f of EQUIP_FIELDS) {
      if (req.body[f] !== undefined) {
        params.push(req.body[f]);
        sets.push(`${f} = $${params.length}`);
      }
    }
    if (req.body.department_id !== undefined) {
      params.push(req.body.department_id);
      sets.push(`department_id = $${params.length}`);
    }
    if (!sets.length) return res.status(400).json({ error: "Nothing to update" });
    params.push(id);
    sets.push("updated_at = NOW()");
    const result = await req.prisma.$executeRawUnsafe(
      `UPDATE "${req.schemaName}".helpdesk_equipment SET ${sets.join(", ")} WHERE id::text = $${params.length} RETURNING *`,
      ...params
    );
    if (!result[0]) return res.status(404).json({ error: "Equipment not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

router.delete("/equipment/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `DELETE FROM "${req.schemaName}".helpdesk_equipment WHERE id::text = $1 RETURNING id`, id);
    if (!result[0]) return res.status(404).json({ error: "Equipment not found" });
    res.json({ ok: true, id: result[0].id });
  } catch (error) { next(error); }
});

// --- ANALYTICS ---
router.get("/analytics", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const [byStatus, byPriority, byCategory, trend, kpi] = await Promise.all([
      req.prisma.$queryRawUnsafe(`SELECT status, COUNT(*)::int AS count FROM "${s}".helpdesk_tickets GROUP BY status ORDER BY count DESC`),
      req.prisma.$queryRawUnsafe(`SELECT priority, COUNT(*)::int AS count FROM "${s}".helpdesk_tickets GROUP BY priority ORDER BY count DESC`),
      req.prisma.$queryRawUnsafe(`SELECT c.name AS category, COUNT(*)::int AS count FROM "${s}".helpdesk_tickets t LEFT JOIN "${s}".helpdesk_categories c ON t.category_id = c.id GROUP BY c.name ORDER BY count DESC LIMIT 10`),
      req.prisma.$queryRawUnsafe(`SELECT DATE(created_at) AS day, COUNT(*)::int AS count FROM "${s}".helpdesk_tickets WHERE created_at >= NOW() - INTERVAL '30 days' GROUP BY DATE(created_at) ORDER BY day ASC`),
      req.prisma.$queryRawUnsafe(`
        SELECT
          COUNT(*)::int AS total_tickets,
          COUNT(*) FILTER (WHERE status = 'OPEN')::int AS open_tickets,
          COUNT(*) FILTER (WHERE status IN ('OPEN','IN_PROGRESS','PENDING_CUSTOMER','ESCALATED') AND NOW() > sla_due_at)::int AS breached,
          ROUND(AVG(EXTRACT(EPOCH FROM (first_response_at - created_at))/60))::int AS avg_first_response_min,
          ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600))::int AS avg_resolution_hours,
          COUNT(*) FILTER (WHERE status IN ('RESOLVED','CLOSED'))::int AS resolved
        FROM "${s}".helpdesk_tickets`),
    ]);
    const deptBacklog = await req.prisma.$queryRawUnsafe(
      `SELECT d.name AS department, COUNT(*)::int AS backlog
       FROM "${s}".helpdesk_tickets t LEFT JOIN "${s}".departments d ON t.department_id = d.id
       WHERE t.status IN ('OPEN','IN_PROGRESS','PENDING_CUSTOMER','ESCALATED')
       GROUP BY d.name ORDER BY backlog DESC LIMIT 10`);
    res.json({ byStatus, byPriority, byCategory, trend, kpi: kpi[0], deptBacklog });
  } catch (error) { next(error); }
});

module.exports = router;
module.exports.ensureHelpdeskInfrastructure = ensureHelpdeskInfrastructure;
