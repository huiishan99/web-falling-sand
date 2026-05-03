const CELL_SIZE = 4;
const EMPTY = 0;
const WALL = 1;
const WATER = 2;
const SAND = 3;
const SAND_SOURCE = 4;
const WATER_SOURCE = 5;

const TOOLS = {
    sand: SAND,
    water: WATER,
    wall: WALL,
    sandSource: SAND_SOURCE,
    waterSource: WATER_SOURCE,
    erase: EMPTY
};

const MATERIALS = {
    [EMPTY]: { name: "empty" },
    [WALL]: { name: "wall" },
    [WATER]: { name: "water" },
    [SAND]: { name: "sand" },
    [SAND_SOURCE]: { name: "sand source" },
    [WATER_SOURCE]: { name: "water source" }
};

let grid;
let cols;
let rows;

let brushSize = 5;
let currentTool = "sand";
let colorModeName = "rainbow";
let hueValue = 200;
let paused = false;
let simulationSpeed = 1;

let counts = {
    [SAND]: 0,
    [WATER]: 0,
    [WALL]: 0,
    sources: 0
};

let ui = {};
let toolbarDrag = null;

function makeCell(type = EMPTY, hue = 0) {
    return { type, hue };
}

function makeGrid(nextCols, nextRows) {
    let next = new Array(nextCols);
    for (let col = 0; col < nextCols; col++) {
        next[col] = new Array(nextRows);
        for (let row = 0; row < nextRows; row++) {
            next[col][row] = makeCell();
        }
    }
    return next;
}

function setup() {
    const canvas = createCanvas(viewportWidth(), viewportHeight());
    canvas.parent("canvas-host");
    colorMode(HSB, 360, 255, 255, 255);

    resetGrid();
    setupControls();
}

function draw() {
    background(218, 28, 7);
    drawCells();

    if (!paused) {
        for (let i = 0; i < simulationSpeed; i++) {
            updateGrid();
        }
    }

    drawBrushPreview();
    updateStats();
}

function resetGrid() {
    cols = floor(width / CELL_SIZE);
    rows = floor(height / CELL_SIZE);
    grid = makeGrid(cols, rows);
}

function viewportWidth() {
    return window.innerWidth || document.documentElement.clientWidth;
}

function viewportHeight() {
    return window.innerHeight || document.documentElement.clientHeight;
}

function insideGrid(col, row) {
    return col >= 0 && col < cols && row >= 0 && row < rows;
}

function setupControls() {
    ui.toolbar = document.getElementById("toolbar");
    ui.sizeInput = document.getElementById("brush-size");
    ui.sizeValue = document.getElementById("brush-size-value");
    ui.speedInput = document.getElementById("sim-speed");
    ui.speedValue = document.getElementById("sim-speed-value");
    ui.pauseButton = document.getElementById("pause-toggle");
    ui.stats = document.getElementById("particle-count");

    setupToolButtons();
    setupColorButtons();
    setupControlInputs();
    setupToolbarDrag();
}

function setupToolButtons() {
    document.querySelectorAll("[data-tool]").forEach((button) => {
        button.addEventListener("click", () => {
            selectTool(button.dataset.tool);
        });
    });
}

function setupColorButtons() {
    document.querySelectorAll("[data-color-mode]").forEach((button) => {
        button.addEventListener("click", () => {
            colorModeName = button.dataset.colorMode;
            if (colorModeName === "warm") {
                hueValue = 38;
            }
            setActiveButton("[data-color-mode]", button);
        });
    });
}

function setupControlInputs() {
    ui.sizeInput.addEventListener("input", () => {
        brushSize = Number(ui.sizeInput.value);
        ui.sizeValue.textContent = brushSize;
    });

    ui.speedInput.addEventListener("input", () => {
        simulationSpeed = Number(ui.speedInput.value);
        ui.speedValue.textContent = `${simulationSpeed}x`;
    });

    ui.pauseButton.addEventListener("click", () => {
        togglePaused();
    });

    document.getElementById("step-grid").addEventListener("click", () => {
        updateGrid();
    });

    document.getElementById("save-canvas").addEventListener("click", () => {
        saveCanvas("falling-sand", "png");
    });

    document.getElementById("clear-grid").addEventListener("click", () => {
        resetGrid();
        resetCounts();
        updateStats();
    });
}

function setupToolbarDrag() {
    let handle = ui.toolbar.querySelector(".brand");

    handle.addEventListener("pointerdown", (event) => {
        let bounds = ui.toolbar.getBoundingClientRect();
        toolbarDrag = {
            offsetX: event.clientX - bounds.left,
            offsetY: event.clientY - bounds.top
        };
        ui.toolbar.setPointerCapture(event.pointerId);
        event.preventDefault();
    });

    ui.toolbar.addEventListener("pointermove", (event) => {
        if (!toolbarDrag) {
            return;
        }
        moveToolbar(event.clientX - toolbarDrag.offsetX, event.clientY - toolbarDrag.offsetY);
    });

    ui.toolbar.addEventListener("pointerup", (event) => {
        toolbarDrag = null;
        if (ui.toolbar.hasPointerCapture(event.pointerId)) {
            ui.toolbar.releasePointerCapture(event.pointerId);
        }
    });

    ui.toolbar.addEventListener("pointercancel", () => {
        toolbarDrag = null;
    });
}

function moveToolbar(left, top) {
    let bounds = ui.toolbar.getBoundingClientRect();
    let maxLeft = Math.max(8, viewportWidth() - bounds.width - 8);
    let maxTop = Math.max(8, viewportHeight() - bounds.height - 8);

    ui.toolbar.style.left = `${constrain(left, 8, maxLeft)}px`;
    ui.toolbar.style.top = `${constrain(top, 8, maxTop)}px`;
    ui.toolbar.style.right = "auto";
    ui.toolbar.style.bottom = "auto";
}

function selectTool(tool) {
    currentTool = tool;
    setActiveButton("[data-tool]", document.querySelector(`[data-tool="${tool}"]`));
}

function setActiveButton(selector, activeButton) {
    document.querySelectorAll(selector).forEach((button) => {
        button.classList.toggle("active", button === activeButton);
    });
}

function togglePaused() {
    paused = !paused;
    ui.pauseButton.textContent = paused ? "Resume" : "Pause";
}

function mousePressed(event) {
    paintAtPointer(event);
}

function mouseDragged(event) {
    paintAtPointer(event);
}

function touchStarted(event) {
    return paintAtPointer(event) ? false : true;
}

function touchMoved(event) {
    return paintAtPointer(event) ? false : true;
}

function keyPressed() {
    if (key === " ") {
        togglePaused();
    } else if (key === "c" || key === "C") {
        resetGrid();
        resetCounts();
        updateStats();
    } else if (key === "1") {
        selectTool("sand");
    } else if (key === "2") {
        selectTool("water");
    } else if (key === "3") {
        selectTool("wall");
    } else if (key === "4") {
        selectTool("sandSource");
    } else if (key === "5") {
        selectTool("waterSource");
    } else if (key === "6") {
        selectTool("erase");
    }
}

function paintAtPointer(event) {
    if (!pointerInCanvas() || pointerOverToolbar(event)) {
        return false;
    }

    let centerCol = floor(mouseX / CELL_SIZE);
    let centerRow = floor(mouseY / CELL_SIZE);
    let extent = floor(brushSize / 2);

    for (let offsetCol = -extent; offsetCol <= extent; offsetCol++) {
        for (let offsetRow = -extent; offsetRow <= extent; offsetRow++) {
            if (dist(0, 0, offsetCol, offsetRow) > extent + 0.35) {
                continue;
            }

            paintCell(centerCol + offsetCol, centerRow + offsetRow);
        }
    }

    if (currentTool === "sand") {
        advanceBrushHue();
    }

    return true;
}

function paintCell(col, row) {
    if (!insideGrid(col, row)) {
        return;
    }

    let type = TOOLS[currentTool];
    if (type === EMPTY) {
        grid[col][row] = makeCell();
    } else if (type === SAND) {
        if (random(1) < 0.78) {
            grid[col][row] = makeCell(SAND, getBrushHue());
        }
    } else {
        grid[col][row] = makeCell(type);
    }
}

function advanceBrushHue() {
    hueValue += colorModeName === "rainbow" ? 1 : 0.8;
    if (colorModeName === "rainbow" && hueValue > 360) {
        hueValue = 1;
    }
    if (colorModeName === "warm" && hueValue > 52) {
        hueValue = 34;
    }
}

function getBrushHue() {
    let hueJitter = colorModeName === "rainbow" ? random(-14, 14) : random(-8, 8);
    return (hueValue + hueJitter + 360) % 360;
}

function drawCells() {
    resetCounts();
    noStroke();

    for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
            let cell = grid[col][row];
            if (cell.type === EMPTY) {
                continue;
            }

            counts[cell.type]++;
            if (cell.type === SAND_SOURCE || cell.type === WATER_SOURCE) {
                counts.sources++;
            }
            drawCell(cell, col, row);
        }
    }
}

function drawCell(cell, col, row) {
    let x = col * CELL_SIZE;
    let y = row * CELL_SIZE;

    if (cell.type === WALL) {
        fill(214, 14, 110);
        rect(x, y, CELL_SIZE + 0.2, CELL_SIZE + 0.2, 1);
    } else if (cell.type === WATER) {
        let shade = 178 + noise(col * 0.08, row * 0.08, frameCount * 0.02) * 28;
        fill(204, 165, shade, 195);
        rect(x, y, CELL_SIZE + 0.5, CELL_SIZE + 0.5, 1);
    } else if (cell.type === SAND) {
        let shade = 205 + noise(col * 0.06, row * 0.06, frameCount * 0.006) * 42;
        fill(cell.hue, 190, shade);
        rect(x, y, CELL_SIZE + 0.25, CELL_SIZE + 0.25, 1);
    } else if (cell.type === SAND_SOURCE) {
        fill(42, 205, 245);
        rect(x, y, CELL_SIZE + 0.5, CELL_SIZE + 0.5, 1);
        fill(0, 0, 30, 150);
        rect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 1);
    } else if (cell.type === WATER_SOURCE) {
        fill(204, 180, 240);
        rect(x, y, CELL_SIZE + 0.5, CELL_SIZE + 0.5, 1);
        fill(0, 0, 30, 150);
        rect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 1);
    }
}

function updateGrid() {
    let nextGrid = makeGrid(cols, rows);

    for (let row = rows - 1; row >= 0; row--) {
        let leftToRight = (frameCount + row) % 2 === 0;
        let start = leftToRight ? 0 : cols - 1;
        let end = leftToRight ? cols : -1;
        let step = leftToRight ? 1 : -1;

        for (let col = start; col !== end; col += step) {
            if (nextGrid[col][row].type !== EMPTY) {
                continue;
            }

            updateCell(col, row, nextGrid);
        }
    }

    grid = nextGrid;
}

function updateCell(col, row, nextGrid) {
    let cell = grid[col][row];

    if (cell.type === WALL) {
        setNext(nextGrid, col, row, cell);
    } else if (cell.type === SAND_SOURCE || cell.type === WATER_SOURCE) {
        updateSource(col, row, cell, nextGrid);
    } else if (cell.type === WATER) {
        updateWater(col, row, nextGrid);
    } else if (cell.type === SAND) {
        updateSand(col, row, cell, nextGrid);
    }
}

function updateSource(col, row, cell, nextGrid) {
    setNext(nextGrid, col, row, cell);

    let product = cell.type === SAND_SOURCE ? makeCell(SAND, getBrushHue()) : makeCell(WATER);
    if (tryEmitFromSource(col, row + 1, product, nextGrid)) {
        return;
    }

    let firstDir = random(1) < 0.5 ? -1 : 1;
    if (tryEmitFromSource(col + firstDir, row, product, nextGrid)) {
        return;
    }
    tryEmitFromSource(col - firstDir, row, product, nextGrid);
}

function tryEmitFromSource(col, row, product, nextGrid) {
    if (!insideGrid(col, row) || !cellIsEmpty(col, row, nextGrid)) {
        return false;
    }

    setNext(nextGrid, col, row, product);
    return true;
}

function updateSand(col, row, cell, nextGrid) {
    if (tryMoveSand(col, row, col, row + 1, cell, nextGrid)) {
        return;
    }

    let firstDir = random(1) < 0.5 ? -1 : 1;
    if (tryMoveSand(col, row, col + firstDir, row + 1, cell, nextGrid)) {
        return;
    }
    if (tryMoveSand(col, row, col - firstDir, row + 1, cell, nextGrid)) {
        return;
    }

    setNext(nextGrid, col, row, cell);
}

function tryMoveSand(fromCol, fromRow, toCol, toRow, cell, nextGrid) {
    if (!insideGrid(toCol, toRow)) {
        return false;
    }

    let target = grid[toCol][toRow];
    let nextTarget = nextGrid[toCol][toRow];
    if (target.type === EMPTY && nextTarget.type === EMPTY) {
        setNext(nextGrid, toCol, toRow, cell);
        return true;
    }

    if (target.type === WATER && (nextTarget.type === EMPTY || nextTarget.type === WATER)) {
        setNext(nextGrid, toCol, toRow, cell);
        if (nextGrid[fromCol][fromRow].type === EMPTY) {
            setNext(nextGrid, fromCol, fromRow, target);
        }
        return true;
    }

    return false;
}

function updateWater(col, row, nextGrid) {
    if (tryMoveWater(col, row, col, row + 1, nextGrid)) {
        return;
    }

    let firstDir = random(1) < 0.5 ? -1 : 1;
    if (tryMoveWater(col, row, col + firstDir, row + 1, nextGrid)) {
        return;
    }
    if (tryMoveWater(col, row, col - firstDir, row + 1, nextGrid)) {
        return;
    }
    if (tryMoveWater(col, row, col + firstDir, row, nextGrid)) {
        return;
    }
    if (tryMoveWater(col, row, col - firstDir, row, nextGrid)) {
        return;
    }

    setNext(nextGrid, col, row, grid[col][row]);
}

function tryMoveWater(fromCol, fromRow, toCol, toRow, nextGrid) {
    if (!insideGrid(toCol, toRow) || !cellIsEmpty(toCol, toRow, nextGrid)) {
        return false;
    }

    setNext(nextGrid, toCol, toRow, grid[fromCol][fromRow]);
    return true;
}

function cellIsEmpty(col, row, nextGrid) {
    return grid[col][row].type === EMPTY && nextGrid[col][row].type === EMPTY;
}

function setNext(nextGrid, col, row, cell) {
    nextGrid[col][row] = makeCell(cell.type, cell.hue);
}

function drawBrushPreview() {
    if (!pointerInCanvas() || pointerOverToolbar()) {
        return;
    }

    noFill();
    if (currentTool === "erase") {
        stroke(0, 0, 240, 170);
    } else if (currentTool === "water") {
        stroke(205, 185, 235, 170);
    } else if (currentTool === "wall") {
        stroke(214, 18, 190, 170);
    } else if (currentTool === "sandSource") {
        stroke(42, 205, 245, 190);
    } else if (currentTool === "waterSource") {
        stroke(204, 180, 240, 190);
    } else {
        stroke(hueValue, 200, 255, 170);
    }
    strokeWeight(2);
    circle(mouseX, mouseY, brushSize * CELL_SIZE);
    noStroke();
}

function resetCounts() {
    counts[SAND] = 0;
    counts[WATER] = 0;
    counts[WALL] = 0;
    counts[SAND_SOURCE] = 0;
    counts[WATER_SOURCE] = 0;
    counts.sources = 0;
}

function updateStats() {
    ui.stats.innerHTML = `${counts[SAND]} sand<br>${counts[WATER]} water<br>${counts[WALL]} walls<br>${counts.sources} sources`;
}

function pointerInCanvas() {
    return mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height;
}

function pointerOverToolbar(event) {
    if (!ui.toolbar) {
        return false;
    }
    if (event && event.target && event.target.closest && event.target.closest("#toolbar")) {
        return true;
    }
    let bounds = ui.toolbar.getBoundingClientRect();
    return mouseX >= bounds.left && mouseX <= bounds.right && mouseY >= bounds.top && mouseY <= bounds.bottom;
}

function windowResized() {
    let oldGrid = grid;
    let oldCols = cols;
    let oldRows = rows;

    resizeCanvas(viewportWidth(), viewportHeight());
    resetGrid();

    for (let col = 0; col < min(cols, oldCols); col++) {
        for (let row = 0; row < min(rows, oldRows); row++) {
            grid[col][row] = oldGrid[col][row];
        }
    }

    let bounds = ui.toolbar.getBoundingClientRect();
    moveToolbar(bounds.left, bounds.top);
}
