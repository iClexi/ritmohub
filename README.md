# RitmoHub

RitmoHub es una plataforma social para musica donde artistas, bandas y fans pueden conectar en un solo lugar.

La pagina incluye espacios para:

- Perfiles de artistas y bandas
- Publicaciones y foro comunitario
- Chats entre usuarios
- Eventos y conciertos con flyers
- Cursos y contenido academico

## Como correr RitmoHub con Docker

1. Descargar la imagen:

```bash
docker pull iclexi/ritmohub
```

2. Levantar contenedor con logs de volumenes persistentes (Linux)
```bash
sudo docker rm -f ritmohub 2>/dev/null || true && \
sudo docker run -d -p 5155:5155 --name ritmohub \
  --user root \
  -v ritmohub_logs:/ritmohub/logs \
  -v ritmohub_next_cache:/ritmohub/.next/cache \
  iclexi/ritmohub sh -c "mkdir -p /ritmohub/logs && chmod -R 777 /ritmohub/logs && node server.js 2>&1 | tee -a /ritmohub/logs/ritmohub.log" && \
sudo docker logs -f ritmohub
```
3. Levantar contenedor en Windows (Volumen persistente siempre presente por la DB en el VPS)
```bas
docker run -d -p 5155:5155 --name ritmohub iclexi/ritmohub
```
4.Levantar contenedor en Windows (Volumen persistente siempre presente por la DB en el VPS)
```bas
docker rm -f ritmohub 2>nul && docker run -d -p 5155:5155 --name ritmohub --user root -v ritmohub_logs:/ritmohub/logs -v ritmohub_next_cache:/ritmohub/.next/cache iclexi/ritmohub sh -c "mkdir -p /ritmohub/logs && chmod -R 777 /ritmohub/logs && node server.js 2>&1 | tee -a /ritmohub/logs/ritmohub.log" && docker logs -f ritmohub
Si usas Docker Compose, ya esta configurado en [docker-compose.yml](docker-compose.yml) con los volumenes `ritmohub_logs` y `ritmohub_next_cache`.
```
3. Abrir en el navegador:

http://localhost:5155
