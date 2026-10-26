# Earth launch implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development task-by-task with independent ownership and reviews. No Git repository; do not commit or delete scratch.

**Goal:** A calculated guided journey from an Earth launch pad through atmosphere and space to actual lunar touchdown.

**Architecture:** A staged ascent/departure mission wraps the existing numerical orbital and lunar landing machinery. Atmosphere is optional in shared acceleration; a camera-only local ascent projection joins the existing space/surface views. UI and recording dispatch the same continuous mission.

**Stack:** Existing vanilla JS, Canvas2D, Vite/Tailwind, Chart.js, Node tests; no new dependencies.

**Spec:** docs/superpowers/specs/2026-10-19-earth-launch-design.md.

## Constraints

- Preserve NASA identity,85 prior tests, old presets, fullscreen/pause/exit/state preservation, saved compatibility.
- Real drag/thrust/fuel/staging; no orbit/trajectory reset, propellant refill or fake success. Initial launch longitude/Moon phase may be calibrated offline.
- ≤0.25s ascent guidance, bounded warp; unchanged lunar swept contact criteria2/1m/s and10deg.

## Task1 — Numerical proof then production physics

Files: new orbital/atmosphere.js, orbital/earthLaunch.js; optional physics.js atmosphere term; tests/earthLaunch.test.js, atmosphere.test.js.

- [x] Probe a staged vehicle and bounded feedback ascent in scratch; actually follow departure and existing guidance to contact. Record configuration, controls and endpoints.
- [x] Write failing tests: atmosphereAt(0).density>atmosphereAt(50000).density; drag·vrel≤0; Earth launch initial TWR>1; whole advance loop status='landed'; stage event before/after x,y,vx,vy,time identical; fuel never increases; unsafe/manual failure freezes; old no-atmosphere tests unchanged.
- [x] Implement the five earthLaunch exports from spec; validate finite inputs; atomically handle stage and fuel events and reuse old lunar contact path.
- [x] Run targeted tests and full suite; independent physics/spec review.

## Task2 — Ascent illustration and atmosphere (independent)

Files: render/earthAscent.js, render/orbitalMap.js, tests/earthAscent.test.js; optional public/flight/earth-launch.png and provenance docs.

- [x] Draw local pad, rocket/booster, engine-only exhaust, gradual altitude-based sky/cloud/horizon, then existing world view. No baked-in spacecraft/labels in backdrop.
- [x] Tests compare actual altitude/rotation/flame, sky/cloud boundary, phone panel safe area and immutable frame. Shared cache cleanup/reduced motion preserved.
- [x] Inspect desktop/phone in browser after root integration, fix only demonstrated defects.

## Task3 — UI and recording integration

Files: ui/screens/OrbitalFlight.js, scoped presentation CSS, orbital/telemetry.js, runStore.js, ui/MissionWorkbench.js and data tests.

- [x] Launch default/preset factory/advance/guidance/warp dispatch; effective controls and stage parameters reflected in forces/flame. Button Launch mission; existing post-departure landing/flyby/LEO stay available.
- [x] Earth altitude/layer/ascent-relative readouts during launch, Moon-relative readouts during approach/contact, honest model/scale notes; stage and layer announcements accessible.
- [x] Save launch start/config/stage events; total propellant consumption includes every burn, jettison distinguished from fuel use; incoming touchdown persists. CSV/Markdown and old storage checked.

## Task4 — Review, demonstration and memory

- [x] Fresh independent code/spec review; whole actual browser launch→landing. View/pause/fullscreen checks, desktop/user/phone captures and logs.
- [x] Final test/build output, example full-flight CSV/report, bounded design detector once, one fix batch/confirmation round.
- [x] Current model/guide/limits/asset attribution, PRODUCT/DESIGN/JSON/surface updates; append dated Obsidian progress/current state/concrete next steps.

Ruling: user explicitly chose calculated guided launch, so proceed with necessary vehicle, launch-window, density and camera decisions; document their approximation and verify the complete mission. Keep other planets as illustrative scenery.

