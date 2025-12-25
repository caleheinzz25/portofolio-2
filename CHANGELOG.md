# CHANGELOG

## [Unreleased] - 2025-12-24

### Added

- **New Environment Variable**: `GITHUB_ACCESS_TOKEN`
  - Must be set in `.env` file at build-time
  - Never exposed to client-side code
  - See `.env.example` for reference

- **New Helper Functions** (`/src/lib/github.js`):
  - `getPinnedRepos(token)` - Fetches up to 6 repos sorted by pushed_at
  - `getUserEvents(token)` - Fetches last 20 PushEvent/CreateEvent activities
  - Both include 10-minute caching and graceful 401/403 error handling

- **New Component**: `Experience.astro`
  - Displays "Recent Activity" timeline from GitHub
  - Shows last 8 push/create events with color-coded dots

### Changed

- **Projects Section**: Now dynamically populated from GitHub repos
  - Displays name, description, language, stars, and links
  - Graceful fallback when no data available

- **index.astro**: Added Experience component between Skills and Projects
