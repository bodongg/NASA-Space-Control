import '../mission-workbench.css';
import { STANDARD_GRAVITY } from '../orbital/config.js';
import { atmosphericDragAcceleration } from '../orbital/atmosphere.js';
import { orbitalAcceleration } from '../orbital/physics.js';
import { createFlightRecord, appendTelemetry, summarizeRun, telemetryCsv, flightReportMarkdown } from '../orbital/telemetry.js';
import { saveFlightRecord, loadFlightRecords } from '../orbital/runStore.js';
import { createAnalysisPanel } from '../charts.js';
import { Slider } from './components/Slider.js';

const format = (n, digits = 0) => Number.isFinite(n)
  ? n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—';
const elapsed = t => `${format(t / 3600, 2)} h`;
const forceNumber = n => Math.abs(n) < 1e-12 ? '0' : Math.abs(n) < 0.001 ? n.toExponential(2) : format(n, 4);
const outcome = status => ({ active: 'In progress', flyby: 'Lunar flyby achieved', landed: 'Landed safely', 'earth-impact': 'Earth impact', 'moon-impact': 'Moon impact', lost: 'Spacecraft lost' })[status] ?? status;

function download(text, type, filename) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function createMissionWorkbench({ host, predictionHost, onVehicleApply, onPredictionChange }) {
  predictionHost.innerHTML = `<div class="forecast-options"><label><input id="forecast-enabled" type="checkbox" checked> Engine-off forecast</label><button type="button" id="refresh-forecast" class="control-button control-button-secondary">Refresh forecast</button></div><p id="forecast-note" class="forecast-note">Calculating a three-day coast forecast…</p>`;
  host.innerHTML = `
    <section id="live-physics" class="workbench-section physics-explainer" aria-labelledby="physics-title"><div><h2 id="physics-title">The forces behind the flight.</h2><p>Gravity bends the trajectory. Thrust changes velocity, and burning fuel changes the mass that the engine accelerates.</p><p id="physics-context" class="workbench-note"></p></div><div class="force-calculation"><code>a = aEarth + aMoon + aDrag + (T / m) × heading</code><dl id="force-values" class="force-values"></dl><code id="force-x"></code><code id="force-y"></code><p>The Moon term subtracts its pull on Earth’s moving origin. Drag opposes atmosphere-relative velocity during Earth ascent. These are the same free-flight acceleration calculations used by the flight loop; the pad additionally supports the vehicle before lift-off.</p></div></section>
    <section id="vehicle-setup" class="workbench-section" aria-labelledby="vehicle-title"><div class="workbench-heading"><div><h2 id="vehicle-title">Build your vehicle.</h2><p>Explore how mass, engine thrust and specific impulse affect your options.</p></div><p class="vehicle-budget" id="vehicle-budget"></p></div><div id="vehicle-sliders" class="vehicle-sliders"></div><div class="vehicle-apply"><button type="button" class="control-button control-button-primary" id="apply-vehicle">Apply to new LEO flight</button><p id="vehicle-reference"></p></div><p class="workbench-note">Applying settings starts a new paused flight in a 400 km circular orbit. Full Earth launch uses a fixed three-stage vehicle. These sliders configure a separate new Earth-orbit practice flight; the shorter flyby and landing starts also retain fixed vehicles.</p></section>
    <section id="flight-analysis" class="workbench-section" aria-labelledby="report-title"><div class="workbench-heading"><div><h2 id="report-title">Flight report & analysis.</h2><p id="report-context"></p></div><strong id="report-outcome"></strong></div><dl id="run-summary" class="run-summary"></dl><div class="report-actions"><button type="button" id="save-run" class="control-button control-button-primary">Save run</button><button type="button" id="export-csv" class="control-button control-button-secondary">Download CSV</button><button type="button" id="export-report" class="control-button control-button-secondary">Download report</button></div><p id="save-status" role="status" class="workbench-note">Up to three saved runs stay in this browser for comparison.</p><div class="comparison-field"><label for="compare-run">Compare with a saved run</label><select id="compare-run"><option value="">No comparison</option></select><p id="comparison-note" class="workbench-note">Save a flight, then start another to compare their data.</p></div><div id="analysis-charts"></div></section>`;
  const byId = id => host.querySelector(`#${id}`) ?? predictionHost.querySelector(`#${id}`);
  const charts = createAnalysisPanel(byId('analysis-charts'));
  let currentMission;
  let currentControls = {};
  let record;
  let saved = loadFlightRecords();
  let comparison = null;
  let autoSaved = false;
  let lastCharts = -Infinity;
  let worker;
  let job = 0;
  let pending = false;
  let disposed = false;
  let lastRequestedWall = -Infinity;
  let lastRequestedSim = -Infinity;
  let lastEngineCommand;
  let forecastResult = null;
  let enabled = true;

  const draft = {};
  const specs = [
    ['dryMass', 'Dry mass', 2000, 8000, 100, 4000, ' kg'],
    ['fuelMass', 'Initial fuel', 1000, 16000, 100, 6000, ' kg'],
    ['maxThrust', 'Maximum thrust', 20, 100, 1, 50, ' kN'],
    ['specificImpulse', 'Specific impulse', 250, 600, 10, 450, ' s'],
  ];
  const vehicleInputs = specs.map(([key, label, min, max, step, value, unit]) => {
    draft[key] = key === 'maxThrust' ? value * 1000 : value;
    const slider = Slider({ id: `vehicle-${key}`, label, min, max, step, value, unit, onInput(next) {
      draft[key] = key === 'maxThrust' ? next * 1000 : next;
      updateBudget();
    } });
    byId('vehicle-sliders').append(slider.element);
    return { key, slider };
  });
  function updateBudget() {
    const deltaV = draft.specificImpulse * STANDARD_GRAVITY * Math.log1p(draft.fuelMass / draft.dryMass) / 1000;
    byId('vehicle-budget').textContent = `${format(deltaV, 3)} km/s ideal delta-v`;
    byId('vehicle-reference').textContent = `${deltaV >= 3.084 ? 'Above' : 'Below'} the 3.084 km/s ideal impulsive Earth-only departure reference. Finite burns, timing and corrections require additional margin; this is not a mission-success guarantee.`;
  }
  const forceLabels = ['Mass', 'Commanded thrust', 'Earth gravity x / y', 'Moon gravity x / y', 'Thrust aₓ / aᵧ', 'Atmospheric drag aₓ / aᵧ', 'Total aₓ / aᵧ'];
  const forceValues = forceLabels.map(label => {
    const cell = document.createElement('div');
    const term = document.createElement('dt');
    const value = document.createElement('dd');
    term.textContent = label;
    cell.append(term, value);
    byId('force-values').append(cell);
    return value;
  });
  const summaryKeys = [
    ['duration', 'Time since loaded start'], ['deltaVUsed', 'Delta-v used in this segment'],
    ['fuelUsed', 'Fuel used in this segment'], ['closestAltitude', 'Closest Moon altitude'],
    ['initialMass', 'Initial total mass'], ['sampleCount', 'Recorded samples'],
    ['discardedFuel', 'Discarded unburned propellant'], ['discardedDry', 'Discarded stage dry mass'],
    ['touchdownVertical', 'Incoming touchdown vertical speed'], ['touchdownHorizontal', 'Incoming touchdown sideways speed'], ['touchdownTilt', 'Touchdown tilt'], ['touchdownFuel', 'Touchdown fuel remaining'],
  ];
  const summaryValues = Object.fromEntries(summaryKeys.map(([key, label]) => {
    const cell = document.createElement('div');
    const term = document.createElement('dt');
    const value = document.createElement('dd');
    term.textContent = label;
    cell.append(term, value);
    byId('run-summary').append(cell);
    return [key, value];
  }));
  function refreshSavedOptions() {
    const selectedId = byId('compare-run').value;
    const select = byId('compare-run');
    select.replaceChildren(new Option('No comparison', ''));
    saved.filter(run => run.id !== record?.id).forEach((run, index) => {
      const last = run.samples.at(-1);
      const title = `${index + 1}. ${run.preset === 'launch' ? 'Earth launch' : run.preset === 'landing' ? 'Landing' : run.preset === 'transfer' ? 'Flyby' : 'LEO'} · ${outcome(last.status)} · ${format((last.time - run.initialTime) / 3600, 2)} h`;
      select.add(new Option(title, run.id));
    });
    select.value = saved.some(run => run.id === selectedId && run.id !== record?.id) ? selectedId : '';
    comparison = saved.find(run => run.id === select.value) ?? null;
  }
  function sample(mission, force = false) {
    currentMission = mission;
    if (!record) return;
    record = appendTelemetry(record, mission, force);
    if (mission.status !== 'active' && !autoSaved) {
      autoSaved = true;
      save('Mission ended. ');
    }
  }
  function save(prefix = '') {
    if (!record || !currentMission) return;
    record = appendTelemetry(record, currentMission, true);
    const result = saveFlightRecord(record);
    byId('save-status').textContent = prefix + result.message;
    if (result.ok) saved = loadFlightRecords();
    else if (!saved.some(run => run.id === record.id)) saved = [record, ...saved].slice(0, 3);
    refreshSavedOptions();
    lastCharts = -Infinity;
  }
  function requestForecast(force = false) {
    if (!enabled || !currentMission || disposed || pending) return;
    if (currentMission.status === 'landed' || currentMission.preset === 'launch' && (currentMission.launch.stage < 2 || currentMission.phase === 'departure')) return;
    const now = performance.now();
    const powered = (currentControls.throttle ?? 0) > 0 && currentMission.state.fuelMass > 0;
    const command = `${currentControls.throttle ?? 0}:${Math.round((currentControls.heading ?? 0) * 100)}:${powered}`;
    const meaningfulChange = powered ? 10 : 7200;
    if (!force && (now - lastRequestedWall < 2500
      || forecastResult && Math.abs(currentMission.state.time - lastRequestedSim) < meaningfulChange && command === lastEngineCommand)) return;
    try {
      if (!worker) {
        worker = new Worker(new URL('../orbital/trajectoryWorker.js', import.meta.url), { type: 'module' });
        worker.onmessage = event => {
          if (disposed || event.data.id !== job) return;
          pending = false;
          byId('refresh-forecast').disabled = !enabled;
          if (event.data.error) {
            forecastResult = null;
            onPredictionChange(null);
            byId('forecast-note').textContent = 'Forecast could not be calculated. Flying still works; use Refresh forecast to retry.';
            return;
          }
          forecastResult = event.data.result;
          onPredictionChange(enabled ? forecastResult : null);
          if (!enabled) { byId('forecast-note').textContent = 'Forecast hidden. The green line shows traveled history.'; return; }
          const result = forecastResult;
          const snapshot = result.points[0]?.time ?? lastRequestedSim;
          byId('forecast-note').textContent = `Engine-off forecast from mission t=${format(snapshot / 3600, 2)} h, up to 72 h ahead. Projected closest Moon altitude: ${format(result.closest.altitude / 1000)} km at t=${format(result.closest.time / 3600, 2)} h. ${result.endStatus === 'active' ? '' : `Forecast ends: ${outcome(result.endStatus)}. `}Engine-off snapshot: excludes future guidance burns and does not predict the powered landing. Refresh after a maneuver.`;
        };
        worker.onerror = () => {
          pending = false;
          worker?.terminate();
          worker = null;
          forecastResult = null;
          onPredictionChange(null);
          byId('refresh-forecast').disabled = !enabled;
          byId('forecast-note').textContent = 'Forecast worker stopped. Flight is unaffected; use Refresh forecast to retry.';
        };
      }
      pending = true;
      byId('refresh-forecast').disabled = true;
      byId('forecast-note').textContent = 'Calculating a three-day engine-off forecast. Flight controls remain available.';
      lastRequestedWall = now;
      lastRequestedSim = currentMission.state.time;
      lastEngineCommand = command;
      worker.postMessage({ id: ++job, state: currentMission.state, config: currentMission.config });
    } catch {
      pending = false;
      byId('refresh-forecast').disabled = false;
      byId('forecast-note').textContent = 'This browser could not start the forecast worker. You can continue flying and recording telemetry.';
    }
  }
  function reset(mission) {
    if (record && currentMission && currentMission.state.time > record.initialTime) save('Previous flight saved before restart. ');
    worker?.terminate();
    worker = null;
    job++;
    pending = false;
    forecastResult = null;
    onPredictionChange(null);
    currentMission = mission;
    record = createFlightRecord(mission);
    autoSaved = false;
    lastRequestedWall = -Infinity;
    lastRequestedSim = -Infinity;
    lastCharts = -Infinity;
    for (const { key, slider } of vehicleInputs) {
      if (mission.preset === 'launch') continue;
      draft[key] = mission.config.vehicle[key];
      slider.setValue(key === 'maxThrust' ? draft[key] / 1000 : draft[key]);
    }
    updateBudget();
    refreshSavedOptions();
    requestForecast(true);
  }
  function update(mission, controls, paused) {
    currentMission = mission;
    currentControls = controls;
    if (!record) return;
    const { state, config } = mission;
    const mass = config.vehicle.dryMass + state.fuelMass;
    const gravityConfig = config.atmosphere?.enabled ? { ...config, atmosphere: { ...config.atmosphere, enabled: false } } : config;
    const gravity = orbitalAcceleration(state, {}, gravityConfig);
    const drag = atmosphericDragAcceleration(state, config);
    const total = orbitalAcceleration(state, controls, config);
    const radius = Math.hypot(state.x, state.y);
    const earth = { ax: -config.earth.mu * state.x / radius ** 3, ay: -config.earth.mu * state.y / radius ** 3 };
    const thrust = state.fuelMass > 0 ? (controls.throttle ?? 0) * config.vehicle.maxThrust : 0;
    const pair = (x, y) => `${forceNumber(x)} / ${forceNumber(y)} m/s²`;
    forceValues[0].textContent = `${format(mass)} kg`;
    forceValues[1].textContent = `${format(thrust / 1000, 1)} kN`;
    forceValues[2].textContent = pair(earth.ax, earth.ay);
    forceValues[3].textContent = pair(gravity.ax - earth.ax, gravity.ay - earth.ay);
    const thrustAx = thrust * Math.cos(controls.heading ?? 0) / mass;
    const thrustAy = thrust * Math.sin(controls.heading ?? 0) / mass;
    forceValues[4].textContent = pair(thrustAx, thrustAy);
    forceValues[5].textContent = pair(drag.ax, drag.ay);
    forceValues[6].textContent = pair(total.ax, total.ay);
    byId('force-x').textContent = `aₓ = ${forceNumber(gravity.ax)} + ${forceNumber(thrustAx)} + ${forceNumber(drag.ax)} = ${forceNumber(total.ax)} m/s²`;
    byId('force-y').textContent = `aᵧ = ${forceNumber(gravity.ay)} + ${forceNumber(thrustAy)} + ${forceNumber(drag.ay)} = ${forceNumber(total.ay)} m/s²`;
    byId('physics-context').textContent = paused ? 'Time is paused. Values show the instantaneous forces for the current engine command.' : 'Values update from the current simulated position, mass and engine command.';
    if (mission.preset === 'launch' && (mission.launch.stage < 2 || mission.phase === 'departure')) {
      byId('refresh-forecast').disabled = true;
      byId('forecast-note').textContent = 'Ascent and departure use powered guidance. Engine-off forecasting begins after departure; it excludes future guidance burns.';
    } else if (mission.status === 'landed') {
      if (worker || forecastResult) {
        worker?.terminate(); worker = null; job++; pending = false; forecastResult = null;
        onPredictionChange(null);
      }
      byId('refresh-forecast').disabled = true;
      byId('forecast-note').textContent = 'Landed on the Moon. Forecast stopped at contact; inspect the recorded touchdown evidence below.';
    } else { byId('refresh-forecast').disabled = !enabled || pending; requestForecast(); }
    if (performance.now() - lastCharts < 500) return;
    lastCharts = performance.now();
    const snapshot = appendTelemetry(record, mission, true);
    const summary = summarizeRun(snapshot);
    byId('report-outcome').textContent = outcome(summary.status);
    byId('report-outcome').dataset.outcome = summary.status;
    byId('report-context').textContent = `${mission.preset === 'launch' ? 'Earth launch: this recording includes lift-off, ascent, staging, the actual departure burn and lunar flight. Discarded propellant is recorded separately from burned fuel.' : mission.preset === 'landing' ? 'Lunar landing vehicle: the 450 s departure burn happened before this recording. Incoming contact speeds are retained separately from the Moon-relative resting state.' : mission.preset === 'transfer' ? 'Post-departure transfer: the 450 s burn happened before this recording.' : 'Manual low Earth orbit start.'} Segment values begin at mission t=${format(record.initialTime / 3600, 3)} h. Mission clock now ${format(state.time / 3600, 3)} h.`;
    summaryValues.duration.textContent = elapsed(summary.duration);
    summaryValues.deltaVUsed.textContent = `${format(summary.deltaVUsed / 1000, 3)} km/s`;
    summaryValues.fuelUsed.textContent = `${format(summary.fuelUsed)} kg`;
    summaryValues.closestAltitude.textContent = `${format(summary.closestAltitude / 1000)} km`;
    summaryValues.initialMass.textContent = `${format(summary.initialMass)} kg`;
    summaryValues.sampleCount.textContent = format(summary.sampleCount);
    for (const key of ['discardedFuel','discardedDry']) summaryValues[key].parentElement.hidden = mission.preset !== 'launch';
    summaryValues.discardedFuel.textContent = `${format(summary.discardedFuelMass ?? 0, 1)} kg`;
    summaryValues.discardedDry.textContent = `${format(summary.discardedDryMass ?? 0)} kg`;
    for (const key of ['touchdownVertical', 'touchdownHorizontal', 'touchdownTilt', 'touchdownFuel']) summaryValues[key].parentElement.hidden = !summary.touchdown;
    if (summary.touchdown) {
      summaryValues.touchdownVertical.textContent = `${format(summary.touchdown.verticalSpeed, 3)} m/s`;
      summaryValues.touchdownHorizontal.textContent = `${format(summary.touchdown.horizontalSpeed, 3)} m/s`;
      summaryValues.touchdownTilt.textContent = `${format(summary.touchdown.tilt * 180 / Math.PI, 3)}°`;
      summaryValues.touchdownFuel.textContent = `${format(summary.touchdown.fuelMass, 1)} kg`;
    }
    byId('comparison-note').textContent = comparison
      ? `Overlay: ${comparison.preset === 'launch' ? 'Earth launch' : comparison.preset === 'landing' ? 'lunar landing' : comparison.preset === 'transfer' ? 'post-departure flyby' : 'LEO'}; initial mass ${format(comparison.samples[0].mass)} kg versus ${format(summary.initialMass)} kg now. Time axes start at each loaded state; energy also depends on mass.`
      : 'Save a flight, then start another to compare their data. Up to three runs are retained in this browser.';
    charts.update(snapshot, comparison);
  }
  byId('refresh-forecast').addEventListener('click', () => requestForecast(true));
  byId('forecast-enabled').addEventListener('change', event => {
    enabled = event.target.checked;
    byId('refresh-forecast').disabled = !enabled || pending;
    onPredictionChange(enabled ? forecastResult : null);
    if (enabled) requestForecast(true);
    else byId('forecast-note').textContent = 'Forecast hidden. The green line shows traveled history.';
  });
  byId('apply-vehicle').addEventListener('click', () => onVehicleApply({ ...draft }));
  byId('save-run').addEventListener('click', () => { save(); if (currentMission) update(currentMission, currentControls, true); });
  byId('compare-run').addEventListener('change', event => {
    comparison = saved.find(run => run.id === event.target.value) ?? null;
    lastCharts = -Infinity;
    if (currentMission) update(currentMission, currentControls, false);
  });
  byId('export-csv').addEventListener('click', () => {
    sample(currentMission, true);
    download(telemetryCsv(record), 'text/csv;charset=utf-8', `mission-${record.preset}-${Date.now()}.csv`);
    byId('save-status').textContent = 'CSV prepared with SI units, run setup and telemetry. Your browser handles the download.';
  });
  byId('export-report').addEventListener('click', () => {
    sample(currentMission, true);
    const report = flightReportMarkdown(record);
    download(report, 'text/markdown;charset=utf-8', `mission-${record.preset}-${Date.now()}-report.md`);
    byId('save-status').textContent = 'Markdown report prepared. Add your screenshots, interpretation and team reflection for submission.';
  });
  updateBudget();
  return { reset, sample, update, dispose() { disposed = true; worker?.terminate(); charts.destroy(); } };
}
