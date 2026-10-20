import test from 'node:test';
import assert from 'node:assert/strict';
import * as physics from '../physics.js';
import * as settings from '../config.js';

const near = (actual, expected, tolerance = 1e-6) => {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    'expected ' + actual + ' to be within ' + tolerance + ' of ' + expected);
};

test('physics and configuration expose the planned interface', () => {
  assert.equal(typeof physics.stepPhysics, 'function');
  assert.equal(typeof physics.createInitialState, 'function');
  assert.equal(typeof physics.acceleration, 'function');
  assert.equal(typeof physics.energy, 'function');
  assert.equal(typeof physics.landingOutcome, 'function');
  assert.ok(settings.DEFAULT_CONFIG);
});

test('free fall follows the analytical vertical solution', () => {
  const config = settings.DEFAULT_CONFIG;
  let state = physics.createInitialState(config);
  const initial = { ...state };
  const dt = 1 / 120;
  for (let i = 0; i < 360; i++) {
    state = physics.stepPhysics(state, { throttle: 0, angle: 0 }, config, dt);
  }
  const t = 360 * dt;
  near(state.vy, initial.vy - config.planet.gravity * t, 1e-9);
  near(state.y, initial.y + initial.vy * t - 0.5 * config.planet.gravity * t * t, 0.03);
  near(state.x, 0);
  near(state.vx, 0);
});

test('hover throttle balances gravity at the current mass', () => {
  const config = settings.DEFAULT_CONFIG;
  const state = physics.createInitialState(config, { vy: 0 });
  const mass = config.vehicle.dryMass + state.fuelMass;
  const throttle = mass * config.planet.gravity / config.vehicle.maxThrust;
  const a = physics.acceleration(state, { throttle, angle: 0 }, config);
  near(a.ay, 0, 1e-12);
});

test('angled thrust splits into horizontal and vertical acceleration', () => {
  const config = settings.DEFAULT_CONFIG;
  const state = physics.createInitialState(config, { vx: 0, vy: 0 });
  const a = physics.acceleration(state, { throttle: 1, angle: Math.PI / 6 }, config);
  const mass = config.vehicle.dryMass + state.fuelMass;
  near(a.ax, config.vehicle.maxThrust * 0.5 / mass, 1e-12);
  near(a.ay, config.vehicle.maxThrust * Math.cos(Math.PI / 6) / mass - config.planet.gravity, 1e-12);
});

test('atmospheric drag opposes motion and the Moon has no drag', () => {
  const state = physics.createInitialState(settings.DEFAULT_CONFIG, { vx: 50, vy: -10 });
  const moon = physics.acceleration(state, { throttle: 0, angle: 0 }, settings.DEFAULT_CONFIG);
  near(moon.ax, 0);
  const earthConfig = { ...settings.DEFAULT_CONFIG, planet: settings.PLANETS.Earth };
  const earth = physics.acceleration(state, { throttle: 0, angle: 0 }, earthConfig);
  assert.ok(earth.ax < 0);
  assert.ok(earth.ay > -earthConfig.planet.gravity);
  const noDrag = physics.acceleration(state, { throttle: 0, angle: 0 }, { ...earthConfig, dragEnabled: false });
  near(noDrag.ax, 0);
});

test('fuel burn follows thrust divided by specific impulse and g0', () => {
  const config = settings.DEFAULT_CONFIG;
  const state = physics.createInitialState(config);
  const next = physics.stepPhysics(state, { throttle: 0.6, angle: 0 }, config, 0.5);
  const expectedBurn = 0.6 * config.vehicle.maxThrust / (config.vehicle.specificImpulse * settings.STANDARD_GRAVITY) * 0.5;
  near(state.fuelMass - next.fuelMass, expectedBurn, 1e-9);
  near(next.time, 0.5);
  near(state.fuelMass, config.vehicle.fuelMass);
});

test('thrust stops when fuel runs out partway through a step', () => {
  const config = settings.DEFAULT_CONFIG;
  const state = physics.createInitialState(config, { y: 400, vy: 0, fuelMass: 0.005 });
  const next = physics.stepPhysics(state, { throttle: 1, angle: 0 }, config, 1);
  near(next.fuelMass, 0);
  assert.ok(next.vy < -1.5 && next.vy > -1.62);
  assert.ok(next.y > 0);
});

test('RK4 reproduces free fall more accurately than semi-implicit Euler', () => {
  const config = settings.DEFAULT_CONFIG;
  const initial = physics.createInitialState(config, { y: 400, vy: 0 });
  const exactY = 400 - 0.5 * config.planet.gravity * 4;
  let euler = initial;
  let rk4 = initial;
  for (let i = 0; i < 20; i++) {
    euler = physics.stepPhysics(euler, { throttle: 0, angle: 0 }, config, 0.1, 'euler');
    rk4 = physics.stepPhysics(rk4, { throttle: 0, angle: 0 }, config, 0.1, 'rk4');
  }
  near(rk4.y, exactY, 1e-9);
  assert.ok(Math.abs(rk4.y - exactY) < Math.abs(euler.y - exactY));
});

test('touchdown requires the pad and both safe speed limits', () => {
  const config = settings.DEFAULT_CONFIG;
  const state = physics.createInitialState(config, { x: 0, y: 0, vx: 1, vy: -3 });
  assert.equal(physics.landingOutcome(state, config), 'landed');
  assert.equal(physics.landingOutcome({ ...state, x: config.landing.padHalfWidth + 1 }, config), 'crashed');
  assert.equal(physics.landingOutcome({ ...state, vx: config.landing.safeHorizontalSpeed + 1 }, config), 'crashed');
  assert.equal(physics.landingOutcome({ ...state, vy: -config.landing.safeVerticalSpeed - 1 }, config), 'crashed');
  assert.equal(physics.landingOutcome({ ...state, y: 1 }, config), 'in-flight');
});

test('mechanical energy uses current mass, speed, height, and gravity', () => {
  const config = settings.DEFAULT_CONFIG;
  const state = physics.createInitialState(config, { y: 10, vx: 3, vy: 4 });
  const values = physics.energy(state, config);
  const mass = config.vehicle.dryMass + state.fuelMass;
  near(values.kinetic, 0.5 * mass * 25);
  near(values.potential, mass * config.planet.gravity * 10);
  near(values.mechanical, values.kinetic + values.potential);
});

test('state input is not mutated and impact is clamped to ground', () => {
  const config = settings.DEFAULT_CONFIG;
  const state = physics.createInitialState(config, { y: 1, vy: -20 });
  const copy = { ...state };
  const next = physics.stepPhysics(state, { throttle: 0, angle: 0 }, config, 0.1);
  assert.deepEqual(state, copy);
  near(next.y, 0);
  assert.ok(next.time < 0.1);
});
