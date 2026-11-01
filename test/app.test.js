import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import * as rules from '../public/game.js';

function createScreen(random, AudioContext) {
  const nodes = [];
  let tick;
  const document = {
    createElement(tag) {
      const node = {
        tag,
        children: [],
        style: {},
        events: {},
        append(...children) { this.children.push(...children); },
        replaceChildren(...children) { this.children = children; },
        setAttribute(name, value) { this[name] = value; },
        addEventListener(name, action) { this.events[name] = action; },
        focus() {},
        classList: {
          add(name) { node.className = `${node.className || ''} ${name}`.trim(); },
          toggle() {},
        },
      };
      nodes.push(node);
      return node;
    },
    querySelector(selector) {
      return selector === '#app' ? app : nodes.findLast((node) => `#${node.id}` === selector);
    },
  };
  const app = document.createElement('main');
  const soundToggle = document.createElement('button');
  soundToggle.id = 'sound-toggle';
  const math = Object.create(Math);
  math.random = random;
  const context = createContext({ ...rules, document, AudioContext, Math: math, setInterval(callback) { tick = callback; }, clearInterval() {} });
  const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  runInContext(source.replace(/^import .*;\n/, ''), context);
  runInContext("players = ['Ana', 'Luis']; game = createGame(players, () => 0); showGame();", context);
  const find = (className, node = app) => node.className?.split(' ').includes(className) ? node : node.children.map((child) => find(className, child)).find(Boolean);
  return { context, find, soundToggle, tick: () => tick(), run: (code) => runInContext(code, context) };
}

class FakeAudioContext {
  state = 'suspended';
  currentTime = 10;
  destination = {};
  oscillators = [];
  gains = [];
  resume() { this.state = 'running'; return Promise.resolve(); }
  createGain() {
    const gain = {
      gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
      connect() {},
      disconnect() { this.disconnected = true; },
    };
    this.gains.push(gain);
    return gain;
  }
  createOscillator() {
    const oscillator = {
      frequency: {},
      connect() {},
      disconnect() { this.disconnected = true; },
      start(time) { this.startTime = time; },
      stop(time) { this.stopTime = time; },
    };
    this.oscillators.push(oscillator);
    return oscillator;
  }
}

test('mascots stay through answers and timeouts, change each turn, and work in tiebreaks and replays', () => {
  const screen = createScreen(() => 0);
  let previous;
  for (let turn = 0; turn < 8; turn++) {
    assert.equal(screen.find('ready-number').textContent, turn < 6 ? '20' : '15');
    const portrait = screen.find('mascot-image');
    assert.notEqual(portrait.src, previous);
    assert.ok(portrait.alt.length > 0);
    assert.ok(existsSync(new URL(`../public/${portrait.src}`, import.meta.url)));
    assert.equal(screen.find('game-sidebar').children[0].className, 'mascot');
    screen.find('stage').children.at(-1).events.click();
    assert.equal(screen.find('clock').children[1].textContent, turn < 6 ? '20' : '15');
    assert.equal(screen.find('mascot-image').src, portrait.src);
    screen.run(turn === 6
      ? 'answerQuestion(game, game.questions[game.turn].answer); showGame();'
      : turn % 2 === 0
      ? 'answerQuestion(game, null, game.deadline); showGame();'
      : 'answerQuestion(game, (game.questions[game.turn].answer + 1) % 4); showGame();');
    assert.equal(screen.find('mascot-image').src, portrait.src);
    screen.find('stage').children.at(-1).events.click();
    previous = portrait.src;
    if (turn === 5) assert.equal(screen.run('game.tiebreakRound'), 1);
  }
  assert.equal(screen.find('mascot-image'), undefined);
  screen.run('game = createGame(players); showGame();');
  assert.ok(screen.find('mascot-image'));
  screen.run("game.players[0].score = 1; game.phase = 'results'; showGame();");
  assert.equal(screen.find('mascot-image'), undefined);
});

test('all three mascot assets can be selected across the random range', () => {
  const images = [0, 0.5, 0.999999].map((value) => createScreen(() => value).find('mascot-image').src);
  assert.equal(new Set(images).size, 3);
});

test('answers show success or failure effects once and clear them on the next turn', () => {
  for (const outcome of ['correct', 'wrong', 'timeout']) {
    const screen = createScreen(() => 0);
    assert.equal(screen.find('feedback'), undefined);
    screen.find('stage').children.at(-1).events.click();
    if (outcome === 'timeout') {
      screen.run('game.deadline = Date.now();');
      screen.tick();
    } else {
      const answer = screen.run('game.questions[game.turn].answer');
      screen.find('options').children[outcome === 'correct' ? answer : (answer + 1) % 4].events.click();
    }
    assert.ok(screen.find(outcome === 'correct' ? 'answer-success' : 'answer-failure'));
    assert.equal(screen.find(outcome === 'correct' ? 'answer-failure' : 'answer-success'), undefined);
    assert.equal(screen.find('feedback').role, 'status');
    assert.equal(screen.find('feedback-badge').textContent, outcome === 'correct' ? '+1' : outcome === 'timeout' ? '⌛' : '×');
    assert.equal(screen.find('feedback-badge')['aria-hidden'], 'true');
    assert.ok(screen.find('options').children.every((choice) => choice.disabled));
    screen.run('answerQuestion(game, game.questions[game.turn].answer);');
    assert.equal(screen.run('game.players[0].score'), outcome === 'correct' ? 1 : 0);
    screen.find('stage').children.at(-1).events.click();
    assert.equal(screen.find('feedback'), undefined);
    assert.equal(screen.find('answer-success'), undefined);
    assert.equal(screen.find('answer-failure'), undefined);
  }
});

test('victory celebrates the final winner after regular rounds or a tiebreak and clears on replay', () => {
  for (const tiebreak of [false, true]) {
    const screen = createScreen(() => 0);
    assert.equal(screen.find('victory-confetti'), undefined);
    screen.run(`
      while (game.phase !== 'results') {
        const correct = getCurrentPlayer(game).name === 'Ana' && (!${tiebreak} || game.tiebreakRound > 0);
        const answer = game.questions[game.turn].answer;
        beginQuestion(game, 0);
        answerQuestion(game, correct ? answer : (answer + 1) % 4, 1000);
        nextTurn(game, () => 0);
      }
      showGame();
    `);
    assert.equal(screen.find('winner-name').textContent, 'Ana');
    assert.equal(screen.find('winner-score').textContent, tiebreak ? '1 punto' : '3 puntos');
    assert.equal(screen.find('winner-announcement').role, 'status');
    assert.equal(screen.find('victory-confetti')['aria-hidden'], 'true');
    assert.equal(screen.find('victory-confetti').children.length, 18);
    const mascots = screen.find('victory-mascots');
    assert.equal(mascots['aria-hidden'], 'true');
    assert.equal(new Set(mascots.children.map((portrait) => portrait.src)).size, 3);
    assert.ok(mascots.children.every((portrait) => existsSync(new URL(`../public/${portrait.src}`, import.meta.url))));
    screen.find('result-actions').children[0].events.click();
    assert.equal(screen.find('results'), undefined);
    assert.equal(screen.find('victory-confetti'), undefined);
    assert.equal(screen.find('victory-mascots'), undefined);
    assert.equal(screen.run('game.players[0].score'), 0);
  }
});

test('answer sounds unlock on interaction, differ by outcome, and play only for the first answer', () => {
  const melodies = [];
  for (const outcome of ['correct', 'wrong', 'timeout']) {
    const screen = createScreen(() => 0, FakeAudioContext);
    assert.equal(screen.run('audioContext'), undefined);
    screen.find('stage').children.at(-1).events.click();
    const audio = screen.run('audioContext');
    assert.equal(audio.state, 'running');
    assert.equal(audio.oscillators.length, 0);
    const answer = screen.run('game.questions[game.turn].answer');
    const choice = screen.find('options').children[outcome === 'correct' ? answer : (answer + 1) % 4];
    if (outcome === 'timeout') {
      screen.run('game.deadline = Date.now();');
      screen.tick();
      screen.tick();
    } else {
      choice.events.click();
      choice.events.click();
    }
    assert.equal(audio.oscillators.length, 3);
    assert.ok(audio.oscillators.every((note) => note.stopTime > note.startTime && note.startTime > audio.currentTime));
    melodies.push(audio.oscillators.map((note) => note.frequency.value).join(','));
    audio.oscillators[0].onended();
    assert.equal(audio.oscillators[0].disconnected, true);
    assert.equal(audio.gains[1].disconnected, true);
    const playing = screen.run('currentSound');
    screen.find('stage').children.at(-1).events.click();
    assert.equal(playing.disconnected, true);
  }
  assert.equal(new Set(melodies).size, 3);
});

test('sound toggle mutes immediately, stays muted across turns and victory, and can enable sound again', () => {
  const screen = createScreen(() => 0, FakeAudioContext);
  screen.soundToggle.events.click();
  assert.equal(screen.soundToggle['aria-pressed'], 'false');
  screen.find('stage').children.at(-1).events.click();
  assert.equal(screen.run('audioContext'), undefined);
  screen.soundToggle.events.click();
  assert.equal(screen.soundToggle['aria-pressed'], 'true');
  const answer = screen.run('game.questions[game.turn].answer');
  screen.find('options').children[answer].events.click();
  const audio = screen.run('audioContext');
  const playing = screen.run('currentSound');
  screen.soundToggle.events.click();
  assert.equal(playing.disconnected, true);
  assert.equal(screen.soundToggle.textContent, 'Sonido silenciado');
  screen.find('stage').children.at(-1).events.click();
  screen.find('stage').children.at(-1).events.click();
  screen.find('options').children[0].events.click();
  screen.run("game.phase = 'results'; showGame();");
  assert.equal(audio.oscillators.length, 3);
  screen.soundToggle.events.click();
  assert.equal(audio.oscillators.length, 3);
  screen.run('showGame();');
  assert.equal(audio.oscillators.length, 9);
  const fanfare = screen.run('currentSound');
  screen.find('result-actions').children[0].events.click();
  assert.equal(fanfare.disconnected, true);
});

test('missing or failed audio leaves the game playable and marks sound as unavailable', async () => {
  class ConstructorFailure extends FakeAudioContext {
    constructor() { super(); throw new Error('No audio device'); }
  }
  class ResumeFailure extends FakeAudioContext {
    resume() { return Promise.reject(new Error('Playback blocked')); }
  }
  class PlaybackFailure extends FakeAudioContext {
    createGain() { throw new Error('Audio device unavailable'); }
  }
  for (const AudioContext of [undefined, ConstructorFailure, ResumeFailure, PlaybackFailure]) {
    const screen = createScreen(() => 0, AudioContext);
    screen.find('stage').children.at(-1).events.click();
    await new Promise(setImmediate);
    const answer = screen.run('game.questions[game.turn].answer');
    screen.find('options').children[answer].events.click();
    assert.equal(screen.run('game.players[0].score'), 1);
    assert.equal(screen.soundToggle.disabled, true);
    assert.equal(screen.soundToggle['aria-pressed'], 'false');
    assert.equal(screen.soundToggle.textContent, 'Sonido no disponible');
    assert.ok(screen.find('feedback'));
  }
});
