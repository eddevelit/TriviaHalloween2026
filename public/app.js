import { registerPlayer, createGame, beginQuestion, answerQuestion, nextTurn, getCurrentPlayer, getWinners, ROUND_COUNT, MAX_PLAYERS } from './game.js';

const app = document.querySelector('#app');
let players = [];
let game;
let timer;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(text, action, className = 'button') {
  const node = element('button', className, text);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
}

function heading(label, title, description) {
  const header = element('div', 'section-heading');
  header.append(element('p', 'eyebrow', label), element('h1', '', title));
  if (description) header.append(element('p', 'description', description));
  return header;
}

function clearScreen() {
  clearInterval(timer);
  app.replaceChildren();
}

function focusScreen() {
  app.focus();
}

function showRegistration(focus = false) {
  clearScreen();
  const intro = heading('SE ABREN LAS PUERTAS', '¿Te sabes la de miedo?', 'Reúne a tu elenco. Elige bien. Sobrevive a la trivia.');
  const rules = element('div', 'rules');
  for (const [value, label] of [['15', 'segundos por pregunta'], ['+1', 'punto por acierto'], ['3', 'preguntas por persona']]) {
    const rule = element('div', 'rule');
    rule.append(element('strong', '', value), element('span', '', label));
    rules.append(rule);
  }
  intro.append(rules, element('p', 'muted small', '¿Empate al final? Solo los líderes juegan una ronda especial de 10 segundos por pregunta.'));
  const ticket = element('section', 'ticket');
  const formSide = element('div', 'ticket-form');
  formSide.append(element('p', 'eyebrow', 'TU ENTRADA AL TERROR'), element('h2', '', '¿Quién se atreve a jugar?'));
  const form = element('form', 'registration-form');
  const label = element('label', '', 'Nombre del jugador');
  label.htmlFor = 'player-name';
  const input = element('input');
  input.id = 'player-name';
  input.name = 'player-name';
  input.placeholder = 'Ej. Valeria';
  input.maxLength = 30;
  input.required = true;
  input.autocomplete = 'off';
  input.setAttribute('aria-describedby', 'form-error');
  const add = element('button', 'button secondary', 'Agregar jugador +');
  add.type = 'submit';
  const error = element('p', 'error');
  error.id = 'form-error';
  error.setAttribute('role', 'status');
  form.append(label, input, add, error);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      players = registerPlayer(players, input.value);
      showRegistration();
      document.querySelector('#player-name').focus();
    } catch (failure) {
      error.textContent = failure.message;
      input.focus();
    }
  });
  formSide.append(form, element('p', 'muted small', 'De 2 a 8 jugadores · Por turnos en esta pantalla'));
  const roster = element('div', 'ticket-roster');
  const rosterHeading = element('div', 'roster-heading');
  rosterHeading.append(element('h2', '', 'El elenco'), element('span', 'count', `${players.length} / ${MAX_PLAYERS}`));
  roster.append(rosterHeading);
  if (!players.length) roster.append(element('p', 'empty-roster', 'Todavía no hay valientes.\nAgrega al primer jugador.'));
  const list = element('ol', 'player-list');
  players.forEach((name, index) => {
    const row = element('li', 'player-row');
    const remove = button('×', () => {
      players.splice(index, 1);
      showRegistration();
      document.querySelector('#player-name').focus();
    }, 'remove-player');
    remove.setAttribute('aria-label', `Quitar a ${name}`);
    row.append(element('span', 'player-number', String(index + 1).padStart(2, '0')), element('span', 'player-name', name), remove);
    list.append(row);
  });
  roster.append(list);
  const start = button('Comenzar la función →', () => {
    game = createGame(players);
    showGame();
  });
  start.disabled = players.length < 2;
  roster.append(start, element('p', 'muted small', players.length < 2 ? 'Agrega al menos 2 jugadores para comenzar.' : 'Mismas oportunidades. Preguntas distintas.'));
  ticket.append(formSide, roster);
  app.append(intro, ticket);
  if (focus) focusScreen();
}

function scoreboard() {
  const aside = element('aside', 'scoreboard');
  aside.setAttribute('aria-label', 'Marcador');
  aside.append(element('h2', '', game.tiebreakRound ? 'En el desempate' : 'Los que siguen en pie'));
  const list = element('ol', 'score-list');
  game.activePlayers.forEach((player) => {
    const row = element('li', `score-row${player === getCurrentPlayer(game) ? ' active-player' : ''}`);
    row.append(element('span', 'player-name', player.name), element('strong', '', `${player.score} pts`));
    list.append(row);
  });
  aside.append(list);
  return aside;
}

function showGame() {
  clearScreen();
  if (game.phase === 'results') return showResults();
  const player = getCurrentPlayer(game);
  const duration = game.questionTime / 1000;
  const round = Math.floor(game.turn / game.players.length) + 1;
  app.append(heading(
    game.tiebreakRound ? `DESEMPATE ${game.tiebreakRound} · ${duration} SEGUNDOS` : `RONDA ${round} DE ${ROUND_COUNT}`,
    `Tu turno, ${player.name}`,
    game.tiebreakRound ? `Solo participan los líderes empatados. Pregunta ${game.turn + 1} de ${game.questions.length} del desempate.` : `${game.turn + 1} de ${game.questions.length} preguntas de la sesión`,
  ));
  const layout = element('div', 'game-layout');
  const stage = element('section', 'stage');
  if (game.phase === 'ready') {
    stage.classList.add('ready-stage');
    stage.append(element('span', 'ready-number', String(duration)), element('h2', '', 'Respira. La pregunta viene en camino.'), element('p', 'description', `Tendrás ${duration} segundos desde que pulses el botón. Solo cuenta tu primera respuesta.`), button('Estoy listo →', () => {
      beginQuestion(game);
      showGame();
    }));
  } else {
    const question = game.questions[game.turn];
    const clock = element('div', 'clock');
    const seconds = element('strong', '', String(duration));
    seconds.setAttribute('role', 'timer');
    seconds.setAttribute('aria-label', 'Segundos restantes');
    clock.append(element('span', 'eyebrow', 'EL TIEMPO CORRE'), seconds);
    const track = element('div', 'timer-track');
    const fill = element('div', 'timer-fill');
    track.append(fill);
    stage.append(clock, track, element('h2', 'question', question.text));
    const options = element('div', 'options');
    question.options.forEach((option, index) => {
      const choice = button('', () => {
        answerQuestion(game, index);
        showGame();
      }, 'option');
      choice.append(element('span', 'option-letter', 'ABCD'[index]), element('span', '', option));
      if (game.phase === 'feedback') {
        choice.disabled = true;
        if (index === question.answer) choice.classList.add('correct');
        if (index === game.result.selected && !game.result.correct) choice.classList.add('incorrect');
      }
      options.append(choice);
    });
    stage.append(options);
    if (game.phase === 'feedback') {
      const { correct, expired } = game.result;
      seconds.textContent = expired ? '0' : String(Math.max(0, Math.ceil((game.deadline - Date.now()) / 1000)));
      fill.style.width = `${expired ? 0 : Math.max(0, game.deadline - Date.now()) / game.questionTime * 100}%`;
      const feedback = element('div', 'feedback');
      feedback.setAttribute('role', 'status');
      feedback.append(element('strong', '', correct ? '¡Correcto! Un punto para ti.' : expired ? 'Se acabó el tiempo. Sin punto esta vez.' : 'Esta vez no. No se suman puntos.'), element('p', '', `Respuesta correcta: ${question.options[question.answer]}`));
      const nextLabel = game.turn + 1 < game.questions.length ? 'Siguiente turno →' : getWinners(game).length > 1 ? 'Continuar al desempate →' : 'Ver resultados →';
      stage.append(feedback, button(nextLabel, () => {
        nextTurn(game);
        showGame();
      }));
    } else {
      const tick = () => {
        const remaining = Math.max(0, game.deadline - Date.now());
        seconds.textContent = String(Math.ceil(remaining / 1000));
        fill.style.width = `${remaining / game.questionTime * 100}%`;
        clock.classList.toggle('urgent', remaining <= 5000);
        if (!remaining) {
          answerQuestion(game, null);
          showGame();
        }
      };
      timer = setInterval(tick, 100);
      tick();
    }
  }
  layout.append(stage, scoreboard());
  app.append(layout);
  focusScreen();
}

function showResults() {
  const [winner] = getWinners(game);
  app.append(heading('FIN DE LA FUNCIÓN', 'Tenemos superviviente.', 'La mejor memoria de la noche merece el aplauso.'));
  const stage = element('section', 'stage results');
  stage.append(element('p', 'eyebrow', 'GANADOR DE LA NOCHE'), element('h2', 'winner-name', winner.name), element('p', 'winner-score', `${winner.score} ${winner.score === 1 ? 'punto' : 'puntos'}`));
  const list = element('ol', 'final-scores');
  const sorted = [...game.players].sort((a, b) => b.score - a.score);
  sorted.forEach((player) => {
    const row = element('li', 'score-row');
    const rank = sorted.findIndex((entry) => entry.score === player.score) + 1;
    row.append(element('span', 'player-number', String(rank).padStart(2, '0')), element('span', 'player-name', player.name), element('strong', '', `${player.score} pts`));
    list.append(row);
  });
  const actions = element('div', 'result-actions');
  actions.append(button('Otra función, mismo elenco →', () => {
    game = createGame(players);
    showGame();
  }), button('Cambiar jugadores', () => showRegistration(true), 'button secondary'));
  stage.append(list, actions);
  app.append(stage);
  focusScreen();
}

showRegistration();
