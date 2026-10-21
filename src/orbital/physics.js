import { ORBIT_CONFIG, STANDARD_GRAVITY } from './config.js';
import { moonState } from './bodies.js';
import { atmosphericDragAcceleration } from './atmosphere.js';

function requireNumber(value, name, minimum = -Infinity, strict = false) {
  if (!Number.isFinite(value) || (strict ? value <= minimum : value < minimum)) {
    throw new RangeError(`${name} is outside its finite physical range`);
  }
}

function validateConfig(config) {
  for (const body of ['earth', 'moon']) {
    requireNumber(config[body].mu, `${body}.mu`, 0);
    requireNumber(config[body].radius, `${body}.radius`, 0, true);
  }
  requireNumber(config.moon.orbitRadius, 'moon.orbitRadius', 0, true);
  requireNumber(config.moon.period, 'moon.period', 0, true);
  requireNumber(config.moon.phase, 'moon.phase');
  requireNumber(config.vehicle.dryMass, 'vehicle.dryMass', 0, true);
  requireNumber(config.vehicle.fuelMass, 'vehicle.fuelMass', 0);
  requireNumber(config.vehicle.maxThrust, 'vehicle.maxThrust', 0);
  requireNumber(config.vehicle.specificImpulse, 'vehicle.specificImpulse', 0, true);
  requireNumber(config.initialAltitude, 'initialAltitude', 0);
  requireNumber(config.maxCoastStep, 'maxCoastStep', 0, true);
  requireNumber(config.maxBurnStep, 'maxBurnStep', 0, true);
}

function validateState(state) {
  for (const field of ['x', 'y', 'vx', 'vy', 'time']) requireNumber(state[field], field);
  requireNumber(state.fuelMass, 'fuelMass', 0);
  requireNumber(state.deltaVUsed, 'deltaVUsed', 0);
}

function readControls(controls) {
  const throttle = controls.throttle ?? 0;
  const heading = controls.heading ?? 0;
  requireNumber(throttle, 'throttle');
  requireNumber(heading, 'heading');
  return { throttle: Math.max(0, Math.min(1, throttle)), heading };
}

export function createOrbitState(config = ORBIT_CONFIG, overrides = {}) {
  validateConfig(config);
  const radius = config.earth.radius + config.initialAltitude;
  const state = {
    x: radius, y: 0, vx: 0, vy: Math.sqrt(config.earth.mu / radius),
    fuelMass: config.vehicle.fuelMass, time: 0, deltaVUsed: 0, ...overrides,
  };
  validateState(state);
  return state;
}

function accelerationAt(state, config, thrust, heading) {
  let ax = 0;
  let ay = 0;
  if (config.earth.mu > 0) {
    const radius = Math.hypot(state.x, state.y);
    if (radius === 0) throw new RangeError('Earth point-mass singularity');
    const factor = -config.earth.mu / radius ** 3;
    ax += factor * state.x;
    ay += factor * state.y;
  }
  if (config.moon.enabled && config.moon.mu > 0) {
    const moon = moonState(state.time, config);
    const dx = moon.x - state.x;
    const dy = moon.y - state.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) throw new RangeError('Moon point-mass singularity');
    const direct = config.moon.mu / distance ** 3;
    const indirect = config.moon.mu / config.moon.orbitRadius ** 3;
    // Differential third-body acceleration: Moon pulls ship AND Earth's origin.
    ax += direct * dx - indirect * moon.x;
    ay += direct * dy - indirect * moon.y;
  }
  const thrustAcceleration = thrust / (config.vehicle.dryMass + state.fuelMass);
  ax += thrustAcceleration * Math.cos(heading);
  ay += thrustAcceleration * Math.sin(heading);
  if (config.atmosphere?.enabled) {
    const drag = atmosphericDragAcceleration(state, config);
    ax += drag.ax;
    ay += drag.ay;
  }
  return { ax, ay };
}

export function orbitalAcceleration(state, controls = {}, config = ORBIT_CONFIG) {
  validateConfig(config);
  validateState(state);
  const { throttle, heading } = readControls(controls);
  const thrust = state.fuelMass > 0 ? throttle * config.vehicle.maxThrust : 0;
  return accelerationAt(state, config, thrust, heading);
}

function verlet(state, config, thrust, heading, burnRate, dt) {
  const a0 = accelerationAt(state, config, thrust, heading);
  const next = {
    ...state,
    x: state.x + state.vx * dt + 0.5 * a0.ax * dt ** 2,
    y: state.y + state.vy * dt + 0.5 * a0.ay * dt ** 2,
    time: state.time + dt,
    fuelMass: Math.max(0, state.fuelMass - burnRate * dt),
  };
  // Endpoint thrust uses endpoint mass, including the final powered instant.
  const a1 = accelerationAt(next, config, thrust, heading);
  next.vx = state.vx + 0.5 * (a0.ax + a1.ax) * dt;
  next.vy = state.vy + 0.5 * (a0.ay + a1.ay) * dt;
  return next;
}

function rk4(state, config, thrust, heading, burnRate, dt) {
  const derivative = (sample) => {
    const { ax, ay } = accelerationAt(sample, config, thrust, heading);
    return { x: sample.vx, y: sample.vy, vx: ax, vy: ay };
  };
  const sampleAt = (slope, offset) => ({
    ...state,
    x: state.x + slope.x * offset, y: state.y + slope.y * offset,
    vx: state.vx + slope.vx * offset, vy: state.vy + slope.vy * offset,
    fuelMass: Math.max(0, state.fuelMass - burnRate * offset),
    time: state.time + offset,
  });
  const k1 = derivative(state);
  const k2 = derivative(sampleAt(k1, dt / 2));
  const k3 = derivative(sampleAt(k2, dt / 2));
  const k4 = derivative(sampleAt(k3, dt));
  const next = {
    ...state, time: state.time + dt,
    fuelMass: Math.max(0, state.fuelMass - burnRate * dt),
  };
  for (const field of ['x', 'y', 'vx', 'vy']) {
    next[field] += dt * (k1[field] + 2 * k2[field] + 2 * k3[field] + k4[field]) / 6;
  }
  return next;
}

// Integrates elapsed simulation seconds, independently of display frame rate.
// A browser scheduler must budget elapsed time; this synchronous API does not.
export function stepOrbit(state, controls = {}, config = ORBIT_CONFIG, dt = 1, method = 'verlet') {
  validateConfig(config);
  validateState(state);
  requireNumber(dt, 'dt', 0, true);
  if (method !== 'verlet' && method !== 'rk4') throw new RangeError('Unknown orbital integrator');
  const { throttle, heading } = readControls(controls);
  const integrate = method === 'verlet' ? verlet : rk4;
  let next = { ...state };
  let remaining = dt;
  while (remaining > 0) {
    const thrust = next.fuelMass > 0 ? throttle * config.vehicle.maxThrust : 0;
    // mdot = T/(Isp*g0). A substep ends exactly at propellant exhaustion.
    const burnRate = thrust / (config.vehicle.specificImpulse * STANDARD_GRAVITY);
    const burnTime = burnRate > 0 ? next.fuelMass / burnRate : Infinity;
    const h = Math.min(remaining, thrust > 0 ? config.maxBurnStep : config.maxCoastStep, burnTime);
    const before = next;
    next = integrate(before, config, thrust, heading, burnRate, h);
    if (burnRate > 0 && h === burnTime) next.fuelMass = 0;
    // Integrated thrust acceleration magnitude: ideal rocket-equation delta-v.
    next.deltaVUsed += config.vehicle.specificImpulse * STANDARD_GRAVITY
      * Math.log((config.vehicle.dryMass + before.fuelMass) / (config.vehicle.dryMass + next.fuelMass));
    remaining -= h;
    if (remaining < dt * Number.EPSILON) remaining = 0;
  }
  next.time = state.time + dt;
  validateState(next);
  return next;
}

export function orbitalEnergy(state, config = ORBIT_CONFIG) {
  validateConfig(config);
  validateState(state);
  const radius = Math.hypot(state.x, state.y);
  if (config.earth.mu > 0 && radius === 0) throw new RangeError('Earth point-mass singularity');
  const mass = config.vehicle.dryMass + state.fuelMass;
  const kineticSpecific = 0.5 * (state.vx ** 2 + state.vy ** 2);
  let potentialSpecific = config.earth.mu > 0 ? -config.earth.mu / radius : 0;
  if (config.moon.enabled && config.moon.mu > 0) {
    const moon = moonState(state.time, config);
    const distance = Math.hypot(state.x - moon.x, state.y - moon.y);
    if (distance === 0) throw new RangeError('Moon point-mass singularity');
    // -grad(U) matches differential gravity, including the indirect potential.
    potentialSpecific += -config.moon.mu / distance + config.moon.mu
      * (state.x * moon.x + state.y * moon.y) / config.moon.orbitRadius ** 3;
  }
  const specific = kineticSpecific + potentialSpecific;
  return { kinetic: mass * kineticSpecific, potential: mass * potentialSpecific, total: mass * specific, specific };
}

export function orbitElements(state, config = ORBIT_CONFIG) {
  validateConfig(config);
  validateState(state);
  const mu = config.earth.mu;
  const radius = Math.hypot(state.x, state.y);
  if (mu <= 0 || radius === 0) throw new RangeError('Orbital elements need positive Earth mu and radius');
  const v2 = state.vx ** 2 + state.vy ** 2;
  const radialDot = state.x * state.vx + state.y * state.vy;
  const angularMomentum = state.x * state.vy - state.y * state.vx;
  const specificEnergy = 0.5 * v2 - mu / radius;
  // Eccentricity vector avoids subtracting nearly equal scalars near a circle.
  const ex = ((v2 - mu / radius) * state.x - radialDot * state.vx) / mu;
  const ey = ((v2 - mu / radius) * state.y - radialDot * state.vy) / mu;
  const eccentricity = Math.hypot(ex, ey);
  const bound = specificEnergy < -16 * Number.EPSILON * mu / radius;
  const semiMajor = bound ? -mu / (2 * specificEnergy) : null;
  return {
    eccentricity, specificEnergy, angularMomentum,
    periapsis: angularMomentum ** 2 / (mu * (1 + eccentricity)),
    apoapsis: bound ? semiMajor * (1 + eccentricity) : null,
    period: bound ? 2 * Math.PI * Math.sqrt(semiMajor ** 3 / mu) : null,
    circularSpeed: Math.sqrt(mu / radius),
  };
}

export function remainingDeltaV(state, config = ORBIT_CONFIG) {
  validateConfig(config);
  validateState(state);
  return config.vehicle.specificImpulse * STANDARD_GRAVITY
    * Math.log1p(state.fuelMass / config.vehicle.dryMass);
}
