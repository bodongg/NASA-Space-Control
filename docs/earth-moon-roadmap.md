# Earth–Moon delivery roadmap

Scope approved 2026-10-18. Submission is in December; the exact day is unknown. Original month targets below are planning targets, not schedule guarantees. Current implementation has progressed ahead of them.

| Original target | Checkpoint | Current state — 2026-10-19 |
| --- | --- | --- |
| October | 1. Orbital foundation | Implemented; both integrators numerically validated; preserved landing tests/build pass |
| Early November | 2. Playable flyby | Implemented; controls, bounded warp, impact/lost outcomes and actual verified flyby |
| Mid November | 3. Educational delivery | Implemented; prediction, live forces/charts, setup, saved runs, CSV/report exports and report draft |
| Late November | 4. Illustrate, finish and rehearse | Illustrated rocket/Earth/Moon, space backdrop and fullscreen/expanded presentation implemented and review fixes resolved; hardware checks, final report and rehearsal pending |
| December | Submission buffer | Resolve rehearsal findings and prepare the assessed presentation |

## Checkpoint 4 implementation and remaining work

The user approved the visual and presentation work on 2026-10-18. Flight view now shows a recognizable rocket with thrust exhaust, NASA Earth/Moon imagery and a locally bundled illustrative space background. Orbital map retains distance geometry, forecast and traveled-path analysis. Fullscreen and expanded view support hideable controls, reachable pause/exit, Escape, resize and state preservation. Existing forces, vehicle setup, charts and exports remain available.

Implementation checks reported 64 passing tests and a successful build. Browser checks exercised actual native fullscreen, pause/hide/exit, state preservation and an automatically completed lunar demonstration. Desktop 1440 px and phone 390 px checks found no horizontal page overflow; the checked session had no browser warnings/errors. All three visual review fixes resolved; physical school-laptop/projector/offline performance checks remain pending.

Next: user review of the scene and captures against the [visual brief](checkpoint4-visual-brief.md), complete hardware rehearsal using the [guide](checkpoint4-guide.md), add final report screenshots/run interpretation and team contributions/reflection, then address rehearsal findings. Keep user review after each checkpoint. Do not call the full assignment finished before those steps.

The model remains 2D Earth–Moon. Artwork is enlarged for legibility; distant planets are illustrative scenery and do not exert forces. The validated physics and original landing engine are preserved. The requested guided lunar landing now extends checkpoint 4; see [landing model/demo](lunar-landing.md). It uses continuous orbital physics through powered descent and contact. Orbit capture, Mars, 3D, a Python backend and sound remain deferred.

## Earth launch extension —2026-10-19

User requested and approved calculated automatic Earth launch. The current default starts at the pad and numerically continues through atmosphere/staging/orbit/departure to lunar contact; see earth-launch.md. Software validation113 tests/build and actual production-browser full journey pass. Physical classroom/projector/offline rehearsal and final student interpretation/reflection remain. This adds to checkpoint4 rather than creating an unrequested Mars/3D/backend scope.
