const express = require("express");
const { su } = require("../../middleware/sanitize");
const router = express.Router();

const procurementInfrastructureSynced = new Set();
const procurementInfrastructureLocks = new Map();

async function ensureProcurementInfrastructure(req) {
  const schema = req.schemaName;
  if (!schema || procurementInfrastructureSynced.has(schema)) return;
  if (procurementInfrastructureLocks.has(schema)) return procurementInfrastructureLocks.get(schema);
  const db = req.prisma;
  const q = (sql) => db.$executeRawUnsafe(sql);
  const run = (async () => {
    try {
      await runProcurementDdl(schema, q);
      procurementInfrastructureSynced.add(schema);
    } catch (e) {
      console.error(`[PROCUREMENT] DDL failed for ${schema}:`, e.message);
      throw e;
    } finally {
      procurementInfrastructureLocks.delete(schema);
    }
  })();
  procurementInfrastructureLocks.set(schema, run);
  return run;
}

async function runProcurementDdl(schema, q) {
  const sq = async (sql) => { try { await q(sql); } catch(e) { /* ignore DDL warnings */ } };
  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".vendor_rate_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID,
    supplier_name VARCHAR(255),
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) DEFAULT 'MEDICINE',
    rate NUMERIC(12,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'INR',
    effective_from DATE,
    effective_to DATE,
    is_current BOOLEAN DEFAULT TRUE,
    terms TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  await sq(`CREATE INDEX IF NOT EXISTS idx_rate_contracts_item ON "${schema}".vendor_rate_contracts (item_name)`);
  await sq(`CREATE INDEX IF NOT EXISTS idx_rate_contracts_supplier ON "${schema}".vendor_rate_contracts (supplier_id)`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_no VARCHAR(50) NOT NULL,
    source_module VARCHAR(50) DEFAULT 'PHARMACY',
    status VARCHAR(20) DEFAULT 'DRAFT',
    requested_by VARCHAR(255),
    requested_at TIMESTAMP DEFAULT NOW(),
    priority VARCHAR(20) DEFAULT 'NORMAL',
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  await sq(`CREATE INDEX IF NOT EXISTS idx_pr_status ON "${schema}".purchase_requisitions (status)`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".purchase_requisition_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_id UUID NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) DEFAULT 'MEDICINE',
    required_qty NUMERIC(12,2),
    suggested_qty NUMERIC(12,2),
    current_stock NUMERIC(12,2) DEFAULT 0,
    reorder_level NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  await sq(`CREATE INDEX IF NOT EXISTS idx_pr_items_requisition ON "${schema}".purchase_requisition_items (requisition_id)`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_no VARCHAR(50) NOT NULL,
    supplier_id UUID,
    supplier_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'DRAFT',
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery DATE,
    total_amount NUMERIC(14,2) DEFAULT 0,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  await sq(`CREATE INDEX IF NOT EXISTS idx_po_status ON "${schema}".purchase_orders (status)`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) DEFAULT 'MEDICINE',
    qty_ordered NUMERIC(12,2),
    unit_rate NUMERIC(12,2),
    amount NUMERIC(14,2),
    received_qty NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  await sq(`CREATE INDEX IF NOT EXISTS idx_po_items_po ON "${schema}".purchase_order_items (po_id)`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".grn (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_no VARCHAR(50) NOT NULL,
    po_id UUID,
    supplier_id UUID,
    supplier_name VARCHAR(255),
    received_at TIMESTAMP DEFAULT NOW(),
    invoice_ref VARCHAR(100),
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".grn_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grn_id UUID NOT NULL,
    po_item_id UUID,
    item_name VARCHAR(255),
    qty_received NUMERIC(12,2),
    qty_accepted NUMERIC(12,2),
    qty_rejected NUMERIC(12,2) DEFAULT 0,
    batch_number VARCHAR(100),
    expiry_date DATE,
    qc_result VARCHAR(20) DEFAULT 'PASS',
    qc_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  await sq(`CREATE INDEX IF NOT EXISTS idx_grn_items_grn ON "${schema}".grn_items (grn_id)`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".procurement_matching (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID,
    po_no VARCHAR(50),
    grn_id UUID,
    grn_no VARCHAR(50),
    invoice_ref VARCHAR(100),
    match_status VARCHAR(40),
    po_amount NUMERIC(14,2),
    grn_amount NUMERIC(14,2),
    invoice_amount NUMERIC(14,2),
    matched_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
  )`);
  await sq(`CREATE INDEX IF NOT EXISTS idx_matching_grn ON "${schema}".procurement_matching (grn_id)`);
  await sq(`CREATE INDEX IF NOT EXISTS idx_matching_po ON "${schema}".procurement_matching (po_id)`);
}

router.use(async (req, res, next) => {
  try { await ensureProcurementInfrastructure(req); } catch (e) { console.error("[PROCUREMENT] ensure failed:", e.message); }
  next();
});

router.get("/ensure", async (req, res) => {
  await ensureProcurementInfrastructure(req);
  const tables = await req.prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name IN ('vendor_rate_contracts','purchase_requisitions','purchase_requisition_items','purchase_orders','purchase_order_items','grn','grn_items','procurement_matching') ORDER BY table_name`,
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

async function nextNumber(req, table, prefix) {
  const rows = await req.prisma.$queryRawUnsafe(
    `SELECT COUNT(*)::int AS count FROM "${req.schemaName}".${table}`);
  const seq = (rows[0]?.count || 0) + 1;
  return `${prefix}-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
}

// ---- RATE CONTRACTS ----
router.get("/rate-contracts", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".vendor_rate_contracts ORDER BY item_name ASC, rate ASC`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/rate-contracts", async (req, res, next) => {
  try {
    const { supplier_id, supplier_name, item_name, item_type, rate, currency, effective_from, effective_to, is_current, terms } = req.body;
    if (!item_name) return res.status(400).json({ error: "item_name is required" });
    if (rate === undefined || rate === null || isNaN(parseFloat(rate))) return res.status(400).json({ error: "rate is required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".vendor_rate_contracts
        (supplier_id, supplier_name, item_name, item_type, rate, currency, effective_from, effective_to, is_current, terms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      supplier_id ? su(supplier_id) : null, supplier_name || null,
      String(item_name), item_type || "MEDICINE", parseFloat(rate),
      currency || "INR", effective_from || null, effective_to || null,
      is_current !== false, terms || null
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.delete("/rate-contracts/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `DELETE FROM "${req.schemaName}".vendor_rate_contracts WHERE id::text = $1 RETURNING id`, id);
    if (!result[0]) return res.status(404).json({ error: "Rate contract not found" });
    res.json({ ok: true, id: result[0].id });
  } catch (error) { next(error); }
});

router.get("/rate-contracts/compare", async (req, res, next) => {
  try {
    const item = String(req.query.item || "");
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".vendor_rate_contracts
       WHERE item_name ILIKE $1 ORDER BY rate ASC`,
      `%${item}%`
    );
    res.json(rows);
  } catch (error) { next(error); }
});

// ---- REQUISITIONS ----
router.get("/requisitions", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT r.*,
              (SELECT COUNT(*)::int FROM "${req.schemaName}".purchase_requisition_items i WHERE i.requisition_id = r.id) AS item_count
       FROM "${req.schemaName}".purchase_requisitions r
       ORDER BY r.created_at DESC LIMIT 200`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/requisitions", async (req, res, next) => {
  try {
    const { source_module, priority, requested_by, items } = req.body;
    if (!items || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "items array is required" });
    }
    for (const it of items) {
      if (!it.item_name) return res.status(400).json({ error: "each item requires item_name" });
    }
    const prNo = await nextNumber(req, "purchase_requisitions", "PR");
    const header = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".purchase_requisitions (pr_no, source_module, status, requested_by, priority)
       VALUES ($1, $2, 'DRAFT', $3, $4) RETURNING *`,
      prNo, source_module || "PHARMACY", requested_by || null, priority || "NORMAL"
    );
    const inserted = [];
    for (const it of items) {
      const row = await req.prisma.$queryRawUnsafe(
        `INSERT INTO "${req.schemaName}".purchase_requisition_items
          (requisition_id, item_name, item_type, required_qty, suggested_qty)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        header[0].id, String(it.item_name), it.item_type || "MEDICINE",
        parseFloat(it.required_qty || 0) || null,
        it.suggested_qty !== undefined ? parseFloat(it.suggested_qty) : null
      );
      inserted.push(row[0]);
    }
    res.status(201).json({ ...header[0], items: inserted });
  } catch (error) { next(error); }
});

router.post("/requisitions/generate", async (req, res, next) => {
  try {
    const s = req.schemaName;
    let lowItems = [];
    try {
      const cols = await req.prisma.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'medicines'`, s);
      const colSet = new Set((cols || []).map((c) => c.column_name));
      const hasReorderLevel = colSet.has("reorder_level");
      const hasReorderQty = colSet.has("reorder_qty");
      const reorderLevelExpr = hasReorderLevel ? "COALESCE(reorder_level, 10)" : "10";
      const reorderQtyExpr = hasReorderQty ? "COALESCE(reorder_qty, 20)" : "20";
      const whereExpr = hasReorderLevel ? "stock_quantity <= COALESCE(reorder_level, 10)" : "stock_quantity <= 10";
      lowItems = await req.prisma.$queryRawUnsafe(
        `SELECT m.id, m.name, m.stock_quantity AS stock,
                ${reorderLevelExpr} AS reorder_level,
                ${reorderQtyExpr} AS reorder_qty
         FROM "${s}".medicines m
         WHERE ${whereExpr} AND m.stock_quantity >= 0
         ORDER BY m.name ASC`);
    } catch (e) {
      console.warn(`[PROCUREMENT] medicines scan failed for ${s}:`, e.message);
      lowItems = [];
    }

    if (!lowItems.length) return res.json({ created: 0, items: [] });

    let openItems = [];
    try {
      openItems = await req.prisma.$queryRawUnsafe(
        `SELECT DISTINCT i.item_name
         FROM "${s}".purchase_requisition_items i
         INNER JOIN "${s}".purchase_requisitions r ON i.requisition_id = r.id
         WHERE r.status IN ('DRAFT','APPROVED')`);
    } catch (e) {
      console.warn(`[PROCUREMENT] open requisition scan failed for ${s}:`, e.message);
      openItems = [];
    }
    const openNames = (openItems || []).map((o) => String(o.item_name || "").trim().toLowerCase());

    const uncovered = [];
    for (const m of lowItems) {
      const name = String(m.name || "").trim();
      if (!name) continue;
      if (openNames.includes(name.toLowerCase())) continue;
      const suggested = Math.max(0, (parseFloat(m.reorder_qty) || 0) - (parseFloat(m.stock) || 0));
      if (suggested <= 0) continue;
      uncovered.push({ name, stock: parseFloat(m.stock) || 0, reorder_level: parseFloat(m.reorder_level) || 0, suggested });
    }
    if (!uncovered.length) return res.json({ created: 0, items: [] });

    const prNo = await nextNumber(req, "purchase_requisitions", "PR");
    const header = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${s}".purchase_requisitions (pr_no, source_module, status, requested_by, priority)
       VALUES ($1, 'PHARMACY', 'DRAFT', $2, 'NORMAL') RETURNING *`,
      prNo, req.user && typeof req.user === "object" ? req.user.user || null : req.user || null
    );
    const createdItems = [];
    for (const it of uncovered) {
      const row = await req.prisma.$queryRawUnsafe(
        `INSERT INTO "${s}".purchase_requisition_items
          (requisition_id, item_name, item_type, required_qty, suggested_qty, current_stock, reorder_level)
         VALUES ($1, $2, 'MEDICINE', $3, $4, $5, $6) RETURNING *`,
        header[0].id, it.name, it.suggested, it.suggested, it.stock, it.reorder_level
      );
      createdItems.push(row[0]);
    }
    res.status(201).json({ created: createdItems.length, items: createdItems, requisition: header[0] });
  } catch (error) { next(error); }
});

router.post("/requisitions/:id/approve", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".purchase_requisitions SET status = 'APPROVED'
       WHERE id::text = $1 RETURNING *`, id);
    if (!result[0]) return res.status(404).json({ error: "Requisition not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

router.post("/requisitions/:id/convert", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const id = su(req.params.id);
    const reqRows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".purchase_requisitions WHERE id::text = $1`, id);
    if (!reqRows[0]) return res.status(404).json({ error: "Requisition not found" });
    const items = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".purchase_requisition_items WHERE requisition_id::text = $1 ORDER BY created_at ASC`, id);
    if (!items.length) return res.status(400).json({ error: "Requisition has no items" });

    const poNo = await nextNumber(req, "purchase_orders", "PO");
    let supplierId = null;
    let supplierName = "UNASSIGNED";
    let totalAmount = 0;

    const poItems = [];
    for (const it of items) {
      let unitRate = 0;
      let matchedSupplierId = null;
      let matchedSupplierName = null;
      try {
        const contracts = await req.prisma.$queryRawUnsafe(
          `SELECT * FROM "${s}".vendor_rate_contracts
           WHERE item_name ILIKE $1 AND is_current = TRUE
           ORDER BY rate ASC LIMIT 1`,
          String(it.item_name)
        );
        if (contracts[0]) {
          unitRate = parseFloat(contracts[0].rate || 0);
          matchedSupplierId = contracts[0].supplier_id || null;
          matchedSupplierName = contracts[0].supplier_name || null;
        }
      } catch (e) {
        console.warn(`[PROCUREMENT] rate contract lookup failed for ${s}:`, e.message);
      }
      const qty = parseFloat(it.suggested_qty || it.required_qty || 0);
      poItems.push({ item_name: it.item_name, item_type: it.item_type || "MEDICINE", qty_ordered: qty, unit_rate: unitRate, amount: unitRate * qty });
      totalAmount += unitRate * qty;
      if (matchedSupplierName) { supplierId = matchedSupplierId; supplierName = matchedSupplierName; }
    }

    const createdBy = await getCurrentUserId(req);
    const po = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${s}".purchase_orders (po_no, supplier_id, supplier_name, status, expected_delivery, total_amount, created_by)
       VALUES ($1, $2, $3, 'DRAFT', $4, $5, $6) RETURNING *`,
      poNo, supplierId, supplierName, null, totalAmount, createdBy || null
    );
    const inserted = [];
    for (const it of poItems) {
      const row = await req.prisma.$queryRawUnsafe(
        `INSERT INTO "${s}".purchase_order_items (po_id, item_name, item_type, qty_ordered, unit_rate, amount)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        po[0].id, it.item_name, it.item_type, it.qty_ordered, it.unit_rate, it.amount
      );
      inserted.push(row[0]);
    }

    await req.prisma.$executeRawUnsafe(
      `UPDATE "${s}".purchase_requisitions SET status = 'CONVERTED' WHERE id = $1`, reqRows[0].id);
    res.status(201).json({ ...po[0], items: inserted });
  } catch (error) { next(error); }
});

// ---- PURCHASE ORDERS ----
router.get("/purchase-orders", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT po.*,
              (SELECT COUNT(*)::int FROM "${req.schemaName}".purchase_order_items i WHERE i.po_id = po.id) AS item_count
       FROM "${req.schemaName}".purchase_orders po
       ORDER BY po.created_at DESC LIMIT 200`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get("/purchase-orders/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const po = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".purchase_orders WHERE id::text = $1`, id);
    if (!po[0]) return res.status(404).json({ error: "Purchase order not found" });
    const items = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".purchase_order_items WHERE po_id = $1 ORDER BY created_at ASC`, po[0].id);
    res.json({ ...po[0], items });
  } catch (error) { next(error); }
});

router.post("/purchase-orders", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const { supplier_id, supplier_name, expected_delivery, items } = req.body;
    if (!items || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "items array is required" });
    }
    for (const it of items) {
      if (!it.item_name) return res.status(400).json({ error: "each item requires item_name" });
      if (it.unit_rate === undefined || it.unit_rate === null || isNaN(parseFloat(it.unit_rate))) {
        return res.status(400).json({ error: "each item requires unit_rate" });
      }
    }
    const poNo = await nextNumber(req, "purchase_orders", "PO");
    let totalAmount = 0;
    const poItems = [];
    for (const it of items) {
      const qty = parseFloat(it.qty_ordered || 0);
      const rate = parseFloat(it.unit_rate || 0);
      const amount = qty * rate;
      totalAmount += amount;
      poItems.push({ item_name: it.item_name, item_type: it.item_type || "MEDICINE", qty_ordered: qty, unit_rate: rate, amount });
    }
    const createdBy = await getCurrentUserId(req);
    const po = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${s}".purchase_orders (po_no, supplier_id, supplier_name, status, expected_delivery, total_amount, created_by)
       VALUES ($1, $2, $3, 'DRAFT', $4, $5, $6) RETURNING *`,
      poNo, supplier_id ? su(supplier_id) : null, supplier_name || null,
      expected_delivery || null, totalAmount, createdBy || null
    );
    const inserted = [];
    for (const it of poItems) {
      const row = await req.prisma.$queryRawUnsafe(
        `INSERT INTO "${s}".purchase_order_items (po_id, item_name, item_type, qty_ordered, unit_rate, amount)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        po[0].id, it.item_name, it.item_type, it.qty_ordered, it.unit_rate, it.amount
      );
      inserted.push(row[0]);
    }
    res.status(201).json({ ...po[0], items: inserted });
  } catch (error) { next(error); }
});

router.post("/purchase-orders/:id/receive", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const id = su(req.params.id);
    const po = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".purchase_orders WHERE id::text = $1`, id);
    if (!po[0]) return res.status(404).json({ error: "Purchase order not found" });
    const { invoice_ref, items } = req.body;
    if (!items || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "items array is required" });
    }
    const grnNo = await nextNumber(req, "grn", "GRN");
    const grn = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${s}".grn (grn_no, po_id, supplier_id, supplier_name, invoice_ref, status)
       VALUES ($1, $2, $3, $4, $5, 'UNDER_QC') RETURNING *`,
      grnNo, po[0].id, po[0].supplier_id || null, po[0].supplier_name || null, invoice_ref || null
    );
    const inserted = [];
    for (const it of items) {
      const qtyReceived = parseFloat(it.qty_received || 0);
      const row = await req.prisma.$queryRawUnsafe(
        `INSERT INTO "${s}".grn_items
          (grn_id, po_item_id, item_name, qty_received, qty_accepted, qty_rejected, batch_number, expiry_date, qc_result, qc_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        grn[0].id,
        it.po_item_id ? su(it.po_item_id) : null,
        it.item_name || null,
        qtyReceived,
        it.qty_accepted !== undefined ? parseFloat(it.qty_accepted) : qtyReceived,
        parseFloat(it.qty_rejected || 0),
        it.batch_number || null,
        it.expiry_date || null,
        it.qc_result || "PASS",
        it.qc_notes || null
      );
      if (it.po_item_id) {
        await req.prisma.$executeRawUnsafe(
          `UPDATE "${s}".purchase_order_items SET received_qty = received_qty + $1 WHERE id::text = $2`,
          qtyReceived, su(it.po_item_id)
        );
      }
      inserted.push(row[0]);
    }
    res.status(201).json({ ...grn[0], items: inserted });
  } catch (error) { next(error); }
});

// ---- GRN ----
router.get("/grn", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT g.*,
              (SELECT COUNT(*)::int FROM "${req.schemaName}".grn_items i WHERE i.grn_id = g.id) AS item_count
       FROM "${req.schemaName}".grn g
       ORDER BY g.received_at DESC LIMIT 200`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get("/grn/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const grn = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".grn WHERE id::text = $1`, id);
    if (!grn[0]) return res.status(404).json({ error: "GRN not found" });
    const items = await req.prisma.$queryRawUnsafe(
      `SELECT gi.*, poi.unit_rate
       FROM "${req.schemaName}".grn_items gi
       LEFT JOIN "${req.schemaName}".purchase_order_items poi ON gi.po_item_id = poi.id
       WHERE gi.grn_id = $1 ORDER BY gi.created_at ASC`, grn[0].id);
    res.json({ ...grn[0], items });
  } catch (error) { next(error); }
});

router.post("/grn/:id/qc", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const id = su(req.params.id);
    const grn = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".grn WHERE id::text = $1`, id);
    if (!grn[0]) return res.status(404).json({ error: "GRN not found" });
    const { items } = req.body;
    if (!items || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "items array is required" });
    }
    for (const it of items) {
      if (!it.grn_item_id) return res.status(400).json({ error: "each item requires grn_item_id" });
      const sets = ["qc_result = COALESCE($2, qc_result)", "qc_notes = COALESCE($3, qc_notes)",
                    "qty_accepted = COALESCE($4, qty_accepted)", "qty_rejected = COALESCE($5, qty_rejected)"];
      await req.prisma.$executeRawUnsafe(
        `UPDATE "${s}".grn_items SET ${sets.join(", ")} WHERE id::text = $1`,
        su(it.grn_item_id),
        it.qc_result ? String(it.qc_result) : null,
        it.qc_notes !== undefined ? (it.qc_notes || null) : null,
        it.qty_accepted !== undefined ? parseFloat(it.qty_accepted) : null,
        it.qty_rejected !== undefined ? parseFloat(it.qty_rejected) : null
      );
    }
    const grnItems = await req.prisma.$queryRawUnsafe(
      `SELECT qc_result FROM "${s}".grn_items WHERE grn_id = $1`, grn[0].id);
    let status = grn[0].status;
    const results = (grnItems || []).map((r) => String(r.qc_result || "").toUpperCase());
    if (results.includes("FAIL")) status = "QUARANTINED";
    else if (results.length && results.every((r) => r === "PASS")) status = "APPROVED";
    const updated = await req.prisma.$queryRawUnsafe(
      `UPDATE "${s}".grn SET status = $1 WHERE id = $2 RETURNING *`, status, grn[0].id);
    const fullItems = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".grn_items WHERE grn_id = $1 ORDER BY created_at ASC`, grn[0].id);
    res.json({ ...updated[0], items: fullItems });
  } catch (error) { next(error); }
});

async function resolveMedicineId(req, itemName) {
  if (!itemName) return null;
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT id FROM "${req.schemaName}".medicines WHERE name ILIKE $1 LIMIT 1`, String(itemName));
    return rows[0]?.id || null;
  } catch { return null; }
}

async function insertInwardsFromGrn(req, grn, rows) {
  if (!rows || !rows.length) return;
  try {
    const s = req.schemaName;
    const cols = await req.prisma.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'pharmacy_inwards'`, s);
    const colSet = new Set((cols || []).map((c) => c.column_name));
    const candidates = [
      "inward_no", "supplier_id", "medicine_id", "batch_number", "invoice_number",
      "quantity", "current_stock", "uom", "purchase_price", "mrp",
      "mfd_date", "expiry_date", "received_at", "is_blocked", "remarks",
    ];
    const insertCols = candidates.filter((c) => colSet.has(c));
    if (!insertCols.length) return;
    for (const row of rows) {
      const params = [];
      const vals = [];
      for (const c of insertCols) {
        let v;
        switch (c) {
          case "inward_no": v = grn.grn_no; break;
          case "supplier_id": v = grn.supplier_id || null; break;
          case "medicine_id": v = row.medicine_id || null; break;
          case "batch_number": v = row.batch_number || null; break;
          case "invoice_number": v = grn.invoice_ref || null; break;
          case "quantity": v = row.qty_accepted || 0; break;
          case "current_stock": v = row.qty_accepted || 0; break;
          case "uom": v = "UNIT"; break;
          case "purchase_price": v = row.unit_rate || 0; break;
          case "mrp": v = row.unit_rate || 0; break;
          case "mfd_date": v = null; break;
          case "expiry_date": v = row.expiry_date || null; break;
          case "received_at": v = new Date(); break;
          case "is_blocked": v = false; break;
          case "remarks": v = `From GRN ${grn.grn_no}`; break;
          default: v = null;
        }
        params.push(v);
        vals.push(`$${params.length}`);
      }
      await req.prisma.$executeRawUnsafe(
        `INSERT INTO "${s}".pharmacy_inwards (${insertCols.join(", ")}) VALUES (${vals.join(", ")})`, ...params);
    }
  } catch (e) {
    console.warn(`[PROCUREMENT] pharmacy_inwards insert skipped for ${req.schemaName}:`, e.message);
  }
}

router.post("/grn/:id/match", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const id = su(req.params.id);
    const grn = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${s}".grn WHERE id::text = $1`, id);
    if (!grn[0]) return res.status(404).json({ error: "GRN not found" });

    let po = null;
    let poAmount = 0;
    if (grn[0].po_id) {
      try {
        const poRows = await req.prisma.$queryRawUnsafe(
          `SELECT * FROM "${s}".purchase_orders WHERE id = $1`, grn[0].po_id);
        po = poRows[0] || null;
        poAmount = parseFloat(po?.total_amount || 0);
        if (!poAmount) {
          const poItems = await req.prisma.$queryRawUnsafe(
            `SELECT * FROM "${s}".purchase_order_items WHERE po_id = $1`, grn[0].po_id);
          poAmount = (poItems || []).reduce((sum, i) => sum + (parseFloat(i.unit_rate || 0) * parseFloat(i.qty_ordered || 0)), 0);
        }
      } catch (e) {
        console.warn(`[PROCUREMENT] PO lookup failed for ${s}:`, e.message);
      }
    }

    const grnItems = await req.prisma.$queryRawUnsafe(
      `SELECT gi.*, poi.qty_ordered, poi.unit_rate
       FROM "${s}".grn_items gi
       LEFT JOIN "${s}".purchase_order_items poi ON gi.po_item_id = poi.id
       WHERE gi.grn_id = $1 ORDER BY gi.created_at ASC`, grn[0].id);

    const hasInvoice = Boolean(grn[0].invoice_ref && String(grn[0].invoice_ref).trim());
    let totalAcceptedQty = 0;
    let totalOrderedQty = 0;
    let grnAmount = 0;
    for (const g of grnItems || []) {
      const accepted = parseFloat(g.qty_accepted || 0);
      const rate = parseFloat(g.unit_rate || 0);
      totalAcceptedQty += accepted;
      totalOrderedQty += parseFloat(g.qty_ordered || 0);
      grnAmount += accepted * rate;
    }

    let matchStatus;
    if (!hasInvoice) {
      matchStatus = "NO_INVOICE";
    } else if (Math.abs(totalAcceptedQty - totalOrderedQty) > 0.001) {
      matchStatus = "QUANTITY_MISMATCH";
    } else if (Math.abs(poAmount - grnAmount) > 0.01) {
      matchStatus = "PRICE_MISMATCH";
    } else {
      matchStatus = "MATCHED";
    }

    const match = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${s}".procurement_matching
        (po_id, po_no, grn_id, grn_no, invoice_ref, match_status, po_amount, grn_amount, invoice_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      grn[0].po_id || null,
      po?.po_no || null,
      grn[0].id,
      grn[0].grn_no,
      grn[0].invoice_ref || null,
      matchStatus,
      poAmount,
      grnAmount,
      hasInvoice ? grnAmount : null
    );

    if (String(grn[0].status) === "APPROVED") {
      const acceptedRows = [];
      for (const g of grnItems || []) {
        const accepted = parseFloat(g.qty_accepted || 0);
        if (accepted <= 0) continue;
        const medicineId = await resolveMedicineId(req, g.item_name);
        acceptedRows.push({
          batch_number: g.batch_number,
          expiry_date: g.expiry_date,
          qty_accepted: accepted,
          unit_rate: parseFloat(g.unit_rate || 0),
          medicine_id: medicineId,
        });
      }
      await insertInwardsFromGrn(req, grn[0], acceptedRows);
    }

    res.json({ match: match[0], grnTotal: grnAmount, poTotal: poAmount });
  } catch (error) { next(error); }
});

// ---- MATCHES ----
router.get("/matches", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".procurement_matching ORDER BY matched_at DESC LIMIT 200`);
    res.json(rows);
  } catch (error) { next(error); }
});

// ---- ROOT ----
router.get("/", async (req, res) => {
  try {
    const s = req.schemaName;
    const [reqs, pos, grns] = await Promise.all([
      req.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "${s}".purchase_requisitions`).catch(() => [{ count: 0 }]),
      req.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "${s}".purchase_orders`).catch(() => [{ count: 0 }]),
      req.prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM "${s}".grn`).catch(() => [{ count: 0 }])
    ]);
    res.json({ ok: true, requisitions: reqs[0]?.count || 0, purchaseOrders: pos[0]?.count || 0, grn: grns[0]?.count || 0 });
  } catch { res.json({ ok: true, requisitions: 0, purchaseOrders: 0, grn: 0 }); }
});

module.exports = router;
module.exports.ensureProcurementInfrastructure = ensureProcurementInfrastructure;
