import { MATERIAL } from "./constants.js";
import { TOOL_BY_ID } from "./materials.js";

export class Brush {
  constructor(p, state) {
    this.p = p;
    this.state = state;
  }

  paint(grid, col, row) {
    if (!grid.inBounds(col, row)) {
      return;
    }

    let tool = TOOL_BY_ID[this.state.currentTool];
    if (!tool || tool.material === MATERIAL.EMPTY) {
      grid.clear(col, row);
      return;
    }

    if (tool.material === MATERIAL.SAND) {
      if (this.p.random(1) < 0.78) {
        grid.set(col, row, MATERIAL.SAND, this.nextHue());
      }
      return;
    }

    grid.set(col, row, tool.material);
  }

  advanceHue() {
    if (this.state.currentTool !== "sand") {
      return;
    }

    this.state.hue += this.state.colorMode === "rainbow" ? 1 : 0.8;
    if (this.state.colorMode === "rainbow" && this.state.hue > 360) {
      this.state.hue = 1;
    }
    if (this.state.colorMode === "warm" && this.state.hue > 52) {
      this.state.hue = 34;
    }
  }

  nextHue() {
    let jitter = this.state.colorMode === "rainbow" ? this.p.random(-14, 14) : this.p.random(-8, 8);
    return Math.round((this.state.hue + jitter + 360) % 360);
  }
}
