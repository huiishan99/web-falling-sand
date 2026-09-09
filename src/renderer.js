import { CELL_SIZE, MATERIAL } from "./constants.js";

export class Renderer {
  constructor(p) {
    this.p = p;
    this.buffer = null;
    this.palette = Array.from({ length: 361 }, (_, hue) => p.color(hue, 190, 235).levels);
    this.colors = {
      [MATERIAL.EMPTY]: [11, 13, 16, 255],
      [MATERIAL.WALL]: [92, 101, 115, 255],
      [MATERIAL.WATER]: [45, 123, 184, 255],
      [MATERIAL.SAND_SOURCE]: [245, 186, 48, 255],
      [MATERIAL.WATER_SOURCE]: [52, 202, 242, 255]
    };
  }
  invalidate() {
    this.invalid = true;
  }
  resize(width, height) {
    this.buffer?.remove();
    this.buffer = this.p.createGraphics(
      Math.max(1, Math.floor(width / CELL_SIZE)),
      Math.max(1, Math.floor(height / CELL_SIZE))
    );
    this.buffer.pixelDensity(1);
    this.buffer.loadPixels();
    this.invalid = true;
  }
  draw(grid, state) {
    if (this.invalid || state.dirty) {
      let pixels = this.buffer.pixels;
      for (let i = 0; i < grid.size; i++) {
        let type = grid.types[i];
        let color = type === MATERIAL.SAND ? this.palette[grid.hues[i] % 361] : this.colors[type];
        let shade = type === MATERIAL.SAND ? 0.88 + ((i * 13) % 17) / 140 : 1;
        let offset = i * 4;
        pixels[offset] = color[0] * shade;
        pixels[offset + 1] = color[1] * shade;
        pixels[offset + 2] = color[2] * shade;
        pixels[offset + 3] = 255;
      }
      this.buffer.updatePixels();
      this.invalid = false;
    }
    this.p.background("#0b0d10");
    this.p.noSmooth();
    this.p.image(this.buffer, 0, 0, grid.cols * CELL_SIZE, grid.rows * CELL_SIZE);
    this.drawBrushPreview(state);
  }
  drawBrushPreview(state) {
    if (!state.pointerInCanvas || state.pointerOverToolbar) return;
    this.p.noFill();
    let hue = state.currentTool === "water" || state.currentTool === "waterSource" ? 205 : state.hue;
    this.p.stroke(hue, 140, 240, 200);
    this.p.strokeWeight(1);
    this.p.circle(this.p.mouseX, this.p.mouseY, state.brushSize * CELL_SIZE);
    this.p.noStroke();
  }
}
