# AGENTS.md

## Cursor Cloud specific instructions

### Project Overview

3D NeuronLab (神经元课堂) — a static-only, zero-build interactive 3D educational platform with 45+ Three.js scenes across physics, biology, math, AI, and social sciences. No package manager, no bundler, no backend. All dependencies load via CDN.

### Running the Dev Server

```bash
python3 serve.py
```

This starts a Python `http.server` on port 8000. Then open `http://localhost:8000/index.html` (landing page) or `http://localhost:8000/app.html` (main application).

### Key Caveats

- **No build step, no lint, no test suite**: There is no `package.json`, no bundler, no linter, and no automated test framework. All code is vanilla JS/HTML/CSS loaded via `<script>` tags and CDN.
- **CDN dependency**: The app requires internet access to load Three.js, Tailwind CSS, GSAP, Font Awesome, and Google Fonts from CDNs.
- **AI chat feature requires ZhipuAI API key**: The AI tutoring assistant calls `https://open.bigmodel.cn/api/paas/v4/chat/completions`. The API key is hardcoded in `js/ai-service.js`. All 3D scenes work independently without this API.
- **Missing media assets**: `assets/Avatar IV Video.mp4` (teacher avatar) and some landing page images (`anli-*.jpg`) are referenced but not in the repo. These are cosmetic and do not affect core functionality.
- **Scene files**: Each scene in `scenes/*.js` is a self-contained Three.js class that registers itself on `window`. New scenes should follow the template at `scenes/templates/scene-template.js` and the spec in `docs/3D场景开发规范.md`.

### File Structure

- `index.html` — Landing/marketing page
- `app.html` — Main application (3-panel: AI teacher + chat, 3D scene viewer, controls)
- `js/` — Core app logic (`app.js`, `scene-manager.js`, `ai-service.js`)
- `scenes/` — 45+ self-contained Three.js scene modules
- `data/` — Scene configs, slide data, code snippets
- `css/main.css` — Application styles
- `serve.py` — Python dev server (port 8000)
