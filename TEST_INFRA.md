# E2E Test Infra: portofolio-2 Interactive Features

## Test Philosophy
- Opaque-box, requirement-driven testing based on specifications in ORIGINAL_REQUEST.md and PROJECT.md.
- 4-Tier Test Case Methodology:
  - **Tier 1: Feature Coverage (≥5 per feature)** — Happy path verification for each interactive feature and build capability.
  - **Tier 2: Boundary & Corner Cases (≥5 per feature)** — Limits, invalid inputs, edge cases, rapid toggles, empty results.
  - **Tier 3: Cross-Feature Interactions** — Pairwise interaction tests between multiple interactive components operating concurrently.
  - **Tier 4: Real-World Application Scenarios** — End-to-end user journeys (e.g. recruiter portfolio exploration, theme customization with terminal navigation).

## Feature Inventory
| # | Feature | Requirement Source | Tier 1 Target | Tier 2 Target | Tier 3 | Tier 4 |
|---|---------|-------------------|:-------------:|:-------------:|:------:|:------:|
| F1 | Terminal Overlay (`hisyam-cli`) | ORIGINAL_REQUEST R1 | 5 | 5 | ✓ | ✓ |
| F2 | Career Experience Timeline | ORIGINAL_REQUEST R2 | 5 | 5 | ✓ | ✓ |
| F3 | Dynamic Theme Accent Picker | ORIGINAL_REQUEST R3 | 5 | 5 | ✓ | ✓ |
| F4 | Project Tech Filter | ORIGINAL_REQUEST R4 | 5 | 5 | ✓ | ✓ |
| F5 | Interactive API Demo Widget | ORIGINAL_REQUEST R5 | 5 | 5 | ✓ | ✓ |
| F6 | Code Quality & Build Integrity | ORIGINAL_REQUEST R6 | 2 | 2 | ✓ | ✓ |

## Test Architecture
- **Test Harness**: `bun test` running JSDOM / Playwright DOM emulation and static analysis scripts.
- **Location**: `tests/` directory at project root (`tests/e2e/tier1_feature_coverage.test.ts`, `tests/e2e/tier2_boundary_corner.test.ts`, `tests/e2e/tier3_cross_feature.test.ts`, `tests/e2e/tier4_real_world.test.ts`, `tests/e2e/tier6_build_quality.test.ts`).
- **Pass Criteria**: 100% pass on all test cases across Tiers 1-4, `bun run astro check` exit code 0, `bun run build` exit code 0.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Visitor portfolio walkthrough: accent theme change -> open terminal (`hisyam-cli`) -> filter projects | F1, F3, F4 | Medium |
| 2 | Recruiter inspection journey: scroll timeline -> filter projects by tag -> test API playground live timing | F2, F4, F5 | Medium |
| 3 | Power-user terminal & theme session: toggle terminal via shortcut -> run commands -> switch theme via CLI -> verify `localStorage` persistence | F1, F3, F5 | High |
| 4 | Rapid interactive stress test: multi-filter toggling while switching themes and triggering terminal commands | F1, F3, F4, F5 | High |
| 5 | Full offline & error tolerance journey: invalid terminal commands, unknown project tags, API failure simulation | F1, F4, F5 | High |

## Coverage Thresholds
- Tier 1: ≥5 per feature (27 total cases across 5 features + 2 build cases)
- Tier 2: ≥5 per feature (27 total cases across 5 features + 2 build edge cases)
- Tier 3: Pairwise interaction test cases
- Tier 4: ≥5 realistic user application scenarios
