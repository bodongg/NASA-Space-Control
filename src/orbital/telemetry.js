import { moonState } from './bodies.js';
import { orbitalEnergy, remainingDeltaV } from './physics.js';
import { lunarLandingDiagnostics } from './lunarLanding.js';
import { earthLaunchDiagnostics, EARTH_LAUNCH_STAGES } from './earthLaunch.js';

export const TELEMETRY_COLUMNS = Object.freeze([
  ['time', 'time_s'], ['x', 'x_m'], ['y', 'y_m'], ['vx', 'vx_m_per_s'], ['vy', 'vy_m_per_s'],
  ['speed', 'speed_m_per_s'], ['earthAltitude', 'earth_altitude_m'], ['moonAltitude', 'moon_altitude_m'],
  ['closestAltitude', 'closest_lunar_altitude_m'], ['fuelMass', 'fuel_mass_kg'], ['mass', 'mass_kg'],
  ['deltaVUsed', 'delta_v_used_m_per_s'], ['deltaVRemaining', 'delta_v_remaining_m_per_s'],
  ['kinetic', 'kinetic_energy_J'], ['potential', 'potential_energy_J'], ['total', 'total_energy_J'],
  ['specificEnergy', 'specific_energy_J_per_kg'], ['status', 'status'],
]);

export const LANDING_TELEMETRY_COLUMNS = Object.freeze([
  ['phase', 'phase'], ['moonVerticalSpeed', 'moon_vertical_speed_m_per_s'],
  ['moonHorizontalSpeed', 'moon_tangential_speed_m_per_s'], ['moonRelativeSpeed', 'moon_relative_speed_m_per_s'],
]);

export const LAUNCH_TELEMETRY_COLUMNS = Object.freeze([
  ['stageName','active_stage'], ['earthVerticalSpeed','earth_vertical_speed_m_per_s'],
  ['earthHorizontalSpeed','earth_tangential_speed_m_per_s'], ['atmosphereLayer','atmosphere_layer'],
  ['density','air_density_kg_per_m3'], ['dynamicPressure','dynamic_pressure_Pa'],
]);

function flightSample(mission) {
  const { state, config } = mission;
  const moon = moonState(state.time, config);
  const energy = orbitalEnergy(state, config);
  const lunar = ['landing','launch'].includes(mission.preset) ? lunarLandingDiagnostics(mission) : null;
  const launch = mission.preset === 'launch' ? earthLaunchDiagnostics(mission) : null;
  return {
    time: state.time, x: state.x, y: state.y, vx: state.vx, vy: state.vy,
    speed: Math.hypot(state.vx, state.vy),
    earthAltitude: Math.hypot(state.x, state.y) - config.earth.radius,
    moonAltitude: Math.hypot(state.x - moon.x, state.y - moon.y) - config.moon.radius,
    closestAltitude: mission.closestAltitude,
    fuelMass: state.fuelMass, mass: config.vehicle.dryMass + state.fuelMass,
    deltaVUsed: state.deltaVUsed, deltaVRemaining: launch?.idealDeltaVRemaining ?? remainingDeltaV(state, config),
    kinetic: energy.kinetic, potential: energy.potential, total: energy.total,
    specificEnergy: energy.specific, status: mission.status,
    ...(lunar ? { phase: mission.phase, moonVerticalSpeed: lunar.verticalSpeed,
      moonHorizontalSpeed: lunar.horizontalSpeed, moonRelativeSpeed: lunar.speed } : {}),
    ...(launch ? { stageName: launch.stageName, earthVerticalSpeed: launch.verticalSpeed, earthHorizontalSpeed: launch.horizontalSpeed, atmosphereLayer: launch.atmosphereLayer, density: launch.density, dynamicPressure: launch.dynamicPressure } : {}),
  };
}

export function createFlightRecord(mission) {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    preset: mission.preset, config: structuredClone(mission.config),
    startedAt: new Date().toISOString(), initialTime: mission.state.time,
    samples: [flightSample(mission)],
    ...(mission.preset === 'launch' ? { launchSetup: { stages: structuredClone(mission.launch.stages ?? EARTH_LAUNCH_STAGES), atmosphere: structuredClone(mission.config.atmosphere) }, stageEvents: structuredClone(mission.stageEvents ?? []) } : {}),
    ...(mission.touchdown ? { touchdown: { ...mission.touchdown } } : {}),
  };
}

export function appendTelemetry(record, mission, force = false) {
  const last = record.samples.at(-1);
  const time = mission.state.time;
  if (time < last.time) throw new RangeError('Telemetry time cannot run backwards');
  if (time === last.time && mission.status === last.status && mission.phase === last.phase && (mission.stageEvents?.length ?? 0) === (record.stageEvents?.length ?? 0)) return record;
  if (!force && mission.status === 'active' && time - last.time < 60) return record;
  const sample = flightSample(mission);
  let samples = time === last.time && record.samples.length > 1
    ? [...record.samples.slice(0, -1), sample] : [...record.samples, sample];
  if (samples.length > 2500) samples = samples.filter((_, index) => index % 2 === 0 || index === samples.length - 1);
  return { ...record, samples, ...(mission.stageEvents ? {stageEvents:structuredClone(mission.stageEvents)} : {}), ...(mission.touchdown ? { touchdown: { ...mission.touchdown } } : {}) };
}

export function summarizeRun(record) {
  const first = record.samples[0];
  const last = record.samples.at(-1);
  const events = (record.stageEvents ?? []).filter(event => event.time > first.time && event.time <= last.time);
  const discardedFuelMass = events.reduce((sum,event) => sum + event.discardedFuelMass,0);
  const discardedDryMass = events.reduce((sum,event) => sum + event.discardedDryMass,0);
  return {
    status: last.status, duration: last.time - first.time, missionTime: last.time,
    deltaVUsed: last.deltaVUsed - first.deltaVUsed, fuelUsed: first.fuelMass - last.fuelMass - discardedFuelMass,
    ...(record.preset === 'launch' ? { discardedFuelMass, discardedDryMass } : {}),
    closestAltitude: last.closestAltitude, initialMass: first.mass, finalMass: last.mass,
    sampleCount: record.samples.length,
    ...(last.phase ? { phase: last.phase } : {}),
    ...(record.touchdown ? { touchdown: { ...record.touchdown } } : {}),
  };
}

function csvValue(value) {
  const text = value == null ? '' : typeof value === 'string' && /^[=+@\t\r\n-]/.test(value) ? "'" + value : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function telemetryCsv(record) {
  const metadata = [
    ['run_id', record.id], ['preset', record.preset], ['started_at_utc', record.startedAt],
    ['initial_time_s', record.initialTime], ['dry_mass_kg', record.config.vehicle.dryMass],
    ['initial_fuel_mass_kg', record.samples[0].fuelMass], ['max_thrust_N', record.config.vehicle.maxThrust],
    ['vehicle_initial_fuel_mass_kg', record.config.vehicle.fuelMass],
    ['specific_impulse_s', record.config.vehicle.specificImpulse],
    ['energy_model', 'Earth-centered differential lunar potential; moving Moon; total energy need not be conserved'],
  ];
  if (record.preset === 'launch') {
    const summary=summarizeRun(record);
    metadata.push(['discarded_fuel_mass_kg',summary.discardedFuelMass],['discarded_dry_mass_kg',summary.discardedDryMass],['drag_model','rho=1.225 exp(-altitude/8500); rotating atmosphere; drag area15m2; exponential density approaches zero with altitude']);
    for (const event of record.stageEvents ?? []) metadata.push(['stage_separation',event.stageName,event.time,event.discardedDryMass,event.discardedFuelMass]);
  }
  if (record.touchdown) {
    const contact = record.touchdown;
    metadata.push(['touchdown_time_s', contact.time], ['touchdown_vertical_speed_m_per_s', contact.verticalSpeed],
      ['touchdown_tangential_speed_m_per_s', contact.horizontalSpeed], ['touchdown_relative_speed_m_per_s', contact.speed],
      ['touchdown_tilt_rad', contact.tilt], ['touchdown_fuel_mass_kg', contact.fuelMass]);
  }
  const columns = record.preset === 'launch' ? [...TELEMETRY_COLUMNS, ...LANDING_TELEMETRY_COLUMNS, ...LAUNCH_TELEMETRY_COLUMNS] : record.preset === 'landing' ? [...TELEMETRY_COLUMNS, ...LANDING_TELEMETRY_COLUMNS] : TELEMETRY_COLUMNS;
  const rows = metadata.map((row) => ['#', ...row].map(csvValue).join(','));
  rows.push(['elapsed_time_s', ...columns.map(([, label]) => label)].join(','));
  for (const sample of record.samples) {
    rows.push([sample.time - record.initialTime, ...columns.map(([key]) => sample[key])].map(csvValue).join(','));
  }
  return rows.join('\r\n') + '\r\n';
}

export function flightReportMarkdown(record, generatedAt = new Date().toISOString()) {
  const s = summarizeRun(record);
  const v = record.config.vehicle;
  const fullLaunch = record.preset === 'launch';
  const landing = fullLaunch || record.preset === 'landing';
  const mode = fullLaunch ? 'Earth launch through atmosphere to lunar landing' : landing ? 'Lunar landing (450 s departure burn already completed)'
    : record.preset === 'transfer' ? 'Post-departure transfer (450 s departure burn already completed)' : 'Low Earth orbit';
  const outcome = ({ active: 'In progress', landed: 'Landed safely', flyby: 'Lunar flyby achieved',
    'earth-impact': 'Earth impact', 'moon-impact': 'Moon impact', lost: 'Spacecraft lost' })[s.status] ?? s.status;
  const contact = s.touchdown ? `\n## Measured surface contact\n\n- Incoming vertical speed (outward positive): ${s.touchdown.verticalSpeed} m/s\n- Incoming tangential speed: ${s.touchdown.horizontalSpeed} m/s\n- Incoming Moon-relative speed: ${s.touchdown.speed} m/s\n- Touchdown tilt: ${s.touchdown.tilt * 180 / Math.PI} degrees\n- Fuel remaining at contact: ${s.touchdown.fuelMass} kg\n\nThese are incoming contact values, retained before the landed state rests relative to the Moon.\n` : '';
  const stageDetails = fullLaunch ? `\n## Launch vehicle and atmospheric drag\n\n${record.launchSetup.stages.map(stage=>`- ${stage.stageName}: dry mass ${stage.dryMass} kg; propellant ${stage.fuelMass} kg; thrust ${stage.maxThrust} N; Isp ${stage.specificImpulse} s`).join('\n')}\n\n- Discarded propellant (not burned): ${s.discardedFuelMass} kg\n- Discarded stage dry mass: ${s.discardedDryMass} kg\n\nDrag opposes atmosphere-relative motion: aDrag = -0.5 rho CdA |vrel| vrel / m. Density uses a simplified exponential scale height8500 m, sea-level1.225 kg/m3; CdA15m2. The atmosphere rotates with Earth. Layer labels use approximate educational boundaries;100 km is a conventional space boundary within the thermosphere. All ascent, insertion and departure burns occur within this recording; separation changes attached mass but not position, velocity or time. Ideal staged delta-v assumes all attached propellant can be burned; upper-stage reserve may instead be explicitly discarded.\n` : '';
  const objective = landing
    ? 'Guidance resolves Moon-relative radial and tangential motion, accounts for the moving Moon acceleration and recomputes at <=0.25 s during approach and descent. Safe landing requires physical swept lunar contact, absolute radial speed <=2 m/s, tangential speed <=1 m/s and tilt <=10 degrees. Hard contact remains an impact. The lunar spacecraft uses a fixed 4000 kg dry / 16000 kg initial-fuel / 100000 N / 450 s Isp vehicle, carried by booster stages for a full Earth launch.'
    : 'Flyby success is entry within 20,000 km lunar altitude; gameplay stops before the later closest approach. It does not demonstrate lunar capture.';
  return `# Mission Control — flight report\n\nGenerated: ${generatedAt}\n\n## Recorded flight\n\n- Starting mode: ${mode}\n- Outcome: ${outcome}\n- Recorded mission interval: ${record.initialTime} to ${s.missionTime} s\n- Duration since loaded start: ${s.duration} s\n- Segment ideal thrust delta-v used: ${s.deltaVUsed} m/s\n- Segment fuel used: ${s.fuelUsed} kg\n- Closest Moon surface altitude during recording: ${s.closestAltitude} m\n- Samples: ${s.sampleCount}\n${contact}\n${stageDetails}\n## Initial recorded setup\n\n- Dry mass: ${v.dryMass} kg\n- Initial vehicle fuel setting: ${v.fuelMass} kg\n- Recorded initial mass: ${s.initialMass} kg\n- Maximum thrust: ${v.maxThrust} N\n- Specific impulse: ${v.specificImpulse} s\n- Moon initial phase: ${record.config.moon.phase} rad\n\n## Concepts and algorithm\n\n2D Newtonian gravitation and thrust: a = aEarth + aMoon,differential + T/m × heading. Fuel flow = T/(Isp × g0); remaining ideal delta-v = Isp × g0 × ln(m/mdry). Velocity Verlet advances position and velocity, with <=1 s coasting, <=0.25 s powered steps and a split at fuel exhaustion. Surface events use swept moving-body chords.\n\n${objective}\n\n## Interpretation and limitations\n\nThe moving prescribed Moon makes spacecraft mechanical energy time-dependent; fuel/exhaust exchanges also affect energy. Earth-only unpowered tests validate conservation separately. ${fullLaunch ? 'This recording includes lift-off, ascent, staging, departure and the lunar journey. Propellant burned excludes explicitly discarded residual fuel; both quantities are reported.' : "The postburn preset's departure fuel and delta-v are excluded from this segment summary."} The engine-off coast forecast excludes future guidance burns and is an approximate snapshot. It is not a landing forecast. Earth-centered chart speeds differ from Moon-relative descent and contact speeds. The simulation is planar, uses a circular prescribed Moon, point masses, constant Isp ${fullLaunch ? 'with simplified atmospheric drag and idealized instantaneous stage separation. Torque, heating, winds and launch aerodynamics beyond drag are not modeled.' : 'and no atmosphere, launch, staging or torque.'}\n\n## Reproduce and validate\n\nRun npm test and npm run build in the project. See docs/orbital-physics.md and docs/report-outline.md. Export the CSV with this report and add a screenshot of the actual run.\n\n## Student reflection\n\nExplain your burn choices, what changed in the graphs, discrepancies from the forecast, team contributions and possible improvements.\n`;
}


