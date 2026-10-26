# Rubric coverage — current state

Updated 2026-10-19. This checklist records implemented evidence without claiming the full assignment is finished.

| Requirement | Evidence | Status |
| --- | --- | --- |
| At least one Mechanics topic | `src/orbital/physics.js`: Newton's law, 2D motion, gravitation, circular motion, energy | Computational model implemented |
| Correct equations and validation | Orbital tests; `docs/orbital-physics.md`; numerical validation outputs | Numerically tested; current landing suite/build evidence in lunar-landing-validation.txt |
| Interactive input | `OrbitalFlight.js`: heading/throttle, prograde/retrograde, presets, vehicle setup, pause/reset, warp/camera; presentation flight panel | Implemented and browser checked |
| Clear animation and illustration | `src/render/orbitalMap.js`: rocket/exhaust, NASA Earth/Moon, illustrative space, flight/map views | Implemented; final visual and classroom hardware review pending |
| Algorithm/programming explanation | `docs/orbital-physics.md`, `docs/flight-controls.md`, source comments | Physics and bounded scheduler documented |
| Executable interactive program | `npm run dev`; `npm run build` produces `dist` | Playable mission and production build verified |
| Report with concepts, algorithms, results | Report outline/draft; measured example exports; live force/chart/report tools | Final illustrated evidence and student interpretation pending |
| Screenshots and demonstration | Prior checkpoint captures; `docs/checkpoint4-guide.md`; actual automatic flyby at about 2d 10:17:58 | Repeatable browser demonstration verified; final captures/rehearsal pending |
| Fullscreen presentation and accessibility | Fullscreen/expanded fallback, hide/show controls, persistent pause/exit, keyboard shortcuts and Escape | Browser checked; projector/school-laptop check pending |
| Reflection/limitations/improvements | Physics documentation and report draft | Model/display limits documented; team reflection pending |

Checkpoint 3 evidence remains in `docs/checkpoint3-validation.txt`, `docs/checkpoint3-report-draft.md`, `docs/evidence/custom-leo.csv` and `custom-leo-report.md`. Prediction, graphs, forces and comparison remain in the flight page below the scene.

Checkpoint 4 supplies the requested illustrated rocket, celestial bodies, space setting and presentation controls. Artwork scale and background planets are explicitly illustrative; physics is unchanged. See the [guide](checkpoint4-guide.md), [visual brief](checkpoint4-visual-brief.md) and [asset provenance](flight-assets.md). Visual review fixes are resolved; actual school hardware/offline demonstration, team rehearsal and reflection remain required before submission. Guided landing now extends the illustrated journey; orbit capture, Mars and 3D remain deferred. Actual continuous-contact tests and browser result evidence are in [lunar-landing.md](lunar-landing.md).

## Full Earth launch extension —2026-10-19

Calculated drag/thrust/variable mass/staging and actual pad-to-Moon contact extend mechanics coverage. Layer labels, blue-sky→space/curved-Earth view, staged rocket and existing Moon landing illustrate the same physical state.113tests/build and an actual complete production-browser mission pass; see earth-launch.md and earth-launch-validation.txt. Scientific reports distinguish initial stack, spent fuel, discarded propellant/dry hardware and incoming contact evidence. Student interpretation/contributions/reflection and physical hardware rehearsal remain pending; no grade is guaranteed.
