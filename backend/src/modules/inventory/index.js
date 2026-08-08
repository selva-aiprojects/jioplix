const express = require("express");
const { su } = require("../../middleware/sanitize");
const router = express.Router();

const inventoryInfrastructureSynced = new Set();
const inventoryInfrastructureLocks = new Map();

async function ensureInventoryInfrastructure(req) {
  const schema = req.schemaName;
  if (!schema || inventoryInfrastructureSynced.has(schema)) return;
  if (inventoryInfrastructureLocks.has(schema)) return inventoryInfrastructureLocks.get(schema);
  const db = req.prisma;
  const q = (sql) => db.$executeRawUnsafe(sql);
  const run = (async () => {
    try {
      await runInventoryDdl(schema, q);
      inventoryInfrastructureSynced.add(schema);
    } catch (e) {
      console.error(`[INVENTORY] DDL failed for ${schema}:`, e.message);
      throw e;
    } finally {
      inventoryInfrastructureLocks.delete(schema);
    }
  })();
  inventoryInfrastructureLocks.set(schema, run);
  return run;
}

async function runInventoryDdl(schema, q) {
  try {
    await q(`CREATE TABLE IF NOT EXISTS "${schema}".indents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      indent_no VARCHAR(50),
      requesting_dept VARCHAR(100),
      requested_by VARCHAR(255),
      status VARCHAR(20) DEFAULT 'PENDING',
      requested_at TIMESTAMP DEFAULT NOW(),
      issued_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".indent_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      indent_id UUID REFERENCES "${schema}".indents(id) ON DELETE CASCADE,
      medicine_name VARCHAR(255),
      requested_qty NUMERIC(12,2),
      issued_qty NUMERIC(12,2) DEFAULT 0,
      batch_number VARCHAR(100),
      remarks TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".pharmacy_issues (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      issue_no VARCHAR(50),
      indent_id UUID,
      dept VARCHAR(100),
      issued_by VARCHAR(255),
      issued_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".issue_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      issue_id UUID REFERENCES "${schema}".pharmacy_issues(id) ON DELETE CASCADE,
      medicine_name VARCHAR(255),
      qty NUMERIC(12,2),
      batch_number VARCHAR(100),
      cost_price NUMERIC(12,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".narcotic_register (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      patient_name VARCHAR(255),
      medicine_name VARCHAR(255),
      batch_number VARCHAR(100),
      qty NUMERIC(12,2),
      administering_user VARCHAR(255),
      witness_user VARCHAR(255),
      balance_after NUMERIC(12,2),
      purpose TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".reorder_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      medicine_name VARCHAR(255),
      current_stock NUMERIC(12,2),
      reorder_point NUMERIC(12,2),
      suggested_qty NUMERIC(12,2),
      source VARCHAR(20) DEFAULT 'MANUAL',
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // Defensive: medicines table should exist (seeded by hospital/nexus) but may be
    // absent in some shards, so the reorder columns are added defensively.
    try {
      await q(`ALTER TABLE "${schema}".medicines ADD COLUMN IF NOT EXISTS reorder_level NUMERIC(12,2) DEFAULT 0`);
      await q(`ALTER TABLE "${schema}".medicines ADD COLUMN IF NOT EXISTS reorder_qty NUMERIC(12,2) DEFAULT 0`);
    } catch (e) {
      console.warn(`[INVENTORY] medicines reorder columns not added for ${schema}:`, e.message);
    }

    await q(`CREATE INDEX IF NOT EXISTS idx_indents_status ON "${schema}".indents (status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_indent_items_indent ON "${schema}".indent_items (indent_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_issue_items_issue ON "${schema}".issue_items (issue_id)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_narcotic_created ON "${schema}".narcotic_register (created_at)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_reorder_created ON "${schema}".reorder_logs (created_at)`);

    try {
      await q(`INSERT INTO "${schema}".rbac_permissions (key, description) VALUES
        ('INVENTORY_VIEW', 'View pharmacy inventory, indents and issues'),
        ('INVENTORY_MANAGE', 'Create and manage inventory, indents and narcotics')
        ON CONFLICT (key) DO NOTHING`);
      await q(`INSERT INTO "${schema}".rbac_role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM "${schema}".rbac_roles r, "${schema}".rbac_permissions p
        WHERE r.name = 'ADMIN' AND p.key IN ('INVENTORY_VIEW','INVENTORY_MANAGE')
        ON CONFLICT DO NOTHING`);
      await q(`INSERT INTO "${schema}".rbac_role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM "${schema}".rbac_roles r, "${schema}".rbac_permissions p
        WHERE r.name = 'NURSE' AND p.key = 'INVENTORY_VIEW'
        ON CONFLICT DO NOTHING`);
      await q(`INSERT INTO "${schema}".rbac_role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM "${schema}".rbac_roles r, "${schema}".rbac_permissions p
        WHERE r.name = 'PHARMACIST' AND p.key IN ('INVENTORY_VIEW','INVENTORY_MANAGE')
        ON CONFLICT DO NOTHING`);
    } catch (e) { console.error(`[INVENTORY] RBAC seed failed for ${schema}:`, e.message); }
  } catch (e) {
    console.error(`[INVENTORY] DDL failed for ${schema}:`, e.message);
    throw e;
  }
}

router.use(async (req, res, next) => {
  try { await ensureInventoryInfrastructure(req); } catch (e) { console.error("[INVENTORY] ensure failed:", e.message); }
  next();
});

router.get("/ensure", async (req, res) => {
  await ensureInventoryInfrastructure(req);
  const tables = await req.prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name IN ('indents','indent_items','pharmacy_issues','issue_items','narcotic_register','reorder_logs') ORDER BY table_name`,
    req.schemaName
  );
  res.json({ ok: true, schema: req.schemaName, tables: tables.map((t) => t.table_name) });
});

async function hasColumns(req, table, columns) {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = ANY($3)`,
      req.schemaName, table, columns
    );
    return new Set(rows.map((r) => r.column_name));
  } catch { return new Set(); }
}

function nextNumber(prefix, year, count) {
  return `${prefix}-${year}-${String(count + 1).padStart(4, "0")}`;
}

// ---- INDENTS ----
router.get("/indents", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT i.*,
              (SELECT COUNT(*)::int FROM "${req.schemaName}".indent_items ii WHERE ii.indent_id = i.id) AS item_count
       FROM "${req.schemaName}".indents i
       ORDER BY i.created_at DESC LIMIT 500`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/indents", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const { requesting_dept, requested_by, items } = req.body;
    if (!requesting_dept || !requested_by || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "requesting_dept, requested_by and items are required" });
    }
    const year = new Date().getFullYear();
    const seq = await req.prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS cnt FROM "${s}".indents WHERE indent_no LIKE $1`, `IND-${year}-%`);
    const indentNo = nextNumber("IND", year, seq[0]?.cnt || 0);

    const indent = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${s}".indents (indent_no, requesting_dept, requested_by, status, requested_at)
       VALUES ($1, $2, $3, 'PENDING', NOW()) RETURNING *`,
      indentNo, String(requesting_dept), String(requested_by)
    );

    const createdItems = [];
    for (const it of items) {
      if (!it.medicine_name) continue;
      const ins = await req.prisma.$queryRawUnsafe(
        `INSERT INTO "${s}".indent_items (indent_id, medicine_name, requested_qty, remarks)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        indent[0].id, String(it.medicine_name), parseFloat(it.requested_qty || 0), it.remarks || null
      );
      createdItems.push(ins[0]);
    }

    res.status(201).json({ ...indent[0], items: createdItems });
  } catch (error) { next(error); }
});

router.get("/indents/:id", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const id = su(req.params.id);
    const indent = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".indents WHERE id::text = $1`, id);
    if (!indent[0]) return res.status(404).json({ error: "Indent not found" });
    const items = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".indent_items WHERE indent_id::text = $1 ORDER BY created_at ASC`, id);
    res.json({ ...indent[0], items });
  } catch (error) { next(error); }
});

router.post("/indents/:id/approve", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${s}".indents SET status = 'APPROVED' WHERE id::text = $1 RETURNING *`, id);
    if (!result[0]) return res.status(404).json({ error: "Indent not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

router.post("/indents/:id/reject", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${s}".indents SET status = 'REJECTED' WHERE id::text = $1 RETURNING *`, id);
    if (!result[0]) return res.status(404).json({ error: "Indent not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

router.post("/indents/:id/issue", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const id = su(req.params.id);
    const { issued_by, items } = req.body;
    if (!issued_by || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "issued_by and items are required" });
    }

    const indent = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".indents WHERE id::text = $1`, id);
    if (!indent[0]) return res.status(404).json({ error: "Indent not found" });

    const year = new Date().getFullYear();
    const seq = await req.prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS cnt FROM "${s}".pharmacy_issues WHERE issue_no LIKE $1`, `ISS-${year}-%`);
    const issueNo = nextNumber("ISS", year, seq[0]?.cnt || 0);

    const issue = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${s}".pharmacy_issues (issue_no, indent_id, dept, issued_by, issued_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      issueNo, id, indent[0].requesting_dept || null, String(issued_by)
    );

    const issued = [];
    for (const it of items) {
      const itemId = su(it.indent_item_id);
      const qty = parseFloat(it.qty);
      if (isNaN(qty) || qty <= 0) continue;
      const ii = await req.prisma.$queryRawUnsafe(
        `SELECT * FROM "${s}".indent_items WHERE id::text = $1 AND indent_id::text = $2`, itemId, id);
      if (!ii[0]) continue;

      const ins = await req.prisma.$queryRawUnsafe(
        `INSERT INTO "${s}".issue_items (issue_id, medicine_name, qty, batch_number, cost_price)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        issue[0].id, ii[0].medicine_name, qty,
        it.batch_number || ii[0].batch_number || null,
        parseFloat(it.cost_price || 0)
      );
      issued.push(ins[0]);

      await req.prisma.$executeRawUnsafe(
        `UPDATE "${s}".indent_items
         SET issued_qty = issued_qty + $1, batch_number = COALESCE($2, batch_number)
         WHERE id = $3`,
        qty, it.batch_number || null, ii[0].id
      );

      try {
        await req.prisma.$executeRawUnsafe(
          `UPDATE "${s}".medicines
           SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - $1, 0)
           WHERE LOWER(name) = LOWER($2)`,
          qty, ii[0].medicine_name
        );
      } catch (e) {
        console.warn(`[INVENTORY] stock decrement skipped for ${ii[0].medicine_name}:`, e.message);
      }
    }

    const remaining = await req.prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS cnt FROM "${s}".indent_items
       WHERE indent_id = $1 AND issued_qty < requested_qty`, id);
    const status = remaining[0]?.cnt > 0 ? "PARTIAL" : "ISSUED";
    await req.prisma.$executeRawUnsafe(
      `UPDATE "${s}".indents SET status = $1, issued_at = NOW() WHERE id = $2`, status, id);

    res.status(201).json({ ...issue[0], indent_status: status, items: issued });
  } catch (error) { next(error); }
});

// ---- ISSUES ----
router.get("/issues", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT i.*,
              (SELECT COUNT(*)::int FROM "${req.schemaName}".issue_items ii WHERE ii.issue_id = i.id) AS item_count
       FROM "${req.schemaName}".pharmacy_issues i
       ORDER BY i.issued_at DESC LIMIT 500`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get("/issues/:id", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const id = su(req.params.id);
    const issue = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".pharmacy_issues WHERE id::text = $1`, id);
    if (!issue[0]) return res.status(404).json({ error: "Issue not found" });
    const items = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".issue_items WHERE issue_id::text = $1 ORDER BY created_at ASC`, id);
    res.json({ ...issue[0], items });
  } catch (error) { next(error); }
});

// ---- NARCOTIC REGISTER (append-only) ----
router.get("/narcotics", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".narcotic_register ORDER BY created_at DESC LIMIT 500`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get("/narcotics/register", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const { date } = req.query;
    if (date) {
      const rows = await req.prisma.$queryRawUnsafe(
        `SELECT * FROM "${s}".narcotic_register WHERE created_at::date = $1::date ORDER BY created_at DESC`,
        String(date));
      return res.json(rows);
    }
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".narcotic_register ORDER BY created_at DESC LIMIT 500`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/narcotics", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const { patient_name, medicine_name, batch_number, qty, administering_user, witness_user, purpose } = req.body;
    if (!administering_user || !witness_user) {
      return res.status(400).json({ error: "administering_user and witness_user are both required" });
    }
    const amount = parseFloat(qty || 0);
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${s}".narcotic_register
        (patient_name, medicine_name, batch_number, qty, administering_user, witness_user, balance_after, purpose)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      patient_name || null, medicine_name || null, batch_number || null,
      amount, String(administering_user), String(witness_user), amount, purpose || null
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

// ---- REORDER CONFIG ----
router.get("/reorder/config", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const cols = await hasColumns(req, "medicines", ["reorder_level", "reorder_qty", "stock_quantity"]);
    if (!cols.has("stock_quantity")) return res.json([]);
    let select = "id, name, stock_quantity";
    if (cols.has("reorder_level")) select += ", reorder_level";
    if (cols.has("reorder_qty")) select += ", reorder_qty";
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT ${select} FROM "${s}".medicines ORDER BY name ASC`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.put("/reorder/config", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const { medicine_id, reorder_level, reorder_qty } = req.body;
    if (!medicine_id) return res.status(400).json({ error: "medicine_id is required" });
    try {
      const result = await req.prisma.$queryRawUnsafe(
        `UPDATE "${s}".medicines SET reorder_level = $1, reorder_qty = $2
         WHERE id::text = $3 RETURNING *`,
        parseFloat(reorder_level || 0), parseFloat(reorder_qty || 0), su(medicine_id));
      if (!result[0]) return res.status(404).json({ error: "Medicine not found" });
      res.json(result[0]);
    } catch (e) {
      return res.status(400).json({ error: `Could not update reorder config: ${e.message}` });
    }
  } catch (error) { next(error); }
});

router.post("/reorder/run", async (req, res, next) => {
  try {
    const s = req.schemaName;
    let meds = [];
    try {
      const cols = await hasColumns(req, "medicines", ["reorder_level", "reorder_qty", "stock_quantity"]);
      if (cols.has("reorder_level") && cols.has("reorder_qty") && cols.has("stock_quantity")) {
        meds = await req.prisma.$queryRawUnsafe(
          `SELECT id, name, stock_quantity, reorder_level, reorder_qty
           FROM "${s}".medicines WHERE stock_quantity <= reorder_level`);
      } else if (cols.has("stock_quantity")) {
        meds = await req.prisma.$queryRawUnsafe(
          `SELECT id, name, stock_quantity FROM "${s}".medicines WHERE stock_quantity <= 10`);
      }
    } catch (e) {
      console.warn(`[INVENTORY] reorder sweep failed for ${s}:`, e.message);
      meds = [];
    }

    const logs = [];
    for (const m of meds) {
      const stock = parseFloat(m.stock_quantity || 0);
      const reorderPoint = parseFloat(m.reorder_level || 0);
      const suggested = Math.max(parseFloat(m.reorder_qty || 0) - stock, 0);
      const log = await req.prisma.$queryRawUnsafe(
        `INSERT INTO "${s}".reorder_logs (medicine_name, current_stock, reorder_point, suggested_qty, source)
         VALUES ($1, $2, $3, $4, 'CONSUMPTION') RETURNING *`,
        m.name, stock, reorderPoint, suggested
      );
      logs.push(log[0]);
    }
    res.json({ created: logs.length, logs });
  } catch (error) { next(error); }
});

// ---- ANALYTICS (defensive against heterogeneous shards) ----
router.get("/analytics/expiry", async (req, res, next) => {
  try {
    const s = req.schemaName;
    let batches = [];
    try {
      const cols = await hasColumns(req, "pharmacy_batches", ["batch_number", "medicine_name", "medicine_id", "expiry_date", "qty", "is_blocked"]);
      if (cols.size && cols.has("expiry_date")) {
        let select = "batch_number, expiry_date";
        if (cols.has("medicine_name")) select += ", medicine_name";
        if (cols.has("medicine_id")) select += ", medicine_id";
        if (cols.has("qty")) select += ", qty";
        if (cols.has("is_blocked")) select += ", is_blocked";
        batches = await req.prisma.$queryRawUnsafe(
          `SELECT ${select} FROM "${s}".pharmacy_batches WHERE expiry_date IS NOT NULL`);
      }
    } catch (e) {
      console.warn(`[INVENTORY] expiry analytics failed for ${s}:`, e.message);
    }

    const now = Date.now();
    const expiring30 = [], expiring60 = [], expiring90 = [];
    for (const b of batches) {
      const days = Math.ceil((new Date(b.expiry_date).getTime() - now) / 86400000);
      if (days <= 30) expiring30.push(b);
      else if (days <= 60) expiring60.push(b);
      else if (days <= 90) expiring90.push(b);
    }
    res.json({ expiring30, expiring60, expiring90 });
  } catch (error) { next(error); }
});

router.get("/analytics/deadstock", async (req, res, next) => {
  try {
    const s = req.schemaName;
    let medicines = [];
    try {
      const cols = await hasColumns(req, "medicines", ["stock_quantity"]);
      if (cols.has("stock_quantity")) {
        medicines = await req.prisma.$queryRawUnsafe(
          `SELECT id, name, stock_quantity, unit_price
           FROM "${s}".medicines WHERE stock_quantity > 0 ORDER BY stock_quantity DESC LIMIT 100`);
      }
    } catch (e) {
      console.warn(`[INVENTORY] deadstock analytics failed for ${s}:`, e.message);
    }
    res.json({
      note: "Dead stock = stock > 0 with no recent dispense (simplified: medicines holding stock)",
      medicines,
    });
  } catch (error) { next(error); }
});

router.get("/analytics/consumption", async (req, res, next) => {
  try {
    const s = req.schemaName;
    let rows = [];
    try {
      const cols = await hasColumns(req, "pharmacy_dispense_items", ["medicine_name", "qty", "created_at"]);
      if (cols.has("medicine_name") && cols.has("qty")) {
        rows = await req.prisma.$queryRawUnsafe(
          `SELECT medicine_name, COALESCE(SUM(qty), 0)::float AS total_qty, COUNT(*)::int AS dispense_count
           FROM "${s}".pharmacy_dispense_items
           WHERE created_at >= NOW() - INTERVAL '30 days'
           GROUP BY medicine_name ORDER BY total_qty DESC LIMIT 100`);
      }
    } catch (e) {
      console.warn(`[INVENTORY] consumption analytics failed for ${s}:`, e.message);
    }
    res.json(rows);
  } catch (error) { next(error); }
});

// ---- DASHBOARD ----
router.get("/dashboard", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const safeCount = async (fn) => {
      try { return await fn(); } catch (e) { return 0; }
    };
    const num = (r) => (Array.isArray(r) && r[0] ? parseInt(r[0].c, 10) || 0 : 0);

    const [pendingIndents, issues, narcotics, lowStock, expiringSoon] = await Promise.all([
      safeCount(() => req.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM "${s}".indents WHERE status = 'PENDING'`)),
      safeCount(() => req.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM "${s}".pharmacy_issues`)),
      safeCount(() => req.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM "${s}".narcotic_register`)),
      safeCount(async () => {
        const cols = await hasColumns(req, "medicines", ["reorder_level", "stock_quantity"]);
        if (cols.has("reorder_level")) {
          return req.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM "${s}".medicines WHERE stock_quantity <= reorder_level`);
        }
        return req.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM "${s}".medicines WHERE stock_quantity <= 10`);
      }),
      safeCount(async () => {
        const cols = await hasColumns(req, "pharmacy_batches", ["expiry_date"]);
        if (!cols.has("expiry_date")) return 0;
        return req.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM "${s}".pharmacy_batches WHERE expiry_date IS NOT NULL AND expiry_date <= NOW()::date + 90`);
      }),
    ]);

    res.json({
      pendingIndents: num(pendingIndents),
      issues: num(issues),
      narcotics: num(narcotics),
      lowStock: num(lowStock),
      expiringSoon: num(expiringSoon),
    });
  } catch (error) { next(error); }
});

module.exports = router;
module.exports.ensureInventoryInfrastructure = ensureInventoryInfrastructure;
