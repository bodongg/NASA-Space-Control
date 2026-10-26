# Checkpoint 4 — illustrated flight and presentation design

Approved for implementation 2026-10-18: the user authorized the recognizable rocket, detailed Earth/Moon, space setting and fullscreen presentation. These capabilities are now implemented. This supersedes the earlier planning-only fullscreen note. All three final visual review fixes are resolved. Physical classroom hardware rehearsal remains pending; the full assignment is not claimed complete.

## Acceptance requirements and current evidence

| Requirement | Implemented evidence | Remaining review |
| --- | --- | --- |
| Recognizable rocket and celestial bodies | Transparent rocket artwork with engine-driven exhaust; NASA Apollo 17 Earth and LRO Moon imagery; heading follows the controls | Reviewed in final captures; verify physical projection |
| Coherent space setting | Locally bundled dark starfield with restrained distant Saturn/Jupiter scenery | Reviewed in final captures; confirm on classroom hardware |
| Designed composition | NASA-inspired typography/attribution, spacecraft-focused flight view, physical overview map, responsive HTML controls | Desktop/phone review fixes resolved; classroom check pending |
| Meaningful motion | Exhaust appears during actual powered advancement; restrained background/flame movement; reduced-motion preference respected | Judge motion and readability during rehearsal |
| Scientific clarity | Illustrated-scale notice; scenery disclaimer; map distance scale; separate traveled path and forecast/closest marker in map | Explain display scale and flyby threshold in the report |
| Presentation | Native fullscreen, explicit expanded-window alternative, automatic fallback, hide/show controls, persistent pause/exit, Escape support, state-preserving resize and camera restoration | Test actual school laptop, projector and relevant browser |
| Performance/accessibility | About 3.8 MB of local flight imagery; image caching and resize-aware Canvas; HTML keyboard controls/focus handling | Hardware and offline rehearsal |

## Presentation behavior

**Enter fullscreen / F** requests browser fullscreen; **Expand view** uses the same scene within the browser window. If native fullscreen is denied or unavailable, presentation remains expanded. **H** hides/restores secondary panels and overlays. Pause/resume and exit remain reachable, with **P**, **Escape**, and **Exit presentation** available. Entering/exiting preserves the simulated flight; entry follows the spacecraft and exit restores the previous camera/view/zoom. A running flight continues unless paused.

**Start lunar demonstration** intentionally resets to and immediately starts the verified post-departure transfer, saving the previous meaningful recorded segment. It does not turn an arbitrary manual flight into the verified route. For manual burns, load LEO. Exit presentation to inspect the retained prediction, force substitutions, charts, saved runs and exports. Details are in the [checkpoint 4 guide](checkpoint4-guide.md).

## Verification record — 2026-10-19

Final checks passed all 64 tests and the production build. Browser checks entered native fullscreen, hid/restored controls, used P from focused buttons and exited through Escape/Exit; settled paused flight readings and report survived map/exit inspection. The final lunar demonstration stopped at 2d 10:17:59 and 19,999 km displayed lunar altitude, then saved automatically. Desktop 1440 px, actual browser 1280 px and phone 390 px had no page overflow or browser warnings/errors. The phone panel now leaves the rocket visible; heading/camera easing has five regression tests. Local active rAF windows measured 161.8 callbacks/s powered and 159.8/s at 10,000× coast; these high-refresh IAB samples are not school-hardware FPS guarantees. Physical projector/school-laptop checks remain outstanding. Final visual verdict is recorded separately in checkpoint4-review.md.

## Review gate and scope

Completed and inspected captures: `checkpoint4-desktop.jpg`, `checkpoint4-mobile.jpg`, `checkpoint4-powered-flight.jpg`, `checkpoint4-lunar-success.jpg`, `checkpoint4-mobile-presentation.jpg`, `checkpoint4-user-1280.jpg` and `checkpoint4-analysis.jpg` under `docs/screenshots`. A fresh visual review identified phone framing, display motion and persistence fixes; the final verdict scores those findings. Rehearse a short sequence from force explanation/manual burn to the verified lunar coast, map/forecast, charts and export on the actual classroom hardware. Add team observations, interpretation and reflection to the final report.

This is a 2D presentation upgrade. Artwork and decorative lighting are illustrative; body centers remain tied to the simulated positions and physical collision radii remain unchanged. The model remains Earth–Moon. Mars, lunar capture and full 3D are deferred. Visual impact is a goal; no grade or audience reaction is guaranteed. Asset sources and generation details are in [flight-assets.md](flight-assets.md); production attribution is bundled at `/flight/credits.md`.
