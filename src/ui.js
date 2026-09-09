import { COLOR_MODES } from "./constants.js";
import { TOOLS } from "./materials.js";
import { PRESETS } from "./presets.js";

export class UIController {
  constructor(state, handlers) {
    this.state = state;
    this.handlers = handlers;
    this.toolbar = document.getElementById("toolbar");
    this.drag = null;

    this.elements = {
      colorButtons: document.getElementById("color-buttons"),
      sizeInput: document.getElementById("brush-size"),
      sizeValue: document.getElementById("brush-size-value"),
      speedInput: document.getElementById("sim-speed"),
      speedValue: document.getElementById("sim-speed-value"),
      stats: document.getElementById("particle-count"),
      pauseButton: document.getElementById("pause-toggle"),
      toolButtons: document.getElementById("tool-buttons")
    };
  }

  setup() {
    this.renderToolButtons();
    this.renderColorButtons();
    this.setupControls();
    this.setupDrag();
    this.setupSceneControls();
    this.setCollapsed(window.matchMedia("(max-width: 620px)").matches);
    this.sync();
  }

  renderToolButtons() {
    this.elements.toolButtons.innerHTML = "";
    TOOLS.forEach((tool) => {
      let button = document.createElement("button");
      button.type = "button";
      button.dataset.tool = tool.id;
      button.title = `${tool.title} (${tool.key})`;
      button.textContent = tool.label;
      button.addEventListener("click", () => this.handlers.selectTool(tool.id));
      this.elements.toolButtons.append(button);
    });
  }

  renderColorButtons() {
    this.elements.colorButtons.innerHTML = "";
    COLOR_MODES.forEach((mode) => {
      let button = document.createElement("button");
      button.type = "button";
      button.dataset.colorMode = mode.id;
      button.title = mode.title;
      button.textContent = mode.label;
      button.addEventListener("click", () => this.handlers.selectColorMode(mode.id));
      this.elements.colorButtons.append(button);
    });
  }

  setupControls() {
    this.elements.sizeInput.addEventListener("input", () => {
      this.handlers.setBrushSize(Number(this.elements.sizeInput.value));
    });

    this.elements.speedInput.addEventListener("input", () => {
      this.handlers.setSimulationSpeed(Number(this.elements.speedInput.value));
    });

    this.elements.pauseButton.addEventListener("click", this.handlers.togglePaused);
    document.getElementById("step-grid").addEventListener("click", this.handlers.step);
    document.getElementById("save-canvas").addEventListener("click", this.handlers.save);
    document.getElementById("clear-grid").addEventListener("click", this.handlers.clear);
  }

  setupDrag() {
    let handle = this.toolbar.querySelector("[data-drag-handle]");
    handle.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button") || window.matchMedia("(max-width: 620px)").matches) return;
      let bounds = this.toolbar.getBoundingClientRect();
      this.drag = {
        offsetX: event.clientX - bounds.left,
        offsetY: event.clientY - bounds.top
      };
      this.toolbar.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    this.toolbar.addEventListener("pointermove", (event) => {
      if (!this.drag) {
        return;
      }
      this.moveToolbar(event.clientX - this.drag.offsetX, event.clientY - this.drag.offsetY);
    });

    this.toolbar.addEventListener("pointerup", (event) => {
      this.drag = null;
      if (this.toolbar.hasPointerCapture(event.pointerId)) {
        this.toolbar.releasePointerCapture(event.pointerId);
      }
    });

    this.toolbar.addEventListener("pointercancel", () => {
      this.drag = null;
    });
  }

  moveToolbar(left, top) {
    let bounds = this.toolbar.getBoundingClientRect();
    let maxLeft = Math.max(8, window.innerWidth - bounds.width - 8);
    let maxTop = Math.max(8, window.innerHeight - bounds.height - 8);

    this.toolbar.style.left = `${clamp(left, 8, maxLeft)}px`;
    this.toolbar.style.top = `${clamp(top, 8, maxTop)}px`;
    this.toolbar.style.right = "auto";
    this.toolbar.style.bottom = "auto";
  }

  keepToolbarInBounds() {
    if (window.matchMedia("(max-width: 620px)").matches) {
      this.toolbar.removeAttribute("style");
      return;
    }
    let bounds = this.toolbar.getBoundingClientRect();
    this.moveToolbar(bounds.left, bounds.top);
  }

  pointerOverToolbar(event, mouseX, mouseY) {
    if (event?.target?.closest?.("#toolbar")) {
      return true;
    }
    let bounds = this.toolbar.getBoundingClientRect();
    return mouseX >= bounds.left && mouseX <= bounds.right && mouseY >= bounds.top && mouseY <= bounds.bottom;
  }

  sync() {
    this.elements.sizeInput.value = String(this.state.brushSize);
    this.elements.sizeValue.textContent = String(this.state.brushSize);
    this.elements.speedInput.value = String(this.state.simulationSpeed);
    this.elements.speedValue.textContent = `${this.state.simulationSpeed}x`;
    this.elements.pauseButton.textContent = this.state.paused ? "Resume" : "Pause";
    document.getElementById("quick-pause").textContent = this.state.paused ? "Resume" : "Pause";
    document.getElementById("current-tool").textContent = TOOLS.find(
      (tool) => tool.id === this.state.currentTool
    )?.label;

    this.setActive("[data-tool]", this.state.currentTool, "tool");
    this.setActive("[data-color-mode]", this.state.colorMode, "colorMode");
  }

  updateStats(counts) {
    let markup = `${counts.sand} sand<br>${counts.water} water<br>${counts.wall} walls<br>${counts.sources} sources`;
    if (markup !== this.lastStatsMarkup) {
      this.elements.stats.innerHTML = markup;
      this.lastStatsMarkup = markup;
    }
  }

  setActive(selector, activeId, dataName) {
    document.querySelectorAll(selector).forEach((button) => {
      button.classList.toggle("active", button.dataset[dataName] === activeId);
      button.setAttribute("aria-pressed", String(button.dataset[dataName] === activeId));
    });
  }

  setupSceneControls() {
    let select = document.getElementById("preset-select");
    PRESETS.forEach((preset) => {
      let option = document.createElement("option");
      option.value = preset.id;
      option.textContent = preset.label;
      select.append(option);
    });
    document
      .getElementById("load-preset")
      .addEventListener("click", () => this.handlers.preset(select.value));
    for (let [id, action] of [
      ["undo", "undo"],
      ["redo", "redo"],
      ["quick-undo", "undo"],
      ["quick-pause", "togglePaused"],
      ["save-scene", "saveScene"],
      ["load-scene", "loadScene"],
      ["export-scene", "exportScene"]
    ]) {
      document.getElementById(id).addEventListener("click", this.handlers[action]);
    }
    let fileInput = document.getElementById("scene-file");
    document.getElementById("import-scene").addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
      this.handlers.importScene(fileInput.files[0]);
      fileInput.value = "";
    });
    document.getElementById("toolbar-toggle").addEventListener("click", () => {
      this.setCollapsed(!this.toolbar.classList.contains("collapsed"));
      this.keepToolbarInBounds();
    });
  }

  setCollapsed(collapsed) {
    this.toolbar.classList.toggle("collapsed", collapsed);
    let button = document.getElementById("toolbar-toggle");
    button.textContent = collapsed ? "Tools" : "Hide";
    button.setAttribute("aria-expanded", String(!collapsed));
    document.getElementById("toolbar-content").hidden = collapsed;
  }

  updateHistory(history) {
    for (let id of ["undo", "quick-undo"]) document.getElementById(id).disabled = !history.past.length;
    document.getElementById("redo").disabled = !history.future.length;
  }

  announce(message) {
    document.getElementById("scene-status").textContent = message;
  }
  updatePerformance(fps) {
    document.getElementById("fps").textContent = `${Math.round(fps)} fps`;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
