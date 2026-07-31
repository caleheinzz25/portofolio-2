# Project: portofolio-2 Interactive Features

## Architecture
Developer portfolio (`portofolio-2`) built with Astro, SolidJS, and Tailwind CSS.
The 5 interactive features enhance user engagement across theme customization, career showcase, project discovery, terminal interactivity, and API playground.

## Code Layout
- `src/styles/global.css` - Global CSS styles and theme CSS variables
- `src/layouts/BaseLayout.astro` - Root layout containing global components (Theme Switcher, Terminal Overlay, Navigation, Footer)
- `src/pages/index.astro` - Main portfolio page importing Hero, About, Experience, Skills, Projects, ApiPlayground, Activity, MiniGames, Contact
- `src/components/ThemeSwitcher.astro` - Dynamic Theme Accent Picker
- `src/components/Experience.astro` - Career Experience Timeline
- `src/components/Projects.astro` - Project Showcase with Tech Filter
- `src/components/TerminalOverlay.astro` - Retro Terminal Overlay (`hisyam-cli`)
- `src/components/ApiPlayground.tsx` - SolidJS API Demo Widget

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Theme Accent Picker | Floating theme switcher with 5 presets (Gold, Emerald, Rose, Violet, Cyan) & localStorage persistence | None | DONE |
| 2 | Career Timeline | `#experience` vertical timeline with alternating layout, glowing spine nodes & scroll animations | None | DONE |
| 3 | Project Tech Filter | Dynamic tag filtering in `Projects.astro` with smooth scale transitions | None | DONE |
| 4 | Terminal Overlay | Fullscreen retro terminal (`hisyam-cli`) with command parser, typing animation & shortcut | None | DONE |
| 5 | Interactive API Demo | SolidJS `#api-playground` (`ApiPlayground.tsx`) with split-pane request/response & live metrics | None | DONE |
| 6 | E2E & Build Hardening | Zero-error `bun run astro check`, `bun run build`, E2E test pass & forensic audit verification | M1, M2, M3, M4, M5 | DONE |

## Interface Contracts
### Theme Switcher ↔ Global CSS
- Theme custom properties in `:root` or `[data-theme]` (e.g. `--accent-color`, `--accent-glow`, `--accent-hover`).
- 5 presets: Gold, Emerald, Rose, Violet, Cyan.
- Saved in `localStorage.getItem('portfolio-accent')`.

### Terminal Overlay ↔ Global App
- Shortcut: `Ctrl+\`` or floating toggle button.
- Commands: `help`, `about`, `skills`, `projects`, `contact`, `theme`, `clear`, `exit`.

### API Playground (SolidJS) ↔ Endpoints
- Public APIs: Pre-configured public REST endpoints.
- Features: Split-pane request/response, Send Request, live response timing metrics, formatted syntax-highlighted JSON display.
