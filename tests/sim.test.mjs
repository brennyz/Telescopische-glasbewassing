import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";

const root = path.resolve(import.meta.dirname, "..");
const sandbox = { console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const file of ["js/cast.js", "js/items.js", "js/levelgen.js", "js/score.js", "js/game.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), sandbox, { filename: file });
}
const M = sandbox.Malefiets;

function step(run, input, seconds) {
  const dt = 1 / 60;
  let t = 0;
  const hold = typeof input === "function" ? input : () => input;
  while (t < seconds && run.status === "run") {
    M.updateRun(run, dt, hold(run, t));
    t += dt;
  }
  return t;
}

test("de eerste wijk is schoon te krijgen met de wasstok", () => {
  const run = M.createRun(M.makeLevel(0), M.pole("wasstok"));
  step(run, { washing: true, hold: true }, 90);
  assert.equal(run.status, "clear");
  assert.equal(run.strikes, 0);
  assert.ok(run.cleaned >= run.windows.length);
  assert.ok(run.soap > 0);
});

test("drie vieze ruiten zonder schrobben gooien je eraf", () => {
  const level = {
    index: 3,
    name: "Teststeeg",
    speed: 120,
    length: 1200,
    mood: "dag",
    windows: [
      { id: 1, x: 280, lane: 1, maxDirt: 1 },
      { id: 2, x: 520, lane: 0, maxDirt: 1 },
      { id: 3, x: 760, lane: 2, maxDirt: 1 }
    ],
    bumps: []
  };
  const run = M.createRun(level, M.pole("wasstok"));
  step(run, { washing: false }, 30);
  assert.equal(run.status, "fallen");
  assert.ok(run.strikes > M.maxStrikes(run));
});

test("vasthouden bij een hobbel voorkomt een misser", () => {
  const level = {
    index: 2,
    name: "Hobbel",
    speed: 100,
    length: 1400,
    mood: "dag",
    windows: [{ id: 1, x: 1100, lane: 1, maxDirt: 0.3 }],
    bumps: [{ x: 180, windowMs: 400 }]
  };
  const held = M.createRun(level, M.pole("wasstok"));
  step(held, { washing: true, hold: true }, 8);
  assert.equal(held.strikes, 0);
  assert.ok(held.bumps[0].armed);

  const dropped = M.createRun(level, M.pole("wasstok"));
  step(dropped, { washing: false, hold: false }, 8);
  assert.ok(dropped.strikes >= 1);
});

test("een brede kop wast een buurraam mee", () => {
  const level = {
    index: 4,
    name: "Breed",
    speed: 80,
    length: 900,
    mood: "dag",
    windows: [
      { id: 1, x: 360, lane: 1, maxDirt: 0.45 },
      { id: 2, x: 400, lane: 2, maxDirt: 0.45 }
    ],
    bumps: []
  };
  const run = M.createRun(level, M.pole("brede-kop"));
  step(run, { washing: true }, 20);
  assert.equal(run.status, "clear");
  assert.equal(run.strikes, 0);
  assert.equal(run.cleaned, 2);
});

test("zeep en het bord blijven bewaard", () => {
  const saved = M.updateState((state) => {
    state.soap = 12;
    state.name = "   opa   ";
    state.scores.push({ name: "Opa", score: 10, level: 0, levelName: "Scootstraat", rider: "joris", at: 1 });
  });
  assert.equal(saved.soap, 12);
  const again = M.loadState();
  assert.equal(again.soap, 12);
  assert.equal(again.scores.length, 1);
  assert.equal(M.cleanName("   "), "Joris");
  assert.equal(M.cleanName("scoot scoot opa extra lang"), "scoot scoot opa ex");
});

test("elke wijk heeft een andere zaailing en latere wijken zijn zwaarder", () => {
  const first = M.makeLevel(0);
  const later = M.makeLevel(12);
  assert.equal(first.bumps.length, 0);
  assert.ok(later.speed > first.speed);
  assert.ok(later.windows.length > first.windows.length);
  assert.notEqual(first.windows[0].x, later.windows[0].x);
  assert.equal(M.makeLevel(4).name, M.makeLevel(4).name);
});
