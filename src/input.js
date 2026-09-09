import { CELL_SIZE } from "./constants.js";

// Supercover lines seal diagonal corner crossings, including one-cell walls.
export function traceLine(x0, y0, x1, y1, visit) {
  let dx = x1 - x0,
    dy = y1 - y0;
  let nx = Math.abs(dx),
    ny = Math.abs(dy);
  let sx = Math.sign(dx),
    sy = Math.sign(dy);
  let x = x0,
    y = y0,
    ix = 0,
    iy = 0;
  visit(x, y);
  while (ix < nx || iy < ny) {
    let decision = (1 + 2 * ix) * ny - (1 + 2 * iy) * nx;
    if (decision === 0) {
      visit(x + sx, y);
      visit(x, y + sy);
      x += sx;
      y += sy;
      ix++;
      iy++;
    } else if (decision < 0) {
      x += sx;
      ix++;
    } else {
      y += sy;
      iy++;
    }
    visit(x, y);
  }
}

export class InputController {
  constructor(p, state, brush, getGrid, ui, onBegin) {
    Object.assign(this, { p, state, brush, getGrid, ui, onBegin });
    this.last = null;
    this.active = false;
  }
  attach(canvas) {
    this.canvas = canvas;
    canvas.tabIndex = 0;
    canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || this.active) return;
      canvas.focus({ preventScroll: true });
      this.active = true;
      this.pointerId = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
      this.onBegin();
      this.paint(event);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (this.active && event.pointerId === this.pointerId) this.paint(event);
    });
    for (let type of ["pointerup", "pointercancel", "lostpointercapture"]) {
      canvas.addEventListener(type, (event) => {
        if (event.pointerId === this.pointerId) this.end();
      });
    }
    window.addEventListener("blur", () => this.end());
  }
  end() {
    this.active = false;
    this.last = null;
    if (this.pointerId !== undefined && this.canvas?.hasPointerCapture(this.pointerId))
      this.canvas.releasePointerCapture(this.pointerId);
  }
  paint(event) {
    let bounds = this.canvas.getBoundingClientRect();
    let x = event.clientX - bounds.left,
      y = event.clientY - bounds.top;
    if (
      x < 0 ||
      y < 0 ||
      x >= this.p.width ||
      y >= this.p.height ||
      this.ui.pointerOverToolbar(null, event.clientX, event.clientY)
    ) {
      this.last = null;
      return;
    }
    let col = Math.floor(x / CELL_SIZE),
      row = Math.floor(y / CELL_SIZE);
    let start = this.last || { col, row };
    traceLine(start.col, start.row, col, row, (cx, cy) => this.stamp(cx, cy));
    this.last = { col, row };
    this.dirty = true;
    this.brush.advanceHue();
    event.preventDefault();
  }
  stamp(col, row) {
    let extent = Math.floor(this.state.brushSize / 2);
    for (let x = -extent; x <= extent; x++) {
      for (let y = -extent; y <= extent; y++) {
        if (x * x + y * y <= (extent + 0.35) ** 2) this.brush.paint(this.getGrid(), col + x, row + y);
      }
    }
  }
  pointerInCanvas() {
    return (
      this.p.mouseX >= 0 &&
      this.p.mouseX < this.p.width &&
      this.p.mouseY >= 0 &&
      this.p.mouseY < this.p.height
    );
  }
  pointerOverToolbar(event) {
    return this.ui.pointerOverToolbar(event, this.p.mouseX, this.p.mouseY);
  }
}
