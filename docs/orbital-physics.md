# Orbital physics — checkpoint 1

This computational engine is implemented and tested, and checkpoint 2 connects it to a playable orbital flight display through src/orbital/mission.js. The original landing engine and NASA-style preflight remain at ?view=landing. See flight-controls.md for the browser scheduler and event guards.

## Coordinates and constants

All values use meters, seconds, kilograms and radians. Earth is at (0,0); +x points right, +y up. Positive heading turns counterclockwise from +x. This differs from the preserved landing engine's angle measured from vertical. Drawing must invert y when mapping into Canvas screen coordinates.

Defaults live in src/orbital/config.js. Earth mu is 3.986004e14 m³/s² and radius 6,371 km. Moon mu is 4.9048e12 m³/s² and radius 1,737 km. The circular lunar orbit has radius 384,400 km and period 27.32 days. Standard gravity for Isp is 9.80665 m/s². Default spacecraft: 4,000 kg dry + 6,000 kg fuel, Isp 450 s, maximum thrust 50 kN.

## Equations and code locations

| Concept | Equation | Function |
| --- | --- | --- |
| Circular Moon ephemeris | omega=2*pi/P; rM=R*(cos(phase+omega*t),sin(phase+omega*t)); vM=omega*(-yM,xM) | bodies.js: moonState |
| Circular LEO | r=RE+400000; v=sqrt(muE/r) | physics.js: createOrbitState |
| Earth gravity | aE=-muE*r/\|r\|³ | physics.js: accelerationAt |
| Differential Moon gravity | aM=muM*((rM-r)/\|rM-r\|³-rM/\|rM\|³) | physics.js: accelerationAt |
| Thrust acceleration | aT=T/(mdry+mfuel)*(cos heading,sin heading) | physics.js: accelerationAt |
| Fuel flow | mdot=T/(Isp*g0) | physics.js: stepOrbit |
| Ideal thrust delta-v | dv=Isp*g0*ln(mBefore/mAfter) | physics.js: stepOrbit, remainingDeltaV |
| Specific kinetic energy | k=\|v\|²/2 | physics.js: orbitalEnergy |
| Specific effective potential | U=-muE/\|r\|-muM/\|r-rM\|+muM*r·rM/\|rM\|³ | physics.js: orbitalEnergy |
| Specific Earth two-body energy | epsilon=\|v\|²/2-muE/\|r\| | physics.js: orbitElements |
| Angular momentum per unit mass | h=x*vy-y*vx | physics.js: orbitElements |
| Eccentricity vector | evec=((v²-muE/r)*r-(r·v)*v)/muE | physics.js: orbitElements |
| Periapsis | rp=h²/(muE*(1+e)) | physics.js: orbitElements |
| Bound-orbit apoapsis and period | a=-muE/(2*epsilon); ra=a*(1+e); P=2*pi*sqrt(a³/muE) | physics.js: orbitElements |

Periapsis and apoapsis are distances from Earth's center, not surface altitudes. Unbound/parabolic apoapsis and period are null. Earth elements are osculating two-body estimates; lunar perturbations and later thrust change them. The Earth-centered acceleration subtracts the Moon's pull on Earth. Its corresponding indirect potential is needed so -grad(U) agrees with acceleration.

Energy outputs kinetic, potential and total are in joules for current spacecraft mass; specific is in J/kg. The prescribed moving Moon makes the potential time-dependent, so spacecraft mechanical energy need not be conserved. Fuel/exhaust exchanges also prevent conservation during burns. Only the Earth-only, unpowered test asserts energy conservation.

## Step algorithm

1. Validate state, configuration, controls, positive elapsed time and method.
2. Clamp throttle to [0,1]. Hold inertial heading fixed across this call.
3. Subdivide elapsed time: <=1 s for coasting, <=0.25 s for powered flight by default. Shorten a powered substep to the exact fuel-exhaustion time when necessary.
4. Advance with velocity Verlet or RK4. Verlet evaluates acceleration at both endpoint positions, times and masses. RK4 evaluates position, moving Moon and mass at every intermediate stage.
5. Add the ideal rocket-equation thrust delta-v used, update fuel, then coast after exhaustion. Return a new state without changing inputs.

Velocity Verlet is second order for this position/time-dependent acceleration; with thrust its endpoint evaluations account for changing mass. It is not being claimed to conserve energy exactly, or to be symplectic for the full powered time-dependent model. RK4 is fourth order for smooth segments. Exhaustion is a separate segment boundary.

## Use

```js
import { ORBIT_CONFIG } from './src/orbital/config.js';
import { createOrbitState, stepOrbit, orbitElements } from './src/orbital/physics.js';

let state = createOrbitState();
state = stepOrbit(state, { throttle: 0, heading: 0 }, ORBIT_CONFIG, 1, 'verlet');
console.log(orbitElements(state));
```

Run npm test from the project root. Existing package scripts discover both test files. The test report uses deliberately coarser 10 s coast substeps for its ten-orbit comparison; the normal default is 1 s. See orbital-validation.txt for measured output.

## Limitations and next checkpoint

The engine uses point masses, a planar prescribed Moon orbit, no atmosphere, constant Isp, no staging and no rotational torque. It starts in LEO, not on Earth's surface. The default phase is deterministic, not a real-date ephemeris. Variable vehicle settings are supported by the computational configuration; browser sliders come with the mission UI.

This API synchronously integrates the requested simulation duration. A browser must budget work per animation frame, cap thrust warp at 10x, and reduce coast warp near encounters. Never pass an arbitrarily large backlog directly into stepOrbit. Impact detection, event interpolation and warp scheduling are now implemented in the mission wrapper and flight display; see flight-controls.md. The numerical engine does not stop at surfaces; it throws at a point-mass center. The flight loop must stop surface crossings before singularities become reachable.

The 4.044 km/s ideal budget leaves limited maneuver margin. A finite-burn flyby preset is now verified end-to-end; see flyby-preset.md. Captured-orbit claims will need more than a negative Moon-relative energy snapshot. A flyby outcome is implemented; no Mars model or capture outcome is included.

## References

[NASA ideal rocket equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/), [Tudat third-body acceleration](https://docs.tudat.space/en/stable/user-guide/state-propagation/propagation-setup/translational/third-body-acceleration.html), [NASA orbital trajectories](https://science.nasa.gov/learn/basics-of-space-flight/chapter4-1/), [NASA orbital elements](https://science.nasa.gov/learn/basics-of-space-flight/chapter5-1/).

