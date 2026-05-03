function make2DArray(cols, rows) {
    let arr = new Array(cols);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(rows);
        for (let j = 0; j < arr[i].length; j++) {
            arr[i][j] = 0;
        }
    }
    return arr;
}

let grid;
let w = 4;
let cols;
let rows;
let hueValue = 200;
let brushSize = 5;
let currentTool = "sand";
let colorModeName = "rainbow";
let paused = false;
let simulationSpeed = 1;
let particleCount = 0;
let waterCount = 0;
let wallCount = 0;

let toolbar;
let sizeInput;
let sizeValue;
let speedInput;
let speedValue;
let pauseButton;
let particleCountEl;

function withinCols(i) {
    return i >= 0 && i <= cols - 1;
}

function withinRows(j) {
    return j >= 0 && j <= rows - 1;
}

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent("canvas-host");
    colorMode(HSB, 360, 255, 255, 255);

    cols = floor(width / w);
    rows = floor(height / w);
    grid = make2DArray(cols, rows);
    setupControls();
}

function setupControls() {
    toolbar = document.getElementById("toolbar");
    sizeInput = document.getElementById("brush-size");
    sizeValue = document.getElementById("brush-size-value");
    speedInput = document.getElementById("sim-speed");
    speedValue = document.getElementById("sim-speed-value");
    pauseButton = document.getElementById("pause-toggle");
    particleCountEl = document.getElementById("particle-count");

    document.querySelectorAll("[data-tool]").forEach((button) => {
        button.addEventListener("click", () => {
            currentTool = button.dataset.tool;
            document.querySelectorAll("[data-tool]").forEach((item) => {
                item.classList.toggle("active", item === button);
            });
        });
    });

    document.querySelectorAll("[data-color-mode]").forEach((button) => {
        button.addEventListener("click", () => {
            colorModeName = button.dataset.colorMode;
            if (colorModeName === "warm") {
                hueValue = 38;
            }
            document.querySelectorAll("[data-color-mode]").forEach((item) => {
                item.classList.toggle("active", item === button);
            });
        });
    });

    sizeInput.addEventListener("input", () => {
        brushSize = Number(sizeInput.value);
        sizeValue.textContent = brushSize;
    });

    speedInput.addEventListener("input", () => {
        simulationSpeed = Number(speedInput.value);
        speedValue.textContent = `${simulationSpeed}x`;
    });

    pauseButton.addEventListener("click", () => {
        paused = !paused;
        pauseButton.textContent = paused ? "Resume" : "Pause";
    });

    document.getElementById("step-grid").addEventListener("click", () => {
        updateGrid();
    });

    document.getElementById("clear-grid").addEventListener("click", () => {
        grid = make2DArray(cols, rows);
        particleCount = 0;
        wallCount = 0;
        waterCount = 0;
        updateStats();
    });
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
        paused = !paused;
        pauseButton.textContent = paused ? "Resume" : "Pause";
    }
    if (key === "c" || key === "C") {
        grid = make2DArray(cols, rows);
        particleCount = 0;
        waterCount = 0;
        wallCount = 0;
        updateStats();
    }
    if (key === "1") {
        selectTool("sand");
    }
    if (key === "2") {
        selectTool("water");
    }
    if (key === "3") {
        selectTool("wall");
    }
    if (key === "4") {
        selectTool("erase");
    }
}

function selectTool(tool) {
    currentTool = tool;
    document.querySelectorAll("[data-tool]").forEach((button) => {
        button.classList.toggle("active", button.dataset.tool === tool);
    });
}

function paintAtPointer(event) {
    if (!pointerInCanvas() || pointerOverToolbar(event)) {
        return false;
    }

    let mouseCol = floor(mouseX / w);
    let mouseRow = floor(mouseY / w);
    let extent = floor(brushSize / 2);

    for (let i = -extent; i <= extent; i++) {
        for (let j = -extent; j <= extent; j++) {
            let distanceFromCenter = dist(0, 0, i, j);
            if (distanceFromCenter > extent + 0.35) {
                continue;
            }

            let col = mouseCol + i;
            let row = mouseRow + j;
            if (!withinCols(col) || !withinRows(row)) {
                continue;
            }

            if (currentTool === "erase") {
                grid[col][row] = 0;
            } else if (currentTool === "water") {
                grid[col][row] = -2;
            } else if (currentTool === "wall") {
                grid[col][row] = -1;
            } else if (random(1) < 0.78) {
                grid[col][row] = getBrushHue();
            }
        }
    }

    if (currentTool === "sand") {
        hueValue += colorModeName === "rainbow" ? 1 : 0.8;
        if (colorModeName === "rainbow" && hueValue > 360) {
            hueValue = 1;
        }
        if (colorModeName === "warm" && hueValue > 52) {
            hueValue = 34;
        }
    }

    return true;
}

function getBrushHue() {
    let hueJitter = colorModeName === "rainbow" ? random(-14, 14) : random(-8, 8);
    return (hueValue + hueJitter + 360) % 360;
}

function draw() {
    background(218, 28, 7);
    drawParticles();

    if (!paused) {
        for (let i = 0; i < simulationSpeed; i++) {
            updateGrid();
        }
    }

    drawBrushPreview();
    updateStats();
}

function drawParticles() {
    particleCount = 0;
    waterCount = 0;
    wallCount = 0;
    noStroke();
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            if (grid[i][j] === -1) {
                wallCount++;
                fill(214, 14, 110);
                rect(i * w, j * w, w + 0.2, w + 0.2, 1);
            } else if (grid[i][j] === -2) {
                waterCount++;
                let shade = 178 + noise(i * 0.08, j * 0.08, frameCount * 0.02) * 28;
                fill(204, 165, shade, 195);
                rect(i * w, j * w, w + 0.5, w + 0.5, 1);
            } else if (grid[i][j] > 0) {
                particleCount++;
                let shade = 205 + noise(i * 0.06, j * 0.06, frameCount * 0.006) * 42;
                fill(grid[i][j], 190, shade);
                rect(i * w, j * w, w + 0.25, w + 0.25, 1);
            }
        }
    }
}

function updateGrid() {
    let nextGrid = make2DArray(cols, rows);

    for (let j = rows - 1; j >= 0; j--) {
        let leftToRight = (frameCount + j) % 2 === 0;
        let start = leftToRight ? 0 : cols - 1;
        let end = leftToRight ? cols : -1;
        let step = leftToRight ? 1 : -1;

        for (let i = start; i !== end; i += step) {
            let state = grid[i][j];
            if (state === -1) {
                nextGrid[i][j] = state;
                continue;
            }
            if (state === -2) {
                updateWaterCell(i, j, nextGrid);
                continue;
            }
            if (state <= 0) {
                continue;
            }

            if (!withinRows(j + 1)) {
                nextGrid[i][j] = state;
                continue;
            }

            updateSandCell(i, j, state, nextGrid);
        }
    }

    grid = nextGrid;
}

function updateSandCell(i, j, state, nextGrid) {
    if (canMoveTo(i, j + 1, nextGrid)) {
        nextGrid[i][j + 1] = state;
        return;
    }

    let firstDir = random(1) < 0.5 ? -1 : 1;
    if (canMoveTo(i + firstDir, j + 1, nextGrid)) {
        nextGrid[i + firstDir][j + 1] = state;
        return;
    }
    if (canMoveTo(i - firstDir, j + 1, nextGrid)) {
        nextGrid[i - firstDir][j + 1] = state;
        return;
    }

    nextGrid[i][j] = state;
}

function updateWaterCell(i, j, nextGrid) {
    if (!withinRows(j + 1)) {
        nextGrid[i][j] = -2;
        return;
    }

    if (canMoveTo(i, j + 1, nextGrid)) {
        nextGrid[i][j + 1] = -2;
        return;
    }

    let firstDir = random(1) < 0.5 ? -1 : 1;
    if (canMoveTo(i + firstDir, j + 1, nextGrid)) {
        nextGrid[i + firstDir][j + 1] = -2;
        return;
    }
    if (canMoveTo(i - firstDir, j + 1, nextGrid)) {
        nextGrid[i - firstDir][j + 1] = -2;
        return;
    }

    if (tryMoveWaterSide(i, j, firstDir, nextGrid) || tryMoveWaterSide(i, j, -firstDir, nextGrid)) {
        return;
    }

    nextGrid[i][j] = -2;
}

function tryMoveWaterSide(i, j, dir, nextGrid) {
    let col = i + dir;
    if (!canMoveTo(col, j, nextGrid)) {
        return false;
    }

    nextGrid[col][j] = -2;
    return true;
}

function canMoveTo(i, j, nextGrid) {
    if (!withinCols(i) || !withinRows(j)) {
        return false;
    }

    return grid[i][j] === 0 && nextGrid[i][j] === 0;
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
    } else {
        stroke(hueValue, 200, 255, 170);
    }
    strokeWeight(2);
    circle(mouseX, mouseY, brushSize * w);
    noStroke();
}

function updateStats() {
    if (particleCountEl) {
        particleCountEl.innerHTML = `${particleCount} sand<br>${waterCount} water<br>${wallCount} walls`;
    }
}

function pointerInCanvas() {
    return mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height;
}

function pointerOverToolbar(event) {
    if (!toolbar) {
        return false;
    }
    if (event && event.target && event.target.closest && event.target.closest("#toolbar")) {
        return true;
    }
    let bounds = toolbar.getBoundingClientRect();
    return mouseX >= bounds.left && mouseX <= bounds.right && mouseY >= bounds.top && mouseY <= bounds.bottom;
}

function windowResized() {
    let oldGrid = grid;
    let oldCols = cols;
    let oldRows = rows;

    resizeCanvas(windowWidth, windowHeight);
    cols = floor(width / w);
    rows = floor(height / w);
    grid = make2DArray(cols, rows);

    for (let i = 0; i < min(cols, oldCols); i++) {
        for (let j = 0; j < min(rows, oldRows); j++) {
            grid[i][j] = oldGrid[i][j];
        }
    }
}
