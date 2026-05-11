import { MATERIAL } from "./constants.js";
import { Grid } from "./grid.js";
import { MATERIALS } from "./materials.js";

export class Simulation {
  constructor(p, brush) {
    this.p = p;
    this.brush = brush;
  }

  step(grid) {
    let nextGrid = new Grid(grid.cols, grid.rows);

    for (let row = grid.rows - 1; row >= 0; row--) {
      let leftToRight = (this.p.frameCount + row) % 2 === 0;
      let start = leftToRight ? 0 : grid.cols - 1;
      let end = leftToRight ? grid.cols : -1;
      let step = leftToRight ? 1 : -1;

      for (let col = start; col !== end; col += step) {
        if (nextGrid.typeAt(col, row) !== MATERIAL.EMPTY) {
          continue;
        }

        this.updateCell(grid, nextGrid, col, row);
      }
    }

    return nextGrid;
  }

  updateCell(grid, nextGrid, col, row) {
    let type = grid.typeAt(col, row);

    if (type === MATERIAL.EMPTY) {
      return;
    }
    if (type === MATERIAL.WALL) {
      nextGrid.copyCellFrom(grid, col, row, col, row);
      return;
    }
    if (type === MATERIAL.SAND_SOURCE || type === MATERIAL.WATER_SOURCE) {
      this.updateSource(grid, nextGrid, col, row);
      return;
    }
    if (type === MATERIAL.WATER) {
      this.updateWater(grid, nextGrid, col, row);
      return;
    }
    if (type === MATERIAL.SAND) {
      this.updateSand(grid, nextGrid, col, row);
    }
  }

  updateSource(grid, nextGrid, col, row) {
    nextGrid.copyCellFrom(grid, col, row, col, row);

    let source = MATERIALS[grid.typeAt(col, row)];
    let productHue = source.sourceProduct === MATERIAL.SAND ? this.brush.nextHue() : 0;
    if (this.tryEmit(grid, nextGrid, col, row + 1, source.sourceProduct, productHue)) {
      return;
    }

    let firstDir = this.p.random(1) < 0.5 ? -1 : 1;
    if (this.tryEmit(grid, nextGrid, col + firstDir, row, source.sourceProduct, productHue)) {
      return;
    }
    this.tryEmit(grid, nextGrid, col - firstDir, row, source.sourceProduct, productHue);
  }

  tryEmit(grid, nextGrid, col, row, type, hue) {
    if (!this.isEmptyInBoth(grid, nextGrid, col, row)) {
      return false;
    }

    nextGrid.set(col, row, type, hue);
    return true;
  }

  updateSand(grid, nextGrid, col, row) {
    if (this.tryMoveByDensity(grid, nextGrid, col, row, col, row + 1)) {
      return;
    }

    let firstDir = this.p.random(1) < 0.5 ? -1 : 1;
    if (this.tryMoveByDensity(grid, nextGrid, col, row, col + firstDir, row + 1)) {
      return;
    }
    if (this.tryMoveByDensity(grid, nextGrid, col, row, col - firstDir, row + 1)) {
      return;
    }

    nextGrid.copyCellFrom(grid, col, row, col, row);
  }

  tryMoveByDensity(grid, nextGrid, fromCol, fromRow, toCol, toRow) {
    if (!grid.inBounds(toCol, toRow)) {
      return false;
    }

    let movingType = grid.typeAt(fromCol, fromRow);
    let targetType = grid.typeAt(toCol, toRow);
    let targetNextType = nextGrid.typeAt(toCol, toRow);

    if (targetType === MATERIAL.EMPTY && targetNextType === MATERIAL.EMPTY) {
      nextGrid.copyCellFrom(grid, fromCol, fromRow, toCol, toRow);
      return true;
    }

    let movingDensity = MATERIALS[movingType].density;
    let targetDensity = MATERIALS[targetType]?.density ?? 100;
    if (movingDensity > targetDensity && targetNextType === MATERIAL.EMPTY) {
      nextGrid.copyCellFrom(grid, fromCol, fromRow, toCol, toRow);
      if (nextGrid.typeAt(fromCol, fromRow) === MATERIAL.EMPTY) {
        nextGrid.copyCellFrom(grid, toCol, toRow, fromCol, fromRow);
      }
      return true;
    }

    return false;
  }

  updateWater(grid, nextGrid, col, row) {
    if (this.tryMoveWater(grid, nextGrid, col, row, col, row + 1)) {
      return;
    }

    let firstDir = this.p.random(1) < 0.5 ? -1 : 1;
    if (this.tryMoveWater(grid, nextGrid, col, row, col + firstDir, row + 1)) {
      return;
    }
    if (this.tryMoveWater(grid, nextGrid, col, row, col - firstDir, row + 1)) {
      return;
    }
    if (this.tryWaterPressure(grid, nextGrid, col, row, firstDir)) {
      return;
    }
    if (this.tryWaterPressure(grid, nextGrid, col, row, -firstDir)) {
      return;
    }

    nextGrid.copyCellFrom(grid, col, row, col, row);
  }

  tryMoveWater(grid, nextGrid, fromCol, fromRow, toCol, toRow) {
    if (!this.isEmptyInBoth(grid, nextGrid, toCol, toRow)) {
      return false;
    }

    nextGrid.copyCellFrom(grid, fromCol, fromRow, toCol, toRow);
    return true;
  }

  tryWaterPressure(grid, nextGrid, fromCol, fromRow, dir) {
    for (let distance = 1; distance <= 3; distance++) {
      let col = fromCol + dir * distance;
      if (!this.isEmptyInBoth(grid, nextGrid, col, fromRow)) {
        return false;
      }

      if (grid.inBounds(col, fromRow + 1) && grid.typeAt(col, fromRow + 1) === MATERIAL.EMPTY) {
        nextGrid.copyCellFrom(grid, fromCol, fromRow, col, fromRow + 1);
        return true;
      }

      if (distance === 1 || this.p.random(1) < 0.4) {
        nextGrid.copyCellFrom(grid, fromCol, fromRow, col, fromRow);
        return true;
      }
    }

    return false;
  }

  isEmptyInBoth(grid, nextGrid, col, row) {
    return (
      grid.inBounds(col, row) &&
      grid.typeAt(col, row) === MATERIAL.EMPTY &&
      nextGrid.typeAt(col, row) === MATERIAL.EMPTY
    );
  }
}
