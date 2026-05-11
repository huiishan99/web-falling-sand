import { CELL_SIZE, MATERIAL } from "./constants.js";

export class Renderer {
  constructor(p) {
    this.p = p;
    this.buffer = null;
  }

  resize(width, height) {
    this.buffer = this.p.createGraphics(width, height);
    this.buffer.colorMode(this.p.HSB, 360, 255, 255, 255);
    this.buffer.noStroke();
  }

  draw(grid, state) {
    if (!this.buffer || this.buffer.width !== this.p.width || this.buffer.height !== this.p.height) {
      this.resize(this.p.width, this.p.height);
    }

    this.buffer.background(218, 28, 7);
    this.buffer.noStroke();

    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        let type = grid.typeAt(col, row);
        if (type === MATERIAL.EMPTY) {
          continue;
        }
        this.drawCell(grid, col, row, type);
      }
    }

    this.p.image(this.buffer, 0, 0);
    this.drawBrushPreview(state);
  }

  drawCell(grid, col, row, type) {
    let x = col * CELL_SIZE;
    let y = row * CELL_SIZE;

    if (type === MATERIAL.WALL) {
      this.buffer.fill(214, 14, 110);
      this.buffer.rect(x, y, CELL_SIZE + 0.2, CELL_SIZE + 0.2, 1);
    } else if (type === MATERIAL.WATER) {
      let shade = 178 + this.p.noise(col * 0.08, row * 0.08, this.p.frameCount * 0.02) * 28;
      this.buffer.fill(204, 165, shade, 195);
      this.buffer.rect(x, y, CELL_SIZE + 0.5, CELL_SIZE + 0.5, 1);
    } else if (type === MATERIAL.SAND) {
      let shade = 205 + this.p.noise(col * 0.06, row * 0.06, this.p.frameCount * 0.006) * 42;
      this.buffer.fill(grid.hueAt(col, row), 190, shade);
      this.buffer.rect(x, y, CELL_SIZE + 0.25, CELL_SIZE + 0.25, 1);
    } else if (type === MATERIAL.SAND_SOURCE) {
      this.drawSource(x, y, 42, 205, 245);
    } else if (type === MATERIAL.WATER_SOURCE) {
      this.drawSource(x, y, 204, 180, 240);
    }
  }

  drawSource(x, y, hue, saturation, brightness) {
    this.buffer.fill(hue, saturation, brightness);
    this.buffer.rect(x, y, CELL_SIZE + 0.5, CELL_SIZE + 0.5, 1);
    this.buffer.fill(0, 0, 30, 150);
    this.buffer.rect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 1);
  }

  drawBrushPreview(state) {
    if (!state.pointerInCanvas || state.pointerOverToolbar) {
      return;
    }

    this.p.noFill();
    if (state.currentTool === "erase") {
      this.p.stroke(0, 0, 240, 170);
    } else if (state.currentTool === "water") {
      this.p.stroke(205, 185, 235, 170);
    } else if (state.currentTool === "wall") {
      this.p.stroke(214, 18, 190, 170);
    } else if (state.currentTool === "sandSource") {
      this.p.stroke(42, 205, 245, 190);
    } else if (state.currentTool === "waterSource") {
      this.p.stroke(204, 180, 240, 190);
    } else {
      this.p.stroke(state.hue, 200, 255, 170);
    }
    this.p.strokeWeight(2);
    this.p.circle(this.p.mouseX, this.p.mouseY, state.brushSize * CELL_SIZE);
    this.p.noStroke();
  }
}
