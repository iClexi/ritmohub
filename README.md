# RitmoHub

RitmoHub es una plataforma social para musica donde artistas, bandas y fans pueden conectar en un solo lugar.

La pagina incluye espacios para:

- Perfiles de artistas y bandas
- Publicaciones y foro comunitario
- Chats entre usuarios
- Eventos y conciertos con flyers
- Cursos y contenido academico

## Como correr RitmoHub con Docker y PostgreSQL local

1. Crear el archivo `.env` desde el ejemplo:

```bash
cp .env.example .env
```

Edita `.env` y cambia como minimo:

```env
DB_PASSWORD=una_password_segura
NEXT_PUBLIC_APP_URL=http://tu-dominio-o-ip:5155
```

2. Levantar app y base de datos en el mismo servidor:

```bash
docker compose up -d --build
```

Esto crea dos contenedores:

- `ritmohub`: la aplicacion Next.js en el puerto `5155`.
- `ritmohub-postgres`: PostgreSQL 16 en la red interna de Docker.

Los datos de PostgreSQL quedan persistidos en el volumen Docker `ritmohub_postgres_data`.

3. Abrir en el navegador:

```text
http://localhost:5155
```

En un servidor publico, pon Nginx, Caddy o Traefik delante de `5155` y usa HTTPS.

## Variables importantes

Para Docker Compose, la app usa PostgreSQL por nombre de servicio:

```env
DATABASE_URL=
DB_HOST=postgres
DB_PORT=5432
DB_USER=ritmohub_user
DB_PASSWORD=una_password_segura
DB_NAME=musicapp
DB_SSL=false
DB_INIT_SCHEMA=true
```

Si ejecutas la app sin Docker pero con PostgreSQL instalado en el mismo servidor, usa:

```env
DB_HOST=127.0.0.1
DB_SSL=false
```

## Migrar datos desde la base anterior

Si necesitas llevar los datos de la base remota actual al PostgreSQL local, haz un backup desde el servidor viejo y restauralo en el nuevo:

```bash
pg_dump -h HOST_VIEJO -U USUARIO_VIEJO -d musicapp -Fc -f ritmohub.dump
pg_restore -h 127.0.0.1 -U ritmohub_user -d musicapp --clean --if-exists ritmohub.dump
```

Importante: los archivos subidos por usuarios tambien viven en PostgreSQL, en la tabla `media_uploads`, asi que el backup debe incluir datos.

## Seeds

Las rutas `/api/seed/admin` y `/api/seed/users` quedan deshabilitadas por defecto. Si necesitas usarlas temporalmente:

```env
ENABLE_SEED_ROUTES=true
ADMIN_SEED_PASSWORD=una_password_admin_segura
SEED_USERS_PASSWORD=una_password_temporal_segura
```

Despues de crear los datos seed, vuelve a dejar `ENABLE_SEED_ROUTES=false` y reinicia la app.
