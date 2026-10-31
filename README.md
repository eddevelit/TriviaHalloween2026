# La última función

Trivia web de películas de terror, cultura popular y memes para una fiesta de Halloween. Se juega por turnos en una misma pantalla, sin cuentas ni servidor de datos.

## Ejecutar

Necesitas Python 3 para servir los archivos y Node.js 24 o posterior para las pruebas. No hay dependencias que instalar.

```sh
npm start
```

Abre <http://localhost:4173>. También puedes ejecutar directamente `python3 -m http.server 4173 --bind 127.0.0.1 --directory public`.

## Cómo jugar

1. Registra de 2 a 8 jugadores con nombres distintos.
2. Comienza la sesión. Cada jugador recibe tres preguntas, alternando turnos.
3. El jugador pulsa **Estoy listo** para revelar su pregunta e iniciar los 15 segundos.
4. La primera respuesta queda registrada. Un acierto suma un punto; un error o tiempo agotado suma cero.
5. Avanza al siguiente turno. Al terminar las tres rondas gana quien tenga más puntos.
6. Si hay empate en el primer lugar, solo esos jugadores participan en una ronda especial: una pregunta por persona y **10 segundos** para responder. Se conservan los puntos y cada acierto sigue sumando uno. Se compara el marcador después de que todos los participantes de la ronda hayan respondido.
7. Si el empate continúa, se juega otra ronda especial únicamente entre quienes sigan empatados arriba, hasta obtener un ganador.

Cada sesión selecciona al azar del banco general: tres preguntas normales por jugador (de 6 a 24 en total), más las necesarias para desempatar. Se utilizan primero las preguntas pendientes; si se agota el banco durante los desempates, se vuelve a mezclar para continuar. Una misma ronda de desempate siempre tiene preguntas distintas. Una nueva sesión vuelve a mezclar el banco y puede repetir preguntas anteriores.

## Desarrollo y pruebas

```sh
npm test
```

Se usa el ejecutor integrado de Node.js. Las pruebas cubren registro, validez del banco, turnos, puntuación, límites de 15 y 10 segundos, desempates sucesivos y agotamiento del banco. No se requiere compilación.

- `public/index.html`: documento de entrada.
- `public/styles.css`: diseño adaptable y estados visuales.
- `public/app.js`: interfaz, eventos y temporizador.
- `public/game.js`: reglas de juego.
- `preguntas.md`: propuestas originales para el banco general.
- `public/questions.js`: banco jugable adaptado de esas propuestas, con cuatro opciones e índice de la respuesta correcta (`0`–`3`).
- `test/game.test.js`: pruebas de las reglas.

## Contenido y límites

El banco contiene 59 preguntas adaptadas de las 60 propuestas de `preguntas.md`: 47 sobre cine de terror y 12 nuevas de cultura popular y memes. Las preguntas abiertas se reformularon para tener una sola opción correcta y se precisaron las versiones de películas cuando era necesario. La pregunta sobre la cantidad de películas de Saw cuenta hasta *Saw X* (2023), incluyendo *Spiral*, para mantener una referencia fija.

Las nuevas propuestas incluyen sus respuestas; se usaron como clave para los memes y sketches sin una fuente independiente localizada. La pregunta subjetiva sobre el mejor personaje de *31 minutos* se adaptó para identificar al reportero de la Nota Verde, [Juan Carlos Bodoque](https://31minutosoficial.cl/codex/juan-carlos-bodoque/). También se corrigió la grafía de [Jenni Rivera, la Diva de la Banda](https://grammymuseum.org/exhibit/jenni-rivera-la-gran-senora/?lang=es).

Queda pendiente «¿Cuál es la película de terror que tiene más secuelas?»: antes de incluirla hay que definir una fecha de corte y si se cuentan remakes, reinicios, cruces y estrenos directos a video. El archivo original se conserva sin cambios.

Para agregar propuestas, adapta también `public/questions.js` con su respuesta y tres distractores; `preguntas.md` no se importa automáticamente. Ejecuta `npm test` después de editar el banco.

Referencias de revisión: [It y el Club de los Perdedores](https://stephenking.com/works/movie/it-part-1-the-losers-club.html), [28 días después](https://www.sonypictures.com/movies/28dayslater), [Evil Dead y el Necronomicón](https://www.regmovies.com/movie-news/everything-you-need-to-know-about-evil-dead), [Pirate Clark en Backrooms (2026)](https://bloody-disgusting.com/movie/3959797/backrooms-behind-the-scenes-photos-reveal-the-alien-romulus-actor-who-played-pirate-clark/), [el ritual de Bring Her Back](https://time.com/7290067/bring-her-back-ending-explained/) y [Monstro Elisasue](https://www.sparknotes.com/film/the-substance/characters/). La referencia de Backrooms (2026) y la respuesta «De gato» para Obsession fueron confirmadas por el organizador.

La sesión permanece en la memoria de la pestaña: recargar o cerrar la página borra los jugadores y puntos. No hay juego sincronizado entre celulares ni historial guardado. Los archivos no dependen de fuentes, imágenes ni servicios externos durante el juego.
