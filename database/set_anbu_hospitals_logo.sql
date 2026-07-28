-- Run after deploying client/public/anbu-hospitals-logo-v2.png.
-- This updates only the tenant named `Anbu Hospitals`.

UPDATE nexus.tenants
SET ui_settings = jsonb_set(
  COALESCE(ui_settings, '{}'::jsonb),
  '{logoUrl}',
  to_jsonb('/anbu-hospitals-logo-v2.png'::text),
  true
)
WHERE LOWER(name) = 'anbu hospitals';

-- Confirm that exactly one tenant received the branding URL.
SELECT name, ui_settings ->> 'logoUrl' AS logo_url
FROM nexus.tenants
WHERE LOWER(name) = 'anbu hospitals';
