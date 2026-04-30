# RitmoHub

RitmoHub es una plataforma social para la comunidad musical. Esta pensada como un punto de encuentro donde artistas, bandas, estudiantes, productores, promotores y fans pueden conectar, compartir proyectos y descubrir nuevas oportunidades dentro de la escena.

La pagina une comunidad, perfiles musicales, eventos, chats, oportunidades laborales y aprendizaje en una experiencia moderna para musicos y amantes de la musica.

## Que Es RitmoHub

RitmoHub funciona como una red social especializada en musica. Cada usuario puede crear su perfil, mostrar su identidad artistica, publicar contenido, participar en conversaciones y conectar con otros talentos.

La plataforma esta disenada para que una persona pueda pasar de descubrir un artista, a escribirle, formar una colaboracion, crear una banda, publicar un evento o acceder a contenido academico desde un mismo lugar.

## Lo Que Ofrece

- Perfiles para artistas, bandas y miembros de la comunidad musical.
- Publicaciones y espacios de conversacion para compartir ideas, avances y experiencias.
- Chats directos y grupales para conectar con otros usuarios.
- Eventos y conciertos con informacion visual, fechas y detalles importantes.
- Oportunidades para musicos, bandas, productores y colaboradores.
- AcademiaX, una seccion enfocada en cursos, aprendizaje y crecimiento musical.
- Espacios para formar bandas, invitar miembros y construir una identidad colectiva.

## Para Quien Es

RitmoHub esta creado para personas que viven la musica desde distintos lugares:

- Artistas que quieren mostrar su trabajo y conectar con su audiencia.
- Bandas que necesitan organizarse, crecer y encontrar nuevos miembros.
- Estudiantes que buscan aprender y desarrollar sus habilidades.
- Productores y promotores que quieren descubrir talento.
- Fans que desean seguir de cerca la escena musical y sus eventos.

## Vision

La vision de RitmoHub es convertirse en un hogar digital para la musica: un lugar donde el talento se vea, las conexiones ocurran de forma natural y cada proyecto tenga mas oportunidades de crecer.

Mas que una pagina, RitmoHub busca ser una comunidad viva para crear, colaborar, aprender y compartir musica.

## Google OAuth

Para activar el boton de Google en login y registro, crea un cliente OAuth de tipo `Web application` en Google Cloud Console y configura:

- `Authorized JavaScript origins`: `http://localhost:5155` para desarrollo y `https://ritmohub.iclexi.tech` para produccion.
- `Authorized redirect URIs`: `http://localhost:5155/api/auth/oauth/google/callback` para desarrollo y `https://ritmohub.iclexi.tech/api/auth/oauth/google/callback` para produccion.
- Variables del servidor: `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

El scope usado por la app es `openid email profile`; no solicita permisos de Drive, Calendar ni otros datos sensibles.
