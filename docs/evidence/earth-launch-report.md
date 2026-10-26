# Mission Control — flight report

Generated: 2026-10-19T14:54:11.898Z

## Recorded flight

- Starting mode: Earth launch through atmosphere to lunar landing
- Outcome: Landed safely
- Recorded mission interval: 0 to 225096.69786441044 s
- Duration since loaded start: 225096.69786441044 s
- Segment ideal thrust delta-v used: 16492.403628708118 m/s
- Segment fuel used: 511030.6845638929 kg
- Closest Moon surface altitude during recording: 0 m
- Samples: 1113

## Measured surface contact

- Incoming vertical speed (outward positive): -0.29831347384195595 m/s
- Incoming tangential speed: 0.000007418848789159105 m/s
- Incoming Moon-relative speed: 0.29831347393420676 m/s
- Touchdown tilt: 0.0006765485149820787 degrees
- Fuel remaining at contact: 411.01846023358445 kg

These are incoming contact values, retained before the landed state rests relative to the Moon.


## Launch vehicle and atmospheric drag

- Booster: dry mass 25000 kg; propellant 400000 kg; thrust 7000000 N; Isp 300 s
- Upper stage: dry mass 8000 kg; propellant 100000 kg; thrust 1200000 N; Isp 450 s
- Lunar spacecraft: dry mass 4000 kg; propellant 16000 kg; thrust 100000 N; Isp 450 s

- Discarded propellant (not burned): 4558.29697587352 kg
- Discarded stage dry mass: 33000 kg

Drag opposes atmosphere-relative motion: aDrag = -0.5 rho CdA |vrel| vrel / m. Density uses a simplified exponential scale height8500 m, sea-level1.225 kg/m3; CdA15m2. The atmosphere rotates with Earth. Layer labels use approximate educational boundaries;100 km is a conventional space boundary within the thermosphere. All ascent, insertion and departure burns occur within this recording; separation changes attached mass but not position, velocity or time. Ideal staged delta-v assumes all attached propellant can be burned; upper-stage reserve may instead be explicitly discarded.

## Initial recorded setup

- Dry mass: 37000 kg
- Initial vehicle fuel setting: 516000 kg
- Recorded initial mass: 553000 kg
- Maximum thrust: 7000000 N
- Specific impulse: 300 s
- Moon initial phase: 4.4089078791875185 rad

## Concepts and algorithm

2D Newtonian gravitation and thrust: a = aEarth + aMoon,differential + T/m × heading. Fuel flow = T/(Isp × g0); remaining ideal delta-v = Isp × g0 × ln(m/mdry). Velocity Verlet advances position and velocity, with <=1 s coasting, <=0.25 s powered steps and a split at fuel exhaustion. Surface events use swept moving-body chords.

Guidance resolves Moon-relative radial and tangential motion, accounts for the moving Moon acceleration and recomputes at <=0.25 s during approach and descent. Safe landing requires physical swept lunar contact, absolute radial speed <=2 m/s, tangential speed <=1 m/s and tilt <=10 degrees. Hard contact remains an impact. The lunar spacecraft uses a fixed 4000 kg dry / 16000 kg initial-fuel / 100000 N / 450 s Isp vehicle, carried by booster stages for a full Earth launch.

## Interpretation and limitations

The moving prescribed Moon makes spacecraft mechanical energy time-dependent; fuel/exhaust exchanges also affect energy. Earth-only unpowered tests validate conservation separately. This recording includes lift-off, ascent, staging, departure and the lunar journey. Propellant burned excludes explicitly discarded residual fuel; both quantities are reported. The engine-off coast forecast excludes future guidance burns and is an approximate snapshot. It is not a landing forecast. Earth-centered chart speeds differ from Moon-relative descent and contact speeds. The simulation is planar, uses a circular prescribed Moon, point masses, constant Isp with simplified atmospheric drag and idealized instantaneous stage separation. Torque, heating, winds and launch aerodynamics beyond drag are not modeled.

## Reproduce and validate

Run npm test and npm run build in the project. See docs/orbital-physics.md and docs/report-outline.md. Export the CSV with this report and add a screenshot of the actual run.

## Student reflection

Explain your burn choices, what changed in the graphs, discrepancies from the forecast, team contributions and possible improvements.
