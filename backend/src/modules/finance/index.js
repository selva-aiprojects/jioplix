const express = require("express");
const { su } = require("../../middleware/sanitize");
const router = express.Router();

const financeInfrastructureSynced = new Set();
const financeInfrastructureLocks = new Map();

async function ensureFinanceInfrastructure(req) {
  const schema = req.schemaName;
  if (!schema || financeInfrastructureSynced.has(schema)) return;
  if (financeInfrastructureLocks.has(schema)) return financeInfrastructureLocks.get(schema);
  const db = req.prisma;
  const q = (sql) => db.$executeRawUnsafe(sql);
  const run = (async () => {
    try {
      await runFinanceDdl(schema, q);
      financeInfrastructureSynced.add(schema);
    } catch (e) {
      console.error(`[FINANCE] DDL failed for ${schema}:`, e.message);
      throw e;
    } finally {
      financeInfrastructureLocks.delete(schema);
    }
  })();
  financeInfrastructureLocks.set(schema, run);
  return run;
}

async function runFinanceDdl(schema, q) {
  const sq = async (sql) => { try { await q(sql); } catch(e) { /* ignore DDL warnings */ } };
  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".billing_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_code VARCHAR(50),
    name VARCHAR(255),
    category VARCHAR(100),
    base_price NUMERIC(12,2),
    discount_percent NUMERIC(5,2) DEFAULT 0,
    hsn_code VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".billing_package_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID,
    item_name VARCHAR(255),
    item_type VARCHAR(50),
    qty NUMERIC(8,2) DEFAULT 1,
    unit_price NUMERIC(12,2),
    tax_percent NUMERIC(5,2) DEFAULT 0,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".surgery_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_no VARCHAR(50),
    patient_name VARCHAR(255),
    encounter_id UUID,
    procedure_name VARCHAR(255),
    surgeon_name VARCHAR(255),
    anesthetist_name VARCHAR(255),
    ot_start TIMESTAMP,
    ot_end TIMESTAMP,
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    gross_charge NUMERIC(14,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".surgery_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID,
    item_name VARCHAR(255),
    item_type VARCHAR(50),
    qty NUMERIC(8,2) DEFAULT 1,
    unit_price NUMERIC(12,2),
    tax_percent NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".invoice_advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_name VARCHAR(255),
    encounter_id UUID,
    amount NUMERIC(12,2),
    payment_mode VARCHAR(30) DEFAULT 'CASH',
    balance NUMERIC(12,2),
    allocated_to_invoice_id UUID,
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".invoice_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_ref VARCHAR(100),
    amount NUMERIC(12,2),
    reason TEXT,
    payment_mode VARCHAR(30),
    approved_by VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING',
    refunded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".invoice_writeoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_ref VARCHAR(100),
    amount NUMERIC(12,2),
    reason TEXT,
    approval_level VARCHAR(30) DEFAULT 'MANAGER',
    approved_by VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`CREATE INDEX IF NOT EXISTS idx_billing_packages_active ON "${schema}".billing_packages (is_active)`);
  await sq(`CREATE INDEX IF NOT EXISTS idx_surgery_cases_status ON "${schema}".surgery_cases (status)`);
  await sq(`CREATE INDEX IF NOT EXISTS idx_invoice_advances_status ON "${schema}".invoice_advances (status)`);
}

router.use(async (req, res, next) => {
  try { await ensureFinanceInfrastructure(req); } catch (e) { console.error("[FINANCE] ensure failed:", e.message); }
  next();
});

router.get("/ensure", async (req, res) => {
  await ensureFinanceInfrastructure(req);
  const tables = await req.prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name IN
     ('billing_packages','billing_package_components','surgery_cases','surgery_components','invoice_advances','invoice_refunds','invoice_writeoffs','gst_invoices','insurance_claim_tracking')
     ORDER BY table_name`,
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

async function getCurrentUserName(req) {
  if (!req.user) return null;
  const email = typeof req.user === "object" ? req.user.user : req.user;
  try {
    const users = await req.prisma.$queryRawUnsafe(
      `SELECT name, email FROM "${req.schemaName}".users WHERE LOWER(email) = LOWER($1) LIMIT 1`, email);
    return users[0]?.name || users[0]?.email || email || null;
  } catch { return email || null; }
}

async function schemaColumns(req, table) {
  return req.prisma.$queryRawUnsafe(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2`,
    req.schemaName, table
  );
}

// ---- PACKAGES ----
router.get("/packages", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const rows = await req.prisma.$queryRawUnsafe(`
      SELECT p.*,
             (SELECT COUNT(*)::int FROM "${s}".billing_package_components c WHERE c.package_id = p.id) AS component_count
      FROM "${s}".billing_packages p
      ORDER BY p.created_at DESC`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/packages", async (req, res, next) => {
  try {
    const { package_code, name, category, base_price, discount_percent, hsn_code } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".billing_packages (package_code, name, category, base_price, discount_percent, hsn_code)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      package_code || null, String(name), category || null,
      parseFloat(base_price || 0), parseFloat(discount_percent || 0), hsn_code || null
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.get("/packages/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const s = req.schemaName;
    const pkg = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".billing_packages WHERE id::text = $1`, id);
    if (!pkg[0]) return res.status(404).json({ error: "Package not found" });
    const components = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".billing_package_components WHERE package_id::text = $1 ORDER BY created_at ASC`, id);
    res.json({ ...pkg[0], components });
  } catch (error) { next(error); }
});

router.put("/packages/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const fields = [
      { body: "package_code", col: "package_code" },
      { body: "name", col: "name" },
      { body: "category", col: "category" },
      { body: "hsn_code", col: "hsn_code" },
    ];
    const numeric = { base_price: "base_price", discount_percent: "discount_percent" };
    const sets = []; const params = [];
    for (const f of fields) {
      if (req.body[f.body] !== undefined) { params.push(req.body[f.body]); sets.push(`${f.col} = $${params.length}`); }
    }
    for (const [body, col] of Object.entries(numeric)) {
      if (req.body[body] !== undefined) { params.push(parseFloat(req.body[body] || 0)); sets.push(`${col} = $${params.length}`); }
    }
    if (req.body.is_active !== undefined) { params.push(req.body.is_active === true); sets.push(`is_active = $${params.length}`); }
    if (!sets.length) return res.status(400).json({ error: "Nothing to update" });
    params.push(id);
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".billing_packages SET ${sets.join(", ")} WHERE id::text = $${params.length} RETURNING *`, ...params);
    if (!result[0]) return res.status(404).json({ error: "Package not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

router.post("/packages/:id/components", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const { item_name, item_type, qty, unit_price, tax_percent, discount_amount } = req.body;
    if (!item_name || !unit_price) return res.status(400).json({ error: "item_name and unit_price are required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".billing_package_components
        (package_id, item_name, item_type, qty, unit_price, tax_percent, discount_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      id, String(item_name), item_type || "ITEM",
      parseFloat(qty || 1), parseFloat(unit_price || 0),
      parseFloat(tax_percent || 0), parseFloat(discount_amount || 0)
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

async function pushBillingQueue(req, data) {
  try {
    const s = req.schemaName;
    const cols = await schemaColumns(req, "billing_queue");
    if (!cols.length) return;
    const names = new Set(cols.map((c) => c.column_name));
    const insertCols = []; const values = [];
    if (names.has("queue_type")) { insertCols.push("queue_type"); values.push("PACKAGE"); }
    if (names.has("queue_ref")) { insertCols.push("queue_ref"); values.push(data.ref || null); }
    if (names.has("patient_name")) { insertCols.push("patient_name"); values.push(data.patient_name || null); }
    if (names.has("status")) { insertCols.push("status"); values.push("PENDING"); }
    if (names.has("payload")) { insertCols.push("payload"); values.push(JSON.stringify(data.payload || {})); }
    if (names.has("details")) { insertCols.push("details"); values.push(JSON.stringify(data.payload || {})); }
    if (!insertCols.length) return;
    const placeholders = insertCols.map((_, i) => `$${i + 1}`).join(", ");
    await req.prisma.$executeRawUnsafe(
      `INSERT INTO "${s}".billing_queue (${insertCols.join(", ")}) VALUES (${placeholders})`, ...values);
  } catch (e) { console.error("[FINANCE] billing_queue push skipped:", e.message); }
}

router.post("/package-bill", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const { package_id, patient_name, discount_override } = req.body;
    if (!package_id) return res.status(400).json({ error: "package_id is required" });
    const id = su(package_id);
    const pkg = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".billing_packages WHERE id::text = $1`, id);
    if (!pkg[0]) return res.status(404).json({ error: "Package not found" });
    const components = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".billing_package_components WHERE package_id::text = $1 ORDER BY created_at ASC`, id);

    const items = components.map((c) => {
      const line_total = parseFloat(c.qty || 1) * parseFloat(c.unit_price || 0);
      return {
        id: c.id,
        item_name: c.item_name,
        item_type: c.item_type,
        qty: c.qty,
        unit_price: c.unit_price,
        tax_percent: c.tax_percent,
        discount_amount: c.discount_amount,
        line_total,
        tax: line_total * (parseFloat(c.tax_percent || 0) / 100),
      };
    });
    const subtotal = items.reduce((acc, i) => acc + i.line_total, 0);
    const discount = discount_override !== undefined && discount_override !== null && discount_override !== ""
      ? parseFloat(discount_override)
      : subtotal * (parseFloat(pkg[0].discount_percent || 0) / 100);
    const total = Math.max(0, subtotal - discount);

    await pushBillingQueue(req, {
      ref: pkg[0].package_code || pkg[0].id,
      patient_name: patient_name || null,
      payload: { package_id: pkg[0].id, subtotal, discount, total },
    });

    res.json({ ok: true, package: pkg[0], items, subtotal, discount, total });
  } catch (error) { next(error); }
});

// ---- SURGERY ----
router.get("/surgery/cases", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".surgery_cases ORDER BY created_at DESC`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/surgery/cases", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const { patient_name, procedure_name, surgeon_name, anesthetist_name, ot_start, ot_end, gross_charge } = req.body;
    if (!patient_name) return res.status(400).json({ error: "patient_name is required" });
    const year = new Date().getFullYear();
    const prefix = `SURG-${year}-`;
    const countRows = await req.prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS n FROM "${s}".surgery_cases WHERE case_no LIKE $1`, `${prefix}%`);
    const seq = String((countRows[0]?.n || 0) + 1).padStart(4, "0");
    const caseNo = `${prefix}${seq}`;
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${s}".surgery_cases
        (case_no, patient_name, procedure_name, surgeon_name, anesthetist_name, ot_start, ot_end, gross_charge)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      caseNo, String(patient_name), procedure_name || null, surgeon_name || null,
      anesthetist_name || null, ot_start || null, ot_end || null, parseFloat(gross_charge || 0)
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.post("/surgery/cases/:id/components", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const { item_name, item_type, qty, unit_price, tax_percent } = req.body;
    if (!item_name || !unit_price) return res.status(400).json({ error: "item_name and unit_price are required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".surgery_components (case_id, item_name, item_type, qty, unit_price, tax_percent)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      id, String(item_name), item_type || "ITEM",
      parseFloat(qty || 1), parseFloat(unit_price || 0), parseFloat(tax_percent || 0)
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.post("/surgery/:id/bill", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const s = req.schemaName;
    const cs = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".surgery_cases WHERE id::text = $1`, id);
    if (!cs[0]) return res.status(404).json({ error: "Surgery case not found" });
    const components = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".surgery_components WHERE case_id::text = $1`, id);
    const components_total = components.reduce((acc, c) => acc + (parseFloat(c.qty || 1) * parseFloat(c.unit_price || 0)), 0);
    const gross_charge = parseFloat(cs[0].gross_charge || 0);
    const total = gross_charge + components_total;
    res.json({ ok: true, total, gross_charge, components_total, component_count: components.length });
  } catch (error) { next(error); }
});

// ---- ADVANCES ----
router.get("/advances", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".invoice_advances ORDER BY created_at DESC`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/advances", async (req, res, next) => {
  try {
    const { patient_name, amount, payment_mode, encounter_id } = req.body;
    if (amount === undefined) return res.status(400).json({ error: "amount is required" });
    const amt = parseFloat(amount || 0);
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".invoice_advances (patient_name, encounter_id, amount, payment_mode, balance, status)
       VALUES ($1, $2, $3, $4, $5, 'OPEN') RETURNING *`,
      patient_name || null, encounter_id || null, amt, payment_mode || "CASH", amt
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.post("/advances/:id/apply", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const s = req.schemaName;
    const { invoice_ref, amount } = req.body;
    if (amount === undefined) return res.status(400).json({ error: "amount is required" });
    const adv = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".invoice_advances WHERE id::text = $1`, id);
    if (!adv[0]) return res.status(404).json({ error: "Advance not found" });
    const newBalance = Math.max(0, parseFloat(adv[0].balance || 0) - parseFloat(amount || 0));
    let allocated = adv[0].allocated_to_invoice_id || null;
    try { if (invoice_ref) allocated = su(invoice_ref); } catch { /* invoice_ref is a reference string, not a UUID */ }
    const status = newBalance <= 0.01 ? "CLOSED" : adv[0].status;
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${s}".invoice_advances
       SET balance = $1, status = $2, allocated_to_invoice_id = COALESCE($3, allocated_to_invoice_id)
       WHERE id::text = $4 RETURNING *`,
      newBalance <= 0.01 ? 0 : newBalance, status, allocated, id
    );
    res.json(result[0]);
  } catch (error) { next(error); }
});

// ---- REFUNDS ----
router.get("/refunds", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".invoice_refunds ORDER BY created_at DESC`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/refunds", async (req, res, next) => {
  try {
    const { invoice_ref, amount, reason, payment_mode } = req.body;
    if (!invoice_ref || amount === undefined) return res.status(400).json({ error: "invoice_ref and amount are required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".invoice_refunds (invoice_ref, amount, reason, payment_mode, status)
       VALUES ($1, $2, $3, $4, 'PENDING') RETURNING *`,
      String(invoice_ref), parseFloat(amount || 0), reason || null, payment_mode || "CASH"
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.post("/refunds/:id/approve", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const approvedBy = req.body.approved_by || await getCurrentUserName(req);
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".invoice_refunds
       SET status = 'APPROVED', approved_by = $1, refunded_at = NOW()
       WHERE id::text = $2 RETURNING *`,
      approvedBy || null, id
    );
    if (!result[0]) return res.status(404).json({ error: "Refund not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

// ---- WRITEOFFS ----
router.get("/writeoffs", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".invoice_writeoffs ORDER BY created_at DESC`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/writeoffs", async (req, res, next) => {
  try {
    const { invoice_ref, amount, reason } = req.body;
    if (!invoice_ref || amount === undefined) return res.status(400).json({ error: "invoice_ref and amount are required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".invoice_writeoffs (invoice_ref, amount, reason, status)
       VALUES ($1, $2, $3, 'PENDING') RETURNING *`,
      String(invoice_ref), parseFloat(amount || 0), reason || null
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.post("/writeoffs/:id/approve", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const approvedBy = req.body.approved_by || await getCurrentUserName(req);
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".invoice_writeoffs
       SET status = 'APPROVED', approved_by = $1
       WHERE id::text = $2 RETURNING *`,
      approvedBy || null, id
    );
    if (!result[0]) return res.status(404).json({ error: "Writeoff not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

// ---- GST CONFIG ----
const GST_CONFIG_KEY = "gst_config";

router.get("/gst/config", async (req, res, next) => {
  const defaults = { gstin: "", state: "", sandbox: true };
  try {
    const s = req.schemaName;
    const cols = await schemaColumns(req, "tenant_sensitive_settings");
    if (!cols.length) return res.json(defaults);
    const jsonbCol = cols.find((c) => c.data_type === "jsonb")?.column_name;
    if (!jsonbCol) return res.json(defaults);
    const names = cols.map((c) => c.column_name);
    const keyCol = ["key", "name", "setting_key"].find((k) => names.includes(k));
    let where = ""; const params = [];
    if (keyCol) { params.push(GST_CONFIG_KEY); where = ` WHERE ${keyCol} = $1`; }
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".tenant_sensitive_settings${where} LIMIT 1`, ...params);
    const row = rows[0];
    if (!row || row[jsonbCol] === null || row[jsonbCol] === undefined) return res.json(defaults);
    const cfg = typeof row[jsonbCol] === "string" ? JSON.parse(row[jsonbCol]) : row[jsonbCol];
    return res.json({
      gstin: cfg.gstin || defaults.gstin,
      state: cfg.state || defaults.state,
      placeOfSupply: cfg.place_of_supply || cfg.placeOfSupply || null,
      sandbox: cfg.sandbox !== false,
    });
  } catch (e) {
    return res.json(defaults);
  }
});

router.put("/gst/config", async (req, res, next) => {
  try {
    const cfg = {
      gstin: req.body.gstin || "",
      state: req.body.state || "",
      place_of_supply: req.body.place_of_supply || req.body.placeOfSupply || null,
      sandbox: true,
    };
    const s = req.schemaName;
    const cols = await schemaColumns(req, "tenant_sensitive_settings");
    if (!cols.length) return res.json({ ok: true, stored: false, note: "no settings table" });
    const jsonbCol = cols.find((c) => c.data_type === "jsonb")?.column_name;
    if (!jsonbCol) return res.json({ ok: true, stored: false, note: "no jsonb column" });
    const names = cols.map((c) => c.column_name);
    const keyCol = ["key", "name", "setting_key"].find((k) => names.includes(k));
    const tenantCol = ["tenant_id", "tenantId", "tenant"].find((k) => names.includes(k));
    const json = JSON.stringify(cfg);
    if (keyCol) {
      const existing = await req.prisma.$queryRawUnsafe(
        `SELECT * FROM "${s}".tenant_sensitive_settings WHERE ${keyCol} = $1 LIMIT 1`, GST_CONFIG_KEY);
      if (existing[0]) {
        await req.prisma.$executeRawUnsafe(
          `UPDATE "${s}".tenant_sensitive_settings SET ${jsonbCol} = $2::jsonb WHERE ${keyCol} = $1`,
          GST_CONFIG_KEY, json);
      } else {
        const insertCols = [keyCol, jsonbCol];
        const vals = [GST_CONFIG_KEY, json];
        if (tenantCol) { insertCols.push(tenantCol); vals.push(req.tenantId || null); }
        await req.prisma.$executeRawUnsafe(
          `INSERT INTO "${s}".tenant_sensitive_settings (${insertCols.join(", ")})
           VALUES (${vals.map((_, i) => `$${i + 1}`).join(", ")})`, ...vals);
      }
    } else {
      await req.prisma.$executeRawUnsafe(
        `INSERT INTO "${s}".tenant_sensitive_settings (${jsonbCol}) VALUES ($1::jsonb)`, json);
    }
    res.json({ ok: true, stored: true });
  } catch (error) {
    console.error("[FINANCE] gst config store failed:", error.message);
    res.json({ ok: true, stored: false, note: "config not persisted" });
  }
});

// ---- E-INVOICE ----
router.post("/einvoice/:id/generate", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const s = req.schemaName;
    const invoice_ref = req.body.invoice_ref || null;
    const irn = `IRN-SBX-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    let record = await req.prisma.$queryRawUnsafe(
      `UPDATE "${s}".gst_invoices SET irn = $1, irn_status = 'GENERATED', invoice_ref = COALESCE($2, invoice_ref)
       WHERE id::text = $3 RETURNING *`,
      irn, invoice_ref, id
    );
    if (!record[0]) {
      record = await req.prisma.$queryRawUnsafe(
        `INSERT INTO "${s}".gst_invoices (invoice_ref, irn, irn_status) VALUES ($1, $2, 'GENERATED') RETURNING *`,
        invoice_ref, irn
      );
    }
    res.json({ ok: true, irn, sandbox: true, record: record[0] });
  } catch (error) { next(error); }
});

// ---- INSURANCE ----
router.get("/insurance/eligibility", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const patientId = (req.query && req.query.patientId) || (req.body && req.body.patientId);
    const planId = (req.query && req.query.planId) || (req.body && req.body.planId);
    try {
      const cols = await schemaColumns(req, "patient_insurance");
      if (!cols.length) return res.json({ eligible: true, remaining_limit: null, plan: null, note: "no insurance data" });
      const names = cols.map((c) => c.column_name);
      const conds = []; const params = [];
      if (names.includes("patient_id") && patientId) {
        params.push(String(patientId));
        conds.push(`patient_id::text = $${params.length}`);
      }
      if (names.includes("plan_id") && planId) {
        params.push(String(planId));
        conds.push(`plan_id::text = $${params.length}`);
      }
      let q = `SELECT * FROM "${s}".patient_insurance`;
      if (conds.length) q += ` WHERE ${conds.join(" AND ")}`;
      q += ` LIMIT 20`;
      const rows = await req.prisma.$queryRawUnsafe(q, ...params);
      const row = rows[0] || {};
      return res.json({
        eligible: row.eligible !== undefined ? !!row.eligible : true,
        remaining_limit: row.remaining_limit !== undefined ? row.remaining_limit
          : (row.sum_insured !== undefined ? row.sum_insured : null),
        plan: row.plan_name || row.plan_id || null,
      });
    } catch (e) {
      return res.json({ eligible: true, remaining_limit: null, plan: null, note: "no insurance data" });
    }
  } catch (error) { next(error); }
});

router.post("/claims/:id/status", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const { provider_status, remarks } = req.body;
    const updatedBy = await getCurrentUserName(req);
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".insurance_claim_tracking (claim_id, provider_status, remarks, updated_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      id, provider_status || "SUBMITTED", remarks || null, updatedBy || null
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.get("/claims/:id/tracking", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".insurance_claim_tracking
       WHERE claim_id::text = $1 ORDER BY status_date DESC, created_at DESC`,
      id
    );
    res.json(rows);
  } catch (error) { next(error); }
});

// ---- DOCTOR SHARE REPORT ----
router.get("/doctor-share-report", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const period = req.query.period ? String(req.query.period) : "";
    try {
      const conds = []; const params = [];
      if (period) { params.push(period); conds.push(`r.run_month = $${params.length}`); }
      let q = `
        SELECT u.id AS doctor_id, u.name AS doctor_name, u.email AS doctor_email,
               COALESCE(SUM(i.gross_amount),0)::float AS gross,
               COALESCE(SUM(i.incentive_amount),0)::float AS incentive,
               COALESCE(SUM(i.net_amount),0)::float AS net
        FROM "${s}".payroll_items i
        JOIN "${s}".payroll_runs r ON i.run_id = r.id
        JOIN "${s}".users u ON i.staff_user_id = u.id
        WHERE LOWER(u.role) = 'doctor'`;
      if (conds.length) q += ` AND ${conds.join(" AND ")}`;
      q += ` GROUP BY u.id, u.name, u.email ORDER BY u.name ASC`;
      const rows = await req.prisma.$queryRawUnsafe(q, ...params);
      return res.json({ report: rows });
    } catch (e) {
      return res.json({ report: [], note: "no payroll data" });
    }
  } catch (error) { next(error); }
});

module.exports = router;
module.exports.ensureFinanceInfrastructure = ensureFinanceInfrastructure;
