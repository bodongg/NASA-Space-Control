# Checkpoint 4 — illustrated flight and presentation

Implementation authorized by the user on 2026-10-18, superseding the prior planning-only note in checkpoint4-visual-brief.md. Implement all previously approved visual and fullscreen requirements without altering orbital equations or mission rules.

## Visual direction

Extend the established NASA-inspired editorial interface. The illustrated Canvas is the main visual: a photographic white/silver rocket, NASA Earth/Moon globes, and a locally bundled dark starfield with distant illustrative planets. Flight view defaults to spacecraft follow, with a close adaptive camera and visible celestial horizon/approach. Orbital map remains available for physically scaled trajectory explanation. Art sizes are enhanced and background planets are illustrative, explicitly labeled. Rocket position follows the simulation; flame appears only under fueled thrust. Cosmetic camera/orientation easing may not change physical state. Respect reduced-motion preferences.

## Presentation

Fullscreen targets the same scene element and Canvas, with an expanded in-page fallback when native fullscreen is unavailable. Enter/exit never reconstructs mission or record. Save and restore camera/view preferences around presentation; do not change throttle, fuel, time or pause state. Secondary controls/readouts can be hidden while pause/resume and exit remain visible. Tab stays inside the presentation; Escape exits; P pauses, F switches presentation, H toggles controls when not editing a form. Focus and body scrolling restore on exit. Fullscreen state changes and pending enter/exit races are handled.

Provide in-scene engine/throttle/heading/prograde/retrograde/warp controls and a clearly labeled lunar-transfer demonstration start. Intentional demo loading saves the old segment through the existing workbench, loads the verified coast preset and starts its 10,000x coast. It is explicitly a post-departure demonstration. Terminal outcome remains visible; no fake exhaust during coasting or orbital capture claim.

## Verification

Keep all 52 prior tests passing; meaningful presentation-controller tests cover native and fallback state changes, Escape, visibility, focus/scroll restoration and async races. Verify loaded assets and renderer cleanup without mutating state. Browser checks cover scene/map and native-or-fallback fullscreen transitions with time/fuel preserved, hidden controls with pause/exit reachable, keyboard access, demonstration flight, terminal report persistence, phone/desktop layout and a presentation viewport. Measure frame cadence in a visible active scene and report context/limits. Review actual images, source and screenshots, correct material findings, save credits/origins and report evidence, update Obsidian.

The final student reflection/contributions and actual classroom projector rehearsal require the team; document a concrete checklist rather than inventing completion. No 3D, Mars, sound or new physics subsystem is introduced.
