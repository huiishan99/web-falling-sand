import { performance } from "node:perf_hooks";
import { Grid } from "../src/grid.js";
import { Simulation } from "../src/simulation.js";
for (const dense of [false, true]) {
  let times = [];
  for (let run = 0; run < 5; run++) {
    let grid = new Grid(480, 270);
    let simulation = new Simulation({ frameCount: 0, random: () => 0.3 }, { nextHue: () => 40 });
    for (let y = 0; y < (dense ? 180 : 20); y++) {
      for (let x = 0; x < (dense ? 480 : 30); x++) grid.set(x, y, (x + y) % 3 === 0 ? 2 : 3, 40);
    }
    let start = performance.now();
    for (let step = 0; step < 120; step++) grid = simulation.step(grid);
    times.push((performance.now() - start) / 120);
  }
  console.log(
    JSON.stringify({
      scenario: dense ? "dense" : "sparse",
      grid: "480x270",
      medianMsPerStep: times.sort((a, b) => a - b)[2]
    })
  );
}
