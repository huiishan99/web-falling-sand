import { Grid } from "./grid.js";

export const MAX_CELLS = 1000000;
export const MAX_FILE_BYTES = 12000000;
export const STORAGE_KEY = "falling-sand.scene.v1";
export function snapshot(grid) {
  let copy = new Grid(grid.cols, grid.rows);
  copy.resizeFrom(grid);
  return copy;
}
export function serializeScene(grid) {
  return JSON.stringify({
    version: 1,
    cols: grid.cols,
    rows: grid.rows,
    types: [...grid.types],
    hues: [...grid.hues]
  });
}
export function parseScene(text) {
  if (text.length > MAX_FILE_BYTES) throw new Error("Scene file is too large.");
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("This is not a valid JSON scene.");
  }
  if (
    !data ||
    data.version !== 1 ||
    !Number.isInteger(data.cols) ||
    !Number.isInteger(data.rows) ||
    data.cols < 1 ||
    data.rows < 1 ||
    data.cols * data.rows > MAX_CELLS
  )
    throw new Error("Unsupported scene version or dimensions.");
  let size = data.cols * data.rows;
  if (
    !Array.isArray(data.types) ||
    !Array.isArray(data.hues) ||
    data.types.length !== size ||
    data.hues.length !== size
  )
    throw new Error("Scene data is incomplete.");
  let grid = new Grid(data.cols, data.rows);
  for (let i = 0; i < size; i++) {
    if (
      !Number.isInteger(data.types[i]) ||
      data.types[i] < 0 ||
      data.types[i] > 5 ||
      !Number.isInteger(data.hues[i]) ||
      data.hues[i] < 0 ||
      data.hues[i] > 360
    )
      throw new Error("Scene contains invalid materials or colors.");
    grid.set(i % grid.cols, Math.floor(i / grid.cols), data.types[i], data.hues[i]);
  }
  return grid;
}
export class History {
  constructor(limit = 20, maxBytes = 32000000) {
    Object.assign(this, { limit, maxBytes });
    this.past = [];
    this.future = [];
  }
  trim() {
    let bytes = () => [...this.past, ...this.future].reduce((sum, g) => sum + g.size * 3, 0);
    while (this.past.length + this.future.length > this.limit || bytes() > this.maxBytes) {
      if (this.past.length) this.past.shift();
      else this.future.shift();
    }
  }
  record(grid) {
    this.past.push(snapshot(grid));
    this.future = [];
    this.trim();
  }
  undo(grid) {
    if (!this.past.length) return null;
    let previous = this.past.pop();
    this.future.push(snapshot(grid));
    this.trim();
    return previous;
  }
  redo(grid) {
    if (!this.future.length) return null;
    let next = this.future.pop();
    this.past.push(snapshot(grid));
    this.trim();
    return next;
  }
}
