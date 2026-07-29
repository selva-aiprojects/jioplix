ARCHITECT PROPOSAL: Subdomain Access, DNS, Vercel, and Docker Options

Purpose
- Provide a technical brief for discussion with your Solutions/Infrastructure Architect.
- Describe current implementation, required DNS/hosting changes, containerization options (local and production), security and rollout steps.

Current state (repo)
- Backend: Express + Prisma. Tenant middleware resolves tenant using `Host` header. Self-heal writes `domain` column. Seed/provision sets `domain` when creating tenants.
- Frontend: SPA built with Vite. Tenants list includes an "Open" button that opens `https://<domain>.jioplix.com` (uses `domain` or `code`).
- Deployment: Frontend and backend configured for Vercel (project has `vercel.json` and some serverless-friendly structure). No Dockerfiles or docker-compose in repo.
- DNS: `APP_DOMAIN=jioplix.com` in `.env`. GoDaddy currently has `@ → 76.76.21.21` (Vercel IP) and `www → cname.vercel-dns.com`. Wildcard `*` CNAME to `cname.vercel-dns.com` is needed to route tenant subdomains.

Goals
1. Users access each tenant directly via `https://<tenant>.jioplix.com`.
2. Minimal code changes. Prefer infra and DNS changes where possible.
3. Local developer experience that mirrors production (subdomain testing, HTTPS).
4. Clear production deployment path (Vercel or container host), with secure DB credentials and rollback plan.

High-level options (pros/cons)

Option 1 — Vercel (recommended short-term)
- Architecture: Frontend SPA + backend serverless/APIs on Vercel. DNS wildcard `*.jioplix.com` -> `cname.vercel-dns.com`.
- Pros: Fast, automatic SSL provisioning, minimal infra work. Vercel handles static+API routing and certs for wildcard domains after verification.
- Cons: Not suited for long-running background processes or complex stateful services. Cannot run docker-compose on Vercel.
- When to choose: Keep existing Vercel deployment. Use wildcard DNS and ensure tenant `domain` values exist.

Option 2 — Local Docker Compose (for dev/test only)
- Architecture: `docker-compose` with Postgres, pgAdmin, backend container, frontend dev server, nginx reverse proxy (with host-based routing) + mkcert for local HTTPS.
- Pros: Reproducible dev environment; realistic subdomain testing; good for QA before changing production DB/tenants.
- Cons: Not for Vercel production; adds local complexity but optional for dev team.
- When to choose: Development and staging environments; onboarding new engineers.

Option 3 — Containerized production backend (Render/Fly/Cloud Run/Railway)
- Architecture: Build Docker image for backend, host on a container platform; frontend continues on Vercel or served from same host. Use managed Postgres (Supabase) or move to a container-hosted DB.
- Pros: Full control, supports long-running processes, easier to run migrations, host-side routing for subdomains.
- Cons: More ops effort (deploy pipelines, autoscaling, monitoring). Need to manage SSL and domain routing or use provider integrations.
- When to choose: If backend needs to run as a persistent service (not serverless) or Vercel limitations are blocking features.

Recommended immediate path
1. Apply wildcard DNS in GoDaddy: add CNAME `*` → `cname.vercel-dns.com` and verify `jioplix.com` + `*.jioplix.com` in Vercel.
2. Ensure all tenant rows have `domain` populated (we added server logic and provided SQL for updates). Verify no uniqueness collisions.
3. Test a few tenant subdomains after DNS propagation and Vercel SSL issuance.
4. For local development, add a `docker-compose` dev stack (Postgres, backend container, nginx proxy) — optional but recommended.

Detailed steps

A. DNS & Vercel verification
- In GoDaddy DNS for `jioplix.com`:
  - A record: `@` -> `76.76.21.21` (Vercel)
  - CNAME: `www` -> `cname.vercel-dns.com`
  - CNAME: `*` -> `cname.vercel-dns.com`
  - Add TXT record if Vercel asks for domain verification.
- In Vercel dashboard -> Domains: Add `jioplix.com` and `*.jioplix.com`. Follow verification instructions. Wait for SSL issuance.

B. DB: tenant `domain` values
- Run preview SELECT for missing or conflicting `domain` values.
- Update domain values for existing tenants using provided SQL (we prepared atomic updates). Example:
  - `UPDATE nexus.tenants SET domain = code WHERE domain IS NULL OR domain = '';`
- Verify uniqueness with: `SELECT domain, count(*) FROM nexus.tenants GROUP BY domain HAVING count(*) > 1;`

C. Backend verification
- `tenant` middleware reads `req.headers.host`, extracts subdomain, looks up `nexus.tenants.domain` and sets `req.schemaName`.
- Confirm middleware applied for public endpoints that should accept tenant-based access.

D. Frontend
- `client/src/config/api.ts` uses same-origin when host includes `jioplix` or vercel, so requests from `tenant.jioplix.com` will go to same origin.
- Confirm cookie and CORS settings: cookies set on root domain or tenant subdomain as needed; backend CORS already allows subdomains.

E. Local dev using Docker (optional but recommended)
- Provide `docker-compose.yml` with services:
  - `postgres` (image: postgres:15)
  - `pgadmin` (optional)
  - `backend` (build from `backend/` Dockerfile)
  - `frontend` (Vite dev server or static preview)
  - `proxy` (nginx) configured with host-based virtual hosts using `server_name ~^(?<subdomain>[^.]+)\.jioplix.local$;` and reverse proxy to the backend/frontend.
- Use `mkcert` to generate certs for `*.jioplix.local` and configure nginx to present them.
- Use hosts file locally to map `*.jioplix.local` subdomains to `127.0.0.1` via entries (or use `dnsmasq` to wildcard map).

F. Production container hosting option (if required)
- Create `Dockerfile` for backend (Node + app). Build images in CI.
- Deploy to Render / Fly / Cloud Run with `JIoplix` domain attached. Use platform-provided certs and wildcards.
- Use managed database (Supabase) or move DB to provider that supports private networking.

Security & operational notes
- Rotate DB password (you mentioned rotating now). After rotation, update `DATABASE_URL` in Vercel environment variables and redeploy backend.
- Use environment variables in Vercel (not `.env` file) for production secrets.
- Limit database public access: allow only trusted CIDRs or use VPC peering when available.
- Ensure `domain` column is unique — server self-heal enforces unique constraint.
- Monitor SSL issuance and DNS propagation; add synthetic health checks.

Testing and rollout
1. Staging: add a staging wildcard domain (e.g., `*.staging.jioplix.com`) and test tenant subdomains there first.
2. Smoke test: open `https://<tenant>.jioplix.com` and verify frontend loads, API calls include `x-tenant-id` or host-based resolution, and user logins map to the right schema.
3. Canary: switch small set of tenants to subdomain URLs and monitor logs/metrics.
4. Full rollout once confident.

Questions for the Architect
- Do we want tenant portals to be served from the same Vercel project (same origin) or separate projects per tenant? Tradeoffs: single origin simplifies CORS and hosting, multiple projects provide stronger isolation.
- Do we need persistent background workers or long‑running services that disqualify serverless (Vercel) and favor container hosting?
- What is the preferred production container host if we move off Vercel for backend (Render, Fly, Cloud Run, ECS)?
- Are there strict network/security controls (IP allowlists, private VPC DB) that force us to choose container host with VPC support?
- Desired rollback and backup RPO/RTO for DB migrations.

Deliverables I can produce next
- `docker-compose.yml` + `Dockerfile` for `backend` and `proxy` + README for local dev (mkcert + hosts entries). (Estimated 2–4 hrs)
- `Dockerfile` + CI workflow for building/pushing backend image and Render/Fly/Cloud Run deployment docs. (Estimated 3–6 hrs)
- SQL migration / Prisma migration for adding `domain` to `Tenant` model (if you prefer tracked schema change). (30–60 min)

Files created
- This document: `docs/ARCHITECT_PROPOSAL_SUBDOMAIN_DOCKER.md`

Next step
- Review this with your Architect and tell me which option to implement; I can then scaffold Docker files or prepare Vercel verification steps.

