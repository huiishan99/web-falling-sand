export const CELL_SIZE = 4;

export const MATERIAL = {
  EMPTY: 0,
  WALL: 1,
  WATER: 2,
  SAND: 3,
  SAND_SOURCE: 4,
  WATER_SOURCE: 5
};

export const DEFAULT_STATE = {
  brushSize: 5,
  colorMode: "rainbow",
  currentTool: "sand",
  hue: 200,
  paused: false,
  simulationSpeed: 1
};

export const COLOR_MODES = [
  { id: "rainbow", label: "Rainbow", title: "Rainbow colors" },
  { id: "warm", label: "Warm", title: "Warm sand colors" }
];
