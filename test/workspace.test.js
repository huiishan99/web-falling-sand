import assert from "node:assert/strict";
import test from "node:test";
import { Grid } from "../src/grid.js";
import { MATERIAL as M } from "../src/constants.js";
import { History, parseScene, serializeScene } from "../src/scene.js";
import { traceLine } from "../src/input.js";
import { createPreset, PRESETS } from "../src/presets.js";
import { Simulation } from "../src/simulation.js";

test("scene round-trip preserves dimensions, every material and hue", () => {
  let grid = new Grid(6, 2);
  for (let i = 0; i < 6; i++) grid.set(i, 1, i, i * 60);
  let loaded = parseScene(serializeScene(grid));
  assert.deepEqual(loaded, grid);
});
test("invalid scene files fail without partial restoration", () => {
  for (let text of ["bad JSON", "null", "{}", '{"version":2}', '{"version":1,"cols":1000000,"rows":2}'])
    assert.throws(() => parseScene(text));
  let valid = JSON.parse(serializeScene(new Grid(1, 1)));
  for (let patch of [{ types: [9] }, { hues: [-1] }, { hues: [1.5] }, { types: [] }, { cols: -1 }])
    assert.throws(() => parseScene(JSON.stringify({ ...valid, ...patch })));
});
test("undo snapshots survive simulation buffer reuse; a new edit discards redo", () => {
  let history = new History();
  let grid = new Grid(4, 5);
  grid.set(2, 0, M.SAND, 120);
  history.record(grid);
  let original = serializeScene(grid);
  grid.set(1, 1, M.WALL);
  let sim = new Simulation({ frameCount: 0, random: () => 0.3 }, { nextHue: () => 42 });
  for (let i = 0; i < 4; i++) grid = sim.step(grid);
  let edited = serializeScene(grid);
  grid = history.undo(grid);
  assert.equal(serializeScene(grid), original);
  grid = history.redo(grid);
  assert.equal(serializeScene(grid), edited);
  grid = history.undo(grid);
  history.record(grid);
  assert.equal(history.redo(grid), null);
});
test("history respects entry and byte limits", () => {
  let history = new History(20, 60);
  for (let i = 0; i < 30; i++) history.record(new Grid(2, 2));
  assert.equal(history.past.length, 5);
});
test("fast thin strokes have no gaps, seal diagonal corners and work in reverse", () => {
  let cells = new Set();
  traceLine(1, 1, 30, 1, (x, y) => cells.add(`${x},${y}`));
  assert.equal(cells.size, 30);
  cells.clear();
  traceLine(0, 0, 10, 10, (x, y) => cells.add(`${x},${y}`));
  for (let i = 0; i < 10; i++) {
    assert.ok(cells.has(`${i + 1},${i}`));
    assert.ok(cells.has(`${i},${i + 1}`));
  }
  let reversed = new Set();
  traceLine(10, 10, 0, 0, (x, y) => reversed.add(`${x},${y}`));
  assert.deepEqual(cells, reversed);
});
test("presets populate both phone and desktop grids and preserve walls", () => {
  for (let [cols, rows] of [
    [97, 211],
    [360, 225]
  ])
    for (let preset of PRESETS) {
      let grid = createPreset(preset.id, cols, rows);
      let walls = grid.countMaterials()[M.WALL];
      assert.ok(walls > 0);
      assert.ok(
        grid.countMaterials()[M.SAND] + grid.countMaterials()[M.WATER] + grid.countMaterials().sources > 0
      );
      let sim = new Simulation({ frameCount: 0, random: () => 0.3 }, { nextHue: () => 42 });
      for (let i = 0; i < 30; i++) grid = sim.step(grid);
      assert.equal(grid.countMaterials()[M.WALL], walls);
    }
});
test("reused grids handle empty worlds, outlying edits and dimension changes", () => {
  let sim = new Simulation({ frameCount: 0, random: () => 0.3 }, { nextHue: () => 42 });
  let grid = new Grid(40, 30);
  grid = sim.step(grid);
  grid.set(39, 28, M.SAND, 88);
  grid = sim.step(grid);
  assert.equal(grid.typeAt(39, 29), M.SAND);
  grid.clear(39, 29);
  grid = sim.step(grid);
  assert.equal(grid.countMaterials()[M.SAND], 0);
  grid = sim.step(new Grid(2, 2));
  assert.equal(grid.size, 4);
});
