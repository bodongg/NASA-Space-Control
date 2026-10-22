import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrbitalMap } from '../render/orbitalMap.js';
import { ORBIT_CONFIG } from '../orbital/config.js';

const degrees = value => value * Math.PI / 180;
const state = Object.freeze({ time: 100, x: 20_000_000, y: 0, vx: 0, vy: 4000, fuelMass: 6000 });

function setup(t) {
  let now = 0;
  t.mock.method(globalThis.performance, 'now', () => now);
  const calls = [];
  const ctx = {
    measureText: text => ({ width: text.length * 7 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
  };
  for (const name of ['setTransform', 'fillRect', 'beginPath', 'moveTo', 'lineTo', 'stroke',
    'setLineDash', 'arc', 'save', 'clip', 'restore', 'fill', 'fillText', 'translate', 'rotate',
    'bezierCurveTo', 'closePath', 'drawImage', 'strokeRect']) {
    ctx[name] = (...args) => calls.push({ name, args });
  }
  const map = createOrbitalMap({ getContext: () => ctx, getBoundingClientRect: () => ({ width: 600, height: 390 }) });
  t.after(() => map.destroy());
  return (frame = {}, elapsed = 16) => {
    now += elapsed;
    calls.length = 0;
    map.draw({ state, config: ORBIT_CONFIG, reducedMotion: false, ...frame });
    const ship = calls.findLast(call => call.name === 'translate')?.args;
    const rotation = calls.findLast(call => call.name === 'rotate')?.args[0];
    const earth = calls.find(call => call.name === 'arc')?.args;
    return { ship, rotation, calls: [...calls], earth };
  };
}

// Catches a direct heading snap or interpolation through the long side of the wrap.
test('display heading turns gradually across the shortest wrap without changing inputs', t => {
  const draw = setup(t);
  const trail = Object.freeze([Object.freeze({ x: 19_000_000, y: 0 })]);
  const frame = Object.freeze({ state, config: ORBIT_CONFIG, trail, heading: degrees(-179) });
  const before = structuredClone(frame);
  draw({ heading: degrees(179) });
  const next = draw(frame);
  const display = -next.rotation;
  assert.ok(display > degrees(179) && display < degrees(181), 'crosses +180 gradually instead of snapping to -179');
  assert.deepEqual(frame, before);
});

// Catches using simulation time, negative elapsed time, or a long inactive-tab delta.
test('heading easing bounds wall time and settles while simulation is paused', t => {
  const draw = setup(t);
  draw({ heading: 0, paused: true });
  const backward = draw({ heading: Math.PI, paused: true }, -50);
  assert.equal(Math.abs(backward.rotation), 0);
  const resumed = draw({ heading: Math.PI, paused: true }, 60_000);
  assert.ok(Math.abs(resumed.rotation) > 0 && Math.abs(resumed.rotation) <= Math.PI / 2, 'wall-time jump cannot snap a half-turn');
  let settled;
  for (let i = 0; i < 120; i++) settled = draw({ heading: Math.PI, paused: true });
  assert.ok(Math.abs(Math.abs(settled.rotation) - Math.PI) < 0.001);
});

// Catches removing scale easing or letting a camera transition violate the hull clearance.
test('flight zoom eases while preserving physical surface clearance', t => {
  const draw = setup(t);
  const first = draw({ viewMode: 'flight' });
  const next = draw({ viewMode: 'flight', zoom: 2 });
  const scale = result => (result.ship[0] - result.earth[0]) / state.x;
  assert.ok(scale(next) > scale(first) && scale(next) < scale(first) * 2);
  const closeState = Object.freeze({ ...state, x: ORBIT_CONFIG.earth.radius + 400_000 });
  const close = draw({ viewMode: 'flight', state: closeState });
  const closeScale = (close.ship[0] - close.earth[0]) / closeState.x;
  assert.ok(400_000 * closeScale >= 68 - 1e-8, 'physical Earth surface stays outside the illustrated hull');
});

// Catches snapping a follow change or making reduced motion retain stale camera/heading interpolation.
test('follow changes ease and reduced motion immediately uses requested camera and heading', t => {
  const draw = setup(t);
  const initial = draw();
  const easing = draw({ follow: 'moon' });
  const immediate = draw({ follow: 'moon', heading: -2, reducedMotion: true });
  assert.ok(easing.ship[0] < initial.ship[0] && easing.ship[0] > immediate.ship[0]);
  assert.equal(immediate.rotation, 2);
  draw({ viewMode: 'flight', zoom: 1, reducedMotion: true });
  const zoomed = draw({ viewMode: 'flight', zoom: 2, reducedMotion: true });
  assert.deepEqual(zoomed.ship, [360, 195]);
  const scale = (zoomed.ship[0] - zoomed.earth[0]) / state.x;
  assert.ok(Math.abs(scale - 390 / (20_000_000 * 2.3) * 2) < 1e-14);
});

// Catches a smoothed world position lagging behind the real ship at high warp or after reset.
test('flight follows current position through high warp, view changes, and resets', t => {
  const draw = setup(t);
  draw({ follow: 'moon', zoom: 8 });
  const frames = [
    { ...state, time: 50_000, x: 180_000_000, y: 80_000_000 },
    { ...state, time: 90_000, x: 370_000_000, y: 75_000_000 },
    { ...state, time: 0, x: 6_771_000, y: 0 },
  ];
  for (const nextState of frames) {
    const frame = Object.freeze({ viewMode: 'flight', state: Object.freeze(nextState), zoom: 128 });
    const result = draw(frame);
    assert.ok(result.ship, 'ship is drawn');
    assert.ok(result.ship[0] > 59 && result.ship[0] < 541 && result.ship[1] > 59 && result.ship[1] < 331);
    for (const call of result.calls) for (const value of call.args) {
      if (typeof value === 'number') assert.ok(Number.isFinite(value), `${call.name} is finite`);
    }
  }
  const current = Object.freeze({ ...state, time: 200_000, x: -150_000_000, y: 300_000_000 });
  const followed = draw({ viewMode: 'flight', state: current });
  assert.deepEqual(followed.ship, [360, 195], 'reset cleared transition offset; physical flight follow has no lag');
});
