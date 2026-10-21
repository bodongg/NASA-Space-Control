import test from 'node:test';
import assert from 'node:assert/strict';
import { ORBIT_CONFIG } from '../orbital/config.js';
import { moonState } from '../orbital/bodies.js';
import { createOrbitState, stepOrbit } from '../orbital/physics.js';

import * as api from '../orbital/mission.js';
test('mission API provides manual and verified post-departure presets', () => {
  const leo = api.createMission();
  assert.equal(leo.preset, 'leo');
  assert.equal(leo.status, 'active');
  assert.equal(leo.state.time, 0);
  assert.equal(leo.state.x, 6_771_000);
  assert.equal(leo.state.fuelMass, 6000);
  const transfer = api.createMission('transfer');
  assert.equal(transfer.status, 'active');
  assert.ok(transfer.state.time > 0);
  assert.ok(Math.hypot(transfer.state.x, transfer.state.y) < 10_000_000);
  assert.ok(transfer.closestAltitude > 20_000_000);
  assert.throws(() => api.createMission('unknown'), RangeError);
});

function vacuumMission(overrides = {}, movingMoon = false) {
  const config = {
    ...ORBIT_CONFIG,
    earth: { ...ORBIT_CONFIG.earth, mu: 0 },
    moon: { ...ORBIT_CONFIG.moon, enabled: movingMoon, mu: 0 },
  };
  return {
    state: createOrbitState(config, { vx: 0, vy: 0, ...overrides }),
    config, preset: 'leo', status: 'active', closestAltitude: Infinity,
  };
}
const near = (actual, expected, tolerance) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, actual + ' versus ' + expected);

test('Earth collision stops at the surface and freezes terminal flights', () => {
  const before = vacuumMission({ x: 6_371_010, vx: -100 });
  const after = api.advanceMission(before, {}, 120);
  assert.equal(after.status, 'earth-impact');
  near(after.state.time, 0.1, 1e-8);
  near(Math.hypot(after.state.x, after.state.y), 6_371_000, 1e-6);
  const stopped = api.advanceMission(after, { throttle: 1 }, 120);
  assert.deepEqual(stopped, after);
  assert.notEqual(stopped, after);
});

test('surface crossing cannot tunnel through Earth between outside endpoints', () => {
  const before = vacuumMission({ x: 6_371_010, vx: -12_742_020 });
  const after = api.advanceMission(before, {}, 1);
  assert.equal(after.status, 'earth-impact');
  assert.ok(after.state.time < 0.001);
  near(after.state.x, 6_371_000, 1e-6);
});

test('collision uses the moving Moon, even for a stationary spacecraft', () => {
  let before = vacuumMission({ x: 384_400_000, y: 500 }, true);
  before = { ...before, config: { ...before.config, moon: { ...before.config.moon, radius: 100 } } };
  const after = api.advanceMission(before, {}, 1);
  assert.equal(after.status, 'moon-impact');
  assert.ok(after.state.time > 0.39 && after.state.time < 0.4);
  const moon = moonState(after.state.time, after.config);
  near(Math.hypot(after.state.x - moon.x, after.state.y - moon.y), 100, 0.001);
  near(after.closestAltitude, 0, 0.001);
});

test('initial overlaps stop without evaluating a point-mass singularity', () => {
  const earth = api.createMission();
  assert.equal(api.advanceMission({ ...earth, state: { ...earth.state, x: 0, y: 0 } }, {}, 1).status, 'earth-impact');
  const moon = moonState(earth.state.time, earth.config);
  assert.equal(api.advanceMission({ ...earth, state: { ...earth.state, x: moon.x, y: moon.y } }, {}, 1).status, 'moon-impact');
});

test('lost flight stops at the 1 billion metre boundary', () => {
  const after = api.advanceMission(vacuumMission({ x: 999_999_990, vx: 100 }), {}, 120);
  assert.equal(after.status, 'lost');
  near(after.state.time, 0.1, 1e-8);
  near(Math.hypot(after.state.x, after.state.y), 1_000_000_000, 1e-6);
});

test('fuel exhaustion leaves a playable coast and does not mutate inputs', () => {
  const before = vacuumMission({ fuelMass: 1 });
  const snapshot = structuredClone(before);
  const controls = Object.freeze({ throttle: 1, heading: Math.PI / 2 });
  const after = api.advanceMission(before, controls, 10);
  assert.equal(after.status, 'active');
  assert.equal(after.state.fuelMass, 0);
  assert.ok(after.state.vy > 0);
  assert.equal(after.state.time, 10);
  assert.deepEqual(before, snapshot);
  assert.notEqual(after.state, before.state);
  const coast = api.advanceMission(after, controls, 10);
  near(coast.state.vy, after.state.vy, 1e-12);
});

test('safe warp reduces for burns and encounters, including empty tanks', () => {
  const far = vacuumMission({ x: 100_000_000 });
  assert.equal(api.safeWarp(far, {}, 10_000), 10_000);
  assert.equal(api.safeWarp(far, { throttle: 1 }, 10_000), 10);
  assert.equal(api.safeWarp({ ...far, state: { ...far.state, fuelMass: 0 } }, { throttle: 1 }, 10_000), 10_000);
  assert.equal(api.safeWarp(vacuumMission({ x: 6_400_000 }), {}, 10_000), 100);
  const lunar = vacuumMission({ x: 384_400_000, y: 5_000_000 }, true);
  assert.equal(api.safeWarp(lunar, {}, 10_000), 100);
  assert.equal(api.safeWarp(lunar, { throttle: 1 }, 10_000), 10);
  assert.equal(api.safeWarp(far, {}, 2), 2);
});

test('mission rejects nonfinite controls, duration and warp', () => {
  const mission = api.createMission();
  for (const seconds of [-1, NaN, Infinity]) {
    assert.throws(() => api.advanceMission(mission, {}, seconds), RangeError);
  }
  assert.throws(() => api.advanceMission(mission, { heading: NaN }, 1), RangeError);
  assert.throws(() => api.advanceMission(mission, { throttle: Infinity }, 1), RangeError);
  assert.throws(() => api.safeWarp(mission, {}, NaN), RangeError);
  assert.throws(() => api.safeWarp(mission, {}, 0), RangeError);
  assert.deepEqual(api.advanceMission(mission, {}, 0), mission);
});

test('the actual transfer preset reconstructs its finite burn and reaches a lunar flyby', (t) => {
  const preset = api.createMission('transfer');
  let reconstructed = createOrbitState(preset.config);
  for (let elapsed = 0; elapsed < 450; elapsed += 0.25) {
    reconstructed = stepOrbit(reconstructed, {
      throttle: 1, heading: Math.atan2(reconstructed.vy, reconstructed.vx),
    }, preset.config, 0.25);
  }
  for (const field of ['x', 'y', 'vx', 'vy', 'fuelMass', 'time', 'deltaVUsed']) {
    near(preset.state[field], reconstructed[field], 1e-6);
  }
  let mission = preset;
  while (mission.status === 'active' && mission.state.time < 4 * 86400) {
    mission = api.advanceMission(mission, {}, 120);
  }
  assert.equal(mission.status, 'flyby');
  assert.ok(mission.state.time > 2 * 86400);
  assert.ok(mission.closestAltitude > 0 && mission.closestAltitude <= 20_000_000);
  assert.equal(mission.state.fuelMass, preset.state.fuelMass);
  for (const value of Object.values(mission.state)) assert.ok(Number.isFinite(value));
  assert.equal(preset.state.time, 450);
  // Continue the same physical coast after the game stops at its success threshold.
  let coast = mission.state;
  let closest = mission.closestAltitude;
  while (coast.time < 250_000) {
    coast = stepOrbit(coast, {}, mission.config, 1);
    const moon = moonState(coast.time, mission.config);
    const altitude = Math.hypot(coast.x - moon.x, coast.y - moon.y) - mission.config.moon.radius;
    closest = Math.min(closest, altitude);
    assert.ok(altitude > 0, 'post-success coast must avoid lunar impact');
    assert.ok(Math.hypot(coast.x, coast.y) > mission.config.earth.radius);
  }
  assert.ok(closest > 3_000_000 && closest < 4_000_000);
  t.diagnostic('continued-coast closest lunar altitude=' + (closest / 1000).toFixed(3) + ' km');
  t.diagnostic('flyby threshold at t=' + mission.state.time.toFixed(3)
    + ' s; lunar altitude=' + (mission.closestAltitude / 1000).toFixed(3)
    + ' km; departure fuel=' + preset.state.fuelMass.toFixed(3) + ' kg');
});

test('fuel exhaustion during a substep cannot hide an imminent surface collision', () => {
  const before = vacuumMission({ x: 6_371_000.02, vx: -1, fuelMass: 0.001 });
  const after = api.advanceMission(before, { throttle: 1, heading: 0 }, 1);
  assert.equal(after.status, 'earth-impact');
  assert.ok(after.state.time > 0 && after.state.time < 0.1);
  assert.equal(after.state.fuelMass, 0);
  near(after.state.x, 6_371_000, 1e-6);
});

