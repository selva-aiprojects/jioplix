-- Run in DBeaver while connected to `template1`, not `postgres`.
-- Enable auto-commit: CREATE DATABASE cannot run inside a transaction.
-- Stop the application before running this script. Do not run this together
-- with rename_postgres_to_jioplix.sql.
--
-- The connected role requires the CREATEDB privilege. This retains `postgres`
-- unchanged and creates an independent, full copy named `Jioplix`.

-- Disconnect sessions owned by the current role from the template database.
-- Managed-service superuser sessions are deliberately left untouched.
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'postgres'
  AND pid <> pg_backend_pid()
  AND usename = current_user;

CREATE DATABASE "Jioplix"
WITH TEMPLATE postgres;

-- Verify the cloned database is present.
SELECT datname
FROM pg_database
WHERE datname = 'Jioplix';
