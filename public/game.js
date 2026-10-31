import { questions } from './questions.js';

export const ROUND_COUNT = 3;
export const MAX_PLAYERS = 8;
export const QUESTION_TIME = 15_000;
export const TIEBREAK_TIME = 10_000;

export function registerPlayer(players, rawName) {
  const name = rawName.trim().replace(/\s+/g, ' ');
  if (!name || name.length > 30) throw new Error('Escribe un nombre de entre 1 y 30 caracteres.');
  if (players.length >= MAX_PLAYERS) throw new Error('La sesión admite hasta 8 jugadores.');
  const key = (value) => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es');
  if (players.some((player) => key(player) === key(name))) throw new Error('Ese nombre ya está registrado. Usa otro para distinguirte.');
  return [...players, name];
}

function shuffleQuestions(random) {
  const deck = [...questions];
  for (let index = deck.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [deck[index], deck[other]] = [deck[other], deck[index]];
  }
  return deck;
}

export function createGame(names, random = Math.random) {
  const validated = names.reduce(registerPlayer, []);
  if (validated.length < 2) throw new Error('Registra al menos 2 jugadores para empezar.');
  const players = validated.map((name) => ({ name, score: 0 }));
  const deck = shuffleQuestions(random);
  return {
    players,
    activePlayers: players,
    questions: deck.slice(0, validated.length * ROUND_COUNT),
    remainingQuestions: deck.slice(validated.length * ROUND_COUNT),
    tiebreakRound: 0,
    questionTime: QUESTION_TIME,
    turn: 0,
    phase: 'ready',
    deadline: null,
    result: null,
  };
}

export function getCurrentPlayer(game) {
  return game.activePlayers[game.turn % game.activePlayers.length];
}

export function beginQuestion(game, now = Date.now()) {
  if (game.phase !== 'ready') return;
  game.deadline = now + game.questionTime;
  game.phase = 'question';
}

export function answerQuestion(game, selected, now = Date.now()) {
  if (game.phase !== 'question') return;
  if (selected !== null && (!Number.isInteger(selected) || selected < 0 || selected > 3)) return;
  const expired = now >= game.deadline;
  if (selected === null && !expired) return;
  const correct = !expired && selected === game.questions[game.turn].answer;
  if (correct) getCurrentPlayer(game).score++;
  game.result = { selected: expired ? null : selected, correct, expired };
  game.phase = 'feedback';
}

export function nextTurn(game, random = Math.random) {
  if (game.phase !== 'feedback') return;
  game.turn++;
  game.phase = game.turn === game.questions.length ? 'results' : 'ready';
  game.deadline = null;
  game.result = null;
  if (game.phase !== 'results') return;
  const winners = getWinners(game);
  if (winners.length === 1) return;
  game.activePlayers = winners;
  game.tiebreakRound++;
  game.questionTime = TIEBREAK_TIME;
  if (game.remainingQuestions.length < winners.length) {
    // shortcut: el banco es finito; se reutiliza al agotarse, ampliar el banco para evitarlo.
    game.remainingQuestions.push(...shuffleQuestions(random).filter((question) => !game.remainingQuestions.includes(question)));
  }
  game.questions = game.remainingQuestions.splice(0, winners.length);
  game.turn = 0;
  game.phase = 'ready';
}

export function getWinners(game) {
  const highest = Math.max(...game.activePlayers.map((player) => player.score));
  return game.activePlayers.filter((player) => player.score === highest);
}
