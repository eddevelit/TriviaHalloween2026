# Repository Guidelines

## Estructura del proyecto

La última función: trivia de películas de terror en español con HTML, CSS y JavaScript, sin dependencias externas.

- `public/index.html` y `public/styles.css`: documento y diseño adaptable.
- `public/app.js`: interfaz, eventos y temporizador.
- `public/game.js`: registro, turnos, puntuación y desempates.
- `public/questions.js`: banco jugable de 79 preguntas.
- `preguntas.md`: propuestas originales; no se importan automáticamente.
- `test/game.test.js`: pruebas de las reglas.
- `README.md`: ejecución, funcionamiento y límites.

## Comandos de desarrollo y pruebas

Utiliza Node.js 24 o posterior, npm y Python 3. No se requiere instalar dependencias ni compilar.

- `npm start`: sirve `public/` en `http://localhost:4173`, mediante el servidor HTTP de Python, limitado a la máquina local.
- `npm test`: ejecuta las pruebas con `node --test` y `node:assert/strict`.

## Estilo y convenciones

Usa dos espacios, módulos ES, comillas simples y punto y coma en JavaScript. Nombra funciones y variables con `camelCase` y constantes con `UPPER_SNAKE_CASE`. Sigue las clases CSS existentes. No hay formateador ni linter configurado.

Mantén las reglas en `game.js` y la manipulación del DOM en `app.js`. Usa `textContent` para nombres introducidos por jugadores. Conserva el acceso por teclado y el foco visible. Usa comentarios con moderación, únicamente para código complejo.

## Reglas de juego y contenido

Registra de 2 a 8 jugadores con nombres distintos. Cada jugador responde tres preguntas por turnos en una sola pantalla, con 20 segundos por pregunta. Solo cuenta la primera respuesta: un acierto suma un punto; error o tiempo agotado suman cero.

Al terminar, los líderes empatados juegan una pregunta por persona con 15 segundos, conservando sus puntos. Compara resultados al completar toda la ronda; repite únicamente entre los líderes restantes hasta obtener un ganador. Usa preguntas pendientes antes de reciclar el banco; evita repeticiones dentro de cada ronda especial.

Adapta las propuestas de `preguntas.md` en `public/questions.js`: `text`, cuatro `options` y `answer` como índice de `0` a `3`. Verifica las respuestas y precisa versiones o fechas ambiguas. La sesión vive en memoria y se pierde al recargar.

## Validación y contribuciones

Añade pruebas descriptivas con `test('…')` para cambios de comportamiento. Cubre límites de tiempo, puntuación, participantes del desempate y agotamiento del banco cuando corresponda. Hay 14 pruebas y ningún umbral de cobertura configurado.

Todavía no hay historial de commits. Usa asuntos breves e imperativos, como `Add tiebreak round`. Las solicitudes de cambio deben explicar propósito y validación, enlazar incidencias relevantes e incluir capturas para cambios visuales.
