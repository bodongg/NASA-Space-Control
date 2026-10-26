# Mission Control HUD Foundation Implementation Plan

> **For agentic workers:** Use test-first checks where behavior is added. Execute this plan task by task.

**Goal:** Make the project runnable in Vite and establish reusable, accessible HUD components with the approved mission-control styling.

**Architecture:** Tailwind v4 runs through its Vite plugin. Theme tokens live in CSS. Small vanilla-JS component functions return DOM elements; the temporary preflight view mounts them to prove the interface foundation.

**Tech Stack:** Vite, Tailwind CSS v4, vanilla JavaScript, Node built-in test runner.

**Spec:** PRODUCT.md, DESIGN.md, and the user-supplied project brief.

## Global Constraints

- Keep the existing physics module independent of the DOM.
- Use original branding and no NASA logos.
- Support laptop and projector widths, keyboard focus, and reduced motion.
- Do not add libraries beyond the user-approved stack.

---

### Task 1: Tooling and entry point

**Files:** package.json, package-lock.json, vite.config.js, index.html, src/styles.css, src/main.js

- [x] Install current stable Vite, Tailwind CSS, and the official Vite plugin.
- [x] Add dev and build scripts while retaining the physics test script.
- [x] Configure the Vite plugin, entry HTML, CSS import, and an initial mount.
- [x] Run the production build and confirm it succeeds.

### Task 2: Theme and components

**Files:** src/styles.css, src/ui/components/Panel.js, Readout.js, Gauge.js, StatusLight.js, Slider.js, Button.js

- [x] Define color and type tokens and accessible component states.
- [x] Implement components as DOM functions with text-safe values and explicit labels.
- [x] Mount every component in the preflight view with real default physics data.
- [x] Run build and physics tests.

### Task 3: Visual and interaction check

**Files:** src/main.js, src/styles.css, README.md

- [x] Check the view at laptop and narrow widths, including keyboard focus.
- [x] Fix any material layout or contrast issue in one pass.
- [x] Document how to run the preview and what functionality remains for the flight display.
- [x] Run build and tests again and record the checkpoint in Obsidian.

