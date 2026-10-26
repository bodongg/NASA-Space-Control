# Playable Earth–Moon mission — checkpoint 2

Approved by user: start checkpoint 2. Spec: ../specs/2026-10-18-earth-moon-design.md.

## Deliverable

Replace the default entry with a playable orbital flight display, retaining the original landing preflight at ?view=landing. Keep NASA typography, black masthead, official insignia, white controls, red actions and a dark scientific map. No dependencies are added. No Git repository exists; work is additive and the original main.js is copied to landing.js before replacement.

## Tasks

- [x] Mission logic: pure createMission(preset), advanceMission(mission,controls,seconds), safeWarp. Detect Earth/Moon surface crossings before center singularities, successful flyby at 20,000 km altitude and lost radius at 1,000,000 km. Keep fuel exhaustion as coasting. TDD for outcomes, immutability, warp and an end-to-end finite-burn transfer preset.
- [x] Canvas renderer: Earth, analytic Moon, spacecraft, actual path history, lunar orbit, scale bar, zoom and follow. Scientific distances remain to scale with enlarged body markers disclosed.
- [x] Flight UI: clock, status/outcome banner, preset/reset, start/pause, engine toggle, throttle/heading, prograde/retrograde, warp, zoom/follow and live telemetry. Reuse Button/Slider. Heading is counterclockwise from +x. Real flight state comes only from stepOrbit via mission logic.
- [x] Scheduler: bound frame delta, cap 8 ms work/50 chunks per frame, <=120 simulated seconds per chunk; discard unprocessed catch-up, display actual rate, pause when hidden, cap powered warp and encounter warp dynamically. Catch numerical errors with a visible recovery message.
- [x] Verify all tests and production build, browser interaction and desktop/mobile layouts. Independent physics/code and visual review; address material findings.
- [x] Document controls, verified preset, current status and next steps in project docs and Obsidian.

## Interface contract

Mission: {state,config,status,closestAltitude,preset}; state uses orbital engine shape. Status: active, flyby, earth-impact, moon-impact, lost. Controls: {throttle,heading}. createOrbitalMap(canvas) returns draw({state,config,trail,heading,thrusting,follow,zoom}) and destroy().

## Ledger

- Ruling: retain landing as a separate entry route — preserves working fallback without duplicating assets/dependencies.
- Ruling: offer a verified post-departure transfer preset — repeatable classroom demonstration; it explicitly starts after a simulated finite burn, rather than adding live autopilot.
- Ruling: the existing detailed flight requirements determine composition — map beside controls, measurements below; inherit the established visual system.

## Completed verification

2026-10-18: 37/37 tests pass; production build passes. Independent mission/code review found no material issues. Visual reviewer disposition ship with two wording corrections applied (terminal action and success notice). Browser manual controls, fuel/warp, keyboard, zoom/follow/reset, landing fallback and actual flyby verified; desktop and phone show no horizontal overflow. Design documentation updated after correction. Next checkpoint is prediction, charts/explanation, vehicle setup and result/export/report tools.

