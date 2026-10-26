# Checkpoint 3 data and prediction

Implemented 2026-10-18. No dependencies added. All numerical state, samples, and exports use SI units. The existing Verlet engine and swept moving-body surface/lost guards remain the source of flight behavior.

## Prediction

`predictTrajectory(state, config, options = {})` in `src/orbital/trajectory.js` returns `{ points, closest, endStatus, horizon, step }`. Points contain absolute mission `time` in seconds and Earth-centered `x/y` in metres. `closest` also contains lunar surface `altitude` in metres, sampled at each integration endpoint.

Defaults: 259200-second forecast, 600-second display sampling, one-second integration. Requested step is limited to 0.1-1 seconds; horizon must be positive and no greater than seven days. Initial/final points are retained. This is a zero-throttle forecast: fuel and ideal delta-v do not change, current throttle and future commands are not predicted, and input state/configuration remain unchanged.

`advanceMission(..., { stopAtFlyby: false })` continues past the 20000-km objective while retaining surface and one-billion-metre lost guards. Default gameplay behavior is unchanged. Forecasts always start their own active coast from the supplied state; they do not need a mutable game mission.

Run `trajectoryWorker.js` as a module worker. Request `{ id, state, config, options }`; response `{ id, result }` or `{ id, error }`. Use the ID to discard stale results after a reset/configuration change. Schedule forecasts outside the render loop. The three-day real departure forecast took approximately 0.85 seconds in the Node validation run, so a main-thread forecast would visibly block the page.

## Vehicle configuration

`createMission('leo', vehicleOverrides)` accepts only `dryMass`, `fuelMass`, `maxThrust`, and `specificImpulse`. The existing physics validation rejects nonfinite values, nonpositive dry mass/Isp, and negative fuel/thrust. The verified transfer rejects all nonempty overrides. Default calls preserve both presets.

## Recording and CSV

`createFlightRecord(mission)` starts `{ id, preset, config, startedAt, initialTime, samples }`; `appendTelemetry(record, mission, force = false)` returns an updated record after at least 60 simulation seconds, an explicit force, or a terminal outcome. Duplicate time/status updates are ignored. When the limit of 2500 samples is exceeded, alternate historical points are removed while retaining the first and latest points. Times remain explicit for charts after decimation; sample spacing must not be assumed constant.

Samples contain time, position, velocity, speed, Earth/Moon altitude, running closest lunar altitude, propellant/current mass, ideal delta-v used/remaining, kinetic/potential/total energy, specific energy, and mission status. Heading/thrust use Earth-centered inertial axes. Energy includes the existing differential lunar indirect potential; the moving Moon and burns mean total mechanical energy need not be conserved.

`summarizeRun(record)` reports status, elapsed duration, absolute mission time, delta-v used, fuel used, closest altitude, initial/final mass, and sample count. Duration, fuel used, and delta-v used subtract the first recorded sample. The transfer begins after its departure burn at mission time 450 seconds with 901.418935 kg propellant and 3146.729982 m/s prior ideal delta-v. That prior burn is intentionally excluded from the recorded flight's usage summary.

`telemetryCsv(record)` includes metadata rows beginning with `#,`, followed by SI column headers, elapsed time from recording start, and absolute mission time. String metadata is CSV-quoted when needed and spreadsheet formula prefixes are escaped. Numeric negative velocity and energy remain numeric. For numerical import, skip metadata rows before `elapsed_time_s`.

## Saved runs

`saveFlightRecord(record, storage?)` returns `{ ok, message }`. `loadFlightRecords(storage?)` returns valid records newest first. The browser's localStorage is resolved inside each call; unavailable storage, privacy exceptions, quota errors, invalid JSON, invalid records, and excessive payloads fail safely. At most three runs are kept; saving an existing ID replaces that entry. Node tests inject a minimal string storage implementation. Stored strings must be rendered with text content by callers.

## Verification

`node --test src/tests/*.test.js`: 52/52 passing, comprising the original 37 tests and 15 new tests. New coverage includes custom-vehicle fuel/rocket-equation physics, circular-orbit return, actual transfer closest approach, coast impact/lost guards and initial overlap, invalid/incomplete forecast inputs, worker correlation/errors, immutable and decimated telemetry, postburn-relative summaries, SI CSV values and metadata safety, three-run retention, corrupt storage, and quota failures.

Actual transfer forecast: closest lunar altitude **3523661.525 m** at absolute mission time **224228 s**; three-day end remains active and outside both surfaces. Existing gameplay flyby threshold remains approximately **209879 s**, before physical closest approach.
