# musisec-network (RitmoHub)

Aplicacion Next.js self-hosted: cada usuario ejecuta el contenedor en su PC (`localhost:5155`) y todos usan una base PostgreSQL central en VPS.

## Arquitectura objetivo

- App: Docker en PCs de usuarios
- DB central: PostgreSQL 16 en VPS Ubuntu
- Host DB: `206.189.224.149`
- Base de datos: `musicapp`

## Variables de entorno (app)

Usa `.env` con:

```env
DB_HOST=206.189.224.149
DB_PORT=5432
DB_USER=ritmohub_public
DB_PASSWORD=pon_una_password_aqui
DB_NAME=musicapp
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_INIT_SCHEMA=false
```

O en una sola URL:

```env
DATABASE_URL=postgresql://ritmohub_public:pon_una_password_aqui@206.189.224.149:5432/musicapp
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_INIT_SCHEMA=false
```

`DB_INIT_SCHEMA=false` evita DDL desde la app (requerido si `ritmohub_public` no tiene permisos de crear/alterar tablas).

## Esquema de base de datos

La app usa estas tablas:

- `users`
- `media_uploads`
- `sessions`
- `posts`
- `likes`
- `concerts`
- `forum_posts`
- `forum_comments`
- `chat_threads`
- `chat_messages`
- `jobs`
- `job_applications`
- `courses`
- `course_purchases`

Script completo: `db/init.sql`

## Setup en VPS (admin)

1. Crear base/usuario admin (si no existen).
2. Ejecutar esquema:

```bash
psql -h 206.189.224.149 -U ritmohub_user -d musicapp -f db/init.sql
```

3. Aplicar permisos de app pública:

```bash
psql -h 206.189.224.149 -U ritmohub_user -d musicapp -f db/grants-public.sql
```

Script de permisos: `db/grants-public.sql`

## Docker para distribución

El `docker-compose.yml` está pensado para usuarios finales consumiendo imagen de Docker Hub.

Archivo: `docker-compose.yml`

> Cambia `yourdockerhubuser/musisec-network:latest` por tu repositorio real.

### Ejecutar usuario final

```bash
docker compose pull
docker compose up -d
```

## Publicar imagen a Docker Hub

Desde este proyecto:

```bash
docker build -t yourdockerhubuser/musisec-network:latest .
docker login
docker push yourdockerhubuser/musisec-network:latest
```

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:5155`.
