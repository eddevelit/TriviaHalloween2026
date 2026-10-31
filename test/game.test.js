import test from 'node:test';
import assert from 'node:assert/strict';
import { registerPlayer, createGame, beginQuestion, answerQuestion, nextTurn, getCurrentPlayer, getWinners, ROUND_COUNT, MAX_PLAYERS, QUESTION_TIME, TIEBREAK_TIME } from '../public/game.js';
import { questions } from '../public/questions.js';

function finishRound(game, correctNames = []) {
  const turnsLeft = game.questions.length - game.turn;
  for (let turn = 0; turn < turnsLeft; turn++) {
    const correct = correctNames.includes(getCurrentPlayer(game).name);
    const answer = game.questions[game.turn].answer;
    beginQuestion(game, 0);
    answerQuestion(game, correct ? answer : (answer + 1) % 4, 1000);
    nextTurn(game, () => 0);
  }
}

test('registration trims names and rejects blank, duplicate, long, or excess names', () => {
  assert.deepEqual(registerPlayer([], '  Ana   María  '), ['Ana María']);
  for (const name of ['', '   ', 'a'.repeat(31)]) assert.throws(() => registerPlayer([], name));
  assert.throws(() => registerPlayer(['José'], ' JOSE '));
  assert.throws(() => registerPlayer(Array.from({ length: MAX_PLAYERS }, (_, i) => `Jugador ${i}`), 'Otro'));
  assert.throws(() => createGame(['Ana']));
});

test('question bank has enough unique valid questions for a full session', () => {
  assert.ok(questions.length >= MAX_PLAYERS * ROUND_COUNT);
  assert.equal(new Set(questions.map((question) => question.text)).size, questions.length);
  for (const question of questions) {
    assert.equal(question.options.length, 4);
    assert.equal(new Set(question.options).size, 4);
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < 4);
  }
});

test('sessions sample the general bank without repeats or modifying it', () => {
  const original = [...questions];
  const names = Array.from({ length: MAX_PLAYERS }, (_, index) => `Jugador ${index + 1}`);
  const first = createGame(names, () => 0);
  const second = createGame(names, () => 0.999);
  for (const game of [first, second]) {
    assert.equal(game.questions.length, MAX_PLAYERS * ROUND_COUNT);
    assert.equal(new Set(game.questions).size, game.questions.length);
    assert.ok(game.questions.every((question) => questions.includes(question)));
  }
  assert.notDeepEqual(first.questions, second.questions);
  assert.deepEqual(questions, original);
});

test('correct answers award exactly one point and the first answer is final', () => {
  const game = createGame(['Ana', 'Luis']);
  answerQuestion(game, game.questions[0].answer, 0);
  assert.equal(game.players[0].score, 0);
  beginQuestion(game, 1000);
  beginQuestion(game, 2000);
  assert.equal(game.deadline, 16000);
  answerQuestion(game, game.questions[0].answer, 15999);
  answerQuestion(game, game.questions[0].answer, 15999);
  assert.equal(game.players[0].score, 1);
  assert.equal(game.phase, 'feedback');
});

test('wrong, expired, or late answers do not score; the deadline is exactly 15 seconds', () => {
  for (const mode of ['wrong', 'timeout', 'late']) {
    const game = createGame(['Ana', 'Luis']);
    beginQuestion(game, 1000);
    const correct = game.questions[0].answer;
    const selected = mode === 'timeout' ? null : mode === 'late' ? correct : (correct + 1) % 4;
    answerQuestion(game, selected, mode === 'wrong' ? 2000 : 16000);
    assert.equal(game.players[0].score, 0);
    assert.equal(game.phase, 'feedback');
    assert.equal(game.result.expired, mode !== 'wrong');
  }
});

test('invalid answers and early timeout calls cannot end a question', () => {
  const game = createGame(['Ana', 'Luis']);
  beginQuestion(game, 1000);
  for (const selected of [null, -1, 4, 0.5, '0']) {
    answerQuestion(game, selected, 2000);
    assert.equal(game.phase, 'question');
  }
  nextTurn(game);
  assert.equal(game.turn, 0);
});

test('players alternate, receive equal questions, and finish with a unique winner', () => {
  const game = createGame(['Ana', 'Luis', 'Eva']);
  const turns = [0, 0, 0];
  while (game.phase !== 'results') {
    const player = game.turn % game.players.length;
    turns[player]++;
    beginQuestion(game, 0);
    answerQuestion(game, player === 0 ? game.questions[game.turn].answer : null, player === 0 ? 1000 : 15000);
    nextTurn(game);
  }
  assert.deepEqual(turns, [ROUND_COUNT, ROUND_COUNT, ROUND_COUNT]);
  assert.deepEqual(getWinners(game), [{ name: 'Ana', score: ROUND_COUNT }]);
  assert.equal(game.turn, game.questions.length);
  assert.equal(game.tiebreakRound, 0);
  assert.equal(game.questionTime, QUESTION_TIME);
});

test('ties include every player with the highest score, including an all-zero game', () => {
  const game = createGame(['Ana', 'Luis', 'Eva']);
  assert.equal(getWinners(game).length, 3);
  game.players[0].score = 2;
  game.players[1].score = 2;
  assert.deepEqual(getWinners(game).map((player) => player.name), ['Ana', 'Luis']);
});

test('a first-place tie starts a 10-second round with only the tied leaders and fresh questions', () => {
  const game = createGame(['Ana', 'Luis', 'Eva']);
  const regularQuestions = [...game.questions];
  finishRound(game, ['Ana', 'Luis']);
  assert.equal(game.phase, 'ready');
  assert.equal(game.tiebreakRound, 1);
  assert.equal(game.questionTime, TIEBREAK_TIME);
  assert.deepEqual(game.activePlayers.map((player) => player.name), ['Ana', 'Luis']);
  assert.deepEqual(game.players.map((player) => player.score), [3, 3, 0]);
  assert.equal(game.questions.length, 2);
  assert.ok(game.questions.every((question) => !regularQuestions.includes(question)));
  assert.equal(getCurrentPlayer(game).name, 'Ana');
  assert.equal(game.turn, 0);
  assert.equal(game.deadline, null);
  assert.equal(game.result, null);
});

test('a tiebreak finishes every participant turn before declaring a winner', () => {
  const game = createGame(['Ana', 'Luis', 'Eva']);
  finishRound(game, ['Ana', 'Luis']);
  beginQuestion(game, 0);
  answerQuestion(game, game.questions[game.turn].answer, 9999);
  answerQuestion(game, game.questions[game.turn].answer, 9999);
  nextTurn(game);
  assert.equal(game.phase, 'ready');
  assert.equal(game.players[0].score, 4);
  assert.equal(getCurrentPlayer(game).name, 'Luis');
  beginQuestion(game, 0);
  answerQuestion(game, null, 10000);
  nextTurn(game);
  assert.equal(game.phase, 'results');
  assert.deepEqual(getWinners(game), [{ name: 'Ana', score: 4 }]);
  assert.deepEqual(game.players.map((player) => player.score), [4, 3, 0]);
});

test('repeated ties keep only the remaining leaders, including rounds where all miss or all score', () => {
  const game = createGame(['Ana', 'Luis', 'Eva']);
  finishRound(game, ['Ana', 'Luis', 'Eva']);
  assert.equal(game.activePlayers.length, 3);
  finishRound(game, ['Ana', 'Luis']);
  assert.equal(game.tiebreakRound, 2);
  assert.deepEqual(game.activePlayers.map((player) => player.name), ['Ana', 'Luis']);
  finishRound(game);
  assert.equal(game.tiebreakRound, 3);
  finishRound(game, ['Ana', 'Luis']);
  assert.equal(game.tiebreakRound, 4);
  assert.deepEqual(game.activePlayers.map((player) => player.name), ['Ana', 'Luis']);
  assert.equal(game.players[2].score, 3);
  finishRound(game, ['Luis']);
  assert.equal(game.phase, 'results');
  assert.deepEqual(getWinners(game), [{ name: 'Luis', score: 6 }]);
});

test('tiebreak answers are accepted before 10 seconds and rejected at or after the deadline', () => {
  for (const elapsed of [9999, 10000, 20000]) {
    const game = createGame(['Ana', 'Luis']);
    finishRound(game);
    beginQuestion(game, 1000);
    assert.equal(game.deadline, 11000);
    answerQuestion(game, game.questions[game.turn].answer, 1000 + elapsed);
    assert.equal(game.players[0].score, elapsed < 10000 ? 1 : 0);
    assert.equal(game.result.expired, elapsed >= 10000);
    assert.equal(game.phase, 'feedback');
  }
});

test('extended tiebreaks use the entire bank before recycling without repeats within a round', () => {
  const names = Array.from({ length: MAX_PLAYERS }, (_, index) => `Jugador ${index + 1}`);
  const game = createGame(names);
  const seen = new Set(game.questions);
  finishRound(game);
  for (let round = 1; round <= 6; round++) {
    assert.equal(game.tiebreakRound, round);
    assert.equal(game.questions.length, MAX_PLAYERS);
    assert.equal(new Set(game.questions).size, MAX_PLAYERS);
    for (const question of game.questions) {
      if (seen.has(question)) assert.equal(seen.size, questions.length);
      seen.add(question);
    }
    finishRound(game);
  }
  assert.equal(seen.size, questions.length);
  assert.equal(game.phase, 'ready');
});

test('a new session restores all players, regular timing, and zero scores after a tiebreak', () => {
  const game = createGame(['Ana', 'Luis', 'Eva']);
  finishRound(game, ['Ana', 'Luis']);
  const replay = createGame(game.players.map((player) => player.name));
  assert.equal(replay.tiebreakRound, 0);
  assert.equal(replay.questionTime, QUESTION_TIME);
  assert.equal(replay.activePlayers.length, 3);
  assert.deepEqual(replay.players.map((player) => player.score), [0, 0, 0]);
});
