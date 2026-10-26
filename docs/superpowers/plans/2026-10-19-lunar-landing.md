# Continuous lunar landing implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development task-by-task. Use the design and these interface boundaries.

**Goal:** Make the default Earth–Moon journey finish with a physically computed safe landing and a clear lunar surface view.

**Architecture:** A landing mission wrapper reuses the validated orbital integrator and collision detector, with a larger verified vehicle and Moon-relative guidance. UI dispatches by preset; renderer changes projection near the surface, while telemetry records the same continuous state.

**Stack:** Existing vanilla JS, Vite/Tailwind, Canvas2D, Chart.js, Node test runner. No new dependencies or Git repository.

**Spec:** docs/superpowers/specs/2026-10-19-lunar-landing-design.md.

## Global constraints

- Preserve old flyby/LEO factories and existing64 tests. Keep NASA typography, assets, attribution, fullscreen/pause/exit and no-state-reset view changes.
- No teleport/refill or fake successful contact. Moon-relative touchdown limits2m/s vertical,1m/s tangent,10deg tilt. Guidance recomputed per bounded substep, no negative fuel.
- Default guided landing; explicit manual override. All actual commands reflected in forces/flame. No ground launch or3D introduced.
- Actual app Desktop/rocket-landing requires exact authorized escalated writes; stage in writable Physics workspace. No commits/worktrees.

## Task1: Continuous numerical mission

- [x] Write failing tests in src/tests/lunarLanding.test.js for finite-burn reconstruction, same-state coast/descent, actual contact limits, fuel accounting, unsafe/manual impact, guidance and warp bounds, immutability and terminal freeze.
- [x] Implement src/orbital/lunarLanding.js with exact public signatures in spec. Reuse feasible guidance scripts and original surface event path.
- [x] Run targeted then full tests; record actual touchdown fuel/time/speeds. Independent code/spec review.

## Task2: Surface art and renderer (independent)

- [x] Bundle credited local lunar surface artwork in public/flight if needed, with exact image generation prompt/provenance. Preserve existing assets.
- [x] Extend src/render/orbitalMap.js (optional src/render/lunarSurface.js helper) to accept landing diagnostics and control visibility, without mutating state.
- [x] Add meaningful projection/contact/exhaust/cleanup tests. Respect phone safe areas and reduced motion. Root visual review after integration.

## Task3: Results and persistence

- [x] Extend orbital/telemetry.js, runStore.js, ui/MissionWorkbench.js and tests for landing/landed, Moon-relative samples/touchdown evidence, phase and readable reports.
- [x] Keep old saved records loadable; actual CSV/Markdown distinguish coast forecast from guided burns. Existing chart axes/energy truth unchanged.

## Task4: Mission UI integration

- [x] Extend ui/screens/OrbitalFlight.js and scoped CSS: landing default, guidance toggle and effective controls, phase labels, Moon-relative readouts, dispatch/warp, surface frame data, actual touchdown outcome.
- [x] Preserve intentional start/reset archival and view/fullscreen pause/exit state, flyby and LEO modes.
- [x] Browser start-to-land and manual override/failure/state checks; production build and suite.

## Task5: Review and handoff

- [x] Fresh independent numerical/integration review and bounded desktop/user/phone visual review; fix material findings.
- [x] Save screenshots/result evidence and guide/model/limits; update design sidecar and Obsidian current state/next steps. Stop for user review; no automatic optional upgrades.

Review note: implementation, root browser checks,85 tests and build completed. Independent numerical reviewer confirmed16 focused tests, then account usage limit interrupted final UI/data review. This last independent verdict remains optional follow-up; it is not claimed complete. See docs/lunar-landing-validation.txt.

