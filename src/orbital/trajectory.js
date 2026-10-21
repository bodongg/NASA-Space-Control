import { moonState } from './bodies.js';
import { createOrbitState } from './physics.js';
import { advanceMission } from './mission.js';

function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be finite and positive`);
  return value;
}

function point(state) {
  return { x: state.x, y: state.y, time: state.time };
}

function lunarPoint(state, config) {
  const moon = moonState(state.time, config);
  return { ...point(state), altitude: Math.hypot(state.x - moon.x, state.y - moon.y) - config.moon.radius };
}

// Coast uses the actual mission's Verlet step and swept surface/lost guards.
// Call in a worker: a three-day forecast deliberately does not run in a render frame.
export function predictTrajectory(state, config, options = {}) {
  const horizon = positive(options.horizon ?? 259200, 'Prediction horizon');
  if (horizon > 7 * 86400) throw new RangeError('Prediction horizon must be at most seven days');
  const step = Math.max(0.1, Math.min(1, positive(options.step ?? 1, 'Prediction step')));
  const sampleEvery = Math.max(step, positive(options.sampleEvery ?? 600, 'Prediction sampling interval'));
  if (!state || ['x', 'y', 'vx', 'vy', 'fuelMass', 'time', 'deltaVUsed'].some((key) => !Number.isFinite(state[key]))) {
    throw new RangeError('Prediction state must include finite position, velocity, fuel, time, and delta-v');
  }
  const initial = createOrbitState(config, state);
  let closest = lunarPoint(initial, config);
  let mission = { state: initial, config, status: 'active', preset: 'prediction', closestAltitude: closest.altitude };
  const points = [point(initial)];
  const end = initial.time + horizon;
  let nextSample = initial.time + sampleEvery;
  while (mission.status === 'active' && mission.state.time < end) {
    const beforeTime = mission.state.time;
    mission = advanceMission(mission, {}, Math.min(step, end - beforeTime), { stopAtFlyby: false });
    const candidate = lunarPoint(mission.state, config);
    if (candidate.altitude < closest.altitude) closest = candidate;
    if (mission.state.time >= nextSample) {
      points.push(point(mission.state));
      nextSample += sampleEvery;
    }
    if (mission.state.time === beforeTime) break;
  }
  if (points.at(-1).time !== mission.state.time) points.push(point(mission.state));
  return { points, closest, endStatus: mission.status, horizon, step };
}

