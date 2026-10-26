# Earth–Moon mission design

Approved direction: 2026-10-18, user requested applying the reviewed Earth–Moon expansion and starting work toward the December deadline.

## Deliverable and checkpoints

Build a 2D educational Earth–Moon transfer. Required success is a lunar flyby within 20,000 km of the lunar surface, followed by a result summary. Lunar capture is an upgrade; Mars and 3D are outside the core. Preserve the landing engine and NASA-style preflight in place while adding the orbital subsystem under src/orbital. No new dependencies are required for the first checkpoint.

1. Orbital physics, numerical validation, equations and limitations.
2. Playable Canvas map: Earth, moving Moon, spacecraft, heading/throttle, pause, reset, zoom/follow, telemetry, safe time warp and flyby/impact/lost outcomes.
3. Trajectory preview, live physics explanation and charts, vehicle setup, result summary, CSV and report evidence. These educational deliverables are required core work.
4. Responsive visual polish, demonstration missions and presentation rehearsal. Capture is considered only after the core passes.

Stop after each numbered checkpoint and report how to run and test it. The first checkpoint adds computational APIs; it does not replace the browser screen. Aim to finish the core before December and retain December for corrections and presentation preparation; the exact submission day is unknown.

## Physical model

Use SI units and a nonrotating Earth-centered frame. Earth is at the origin. The Moon follows a prescribed circular orbit of radius 384,400,000 m and period 27.32 days. Its phase is configurable, with a deterministic default of zero. The spacecraft starts 400,000 m above Earth's 6,371,000 m radius, with tangential circular velocity sqrt(muEarth/r). This starts in space; launch, atmosphere and landing are excluded.

Earth acceleration is -muEarth*r/|r|^3. Moon acceleration is differential: muMoon*((rMoon-r)/|rMoon-r|^3-rMoon/|rMoon|^3). The second term subtracts Earth's lunar acceleration. Moon gravity can be disabled for analytical tests. Constants: muEarth=3.986004e14, muMoon=4.9048e12, Moon radius=1,737,000 m, g0=9.80665 m/s².

Vehicle defaults remain the proposal's dry mass 4,000 kg, fuel 6,000 kg, Isp 450 s, maximum thrust 50,000 N. Configuration will expose these values. Remaining ideal delta-v is about 4.044 km/s; mission feasibility and a beginner-friendly preset require a simulated flyby before being described as validated. There is no promise that this preset reaches stable capture.

Heading is radians counterclockwise from +x, unlike the landing engine's angle from vertical. Controls are fixed inertial heading and throttle clamped to [0,1]. Acceleration adds T/m*(cos heading,sin heading). Fuel flow is T/(Isp*g0). Split a step at fuel exhaustion; no thrust continues after that instant. Accumulated ideal thrust delta-v uses Isp*g0*ln(mBefore/mAfter).

Provide velocity Verlet and RK4. Verlet evaluates position/time-dependent gravity at both endpoints and thrust at the appropriate endpoint masses. RK4 evaluates moving-Moon position and mass at each stage. Public stepping subdivides elapsed time using at most 1 s coast steps and 0.25 s powered steps by default. The later browser scheduler must budget work and reduce warp near encounters; large frame deltas must not be passed through unbounded.

## Interfaces and diagnostics

src/orbital/config.js owns the immutable default configuration; bodies.js supplies analytic Moon position and velocity; physics.js exposes createOrbitState, orbitalAcceleration, stepOrbit, orbitalEnergy, orbitElements and remainingDeltaV. State is {x,y,vx,vy,fuelMass,time,deltaVUsed}. Functions return new values and do not mutate state/configuration. Invalid finite/positive inputs throw RangeError rather than emitting NaN.

Energy is split into kinetic and potential, including the indirect potential muMoon*r·rMoon/|rMoon|^3 needed by the Earth-centered frame. The moving prescribed Moon makes the potential time-dependent: spacecraft mechanical energy is not conserved generally. Conservation validation disables Moon gravity and thrust. Earth-centered orbital elements are instantaneous two-body estimates, not predicted lunar encounter orbits. Hyperbolic/parabolic trajectories have no finite apoapsis or period.

Collision and mission state handling belong to checkpoint 2. The numerical point-mass model throws at a body center; flight must detect surface crossings and stop rather than simulate through a planet. Lunar capture must be labeled tentative unless safe periapsis and persistence are also verified; negative relative energy inside a sphere of influence alone is insufficient.

## Acceptance for checkpoint 1

Both integrators: circular-orbit radius error <1%, maximum energy error <0.1%, and measured period error <0.5% over ten Earth-only orbits. A zero-gravity burn agrees with the ideal rocket equation within 1%. Validate fuel exhaustion, angled thrust, differential lunar gravity, moving-Moon ephemeris, state immutability and invalid input rejection. Print measured errors. Existing 11 landing tests and production build must still pass.

## Sources

- [NASA rocket equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/)
- [NASA trajectories](https://science.nasa.gov/learn/basics-of-space-flight/chapter4-1/)
- [Tudat third-body acceleration](https://docs.tudat.space/en/stable/user-guide/state-propagation/propagation-setup/translational/third-body-acceleration.html)
- [NASA orbital elements](https://science.nasa.gov/learn/basics-of-space-flight/chapter5-1/)
