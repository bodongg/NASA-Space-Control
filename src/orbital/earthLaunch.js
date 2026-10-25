import { ORBIT_CONFIG, STANDARD_GRAVITY } from './config.js';
import { moonState } from './bodies.js';
import { atmosphereAt } from './atmosphere.js';
import { orbitalAcceleration, stepOrbit } from './physics.js';
import { advanceMission, safeWarp } from './mission.js';
import { advanceLunarLanding, lunarLandingGuidance, lunarLandingWarp } from './lunarLanding.js';

export const EARTH_LAUNCH_STAGES = Object.freeze([
  Object.freeze({ stageName: 'Booster', dryMass: 25000, fuelMass: 400000, maxThrust: 7000000, specificImpulse: 300 }),
  Object.freeze({ stageName: 'Upper stage', dryMass: 8000, fuelMass: 100000, maxThrust: 1200000, specificImpulse: 450 }),
  Object.freeze({ stageName: 'Lunar spacecraft', dryMass: 4000, fuelMass: 16000, maxThrust: 100000, specificImpulse: 450 }),
]);
const ROTATION = 7.2921159e-5;
const TARGET_ALTITUDE = 400000;
const DEPARTURE_SECONDS = 450;
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const reserveFuel = (stage) => EARTH_LAUNCH_STAGES.slice(stage + 1).reduce((total, item) => total + item.fuelMass, 0);

function stageConfig(stage) {
  const active = EARTH_LAUNCH_STAGES[stage];
  return Object.freeze({
    ...ORBIT_CONFIG,
    // Numerical launch-window shooting chooses this phase BEFORE flight.
    moon: Object.freeze({ ...ORBIT_CONFIG.moon, phase: 4.4089078791875185 }),
    atmosphere: Object.freeze({ enabled: true, dragArea: 15, rotationRate: ROTATION }),
    vehicle: Object.freeze({ ...active,
      dryMass: EARTH_LAUNCH_STAGES.slice(stage).reduce((total, item) => total + item.dryMass, 0),
      fuelMass: active.fuelMass + reserveFuel(stage),
    }),
  });
}
const CONFIGS = Object.freeze(EARTH_LAUNCH_STAGES.map((_, stage) => stageConfig(stage)));

function checkedControls(controls = {}) {
  const throttle = controls.throttle ?? 0;
  const heading = controls.heading ?? 0;
  if (!Number.isFinite(throttle) || !Number.isFinite(heading)) throw new RangeError('Launch controls must be finite');
  return { throttle: clamp(throttle, 0, 1), heading };
}

function validateMission(mission) {
  if (!mission?.state || !mission?.launch || !mission?.config
    || !['x', 'y', 'vx', 'vy', 'time', 'fuelMass', 'deltaVUsed'].every((key) => Number.isFinite(mission.state[key]))
    || mission.state.fuelMass < 0 || mission.state.deltaVUsed < 0
    || !Number.isInteger(mission.launch.stage) || mission.launch.stage < 0 || mission.launch.stage > 2
    || !Number.isFinite(mission.launch.departureElapsed) || mission.launch.departureElapsed < 0
    || !Number.isFinite(mission.launch.padAngle)) {
    throw new RangeError('Launch state must be finite and physical');
  }
}

export function createEarthLaunchMission() {
  const config = CONFIGS[0];
  const state = { x: config.earth.radius, y: 0, vx: 0, vy: ROTATION * config.earth.radius,
    fuelMass: config.vehicle.fuelMass, time: 0, deltaVUsed: 0 };
  const moon = moonState(0, config);
  return { state, config, status: 'active', preset: 'launch', phase: 'ascent',
    closestAltitude: Math.hypot(state.x - moon.x, state.y - moon.y) - config.moon.radius,
    launch: { stage: 0, stageName: EARTH_LAUNCH_STAGES[0].stageName,
      liftedOff: false, departureElapsed: 0, padAngle: 0 }, stageEvents: Object.freeze([]) };
}

export function earthLaunchDiagnostics(mission) {
  validateMission(mission);
  const { state, config, launch } = mission;
  const radius = Math.hypot(state.x, state.y);
  const radialAngle = Math.atan2(state.y, state.x);
  const ux = Math.cos(radialAngle), uy = Math.sin(radialAngle);
  const altitude = radius - config.earth.radius;
  const atmosphere = atmosphereAt(altitude);
  const relativeSpeed = Math.hypot(state.vx + ROTATION * state.y, state.vy - ROTATION * state.x);
  let attachedMass = config.vehicle.dryMass + state.fuelMass;
  let remainingFuel = state.fuelMass;
  let idealDeltaVRemaining = 0;
  // Ideal full-tank staged estimate; actual insertion discards upper reserve.
  for (let stage = launch.stage; stage < EARTH_LAUNCH_STAGES.length; stage++) {
    const activeFuel = Math.max(0, remainingFuel - reserveFuel(stage));
    idealDeltaVRemaining += EARTH_LAUNCH_STAGES[stage].specificImpulse * STANDARD_GRAVITY
      * Math.log(attachedMass / (attachedMass - activeFuel));
    attachedMass -= activeFuel + EARTH_LAUNCH_STAGES[stage].dryMass;
    remainingFuel -= activeFuel;
  }
  return { altitude, verticalSpeed: state.vx * ux + state.vy * uy,
    horizontalSpeed: -state.vx * uy + state.vy * ux, radialAngle,
    atmosphereLayer: atmosphere.layer, density: atmosphere.density,
    dynamicPressure: 0.5 * atmosphere.density * relativeSpeed ** 2,
    stage: launch.stage, stageName: launch.stageName, padAltitude: 0, idealDeltaVRemaining };
}

export function earthLaunchGuidance(mission) {
  const d = earthLaunchDiagnostics(mission);
  if (mission.status !== 'active') return { throttle: 0, heading: d.radialAngle, phase: mission.phase };
  if (d.altitude < -1e-6 || (mission.launch.liftedOff && d.altitude <= 0)) {
    return { throttle: 0, heading: d.radialAngle, phase: 'crash' };
  }
  if (mission.launch.stage === 2) {
    return mission.phase === 'departure'
      ? { throttle: mission.state.fuelMass > 0 ? 1 : 0, heading: Math.atan2(mission.state.vy, mission.state.vx), phase: 'departure' }
      : lunarLandingGuidance(mission);
  }
  const { state, config } = mission;
  const radius = d.altitude + config.earth.radius;
  const maxA = config.vehicle.maxThrust / (config.vehicle.dryMass + state.fuelMass);
  const circularSpeed = Math.sqrt(config.earth.mu / (config.earth.radius + TARGET_ALTITUDE));
  const targetVr = Math.min(600, Math.sqrt(6 * Math.max(0, TARGET_ALTITUDE - d.altitude)), (TARGET_ALTITUDE - d.altitude) / 100);
  const radial = clamp((targetVr - d.verticalSpeed) / 25 + config.earth.mu / radius ** 2 - d.horizontalSpeed ** 2 / radius,
    -0.98 * maxA, 0.98 * maxA);
  const tangent = Math.min((circularSpeed - d.horizontalSpeed) / 120 + d.verticalSpeed * d.horizontalSpeed / radius,
    Math.sqrt(Math.max(0, maxA ** 2 - radial ** 2)));
  return { throttle: state.fuelMass > reserveFuel(mission.launch.stage) ? clamp(Math.hypot(radial, tangent) / maxA, 0, 1) : 0,
    heading: d.radialAngle + Math.PI / 2 - Math.atan2(radial, tangent),
    phase: mission.launch.stage === 1 && d.altitude > 200000 ? 'orbit-insertion' : 'ascent' };
}

function separateStage(mission) {
  const stage = mission.launch.stage;
  const fuelDiscarded = Math.max(0, mission.state.fuelMass - reserveFuel(stage));
  const nextStage = stage + 1;
  const state = { ...mission.state, fuelMass: mission.state.fuelMass - fuelDiscarded };
  const config = CONFIGS[nextStage];
  const event = Object.freeze({ type: 'stage-separation', stage, stageName: mission.launch.stageName,
    time: state.time, discardedDryMass: EARTH_LAUNCH_STAGES[stage].dryMass, discardedFuelMass: fuelDiscarded,
    before: Object.freeze({ ...mission.state, dryMass: mission.config.vehicle.dryMass }),
    after: Object.freeze({ ...state, dryMass: config.vehicle.dryMass }) });
  return { ...mission, state, config, phase: nextStage === 2 ? 'departure' : 'ascent',
    launch: { ...mission.launch, stage: nextStage, stageName: EARTH_LAUNCH_STAGES[nextStage].stageName },
    stageEvents: Object.freeze([...mission.stageEvents, event]) };
}

function inserted(mission) {
  const d = earthLaunchDiagnostics(mission);
  const circular = Math.sqrt(mission.config.earth.mu / (mission.config.earth.radius + TARGET_ALTITUDE));
  return Math.abs(d.altitude - TARGET_ALTITUDE) < 1 && Math.abs(d.verticalSpeed) < 0.01
    && Math.abs(d.horizontalSpeed - circular) < 0.01;
}

function holdOnPad(mission, controls, seconds) {
  const before = mission.state;
  const rate = controls.throttle * mission.config.vehicle.maxThrust / (mission.config.vehicle.specificImpulse * STANDARD_GRAVITY);
  const fuelMass = Math.max(reserveFuel(mission.launch.stage), before.fuelMass - rate * seconds);
  const time = before.time + seconds;
  const angle = mission.launch.padAngle + ROTATION * time;
  const x = mission.config.earth.radius * Math.cos(angle), y = mission.config.earth.radius * Math.sin(angle);
  const dry = mission.config.vehicle.dryMass;
  const moon = moonState(time, mission.config);
  const closestAltitude = Math.min(mission.closestAltitude,
    Math.hypot(x - moon.x, y - moon.y) - mission.config.moon.radius);
  // Pad reaction supports and constrains the attached stack until outward lift.
  return { ...mission, closestAltitude, state: { ...before, x, y, vx: -ROTATION * y, vy: ROTATION * x, time, fuelMass,
    deltaVUsed: before.deltaVUsed + mission.config.vehicle.specificImpulse * STANDARD_GRAVITY
      * Math.log((dry + before.fuelMass) / (dry + fuelMass)) } };
}

export function advanceEarthLaunch(mission, manualControls = {}, seconds = 1, { guided = true } = {}) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Launch duration must be finite and nonnegative');
  const manual = checkedControls(manualControls);
  validateMission(mission);
  let next = { ...mission, state: { ...mission.state }, launch: { ...mission.launch } };
  if (next.status !== 'active' || seconds === 0) return next;
  const radius = Math.hypot(next.state.x, next.state.y);
  const moon = moonState(next.state.time, next.config);
  if (radius < next.config.earth.radius - 1e-6 || (next.launch.liftedOff && radius <= next.config.earth.radius)
    || (next.config.moon.enabled && Math.hypot(next.state.x - moon.x, next.state.y - moon.y) <= next.config.moon.radius)
    || radius > 1_000_000_000) {
    return { ...advanceMission(next, manual, seconds, { stopAtFlyby: false }), phase: 'crash' };
  }
  let remaining = seconds;
  while (remaining > 1e-10 && next.status === 'active') {
    if (next.launch.stage === 2 && next.launch.liftedOff && next.phase !== 'departure') return advanceLunarLanding(next, manual, remaining, { guided });
    const stage = next.launch.stage;
    const reserve = reserveFuel(stage);
    const activeFuel = next.state.fuelMass - reserve;
    if (stage < 2 && (activeFuel <= 1e-7 || (stage === 1 && inserted(next)))) {
      next = separateStage(next);
      continue;
    }
    if (stage === 2 && next.launch.liftedOff && next.launch.departureElapsed >= DEPARTURE_SECONDS - 1e-9) {
      next = { ...next, phase: 'transfer', launch: { ...next.launch, departureElapsed: DEPARTURE_SECONDS } };
      continue;
    }
    const guidance = earthLaunchGuidance(next);
    const controls = guided ? guidance : manual;
    const rate = next.state.fuelMass > reserve
      ? controls.throttle * next.config.vehicle.maxThrust / (next.config.vehicle.specificImpulse * STANDARD_GRAVITY) : 0;
    const h = Math.min(remaining, 0.25, rate > 0 ? activeFuel / rate : Infinity,
      stage === 2 && next.launch.liftedOff ? DEPARTURE_SECONDS - next.launch.departureElapsed : Infinity);
    const beforeTime = next.state.time;
    if (!next.launch.liftedOff) {
      const d = earthLaunchDiagnostics(next);
      const a = orbitalAcceleration(next.state, controls, next.config);
      const freeOutward = a.ax * Math.cos(d.radialAngle) + a.ay * Math.sin(d.radialAngle)
        + d.horizontalSpeed ** 2 / (d.altitude + next.config.earth.radius);
      if (freeOutward <= 0) next = holdOnPad(next, controls, h);
      else next = { ...next, state: stepOrbit(next.state, controls, next.config, h),
        launch: { ...next.launch, liftedOff: true } };
    } else next = advanceMission(next, controls, h, { stopAtFlyby: false });
    if (next.status !== 'active') next = { ...next, phase: 'crash' };
    else next.phase = guidance.phase;
    const elapsed = next.state.time - beforeTime;
    if (stage === 2 && next.launch.liftedOff) next = { ...next, launch: { ...next.launch, departureElapsed: next.launch.departureElapsed + elapsed } };
    remaining -= elapsed;
    if (remaining < Math.max(seconds * Number.EPSILON, 1e-10)) remaining = 0;
  }
  return next;
}

export function earthLaunchWarp(mission, effectiveControls = {}, requested = 1, guided = true) {
  const controls = checkedControls(effectiveControls);
  validateMission(mission);
  if (!Number.isFinite(requested) || requested < 1) throw new RangeError('Requested warp must be finite and at least 1');
  if (mission.status !== 'active') return 1;
  if (mission.launch.stage === 2 && mission.phase !== 'departure') return lunarLandingWarp(mission, controls, requested, guided);
  const altitude = earthLaunchDiagnostics(mission).altitude;
  let maximum = mission.phase === 'departure' ? 100 : altitude < 10000 ? 5 : altitude < 200000 ? 20 : 50;
  if (!guided) maximum = Math.min(maximum, safeWarp(mission, controls, requested));
  return Math.min(requested, maximum);
}
