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

3. Abrir en el navegador:

http://localhost:5155
