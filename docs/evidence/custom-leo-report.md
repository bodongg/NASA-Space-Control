# Mission Control — flight report

Generated: 2026-10-18T13:37:40.911Z

## Recorded flight

- Starting mode: Low Earth orbit
- Outcome: In progress
- Recorded mission interval: 0 to 411.29599999999687 s
- Duration since loaded start: 411.29599999999687 s
- Segment ideal thrust delta-v used: 3779.3281920138497 m/s
- Segment fuel used: 4660.057772588883 kg
- Closest Moon surface altitude during recording: 375892000 m
- Samples: 8

## Setup

- Dry mass: 2100 kg
- Initial vehicle fuel setting: 6000 kg
- Recorded initial mass: 8100 kg
- Maximum thrust: 50000 N
- Specific impulse: 450 s
- Moon initial phase: 0 rad

## Concepts and algorithm

2D Newtonian gravitation and thrust: a = aEarth + aMoon,differential + T/m × heading. Fuel flow = T/(Isp × g0); remaining ideal delta-v = Isp × g0 × ln(m/mdry). Velocity Verlet advances position and velocity, with <=1 s coasting, <=0.25 s powered steps and a split at fuel exhaustion. Surface events use swept moving-body chords.

## Interpretation and limitations

The moving prescribed Moon makes spacecraft mechanical energy time-dependent; fuel/exhaust exchanges also affect energy. Earth-only unpowered tests validate conservation separately. The postburn preset's departure fuel and delta-v are excluded from this segment summary. Forecasts assume engine-off coasting and are approximate snapshots. The simulation is planar, uses a circular prescribed Moon, point masses, constant Isp and no atmosphere, launch, staging or torque. Flyby success is entry within 20,000 km lunar altitude; gameplay stops before the later closest approach. It does not demonstrate lunar capture.

## Reproduce and validate

Run npm test and npm run build in the project. See docs/orbital-physics.md, docs/flyby-preset.md and docs/report-outline.md. Export the CSV with this report and add a screenshot of the actual run.

## Student reflection

Explain your burn choices, what changed in the graphs, discrepancies from the forecast, team contributions and possible improvements.
