Tenant subdomain setup for Jioplix

Overview
- This document explains how to configure tenant-specific subdomains so each tenant can access the application at `<<tenant>>.jioplix.com`.

Requirements
- Your DNS provider must support wildcard A/CNAME records (e.g. `*.jioplix.com`).
- Hosting (Vercel, Netlify, a VPS) should be configured to accept requests for the wildcard domain and route them to the SPA/backend.
- Backend must be able to inspect the Host header to resolve tenant from subdomain (server middleware already implemented).

Production (recommended)
1. Create a wildcard DNS record:
   - A record: `*.jioplix.com` -> IP address of your server or load balancer.
   - Or CNAME: `*` -> `your-app.vercel.app` (if using Vercel with a custom domain).
2. Configure your hosting:
   - Vercel: add `jioplix.com` as a domain and enable `*.jioplix.com` wildcard.
   - Ensure SSL is enabled for the wildcard domain (Vercel/Cloudflare will provision certs automatically).
3. Ensure backend uses `Host` header to resolve tenant domain. The backend already looks up `domain` in `nexus.tenants`.
4. Tenants should have `domain` set (in registry) to their subdomain label (e.g. `city-clinic`).

Staging / Local testing
Option A — hosts file (quick):
- Edit your OS hosts file (requires admin/root):
  - Windows: `C:\Windows\System32\drivers\etc\hosts`
  - macOS / Linux: `/etc/hosts`
- Add entries for each tenant you want to test:
  ```text
  127.0.0.1 city-clinic.jioplix.local
  127.0.0.1 metro-diag.jioplix.local
  ```
- Set `VITE_APP_DOMAIN=jioplix.local` in `client/.env` (or in your shell) so the frontend constructs tenant links using that root.
- Start backend and frontend locally and open `http://city-clinic.jioplix.local:5173` (or the port your dev server runs on).

Option B — mkcert for HTTPS (recommended when your app requires secure cookies):
- Install `mkcert` and generate a local CA, then create certs for `*.jioplix.local`.
- Configure your dev server or reverse proxy (nginx) to use the certs and serve requests for `*.jioplix.local`.

Notes
- The backend will fall back to `x-tenant-id` header, query param, or explicit tenant code if a subdomain is not present.
- For CI/staging, create a set of concrete subdomain DNS records (e.g., `city-clinic.staging.jioplix.com`) or use a wildcard for the staging domain.

Troubleshooting
- If tenant doesn't resolve, ensure the `domain` column in `nexus.tenants` has the tenant label and is unique.
- Check `Host` header arriving at the backend and confirm CORS allows the origin.
- For browser blocking on insecure cookies, use HTTPS locally (mkcert) or adjust cookie settings for dev only.

If you want, I can produce a small PowerShell script to automate adding Windows hosts entries for a list of tenants.
