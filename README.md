# Falling Sand

[Click to try](https://huiishan99.github.io/web-falling-sand/)

A small p5.js falling-sand sandbox with sand, water, walls, source blocks, brush controls, pause/step, screenshot saving, and a draggable UI panel.

## Files

- `index.html` - page shell and toolbar containers
- `style.css` - layout and UI styling
- `src/` - modular app code
  - `main.js` - p5 lifecycle and app wiring
  - `materials.js` - data-driven materials and tools
  - `grid.js` - typed-array grid storage
  - `simulation.js` - material update rules
  - `renderer.js` - p5 drawing and offscreen buffer
  - `input.js` - brush painting input
  - `ui.js` - generated controls and draggable toolbar
- `p5.js` - local p5 runtime
- `public/p5.js` - p5 runtime copied into Vite builds
- `.github/workflows/pages.yml` - GitHub Pages deployment workflow

## Development

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

## Shortcuts

- `1` Sand
- `2` Water
- `3` Wall
- `4` Sand Source
- `5` Water Source
- `6` Erase
- `Space` Pause or resume
- `C` Clear

![image](https://github.com/user-attachments/assets/6df396b7-419d-4244-99d9-8424e067fa3c)
