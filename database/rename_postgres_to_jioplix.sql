-- Run this script in DBeaver while connected to a maintenance database such
-- as `template1` (not the `postgres` database being renamed).
--
-- The connected role must own the `postgres` database or be a PostgreSQL
-- superuser. Stop the application first. On managed services, the role cannot
-- terminate provider-owned superuser processes, so only this role's sessions
-- are terminated.

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'postgres'
  AND pid <> pg_backend_pid()
  AND usename = current_user;

ALTER DATABASE postgres RENAME TO "Jioplix";

-- Optional verification
SELECT datname
FROM pg_database
WHERE datname = 'Jioplix';
