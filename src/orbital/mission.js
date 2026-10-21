import { ORBIT_CONFIG, STANDARD_GRAVITY } from './config.js';
import { moonState } from './bodies.js';
import { createOrbitState, orbitalAcceleration, stepOrbit } from './physics.js';

const FLYBY_ALTITUDE = 20_000_000;
const LOST_RADIUS = 1_000_000_000;
// Reconstructed and flight-tested in mission.test.js; see docs/flyby-preset.md.
const DEPARTURE_STATE = Object.freeze({
  x: 5810713.295755245, y: 3907260.8748479267,
  vx: -4435.215612741942, vy: 9649.438753251181,
  fuelMass: 901.4189351102686, time: 450, deltaVUsed: 3146.72998190761,
});
const TRANSFER_CONFIG = Object.freeze({
  ...ORBIT_CONFIG,
  moon: Object.freeze({ ...ORBIT_CONFIG.moon, phase: 2.6 }),
});

function lunarAltitude(state, config) {
  const moon = moonState(state.time, config);
  return Math.hypot(state.x - moon.x, state.y - moon.y) - config.moon.radius;
}

function checkedControls(controls) {
  const throttle = controls.throttle ?? 0;
  const heading = controls.heading ?? 0;
  if (!Number.isFinite(throttle) || !Number.isFinite(heading)) {
    throw new RangeError('Mission controls must be finite');
  }
  return { throttle: Math.max(0, Math.min(1, throttle)), heading };
}

export function createMission(preset = 'leo', vehicleOverrides = {}) {
  if (preset !== 'leo' && preset !== 'transfer') throw new RangeError('Unknown mission preset');
  if (!vehicleOverrides || typeof vehicleOverrides !== 'object' || Array.isArray(vehicleOverrides)
    || Object.keys(vehicleOverrides).some((key) => !Object.hasOwn(ORBIT_CONFIG.vehicle, key))) {
    throw new RangeError('Invalid vehicle overrides');
  }
  const custom = Object.keys(vehicleOverrides).length > 0;
  if (preset === 'transfer' && custom) throw new RangeError('Transfer preset uses its verified fixed vehicle');
  const config = preset === 'transfer' ? TRANSFER_CONFIG : custom
    ? { ...ORBIT_CONFIG, vehicle: { ...ORBIT_CONFIG.vehicle, ...vehicleOverrides } } : ORBIT_CONFIG;
  const state = preset === 'transfer' ? { ...DEPARTURE_STATE } : createOrbitState(config);
  return { state, config, status: 'active', closestAltitude: lunarAltitude(state, config), preset };
}

// Both roots matter: a segment can enter and exit a body with outside endpoints.
function circleRoots(x, y, dx, dy, radius) {
  const a = dx * dx + dy * dy;
  if (a === 0) return [];
  const b = 2 * (x * dx + y * dy);
  const c = x * x + y * y - radius * radius;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];
  const q = -0.5 * (b + (b < 0 ? -1 : 1) * Math.sqrt(discriminant));
  const roots = q === 0 ? [0] : [q / a, c / q];
  return roots.filter((f) => f >= 0 && f <= 1).sort((u, v) => u - v);
}

function closestLunarAltitude(before, after, config) {
  const m0 = moonState(before.time, config);
  const m1 = moonState(after.time, config);
  const x = before.x - m0.x;
  const y = before.y - m0.y;
  const dx = after.x - m1.x - x;
  const dy = after.y - m1.y - y;
  const length2 = dx * dx + dy * dy;
  const fraction = length2 > 0 ? Math.max(0, Math.min(1, -(x * dx + y * dy) / length2)) : 0;
  return Math.hypot(x + fraction * dx, y + fraction * dy) - config.moon.radius;
}

function initialOutcome(state, config) {
  if (Math.hypot(state.x, state.y) <= config.earth.radius) return 'earth-impact';
  if (config.moon.enabled && lunarAltitude(state, config) <= 0) return 'moon-impact';
  if (Math.hypot(state.x, state.y) > LOST_RADIUS) return 'lost';
  return 'active';
}

function surfaceEvent(before, endpoint, config) {
  const dx = endpoint.x - before.x;
  const dy = endpoint.y - before.y;
  const events = [];
  const earth = circleRoots(before.x, before.y, dx, dy, config.earth.radius)[0];
  if (earth !== undefined) events.push({ fraction: earth, status: 'earth-impact' });
  if (config.moon.enabled) {
    const m0 = moonState(before.time, config);
    const m1 = moonState(endpoint.time, config);
    const moon = circleRoots(before.x - m0.x, before.y - m0.y,
      dx - (m1.x - m0.x), dy - (m1.y - m0.y), config.moon.radius)[0];
    if (moon !== undefined) events.push({ fraction: moon, status: 'moon-impact' });
  }
  if (Math.hypot(endpoint.x, endpoint.y) > LOST_RADIUS) {
    const fraction = circleRoots(before.x, before.y, dx, dy, LOST_RADIUS).at(-1);
    if (fraction !== undefined) events.push({ fraction, status: 'lost' });
  }
  return events.sort((a, b) => a.fraction - b.fraction)[0];
}

export function advanceMission(mission, controls = {}, seconds = 1, options = {}) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Mission duration must be finite and nonnegative');
  const input = checkedControls(controls);
  const config = mission.config;
  let state = { ...mission.state };
  let status = mission.status;
  let closestAltitude = mission.closestAltitude;
  if (status !== 'active' || seconds === 0) return { ...mission, state };
  status = initialOutcome(state, config);
  if (status !== 'active') {
    return { ...mission, state, status, closestAltitude: Math.min(closestAltitude, lunarAltitude(state, config)) };
  }
  let remaining = seconds;
  while (remaining > 0 && status === 'active') {
    const powered = input.throttle > 0 && state.fuelMass > 0;
    const burnRate = powered ? input.throttle * config.vehicle.maxThrust
      / (config.vehicle.specificImpulse * STANDARD_GRAVITY) : 0;
    const burnTime = burnRate > 0 ? state.fuelMass / burnRate : Infinity;
    const h = Math.min(remaining, 1, powered ? config.maxBurnStep : config.maxCoastStep, burnTime);
    const before = state;
    const { ax, ay } = orbitalAcceleration(before, input, config);
    // Predict the Verlet position first so a body-center endpoint cannot be sampled.
    const endpoint = {
      ...before, time: before.time + h,
      x: before.x + before.vx * h + 0.5 * ax * h * h,
      y: before.y + before.vy * h + 0.5 * ay * h * h,
    };
    const event = surfaceEvent(before, endpoint, config);
    const elapsed = event ? h * event.fraction : h;
    state = elapsed > 0 ? stepOrbit(before, input, config, elapsed) : { ...before };
    if (event) {
      state.x = before.x + (endpoint.x - before.x) * event.fraction;
      state.y = before.y + (endpoint.y - before.y) * event.fraction;
      const center = event.status === 'moon-impact' ? moonState(state.time, config) : { x: 0, y: 0 };
      const radius = event.status === 'earth-impact' ? config.earth.radius
        : event.status === 'moon-impact' ? config.moon.radius : LOST_RADIUS;
      const distance = Math.hypot(state.x - center.x, state.y - center.y);
      state.x = center.x + (state.x - center.x) * radius / distance;
      state.y = center.y + (state.y - center.y) * radius / distance;
      status = event.status;
    }
    closestAltitude = Math.min(closestAltitude, closestLunarAltitude(before, state, config));
    if (status === 'moon-impact') closestAltitude = 0;
    if (status === 'active' && options.stopAtFlyby !== false && config.moon.enabled && closestAltitude <= FLYBY_ALTITUDE) status = 'flyby';
    remaining -= elapsed;
    if (remaining < seconds * Number.EPSILON) remaining = 0;
  }
  return { ...mission, state, status, closestAltitude };
}

export function safeWarp(mission, controls = {}, requested = 1) {
  if (!Number.isFinite(requested) || requested < 1) throw new RangeError('Requested warp must be finite and at least 1');
  const input = checkedControls(controls);
  let maximum = 10_000;
  if (input.throttle > 0 && mission.state.fuelMass > 0) maximum = 10;
  else if (Math.hypot(mission.state.x, mission.state.y) - mission.config.earth.radius < 100_000
    || (mission.config.moon.enabled && lunarAltitude(mission.state, mission.config) <= 10_000_000)) maximum = 100;
  return Math.min(requested, maximum);
}



