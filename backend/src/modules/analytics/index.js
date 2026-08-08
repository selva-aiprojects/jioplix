const express = require("express");
const { su } = require("../../middleware/sanitize");
const router = express.Router();

const analyticsInfrastructureSynced = new Set();
const analyticsInfrastructureLocks = new Map();

async function ensureAnalyticsInfrastructure(req) {
  const schema = req.schemaName;
  if (!schema || analyticsInfrastructureSynced.has(schema)) return;
  if (analyticsInfrastructureLocks.has(schema)) return analyticsInfrastructureLocks.get(schema);
  const db = req.prisma;
  const q = (sql) => db.$executeRawUnsafe(sql);
  const run = (async () => {
    try {
      await runAnalyticsDdl(schema, q);
      analyticsInfrastructureSynced.add(schema);
    } catch (e) {
      console.error(`[ANALYTICS] DDL failed for ${schema}:`, e.message);
      throw e;
    } finally {
      analyticsInfrastructureLocks.delete(schema);
    }
  })();
  analyticsInfrastructureLocks.set(schema, run);
  return run;
}

async function runAnalyticsDdl(schema, q) {
  try {
    await q(`CREATE TABLE IF NOT EXISTS "${schema}".targets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      period VARCHAR(20),
      metric VARCHAR(50),
      target_value NUMERIC(14,2),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await q(`ALTER TABLE "${schema}".targets ADD COLUMN IF NOT EXISTS period VARCHAR(20)`);
    await q(`ALTER TABLE "${schema}".targets ADD COLUMN IF NOT EXISTS metric VARCHAR(50)`);
    await q(`ALTER TABLE "${schema}".targets ADD COLUMN IF NOT EXISTS target_value NUMERIC(14,2)`);
    await q(`ALTER TABLE "${schema}".targets ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`);

    await q(`CREATE TABLE IF NOT EXISTS "${schema}".operational_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      alert_type VARCHAR(50),
      severity VARCHAR(20) DEFAULT 'INFO',
      message TEXT,
      ref_data JSONB DEFAULT '{}'::jsonb,
      status VARCHAR(20) DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT NOW(),
      acknowledged_at TIMESTAMP,
      resolved_at TIMESTAMP
    )`);
    await q(`ALTER TABLE "${schema}".operational_alerts ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'INFO'`);
    await q(`ALTER TABLE "${schema}".operational_alerts ADD COLUMN IF NOT EXISTS ref_data JSONB DEFAULT '{}'::jsonb`);
    await q(`ALTER TABLE "${schema}".operational_alerts ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP`);
    await q(`ALTER TABLE "${schema}".operational_alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP`);

    await q(`CREATE INDEX IF NOT EXISTS idx_alerts_status ON "${schema}".operational_alerts (status)`);
    await q(`CREATE INDEX IF NOT EXISTS idx_alerts_type ON "${schema}".operational_alerts (alert_type)`);

    try {
      await q(`INSERT INTO "${schema}".rbac_permissions (key, description) VALUES
        ('ANALYTICS_VIEW', 'View analytics dashboards and reports'),
        ('ANALYTICS_MANAGE', 'Manage analytics targets and alerts')
        ON CONFLICT (key) DO NOTHING`);
      await q(`INSERT INTO "${schema}".rbac_role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM "${schema}".rbac_roles r, "${schema}".rbac_permissions p
        WHERE r.name = 'ADMIN' AND p.key IN ('ANALYTICS_VIEW','ANALYTICS_MANAGE')
        ON CONFLICT DO NOTHING`);
      await q(`INSERT INTO "${schema}".rbac_role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM "${schema}".rbac_roles r, "${schema}".rbac_permissions p
        WHERE r.name = 'DOCTOR' AND p.key = 'ANALYTICS_VIEW'
        ON CONFLICT DO NOTHING`);
      await q(`INSERT INTO "${schema}".rbac_role_permissions (role_id, permission_id)
        SELECT r.id, p.id FROM "${schema}".rbac_roles r, "${schema}".rbac_permissions p
        WHERE r.name = 'NURSE' AND p.key = 'ANALYTICS_VIEW'
        ON CONFLICT DO NOTHING`);
    } catch (e) { console.error(`[ANALYTICS] RBAC seed failed for ${schema}:`, e.message); }
  } catch (e) {
    console.error(`[ANALYTICS] DDL failed for ${schema}:`, e.message);
    throw e;
  }
}

router.use(async (req, res, next) => {
  try { await ensureAnalyticsInfrastructure(req); } catch (e) { console.error("[ANALYTICS] ensure failed:", e.message); }
  next();
});

router.get("/ensure", async (req, res) => {
  await ensureAnalyticsInfrastructure(req);
  const tables = await req.prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name IN ('targets','operational_alerts') ORDER BY table_name`,
    req.schemaName
  );
  res.json({ ok: true, schema: req.schemaName, tables: tables.map((t) => t.table_name) });
});

// ---- DEFENSIVE HELPERS (heterogeneous shards) ----
async function tableColumns(req, table) {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
      req.schemaName, table
    );
    return (rows || []).map((r) => r.column_name);
  } catch { return []; }
}

const INVOICE_AMOUNT_COLS = ["billed_amount", "total", "subtotal"];

// ---- LIVE OPD LOAD ----
router.get("/opd-load", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const result = { totalActive: 0, byStatus: [], byDepartment: [] };
    const encCols = await tableColumns(req, "encounters");
    if (encCols.includes("status")) {
      try {
        const active = await req.prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int AS count FROM "${s}".encounters WHERE LOWER(status) = 'active' AND created_at >= NOW()::date`);
        result.totalActive = active[0]?.count || 0;
      } catch {}
      try {
        result.byStatus = await req.prisma.$queryRawUnsafe(
          `SELECT status, COUNT(*)::int AS count FROM "${s}".encounters GROUP BY status ORDER BY count DESC`);
      } catch {}
    } else if (encCols.includes("type")) {
      try {
        result.byStatus = await req.prisma.$queryRawUnsafe(
          `SELECT type AS status, COUNT(*)::int AS count FROM "${s}".encounters GROUP BY type ORDER BY count DESC`);
      } catch {}
    }
    const userCols = await tableColumns(req, "users");
    if (userCols.includes("department")) {
      try {
        result.byDepartment = await req.prisma.$queryRawUnsafe(`
          SELECT COALESCE(u.department, 'Unassigned') AS department, COUNT(*)::int AS count
          FROM "${s}".encounters e
          LEFT JOIN "${s}".users u ON e.doctor_id = u.id
          GROUP BY u.department ORDER BY count DESC`);
      } catch {}
    }
    res.json(result);
  } catch (error) { next(error); }
});

// ---- BED OCCUPANCY ----
router.get("/bed-occupancy", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const wardCols = await tableColumns(req, "wards");
    const bedCols = await tableColumns(req, "beds");
    if (!wardCols.includes("capacity") || !bedCols.includes("ward_id")) return res.json([]);
    try {
      const rows = await req.prisma.$queryRawUnsafe(`
        SELECT w.id AS ward_id,
               COALESCE(w.name, w.id::text) AS ward_name,
               w.capacity AS capacity,
               COALESCE(b.occupied, 0) AS occupied,
               GREATEST(w.capacity - COALESCE(b.occupied, 0), 0) AS free,
               CASE WHEN w.capacity > 0 THEN ROUND(COALESCE(b.occupied, 0) * 100.0 / w.capacity, 1) ELSE 0 END AS occupancy_pct
        FROM "${s}".wards w
        LEFT JOIN (
          SELECT ward_id, COUNT(*)::int AS occupied
          FROM "${s}".beds
          WHERE status IS NOT NULL AND LOWER(status) <> 'vacant'
          GROUP BY ward_id
        ) b ON b.ward_id = w.id
        ORDER BY w.name ASC`);
      res.json(rows);
    } catch { res.json([]); }
  } catch (error) { next(error); }
});

// ---- PHARMACY RISK ----
router.get("/pharmacy-risk", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const out = { lowStock: [], expiringSoon: [], blocked: [] };
    const medCols = await tableColumns(req, "medicines");
    const batchCols = await tableColumns(req, "pharmacy_batches");

    if (medCols.includes("stock_quantity")) {
      try {
        out.lowStock = await req.prisma.$queryRawUnsafe(`
          SELECT id, name, stock_quantity, unit_price
          FROM "${s}".medicines
          WHERE COALESCE(stock_quantity, 0) <= 5
          ORDER BY stock_quantity ASC`);
      } catch {}
    }

    if (batchCols.includes("expiry_date") && batchCols.includes("quantity")) {
      try {
        out.expiringSoon = await req.prisma.$queryRawUnsafe(`
          SELECT b.id, b.batch_number, b.expiry_date, b.quantity,
                 COALESCE(db.brand_name, b.batch_number) AS medicine_name
          FROM "${s}".pharmacy_batches b
          LEFT JOIN "${s}".drug_brands db ON b.brand_id = db.id
          WHERE b.expiry_date IS NOT NULL
            AND b.expiry_date >= CURRENT_DATE
            AND b.expiry_date <= (CURRENT_DATE + INTERVAL '30 days')
            AND COALESCE(b.quantity, 0) > 0
          ORDER BY b.expiry_date ASC`);
      } catch {
        try {
          out.expiringSoon = await req.prisma.$queryRawUnsafe(`
            SELECT id, batch_number, expiry_date, quantity, batch_number AS medicine_name
            FROM "${s}".pharmacy_batches
            WHERE expiry_date IS NOT NULL
              AND expiry_date >= CURRENT_DATE
              AND expiry_date <= (CURRENT_DATE + INTERVAL '30 days')
              AND COALESCE(quantity, 0) > 0
            ORDER BY expiry_date ASC`);
        } catch {}
      }
      try {
        out.blocked = await req.prisma.$queryRawUnsafe(`
          SELECT id, batch_number, expiry_date, quantity
          FROM "${s}".pharmacy_batches
          WHERE expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE AND COALESCE(quantity, 0) > 0
          ORDER BY expiry_date ASC`);
      } catch {}
    }
    res.json(out);
  } catch (error) { next(error); }
});

// ---- REVENUE ----
router.get("/revenue", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const invCols = await tableColumns(req, "invoices");
    const amountCol = INVOICE_AMOUNT_COLS.find((c) => invCols.includes(c));
    if (!amountCol) return res.json({ total_billed: 0, collected: 0, pending: 0, by_status: [] });
    try {
      const summary = await req.prisma.$queryRawUnsafe(`
        SELECT COALESCE(SUM(${amountCol}), 0)::float AS total_billed,
               COALESCE(SUM(CASE WHEN LOWER(status) IN ('paid','collected','settled','completed') THEN ${amountCol} ELSE 0 END), 0)::float AS collected,
               COALESCE(SUM(CASE WHEN LOWER(status) IN ('unpaid','pending','due','open') THEN ${amountCol} ELSE 0 END), 0)::float AS pending
        FROM "${s}".invoices
        WHERE created_at >= date_trunc('month', NOW()) AND created_at < date_trunc('month', NOW()) + INTERVAL '1 month'`);
      const by_status = await req.prisma.$queryRawUnsafe(`
        SELECT status, COUNT(*)::int AS count, COALESCE(SUM(${amountCol}), 0)::float AS amount
        FROM "${s}".invoices
        WHERE created_at >= date_trunc('month', NOW()) AND created_at < date_trunc('month', NOW()) + INTERVAL '1 month'
        GROUP BY status ORDER BY amount DESC`);
      res.json({
        total_billed: summary[0]?.total_billed || 0,
        collected: summary[0]?.collected || 0,
        pending: summary[0]?.pending || 0,
        by_status,
      });
    } catch {
      try {
        const summary = await req.prisma.$queryRawUnsafe(`
          SELECT COALESCE(SUM(${amountCol}), 0)::float AS total_billed
          FROM "${s}".invoices
          WHERE created_at >= date_trunc('month', NOW()) AND created_at < date_trunc('month', NOW()) + INTERVAL '1 month'`);
        res.json({ total_billed: summary[0]?.total_billed || 0, collected: 0, pending: 0, by_status: [] });
      } catch { res.json({ total_billed: 0, collected: 0, pending: 0, by_status: [] }); }
    }
  } catch (error) { next(error); }
});

// ---- DOCTOR PERFORMANCE ----
router.get("/performance/doctors", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const encCols = await tableColumns(req, "encounters");
    if (!encCols.includes("doctor_id")) return res.json([]);
    const userCols = await tableColumns(req, "users");
    const invCols = await tableColumns(req, "invoices");
    const amountCol = INVOICE_AMOUNT_COLS.find((c) => invCols.includes(c));
    const hasInvoiceJoin = !!(amountCol && invCols.includes("encounter_id"));
    try {
      const rows = await req.prisma.$queryRawUnsafe(`
        SELECT e.doctor_id,
               COALESCE(u.name, 'Unknown') AS doctor_name,
               COUNT(DISTINCT e.id)::int AS consultations,
               ${hasInvoiceJoin ? `COALESCE(SUM(i.${amountCol}), 0)::float AS revenue` : `0::float AS revenue`}
        FROM "${s}".encounters e
        LEFT JOIN "${s}".users u ON e.doctor_id = u.id
        ${hasInvoiceJoin ? `LEFT JOIN "${s}".invoices i ON i.encounter_id = e.id` : ``}
        GROUP BY e.doctor_id, u.name
        ORDER BY consultations DESC`);
      res.json(rows);
    } catch { res.json([]); }
  } catch (error) { next(error); }
});

// ---- SPECIALTY PERFORMANCE ----
router.get("/performance/specialties", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const encCols = await tableColumns(req, "encounters");
    const userCols = await tableColumns(req, "users");
    if (!encCols.includes("doctor_id")) return res.json([]);
    const specCol = ["specialization", "speciality", "department"].find((c) => userCols.includes(c));
    if (!specCol) return res.json([]);
    try {
      const rows = await req.prisma.$queryRawUnsafe(`
        SELECT COALESCE(u.${specCol}, 'Unassigned') AS specialty,
               COUNT(DISTINCT e.id)::int AS consultations,
               COUNT(DISTINCT u.id)::int AS doctors
        FROM "${s}".encounters e
        LEFT JOIN "${s}".users u ON e.doctor_id = u.id
        GROUP BY u.${specCol}
        ORDER BY consultations DESC`);
      res.json(rows);
    } catch { res.json([]); }
  } catch (error) { next(error); }
});

// ---- ALERTS ----
router.get("/alerts", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(`
      SELECT id, alert_type, severity, message, ref_data, status, created_at, acknowledged_at, resolved_at
      FROM "${req.schemaName}".operational_alerts
      ORDER BY created_at DESC LIMIT 200`);
    res.json({ alerts: rows });
  } catch (error) { next(error); }
});

router.post("/alerts/:id/ack", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(`
      UPDATE "${req.schemaName}".operational_alerts
      SET status = 'ACKNOWLEDGED', acknowledged_at = COALESCE(acknowledged_at, NOW())
      WHERE id::text = $1 RETURNING *`, id);
    if (!result[0]) return res.status(404).json({ error: "Alert not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

router.post("/alerts/:id/resolve", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(`
      UPDATE "${req.schemaName}".operational_alerts
      SET status = 'RESOLVED', resolved_at = COALESCE(resolved_at, NOW())
      WHERE id::text = $1 RETURNING *`, id);
    if (!result[0]) return res.status(404).json({ error: "Alert not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

// ---- TARGETS ----
router.get("/targets", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".targets ORDER BY created_at DESC`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/targets", async (req, res, next) => {
  try {
    const { period, metric, target_value } = req.body;
    if (!period || !metric || target_value === undefined || target_value === null || target_value === "") {
      return res.status(400).json({ error: "period, metric and target_value are required" });
    }
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".targets (period, metric, target_value)
       VALUES ($1, $2, $3) RETURNING *`,
      String(period), String(metric), parseFloat(target_value)
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.put("/targets/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const sets = []; const params = [];
    if (req.body.period !== undefined) { params.push(String(req.body.period)); sets.push(`period = $${params.length}`); }
    if (req.body.metric !== undefined) { params.push(String(req.body.metric)); sets.push(`metric = $${params.length}`); }
    if (req.body.target_value !== undefined) { params.push(parseFloat(req.body.target_value)); sets.push(`target_value = $${params.length}`); }
    if (req.body.is_active !== undefined) { params.push(req.body.is_active === true); sets.push(`is_active = $${params.length}`); }
    if (!sets.length) return res.status(400).json({ error: "Nothing to update" });
    params.push(id);
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".targets SET ${sets.join(", ")} WHERE id::text = $${params.length} RETURNING *`, ...params);
    if (!result[0]) return res.status(404).json({ error: "Target not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

router.delete("/targets/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `DELETE FROM "${req.schemaName}".targets WHERE id::text = $1 RETURNING id`, id);
    if (!result[0]) return res.status(404).json({ error: "Target not found" });
    res.json({ ok: true, id: result[0].id });
  } catch (error) { next(error); }
});

// ---- ALERT ENGINE SWEEP ----
async function insertAlertIfNew(req, alertType, severity, message, key, refData) {
  const s = req.schemaName;
  try {
    const result = await req.prisma.$queryRawUnsafe(`
      INSERT INTO "${s}".operational_alerts (alert_type, severity, message, ref_data, status)
      SELECT $1, $2, $3, $4::jsonb, 'ACTIVE'
      WHERE NOT EXISTS (
        SELECT 1 FROM "${s}".operational_alerts a
        WHERE a.alert_type = $1 AND a.status = 'ACTIVE' AND a.ref_data->>'key' = $5
      )
      RETURNING id`, alertType, severity, message, JSON.stringify({ ...refData, key }), key);
    return result.length;
  } catch { return 0; }
}

router.post("/alerts/run", async (req, res, next) => {
  try {
    const s = req.schemaName;
    let created = 0;

    try {
      const wardCols = await tableColumns(req, "wards");
      const bedCols = await tableColumns(req, "beds");
      if (wardCols.includes("capacity") && bedCols.includes("ward_id")) {
        const rows = await req.prisma.$queryRawUnsafe(`
          SELECT w.id AS ward_id, COALESCE(w.name, w.id::text) AS ward_name, w.capacity AS capacity,
                 COALESCE(b.occupied, 0) AS occupied
          FROM "${s}".wards w
          LEFT JOIN (
            SELECT ward_id, COUNT(*)::int AS occupied
            FROM "${s}".beds
            WHERE status IS NOT NULL AND LOWER(status) <> 'vacant'
            GROUP BY ward_id
          ) b ON b.ward_id = w.id
          WHERE w.capacity > 0 AND COALESCE(b.occupied, 0) >= w.capacity`);
        for (const w of rows || []) {
          created += await insertAlertIfNew(req, "BED_SHORTAGE", "HIGH",
            `Ward "${w.ward_name}" is at full capacity (${w.occupied}/${w.capacity})`,
            String(w.ward_name), { ward_id: w.ward_id, ward_name: w.ward_name, occupied: w.occupied, capacity: w.capacity });
        }
      }
    } catch (e) { console.error(`[ANALYTICS] BED_SHORTAGE signal failed for ${s}:`, e.message); }

    try {
      const batchCols = await tableColumns(req, "pharmacy_batches");
      if (batchCols.includes("expiry_date") && batchCols.includes("quantity")) {
        let rows = [];
        try {
          rows = await req.prisma.$queryRawUnsafe(`
            SELECT b.id, b.batch_number, b.expiry_date, b.quantity,
                   COALESCE(db.brand_name, b.batch_number) AS medicine_name
            FROM "${s}".pharmacy_batches b
            LEFT JOIN "${s}".drug_brands db ON b.brand_id = db.id
            WHERE b.expiry_date IS NOT NULL
              AND b.expiry_date >= CURRENT_DATE
              AND b.expiry_date <= (CURRENT_DATE + INTERVAL '30 days')
              AND COALESCE(b.quantity, 0) > 0`);
        } catch {
          rows = await req.prisma.$queryRawUnsafe(`
            SELECT id, batch_number AS medicine_name, expiry_date, quantity
            FROM "${s}".pharmacy_batches
            WHERE expiry_date IS NOT NULL
              AND expiry_date >= CURRENT_DATE
              AND expiry_date <= (CURRENT_DATE + INTERVAL '30 days')
              AND COALESCE(quantity, 0) > 0`);
        }
        for (const b of rows || []) {
          created += await insertAlertIfNew(req, "EXPIRY_RISK", "MEDIUM",
            `Batch ${b.batch_number || b.id} of "${b.medicine_name}" expires on ${String(b.expiry_date).slice(0, 10)} (${b.quantity} units)`,
            String(b.medicine_name || b.batch_number || b.id),
            { batch_id: b.id, batch_number: b.batch_number, medicine_name: b.medicine_name, expiry_date: b.expiry_date, quantity: b.quantity });
        }
      }
    } catch (e) { console.error(`[ANALYTICS] EXPIRY_RISK signal failed for ${s}:`, e.message); }

    try {
      const medCols = await tableColumns(req, "medicines");
      if (medCols.includes("stock_quantity")) {
        const rows = await req.prisma.$queryRawUnsafe(`
          SELECT id, name, stock_quantity, unit_price
          FROM "${s}".medicines
          WHERE COALESCE(stock_quantity, 0) <= 5`);
        for (const m of rows || []) {
          created += await insertAlertIfNew(req, "STOCK_OUT_RISK", "LOW",
            `Medicine "${m.name}" is running low (${m.stock_quantity} left)`,
            String(m.name), { medicine_id: m.id, medicine_name: m.name, stock_quantity: m.stock_quantity, unit_price: m.unit_price });
        }
      }
    } catch (e) { console.error(`[ANALYTICS] STOCK_OUT_RISK signal failed for ${s}:`, e.message); }

    try {
      const invCols = await tableColumns(req, "invoices");
      const amountCol = INVOICE_AMOUNT_COLS.find((c) => invCols.includes(c));
      if (!amountCol) {
        // no invoices -> REVENUE_GAP skipped
      }
    } catch (e) { console.error(`[ANALYTICS] REVENUE_GAP signal skipped for ${s}:`, e.message); }

    let total = 0;
    try {
      const t = await req.prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS total FROM "${s}".operational_alerts WHERE status = 'ACTIVE'`);
      total = t[0]?.total || 0;
    } catch {}

    res.json({ created, total });
  } catch (error) { next(error); }
});

module.exports = router;
module.exports.ensureAnalyticsInfrastructure = ensureAnalyticsInfrastructure;
