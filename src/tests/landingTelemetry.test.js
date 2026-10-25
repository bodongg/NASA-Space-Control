import test from 'node:test';
import assert from 'node:assert/strict';
import { createMission } from '../orbital/mission.js';
import { createLunarLandingMission, advanceLunarLanding } from '../orbital/lunarLanding.js';
import { moonState } from '../orbital/bodies.js';
import * as telemetry from '../orbital/telemetry.js';
import { saveFlightRecord, loadFlightRecords } from '../orbital/runStore.js';

const storage = () => {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, String(value)) };
};
function touchdownMission() {
  const start = createLunarLandingMission();
  const moon = moonState(start.state.time, start.config);
  const mission = { ...start, phase: 'final-descent', state: { ...start.state,
    x: moon.x + start.config.moon.radius + 0.01, y: moon.y, vx: moon.vx - 0.5, vy: moon.vy,
  } };
  return { start: mission, landed: advanceLunarLanding(mission, { heading: 0 }, 1, { guided: false }) };
}

test('lunar telemetry preserves signed relative motion and incoming contact after the state rests', () => {
  const { start, landed } = touchdownMission();
  const record = telemetry.createFlightRecord(start);
  assert.equal(record.samples[0].phase, 'final-descent');
  assert.equal(record.samples[0].moonVerticalSpeed, -0.5);
  assert.equal(record.samples[0].moonHorizontalSpeed, 0);
  const next = telemetry.appendTelemetry(record, landed);
  assert.equal(next.samples.at(-1).status, 'landed');
  assert.equal(next.samples.at(-1).phase, 'landed');
  assert.equal(next.samples.at(-1).moonRelativeSpeed, 0);
  assert.deepEqual(next.touchdown, landed.touchdown);
  assert.notEqual(next.touchdown, landed.touchdown);
  assert.ok(next.touchdown.verticalSpeed < -0.5);
  assert.equal(record.touchdown, undefined);
  assert.deepEqual(telemetry.summarizeRun(next).touchdown, landed.touchdown);
});

test('landing runs save and reload beside old LEO and flyby records', () => {
  const store = storage();
  const old = telemetry.createFlightRecord(createMission('transfer'));
  assert.equal(saveFlightRecord(old, store).ok, true);
  const { start, landed } = touchdownMission();
  const landing = telemetry.appendTelemetry(telemetry.createFlightRecord(start), landed);
  assert.equal(saveFlightRecord(landing, store).ok, true);
  const records = loadFlightRecords(store);
  assert.equal(records.length, 2);
  assert.deepEqual(records[0], landing);
  assert.deepEqual(records[1], old);
  assert.equal(saveFlightRecord(telemetry.createFlightRecord(createMission()), store).ok, true);
  assert.equal(loadFlightRecords(store).length, 3);
});

test('storage rejects corrupted lunar fields and missing incoming landing evidence', () => {
  const { start, landed } = touchdownMission();
  const record = telemetry.appendTelemetry(telemetry.createFlightRecord(start), landed);
  for (const key of ['moonVerticalSpeed', 'moonHorizontalSpeed', 'moonRelativeSpeed']) {
    const bad = structuredClone(record);
    bad.samples[0][key] = NaN;
    assert.equal(saveFlightRecord(bad, storage()).ok, false);
  }
  for (const key of Object.keys(landed.touchdown)) {
    const bad = structuredClone(record);
    bad.touchdown = { ...landed.touchdown, [key]: Infinity };
    assert.equal(saveFlightRecord(bad, storage()).ok, false);
  }
  assert.equal(saveFlightRecord({ ...record, touchdown: undefined }, storage()).ok, false);
});

test('CSV distinguishes Earth-centered speed, lunar speed and measured touchdown evidence', () => {
  const { start, landed } = touchdownMission();
  const record = telemetry.appendTelemetry(telemetry.createFlightRecord(start), landed);
  const csv = telemetry.telemetryCsv(record);
  assert.match(csv, /preset,landing/);
  assert.match(csv, /vehicle_initial_fuel_mass_kg,16000/);
  assert.match(csv, /touchdown_vertical_speed_m_per_s,-0\.5/);
  const rows = csv.trim().split(/\r?\n/);
  const index = rows.findIndex(row => row.startsWith('elapsed_time_s,'));
  const columns = rows[index].split(',');
  const last = rows.at(-1).split(',');
  assert.equal(last[columns.indexOf('phase')], 'landed');
  assert.equal(last[columns.indexOf('moon_relative_speed_m_per_s')], '0');
  assert.ok(Number(last[columns.indexOf('speed_m_per_s')]) > 1000);
  assert.ok(!csv.includes('undefined'));
});

test('Markdown report identifies landing vehicle, incoming speeds and coast forecast limits', () => {
  assert.equal(typeof telemetry.flightReportMarkdown, 'function');
  const { start, landed } = touchdownMission();
  const record = telemetry.appendTelemetry(telemetry.createFlightRecord(start), landed);
  const report = telemetry.flightReportMarkdown(record, '2026-10-19T00:00:00.000Z');
  assert.match(report, /Lunar landing/);
  assert.match(report, /Landed safely/);
  assert.match(report, /16000 kg/);
  assert.match(report, /Incoming vertical speed/);
  assert.match(report, /Incoming tangential speed/);
  assert.match(report, /Touchdown tilt/);
  assert.match(report, /excludes future guidance burns/);
  assert.match(report, /450 s departure burn/);
  assert.ok(!report.includes('Flyby success is entry'));
  const oldReport = telemetry.flightReportMarkdown(telemetry.createFlightRecord(createMission('transfer')));
  assert.match(oldReport, /Flyby success is entry/);
  assert.ok(!oldReport.includes('Incoming vertical speed'));
});
