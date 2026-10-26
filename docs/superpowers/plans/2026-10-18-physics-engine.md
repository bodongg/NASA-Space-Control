# Rocket Landing Physics Engine Implementation Plan

> **For agentic workers:** Use test-driven development to implement this plan task by task.

**Goal:** Build and validate the pure 2D landing physics engine.

**Architecture:** The physics module owns numeric state transitions only. Configuration supplies planet and vehicle constants. UI and rendering will consume snapshots without affecting the equations.

**Tech Stack:** Vanilla JavaScript ES modules and the Node built-in test runner. No added library.

**Spec:** User-supplied Rocket Landing Mission Control proposal and approved 2D motion with direct angle control, recorded in the Physics Obsidian project memory.

## Global Constraints

- Altitude is positive upward; x is positive right; angle is measured from vertical and positive toward right.
- Fixed integration step is 1/120 second.
- Physics owns no DOM, Canvas, or browser APIs.
- Build step 1 ends after tests pass and equations and limitations are documented.

---

### Task 1: Baseline motion and configuration

**Files:** src/config.js, src/physics.js, src/tests/physics.test.js, package.json

**Interfaces:** createInitialState(config, overrides), stepPhysics(state, controls, config, dt, method), PLANETS, DEFAULT_VEHICLE.

- [x] Write free-fall and hover tests using the Node test runner.
- [x] Run tests and confirm missing behavior causes failure.
- [x] Implement configuration, state creation, thrust, gravity, and semi-implicit Euler.
- [x] Run tests and confirm they pass.

### Task 2: Two-dimensional thrust and atmosphere

**Files:** src/physics.js, src/tests/physics.test.js

**Interfaces:** stepPhysics accepts controls.angle in radians from vertical; acceleration returns x and y components.

- [x] Write tests for thrust decomposition, drag direction, and zero atmosphere on the Moon.
- [x] Run tests and confirm missing behavior causes failure.
- [x] Implement vector thrust and velocity-opposing drag.
- [x] Run tests and confirm they pass.

### Task 3: Fuel, touchdown, energy, and RK4

**Files:** src/physics.js, src/tests/physics.test.js

**Interfaces:** energy(state, config) returns kinetic, gravitational potential, and their sum; landingOutcome(state, config) classifies pad contact and speed.

- [x] Write tests for burn mass, fuel exhaustion mid-step, pad landing thresholds, energy, and RK4 error against analytic free fall.
- [x] Run tests and confirm missing behavior causes failure.
- [x] Implement fuel-limited thrust, RK4, energy readout, and touchdown classification.
- [x] Run all tests and confirm they pass.

### Task 4: Explain the physics

**Files:** README.md, docs/report-outline.md

- [x] Document coordinates, equations, units, integration, validation cases, and limitations.
- [x] Run the full suite once more and capture results for the report.

