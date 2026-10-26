# Earth surface to Moon — calculated launch design

## Approved intent

2026-10-19: user wants the rocket to come from Earth, climb through the atmosphere into space and travel to the Moon. User explicitly selected **Calculated launch with automatic guidance** over a cinematic introduction. Extend the existing NASA-inspired 2D flight and continuous lunar landing. No 3D, backend or extra destination is requested.

## Experience

The default start is a rocket on an Earth launch pad. Launch mission starts actual thrust and propellant flow. Camera follows ascent from coastal ground/blue sky/clouds through fading blue atmosphere to the curved Earth, then the existing starfield/Earth–Moon scene. Labels show actual altitude, Earth-relative vertical/sideways speed and the current atmospheric layer; small milestone notices identify stage separation, orbit insertion, departure and100km conventional space boundary. Clouds disappear above the lower atmosphere; distant planets appear only as existing illustrative space scenery.

Atmosphere has five primary display layers: troposphere below12km, stratosphere12–50km, mesosphere50–85km, thermosphere85–600km, exosphere above600km (gradually fading). These are approximate teaching thresholds.100km is a conventional space boundary within the thermosphere, not the end of the atmosphere. Sources: NASA Science Earth atmosphere multi-layered cake and NASA SVS Carruthers Atmospheric Layers Animation. Density for drag is a deliberately simplified exponential model rather than measured layer chemistry/temperature.

Fullscreen, expanded view, pause/resume/exit, keyboard focus, reduced motion, map and state preservation remain. Guidance on by default, explicit manual override. Existing post-departure landing, flyby and LEO starts remain available for short demonstrations and experiments.

## Physics and continuity

A staged launch vehicle carries the existing20t lunar spacecraft. The current100kN lunar engine cannot lift20t from Earth. Booster dry mass, propellant, thrust and Isp are documented fixed model parameters; a numerical feasibility probe selects a tested configuration. Choose launch longitude and lunar phase as the launch window before simulation. Never rotate or replace a live state to match an old preset.

Integrate actual position, velocity, time and total attached propellant from pad through insertion, finite departure burn, lunar coast, braking and contact. Include central Earth gravity, differential moving-Moon gravity, thrust and atmospheric drag relative to a declared rotating/nonrotating atmosphere. Use ≤0.25s ascent/guidance steps (smaller when necessary), bounded warp and fuel-exhaustion splits. State.fuelMass counts fuel across attached stages so staging never refills a tank. Stage changes explicitly discard dry/residual mass with a dated event; position/velocity/time are unchanged. Thrust and Isp change to the active stage. No fabricated orbit insertion or guaranteed landing classification.

After the actual departure burn, reuse lunarLandingGuidance and advanceLunarLanding with the actual state/config. Safe surface contact remains |vertical|≤2m/s, |tangent|≤1m/s, tilt≤10deg through swept collision. Retain incoming contact evidence. Manual trajectory errors remain errors; no rescue teleport.

## Interfaces and ownership

- src/orbital/earthLaunch.js: createEarthLaunchMission(), earthLaunchDiagnostics(mission), earthLaunchGuidance(mission), advanceEarthLaunch(mission,manualControls,seconds,{guided=true}={}), earthLaunchWarp(mission,effectiveControls,requested,guided=true). Returns the existing mission shape with preset='launch', additional launch metadata and stage-event history. Phase strings explicitly identify ascent/insertion/parking/departure/transfer/lunar phases.
- src/orbital/atmosphere.js: atmosphereAt(altitude) for density and layer, atmosphere-relative drag acceleration; optional shared physics acceleration integrates drag only when config.atmosphere.enabled. Existing no-atmosphere cases remain bitwise/numerically unchanged.
- src/render/earthAscent.js: Earth-local projection accepting frame.launch {altitude,verticalSpeed,horizontalSpeed,radialAngle,atmosphereLayer,phase,stage,padAltitude}. Camera-only changes. Existing renderer provides shared rocket/Earth/space images and optional launch landscape.
- OrbitalFlight.js: dispatch preset launch vs existing mission wrappers; display true active vehicle/guidance and proper frame/readouts. No recreated simulation on view change.
- telemetry/runStore/MissionWorkbench: accept launch and phases; actual stage-dependent mass, propellant and incoming touchdown evidence. Report initial stack plus stage model, launch phase and drag assumptions. Preserve old saved records. Coast forecast explicitly excludes ascent/departure/guidance burns.

## Validation and delivery

TDD covers lift-off/TWR, drag direction and density, layer thresholds, staged mass continuity, real insertion/departure, complete pad-to-contact run, manual failure, warp, input immutability and terminal freeze. Renderer checks projection at pad/cloud/space boundaries, heading/flame, phone clearance and no state mutation. Existing85 tests stay green. Browser ordinary default launch must actually reach landed, preserve pause/view/fullscreen and record/export correctly. Bounded desktop/phone pass, one defect batch, at most one confirmation pass. Save evidence, update PRODUCT/DESIGN/sidecar/guides and dated Obsidian memory. Classroom hardware rehearsal and student reflection remain separate human steps.

## Review/rulings

- Physical guided launch is approved; routine stage constants and exact launch-window shooting are implementation decisions tested numerically.
- Solar-system appearance uses the existing illustrative backdrop. The dynamically modeled destination remains the Moon, which is within the solar system. No other planet exerts a new force.
- Actual app is Desktop/rocket-landing, outside writable workspace. Stage files in Physics/.work/earth-launch; use exact authorized escalated writes. No Git repository: no commits/worktrees; keep scratch probes as evidence.
