import test from 'node:test';
import assert from 'node:assert/strict';
import { ORBIT_CONFIG } from '../orbital/config.js';
import { moonState } from '../orbital/bodies.js';
import {
  createOrbitState, orbitalAcceleration, stepOrbit,
  orbitalEnergy, orbitElements, remainingDeltaV,
} from '../orbital/physics.js';

const earthOnly = { ...ORBIT_CONFIG, moon: { ...ORBIT_CONFIG.moon, enabled: false } };
const vacuum = { ...earthOnly, earth: { ...earthOnly.earth, mu: 0 } };
const near = (actual, expected, tolerance, label = '') =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} versus ${expected}`);

test('initial LEO balances Earth gravity with circular motion', () => {
  const state = createOrbitState(earthOnly);
  near(state.x, 6_771_000, 1e-6, 'orbital radius');
  near(state.vy, 7672.598431, 0.001, 'circular speed');
  const a = orbitalAcceleration(state, {}, earthOnly);
  near(a.ax, -(state.vy ** 2) / state.x, 1e-10, 'centripetal acceleration');
  near(a.ay, 0, 1e-12);
});

test('Moon ephemeris returns position and velocity at a quarter orbit', () => {
  const moon = moonState(590_112, ORBIT_CONFIG);
  near(moon.x, 0, 1e-6);
  near(moon.y, 384_400_000, 1e-6);
  near(moon.vx, -1023.219504, 0.001);
  near(moon.vy, 0, 1e-10);
});

test('Earth-centered lunar gravity subtracts Earth acceleration', () => {
  const state = createOrbitState(vacuum, { x: 100_000_000, y: 0 });
  const config = { ...vacuum, moon: ORBIT_CONFIG.moon };
  const a = orbitalAcceleration(state, {}, config);
  // Hand calculation mu*(1/284400000² - 1/384400000²).
  near(a.ax, 0.00002744679417, 1e-12);
  near(a.ay, 0, 1e-12);
  const center = orbitalAcceleration({ ...state, x: 0 }, {}, config);
  near(center.ax, 0, 1e-12, 'no spurious translation of the origin');
});

test('thrust follows inertial heading and clamps throttle', () => {
  const state = createOrbitState(vacuum);
  const a = orbitalAcceleration(state, { throttle: 2, heading: Math.PI / 2 }, vacuum);
  near(a.ax, 0, 1e-12);
  near(a.ay, 5, 1e-12);
  near(orbitalAcceleration(state, { throttle: -1 }, vacuum).ax, 0, 1e-12);
});

for (const method of ['verlet', 'rk4']) {
  test(`${method}: ten Earth-only orbits preserve radius, energy and period`, (t) => {
    const config = { ...earthOnly, maxCoastStep: 10 };
    let state = createOrbitState(config);
    const radius = 6_771_000;
    const expectedPeriod = 2 * Math.PI * Math.sqrt(radius ** 3 / 3.986004e14);
    const initialEnergy = -3.986004e14 / (2 * radius);
    let radiusError = 0;
    let energyError = 0;
    let measuredPeriod;
    while (state.time < 10 * expectedPeriod) {
      const before = state;
      state = stepOrbit(state, {}, config, 10, method);
      radiusError = Math.max(radiusError, Math.abs(Math.hypot(state.x, state.y) / radius - 1));
      energyError = Math.max(energyError,
        Math.abs((orbitalEnergy(state, config).specific - initialEnergy) / initialEnergy));
      if (!measuredPeriod && before.y < 0 && state.y >= 0 && state.x > 0) {
        measuredPeriod = before.time + 10 * (-before.y) / (state.y - before.y);
      }
    }
    assert.ok(radiusError < 0.01, `radius error ${radiusError}`);
    assert.ok(energyError < 0.001, `energy error ${energyError}`);
    assert.ok(Math.abs(measuredPeriod / expectedPeriod - 1) < 0.005, `period ${measuredPeriod}`);
    t.diagnostic(`max radius error=${(radiusError * 100).toFixed(7)}%; max specific energy error=${(energyError * 100).toFixed(9)}%; period=${measuredPeriod.toFixed(4)} s; analytical=${expectedPeriod.toFixed(4)} s`);
  });

  test(`${method}: zero-gravity burn matches the rocket equation`, (t) => {
    let state = createOrbitState(vacuum, { vx: 0, vy: 0 });
    for (let i = 0; i < 100; i++) {
      state = stepOrbit(state, { throttle: 1, heading: 0 }, vacuum, 1, method);
    }
    const finalMass = 10_000 - 50_000 * 100 / (450 * 9.80665);
    const expected = 450 * 9.80665 * Math.log(10_000 / finalMass);
    near(state.fuelMass, finalMass - 4000, 1e-7);
    near(state.vx, expected, expected * 0.01);
    near(state.vy, 0, 1e-12);
    near(state.deltaVUsed, expected, 1e-7);
    t.diagnostic(`burn delta-v=${state.vx.toFixed(6)} m/s; rocket equation=${expected.toFixed(6)} m/s`);
  });

  test(`${method}: fuel exhaustion splits powered motion from coasting`, () => {
    const vehicle = { dryMass: 1000, fuelMass: 1, specificImpulse: 100, maxThrust: 980.665 };
    const config = { ...vacuum, vehicle };
    const state = createOrbitState(config, { vx: 0, vy: 0 });
    const after = stepOrbit(state, { throttle: 1, heading: 0 }, config, 10, method);
    near(after.fuelMass, 0, 1e-12);
    near(after.vx, 100 * 9.80665 * Math.log(1001 / 1000), 1e-7);
    const coast = stepOrbit(after, { throttle: 1 }, config, 10, method);
    near(coast.vx, after.vx, 1e-12);
    near(coast.x - after.x, after.vx * 10, 1e-7);
    near(after.time, 10, 1e-12);
    assert.equal(state.fuelMass, 1);
  });

  test(`${method}: moving-Moon integration agrees with a smaller reference step`, () => {
    const config = { ...ORBIT_CONFIG, maxCoastStep: 10 };
    const start = createOrbitState(config, { x: 370_000_000, y: 8_000_000, vx: -300, vy: 1500 });
    const actual = stepOrbit(start, {}, config, 100, method);
    const reference = stepOrbit(start, {}, { ...config, maxCoastStep: 0.1 }, 100, 'rk4');
    near(actual.x, reference.x, 0.1);
    near(actual.y, reference.y, 0.1);
    near(actual.vx, reference.vx, 0.001);
    near(actual.vy, reference.vy, 0.001);
    assert.equal(start.time, 0);
  });
}

test('readouts distinguish circular, escape and radial trajectories', () => {
  const state = createOrbitState(earthOnly);
  const circular = orbitElements(state, earthOnly);
  near(circular.eccentricity, 0, 1e-12);
  near(circular.periapsis, 6_771_000, 1e-6);
  near(circular.apoapsis, 6_771_000, 1e-6);
  near(circular.period, 5544.855, 0.01);
  const escape = orbitElements({ ...state, vy: 12_000 }, earthOnly);
  assert.ok(escape.eccentricity > 1);
  assert.equal(escape.apoapsis, null);
  assert.equal(escape.period, null);
  const radial = orbitElements({ ...state, vx: 100, vy: 0 }, earthOnly);
  near(radial.periapsis, 0, 1e-10);
  assert.ok(Number.isFinite(radial.apoapsis));
  near(remainingDeltaV(state, earthOnly), 4043.5841, 0.01);
  assert.equal(remainingDeltaV({ ...state, fuelMass: 0 }, earthOnly), 0);
});

test('potential includes the indirect term consistent with lunar acceleration', () => {
  const state = createOrbitState(ORBIT_CONFIG, { x: 100_000_000, y: 30_000_000, vx: 0, vy: 0 });
  const h = 10;
  const derivative = (axis) => {
    const plus = orbitalEnergy({ ...state, [axis]: state[axis] + h }, ORBIT_CONFIG).specific;
    const minus = orbitalEnergy({ ...state, [axis]: state[axis] - h }, ORBIT_CONFIG).specific;
    return -(plus - minus) / (2 * h);
  };
  const a = orbitalAcceleration(state, {}, ORBIT_CONFIG);
  near(a.ax, derivative('x'), 1e-10);
  near(a.ay, derivative('y'), 1e-10);
});

test('invalid states, controls, durations and configurations fail explicitly', () => {
  const state = createOrbitState();
  for (const dt of [0, -1, NaN, Infinity]) {
    assert.throws(() => stepOrbit(state, {}, ORBIT_CONFIG, dt), RangeError);
  }
  assert.throws(() => stepOrbit(state, {}, ORBIT_CONFIG, 1, 'unknown'), RangeError);
  assert.throws(() => stepOrbit(state, { heading: NaN }), RangeError);
  assert.throws(() => stepOrbit(state, { throttle: Infinity }), RangeError);
  assert.throws(() => createOrbitState(ORBIT_CONFIG, { fuelMass: -1 }), RangeError);
  assert.throws(() => stepOrbit({ ...state, vx: NaN }), RangeError);
  assert.throws(() => createOrbitState({ ...ORBIT_CONFIG, maxCoastStep: 0 }), RangeError);
  assert.throws(() => createOrbitState({ ...ORBIT_CONFIG, vehicle: { ...ORBIT_CONFIG.vehicle, dryMass: 0 } }), RangeError);
  assert.throws(() => orbitalAcceleration({ ...state, x: 0, y: 0 }, {}, earthOnly), RangeError);
});
