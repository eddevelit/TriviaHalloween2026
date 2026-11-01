import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import * as rules from '../public/game.js';

function createScreen(random) {
  const nodes = [];
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
        classList: { add() {}, toggle() {} },
      };
      nodes.push(node);
      return node;
    },
    querySelector(selector) {
      return selector === '#app' ? app : nodes.findLast((node) => `#${node.id}` === selector);
    },
  };
  const app = document.createElement('main');
  const math = Object.create(Math);
  math.random = random;
  const context = createContext({ ...rules, document, Math: math, setInterval() {}, clearInterval() {} });
  const source = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
  runInContext(source.replace(/^import .*;\n/, ''), context);
  runInContext("players = ['Ana', 'Luis']; game = createGame(players, () => 0); showGame();", context);
  const find = (className, node = app) => node.className === className ? node : node.children.map((child) => find(className, child)).find(Boolean);
  return { context, find, run: (code) => runInContext(code, context) };
}

test('mascots stay through answers and timeouts, change each turn, and work in tiebreaks and replays', () => {
  const screen = createScreen(() => 0);
  let previous;
  for (let turn = 0; turn < 8; turn++) {
    const portrait = screen.find('mascot-image');
    assert.notEqual(portrait.src, previous);
    assert.ok(portrait.alt.length > 0);
    assert.ok(existsSync(new URL(`../public/${portrait.src}`, import.meta.url)));
    assert.equal(screen.find('game-sidebar').children[0].className, 'mascot');
    screen.find('stage').children.at(-1).events.click();
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
