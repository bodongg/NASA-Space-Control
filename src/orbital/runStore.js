import { createOrbitState } from './physics.js';
import { TELEMETRY_COLUMNS, LANDING_TELEMETRY_COLUMNS } from './telemetry.js';

const KEY = 'rocket-landing:orbital-runs:v1';
const STATUSES = ['active', 'flyby', 'landed', 'earth-impact', 'moon-impact', 'lost'];
const PHASES = ['transfer', 'approach', 'braking', 'descent', 'final-descent', 'landed', 'crash', 'ascent', 'orbit-insertion', 'parking-orbit', 'departure'];

function validRecord(record) {
  try {
    if (!record || typeof record.id !== 'string' || !record.id || record.id.length > 200
      || !['leo', 'transfer', 'landing', 'launch'].includes(record.preset)
      || typeof record.startedAt !== 'string' || record.startedAt.length > 100
      || !Number.isFinite(Date.parse(record.startedAt)) || !Number.isFinite(record.initialTime)
      || !Array.isArray(record.samples) || !record.samples.length || record.samples.length > 2500) return false;
    createOrbitState(record.config);
    if (typeof record.config.moon.enabled !== 'boolean') return false;
    let previous = record.initialTime;
    for (const sample of record.samples) {
      if (!sample || !STATUSES.includes(sample.status) || sample.time < previous
        || TELEMETRY_COLUMNS.some(([key]) => key !== 'status' && !Number.isFinite(sample[key]))
        || sample.phase !== undefined && !PHASES.includes(sample.phase)
        || LANDING_TELEMETRY_COLUMNS.some(([key]) => key !== 'phase' && sample[key] !== undefined && !Number.isFinite(sample[key]))
        || sample.fuelMass < 0 || sample.mass <= 0 || sample.deltaVUsed < 0 || sample.deltaVRemaining < 0) return false;
      previous = sample.time;
    }
    if (record.preset === 'launch') {
      if (!record.launchSetup || !Array.isArray(record.launchSetup.stages) || record.launchSetup.stages.length !== 3 || !Array.isArray(record.stageEvents) || record.stageEvents.length > 3) return false;
      for (const stage of record.launchSetup.stages) if (typeof stage.stageName !== 'string' || stage.stageName.length > 60 || ['dryMass','fuelMass','maxThrust','specificImpulse'].some(key => !Number.isFinite(stage[key]) || stage[key] <= 0)) return false;
      for (const event of record.stageEvents) if (!event || event.type !== 'stage-separation' || ![0,1].includes(event.stage) || typeof event.stageName !== 'string' || event.stageName.length > 60 || ['time','discardedDryMass','discardedFuelMass'].some(key => !Number.isFinite(event[key]) || event[key] < 0)) return false;
      for (const sample of record.samples) if (typeof sample.stageName !== 'string' || sample.stageName.length > 60 || typeof sample.atmosphereLayer !== 'string' || sample.atmosphereLayer.length > 60 || ['earthVerticalSpeed','earthHorizontalSpeed','density','dynamicPressure'].some(key => !Number.isFinite(sample[key])) || sample.density < 0 || sample.dynamicPressure < 0) return false;
    }
    if (record.touchdown !== undefined && (!record.touchdown || Array.isArray(record.touchdown)
      || ['verticalSpeed', 'horizontalSpeed', 'speed', 'tilt', 'heading', 'time', 'fuelMass']
        .some(key => !Number.isFinite(record.touchdown[key]))
      || record.touchdown.fuelMass < 0 || record.touchdown.speed < 0 || record.touchdown.tilt < 0)) return false;
    if (record.samples.at(-1).status === 'landed' && (!['landing','launch'].includes(record.preset) || !record.touchdown)) return false;
    return record.samples[0].time === record.initialTime;
  } catch {
    return false;
  }
}

export function loadFlightRecords(storage) {
  try {
    if (storage === undefined) storage = globalThis.localStorage;
    const text = storage?.getItem(KEY);
    if (!text || text.length > 5_000_000) return [];
    const records = JSON.parse(text);
    return Array.isArray(records) ? records.filter(validRecord).slice(0, 3) : [];
  } catch {
    return [];
  }
}

export function saveFlightRecord(record, storage) {
  try {
    if (storage === undefined) storage = globalThis.localStorage;
    if (!storage || typeof storage.setItem !== 'function') return { ok: false, message: 'Saved runs are unavailable in this browser.' };
    if (!validRecord(record)) return { ok: false, message: 'This flight record is invalid and could not be saved.' };
    const records = [record, ...loadFlightRecords(storage).filter((saved) => saved.id !== record.id)].slice(0, 3);
    storage.setItem(KEY, JSON.stringify(records));
    return { ok: true, message: 'Flight saved in this browser. The latest three runs are retained.' };
  } catch {
    return { ok: false, message: 'This browser could not save the flight. Download CSV to keep a copy.' };
  }
}
