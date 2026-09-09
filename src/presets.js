import { Grid } from "./grid.js";
import { MATERIAL as M } from "./constants.js";
import { traceLine } from "./input.js";
export const PRESETS = [
  {
    id: "hourglass",
    label: "Hourglass",
    hint: "Sand falls through the narrow neck. Try widening it with the eraser."
  },
  { id: "dam", label: "Water dam", hint: "Erase part of the center wall to release the reservoir." },
  {
    id: "fountain",
    label: "Fountain",
    hint: "Water sources feed cascading bowls. Add walls to redirect the flow."
  }
];
export function createPreset(id, cols, rows) {
  if (!PRESETS.some((p) => p.id === id)) throw new Error("Unknown scene.");
  let g = new Grid(cols, rows);
  let left = cols > 180 ? Math.min(65, Math.floor(cols * 0.25)) : 3;
  let right = cols - 4,
    top = 6,
    bottom = Math.max(10, Math.floor(rows * 0.75));
  let w = right - left,
    h = bottom - top;
  let point = (x, y) => [Math.round(left + x * w), Math.round(top + y * h)];
  let line = (x0, y0, x1, y1, type = M.WALL) => {
    let a = point(x0, y0),
      b = point(x1, y1);
    traceLine(...a, ...b, (x, y) => g.set(x, y, type));
  };
  let fill = (x0, y0, x1, y1, type) => {
    let a = point(x0, y0),
      b = point(x1, y1);
    for (let y = a[1]; y <= b[1]; y++)
      for (let x = a[0]; x <= b[0]; x++) g.set(x, y, type, type === M.SAND ? 34 + (y % 19) : 0);
  };
  if (id === "hourglass") {
    line(0.12, 0.02, 0.88, 0.02);
    line(0.12, 0.02, 0.48, 0.48);
    line(0.88, 0.02, 0.52, 0.48);
    line(0.48, 0.48, 0.12, 0.96);
    line(0.52, 0.48, 0.88, 0.96);
    line(0.12, 0.96, 0.88, 0.96);
    for (let y = 0.08; y < 0.4; y += 1 / h) {
      let inset = 0.15 + y * 0.78;
      fill(inset, y, 1 - inset, y, M.SAND);
    }
  } else if (id === "dam") {
    fill(0.08, 0.2, 0.44, 0.89, M.WATER);
    line(0.06, 0.12, 0.06, 0.92);
    line(0.06, 0.92, 0.94, 0.92);
    line(0.94, 0.55, 0.94, 0.92);
    line(0.47, 0.12, 0.47, 0.92);
    fill(0.7, 0.72, 0.83, 0.88, M.SAND);
  } else {
    line(0.47, 0.08, 0.53, 0.08, M.WATER_SOURCE);
    line(0.32, 0.32, 0.68, 0.32);
    line(0.32, 0.27, 0.32, 0.32);
    line(0.68, 0.27, 0.68, 0.32);
    line(0.18, 0.6, 0.82, 0.6);
    line(0.18, 0.55, 0.18, 0.6);
    line(0.82, 0.55, 0.82, 0.6);
    line(0.05, 0.93, 0.95, 0.93);
    line(0.05, 0.75, 0.05, 0.93);
    line(0.95, 0.75, 0.95, 0.93);
  }
  return g;
}
