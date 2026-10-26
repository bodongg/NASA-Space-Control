# Mission Control — flight report

Generated: 2026-10-19T14:17:41.043Z

## Recorded flight

- Starting mode: Lunar landing (450 s departure burn already completed)
- Outcome: Landed safely
- Recorded mission interval: 450 to 223096.48983925307 s
- Duration since loaded start: 222646.48983925307 s
- Segment ideal thrust delta-v used: 3520.4842473703843 m/s
- Segment fuel used: 5388.236641746425 kg
- Closest Moon surface altitude during recording: 0 m
- Samples: 1073

## Measured surface contact

- Incoming vertical speed (outward positive): -0.2999961634834056 m/s
- Incoming tangential speed: 0.000007276278701007222 m/s
- Incoming Moon-relative speed: 0.2999961635716471 m/s
- Touchdown tilt: 0.0007915808040589709 degrees
- Fuel remaining at contact: 414.60122847411185 kg

These are incoming contact values, retained before the landed state rests relative to the Moon.

## Setup

- Dry mass: 4000 kg
- Initial vehicle fuel setting: 16000 kg
- Recorded initial mass: 9802.837870220537 kg
- Maximum thrust: 100000 N
- Specific impulse: 450 s
- Moon initial phase: 2.6 rad

## Concepts and algorithm

2D Newtonian gravitation and thrust: a = aEarth + aMoon,differential + T/m × heading. Fuel flow = T/(Isp × g0); remaining ideal delta-v = Isp × g0 × ln(m/mdry). Velocity Verlet advances position and velocity, with <=1 s coasting, <=0.25 s powered steps and a split at fuel exhaustion. Surface events use swept moving-body chords.

Guidance resolves Moon-relative radial and tangential motion, accounts for the moving Moon acceleration and recomputes at <=0.25 s during approach and descent. Safe landing requires physical swept lunar contact, absolute radial speed <=2 m/s, tangential speed <=1 m/s and tilt <=10 degrees. Hard contact remains an impact. The landing preset uses a fixed 4000 kg dry / 16000 kg initial-fuel / 100000 N / 450 s Isp vehicle.

## Interpretation and limitations

The moving prescribed Moon makes spacecraft mechanical energy time-dependent; fuel/exhaust exchanges also affect energy. Earth-only unpowered tests validate conservation separately. The postburn preset's departure fuel and delta-v are excluded from this segment summary. The engine-off coast forecast excludes future guidance burns and is an approximate snapshot. It is not a landing forecast. Earth-centered chart speeds differ from Moon-relative descent and contact speeds. The simulation is planar, uses a circular prescribed Moon, point masses, constant Isp and no atmosphere, launch, staging or torque.

## Reproduce and validate

Run npm test and npm run build in the project. See docs/orbital-physics.md and docs/report-outline.md. Export the CSV with this report and add a screenshot of the actual run.

## Student reflection

Explain your burn choices, what changed in the graphs, discrepancies from the forecast, team contributions and possible improvements.
