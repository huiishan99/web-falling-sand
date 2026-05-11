import { MATERIAL } from "./constants.js";

export class Grid {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.size = cols * rows;
    this.types = new Uint8Array(this.size);
    this.hues = new Uint16Array(this.size);
  }

  index(col, row) {
    return row * this.cols + col;
  }

  inBounds(col, row) {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  typeAt(col, row) {
    return this.types[this.index(col, row)];
  }

  hueAt(col, row) {
    return this.hues[this.index(col, row)];
  }

  isEmpty(col, row) {
    return this.inBounds(col, row) && this.typeAt(col, row) === MATERIAL.EMPTY;
  }

  set(col, row, type, hue = 0) {
    if (!this.inBounds(col, row)) {
      return false;
    }

    let index = this.index(col, row);
    this.types[index] = type;
    this.hues[index] = hue;
    return true;
  }

  clear(col, row) {
    return this.set(col, row, MATERIAL.EMPTY, 0);
  }

  copyCellFrom(source, fromCol, fromRow, toCol, toRow) {
    let sourceIndex = source.index(fromCol, fromRow);
    let targetIndex = this.index(toCol, toRow);
    this.types[targetIndex] = source.types[sourceIndex];
    this.hues[targetIndex] = source.hues[sourceIndex];
  }

  cloneCell(col, row) {
    let index = this.index(col, row);
    return {
      type: this.types[index],
      hue: this.hues[index]
    };
  }

  resizeFrom(oldGrid) {
    let copyCols = Math.min(this.cols, oldGrid.cols);
    let copyRows = Math.min(this.rows, oldGrid.rows);

    for (let row = 0; row < copyRows; row++) {
      for (let col = 0; col < copyCols; col++) {
        let oldIndex = oldGrid.index(col, row);
        let nextIndex = this.index(col, row);
        this.types[nextIndex] = oldGrid.types[oldIndex];
        this.hues[nextIndex] = oldGrid.hues[oldIndex];
      }
    }
  }

  countMaterials() {
    let counts = {
      [MATERIAL.SAND]: 0,
      [MATERIAL.WATER]: 0,
      [MATERIAL.WALL]: 0,
      sources: 0
    };

    for (let i = 0; i < this.size; i++) {
      let type = this.types[i];
      if (type === MATERIAL.SAND || type === MATERIAL.WATER || type === MATERIAL.WALL) {
        counts[type]++;
      } else if (type === MATERIAL.SAND_SOURCE || type === MATERIAL.WATER_SOURCE) {
        counts.sources++;
      }
    }

    return counts;
  }
}
