# Project Learnings: portofolio-2

A comprehensive analysis and architectural overview of **portofolio-2**, an interactive personal portfolio website for **Muhammad Hisyam** (`caleheinzz25`).

---

## 1. Executive Summary

- **Project Name**: `portofolio-2` (package name `portofolio-1`)
- **Author / Developer**: Muhammad Hisyam ([GitHub Profile](https://github.com/caleheinzz25))
- **Primary Goal**: Interactive, fast, dynamic developer portfolio showcasing background, tech skills, recent GitHub activity, featured projects, interactive SolidJS mini-games, and an embedded audio music player.
- **Architecture**: Static Site Generation (SSG) with Astro 5, server-side data fetching for GitHub integration, client-side dynamic components powered by SolidJS and vanilla HTML5 Audio API.

---

## 2. Technology Stack & Key Dependencies

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Core Framework** | [Astro v5.16.6](https://astro.build/) | High-performance SSG framework with island architecture |
| **UI Integration** | [SolidJS v1.9.10](https://solidjs.com/) (`@astrojs/solid-js` v5.1.3) | Reactive UI components for interactive mini-games |
| **Styling System** | [Tailwind CSS v4.1.18](https://tailwindcss.com/) (`@tailwindcss/postcss`) | Utility-first CSS using `@theme` syntax and PostCSS |
| **Icons & Fonts** | FontAwesome 6.5.1, Google Fonts | Inter (monospace/body) & Playfair Display (headings) |
| **Runtime & Package Manager** | [Bun](https://bun.sh/) | Fast JavaScript runtime, package manager, and test runner |
| **Image Processing** | Sharp (`v0.34.5`) | Built-in Astro image optimization engine |

---

## 3. Project Directory Structure

```text
portofolio-2/
├── public/                 # Static public assets
│   ├── favicon.svg         # Site favicon
│   └── song/               # Audio directory (36 Maher Zain MP3 tracks)
├── song/                   # Raw song directory
├── src/
│   ├── components/         # Astro UI components for home page sections
│   │   ├── About.astro             # Developer bio & experience
│   │   ├── Activity.astro          # Live GitHub timeline (pushes & commits)
│   │   ├── Contact.astro           # Social links & contact options
│   │   ├── Footer.astro            # Site footer & copyright
│   │   ├── Hero.astro              # Terminal-styled hero landing
│   │   ├── MiniGames.astro         # Interactive mini-game gallery
│   │   ├── MusicPlayer.astro       # Custom audio player with visualizer & playlist
│   │   ├── Navigation.astro        # Header navbar with active state & smooth scrolling
│   │   ├── Projects.astro          # Featured & secondary GitHub repositories list
│   │   ├── ScrollAnimations.astro  # IntersectionObserver-based reveal animations
│   │   └── Skills.astro            # Categorized tech stack & skill badges
│   ├── games/              # SolidJS interactive game widgets (.tsx)
│   │   ├── MemoryMatch.tsx         # Card matching game with flip mechanics
│   │   ├── SnakeGame.tsx           # Grid-based Snake arcade game
│   │   └── TypingSpeed.tsx         # WPM & accuracy typing speed test
│   ├── layouts/
│   │   └── BaseLayout.astro        # Main document shell (<head>, fonts, metadata)
│   ├── lib/
│   │   └── github.ts               # GitHub API fetching utility with 10m TTL cache
│   ├── pages/
│   │   ├── index.astro             # Single-page portfolio homepage
│   │   └── games/                  # Separate pages for mini-games
│   │       ├── memory-match.astro
│   │       ├── snake.astro
│   │       └── typing-speed.astro
│   └── styles/
│       └── global.css              # Custom Tailwind 4 theme, animations & base styles
├── astro.config.mjs        # Astro configuration file (static mode + solidJs)
├── caleheinzz25.md         # Detailed developer profile & GitHub README
├── package.json            # Project dependencies and script declarations
├── postcss.config.mjs      # PostCSS configuration for Tailwind v4
└── tsconfig.json           # TypeScript configuration
```

---

## 4. Key Architectural Patterns & Technical Highlights

### 4.1 Astro Environment & GitHub Integration (`src/lib/github.ts`)
- Uses Astro's built-in `astro:env/server` schema for optional secret handling (`GITHUB_ACCESS_TOKEN`).
- **In-Memory Caching System**: Employs `Map<string, CacheEntry>` with a 10-minute TTL (`10 * 60 * 1000 ms`) to prevent rate-limiting during builds and local re-renders.
- **Data Fetching**:
  - `getPinnedRepos`: Pulls top 30 repos sorted by `pushed_at`.
  - `getUserEvents`: Filters `PushEvent` and `CreateEvent` from GitHub events feed, parsing commit messages for display in `Activity.astro`.

### 4.2 Custom Tailwind CSS v4 Setup (`src/styles/global.css`)
- Uses modern `@import "tailwindcss";` and `@theme` directives.
- Custom dark portfolio color palette:
  - `--color-navy`: `#0A192F` (Deep dark background)
  - `--color-mint`: `#64FFDA` (Vibrant accent green/teal)
  - `--color-light-slate`: `#CCD6F6` (Heading & primary text)
  - `--color-slate`: `#8892B0` (Secondary muted body text)
- Built-in Keyframes: `fade-in`, `fade-up`, `slide-in-left`, `slide-in-right`.

### 4.3 Node.js Build-Time File System Reading (`MusicPlayer.astro`)
- Integrates `node:fs` and `node:path` inside Astro frontmatter to dynamically list `.mp3` files from `public/song` at build time.
- Renders an interactive audio player featuring:
  - Custom audio spectrum visualizer (CSS animation synced to playback state).
  - Playback controls (Play, Pause, Prev, Next, Shuffle, Repeat).
  - Seeking progress bar & interactive volume slider.
  - Playlist supporting all 36 loaded tracks.

### 4.4 SolidJS Mini-Games Engine (`src/games/`)
- Components are hydrated via Astro's `client:load` / `client:only="solid"`.
- Uses SolidJS signals (`createSignal`, `onMount`, `onCleanup`) for granular reactivity without Virtual DOM overhead.
- Includes 3 complete mini-games:
  1. **Snake Game**: Grid-based canvas movement, score tracking, local storage high scores.
  2. **Memory Match**: Card grid flipping mechanics, move counter, timer.
  3. **Typing Speed**: Text snippet typing challenge calculating WPM, error rate, and accuracy %.

---

## 5. Available Scripts & Commands

| Command | Action |
| :--- | :--- |
| `bun dev` / `npm run dev` | Starts local dev server at `http://localhost:4321` |
| `bun build` / `npm run build` | Compiles static site production bundle into `./dist/` |
| `bun preview` / `npm run preview` | Serves local preview of the production build |
| `bun astro` | Executes Astro CLI helper commands |

---

## 6. Summary & Recommendations

- **Strengths**: Clean separation of concerns, fast static rendering, rich interactive client components (SolidJS), responsive modern UI design system, automated GitHub integrations.
- **Potential Enhancements**:
  - Add fallback mock data when `GITHUB_ACCESS_TOKEN` is not provided so the UI renders dummy repos offline.
  - Implement full keyboard accessibility (A11y) for the custom audio player controls.
