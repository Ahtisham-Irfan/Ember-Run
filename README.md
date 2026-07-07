# Ember Run

An animated endless-runner game built with vanilla HTML5 Canvas, CSS, and JavaScript — no libraries, no build step.

## Play
Press **Space** or **↑** (or tap the screen on mobile) to jump. Dodge the dark spike rocks, collect glowing embers for bonus points, and see how far you can run before the dusk hills get the better of you. 

## Features
- Canvas-drawn animated fox character with procedural running, jumping, blinking, and squash-and-stretch
- Parallax scrolling dusk-to-sunset sky with layered silhouette hills and a glowing sun
- Dust and spark particle effects on jump, landing, and collisions
- Procedurally spawned obstacles and floating collectibles with increasing difficulty over time
- Lightweight synthesized sound effects (Web Audio, no audio files needed)
- Fully responsive, touch-friendly, and respects `prefers-reduced-motion`

## Files
- `index.html` — page structure and UI overlays
- `style.css` — all styling
- `script.js` — game loop, physics, rendering, and input handling

## Run locally
Just open `index.html` in a browser.

## Deploy on GitHub Pages
1. Create a repo (e.g. `ember-run`)
2. Upload `index.html`, `style.css`, and `script.js` to the repo root
3. Settings → Pages → serve from the `main` branch
4. Play it live at `https://<your-username>.github.io/ember-run`
