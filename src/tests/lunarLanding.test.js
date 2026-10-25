import test from 'node:test';
import assert from 'node:assert/strict';
import { moonState } from '../orbital/bodies.js';
import { createOrbitState, stepOrbit } from '../orbital/physics.js';
import { advanceMission } from '../orbital/mission.js';

const api = await import('../orbital/lunarLanding.js').catch((error) => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return {};
});
const near = (actual, expected, tolerance) => assert.ok(
  Math.abs(actual - expected) <= tolerance, `${actual} versus ${expected}`,
);

function atMoon(altitude, verticalSpeed = -0.5, horizontalSpeed = 0) {
  const mission = api.createLunarLandingMission();
  const moon = moonState(mission.state.time, mission.config);
  return { ...mission, state: { ...mission.state,
    x: moon.x + mission.config.moon.radius + altitude, y: moon.y,
    vx: moon.vx + verticalSpeed, vy: moon.vy + horizontalSpeed,
  } };
}

test('landing vehicle reconstructs the actual finite departure burn without refilling', () => {
  assert.equal(typeof api.createLunarLandingMission, 'function');
  const mission = api.createLunarLandingMission();
  assert.equal(mission.preset, 'landing');
  assert.equal(mission.status, 'active');
  assert.equal(mission.phase, 'transfer');
  let state = createOrbitState(mission.config);
  assert.equal(state.fuelMass, 16000);
  for (let i = 0; i < 1800; i++) {
    state = stepOrbit(state, { throttle: 1, heading: Math.atan2(state.vy, state.vx) }, mission.config, 0.25);
  }
  for (const key of Object.keys(state)) near(mission.state[key], state[key], 1e-6);
  near(mission.state.fuelMass, 5802.837870220537, 1e-8);
  near(mission.state.deltaVUsed, 3146.72998190761, 1e-8);
});

test('guided journey advances continuously through real swept contact with measured incoming speeds', (t) => {
  let mission = api.createLunarLandingMission();
  const initial = structuredClone(mission);
  const phases = new Set([mission.phase]);
  while (mission.status === 'active' && mission.state.time < 240000) {
    const before = mission;
    mission = api.advanceLunarLanding(mission, {}, api.lunarLandingDiagnostics(mission).altitude < 100000 ? 1 : 120);
    assert.ok(mission.state.time >= before.state.time);
    assert.ok(mission.state.fuelMass <= before.state.fuelMass);
    phases.add(mission.phase);
    for (const value of Object.values(mission.state)) assert.ok(Number.isFinite(value));
    if (mission.status === 'active') assert.ok(api.lunarLandingDiagnostics(mission).altitude > 0);
  }
  assert.equal(mission.status, 'landed');
  assert.equal(mission.phase, 'landed');
  for (const phase of ['transfer', 'approach', 'braking', 'descent', 'final-descent', 'landed']) assert.ok(phases.has(phase), phase);
  near(mission.state.time, 223096.59175322132, 0.2);
  near(mission.state.fuelMass, 414.49457726341024, 0.2);
  near(mission.touchdown.verticalSpeed, -0.29996695125121925, 0.002);
  assert.ok(Math.abs(mission.touchdown.horizontalSpeed) < 0.01);
  assert.ok(mission.touchdown.tilt < 10 * Math.PI / 180);
  near(api.lunarLandingDiagnostics(mission).altitude, 0, 1e-6);
  near(api.lunarLandingDiagnostics(mission).speed, 0, 1e-12);
  assert.deepEqual(initial, api.createLunarLandingMission());
  t.diagnostic(JSON.stringify({ time: mission.state.time, fuel: mission.state.fuelMass, touchdown: mission.touchdown }));
});

test('coast and manual commands integrate the same old state without edits or a hidden guidance burn', () => {
  const before = api.createLunarLandingMission();
  const snapshot = structuredClone(before);
  const controls = Object.freeze({ throttle: 0.8, heading: 0.2 });
  const actual = api.advanceLunarLanding(before, controls, 3, { guided: false });
  const expected = advanceMission(before, controls, 3, { stopAtFlyby: false });
  assert.deepEqual(actual.state, expected.state);
  assert.deepEqual(before, snapshot);
  const coast = api.advanceLunarLanding(before, controls, 3);
  assert.deepEqual(coast.state, advanceMission(before, {}, 3, { stopAtFlyby: false }).state);
});

test('diagnostics resolve signed Moon-relative radial and tangent speeds', () => {
  const mission = atMoon(250, -4, 3);
  const result = api.lunarLandingDiagnostics(mission);
  near(result.altitude, 250, 1e-6);
  near(result.verticalSpeed, -4, 1e-12);
  near(result.horizontalSpeed, 3, 1e-12);
  near(result.speed, 5, 1e-12);
  near(result.radialAngle, 0, 1e-12);
});

test('manual soft contact stores incoming evidence and freezes the landed state', () => {
  const before = atMoon(0.01);
  const after = api.advanceLunarLanding(before, { heading: 0 }, 1, { guided: false });
  assert.equal(after.status, 'landed');
  assert.ok(after.touchdown.verticalSpeed < -0.5);
  assert.ok(after.touchdown.time > before.state.time);
  assert.deepEqual(api.advanceLunarLanding(after, { throttle: 1 }, 100), after);
});

test('hard, lateral, tilted and dry unbraked contact cannot become a landing', () => {
  for (const [vr, vt, heading, fuel] of [[-10, 0, 0, 100], [-0.5, 3, 0, 100], [-0.5, 0, Math.PI, 100], [-10, 0, 0, 0]]) {
    let mission = atMoon(0.01, vr, vt);
    mission = { ...mission, state: { ...mission.state, fuelMass: fuel } };
    const after = api.advanceLunarLanding(mission, { heading }, 1, { guided: false });
    assert.equal(after.status, 'moon-impact');
    assert.equal(after.phase, 'crash');
    assert.ok(after.touchdown);
    assert.deepEqual(api.advanceLunarLanding(after, {}, 100), after);
  }
});

test('initial Earth and lunar overlap fail before guidance can evaluate a singularity', () => {
  const before = api.createLunarLandingMission();
  const earth = { ...before, state: { ...before.state, x: 0, y: 0 } };
  assert.equal(api.advanceLunarLanding(earth, {}, 1).status, 'earth-impact');
  for (const altitude of [-10, -before.config.moon.radius]) {
    const lunar = atMoon(altitude, 0, 0);
    assert.equal(api.advanceLunarLanding(lunar, {}, 1).status, 'moon-impact');
  }
});

test('guidance is finite and warp slows near both bodies and during manual burns', () => {
  const far = api.createLunarLandingMission();
  for (const [altitude, maximum] of [[200000, 1000], [50000, 100], [5000, 10], [50, 10], [2, 1]]) {
    const mission = atMoon(altitude, -50, -10);
    const controls = api.lunarLandingGuidance(mission);
    assert.ok(Number.isFinite(controls.heading));
    assert.ok(controls.throttle >= 0 && controls.throttle <= 1);
    assert.equal(api.lunarLandingWarp(mission, controls, 10000), maximum);
    const dry = { ...mission, state: { ...mission.state, fuelMass: 0 } };
    assert.equal(api.lunarLandingGuidance(dry).throttle, 0);
    assert.equal(api.lunarLandingWarp(dry, { throttle: 1 }, 10000), maximum);
  }
  assert.equal(api.lunarLandingWarp(far, { throttle: 1 }, 10000, false), 10);
  assert.equal(api.lunarLandingWarp(far, {}, 2), 2);
  const earth = { ...far, state: { ...far.state, x: far.config.earth.radius + 50, y: 0 } };
  assert.equal(api.lunarLandingWarp(earth, {}, 10000), 1);
});

test('guided landing remains physical with variable display warp and frame-sized calls', (t) => {
  let mission = api.createLunarLandingMission();
  let frames = 0;
  while (mission.status === 'active' && mission.state.time < 240000 && frames < 100000) {
    const controls = api.lunarLandingGuidance(mission);
    const warp = api.lunarLandingWarp(mission, controls, 10000);
    const wallSeconds = [1 / 60, 1 / 48, 1 / 30][frames++ % 3];
    mission = api.advanceLunarLanding(mission, controls, wallSeconds * warp);
  }
  assert.equal(mission.status, 'landed');
  assert.ok(Math.abs(mission.touchdown.verticalSpeed) < 0.4);
  assert.ok(Math.abs(mission.touchdown.horizontalSpeed) < 0.01);
  assert.ok(mission.state.fuelMass > 400 && mission.state.fuelMass < 430);
  t.diagnostic(JSON.stringify({ frames, time: mission.state.time, fuel: mission.state.fuelMass, touchdown: mission.touchdown }));
});

test('durations, controls and warp reject nonfinite inputs and zero duration preserves state', () => {
  const mission = api.createLunarLandingMission();
  for (const seconds of [-1, NaN, Infinity]) assert.throws(() => api.advanceLunarLanding(mission, {}, seconds), RangeError);
  for (const controls of [{ throttle: NaN }, { heading: Infinity }]) {
    assert.throws(() => api.advanceLunarLanding(mission, controls, 1), RangeError);
    assert.throws(() => api.lunarLandingWarp(mission, controls, 10), RangeError);
  }
  for (const warp of [0, NaN, Infinity]) assert.throws(() => api.lunarLandingWarp(mission, {}, warp), RangeError);
  assert.deepEqual(api.advanceLunarLanding(mission, {}, 0), mission);
});
