const { Pool } = require("pg");
(async () => {
  const pool = new Pool({ connectionString: "postgresql://postgres.qnrypqwgxpmrlxanvbwq:hmis%4020-20-20@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require&schema=nexus", ssl: { rejectUnauthorized: false } });
  const s = "kkcth";
  try {
    const cols = await pool.query(
      `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name IN ('duty_shifts','duty_roster','roster_swaps','attendance','staff_credentials','staff_privileges','on_call_duty') ORDER BY table_name`,
      [s]
    );
    console.log("EXISTING COLS:", JSON.stringify(cols.rows));
  } catch (e) { console.error("QUERY ERR:", e.message); }
  await pool.end();
})().catch((e) => { console.error("FATAL", e.message); process.exit(1); });
