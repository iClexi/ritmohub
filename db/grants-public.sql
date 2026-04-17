-- Ejecutar conectado a la BD `musicapp` con un usuario admin (ej. ritmohub_user).
-- Este script deja a `ritmohub_public` con permisos CRUD de datos,
-- pero sin permisos de DDL (crear/borrar/alterar tablas).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ritmohub_public') THEN
    CREATE ROLE ritmohub_public LOGIN PASSWORD 'pon_una_password_aqui';
  END IF;
END $$;

GRANT CONNECT ON DATABASE musicapp TO ritmohub_public;
GRANT USAGE ON SCHEMA public TO ritmohub_public;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ritmohub_public;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO ritmohub_public;

ALTER DEFAULT PRIVILEGES FOR ROLE ritmohub_user IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ritmohub_public;

ALTER DEFAULT PRIVILEGES FOR ROLE ritmohub_user IN SCHEMA public
GRANT USAGE ON SEQUENCES TO ritmohub_public;

REVOKE CREATE ON SCHEMA public FROM ritmohub_public;
