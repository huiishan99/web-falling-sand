import assert from "node:assert/strict";
import test from "node:test";

import { MATERIAL } from "../src/constants.js";
import { Grid } from "../src/grid.js";

test("grid stores material type and hue", () => {
  let grid = new Grid(4, 3);
  grid.set(2, 1, MATERIAL.SAND, 180);

  assert.equal(grid.typeAt(2, 1), MATERIAL.SAND);
  assert.equal(grid.hueAt(2, 1), 180);
});

test("resizeFrom preserves overlapping cells", () => {
  let oldGrid = new Grid(4, 4);
  oldGrid.set(1, 1, MATERIAL.WATER);
  oldGrid.set(3, 3, MATERIAL.WALL);

  let nextGrid = new Grid(2, 2);
  nextGrid.resizeFrom(oldGrid);

  assert.equal(nextGrid.typeAt(1, 1), MATERIAL.WATER);
});

test("countMaterials tracks visible categories", () => {
  let grid = new Grid(3, 2);
  grid.set(0, 0, MATERIAL.SAND);
  grid.set(1, 0, MATERIAL.WATER);
  grid.set(2, 0, MATERIAL.WALL);
  grid.set(0, 1, MATERIAL.SAND_SOURCE);
  grid.set(1, 1, MATERIAL.WATER_SOURCE);

  let counts = grid.countMaterials();

  assert.equal(counts[MATERIAL.SAND], 1);
  assert.equal(counts[MATERIAL.WATER], 1);
  assert.equal(counts[MATERIAL.WALL], 1);
  assert.equal(counts.sources, 2);
});
