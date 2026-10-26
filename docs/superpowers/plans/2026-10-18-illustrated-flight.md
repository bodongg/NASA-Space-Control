# Checkpoint 4 implementation plan

Spec: ../specs/2026-10-18-illustrated-flight-design.md. Execute current session with subagent-driven-development. The project has no Git repository; modify only owned files and retain working landing/analysis modules.

- [ ] Assets: generate transparent rocket and dark space backdrop; source NASA globe photographs, inspect orientation/framing, save locally and document exact prompts/origins/credits.
- [ ] Renderer: illustrated and map modes using shared physical positions; adaptive spacecraft camera, bounded thrust visual, offscreen celestial bearings, cached images, responsive resizing, reduced motion and cleanup.
- [ ] Presentation controller: TDD native/fallback enter/exit, Escape, hide controls, focus/scroll restoration, async request races; no physics ownership or Canvas replacement.
- [ ] Integration: in-scene HTML telemetry/control strip, accessible pause/exit, secondary controls, mode/camera preference restoration, Tab containment and explicit demonstration start.
- [ ] Verify: full tests/build, code/spec review, actual native/fallback transitions and stable state, active flight, assets/errors, desktop/phone/fullscreen captures, performance sample, visual review and fixes.
- [ ] Handoff: capture illustrated flight/approach/analysis, save operating guide and presentation checklist, update report/rubric/README/design documentation and Obsidian. Stop at checkpoint completion for user review.

Rulings: flight view is a close illustrated camera; map view remains the exact spatial overview. Fullscreen uses the same DOM Canvas and state. A demonstration action deliberately loads the fixed postburn preset, rather than silently enabling autopilot or inventing motion. Physical model, mission conditions and recorded segment boundaries remain unchanged.
