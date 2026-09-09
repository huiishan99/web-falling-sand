import assert from "node:assert/strict";
import test from "node:test";

import { MATERIAL } from "../src/constants.js";
import { Grid } from "../src/grid.js";
import { Simulation } from "../src/simulation.js";

function createSimulation(seed = 1) {
  let p = {
    frameCount: 0,
    random: () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    }
  };
  return new Simulation(p, { nextHue: () => 42 });
}

test("falling sand does not duplicate water that already moved", () => {
  let grid = new Grid(1, 3);
  grid.set(0, 0, MATERIAL.SAND, 180);
  grid.set(0, 1, MATERIAL.WATER);
  let next = createSimulation().step(grid);

  assert.deepEqual(next.countMaterials(), grid.countMaterials());
  assert.deepEqual([...next.types], [MATERIAL.EMPTY, MATERIAL.SAND, MATERIAL.WATER]);
  assert.equal(next.hueAt(0, 1), 180);
});

test("sand sinks through stationary water and preserves both particles", () => {
  let grid = new Grid(1, 2);
  grid.set(0, 0, MATERIAL.SAND, 120);
  grid.set(0, 1, MATERIAL.WATER, 200);
  let next = createSimulation().step(grid);

  assert.deepEqual([...next.types], [MATERIAL.WATER, MATERIAL.SAND]);
  assert.deepEqual([...next.hues], [200, 120]);
  assert.deepEqual(next.countMaterials(), grid.countMaterials());
});

test("water pressure cannot overwrite a destination occupied during this step", () => {
  let grid = new Grid(2, 2);
  grid.set(0, 0, MATERIAL.WATER);
  let next = new Grid(2, 2);
  next.set(1, 1, MATERIAL.SAND, 90);

  assert.equal(createSimulation().tryWaterPressure(grid, next, 0, 0, 1), true);
  assert.equal(next.typeAt(1, 1), MATERIAL.SAND);
  assert.equal(next.hueAt(1, 1), 90);
  assert.equal(next.typeAt(1, 0), MATERIAL.WATER);
});

test("mixed worlds conserve material counts and sand hues over many steps", () => {
  for (let seed = 1; seed <= 20; seed++) {
    let simulation = createSimulation(seed);
    let grid = new Grid(16, 12);
    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        let value = simulation.p.random();
        let type =
          value < 0.15
            ? MATERIAL.WALL
            : value < 0.4
              ? MATERIAL.WATER
              : value < 0.65
                ? MATERIAL.SAND
                : MATERIAL.EMPTY;
        grid.set(col, row, type, type === MATERIAL.SAND ? row * grid.cols + col : 0);
      }
    }
    let expectedCounts = grid.countMaterials();
    let sandHues = (world) =>
      [...world.hues].filter((_hue, i) => world.types[i] === MATERIAL.SAND).sort((a, b) => a - b);
    let expectedHues = sandHues(grid);
    let initialTypes = grid.types.slice();
    for (let step = 0; step < 100; step++) {
      simulation.p.frameCount = step;
      grid = simulation.step(grid);
      assert.deepEqual(grid.countMaterials(), expectedCounts, `seed ${seed}, step ${step}`);
      assert.deepEqual(sandHues(grid), expectedHues);
      initialTypes.forEach((type, i) => {
        if (type === MATERIAL.WALL) assert.equal(grid.types[i], MATERIAL.WALL);
      });
    }
  }
});

test("sources persist and emit only into available cells", () => {
  for (let [source, product] of [
    [MATERIAL.SAND_SOURCE, MATERIAL.SAND],
    [MATERIAL.WATER_SOURCE, MATERIAL.WATER]
  ]) {
    let grid = new Grid(1, 2);
    grid.set(0, 0, source);
    let simulation = createSimulation();
    grid = simulation.step(grid);
    assert.deepEqual([...grid.types], [source, product]);
    grid = simulation.step(grid);
    assert.deepEqual([...grid.types], [source, product]);
  }
});
