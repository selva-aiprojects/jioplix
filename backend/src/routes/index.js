const express = require("express");
const authRoutes = require("../modules/auth");
const nexusRoutes = require("../modules/nexus");
const tenantRoutes = require("../modules/tenant");
const patientRoutes = require("../modules/patient");
const appointmentRoutes = require("../modules/appointment");
const consultationRoutes = require("../modules/consultation");
const billingRoutes = require("../modules/billing");
const doctorRoutes = require("../modules/doctor");
const insuranceRoutes = require("../modules/insurance");
const abhaRoutes = require("../modules/abha");
const helpdeskRoutes = require("../modules/helpdesk");
const { auth } = require("../middleware/auth");
const { tenant } = require("../middleware/tenant");
const publicRoutes = require("../modules/public");

const hospitalRoutes = require("../modules/hospital");

const remindersRoutes = require("../modules/communication/reminders");
const payrollRoutes = require("../modules/payroll");
const hrmsRoutes = require("../modules/hrms");
const analyticsRoutes = require("../modules/analytics");
const procurementRoutes = require("../modules/procurement");
const crmRoutes = require("../modules/crm");
const financeRoutes = require("../modules/finance");
const inventoryRoutes = require("../modules/inventory");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/nexus", nexusRoutes);
router.use("/hospital", auth, tenant, hospitalRoutes);
router.use("/tenants", auth, tenant, tenantRoutes);
router.use("/patients", auth, tenant, patientRoutes);
router.use("/appointments", auth, tenant, appointmentRoutes);
router.use("/consultations", auth, tenant, consultationRoutes);
router.use("/billing", auth, tenant, billingRoutes);
router.use("/insurance", auth, tenant, insuranceRoutes);
router.use("/doctor", auth, tenant, doctorRoutes);
router.use("/doctors", auth, tenant, doctorRoutes);
router.use("/abha", auth, tenant, abhaRoutes);
router.use("/reminders", auth, tenant, remindersRoutes);
router.use("/helpdesk", auth, tenant, helpdeskRoutes);
router.use("/payroll", auth, tenant, payrollRoutes);
router.use("/hrms", auth, tenant, hrmsRoutes);
router.use("/analytics", auth, tenant, analyticsRoutes);
router.use("/procurement", auth, tenant, procurementRoutes);
router.use("/crm", auth, tenant, crmRoutes);
router.use("/finance", auth, tenant, financeRoutes);
router.use("/inventory", auth, tenant, inventoryRoutes);
// Public endpoints that require tenant identification but no user auth
router.use('/public', tenant, publicRoutes);
router.get("/health-db", async (req, res) => {
  try {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const { Pool } = require('pg');
    const { dbQueryDuration, dbErrors } = require('../config/metrics').metrics || require('../config/metrics');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : false });
    const end = dbQueryDuration ? dbQueryDuration.startTimer({ query_type: 'health_check' }) : () => {};
    try {
      const result = await pool.query('SELECT current_schema(), now()');
      if (end) end();
      await pool.end();
      res.json({ status: "ok", db: "Raw Connection Success", details: result.rows[0] });
    } catch (err) {
      if (end) end();
      try { dbErrors && dbErrors.inc({ query_type: 'health_check', error_type: err.code || 'UNKNOWN' }); } catch(e){}
      await pool.end().catch(()=>{});
      res.status(500).json({ status: 'error', error: err.message });
    }
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

module.exports = router;