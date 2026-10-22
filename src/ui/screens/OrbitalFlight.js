import '../../orbital-flight.css';
import { createMission, advanceMission, safeWarp } from '../../orbital/mission.js';
import { createLunarLandingMission, lunarLandingDiagnostics, lunarLandingGuidance, advanceLunarLanding, lunarLandingWarp } from '../../orbital/lunarLanding.js';
import { createEarthLaunchMission, earthLaunchDiagnostics, earthLaunchGuidance, advanceEarthLaunch, earthLaunchWarp } from '../../orbital/earthLaunch.js';
import { moonState } from '../../orbital/bodies.js';
import { orbitElements, remainingDeltaV } from '../../orbital/physics.js';
import { createOrbitalMap } from '../../render/orbitalMap.js';
import { Button } from '../components/Button.js';
import { Slider } from '../components/Slider.js';
import { Readout } from '../components/Readout.js';
import { createMissionWorkbench } from '../MissionWorkbench.js';
import { createPresentationController } from '../presentation.js';
import '../../flight-presentation.css';

const degrees = (radians) => ((radians * 180 / Math.PI + 540) % 360) - 180;
const number = (value, places = 0) => Number.isFinite(value)
  ? value.toLocaleString('en-US', { minimumFractionDigits: places, maximumFractionDigits: places }) : '—';
const clock = (seconds) => {
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 86400)}d ${[Math.floor(whole / 3600) % 24, Math.floor(whole / 60) % 60, whole % 60].map(v => String(v).padStart(2, '0')).join(':')}`;
};

export function mountFlight(app) {
  document.title = 'Earth to Moon — Mission Control';
  app.innerHTML = `
    <a class="skip-flight" href="#flight-controls">Skip to flight controls</a>
    <header class="site-header" id="top"><div class="header-inner">
      <a class="project-brand" href="/">Mission Control<span>Earth–Moon Transfer</span></a>
      <a class="nasa-brand" href="https://www.nasa.gov/" target="_blank" rel="noopener noreferrer" aria-label="NASA reference website"><img src="/images/nasa-logo.svg" alt="NASA" width="64" height="64"></a>
      <nav class="header-nav" aria-label="Project navigation"><a href="#flight-analysis">Analysis</a><a href="?view=landing">Landing lab</a></nav>
    </div></header>
    <main class="orbital-page">
      <section class="flight-intro flight-shell" aria-labelledby="flight-title">
        <div><h1 id="flight-title">Earth to Moon.</h1><p>Launch from Earth. Climb through the atmosphere, build orbital speed, then follow the guided journey to a calculated Moon landing.</p></div>
        <a class="flight-guide-link" href="#live-physics">Explore the physics & analysis <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>
      </section>
      <section class="flight-shell flight-workspace" aria-label="Orbital flight simulator">
        <div class="flight-topbar"><div class="clock-group"><span>Mission time</span><strong id="mission-clock">0d 00:00:00</strong><span id="flight-state">Paused</span></div><div id="run-controls" class="flight-run-controls"></div></div>
        <div class="flight-map-column">
          <div class="map-toolbar"><div class="scene-mode-switch" id="scene-mode-switch"></div><label for="camera-follow">Camera</label><select id="camera-follow"><option value="ship">Spacecraft</option><option value="earth">Earth</option><option value="moon">Moon</option></select><span id="zoom-level">1×</span><div id="zoom-controls" class="zoom-controls"></div></div>
          <div class="orbital-map-wrap flight-stage" id="flight-stage">
            <canvas id="orbital-map" tabindex="0" aria-label="Illustrated rocket flight with Earth and Moon. Actual motion follows the numerical physics model; planet artwork is enlarged and background planets are illustrative. Switch to orbital map for the spatial overview."></canvas>
            <div class="scene-top scene-secondary"><div class="scene-identity"><img src="/images/nasa-logo.svg" alt="NASA design reference" width="44" height="44"><div><h2 id="scene-phase">Low Earth orbit</h2><p><span id="scene-clock">0d 00:00:00</span><span id="scene-status">Paused</span></p></div></div><span id="scene-assets" role="status">Loading flight imagery…</span></div>
            <div class="map-key scene-secondary"><span><i></i> Traveled path</span><span id="forecast-key" hidden><i class="forecast-key-line"></i> Coast forecast</span></div>
            <div id="scene-atmosphere" class="scene-atmosphere scene-secondary"><strong id="scene-layer">Troposphere</strong><span id="scene-ascent-values"></span></div><div class="scene-readouts scene-secondary"><div><span id="scene-speed-label">Moon-relative speed</span><strong id="scene-speed">7.673 <small>km/s</small></strong></div><div><span id="scene-altitude-label">Earth altitude</span><strong id="scene-moon">375,892 <small>km</small></strong></div><div><span>Fuel</span><strong id="scene-fuel">6,000 <small>kg</small></strong></div></div>
            <section class="presentation-controls scene-secondary" id="presentation-controls" aria-labelledby="presentation-controls-title"><h3 id="presentation-controls-title">Flight controls</h3><label class="guidance-switch" id="scene-guidance-wrap"><input type="checkbox" id="scene-guidance" checked> Automatic mission guidance</label><div id="presentation-engine"></div><div id="presentation-throttle"></div><div id="presentation-heading"></div><div class="presentation-directions" id="presentation-directions"></div><label for="presentation-warp">Time warp</label><select id="presentation-warp"><option value="1">1×</option><option value="10">10×</option><option value="100">100×</option><option value="1000">1,000×</option><option value="10000">10,000× · coast</option></select><p id="presentation-warp-note"></p><button type="button" id="presentation-demo" class="control-button control-button-secondary">Restart Moon mission</button><p>Starts a new guided Earth launch and lunar landing and saves your current meaningful run.</p></section>
            <div class="scene-toolbar"><button type="button" id="scene-pause" class="control-button control-button-primary">Start flight</button><button type="button" id="scene-view" class="control-button control-button-secondary">Orbital map</button><button type="button" id="scene-enter" class="control-button control-button-secondary">Enter fullscreen</button><button type="button" id="scene-hide" class="control-button control-button-secondary" hidden>Hide controls</button><button type="button" id="scene-exit" class="control-button control-button-secondary" hidden>Exit presentation</button></div>
            <p class="scene-scale-note">Illustrated scale · Earth–Moon physics<br>Scenery planets are illustrative.</p><span id="scene-shortcuts" class="scene-shortcuts">P pause · F fullscreen · H controls · Esc exit</span>
            <div id="scene-outcome" class="scene-outcome" role="status" hidden></div>
          </div>
          <div class="map-caption"><span id="view-caption">Illustrated flight; body artwork enhanced. Switch to map for physical overview.</span><span id="frame-rate">Paused</span></div>
          <div id="forecast-panel" class="forecast-panel"></div>
          <div id="mission-notice" class="mission-notice" role="status" aria-live="polite"></div>
          <dl class="orbital-readouts" id="orbital-readouts" aria-label="Live flight telemetry"></dl>
        </div>
        <aside class="flight-controls" id="flight-controls" aria-labelledby="controls-title">
          <h2 id="controls-title">Flight controls</h2>
          <div class="start-field"><label for="mission-preset">Starting point</label><div class="start-row"><select id="mission-preset"><option value="launch">Earth launch → Moon</option><option value="landing">Moon landing · post-departure</option><option value="transfer">Moon flyby · coast</option><option value="leo">Earth orbit · practice</option></select><button type="button" class="control-button control-button-secondary" id="load-start">Load start</button></div><p id="preset-note">400 km circular orbit. No departure burn has been made.</p></div>
          <div id="moon-recovery" hidden><div id="moon-start-action"></div><p>Starts a new guided Earth launch and lunar landing and saves your current meaningful run.</p></div>
          <label class="guidance-switch" id="guidance-wrap"><input type="checkbox" id="landing-guidance" checked> Automatic mission guidance</label><p id="guidance-note" class="heading-note"></p><div id="engine-controls" class="engine-controls"></div>
          <div id="throttle-control"></div><div id="heading-control"></div>
          <div class="direction-buttons" id="direction-buttons"></div>
          <p class="heading-note" id="heading-note"></p>
          <div class="warp-field"><label for="time-warp">Time warp</label><select id="time-warp"><option value="1">1× · real time</option><option value="10">10×</option><option value="100">100×</option><option value="1000">1,000×</option><option value="10000">10,000× · coast</option></select><p id="warp-note">High warp is for coasting. Thrust is capped at 10×.</p></div>
          <div class="vehicle-summary"><span>Vehicle</span><p id="active-vehicle"></p><a href="#vehicle-setup">Configure a new vehicle</a><br><a href="#flight-analysis">Report, graphs & exports</a></div>
        </aside>
      </section>
      <div id="mission-workbench" class="flight-shell"></div>
      <section id="flight-guide" class="flight-guide flight-shell" aria-labelledby="guide-title">
        <h2 id="guide-title">One journey. Pad to Moon.</h2><div class="guide-columns"><div><h3>Launch the full mission</h3><p>The page opens with <strong>Earth launch → Moon</strong> ready on the pad. Select <strong>Launch mission</strong>. Automatic guidance lifts the booster, climbs through the atmosphere and builds sideways velocity for a 400 km Earth orbit. Stage separation discards actual mass; propellant use follows thrust.</p><p>The lunar spacecraft then performs a calculated 450-second departure burn, coasts toward the Moon, brakes and lands. The same position, velocity, time and fuel continue throughout the journey. Camera changes only affect the picture.</p><p>Layer boundaries are approximate. The 100 km conventional space boundary is inside the thermosphere; the upper atmosphere continues above it. The solar-system backdrop is illustrative.</p></div><div><h3>Explore and present</h3><p>Keep guidance on for the classroom demonstration. Turn off <strong>Automatic mission guidance</strong> for manual experiments; recovery is not guaranteed. Flight/map/fullscreen share the same mission, and pause/exit remain accessible.</p><p>For shorter demonstrations, load <strong>Moon landing · post-departure</strong>, <strong>Moon flyby · coast</strong> or <strong>Earth orbit · practice</strong>. A safe touchdown requires vertical speed ≤2 m/s, sideways speed ≤1 m/s and tilt ≤10°.</p><p class="keyboard-guide"><kbd>Space</kbd> manual engine &nbsp; <kbd>P</kbd> pause &nbsp; <kbd>←</kbd> <kbd>→</kbd> manual heading<br>Shortcuts work when a form control is not focused.</p><p>Planar teaching model: simplified drag, idealized stages and direct attitude control. <a href="?view=landing">Preserved landing lab</a> · <a href="https://science.nasa.gov/earth/earth-atmosphere/earths-atmosphere-a-multi-layered-cake/" target="_blank" rel="noopener noreferrer">NASA atmosphere reference</a>.</p></div></div>
      </section>
    </main><footer class="page-footer"><div class="flight-shell flight-footer"><strong>Mission Control.</strong><p>An independent Physics 1 student simulation inspired by NASA. Not affiliated with or endorsed by NASA. NASA insignia and globe imagery credited to NASA; rocket and space backdrop are generated artwork.</p><div><a href="https://www.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA design reference</a><br><a href="/flight/credits.md">Flight artwork & credits</a></div></div></footer>`;

  const find = id => app.querySelector(`#${id}`);
  let mission = createEarthLaunchMission();
  let guided = true;
  let paused = true;
  let armed = false;
  let throttle = 100;
  let heading = Math.atan2(mission.state.vy, mission.state.vx);
  let direction = 'manual';
  let requestedWarp = 10000;
  let zoom = 1;
  let follow = 'ship';
  let viewMode = 'flight';
  let presentation;
  let presentationWasActive = false;
  let previousCamera;
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let sceneThrottleSlider;
  let sceneHeadingSlider;
  let sceneEngineButton;
  let error = '';
  let trail = [{ x: mission.state.x, y: mission.state.y }];
  let lastTrailTime = mission.state.time;
  let actualWarp = 0;
  let previousTime;
  let lastUiTime = 0;
  let frameId;
  let disposed = false;
  let cadenceStart;
  let cadenceFrames = 0;
  let workbench;
  let prediction = null;
  const map = createOrbitalMap(find('orbital-map'));
  const isLaunch = () => mission.preset === 'launch';
  const isLanding = () => isLaunch() || mission.preset === 'landing';
  const controls = () => isLanding() && guided ? isLaunch() ? earthLaunchGuidance(mission) : lunarLandingGuidance(mission) : { throttle: mission.status === 'active' && armed ? throttle / 100 : 0, heading: getHeading() };
  const allowedWarp = () => isLaunch() ? earthLaunchWarp(mission, controls(), requestedWarp, guided) : isLanding() ? lunarLandingWarp(mission, controls(), requestedWarp, guided) : safeWarp(mission, controls(), requestedWarp);
  const phaseLabels = { ascent: 'Earth launch', 'orbit-insertion': 'Building Earth orbit', 'parking-orbit': 'Earth orbit achieved', departure: 'Departure for the Moon', transfer: 'Earth–Moon transfer', approach: 'Lunar approach', braking: 'Lunar braking burn', descent: 'Powered descent', 'final-descent': 'Final lunar descent', landed: 'Lunar touchdown', crash: 'Flight ended' };
  function getHeading() {
    if (direction === 'manual') return heading;
    return Math.atan2(mission.state.vy, mission.state.vx) + (direction === 'retrograde' ? Math.PI : 0);
  }
  function setDirection(mode) { if (isLanding() && guided) return; direction = mode; update(); }
  function togglePause() {
    if (mission.status !== 'active' || error) return;
    paused = !paused;
    if (paused) workbench?.sample(mission, true);
    previousTime = undefined;
    update();
  }
  function toggleEngine() {
    if (mission.status !== 'active' || mission.state.fuelMass <= 0 || error || isLanding() && guided) return;
    armed = !armed;
    update();
  }
  const runButton = Button({ label: 'Start flight', onClick: togglePause });
  const resetButton = Button({ label: 'Reset flight', variant: 'secondary', onClick: () => load(mission.preset, mission.preset === 'leo' ? mission.config.vehicle : {}) });
  find('run-controls').append(runButton, resetButton);
  const moonStartButton = Button({ label: 'Start Moon mission', onClick: startMoonMission });
  find('moon-start-action').append(moonStartButton);
  const engineButton = Button({ label: 'Enable engine', variant: 'secondary', onClick: toggleEngine });
  engineButton.setAttribute('aria-pressed', 'false');
  find('engine-controls').append(engineButton);
  const throttleSlider = Slider({ id: 'flight-throttle', label: 'Throttle', min: 0, max: 100, value: throttle, unit: '%', onInput(value) { throttle = value; update(); } });
  const headingSlider = Slider({ id: 'flight-heading', label: 'Manual heading', min: -180, max: 180, value: 90, unit: '°', onInput(value) { heading = value * Math.PI / 180; direction = 'manual'; update(); } });
  find('throttle-control').append(throttleSlider.element);
  find('heading-control').append(headingSlider.element);
  const progradeButton = Button({ label: 'Prograde', variant: 'secondary', onClick: () => setDirection('prograde') });
  const retrogradeButton = Button({ label: 'Retrograde', variant: 'secondary', onClick: () => setDirection('retrograde') });
  find('direction-buttons').append(progradeButton, retrogradeButton);
  const flightViewButton = Button({ label: 'Flight view', variant: 'secondary', onClick: () => setView('flight') });
  const mapViewButton = Button({ label: 'Orbital map', variant: 'secondary', onClick: () => setView('map') });
  find('scene-mode-switch').append(flightViewButton, mapViewButton);
  function setView(mode) {
    viewMode = mode;
    follow = mode === 'flight' ? 'ship' : 'earth';
    zoom = 1;
    find('camera-follow').value = follow;
    update();
  }
  for (const [label, path, factor] of [['Zoom out', 'M5 12h14', 0.5], ['Zoom in', 'M5 12h14M12 5v14', 2]]) {
    const button = Button({ label, variant: 'secondary', onClick() { zoom = Math.max(1, Math.min(128, zoom * factor)); update(); } });
    button.setAttribute('aria-label', label);
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`;
    find('zoom-controls').append(button);
  }
  const overviewButton = Button({ label: 'Overview', variant: 'secondary', onClick() { setView('map'); } });
  find('zoom-controls').append(overviewButton);
  const measurements = [
    ['earthAltitude', 'Earth altitude', 'km'], ['speed', 'Earth-centered speed', 'km/s'],
    ['fuel', 'Fuel remaining', 'kg'], ['deltaV', 'Ideal delta-v left', 'km/s'],
    ['moonAltitude', 'Moon altitude', 'km'], ['closest', 'Closest Moon altitude', 'km'],
    ['periapsis', 'Earth periapsis altitude', 'km'], ['apoapsis', 'Earth apoapsis altitude', 'km'],
    ['vertical', 'Moon vertical speed · + up', 'm/s'], ['horizontal', 'Moon sideways speed', 'm/s'],
    ['earthVertical', 'Earth vertical speed · + up', 'm/s'], ['airPressure', 'Dynamic pressure', 'kPa'],
  ];
  const readouts = Object.fromEntries(measurements.map(([id, label, unit]) => {
    const readout = Readout({ label, unit, tone: 'neutral' });
    readout.element.id = `telemetry-${id}`;
    find('orbital-readouts').append(readout.element);
    return [id, readout];
  }));

  function load(preset, vehicleOverrides = {}) {
    mission = preset === 'launch' ? createEarthLaunchMission() : preset === 'landing' ? createLunarLandingMission() : createMission(preset, vehicleOverrides);
    guided = true;
    paused = true;
    armed = false;
    error = '';
    direction = 'manual';
    heading = Math.atan2(mission.state.vy, mission.state.vx);
    throttle = 100;
    throttleSlider.setValue(throttle);
    requestedWarp = preset === 'leo' ? 1 : 10000;
    find('time-warp').value = String(requestedWarp);
    find('mission-preset').value = preset;
    zoom = 1;
    follow = 'ship';
    viewMode = 'flight';
    find('camera-follow').value = follow;
    trail = [{ x: mission.state.x, y: mission.state.y }];
    lastTrailTime = mission.state.time;
    previousTime = undefined;
    actualWarp = 0;
    workbench?.reset(mission);
    update();
  }
  function startMoonMission() {
    load('launch');
    paused = false;
    previousTime = undefined;
    update();
  }
  function setGuidance(enabled) {
    if (!isLanding() || mission.status !== 'active') return;
    heading = controls().heading;
    guided = enabled; armed = false; direction = 'manual';
    update();
  }
  find('landing-guidance').addEventListener('change', event => setGuidance(event.target.checked));
  find('scene-guidance').addEventListener('change', event => setGuidance(event.target.checked));
  find('load-start').addEventListener('click', () => load(find('mission-preset').value));
  find('time-warp').addEventListener('change', event => { requestedWarp = Number(event.target.value); update(); });
  find('camera-follow').addEventListener('change', event => { follow = event.target.value; update(); });
  find('scene-pause').addEventListener('click', togglePause);
  const expandButton = Button({ label: 'Expand view', variant: 'secondary', onClick: () => void presentation.enter({ nativeFullscreen: false }) });
  expandButton.id = 'scene-expand';
  find('scene-enter').after(expandButton);
  find('scene-view').addEventListener('click', () => setView(viewMode === 'flight' ? 'map' : 'flight'));
  sceneEngineButton = Button({ label: 'Enable engine', variant: 'secondary', onClick: toggleEngine });
  find('presentation-engine').append(sceneEngineButton);
  sceneThrottleSlider = Slider({ id: 'scene-throttle', label: 'Throttle', min: 0, max: 100, value: throttle, unit: '%', onInput(value) { throttle = value; update(); } });
  sceneHeadingSlider = Slider({ id: 'scene-heading', label: 'Manual heading', min: -180, max: 180, value: 90, unit: '°', onInput(value) { heading = value * Math.PI / 180; direction = 'manual'; update(); } });
  find('presentation-throttle').append(sceneThrottleSlider.element);
  find('presentation-heading').append(sceneHeadingSlider.element);
  const scenePrograde = Button({ label: 'Prograde', variant: 'secondary', onClick: () => setDirection('prograde') });
  const sceneRetrograde = Button({ label: 'Retrograde', variant: 'secondary', onClick: () => setDirection('retrograde') });
  find('presentation-directions').append(scenePrograde, sceneRetrograde);
  find('presentation-warp').addEventListener('change', event => { requestedWarp = Number(event.target.value); find('time-warp').value = String(requestedWarp); update(); });
  find('presentation-demo').addEventListener('click', startMoonMission);
  presentation = createPresentationController({
    element: find('flight-stage'), enterButton: find('scene-enter'), exitButton: find('scene-exit'), hideButton: find('scene-hide'),
    onChange(state) {
      const entering = state.active && !presentationWasActive;
      if (state.active && !presentationWasActive) {
        previousCamera = { viewMode, follow, zoom };
        viewMode = 'flight'; follow = 'ship'; zoom = 1;
      } else if (!state.active && presentationWasActive && previousCamera) {
        ({ viewMode, follow, zoom } = previousCamera);
      }
      presentationWasActive = state.active;
      find('camera-follow').value = follow;
      find('scene-hide').textContent = state.controlsHidden ? 'Show controls' : 'Hide controls';
      find('flight-stage').dataset.nativeFullscreen = String(state.native);
      expandButton.hidden = state.active;
      find('flight-stage').setAttribute('role', state.active ? 'dialog' : 'region');
      find('flight-stage').setAttribute('aria-label', 'Earth–Moon flight presentation');
      if (state.active) find('flight-stage').setAttribute('aria-modal', 'true');
      else find('flight-stage').removeAttribute('aria-modal');
      update();
      if (entering) (find('scene-pause').disabled ? find('scene-exit') : find('scene-pause')).focus({ preventScroll: true });
    },
  });

  function update() {
    const { state, config } = mission;
    const terminal = mission.status !== 'active' || Boolean(error);
    const landing = isLanding();
    const automatic = landing && guided;
    const command = controls();
    const lunar = lunarLandingDiagnostics(mission);
    const launch = isLaunch() ? earthLaunchDiagnostics(mission) : null;
    const earthView = launch && ['ascent','orbit-insertion','parking-orbit','departure'].includes(mission.phase);
    const surfaceSpeed = launch ? Math.hypot(launch.verticalSpeed,launch.horizontalSpeed - (config.atmosphere?.rotationRate ?? 0) * (launch.altitude + config.earth.radius)) : 0;
    const phase = landing ? (terminal ? mission.phase : automatic ? command.phase : isLaunch() ? mission.phase : 'manual') : '';
    const powered = command.throttle > 0 && state.fuelMass > 0 && !terminal;
    const locked = terminal || automatic;
    for (const [id, wrap] of [['landing-guidance', 'guidance-wrap'], ['scene-guidance', 'scene-guidance-wrap']]) {
      find(wrap).hidden = !landing; find(id).checked = guided; find(id).disabled = terminal;
    }
    find('guidance-note').hidden = !landing;
    find('guidance-note').textContent = automatic ? 'Guidance controls heading and engine. Turn it off to fly manually.' : 'Manual control: guidance is off. Your commands determine the approach and landing.';
    const moon = moonState(state.time, config);
    const moonAltitude = Math.hypot(state.x - moon.x, state.y - moon.y) - config.moon.radius;
    const elements = orbitElements(state, config);
    find('mission-clock').textContent = clock(state.time);
    find('flight-state').textContent = terminal ? 'Mission ended' : paused ? 'Paused' : powered ? 'Powered flight' : 'Coasting';
    runButton.textContent = terminal ? 'Flight complete'
      : paused ? trail.length === 1 ? isLaunch() ? 'Launch mission' : mission.preset !== 'leo' ? 'Start Moon flight' : 'Start Earth orbit' : 'Resume flight' : 'Pause flight';
    runButton.disabled = terminal;
    find('scene-pause').textContent = runButton.textContent;
    find('scene-pause').disabled = terminal;
    find('scene-clock').textContent = clock(state.time);
    find('scene-status').textContent = find('flight-state').textContent;
    find('scene-phase').textContent = landing ? phaseLabels[phase] ?? 'Manual lunar flight' : mission.status === 'flyby' ? 'Lunar flyby achieved' : moonAltitude < 50_000_000 ? 'Lunar approach' : mission.preset === 'transfer' ? 'Earth–Moon transfer' : 'Earth orbit practice';
    find('scene-speed-label').textContent = earthView ? 'Surface-relative speed' : mission.touchdown ? 'Incoming contact speed' : landing ? 'Moon-relative speed' : 'Earth-centered speed';
    find('scene-speed').textContent = earthView ? `${number(surfaceSpeed, 1)} m/s` : landing ? `${number(mission.touchdown?.speed ?? lunar.speed, lunar.altitude < 10000 ? 2 : 0)} m/s` : `${number(Math.hypot(state.vx, state.vy) / 1000, 3)} km/s`;
    const sceneAltitude = earthView ? launch.altitude : moonAltitude;
    find('scene-altitude-label').textContent = earthView ? 'Earth altitude' : 'Moon altitude';
    find('scene-moon').textContent = sceneAltitude < 10000 ? `${number(Math.max(0, sceneAltitude), 1)} m` : `${number(sceneAltitude / 1000)} km`;
    const showAtmosphere = launch && launch.altitude < 10_000_000 && viewMode === 'flight';
    find('scene-atmosphere').hidden = !showAtmosphere;
    find('scene-layer').textContent = launch ? launch.atmosphereLayer[0].toUpperCase() + launch.atmosphereLayer.slice(1) : '';
    find('scene-ascent-values').textContent = launch ? `${launch.stageName} · vertical ${number(launch.verticalSpeed, 1)} m/s${launch.altitude >= 100000 ? ' · above 100 km space boundary' : ''}` : '';
    find('flight-stage').querySelector('.map-key').hidden = Boolean(earthView && viewMode === 'flight');
    find('scene-fuel').textContent = `${number(state.fuelMass)} kg`;
    find('scene-view').textContent = viewMode === 'flight' ? 'Orbital map' : 'Flight view';
    flightViewButton.setAttribute('aria-pressed', String(viewMode === 'flight'));
    mapViewButton.setAttribute('aria-pressed', String(viewMode === 'map'));
    find('flight-stage').dataset.viewMode = viewMode;
    find('flight-stage').dataset.phase = phase;
    find('flight-stage').dataset.status = mission.status;
    find('flight-stage').dataset.earthView = String(Boolean(earthView));
    find('flight-stage').dataset.launchStage = launch ? String(launch.stage) : '';
    const scaleNote = find('flight-stage').querySelector('.scene-scale-note');
    const scaleText = earthView && viewMode === 'flight' ? 'Calculated ascent · approximate atmosphere layers\nCamera scale and launch scenery are illustrative.' : landing && moonAltitude <= 2000 && viewMode === 'flight' ? 'Moon-local view · actual altitude and velocity\nTerrain is illustrative; ground contact is calculated.' : `${viewMode === 'map' ? 'Distances to scale · artwork enlarged' : 'Illustrated scale · Earth–Moon physics'}\nScenery planets are illustrative.`;
    if (scaleNote.textContent !== scaleText) scaleNote.textContent = scaleText;
    find('camera-follow').disabled = viewMode === 'flight';
    find('camera-follow').title = viewMode === 'flight' ? 'Flight view follows the spacecraft. Switch to orbital map to choose a body camera.' : 'Choose the map camera center';
    find('view-caption').textContent = viewMode === 'flight' ? 'Illustrated flight; body artwork enhanced. Map gives the physical overview.' : 'Map distances to scale; body artwork and rocket enlarged for visibility.';
    const assetStatus = map.getStatus();
    find('scene-assets').hidden = assetStatus.loaded === assetStatus.total;
    find('scene-assets').textContent = assetStatus.failed ? 'Some artwork could not load. Reload to restore it.' : `Loading flight imagery ${assetStatus.loaded}/${assetStatus.total}…`;
    engineButton.disabled = locked || state.fuelMass <= 0;
    engineButton.textContent = automatic && !terminal ? `Guidance · engine ${powered ? 'on' : 'off'}` : state.fuelMass <= 0 ? 'Fuel exhausted · coasting' : armed ? 'Disable engine' : 'Enable engine';
    engineButton.setAttribute('aria-pressed', String(powered));
    sceneEngineButton.disabled = engineButton.disabled;
    sceneEngineButton.textContent = engineButton.textContent;
    sceneEngineButton.setAttribute('aria-pressed', String(powered));
    for (const button of [progradeButton, retrogradeButton]) button.disabled = locked;
    progradeButton.setAttribute('aria-pressed', String(direction === 'prograde'));
    retrogradeButton.setAttribute('aria-pressed', String(direction === 'retrograde'));
    throttleSlider.input.disabled = locked;
    headingSlider.input.disabled = locked;
    headingSlider.setValue(Math.round(degrees(command.heading)));
    throttleSlider.setValue(automatic ? Math.round(command.throttle * 100) : throttle);
    sceneThrottleSlider.setValue(automatic ? Math.round(command.throttle * 100) : throttle);
    sceneHeadingSlider.setValue(Math.round(degrees(command.heading)));
    sceneThrottleSlider.input.disabled = locked;
    sceneHeadingSlider.input.disabled = locked;
    scenePrograde.disabled = locked;
    sceneRetrograde.disabled = locked;
    scenePrograde.setAttribute('aria-pressed', String(direction === 'prograde'));
    sceneRetrograde.setAttribute('aria-pressed', String(direction === 'retrograde'));
    find('heading-note').textContent = automatic ? `Guided heading · ${number(degrees(command.heading), 1)}° from +x · ${number(command.throttle * 100, 1)}% throttle` : `${direction === 'manual' ? 'Manual' : direction === 'prograde' ? 'Tracking prograde' : 'Tracking retrograde'} · ${number(degrees(getHeading()), 1)}° from +x`;
    find('preset-note').textContent = launch ? 'Full mission from Earth: 553,000 kg launch stack. Booster and upper stage carry the lunar spacecraft into a 400 km orbit, followed by its actual departure burn and lunar landing. Automatic mission guidance is enabled.' : landing ? 'Landing vehicle: 16,000 kg initial fuel, 100 kN engine. The 450 s departure burn is complete; 5,803 kg remain at the loaded start. Guidance uses the same continuous trajectory through contact.' : mission.preset === 'transfer'
      ? 'Departure burn complete: 450 simulated seconds used 5,099 kg of fuel. Leave the engine off for the verified Moon coast at 10,000×.'
      : 'Practice mode: a 400 km circular Earth orbit. It stays around Earth without a departure burn. Start Moon mission loads the verified lunar route.';
    find('moon-recovery').hidden = mission.preset !== 'leo';
    const vehicle = config.vehicle;
    find('active-vehicle').textContent = `${launch ? launch.stageName + ' · ' : ''}${number(vehicle.dryMass)} kg attached dry · ${number(vehicle.fuelMass)} kg stage-configuration fuel · ${number(vehicle.maxThrust / 1000)} kN · ${number(vehicle.specificImpulse)} s Isp`;
    const limitedWarp = allowedWarp();
    find('warp-note').textContent = automatic ? `Guided rate: up to ${number(limitedWarp)}× here. Rate follows launch, coast and descent; guidance updates at ≤0.25 s during ascent and lunar approach.` : limitedWarp < requestedWarp
      ? `Safety limit: ${number(limitedWarp)}×. ${armed && throttle > 0 && state.fuelMass > 0 ? 'Powered flight is capped at 10×.' : 'Warp is reduced near a surface or the Moon.'}`
      : 'High warp is for coasting. Thrust is capped at 10×.';
    find('presentation-warp').value = String(requestedWarp);
    find('presentation-warp-note').textContent = find('warp-note').textContent;
    find('zoom-level').textContent = `${zoom}×`;
    const zoomButtons = find('zoom-controls').querySelectorAll('button');
    zoomButtons[0].disabled = zoom === 1;
    zoomButtons[1].disabled = zoom === 128;
    find('frame-rate').textContent = paused ? 'Paused' : `${number(actualWarp)}× actual rate`;
    const notice = find('mission-notice');
    let message = error || ({
      landed: `Lunar landing successful. Touchdown: ${number(Math.abs(mission.touchdown?.verticalSpeed), 2)} m/s vertical, ${number(Math.abs(mission.touchdown?.horizontalSpeed), 2)} m/s sideways, ${number((mission.touchdown?.tilt ?? 0) * 180 / Math.PI, 1)}° tilt. ${number(state.fuelMass)} kg fuel remain. Flight paused and saved.`,
      flyby: `Lunar flyby achieved. You reached ${number(moonAltitude / 1000)} km above the Moon. Flyby objective complete; flight paused.`,
      'earth-impact': 'Earth impact. The spacecraft reached the surface. Reset flight to try a different burn.',
      'moon-impact': 'Moon impact. The spacecraft reached the lunar surface. Reset flight to try a different approach.',
      lost: 'Spacecraft lost. You crossed 1,000,000 km from Earth. Reset flight to try a lower-energy trajectory.',
    })[mission.status];
    if (!message && launch) message = paused ? state.time === 0 ? 'Launch pad ready. Select Launch mission for a calculated ascent through the atmosphere, Earth orbit, departure and Moon landing.' : `Flight paused during ${phaseLabels[mission.phase] ?? 'the lunar journey'}. Resume to continue the same mission.` : `${phaseLabels[phase] ?? 'Guided lunar flight'} · ${launch.stageName}. ${earthView ? 'Thrust, drag, propellant and stage separation are calculated. Atmospheric layers follow actual altitude.' : 'The actual departure is complete; guidance continues toward the lunar surface.'}`;
    if (!message && landing) message = paused ? 'Moon landing ready. Start Moon flight for the guided Earth–Moon journey, braking and touchdown. Automatic guidance is enabled; you can pause or take manual control.' : automatic ? `${phaseLabels[phase] ?? 'Guided lunar flight'}. Guidance changes actual thrust and burns fuel; warp reduces near the surface.` : 'Manual lunar flight. Engine and heading are yours; use Moon-relative speeds to judge your descent.';
    if (!message) message = paused
      ? mission.preset === 'transfer' ? 'Moon transfer ready. The 450 s departure burn is complete. Start Moon flight to coast toward the lunar flyby; leave the engine off for the verified route.' : 'Earth orbit practice. Start Earth orbit stays near Earth unless you make a departure burn. Select Start Moon mission for the verified route.'
      : state.fuelMass <= 0 ? 'Fuel is exhausted. Your spacecraft can still coast to the objective.'
        : mission.preset === 'transfer' ? 'Coasting toward the lunar flyby. The unmodified transfer needs no further engine burn; the objective is 20,000 km above the Moon.' : 'Earth orbit practice: controls change the orbit. Use Start Moon mission for the verified transfer.';
    if (notice.textContent !== message) notice.textContent = message;
    notice.dataset.state = error ? 'error' : mission.status;
    const sceneOutcome = find('scene-outcome');
    sceneOutcome.hidden = !terminal;
    const sceneOutcomeText = error ? 'Flight paused · reset from the main controls' : mission.status === 'landed' ? `Touchdown confirmed · ${number(Math.abs(mission.touchdown.verticalSpeed), 2)} m/s vertical · ${number(state.fuelMass)} kg fuel left` : mission.status === 'flyby' ? 'Lunar flyby achieved · mission complete' : 'Flight ended · inspect your report below';
    if (sceneOutcome.textContent !== sceneOutcomeText) sceneOutcome.textContent = sceneOutcomeText;
    readouts.earthAltitude.update(number((Math.hypot(state.x, state.y) - config.earth.radius) / 1000));
    readouts.speed.update(number(Math.hypot(state.vx, state.vy) / 1000, 3));
    readouts.fuel.update(number(state.fuelMass), state.fuelMass <= 0 ? 'critical' : 'neutral');
    readouts.deltaV.update(number((launch?.idealDeltaVRemaining ?? remainingDeltaV(state, config)) / 1000, 3));
    readouts.deltaV.element.querySelector('dt').textContent = launch ? 'Ideal staged delta-v' : 'Ideal delta-v left';
    readouts.deltaV.element.title = launch ? 'Ideal estimate assuming every attached stage burns all its remaining propellant. Actual upper-stage reserve may be discarded at insertion.' : '';
    readouts.earthVertical.element.hidden = !launch;
    readouts.airPressure.element.hidden = !launch;
    if (launch) {
      readouts.earthVertical.update(number(launch.verticalSpeed, 1));
      readouts.airPressure.update(number(launch.dynamicPressure / 1000, 2));
    }
    readouts.moonAltitude.update(number(moonAltitude / 1000));
    readouts.closest.update(number(Math.max(0, mission.closestAltitude) / 1000));
    readouts.vertical.update(number(mission.touchdown?.verticalSpeed ?? lunar.verticalSpeed, 2));
    readouts.horizontal.update(number(mission.touchdown?.horizontalSpeed ?? lunar.horizontalSpeed, 2));
    readouts.periapsis.update(number((elements.periapsis - config.earth.radius) / 1000));
    readouts.apoapsis.update(elements.apoapsis === null ? 'Unbound' : number((elements.apoapsis - config.earth.radius) / 1000));
    workbench?.update(mission, controls(), paused);
  }

  function animate(now) {
    if (disposed) return;
    // Development evidence only; the production presentation has no performance HUD.
    if (import.meta.env.DEV) {
      cadenceStart ??= now;
      cadenceFrames++;
      if (now - cadenceStart >= 1000) {
        find('orbital-map').dataset.frameRate = (cadenceFrames * 1000 / (now - cadenceStart)).toFixed(1);
        find('orbital-map').dataset.frameWindowMs = String(Math.round(now - cadenceStart));
        cadenceStart = now;
        cadenceFrames = 0;
      }
    }
    // Drop background/stall backlog instead of a giant catch-up integration.
    const wallSeconds = previousTime === undefined ? 0 : Math.min(0.05, (now - previousTime) / 1000);
    previousTime = now;
    const beforeTime = mission.state.time;
    if (!paused && mission.status === 'active' && !error) {
      const start = performance.now();
      const warp = allowedWarp();
      let remaining = wallSeconds * warp;
      let chunks = 0;
      try {
        while (remaining > 1e-9 && chunks < 50 && performance.now() - start < 8) {
          // Re-check safety and direction throughout a fast coast frame.
          const allowed = allowedWarp();
          if (allowed < warp) remaining = Math.min(remaining, wallSeconds * allowed);
          const step = Math.min(120, remaining);
          mission = isLaunch() ? advanceEarthLaunch(mission, controls(), step, { guided }) : isLanding() ? advanceLunarLanding(mission, controls(), step, { guided }) : advanceMission(mission, controls(), step);
          workbench?.sample(mission, mission.status !== 'active');
          remaining -= step;
          chunks++;
          if (mission.state.time - lastTrailTime >= 30 || mission.status !== 'active') {
            trail.push({ x: mission.state.x, y: mission.state.y });
            if (trail.length > 4000) trail.shift();
            lastTrailTime = mission.state.time;
          }
          if (mission.status !== 'active') { paused = true; armed = false; break; }
        }
      } catch {
        paused = true;
        armed = false;
        error = 'The simulation could not advance safely. Reset flight to restore a valid starting state.';
      }
    }
    actualWarp = wallSeconds > 0 ? (mission.state.time - beforeTime) / wallSeconds : 0;
    if (now - lastUiTime > 100) { update(); lastUiTime = now; }
    const command = controls();
    const launch = isLaunch() ? { ...earthLaunchDiagnostics(mission), phase: mission.phase, launchAngle: mission.launch.padAngle + (mission.config.atmosphere?.rotationRate ?? 0) * mission.state.time, padAltitude: 0 } : undefined;
    const landing = isLanding() && (!isLaunch() || mission.launch.stage === 2 && mission.phase !== 'departure') ? { ...lunarLandingDiagnostics(mission), phase: mission.phase, landed: mission.status === 'landed', crashed: mission.status === 'moon-impact' } : undefined;
    map.draw({ launch, landing, presentationControlsVisible: presentation.getState().active && !presentation.getState().controlsHidden, state: mission.state, config: mission.config, trail, prediction: prediction?.points ?? [], closestPoint: prediction?.closest, heading: mission.touchdown?.heading ?? command.heading, thrusting: !paused && mission.status === 'active' && command.throttle > 0 && mission.state.fuelMass > 0, follow, zoom, viewMode, paused, reducedMotion: motionQuery.matches });
    frameId = requestAnimationFrame(animate);
  }
  function onKey(event) {
    if (event.key === 'Tab' && presentation.getState().active) {
      const items = Array.from(find('flight-stage').querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),canvas[tabindex]')).filter(element => !element.hidden && element.getClientRects().length);
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && (document.activeElement === first || !find('flight-stage').contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !find('flight-stage').contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,select,textarea') || event.target.isContentEditable) return;
    if (event.code === 'KeyF' && !event.repeat) { event.preventDefault(); void (presentation.getState().active ? presentation.exit() : presentation.enter()); }
    if (event.code === 'KeyH' && !event.repeat && presentation.getState().active) { event.preventDefault(); presentation.toggleControls(); }
    if (event.code === 'Space' && !event.repeat && !event.target.closest('button,a')) { event.preventDefault(); toggleEngine(); }
    if (event.code === 'KeyP' && !event.repeat) { event.preventDefault(); togglePause(); }
    if (['ArrowLeft', 'ArrowRight'].includes(event.code) && mission.status === 'active' && !(isLanding() && guided)) {
      event.preventDefault();
      heading = (degrees(getHeading()) + (event.code === 'ArrowLeft' ? 5 : -5)) * Math.PI / 180;
      direction = 'manual';
      update();
    }
  }
  function onVisibility() {
    if (document.hidden) { paused = true; previousTime = undefined; workbench?.sample(mission, true); update(); }
  }
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);
  workbench = createMissionWorkbench({
    host: find('mission-workbench'), predictionHost: find('forecast-panel'),
    onVehicleApply: vehicle => load('leo', vehicle),
    onPredictionChange: result => { prediction = result; find('forecast-key').hidden = !result; },
  });
  workbench.reset(mission);
  find('mission-preset').value = mission.preset;
  find('time-warp').value = String(requestedWarp);
  update();
  frameId = requestAnimationFrame(animate);
  return () => {
    disposed = true;
    cancelAnimationFrame(frameId);
    map.destroy();
    presentation.destroy();
    workbench.dispose();
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
