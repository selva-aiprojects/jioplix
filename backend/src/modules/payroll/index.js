const express = require("express");
const { su } = require("../../middleware/sanitize");
const pdfService = require("../../services/pdfService");
const router = express.Router();

const payrollInfrastructureSynced = new Set();
const payrollInfrastructureLocks = new Map();

async function ensurePayrollInfrastructure(req) {
  const schema = req.schemaName;
  if (!schema || payrollInfrastructureSynced.has(schema)) return;
  if (payrollInfrastructureLocks.has(schema)) return payrollInfrastructureLocks.get(schema);
  const db = req.prisma;
  const q = (sql) => db.$executeRawUnsafe(sql);
  const run = (async () => {
    try {
      await runPayrollDdl(schema, q);
      payrollInfrastructureSynced.add(schema);
    } catch (e) {
      console.error(`[PAYROLL] DDL failed for ${schema}:`, e.message);
      throw e;
    } finally {
      payrollInfrastructureLocks.delete(schema);
    }
  })();
  payrollInfrastructureLocks.set(schema, run);
  return run;
}

async function runPayrollDdl(schema, q) {
  const sq = async (sql) => { try { await q(sql); } catch(e) { /* ignore DDL warnings */ } };
  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".payroll_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    staff_role VARCHAR(50) NOT NULL,
    base_salary NUMERIC(12,2) DEFAULT 0,
    dearness_allowance NUMERIC(12,2) DEFAULT 0,
    house_rent_allowance NUMERIC(12,2) DEFAULT 0,
    other_allowance NUMERIC(12,2) DEFAULT 0,
    incentive_pct NUMERIC(5,2) DEFAULT 0,
    deduction_pct NUMERIC(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);
  await sq(`ALTER TABLE "${schema}".payroll_rules ADD COLUMN IF NOT EXISTS incentive_pct NUMERIC(5,2) DEFAULT 0`);
  await sq(`ALTER TABLE "${schema}".payroll_rules ADD COLUMN IF NOT EXISTS deduction_pct NUMERIC(5,2) DEFAULT 0`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".payroll_statutory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state VARCHAR(100) DEFAULT 'All India',
    pf_pct NUMERIC(5,2) DEFAULT 12,
    esi_pct NUMERIC(5,2) DEFAULT 0.75,
    professional_tax_yearly NUMERIC(10,2) DEFAULT 2400,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_month VARCHAR(10) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'DRAFT',
    generated_by_user_id UUID,
    gross_total NUMERIC(14,2) DEFAULT 0,
    deduction_total NUMERIC(14,2) DEFAULT 0,
    net_total NUMERIC(14,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    finalized_at TIMESTAMP
  )`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".payroll_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    staff_user_id UUID NOT NULL,
    gross_amount NUMERIC(12,2) DEFAULT 0,
    deduction_amount NUMERIC(12,2) DEFAULT 0,
    net_amount NUMERIC(12,2) DEFAULT 0,
    incentive_amount NUMERIC(12,2) DEFAULT 0,
    components JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`CREATE TABLE IF NOT EXISTS "${schema}".payroll_slip_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    staff_user_id UUID NOT NULL,
    label VARCHAR(150) NOT NULL,
    amount NUMERIC(12,2) DEFAULT 0,
    type VARCHAR(20) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await sq(`INSERT INTO "${schema}".payroll_statutory (state, pf_pct, esi_pct, professional_tax_yearly) VALUES
    ('All India', 12.00, 0.75, 2400.00)
    ON CONFLICT (state) DO NOTHING`);

  await sq(`INSERT INTO "${schema}".payroll_rules (name, staff_role, base_salary, dearness_allowance, house_rent_allowance, other_allowance, incentive_pct, deduction_pct) VALUES
    ('Senior Doctor Scale', 'DOCTOR', 120000.00, 15000.00, 25000.00, 10000.00, 5.0, 2.0),
    ('Nurse Clinical Scale', 'NURSE', 35000.00, 5000.00, 8000.00, 4000.00, 2.0, 1.0),
    ('Admin Staff Scale', 'ADMIN', 45000.00, 6000.00, 10000.00, 5000.00, 3.0, 1.5)
    ON CONFLICT (staff_role) DO NOTHING`);
}

router.use(async (req, res, next) => {
  try { await ensurePayrollInfrastructure(req); } catch (e) { console.error("[PAYROLL] ensure failed:", e.message); }
  next();
});

router.get("/ensure", async (req, res) => {
  await ensurePayrollInfrastructure(req);
  const tables = await req.prisma.$queryRawUnsafe(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name LIKE 'payroll_%' ORDER BY table_name`,
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

// ---- RULES ----
router.get("/rules", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".payroll_rules ORDER BY is_active DESC, staff_role ASC`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/rules", async (req, res, next) => {
  try {
    const { name, staffRole, baseSalary, dearnessAllowance, houseRentAllowance, otherAllowance, incentivePct, deductionPct } = req.body;
    if (!name || !staffRole) return res.status(400).json({ error: "name and staffRole are required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".payroll_rules
        (name, staff_role, base_salary, dearness_allowance, house_rent_allowance, other_allowance, incentive_pct, deduction_pct)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      String(name), String(staffRole),
      parseFloat(baseSalary || 0), parseFloat(dearnessAllowance || 0),
      parseFloat(houseRentAllowance || 0), parseFloat(otherAllowance || 0),
      parseFloat(incentivePct || 0), parseFloat(deductionPct || 0)
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.put("/rules/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const numeric = ["base_salary", "dearness_allowance", "house_rent_allowance", "other_allowance", "incentive_pct", "deduction_pct"];
    const sets = []; const params = [];
    const pushNum = (col, val) => { params.push(parseFloat(val || 0)); sets.push(`${col} = $${params.length}`); };
    if (req.body.name !== undefined) { params.push(String(req.body.name)); sets.push(`name = $${params.length}`); }
    if (req.body.staffRole !== undefined) { params.push(String(req.body.staffRole)); sets.push(`staff_role = $${params.length}`); }
    for (const f of numeric) {
      const key = { base_salary: "baseSalary", dearness_allowance: "dearnessAllowance", house_rent_allowance: "houseRentAllowance", other_allowance: "otherAllowance", incentive_pct: "incentivePct", deduction_pct: "deductionPct" }[f];
      if (req.body[key] !== undefined) pushNum(f, req.body[key]);
    }
    if (req.body.isActive !== undefined) { params.push(req.body.isActive === true); sets.push(`is_active = $${params.length}`); }
    if (!sets.length) return res.status(400).json({ error: "Nothing to update" });
    params.push(id);
    sets.push("updated_at = NOW()");
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".payroll_rules SET ${sets.join(", ")} WHERE id::text = $${params.length} RETURNING *`, ...params);
    if (!result[0]) return res.status(404).json({ error: "Rule not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

router.delete("/rules/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const result = await req.prisma.$queryRawUnsafe(
      `DELETE FROM "${req.schemaName}".payroll_rules WHERE id::text = $1 RETURNING id`, id);
    if (!result[0]) return res.status(404).json({ error: "Rule not found" });
    res.json({ ok: true, id: result[0].id });
  } catch (error) { next(error); }
});

// ---- STATUTORY ----
router.get("/statutory", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".payroll_statutory ORDER BY is_active DESC, state ASC`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post("/statutory", async (req, res, next) => {
  try {
    const { state, pfPct, esiPct, professionalTaxYearly } = req.body;
    if (!state) return res.status(400).json({ error: "state is required" });
    const result = await req.prisma.$queryRawUnsafe(
      `INSERT INTO "${req.schemaName}".payroll_statutory (state, pf_pct, esi_pct, professional_tax_yearly)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      String(state), parseFloat(pfPct || 0), parseFloat(esiPct || 0), parseFloat(professionalTaxYearly || 0)
    );
    res.status(201).json(result[0]);
  } catch (error) { next(error); }
});

router.put("/statutory/:id", async (req, res, next) => {
  try {
    const id = su(req.params.id);
    const sets = []; const params = [];
    const map = { state: "state", pfPct: "pf_pct", esiPct: "esi_pct", professionalTaxYearly: "professional_tax_yearly" };
    for (const [k, col] of Object.entries(map)) {
      if (req.body[k] !== undefined) {
        params.push(["pf_pct", "esi_pct", "professional_tax_yearly"].includes(col) ? parseFloat(req.body[k]) : String(req.body[k]));
        sets.push(`${col} = $${params.length}`);
      }
    }
    if (!sets.length) return res.status(400).json({ error: "Nothing to update" });
    params.push(id);
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".payroll_statutory SET ${sets.join(", ")} WHERE id::text = $${params.length} RETURNING *`, ...params);
    if (!result[0]) return res.status(404).json({ error: "Statutory config not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

// ---- RUN GENERATION ----
async function computeStaffPayroll(req, month) {
  const s = req.schemaName;
  const start = `${month}-01`;
  const rules = await req.prisma.$queryRawUnsafe(
    `SELECT * FROM "${s}".payroll_rules WHERE is_active = TRUE`);
  const stat = await req.prisma.$queryRawUnsafe(
    `SELECT * FROM "${s}".payroll_statutory WHERE is_active = TRUE ORDER BY created_at ASC LIMIT 1`);
  const statRow = stat[0] || { pf_pct: 12, esi_pct: 0.75, professional_tax_yearly: 2400 };

  const staff = await req.prisma.$queryRawUnsafe(
    `SELECT u.id, u.name, u.role, u.email
     FROM "${s}".users u WHERE u.is_active = TRUE`);

  const doctorIncentive = await req.prisma.$queryRawUnsafe(
    `SELECT e.doctor_id, SUM(i.total)::float AS bill_total
     FROM "${s}".invoices i
     JOIN "${s}".encounters e ON i.encounter_id = e.id
     WHERE i.created_at >= $1::date AND i.created_at < ($1::date + INTERVAL '1 month')
       AND i.status = 'PAID'
     GROUP BY e.doctor_id`,
    start
  );
  const incentiveMap = {};
  (doctorIncentive || []).forEach((d) => { incentiveMap[d.doctor_id] = parseFloat(d.bill_total || 0); });

  const items = [];
  for (const u of staff) {
    const rule = rules.find((r) => r.staff_role.toLowerCase() === String(u.role || "").toLowerCase())
      || rules.find((r) => r.staff_role.toLowerCase() === "staff")
      || { base_salary: 0, dearness_allowance: 0, house_rent_allowance: 0, other_allowance: 0, incentive_pct: 0, deduction_pct: 0 };

    const base = parseFloat(rule.base_salary || 0);
    const da = parseFloat(rule.dearness_allowance || 0);
    const hra = parseFloat(rule.house_rent_allowance || 0);
    const oth = parseFloat(rule.other_allowance || 0);
    const incentive = (incentiveMap[u.id] || 0) * (parseFloat(rule.incentive_pct || 0) / 100);

    const gross = base + da + hra + oth + incentive;
    const pf = Math.min(base, 15000) * (parseFloat(statRow.pf_pct || 0) / 100);
    const esi = gross * (parseFloat(statRow.esi_pct || 0) / 100);
    const pt = (parseFloat(statRow.professional_tax_yearly || 0) / 12);
    const extra = gross * (parseFloat(rule.deduction_pct || 0) / 100);
    const deductions = pf + esi + pt + extra;
    const net = gross - deductions;

    const components = [
      { label: "Basic Salary", amount: base, type: "EARNING" },
      { label: "Dearness Allowance", amount: da, type: "EARNING" },
      { label: "House Rent Allowance", amount: hra, type: "EARNING" },
      { label: "Other Allowance", amount: oth, type: "EARNING" },
    ];
    if (incentive > 0) components.push({ label: "Doctor Incentive (Billing Share)", amount: incentive, type: "EARNING" });
    components.push({ label: "Provident Fund", amount: pf, type: "DEDUCTION" });
    components.push({ label: "ESI", amount: esi, type: "DEDUCTION" });
    components.push({ label: "Professional Tax", amount: pt, type: "DEDUCTION" });
    if (extra > 0) components.push({ label: "Deductions", amount: extra, type: "DEDUCTION" });

    items.push({ user: u, gross, deductions, net, incentive, components });
  }
  return { items, statRow };
}

router.get("/runs", async (req, res, next) => {
  try {
    const rows = await req.prisma.$queryRawUnsafe(
      `SELECT r.*, u.name AS generated_by_name,
              (SELECT COUNT(*)::int FROM "${req.schemaName}".payroll_items i WHERE i.run_id = r.id) AS employee_count
       FROM "${req.schemaName}".payroll_runs r
       LEFT JOIN "${req.schemaName}".users u ON r.generated_by_user_id = u.id
       ORDER BY r.run_month DESC LIMIT 100`);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get("/runs/:month", async (req, res, next) => {
  try {
    const month = String(req.params.month);
    const run = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".payroll_runs WHERE run_month = $1 LIMIT 1`, month);
    if (!run[0]) return res.status(404).json({ error: "Payroll run not found" });
    const items = await req.prisma.$queryRawUnsafe(
      `SELECT i.*, u.name AS staff_name, u.role AS staff_role, u.email, u.department
       FROM "${req.schemaName}".payroll_items i
       LEFT JOIN "${req.schemaName}".users u ON i.staff_user_id = u.id
       WHERE i.run_id = $1 ORDER BY u.name ASC`, run[0].id);
    res.json({ ...run[0], items });
  } catch (error) { next(error); }
});

router.post("/runs/:month/generate", async (req, res, next) => {
  try {
    const month = String(req.params.month);
    if (!/^\d{4}-\d{2}$/.test(month)) return res.status(400).json({ error: "run_month must be YYYY-MM" });
    const existing = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".payroll_runs WHERE run_month = $1 LIMIT 1`, month);
    if (existing[0] && existing[0].status === "FINALIZED") {
      return res.status(409).json({ error: "Run already finalized" });
    }

    const { items } = await computeStaffPayroll(req, month);
    const generatedBy = await getCurrentUserId(req);
    let runId = existing[0]?.id || null;

    if (!runId) {
      const run = await req.prisma.$queryRawUnsafe(
        `INSERT INTO "${req.schemaName}".payroll_runs (run_month, status, generated_by_user_id)
         VALUES ($1, 'DRAFT', $2) RETURNING *`, month, generatedBy || null);
      runId = run[0].id;
    } else {
      await req.prisma.$executeRawUnsafe(
        `DELETE FROM "${req.schemaName}".payroll_slip_items WHERE run_id = $1`, runId);
      await req.prisma.$executeRawUnsafe(
        `DELETE FROM "${req.schemaName}".payroll_items WHERE run_id = $1`, runId);
    }

    let grossTotal = 0, deductionTotal = 0, netTotal = 0;
    for (const it of items) {
      const ins = await req.prisma.$queryRawUnsafe(
        `INSERT INTO "${req.schemaName}".payroll_items
          (run_id, staff_user_id, gross_amount, deduction_amount, net_amount, incentive_amount, components)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        runId, it.user.id, it.gross, it.deductions, it.net, it.incentive, JSON.stringify(it.components)
      );
      grossTotal += it.gross; deductionTotal += it.deductions; netTotal += it.net;
      for (const comp of it.components) {
        await req.prisma.$executeRawUnsafe(
          `INSERT INTO "${req.schemaName}".payroll_slip_items (run_id, staff_user_id, label, amount, type, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          runId, it.user.id, comp.label, comp.amount, comp.type, ins[0].id !== undefined ? 0 : 0
        );
      }
    }

    await req.prisma.$executeRawUnsafe(
      `UPDATE "${req.schemaName}".payroll_runs
       SET gross_total = $1, deduction_total = $2, net_total = $3
       WHERE id = $4`,
      grossTotal, deductionTotal, netTotal, runId
    );

    const result = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".payroll_runs WHERE id = $1`, runId);
    res.json({ ...result[0], employees: items.length });
  } catch (error) { next(error); }
});

router.post("/runs/:month/finalize", async (req, res, next) => {
  try {
    const month = String(req.params.month);
    const result = await req.prisma.$queryRawUnsafe(
      `UPDATE "${req.schemaName}".payroll_runs
       SET status = 'FINALIZED', finalized_at = NOW()
       WHERE run_month = $1 RETURNING *`, month);
    if (!result[0]) return res.status(404).json({ error: "Run not found" });
    res.json(result[0]);
  } catch (error) { next(error); }
});

// ---- PAYSLIP ----
router.get("/runs/:month/slips/:staffId", async (req, res, next) => {
  try {
    const month = String(req.params.month);
    const staffId = su(req.params.staffId);
    const run = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".payroll_runs WHERE run_month = $1 LIMIT 1`, month);
    if (!run[0]) return res.status(404).json({ error: "Run not found" });
    const item = await req.prisma.$queryRawUnsafe(
      `SELECT i.*, u.name AS staff_name, u.role AS staff_role, u.department, u.email
       FROM "${req.schemaName}".payroll_items i
       LEFT JOIN "${req.schemaName}".users u ON i.staff_user_id = u.id
       WHERE i.run_id = $1 AND i.staff_user_id::text = $2 LIMIT 1`, run[0].id, staffId);
    if (!item[0]) return res.status(404).json({ error: "Payslip not found" });
    const slipItems = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".payroll_slip_items
       WHERE run_id = $1 AND staff_user_id::text = $2 ORDER BY type ASC, sort_order ASC, created_at ASC`, run[0].id, staffId);
    res.json({ ...item[0], run: run[0], slipItems });
  } catch (error) { next(error); }
});

router.get("/runs/:month/slips/:staffId/pdf", async (req, res, next) => {
  try {
    const month = String(req.params.month);
    const staffId = su(req.params.staffId);
    const run = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".payroll_runs WHERE run_month = $1 LIMIT 1`, month);
    if (!run[0]) return res.status(404).json({ error: "Run not found" });
    const item = await req.prisma.$queryRawUnsafe(
      `SELECT i.*, u.name AS staff_name, u.role AS staff_role, u.department, u.email
       FROM "${req.schemaName}".payroll_items i
       LEFT JOIN "${req.schemaName}".users u ON i.staff_user_id = u.id
       WHERE i.run_id = $1 AND i.staff_user_id::text = $2 LIMIT 1`, run[0].id, staffId);
    if (!item[0]) return res.status(404).json({ error: "Payslip not found" });
    const slipItems = await req.prisma.$queryRawUnsafe(
      `SELECT * FROM "${req.schemaName}".payroll_slip_items
       WHERE run_id = $1 AND staff_user_id::text = $2 ORDER BY type ASC, sort_order ASC, created_at ASC`, run[0].id, staffId);
    const tenantName = req.tenantName || "Hospital";
    const buffer = await pdfService.createPayslipPDF(tenantName, item[0], run[0], slipItems, req.tenantId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="payslip-${month}-${item[0].staff_name || staffId}.pdf"`);
    res.send(buffer);
  } catch (error) { next(error); }
});

// ---- ANALYTICS ----
router.get("/analytics", async (req, res, next) => {
  try {
    const s = req.schemaName;
    const [summary, monthTrend, roleBreakdown] = await Promise.all([
      req.prisma.$queryRawUnsafe(`
        SELECT COALESCE(SUM(gross_total),0)::float AS gross_total,
               COALESCE(SUM(deduction_total),0)::float AS deduction_total,
               COALESCE(SUM(net_total),0)::float AS net_total,
               COUNT(*)::int AS runs
        FROM "${s}".payroll_runs`),
      req.prisma.$queryRawUnsafe(`SELECT run_month, net_total, status FROM "${s}".payroll_runs ORDER BY run_month DESC LIMIT 12`),
      req.prisma.$queryRawUnsafe(`
        SELECT u.role, COUNT(*)::int AS employees, COALESCE(SUM(i.net_amount),0)::float AS net_payable
        FROM "${s}".payroll_items i JOIN "${s}".users u ON i.staff_user_id = u.id
        GROUP BY u.role ORDER BY net_payable DESC`),
    ]);
    res.json({ summary: summary[0], monthTrend, roleBreakdown });
  } catch (error) { next(error); }
});

module.exports = router;
module.exports.ensurePayrollInfrastructure = ensurePayrollInfrastructure;
