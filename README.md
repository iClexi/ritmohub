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

2. Levantar el contenedor:

```bash
sudo docker run -d -p 5155:5155 --name ritmohub iclexi/ritmohub
```

Version con persistencia de logs y cache:

```bash
sudo docker run -d -p 5155:5155 --name ritmohub \
	--env-file .env \
	-v ritmohub_logs:/ritmohub/logs \
	-v ritmohub_next_cache:/ritmohub/.next/cache \
	iclexi/ritmohub sh -c "node server.js 2>&1 | tee -a /ritmohub/logs/ritmohub.log"
```

Version que funciona sola (sin archivo `.env`):

```bash
sudo docker rm -f ritmohub 2>/dev/null || true
sudo docker run -d -p 5155:5155 --name ritmohub \
  -v ritmohub_logs:/ritmohub/logs \
  -v ritmohub_next_cache:/ritmohub/.next/cache \
  iclexi/ritmohub sh -c "node server.js 2>&1 | tee -a /ritmohub/logs/ritmohub.log"
```

Si usas Docker Compose, ya esta configurado en [docker-compose.yml](docker-compose.yml) con los volumenes `ritmohub_logs` y `ritmohub_next_cache`.

3. Abrir en el navegador:

http://localhost:5155

Nota: si usas Windows o no necesitas privilegios de superusuario, puedes ejecutar el mismo comando sin `sudo`.
