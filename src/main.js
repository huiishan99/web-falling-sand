import { CELL_SIZE, DEFAULT_STATE, MATERIAL } from "./constants.js";
import { Brush } from "./brush.js";
import { Grid } from "./grid.js";
import { InputController } from "./input.js";
import { Renderer } from "./renderer.js";
import { Simulation } from "./simulation.js";
import { UIController } from "./ui.js";

const state = { ...DEFAULT_STATE };

let brush;
let grid;
let input;
let renderer;
let simulation;
let ui;

new window.p5((p) => {
  p.setup = () => {
    let canvas = p.createCanvas(viewportWidth(), viewportHeight());
    canvas.parent("canvas-host");
    p.colorMode(p.HSB, 360, 255, 255, 255);

    grid = createGrid(p);
    brush = new Brush(p, state);
    renderer = new Renderer(p);
    simulation = new Simulation(p, brush);

    ui = new UIController(state, {
      clear: () => {
        grid = createGrid(p);
        ui.updateStats(getStats(grid));
      },
      save: () => p.saveCanvas("falling-sand", "png"),
      selectColorMode: (mode) => {
        state.colorMode = mode;
        if (mode === "warm") {
          state.hue = 38;
        }
        ui.sync();
      },
      selectTool: (tool) => {
        state.currentTool = tool;
        ui.sync();
      },
      setBrushSize: (size) => {
        state.brushSize = size;
        ui.sync();
      },
      setSimulationSpeed: (speed) => {
        state.simulationSpeed = speed;
        ui.sync();
      },
      step: () => {
        grid = simulation.step(grid);
      },
      togglePaused: () => {
        state.paused = !state.paused;
        ui.sync();
      }
    });
    ui.setup();

    input = new InputController(p, state, brush, () => grid, ui);
    renderer.resize(p.width, p.height);
  };

  p.draw = () => {
    renderer.draw(grid, {
      brushSize: state.brushSize,
      currentTool: state.currentTool,
      hue: state.hue,
      pointerInCanvas: input.pointerInCanvas(),
      pointerOverToolbar: input.pointerOverToolbar()
    });

    if (!state.paused) {
      for (let i = 0; i < state.simulationSpeed; i++) {
        grid = simulation.step(grid);
      }
    }

    ui.updateStats(getStats(grid));
  };

  p.mousePressed = (event) => {
    input.paintAtPointer(event);
  };

  p.mouseDragged = (event) => {
    input.paintAtPointer(event);
  };

  p.touchStarted = (event) => (input.paintAtPointer(event) ? false : true);

  p.touchMoved = (event) => (input.paintAtPointer(event) ? false : true);

  p.keyPressed = () => {
    handleKey(p.key);
  };

  p.windowResized = () => {
    let oldGrid = grid;
    p.resizeCanvas(viewportWidth(), viewportHeight());
    grid = createGrid(p);
    grid.resizeFrom(oldGrid);
    renderer.resize(p.width, p.height);
    ui.keepToolbarInBounds();
  };
});

function createGrid(p) {
  return new Grid(Math.floor(p.width / CELL_SIZE), Math.floor(p.height / CELL_SIZE));
}

function viewportWidth() {
  return window.innerWidth || document.documentElement.clientWidth;
}

function viewportHeight() {
  return window.innerHeight || document.documentElement.clientHeight;
}

function handleKey(key) {
  let keyMap = {
    1: "sand",
    2: "water",
    3: "wall",
    4: "sandSource",
    5: "waterSource",
    6: "erase"
  };

  if (key === " ") {
    state.paused = !state.paused;
  } else if (key === "c" || key === "C") {
    grid = new Grid(grid.cols, grid.rows);
  } else if (keyMap[key]) {
    state.currentTool = keyMap[key];
  }

  ui.sync();
}

function getStats(currentGrid) {
  let counts = currentGrid.countMaterials();
  return {
    sand: counts[MATERIAL.SAND],
    water: counts[MATERIAL.WATER],
    wall: counts[MATERIAL.WALL],
    sources: counts.sources
  };
}
