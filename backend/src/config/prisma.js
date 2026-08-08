const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { dbQueryDuration, dbErrors } = require('./metrics');

let prisma;

// ─── Retry helper for EMAXCONNSESSION / transient pool errors ───────────────
// Supabase Staging pooler is limited to pool_size=15 (session mode).
// When multiple requests or startup tasks hit simultaneously, Prisma returns
// P2010 with EMAXCONNSESSION. Retry up to 3 times with exponential backoff.
async function withRetry(fn, maxAttempts = 3, baseDelayMs = 250) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isPoolError =
        err.code === 'P2010' &&
        (String(err.message || '').includes('EMAXCONNSESSION') ||
          String(err.meta?.driverAdapterError?.message || '').includes('EMAXCONNSESSION'));

      if (!isPoolError || attempt === maxAttempts) throw err;

      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 250ms, 500ms, 1000ms
      console.warn(`[DB] Pool saturated (EMAXCONNSESSION), retry ${attempt}/${maxAttempts} in ${delay}ms…`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

function getPrisma() {
  if (!prisma) {
    console.log('[DB] Lazily Initializing Prisma Client with PG Adapter (SSL Bypass)...');

    const rawUrl = process.env.DATABASE_URL || '';

    // FORCED SSL BYPASS: Required for Vercel → Supabase/Managed DB connectivity
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    const pool = new Pool({
      connectionString: rawUrl,
      ssl: rawUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
      // Keep pool small to avoid saturating Supabase's session-mode limit (15 slots).
      // Each Jioplix process uses max 3 connections; scale horizontally instead.
      max: 3,
      // Release idle connections quickly — frees slots for other requests.
      idleTimeoutMillis: 8000,
      // Fail fast if no connection is available after 5s rather than hanging.
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool client error:', err.message || err);
    });

    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });

    // ── Instrument raw query methods (telemetry + retry) ──────────────────────
    try {
      if (prisma.$queryRawUnsafe) {
        const origQuery = prisma.$queryRawUnsafe.bind(prisma);
        prisma.$queryRawUnsafe = async function (...args) {
          const end = dbQueryDuration.startTimer({ query_type: 'query_raw' });
          try {
            const res = await withRetry(() => origQuery(...args));
            end();
            return res;
          } catch (err) {
            end();
            try { dbErrors.inc({ query_type: 'query_raw', error_type: err.code || 'UNKNOWN' }); } catch (e) {}
            console.error('[DB] $queryRawUnsafe error:', err.message || err);
            throw err;
          }
        };
      }

      if (prisma.$executeRawUnsafe) {
        const origExec = prisma.$executeRawUnsafe.bind(prisma);
        prisma.$executeRawUnsafe = async function (...args) {
          const end = dbQueryDuration.startTimer({ query_type: 'execute_raw' });
          try {
            const res = await withRetry(() => origExec(...args));
            end();
            return res;
          } catch (err) {
            end();
            try { dbErrors.inc({ query_type: 'execute_raw', error_type: err.code || 'UNKNOWN' }); } catch (e) {}
            // Non-fatal schema errors (relation already exists, schema missing) should
            // only warn — they don't affect request handling.
            const nonFatal = ['42P07', '3F000', '23505'];
            if (nonFatal.includes(err.meta?.code) || nonFatal.some(c => String(err.message || '').includes(c))) {
              console.warn('[DB] $executeRawUnsafe warning (non-fatal):', err.message || err);
            } else {
              console.error('[DB] $executeRawUnsafe error:', err.message || err);
            }
            throw err;
          }
        };
      }
    } catch (wrapErr) {
      console.error('[DB] Failed to instrument Prisma methods:', wrapErr.message || wrapErr);
    }
  }
  return prisma;
}

module.exports = {
  get prisma() { return getPrisma(); },
  getPrisma,
  withRetry,
};