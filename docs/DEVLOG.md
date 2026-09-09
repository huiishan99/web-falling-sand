# Development log

## 2026-09-09 — Sandbox usability and performance

### Changes

- Unified mouse, pen and touch through pointer events with capture, cancellation,
  canvas focus, and supercover stroke interpolation. One-cell diagonal walls seal
  corner crossings. Entering the toolbar breaks the stroke segment.
- Added up to 20 undo/redo snapshots, capped at 32 MB of cell data. Drawing holds
  the simulation; restoring history pauses it. Clear, presets, loads and grid
  resizing are recorded. Snapshots are independent of reused simulation buffers.
- Added a local browser save slot and portable versioned JSON exports/imports.
  Invalid files are rejected before changing the world. Storage errors are shown.
  Smaller viewports crop restored cells with a notice; original saves are retained.
- Added responsive hourglass, water-dam and cascading-fountain scenes, with hints.
- Reused simulation grids, restricted updates to occupied bounds, replaced
  per-particle shape/noise calls with grid-resolution pixel uploads and a cached
  palette, cached paused rendering, and throttled statistics to 4 Hz.
- Added collapsible mobile controls, a scrollable panel, 44 px touch buttons,
  focus indicators, pressed/expanded states and an FPS indicator.

### Validation

- 15 Node tests pass, including 20 seeded mixed worlds over 100 steps each;
  material counts, sand colors and wall positions remain conserved.
- ESLint and Vite build pass. Vite retains its existing classic-script notice
  for the bundled public p5.js; the file is present in the output.
- Local Chromium via agent-browser: page loads without JavaScript errors.
- Native mouse drag at brush size 1: 500 px produces 126 continuous wall cells;
  Ctrl+Z clears the whole stroke and Ctrl+Shift+Z restores all 126 cells.
- Chromium touch events at 390×844: a 280 px stroke produces 71 wall cells;
  quick Undo restores the empty scene.
- Clear/undo/redo, three presets, local save/load, downloaded JSON import,
  and invalid-file rejection checked through the browser. A water-dam save
  restored 608 sand, 6,853 water and 432 wall cells at the tested viewport.
- JSON download completion was confirmed through Chromium download events and
  the resulting local file. The CLI's download path setup initially canceled
  downloads; explicitly setting Chromium's absolute Windows download directory
  resolved the test harness issue.
- Viewports: desktop 1440×1000, phone 390×844, landscape 844×390. No horizontal
  overflow; phone toolbar stays within the viewport. Every expanded-panel
  control was scrolled into view and its center hit target checked.
- Screenshots: `desktop-check.png`, `mobile-check.png`, `mobile-expanded.png`.
  These are local browser evidence, not physical-device or deployed-site tests.

### Local performance observations

Simulation baseline is commit `ae3c78a`. Both versions used Node, a 480×270 grid,
120 steps, deterministic random value 0.3, and the median of five runs. Sparse
initial fill was 30×20 cells; dense fill was 480×180 cells, two-thirds sand and
one-third water. Run `npm run benchmark` to measure the current version.

| Simulation case | Before (ms/step) | After (ms/step) |
| --------------- | ---------------: | --------------: |
| Sparse          |            1.228 |           0.043 |
| Dense           |            5.286 |           5.327 |

Sparse simulation is substantially faster; dense simulation is effectively
unchanged in this measurement. Occupied bounds do not help a nearly full world.

A separate Chromium renderer microbenchmark used a detached 1920×1080 canvas,
pixel density 1, 86,400 occupied cells, and the median of seven synchronous draw
calls. The baseline renderer measured 885.1 ms/call; the pixel renderer measured
3.2 ms/call. This measures JavaScript drawing work in this headless environment,
not end-to-end frame latency, GPU completion or a promised FPS gain on devices.

### Remaining boundaries

No new materials or fluid-pressure model were introduced. Undo restores whole
world snapshots, including simulation evolution since the saved edit. History is
memory-bounded and does not survive reload. Local changes have not been pushed or
deployed as part of this work; GitHub Pages and real mobile hardware need separate
verification.
