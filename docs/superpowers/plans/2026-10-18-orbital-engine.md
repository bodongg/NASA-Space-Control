# Orbital Engine Implementation Plan

> Execute inline with executing-plans and checkpoint review. User has authorized starting the approved Earth–Moon direction.

**Goal:** A separately testable Earth–Moon orbital engine that preserves the existing landing implementation.

**Architecture:** Add pure ES modules under src/orbital. Keep main.js, landing config.js and physics.js unchanged. The existing Node test glob discovers the new validation file.

**Tech Stack:** Existing vanilla JavaScript, Node built-in tests, Vite/Tailwind. No dependencies added.

**Spec:** ../specs/2026-10-18-earth-moon-design.md

## Constraints

SI units. Earth-centered differential lunar acceleration. Default coast step <=1 s, powered step <=0.25 s. Preserve NASA UI. Flyby core; capture stretch; no Mars. Stop after this engine checkpoint. No Git repository exists in the target folder, so commits/worktrees do not apply.

## Task 1: Orbital model and validation

Files: create src/orbital/config.js, bodies.js, physics.js, and src/tests/orbital.test.js.

Interfaces: moonState(time,config) -> {x,y,vx,vy}; createOrbitState(config,overrides) -> state; orbitalAcceleration(state,controls,config) -> {ax,ay}; stepOrbit(state,controls,config,dt,method='verlet') -> state; orbitalEnergy(state,config) -> {kinetic,potential,total,specific}; orbitElements(state,config) -> {eccentricity,periapsis,apoapsis,period,specificEnergy,angularMomentum,circularSpeed}; remainingDeltaV(state,config) -> m/s.

- [x] Write src/tests/orbital.test.js first. Use independent circular-orbit formulas for radius, period, energy, and a rocket-equation reference for a zero-gravity burn. Include endpoint fuel exhaustion, direct thrust, Moon ephemeris/differential gravity and invalid-input cases.
- [x] Run Node's test runner on that file. Confirm the new orbital module is missing while existing landing tests remain green.
- [x] Implement immutable config and circular Moon ephemeris. Implement differential gravity, variable-mass thrust, split burns, endpoint Verlet and RK4. Add energy, ideal delta-v and osculating orbital elements with unbound cases.
- [x] Run the complete test suite. Both methods must meet spec tolerances, printing maximum radius/energy error and measured period. Correct any failures before continuing.

## Task 2: Documentation and handoff

Files: modify README.md intro/next-stage; create docs/orbital-physics.md and docs/orbital-validation.txt. Update the Obsidian Physics memory.

- [x] Document equations, coordinate differences from landing, measured test output, limitations and checkpoint boundaries.
- [x] Run npm test and npm run build from the actual application folder; save the validation output.
- [x] Record the approved scope and completed checkpoint in Obsidian. Report the next checkpoint and executable commands to the user.

