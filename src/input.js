import { CELL_SIZE } from "./constants.js";

export class InputController {
  constructor(p, state, brush, getGrid, ui) {
    this.p = p;
    this.state = state;
    this.brush = brush;
    this.getGrid = getGrid;
    this.ui = ui;
  }

  paintAtPointer(event) {
    if (!this.pointerInCanvas() || this.pointerOverToolbar(event)) {
      return false;
    }

    let grid = this.getGrid();
    let centerCol = Math.floor(this.p.mouseX / CELL_SIZE);
    let centerRow = Math.floor(this.p.mouseY / CELL_SIZE);
    let extent = Math.floor(this.state.brushSize / 2);

    for (let offsetCol = -extent; offsetCol <= extent; offsetCol++) {
      for (let offsetRow = -extent; offsetRow <= extent; offsetRow++) {
        if (this.p.dist(0, 0, offsetCol, offsetRow) > extent + 0.35) {
          continue;
        }

        this.brush.paint(grid, centerCol + offsetCol, centerRow + offsetRow);
      }
    }

    this.brush.advanceHue();
    return true;
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
