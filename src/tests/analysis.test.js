import test from 'node:test';
import assert from 'node:assert/strict';
import { createMission, advanceMission } from '../orbital/mission.js';
import { ORBIT_CONFIG, STANDARD_GRAVITY } from '../orbital/config.js';
import { createOrbitState } from '../orbital/physics.js';
import { moonState } from '../orbital/bodies.js';

const near = (actual, expected, tolerance) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} versus ${expected}`);

test('custom LEO vehicle changes propellant use and rocket equation without changing preset defaults', () => {
  const overrides = Object.freeze({ dryMass: 2000, fuelMass: 1000, maxThrust: 20_000, specificImpulse: 300 });
  const mission = createMission('leo', overrides);
  assert.deepEqual(mission.config.vehicle, overrides);
  assert.equal(mission.state.fuelMass, 1000);
  const after = advanceMission(mission, { throttle: 1, heading: Math.PI / 2 }, 3);
  const fuel = 1000 - 20_000 * 3 / (300 * STANDARD_GRAVITY);
  near(after.state.fuelMass, fuel, 1e-9);
  near(after.state.deltaVUsed, 300 * STANDARD_GRAVITY * Math.log(3000 / (2000 + fuel)), 1e-9);
  assert.equal(createMission().config.vehicle.dryMass, 4000);
  assert.equal(createMission().state.fuelMass, 6000);
  assert.equal(createMission('transfer').state.fuelMass, 901.4189351102686);
});

test('vehicle settings reject unsafe or unsupported overrides before flight', () => {
  for (const overrides of [{ dryMass: 0 }, { fuelMass: -1 }, { specificImpulse: NaN }, { maxThrust: Infinity }, { unknown: 1 }, null, []]) {
    assert.throws(() => createMission('leo', overrides), /vehicle|override/i);
  }
  assert.throws(() => createMission('transfer', { dryMass: 2000 }), /transfer|preset/i);
});

test('prediction option passes the flyby threshold while keeping impact guards', () => {
  const mission = createMission();
  const config = { ...mission.config, earth: { ...mission.config.earth, mu: 0 }, moon: { ...mission.config.moon, mu: 0 } };
  const moon = moonState(0, config);
  const start = { ...mission, config, closestAltitude: 5_000_000,
    state: { ...mission.state, x: moon.x, y: 7_000_000, vx: 0, vy: 0 } };
  assert.equal(advanceMission(start, {}, 5).status, 'flyby');
  const coast = advanceMission(start, {}, 5, { stopAtFlyby: false });
  assert.equal(coast.status, 'active');
  assert.equal(coast.state.time, 5);
  const impact = { ...start, state: { ...start.state, x: config.earth.radius + 10, y: 0, vx: -100 } };
  assert.equal(advanceMission(impact, {}, 5, { stopAtFlyby: false }).status, 'earth-impact');
});

import * as trajectory from '../orbital/trajectory.js';
import * as worker from '../orbital/trajectoryWorker.js';

test('coast prediction returns to an analytical circular orbit and leaves its inputs unchanged', () => {
  assert.equal(typeof trajectory.predictTrajectory, 'function');
  const config = { ...ORBIT_CONFIG, moon: { ...ORBIT_CONFIG.moon, enabled: false } };
  const state = createOrbitState(config);
  const snapshot = structuredClone({ state, config });
  const radius = 6_771_000;
  const period = 2 * Math.PI * Math.sqrt(radius ** 3 / 3.986004e14);
  const result = trajectory.predictTrajectory(state, config, { horizon: period });
  const last = result.points.at(-1);
  near(last.time, period, 1e-8);
  near(Math.hypot(last.x - radius, last.y), 0, 30);
  assert.equal(result.endStatus, 'active');
  assert.equal(result.step, 1);
  assert.ok(result.points.length < 15);
  assert.deepEqual({ state, config }, snapshot);
});

test('three-day prediction of the actual departure clears the Moon and continues beyond flyby', (t) => {
  assert.equal(typeof trajectory.predictTrajectory, 'function');
  const mission = createMission('transfer');
  const snapshot = structuredClone(mission);
  const result = trajectory.predictTrajectory(mission.state, mission.config);
  assert.equal(result.endStatus, 'active');
  assert.equal(result.horizon, 259200);
  assert.equal(result.points.at(-1).time, 259650);
  assert.ok(result.closest.time > 210000 && result.closest.time < 250000);
  near(result.closest.altitude, 3_523_662, 300);
  assert.ok(result.points.length <= 435);
  assert.deepEqual(mission, snapshot);
  t.diagnostic(`predicted closest altitude: ${result.closest.altitude} m at ${result.closest.time} s`);
});

test('prediction stops at surfaces and lost boundary, including an initial body overlap', () => {
  assert.equal(typeof trajectory.predictTrajectory, 'function');
  const config = { ...ORBIT_CONFIG, earth: { ...ORBIT_CONFIG.earth, mu: 0 }, moon: { ...ORBIT_CONFIG.moon, mu: 0, enabled: false } };
  for (const [overrides, status, seconds] of [
    [{ x: 6_371_010, vx: -100, vy: 0 }, 'earth-impact', 0.1],
    [{ x: 999_999_990, vx: 100, vy: 0 }, 'lost', 0.1],
    [{ x: 0, y: 0 }, 'earth-impact', 0],
  ]) {
    const result = trajectory.predictTrajectory(createOrbitState(config, overrides), config, { horizon: 10 });
    assert.equal(result.endStatus, status);
    near(result.points.at(-1).time, seconds, 1e-8);
  }
});

test('prediction rejects invalid numerical inputs and worker returns correlated results or errors', () => {
  assert.equal(typeof trajectory.predictTrajectory, 'function');
  assert.equal(typeof worker.handleTrajectoryRequest, 'function');
  const mission = createMission();
  for (const options of [{ horizon: Infinity }, { horizon: -1 }, { step: 0 }, { sampleEvery: 0 }]) {
    assert.throws(() => trajectory.predictTrajectory(mission.state, mission.config, options), RangeError);
  }
  assert.throws(() => trajectory.predictTrajectory({ ...mission.state, x: NaN }, mission.config), RangeError);
  const response = worker.handleTrajectoryRequest({ id: 17, state: mission.state, config: mission.config, options: { horizon: 10 } });
  assert.equal(response.id, 17);
  assert.equal(response.result.points.at(-1).time, 10);
  const error = worker.handleTrajectoryRequest({ id: 18, state: null, config: null });
  assert.equal(error.id, 18);
  assert.equal(typeof error.error, 'string');
});

import * as telemetry from '../orbital/telemetry.js';
import * as stores from '../orbital/runStore.js';

test('telemetry samples actual energy and mass at 60 simulation seconds without mutating history', () => {
  assert.equal(typeof telemetry.createFlightRecord, 'function');
  const mission = createMission();
  const record = telemetry.createFlightRecord(mission);
  const sample = record.samples[0];
  assert.deepEqual(Object.keys(sample).sort(), ['time','x','y','vx','vy','speed','earthAltitude','moonAltitude','closestAltitude','fuelMass','mass','deltaVUsed','deltaVRemaining','kinetic','potential','total','specificEnergy','status'].sort());
  assert.equal(sample.mass, 10000);
  near(sample.earthAltitude, 400000, 1e-7);
  near(sample.kinetic, 0.5 * 10000 * (3.986004e14 / 6771000), 0.01);
  near(sample.total, sample.kinetic + sample.potential, 0.01);
  near(sample.specificEnergy, sample.total / 10000, 1e-7);
  near(sample.deltaVRemaining, 450 * STANDARD_GRAVITY * Math.log(2.5), 1e-8);
  const before = structuredClone(record);
  assert.equal(telemetry.appendTelemetry(record, advanceMission(mission, {}, 59)), record);
  const next = telemetry.appendTelemetry(record, advanceMission(mission, {}, 60));
  assert.equal(next.samples.length, 2);
  assert.equal(next.samples[1].time, 60);
  assert.deepEqual(record, before);
});

test('postburn summary reports only fuel and delta-v used during this recorded flight', () => {
  assert.equal(typeof telemetry.createFlightRecord, 'function');
  const mission = createMission('transfer');
  const record = telemetry.createFlightRecord(mission);
  const burned = advanceMission(mission, { throttle: 1, heading: 0 }, 10);
  const after = telemetry.appendTelemetry(record, burned, true);
  const summary = telemetry.summarizeRun(after);
  assert.equal(summary.duration, 10);
  assert.equal(summary.missionTime, 460);
  assert.equal(summary.status, 'active');
  near(summary.initialMass, 4901.4189351102686, 1e-9);
  near(summary.fuelUsed, 500000 / (450 * STANDARD_GRAVITY), 1e-8);
  assert.ok(summary.deltaVUsed > 100 && summary.deltaVUsed < 110);
  near(summary.finalMass, summary.initialMass - summary.fuelUsed, 1e-9);
  assert.equal(summary.sampleCount, 2);
});

test('telemetry retains first and terminal samples under long-flight decimation and duplicate updates', () => {
  assert.equal(typeof telemetry.createFlightRecord, 'function');
  const mission = createMission();
  let record = telemetry.createFlightRecord(mission);
  for (let time = 60; time <= 180000; time += 60) {
    record = telemetry.appendTelemetry(record, { ...mission, state: { ...mission.state, time } });
  }
  assert.ok(record.samples.length <= 2500);
  assert.equal(record.samples[0].time, 0);
  assert.equal(record.samples.at(-1).time, 180000);
  const terminal = { ...mission, status: 'earth-impact', state: { ...mission.state, time: 180001 } };
  record = telemetry.appendTelemetry(record, terminal);
  assert.equal(record.samples.at(-1).status, 'earth-impact');
  assert.equal(record.samples.at(-1).time, 180001);
  const duplicate = telemetry.appendTelemetry(record, terminal, true);
  assert.equal(duplicate.samples.length, record.samples.length);
  assert.equal(duplicate.samples[0].time, 0);
});

test('CSV exports SI values, absolute mission time, elapsed time, and postburn metadata', () => {
  assert.equal(typeof telemetry.telemetryCsv, 'function');
  const record = telemetry.createFlightRecord(createMission('transfer'));
  const csv = telemetry.telemetryCsv(record);
  assert.match(csv, /preset,transfer/);
  assert.match(csv, /initial_time_s,450/);
  const rows = csv.trim().split(/\r?\n/);
  const index = rows.findIndex((line) => line.startsWith('elapsed_time_s,'));
  assert.ok(index >= 0);
  const headers = rows[index].split(',');
  const values = rows[index + 1].split(',');
  assert.equal(values[headers.indexOf('elapsed_time_s')], '0');
  assert.equal(values[headers.indexOf('time_s')], '450');
  near(Number(values[headers.indexOf('fuel_mass_kg')]), 901.4189351102686, 1e-9);
  assert.ok(headers.includes('total_energy_J'));
  assert.ok(headers.includes('specific_energy_J_per_kg'));
});

function stringStorage() {
  const entries = new Map();
  return { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, String(value)) };
}

test('run storage keeps latest three flights and replaces a saved run without duplicating it', () => {
  assert.equal(typeof stores.saveFlightRecord, 'function');
  const storage = stringStorage();
  for (let i = 0; i < 4; i++) {
    const record = { ...telemetry.createFlightRecord(createMission()), id: `run-${i}` };
    assert.equal(stores.saveFlightRecord(record, storage).ok, true);
  }
  const saved = stores.loadFlightRecords(storage);
  assert.deepEqual(saved.map((record) => record.id), ['run-3', 'run-2', 'run-1']);
  const updated = { ...saved[1], samples: [...saved[1].samples] };
  assert.equal(stores.saveFlightRecord(updated, storage).ok, true);
  assert.deepEqual(stores.loadFlightRecords(storage).map((record) => record.id), ['run-2', 'run-3', 'run-1']);
});

test('run storage safely rejects corrupted records, quota errors and unavailable storage', () => {
  assert.equal(typeof stores.saveFlightRecord, 'function');
  assert.deepEqual(stores.loadFlightRecords({ getItem: () => '{bad' }), []);
  assert.deepEqual(stores.loadFlightRecords({ getItem: () => '[null, {"id":"bad","samples":[]}]' }), []);
  const record = telemetry.createFlightRecord(createMission());
  assert.equal(stores.saveFlightRecord(record, { getItem: () => null, setItem: () => { throw new Error('Quota exceeded'); } }).ok, false);
  assert.equal(stores.saveFlightRecord(record, null).ok, false);
  assert.deepEqual(stores.loadFlightRecords(null), []);
  assert.equal(stores.saveFlightRecord({ ...record, config: {} }, stringStorage()).ok, false);
  assert.equal(stores.saveFlightRecord({ ...record, samples: [{ ...record.samples[0], x: NaN }] }, stringStorage()).ok, false);
});

test('forecast rejects incomplete state instead of silently substituting a fresh LEO', () => {
  const mission = createMission();
  for (const state of [null, undefined, {}, { ...mission.state, vx: undefined }]) {
    assert.throws(() => trajectory.predictTrajectory(state, mission.config, { horizon: 1 }), /state|vx/i);
  }
});

test('CSV quotes untrusted metadata as data while retaining negative numeric values', () => {
  const record = { ...telemetry.createFlightRecord(createMission()), id: '=1+1' };
  const csv = telemetry.telemetryCsv(record);
  assert.match(csv, /run_id,'=1\+1/);
  const rows = csv.trim().split(/\r?\n/);
  const header = rows.findIndex((line) => line.startsWith('elapsed_time_s,'));
  const values = rows[header + 1].split(',');
  const keys = rows[header].split(',');
  assert.ok(Number(values[keys.indexOf('potential_energy_J')]) < 0);
});

