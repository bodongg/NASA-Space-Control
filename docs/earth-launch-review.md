# Earth launch review —2026-10-19

## Independent code and specification review

Disposition: no material issues remain. Reviewer inspected numerical launch, optional drag, pad support, guidance/staging, telemetry/storage/report and the final UI/renderer wiring. Whole variable-frame flight reaches actual swept Moon contact with411.01846kg fuel. Full-record save/reload, CSV/Markdown and exact fuel accounting pass; the553000kg initial stack snapshot remains separate from the4000kg terminal dry mass.

Resolved findings, with red→green regression evidence and scoped recheck:

- Nonlifting pad-held spacecraft no longer enters lunar collision handling when a departure timer expires; liftoff gates departure timing and handoff.
- Closest lunar altitude updates while the supported pad and Moon move.
- Air drag follows density for every launch stage, including early manual staging in dense air.
- Ideal delta-v sums attached stages rather than applying one engine/Isp to all propellant.
- Renderer receives the current rotating pad longitude, avoiding false sideways movement at rest.

Final source review found no additional material issue. Browser interactions remain root evidence rather than the code reviewer's claim.

## Fresh visual review

Disposition: **ship for the bounded visual review; no material UI defects**. Reviewer opened desktop/phone pad, actual lift-off, native upper atmosphere, clean Moon touchdown, full traveled-path map and phone touchdown.

Rocket/stage silhouettes, altitude/layer progression, NASA identity and telemetry remain clear; pause/exit stay visible. Surface feet contact the ground, terminal exhaust is absent and the completed result is explicit. The map connects Earth and Moon. Small secondary terrain captions are weaker than main HUD but do not justify another polish cycle.

Root's first inspection found the landscape top seam and phone layer badge overlap. One batch fixed proportional image cover and moved the open-panel phone badge to74px (bottom105.6px, panel top110px). Final confirmation captures were opened. One design detector pass on changed UI sources returned exit0 with no reported findings.

## Execution evidence

All113 tests and production build pass. Actual production browser pad→Moon contact:2d14:31:34, incoming0.30m/s,411kg fuel; auto-pause/save. Native1536×864, desktop1280×900, phone390×844 and user714×668 checked. Paused mid-ascent time/fuel/altitude persisted through view and fullscreen transitions. No page overflow or browser warning/error in checked session. See earth-launch-validation.txt, model/demo and screenshot/evidence files.

Physical school-laptop/projector/offline rehearsal and student interpretation/reflection remain human work. Model is educational2D with idealized engines/stages and simplified air/attitude.
