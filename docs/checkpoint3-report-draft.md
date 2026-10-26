> Current default —2026-10-19: **Earth launch → Moon** now calculates lift-off, atmospheric drag, stages, orbit insertion and the actual departure burn before lunar landing. Select **Launch mission**. See [Earth launch model/demo](earth-launch.md). Older post-departure instructions below apply to the explicitly selected shorter starts.

> Current extension — 2026-10-19: the default is now **Moon landing · guided**, with continuous coast, braking, powered descent and calculated touchdown. See [lunar landing model/demo](lunar-landing.md) and current validation. The original flyby instructions below apply when **Moon flyby · coast** is selected.

# Mission Control: Earth–Moon Transfer — report draft

## Objective

Demonstrate two-dimensional motion, Newton's second law, gravitation, circular motion and work/energy through an interactive lunar flyby. Users change heading, thrust and vehicle properties and inspect numerical evidence. Rocket thrust represents momentum exchange with exhaust; the spacecraft alone is not a closed momentum-conserving system.

## Model and equations

The spacecraft starts in a 400 km circular low Earth orbit, rather than modeling atmospheric launch. The model is planar and uses SI units. Earth is the origin of a nonrotating accelerating frame. The Moon follows a prescribed circular orbit of radius 384,400 km and period 27.32 days.

Earth acceleration is -muE*r/|r|³. Lunar acceleration is differential: muM*((rM-r)/|rM-r|³-rM/|rM|³), which subtracts the Moon's acceleration of the Earth-centered origin. Thrust acceleration is T/m times the heading unit vector. Fuel consumption is T/(Isp*g0), and remaining ideal delta-v follows Isp*g0*ln(m/mdry). Full equations and file/function mapping are in orbital-physics.md.

Velocity Verlet advances the simulation with coast steps <=1 s, powered steps <=0.25 s, and splits at fuel exhaustion. RK4 is available in the validated physics API for comparison. The browser budgets numerical work per frame and reduces warp for powered flight and near-surface encounters. Swept relative chords detect Earth/Moon impact and interpolate contact. A separate worker forecasts an engine-off trajectory using the same engine and guards.

## Validated reference mission

The transfer preset is constructed from the original 4,000 kg dry / 6,000 kg fuel vehicle, 50 kN thrust and 450 s Isp. With Moon phase 2.6 radians, a 450 s velocity-prograde departure burn consumes about 5,099 kg fuel and provides about 3,146.730 m/s ideal thrust delta-v. The loaded preset begins after that burn, with about 901.419 kg fuel remaining.

An unpowered coast reaches the game's flyby objective, 20,000 km lunar surface altitude, near t=209,879 s (2.429 days from the initial LEO state). Continuing the physical coast past the gameplay stop gives a closest lunar surface altitude around 3,523.662 km near t=224,228 s. This validates a flyby geometry, not lunar capture. The three-day coast forecast reproduces that closest approach. The recipe and reconstruction test are documented in flyby-preset.md.

## Numerical validation

The suite includes the original orbital and landing tests plus custom vehicle, prediction, telemetry/export and persistence checks. At a deliberately coarser 10 s test coast step over ten Earth-only orbits, Verlet's maximum radius error is about 0.0064200%, maximum specific energy error 0.000000412%, and measured period 5545.0927 s versus analytical 5544.8554 s. RK4 gives 5544.8554 s. A 100 s zero-gravity burn gives 530.665023 m/s for Verlet versus the rocket-equation reference 530.665015 m/s. See the captured validation outputs for the exact current test count and results.

The moving prescribed Moon makes the potential time-dependent, so spacecraft mechanical energy need not remain constant. The Earth-centered potential includes the indirect term. Fuel/exhaust energy exchanges also matter during burns. Conservation tests explicitly disable lunar gravity and thrust.

## Interaction, visualization and evidence

The flight screen provides manual and post-departure starts, heading/throttle/prograde/retrograde, pause/reset, zoom/follow, safe warp and live telemetry. The physics panel substitutes current force/mass values. Vehicle sliders expose parameter effects, with an ideal delta-v reference qualified by finite-burn and timing limitations. Live graphs show speed, energy and traveled trajectory, with start/latest numerical values and saved-run overlays.

The segment report subtracts its first sample, so a post-departure coast does not claim to have burned the departure fuel during recording. CSV retains SI units and setup metadata; the downloadable Markdown report includes actual current measurements. Up to three browser-local runs can be compared. Sampling is bounded and decimated while retaining endpoints; it does not contain every integrator substep.

Screenshots and example exported files belong under docs/screenshots and docs/evidence. Checkpoint 4 now provides a recognizable rocket with thrust-driven exhaust, NASA Earth/Moon imagery and an illustrative space background. Fullscreen/expanded presentation has hideable controls, pause and exit; the physical map, forecasts and analysis remain available. See checkpoint4-guide.md and flight-assets.md. Final illustrated captures are in docs/screenshots/checkpoint4-*.jpg; all three visual review fixes are resolved. Classroom hardware rehearsal remains pending.

## Limitations and reflection

Limitations include 2D motion, circular prescribed lunar orbit, point masses, no atmosphere/launch, constant Isp, no staging/torque, sampled telemetry, approximate collision timing, approximate snapshot forecasts, and independently scaled trajectory-chart axes. The map preserves physical distance scaling while enlarging body/rocket artwork for visibility. Flight view uses illustrated scale and decorative lighting; background planets are illustrative and do not affect the Earth–Moon model.

Before submission, the team must add its own analysis of successful and unsuccessful runs, screenshots from the illustrated version, role/contribution statements, presentation observations, and reflection on discrepancies or improvements. This draft does not invent team contributions or claim an assessed final result.
