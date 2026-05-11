import { COLOR_MODES } from "./constants.js";
import { TOOLS } from "./materials.js";

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

    this.setActive("[data-tool]", this.state.currentTool, "tool");
    this.setActive("[data-color-mode]", this.state.colorMode, "colorMode");
  }

  updateStats(counts) {
    this.elements.stats.innerHTML = `${counts.sand} sand<br>${counts.water} water<br>${counts.wall} walls<br>${counts.sources} sources`;
  }

  setActive(selector, activeId, dataName) {
    document.querySelectorAll(selector).forEach((button) => {
      button.classList.toggle("active", button.dataset[dataName] === activeId);
    });
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
