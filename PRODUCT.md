# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vanilla JavaScript ES modules, Vite, Tailwind CSS, Canvas 2D and Chart.js are implemented. The numerical coast forecast uses a dedicated module worker. The Earth launch extension adds no dependencies.

## Users

Physics 1 students presenting a mechanics simulation to classmates and an instructor.

## Product Purpose

Launch a calculated spacecraft from Earth through atmospheric layers, build orbital speed, depart for the Moon and land under automatic guidance. Let students pause, inspect forces and fuel, override guidance for experiments, and explain the equations, algorithms, results and limits in a classroom demonstration and report.

## Operating Context

The simulation runs in a browser on a laptop and must remain legible when projected. Keyboard, pointer and phone layouts support operation and presentation. The rubric requires user input, animated visuals and documentation. School-laptop and physical-projector rehearsal remain team work.

## Capabilities and Constraints

Updated 2026-10-19. The default is Earth launch → Moon, paused on the pad at mission time zero with Automatic mission guidance enabled. Launch mission starts real integrated ascent and propellant flow. A fixed three-stage stack reaches approximately 400 km Earth orbit, separates, performs an actual 450-second departure burn, coasts, brakes and descends to swept lunar surface contact. Position, velocity and time remain continuous through staging; dry and residual fuel mass are explicitly discarded. Loaded shorter starts remain Moon landing · post-departure, Moon flyby · coast and Earth orbit · practice. The original landing laboratory remains at ?view=landing.

The fixed stack initially totals 553,000 kg: booster 25,000 kg dry / 400,000 kg propellant / 7 MN / 300 s Isp; upper stage 8,000 kg dry / 100,000 kg propellant / 1.2 MN / 450 s Isp; lunar spacecraft 4,000 kg dry / 16,000 kg propellant / 100 kN / 450 s Isp. Custom vehicle sliders create a separate new LEO practice flight. They do not change the fixed full-launch or shorter demonstration vehicles.

The numerical model uses planar point-mass translation, central Earth gravity, a prescribed moving circular Moon with differential gravity, variable mass and ideal engines with fixed thrust/Isp per stage. Launch drag opposes motion relative to an Earth-rotating atmosphere; density is the simplified exponential 1.225 exp(-altitude/8500), with CdA 15 m². The five layer labels use approximate 12/50/85/600 km boundaries. The 100 km conventional space boundary lies within the thermosphere. Staging is instantaneous; direct attitude control has no torque dynamics. Winds, heating, detailed aerodynamics, chemistry and real launch hardware certification are outside this teaching model.

Automatic guidance changes actual heading/thrust and consumes fuel. Manual override can fail; it does not guarantee recovery. Safe lunar contact requires absolute vertical speed ≤2 m/s, sideways speed ≤1 m/s and tilt ≤10°. Incoming contact evidence is retained separately from the resting state. Capture, Mars, 3D, sound and a backend are deferred; no further scope is automatically authorized.

## Brand Commitments

Preserve the user-approved NASA photographic editorial world: official unchanged insignia, local NASA Earth/Moon photography, Inter headings, Public Sans explanations, square white working surfaces and red actions. The actual project remains Desktop/rocket-landing. Identify it as an independent student simulation, retain NASA non-affiliation language, and credit generated scenery separately from NASA imagery. Scenery planets and enhanced artwork scale are illustrative.

## Evidence on Hand

The supplied Physics 1 rubric and project briefs, analytical/numerical test cases, report outline, guides and recorded CSV/Markdown evidence support the demonstration. The Earth launch design is docs/superpowers/specs/2026-10-19-earth-launch-design.md. Final root verification reports 113 passing tests and a successful production build; independent numerical/data review approved shipment after its findings were fixed. Complete pad-to-contact numerical validation reaches t≈225,096.698 s with ≈411.018 kg fuel and incoming vertical speed ≈−0.298313 m/s. Separately, an actual continuous production-browser run from the pad reached safe lunar contact at clock 2d 14:31:34, incoming vertical speed −0.297 m/s, sideways speed 0.000 m/s, tilt 0.001° and 411.0 kg fuel, then automatically paused and saved. The report recorded initial mass 553,000 kg, about 511,034 kg burned propellant, 4,554.9 kg discarded residual propellant and 33,000 kg discarded stage dry mass. See docs/earth-launch-validation.txt and docs/screenshots/earth-launch-*.jpg.

Earlier checkpoint evidence is historical: the corrected flyby reached 19,999 km lunar altitude, and the separate post-departure landing browser run reached contact at 2d 13:58:16 with about 415 kg fuel. Those runs do not prove the new pad start. Full assignment delivery still needs team interpretation, contributions/reflection and classroom rehearsal.

## Product Principles

- Make physics visible through actual commands, units, forces and measurements.
- Keep the demonstration repeatable and explain the model limits.
- Preserve continuous mission state across cameras, views and presentation.
- Keep laptop, phone and projector controls readable and accessible.

## Mission workbench and reports

Live force substitutions include gravity, thrust and atmospheric drag, with pad support explained separately. Stage-dependent telemetry records actual attached mass and propellant, stage, phase, Earth vertical/tangential speeds, layer, density and dynamic pressure. Segment fuel used excludes discarded propellant; discarded propellant and dry stage mass have separate report figures. Ideal staged delta-v assumes all attached propellant is burned and can exceed the realized route budget when insertion discards upper-stage reserve.

The engine-off forecast is unavailable during powered ascent/departure, then supplies a three-day snapshot excluding future guidance burns; it is not a powered landing forecast. It stops at successful contact. Chart.js speed/energy/trajectory panels include units and numerical tables; Earth-centered chart speeds differ from Moon-relative landing speeds, and moving-Moon/propellant exchanges make mechanical energy time-dependent. CSV and Markdown exports include launch setup/events/drag assumptions and incoming contact evidence. Three browser-local saved runs support comparison and old flyby/landing records remain compatible.

## Flight and presentation

The local launch scene follows actual altitude/heading/stage: coastal pad and blue sky, fading lower-atmosphere clouds, curved Earth and a blend into the existing starfield/Earth–Moon world. Near the Moon it uses the existing local regolith contact view. Six local flight images include the new generated coastal launch landscape; provenance is in docs/flight-assets.md, docs/earth-launch-asset.md and public/flight/credits.md. No new dependency or remote runtime asset is required.

Flight and Orbital map share one mission/Canvas. Native fullscreen and Expand view preserve time, fuel, pause state and record; exit restores camera/view and scrolling. Synchronized guidance/manual controls, hideable secondary overlays, persistent pause/exit, P/F/H/Escape, visible focus and contained Tab support presentation. Camera/heading easing is display-only and respects reduced motion. Requested 10,000× warp is phase-limited; the pad/lower ascent begins at up to 5×. Exact layout and behavioral contract: docs/surfaces/orbital-flight.md.

Production-browser state preservation was also checked during ascent: paused clock 00:06:01, altitude 176 km and fuel 63,531 kg stayed identical through Flight → Map → Flight, expanded-view exit and native fullscreen entry at 1536 × 864. Controls hiding and resume were exercised. This evidence does not claim school hardware rehearsal.
