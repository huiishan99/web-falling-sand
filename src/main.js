import { CELL_SIZE, DEFAULT_STATE, MATERIAL } from "./constants.js";
import { Brush } from "./brush.js";
import { Grid } from "./grid.js";
import { InputController } from "./input.js";
import { Renderer } from "./renderer.js";
import { Simulation } from "./simulation.js";
import { UIController } from "./ui.js";
import { History, parseScene, serializeScene, STORAGE_KEY, MAX_FILE_BYTES } from "./scene.js";
import { createPreset, PRESETS } from "./presets.js";

const state = { ...DEFAULT_STATE };
const history = new History();
let grid, brush, renderer, simulation, input, ui;
new window.p5((p) => {
  let lastStats = 0;
  let actions;
  const dimensions = () => [
    Math.max(1, Math.floor(p.width / CELL_SIZE)),
    Math.max(1, Math.floor(p.height / CELL_SIZE))
  ];
  const remember = () => {
    history.record(grid);
    ui.updateHistory(history);
  };
  const refresh = () => {
    let counts = grid.countMaterials();
    ui.updateStats({
      sand: counts[MATERIAL.SAND],
      water: counts[MATERIAL.WATER],
      wall: counts[MATERIAL.WALL],
      sources: counts.sources
    });
    ui.updateHistory(history);
    ui.sync();
  };
  const replace = (next, message, record = true) => {
    input?.end();
    if (record) remember();
    let fitted = new Grid(...dimensions());
    fitted.resizeFrom(next);
    let cropped = next.maxCol >= fitted.cols || next.maxRow >= fitted.rows;
    grid = fitted;
    simulation.spare = null;
    state.paused = true;
    renderer.invalidate();
    refresh();
    ui.announce(
      message + (cropped ? " Outside-screen cells were cropped; the original save is unchanged." : "")
    );
  };
  const loadText = (text) => replace(parseScene(text), "Scene loaded and paused. Resume when ready.");
  const reportError = (error) => ui.announce(error.message || "Unable to complete that action.");
  p.setup = () => {
    p.pixelDensity(1);
    let canvas = p.createCanvas(window.innerWidth, window.innerHeight);
    canvas.parent("canvas-host");
    canvas.elt.setAttribute("aria-label", "Falling sand drawing canvas");
    p.colorMode(p.HSB, 360, 255, 255, 255);
    grid = createPreset("hourglass", ...dimensions());
    brush = new Brush(p, state);
    renderer = new Renderer(p);
    simulation = new Simulation(p, brush);
    actions = {
      clear: () => replace(new Grid(...dimensions()), "Canvas cleared. Undo restores the previous scene."),
      save: () => p.saveCanvas("falling-sand", "png"),
      undo: () => {
        let next = history.undo(grid);
        if (next) replace(next, "Undone. Simulation paused.", false);
      },
      redo: () => {
        let next = history.redo(grid);
        if (next) replace(next, "Redone. Simulation paused.", false);
      },
      saveScene: () => {
        try {
          window.localStorage.setItem(STORAGE_KEY, serializeScene(grid));
          ui.announce("Scene saved in this browser. Export JSON for a portable backup.");
        } catch {
          ui.announce("Browser storage is unavailable or full. Use Export JSON instead.");
        }
      },
      loadScene: () => {
        try {
          let text = window.localStorage.getItem(STORAGE_KEY);
          if (!text) {
            ui.announce("No saved scene in this browser yet.");
            return;
          }
          loadText(text);
        } catch (error) {
          reportError(error);
        }
      },
      exportScene: () => {
        let blob = new window.Blob([serializeScene(grid)], { type: "application/json" });
        let url = window.URL.createObjectURL(blob);
        let anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "falling-sand-scene.json";
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
        ui.announce("Scene exported as JSON.");
      },
      importScene: async (file) => {
        if (!file) return;
        try {
          if (file.size > MAX_FILE_BYTES) throw new Error("Scene file is too large (maximum 12 MB).");
          loadText(await file.text());
        } catch (error) {
          reportError(error);
        }
      },
      preset: (id) => {
        replace(createPreset(id, ...dimensions()), PRESETS.find((item) => item.id === id).hint);
      },
      selectColorMode: (mode) => {
        state.colorMode = mode;
        if (mode === "warm") state.hue = 38;
        ui.sync();
      },
      selectTool: (tool) => {
        input?.end();
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
        state.paused = true;
        grid = simulation.step(grid);
        renderer.invalidate();
        refresh();
      },
      togglePaused: () => {
        state.paused = !state.paused;
        ui.sync();
      }
    };
    ui = new UIController(state, actions);
    ui.setup();
    input = new InputController(p, state, brush, () => grid, ui, remember);
    input.attach(canvas.elt);
    renderer.resize(p.width, p.height);
    refresh();
    ui.announce("Try the hourglass, or choose a scene. Draw to experiment.");
  };
  p.draw = () => {
    if (!state.paused && !input.active) {
      for (let i = 0; i < state.simulationSpeed; i++) grid = simulation.step(grid);
    }
    renderer.draw(grid, {
      brushSize: state.brushSize,
      currentTool: state.currentTool,
      hue: state.hue,
      pointerInCanvas: input.pointerInCanvas(),
      pointerOverToolbar: input.pointerOverToolbar(),
      dirty: !state.paused || input.active || input.dirty
    });
    input.dirty = false;
    if (p.millis() - lastStats > 250) {
      refresh();
      ui.updatePerformance(p.frameRate());
      lastStats = p.millis();
    }
  };
  p.keyPressed = (event) => {
    if (event.target?.closest?.("input, select, textarea, button, [contenteditable]")) return;
    let key = p.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "z") {
      event.preventDefault();
      (event.shiftKey ? actions.redo : actions.undo)();
      return false;
    }
    if ((event.ctrlKey || event.metaKey) && key === "y") {
      event.preventDefault();
      actions.redo();
      return false;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    let tools = { 1: "sand", 2: "water", 3: "wall", 4: "sandSource", 5: "waterSource", 6: "erase" };
    if (key === " ") {
      actions.togglePaused();
      return false;
    }
    if (key === "c") actions.clear();
    if (tools[key]) actions.selectTool(tools[key]);
  };
  p.windowResized = () => {
    input.end();
    let old = grid;
    p.resizeCanvas(window.innerWidth, window.innerHeight);
    let next = new Grid(...dimensions());
    if (old.cols !== next.cols || old.rows !== next.rows) {
      remember();
      next.resizeFrom(old);
      grid = next;
      simulation.spare = null;
    }
    renderer.resize(p.width, p.height);
    ui.keepToolbarInBounds();
    refresh();
  };
});
