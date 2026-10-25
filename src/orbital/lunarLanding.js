import { moonState } from './bodies.js';
import { createMission, advanceMission, safeWarp } from './mission.js';
import { orbitalAcceleration } from './physics.js';

const APPROACH_ALTITUDE = 20_000_000;
const CONFIG = Object.freeze({
  ...createMission('transfer').config,
  vehicle: Object.freeze({ dryMass: 4000, fuelMass: 16000, specificImpulse: 450, maxThrust: 100000 }),
});

function checkedControls(controls = {}) {
  const throttle = controls.throttle ?? 0;
  const heading = controls.heading ?? 0;
  if (!Number.isFinite(throttle) || !Number.isFinite(heading)) throw new RangeError('Landing controls must be finite');
  return { throttle: Math.max(0, Math.min(1, throttle)), heading };
}

export function createLunarLandingMission() {
  // The 450 s finite burn is reconstructed in the test. Doubling initial mass
  // and thrust preserves the existing departure trajectory exactly.
  const transfer = createMission('transfer');
  return { ...transfer, config: CONFIG,
    state: { ...transfer.state, fuelMass: 5802.837870220537 }, preset: 'landing', phase: 'transfer' };
}

export function lunarLandingDiagnostics(mission) {
  const { state, config } = mission;
  for (const field of ['x', 'y', 'vx', 'vy', 'time', 'fuelMass', 'deltaVUsed']) {
    if (!Number.isFinite(state[field])) throw new RangeError('Landing state must be finite');
  }
  const moon = moonState(state.time, config);
  const x = state.x - moon.x;
  const y = state.y - moon.y;
  const radius = Math.hypot(x, y);
  const angle = Math.atan2(y, x);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const vx = state.vx - moon.vx;
  const vy = state.vy - moon.vy;
  return { altitude: radius - config.moon.radius, verticalSpeed: vx * ux + vy * uy,
    horizontalSpeed: -vx * uy + vy * ux, speed: Math.hypot(vx, vy), radialAngle: angle };
}

export function lunarLandingGuidance(mission) {
  const d = lunarLandingDiagnostics(mission);
  const { state, config } = mission;
  if (mission.status !== 'active' || d.altitude <= 0
    || Math.hypot(state.x, state.y) <= config.earth.radius) {
    return { throttle: 0, heading: d.radialAngle, phase: mission.status === 'landed' ? 'landed' : 'crash' };
  }
  if (d.altitude > APPROACH_ALTITUDE) return { throttle: 0, heading: d.radialAngle, phase: 'transfer' };
  const moon = moonState(state.time, config);
  const omega = 2 * Math.PI / config.moon.period;
  const gravity = orbitalAcceleration(state, {}, config);
  // Subtract the moving Moon's acceleration before resolving relative motion.
  const gx = gravity.ax + omega * omega * moon.x;
  const gy = gravity.ay + omega * omega * moon.y;
  const ux = Math.cos(d.radialAngle);
  const uy = Math.sin(d.radialAngle);
  const radialGravity = gx * ux + gy * uy;
  const tangentGravity = -gx * uy + gy * ux;
  const radius = d.altitude + config.moon.radius;
  const maxAcceleration = config.vehicle.maxThrust / (config.vehicle.dryMass + state.fuelMass);
  const available = Math.max(0.2, maxAcceleration + radialGravity);
  const target = -Math.min(2000, Math.sqrt(2 * 0.35 * available * Math.max(0, d.altitude)),
    d.altitude < 1000 ? Math.max(0.3, d.altitude * 0.1) : Infinity);
  const tau = d.altitude < 100 ? 0.5 : d.altitude < 1000 ? 1 : d.altitude < 10000 ? 3 : 15;
  let radial = Math.max(0, (target - d.verticalSpeed) / tau - radialGravity - d.horizontalSpeed ** 2 / radius);
  const tangent = -d.horizontalSpeed / 40 - tangentGravity + d.verticalSpeed * d.horizontalSpeed / radius;
  // Permit ballistic inward motion while safely outside the braking envelope.
  if (d.verticalSpeed > target && d.altitude > 2000) radial = 0;
  const ax = radial * ux - tangent * uy;
  const ay = radial * uy + tangent * ux;
  const phase = d.altitude < 1000 ? 'final-descent' : d.altitude < 10000 ? 'descent'
    : radial > 1 ? 'braking' : 'approach';
  return { throttle: state.fuelMass > 0 && maxAcceleration > 0
    ? Math.min(1, Math.hypot(ax, ay) / maxAcceleration) : 0, heading: Math.atan2(ay, ax), phase };
}

function finishContact(mission, controls) {
  if (mission.status !== 'moon-impact') return { ...mission, phase: 'crash' };
  const d = lunarLandingDiagnostics(mission);
  const tilt = Math.abs(Math.atan2(Math.sin(controls.heading - d.radialAngle), Math.cos(controls.heading - d.radialAngle)));
  const touchdown = { verticalSpeed: d.verticalSpeed, horizontalSpeed: d.horizontalSpeed,
    speed: d.speed, tilt, heading: controls.heading, time: mission.state.time, fuelMass: mission.state.fuelMass };
  if (Math.abs(d.verticalSpeed) > 2 || Math.abs(d.horizontalSpeed) > 1 || tilt > 10 * Math.PI / 180) {
    return { ...mission, phase: 'crash', touchdown };
  }
  const moon = moonState(mission.state.time, mission.config);
  return { ...mission, status: 'landed', phase: 'landed', touchdown,
    state: { ...mission.state, vx: moon.vx, vy: moon.vy } };
}

export function advanceLunarLanding(mission, manualControls = {}, seconds = 1, { guided = true } = {}) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Landing duration must be finite and nonnegative');
  const manual = checkedControls(manualControls);
  let next = { ...mission, state: { ...mission.state } };
  if (next.status !== 'active' || seconds === 0) return next;
  // Reuse the original collision path to reject existing overlaps before any
  // gravity evaluation. An initial overlap is never a successful touchdown.
  const d = lunarLandingDiagnostics(next);
  if (d.altitude <= 0 || Math.hypot(next.state.x, next.state.y) <= next.config.earth.radius
    || Math.hypot(next.state.x, next.state.y) > 1_000_000_000) {
    next = advanceMission(next, manual, seconds, { stopAtFlyby: false });
    return { ...next, phase: 'crash' };
  }
  let remaining = seconds;
  while (remaining > 0 && next.status === 'active') {
    const guidance = lunarLandingGuidance(next);
    const controls = guided ? guidance : manual;
    const h = Math.min(remaining, guidance.phase === 'transfer' ? 1 : 0.25);
    next = advanceMission(next, controls, h, { stopAtFlyby: false });
    next.phase = guidance.phase;
    if (next.status !== 'active') return finishContact(next, controls);
    remaining -= h;
    if (remaining < Math.max(seconds * Number.EPSILON, 1e-10)) remaining = 0;
  }
  return next;
}

export function lunarLandingWarp(mission, effectiveControls = {}, requested = 1, guided = true) {
  const controls = checkedControls(effectiveControls);
  // safeWarp supplies the existing finite-input validation and manual burn cap.
  const manualMaximum = safeWarp(mission, controls, requested);
  const d = lunarLandingDiagnostics(mission);
  const earthAltitude = Math.hypot(mission.state.x, mission.state.y) - mission.config.earth.radius;
  const altitude = Math.min(d.altitude, earthAltitude);
  let maximum = d.altitude > APPROACH_ALTITUDE ? 10000 : 1000;
  if (altitude < 100000) maximum = 100;
  if (altitude < 10000) maximum = 10;
  // Keep final approach visible while preserving a short classroom demo.
  // Guidance still updates every quarter second at every allowed warp.
  if (d.altitude < 3 || earthAltitude < 100) maximum = 1;
  if (!guided) maximum = Math.min(maximum, manualMaximum);
  if (mission.status !== 'active') maximum = 1;
  return Math.min(requested, maximum);
}
