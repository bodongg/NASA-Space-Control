# Earth launch to Moon landing — 2026-10-19

## Demonstrate the whole journey

The user chose calculated launch with automatic guidance. The default **Earth launch → Moon** begins on an equatorial Earth pad at mission t=0. Select **Launch mission** and keep automatic guidance enabled. The same integrated position, velocity, time and propellant continue through lift-off, ascent, staging, 400km orbit insertion, the actual450s departure burn, lunar coast, braking and safe surface contact.

Use **Enter fullscreen** or **Expand view**; **P** pauses/resumes, **H** hides secondary controls, **F** toggles presentation and **Escape** exits. Pause/exit stay accessible. The map and illustrated views share the mission. Starting-point alternatives retain post-departure landing, original flyby and manual Earth-orbit practice for shorter experiments. Turning guidance off retains manual controls and does not guarantee recovery. Reset/restart intentionally creates a new stack and archives meaningful prior data.

The sky/cloud/curved-horizon view follows calculated altitude. Visible layer labels use approximate teaching boundaries: troposphere0–12km, stratosphere12–50km, mesosphere50–85km, thermosphere85–600km and exosphere above600km. The100km conventional space boundary lies inside the thermosphere; the atmosphere has no sharp outer edge. NASA sources: [Earth atmosphere](https://science.nasa.gov/earth/earth-atmosphere/earths-atmosphere-a-multi-layered-cake/) and [atmospheric layers animation](https://svs.gsfc.nasa.gov/20405/). Scenery planets remain illustrative; the dynamic model is Earth–Moon within the solar system.

## Launch vehicle

| Component | Dry kg | Initial propellant kg | Thrust N | Isp s |
| --- | ---: | ---: | ---: | ---: |
| Booster |25,000|400,000|7,000,000|300|
| Upper stage |8,000|100,000|1,200,000|450|
| Lunar spacecraft |4,000|16,000|100,000|450|

Total initial attached mass553,000kg; all516,000kg of propellant is already aboard. State fuel is total attached propellant, with lower stages prevented from consuming later tanks. Booster separates at exhaustion. Upper stage separates after the actual insertion conditions are met, discarding its dry mass and unused reserve explicitly. Events preserve position, velocity and time, while recording before/after mass and discarded fuel. The lunar spacecraft is never refilled. Its actual450s prograde burn then begins from the achieved orbital state.

## Equations and guidance

Shared orbital acceleration now optionally adds drag:

    a = aEarth + aMoon,differential + (T/m) heading + aDrag
    rho = 1.225 exp(-max(0,h)/8500) kg/m3
    vRel = v - omegaEarth × r
    aDrag = -0.5 rho CdA |vRel| vRel / m
    q = 0.5 rho |vRel|²

CdA=15m² and omegaEarth=7.2921159e-5rad/s. Initial inertial surface velocity is about464.58m/s; surface-relative speed is zero. Density decreases with altitude for every launch stage; stage separation cannot remove drag in dense air. Pad reaction constrains the vehicle until net outward lift, while commanded thrust can still burn propellant.

The ascent controller resolves Earth-relative radial/tangential motion. It targets400km altitude, limits outward speed and builds tangential velocity toward sqrt(mu/(R+400km)). Insertion requires altitude error<1m and radial/tangential speed errors<0.01m/s. Heading and throttle are recomputed at≤0.25s. The original circular-Moon launch window is calibrated before flight (initial lunar phase4.4089078791875185rad); no live state is rotated or replaced.

Guided warp caps5× below10km,20× below200km,50× during upper insertion and100× during departure. Coast/lunar warp uses the prior bounded landing scheduler; physics substeps remain bounded. Manual powered flight retains lower safety caps. The browser discards stalled/background time instead of integrating a giant backlog.

After departure, the same lunar relative-motion controller brakes and lands. Safe swept surface contact still requires |vertical|≤2m/s, |sideways|≤1m/s, tilt≤10°. Incoming contact evidence is retained before terminal Moon-relative rest. Unsafe contact remains an impact; terminal missions freeze.

## Data and validation

Samples retain active stage, atmospheric layer/density/dynamic pressure, signed Earth-relative velocities and Moon-relative velocities. Initial stack configuration and stage events stay in the record. Propellant burned = initial propellant − remaining propellant − explicitly discarded reserve. Discarded dry mass is separate. CSV and Markdown include these distinctions. Ideal staged delta-v sums each attached stage's ideal rocket equation assuming all remaining propellant can be burned; it is an upper estimate, because the upper-stage reserve may instead be discarded. Earth-centered energy charts track the attached vehicle, excluding discarded hardware/exhaust.

Current113 tests pass and production build succeeds. The variable-frame numerical whole journey landed at t225096.697864s with411.01846kg fuel, incoming vertical−0.298313m/s, negligible sideways motion and tilt. Both stage transitions preserve physical state. Numerical CSV/report/results are in docs/evidence/earth-launch*.

The actual production browser run independently began at t0 and reached lunar contact at **2d14:31:34**, showing0.30m/s incoming speed and411kg fuel. It auto-paused and saved. Report: initial553,000kg; burned511,034kg (rounded); discarded unburned reserve4,554.9kg; discarded dry33,000kg; touchdown−0.297m/s vertical,0.000m/s sideways,0.001° tilt,411.0kg fuel. Small differences from fixed/variable-step probes are expected from frame-sized partial steps.

Independent code/data review found and verified fixes for nonlifting pad support through staging, pad closest approach, drag after early manual staging, staged delta-v and co-rotating pad display. Full-record save/reload/CSV/report and fuel conservation passed. Root browser demonstrated paused state preservation at t00:06:01 /176km /63,531kg across map/flight/expanded/native fullscreen. Native1536×864, desktop1280×900, user714×668 and phone390×844 checks are captured; no horizontal page overflow or console warnings/errors in the checked session. Evidence details: earth-launch-validation.txt.

## Limits

Planar point mass; prescribed circular Moon; equatorial rotating atmosphere with a single exponential density curve and constant drag area; idealized immediate stage separation and direct attitude. Engine throttle is continuously variable down to very small values near insertion. Engine minimum throttle, structural/thermal loads, winds, detailed aerodynamics, plume scale, launch tower dynamics and geographic terrain are omitted. The result is an educational model, not a flight-qualified launch vehicle. Layer boundaries and camera/artwork scale are illustrative. Classroom hardware/projector/offline rehearsal and student interpretation/team reflection remain required. No new destination,3D, backend or sound was added.
