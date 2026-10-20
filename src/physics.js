import { DEFAULT_CONFIG, STANDARD_GRAVITY } from './config.js';

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

export function createInitialState(config = DEFAULT_CONFIG, overrides = {}) {
  return {
    x: 0,
    y: 400,
    vx: 0,
    vy: -25,
    fuelMass: config.vehicle.fuelMass,
    time: 0,
    dragLoss: 0,
    ...overrides,
  };
}

function atmosphere(y, planet) {
  if (planet.surfaceDensity === 0) return 0;
  // Exponential atmosphere: rho(h) = rho0 exp(-h/H).
  return planet.surfaceDensity * Math.exp(-Math.max(0, y) / planet.scaleHeight);
}

function forces(state, config, thrust, angle) {
  const mass = config.vehicle.dryMass + Math.max(0, state.fuelMass);
  const speed = Math.hypot(state.vx, state.vy);
  const rho = config.dragEnabled === false ? 0 : atmosphere(state.y, config.planet);
  const dragScale = 0.5 * rho * config.vehicle.dragCoefficient * config.vehicle.referenceArea * speed;
  const dragX = -dragScale * state.vx;
  const dragY = -dragScale * state.vy;
  return {
    // Angle is measured from vertical. Newton's second law: a = F/m.
    ax: (thrust * Math.sin(angle) + dragX) / mass,
    ay: (thrust * Math.cos(angle) + dragY) / mass - config.planet.gravity,
    dragPower: dragScale * speed * speed,
  };
}

export function acceleration(state, controls = {}, config = DEFAULT_CONFIG) {
  const throttle = clamp(controls.throttle ?? 0, 0, 1);
  const angle = controls.angle ?? 0;
  const thrust = state.fuelMass > 0 ? throttle * config.vehicle.maxThrust : 0;
  return forces(state, config, thrust, angle);
}

function derivative(state, config, thrust, angle, burnRate) {
  const a = forces(state, config, thrust, angle);
  return {
    x: state.vx,
    y: state.vy,
    vx: a.ax,
    vy: a.ay,
    fuelMass: -burnRate,
    time: 1,
    dragLoss: a.dragPower,
  };
}

const fields = ['x', 'y', 'vx', 'vy', 'fuelMass', 'time', 'dragLoss'];

function addScaled(state, delta, scale) {
  const next = { ...state };
  for (const field of fields) next[field] = state[field] + delta[field] * scale;
  return next;
}

function integrate(state, config, thrust, angle, burnRate, dt, method) {
  if (dt === 0) return { ...state };
  if (method === 'euler') {
    const d = derivative(state, config, thrust, angle, burnRate);
    const vx = state.vx + d.vx * dt;
    const vy = state.vy + d.vy * dt;
    return {
      ...state,
      // Semi-implicit Euler: update velocity before position.
      x: state.x + vx * dt,
      y: state.y + vy * dt,
      vx,
      vy,
      fuelMass: Math.max(0, state.fuelMass - burnRate * dt),
      time: state.time + dt,
      dragLoss: state.dragLoss + d.dragLoss * dt,
    };
  }

  const k1 = derivative(state, config, thrust, angle, burnRate);
  const k2 = derivative(addScaled(state, k1, dt / 2), config, thrust, angle, burnRate);
  const k3 = derivative(addScaled(state, k2, dt / 2), config, thrust, angle, burnRate);
  const k4 = derivative(addScaled(state, k3, dt), config, thrust, angle, burnRate);
  const next = { ...state };
  for (const field of fields) {
    next[field] = state[field] + dt * (k1[field] + 2 * k2[field] + 2 * k3[field] + k4[field]) / 6;
  }
  next.fuelMass = Math.max(0, next.fuelMass);
  return next;
}

function stopAtGround(before, after) {
  if (after.y > 0 || before.y <= 0) return after;
  const fraction = before.y / (before.y - after.y);
  const impact = { ...after, y: 0 };
  for (const field of ['x', 'vx', 'vy', 'fuelMass', 'time', 'dragLoss']) {
    impact[field] = before[field] + (after[field] - before[field]) * fraction;
  }
  return impact;
}

export function stepPhysics(state, controls = {}, config = DEFAULT_CONFIG, dt = 1 / 120, method = 'euler') {
  if (!Number.isFinite(dt) || dt <= 0) throw new RangeError('dt must be positive and finite');
  if (method !== 'euler' && method !== 'rk4') throw new RangeError('method must be euler or rk4');
  const throttle = clamp(controls.throttle ?? 0, 0, 1);
  const angle = controls.angle ?? 0;
  if (!Number.isFinite(throttle) || !Number.isFinite(angle)) throw new RangeError('controls must be finite');
  if (state.y <= 0) return { ...state, y: 0 };

  const thrust = state.fuelMass > 0 ? throttle * config.vehicle.maxThrust : 0;
  // Propellant mass flow: mdot = T / (Isp * g0).
  const burnRate = thrust / (config.vehicle.specificImpulse * STANDARD_GRAVITY);
  const poweredTime = burnRate > 0 ? Math.min(dt, state.fuelMass / burnRate) : 0;
  let next = state;

  if (poweredTime > 0) {
    next = stopAtGround(next, integrate(next, config, thrust, angle, burnRate, poweredTime, method));
    if (next.y === 0) return next;
  }

  const coastTime = dt - poweredTime;
  if (coastTime > 0) {
    next = stopAtGround(next, integrate(next, config, 0, angle, 0, coastTime, method));
  }
  return next;
}

export function energy(state, config = DEFAULT_CONFIG) {
  const mass = config.vehicle.dryMass + state.fuelMass;
  // Mechanical energy excludes chemical fuel energy and exhaust energy.
  const kinetic = 0.5 * mass * (state.vx ** 2 + state.vy ** 2);
  const potential = mass * config.planet.gravity * Math.max(0, state.y);
  return { kinetic, potential, mechanical: kinetic + potential };
}

export function landingOutcome(state, config = DEFAULT_CONFIG) {
  if (state.y > 0) return 'in-flight';
  const { padCenterX, padHalfWidth, safeVerticalSpeed, safeHorizontalSpeed } = config.landing;
  const onPad = Math.abs(state.x - padCenterX) <= padHalfWidth;
  const safe = Math.abs(state.vy) <= safeVerticalSpeed && Math.abs(state.vx) <= safeHorizontalSpeed;
  return onPad && safe ? 'landed' : 'crashed';
}
