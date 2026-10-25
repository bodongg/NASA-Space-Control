import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrbitalMap } from '../render/orbitalMap.js';
import { ORBIT_CONFIG } from '../orbital/config.js';

function setup(t, width = 1200, height = 620) {
  let now = 0;
  t.mock.method(globalThis.performance, 'now', () => now);
  const originalImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  globalThis.Image = class {
    naturalWidth = 2048;
    naturalHeight = 1024;
    set src(value) { this.url = value; this.onload?.(); }
  };
  t.after(() => originalImage ? Object.defineProperty(globalThis, 'Image', originalImage) : delete globalThis.Image);
  const calls = [];
  const ctx = { measureText: text => ({ width: text.length * 7 }) };
  for (const name of ['setTransform', 'fillRect', 'beginPath', 'moveTo', 'lineTo', 'stroke',
    'setLineDash', 'arc', 'save', 'clip', 'restore', 'fill', 'fillText', 'translate', 'rotate',
    'bezierCurveTo', 'closePath', 'drawImage', 'strokeRect', 'rect']) {
    ctx[name] = (...args) => calls.push({ name, args });
  }
  for (const name of ['createLinearGradient', 'createRadialGradient']) {
    ctx[name] = (...args) => {
      const gradient = { addColorStop: (...stop) => calls.push({ name: 'colorStop', args: stop }) };
      calls.push({ name, args });
      return gradient;
    };
  }
  const renderer = createOrbitalMap({ getContext: () => ctx,
    getBoundingClientRect: () => ({ width, height }) });
  t.after(() => renderer.destroy());
  const state = Object.freeze({ time: 0, x: ORBIT_CONFIG.earth.radius, y: 0, vx: 0, vy: 0, fuelMass: 1000 });
  function draw(extra = {}, elapsed = 16) {
    now += elapsed;
    calls.length = 0;
    const frame = Object.freeze({ state, config: ORBIT_CONFIG, viewMode: 'flight', heading: 0,
      reducedMotion: true, ...extra,
      launch: Object.freeze({ altitude: 0, radialAngle: 0, phase: 'ascent', stage: 'booster',
        verticalSpeed: 0, horizontalSpeed: 0, padAltitude: 0, ...extra.launch }) });
    const before = structuredClone(frame);
    renderer.draw(frame);
    assert.deepEqual(frame, before, 'drawing does not change integrated mission state');
    for (const call of calls) for (const value of call.args) {
      if (typeof value === 'number') assert.ok(Number.isFinite(value), `${call.name} is finite`);
    }
    return [...calls];
  }
  return { draw, renderer, calls };
}

const pose = calls => ({ position: calls.findLast(call => call.name === 'translate')?.args,
  angle: calls.findLast(call => call.name === 'rotate')?.args[0] });
const landscape = calls => calls.find(call => call.name === 'drawImage' && call.args[0].url === '/flight/earth-launch.png');
const ground = calls => calls.find(call => call.name === 'fillRect' && call.args[0] === 0
  && call.args[1] > 250 && call.args[2] >= 390)?.args[1];

test('pad, 10 km and 100 km follow real altitude and move from landscape to curved Earth', t => {
  const { draw } = setup(t);
  const pad = draw();
  assert.ok(landscape(pad), 'pad starts in the local coastal launch landscape');
  const cloud = draw({ launch: { altitude: 10_000 } });
  const space = draw({ launch: { altitude: 100_000 } });
  assert.ok(pose(cloud).position[1] < pose(pad).position[1]);
  assert.ok(pose(space).position[1] <= pose(cloud).position[1]);
  assert.ok(!landscape(space), 'the ground photo does not follow the spacecraft to space');
  assert.ok(space.some(call => call.name === 'arc' && call.args[2] > 600), 'high ascent reveals curved Earth');
  const foot = pad.filter(call => call.name === 'lineTo' && call.args[0] < -40).at(-1);
  assert.ok(foot, 'stack has a visible support foot');
  assert.ok(Math.abs(pose(pad).position[1] - foot.args[0] - ground(pad)) < 0.01,
    'upright support foot is on the launch plane at zero altitude');
});

test('Earth-local heading uses the actual inertial heading relative to the local radial', t => {
  const { draw } = setup(t);
  assert.ok(Math.abs(pose(draw({ heading: 1, launch: { radialAngle: 1 } })).angle + Math.PI / 2) < 1e-12);
  assert.ok(Math.abs(pose(draw({ heading: 1.2, launch: { radialAngle: 1 } })).angle - (0.2 - Math.PI / 2)) < 1e-12);
});

test('the landscape reaches the viewport top at pad and while fading without distorting its aspect', t => {
  for (const [width, height] of [[1280, 900], [390, 844]]) {
    const { draw } = setup(t, width, height);
    for (const altitude of [0, 1000, 10_000]) {
      const image = landscape(draw({ launch: { altitude } })).args;
      assert.ok(image[2] <= 0, `${width}×${height} at ${altitude} m has no exposed sky seam`);
      assert.ok(image[1] <= 0 && image[1] + image[3] >= width, 'the image covers the viewport width');
      assert.equal(image[3] / image[4], 2, 'the landscape retains its source aspect ratio');
    }
  }
});

test('the launch pad stays on its own longitude as the tracked spacecraft moves sideways', t => {
  const { draw } = setup(t);
  const padX = calls => calls.find(call => call.name === 'fillRect' && call.args[3] === 6).args[0];
  const initial = draw({ launch: { launchAngle: 0 } });
  const east = draw({ launch: { radialAngle: 0.0001, launchAngle: 0 } });
  assert.ok(padX(east) < padX(initial), 'eastward spacecraft motion moves the fixed pad west in the following camera');
  assert.equal(pose(east).position[0], pose(initial).position[0], 'the spacecraft remains safely followed');
  assert.equal(padX(draw({ launch: { radialAngle: 1, launchAngle: 1 } })), padX(initial),
    'Earth rotation shared by pad and ship does not create false sideways motion');
});

test('exhaust requires active thrust and available propellant, with no exhaust after impact', t => {
  const { draw } = setup(t);
  const flames = frame => draw(frame).filter(call => call.name === 'bezierCurveTo').length;
  assert.equal(flames({ thrusting: false }), 0);
  assert.ok(flames({ thrusting: true }) > 0);
  assert.equal(flames({ thrusting: true, state: { time: 10, x: 6_371_000, y: 0, fuelMass: 0 } }), 0);
  assert.equal(flames({ thrusting: true, launch: { crashed: true } }), 0);
});

test('pad exhaust clips at the launch plane and dust disappears above low flight', t => {
  const { draw } = setup(t);
  const pad = draw({ thrusting: true });
  assert.equal(pad.find(call => call.name === 'rect').args[3], ground(pad), 'exhaust never penetrates the apron');
  assert.ok(pad.some(call => call.name === 'arc'), 'running engines disturb the launch apron');
  assert.equal(draw({ thrusting: true, launch: { altitude: 1000 } }).filter(call => call.name === 'arc').length, 0);
});

test('the cloud-bearing landscape ends at the troposphere boundary and the sky darkens continuously', t => {
  const { draw } = setup(t);
  const before = draw({ launch: { altitude: 11_999 } });
  const after = draw({ launch: { altitude: 12_000 } });
  assert.ok(landscape(before));
  assert.ok(!landscape(after));
  const skyTop = altitude => draw({ launch: { altitude } }).find(call => call.name === 'colorStop'
    && call.args[0] === 0 && String(call.args[1]).startsWith('rgb(')).args[1];
  assert.notEqual(skyTop(0), skyTop(50_000));
  assert.notEqual(skyTop(50_000), skyTop(100_000));
  assert.equal(skyTop(11_999), skyTop(12_000), 'crossing a display layer does not snap the sky color');
});

test('phone stack clears open controls, HUD and readouts in ordinary and expanded flight', t => {
  for (const height of [560, 844]) {
    const { draw } = setup(t, 390, height);
    for (const altitude of [0, 10_000, 100_000]) {
      const calls = draw({ presentationControlsVisible: true, launch: { altitude } });
      const centerY = pose(calls).position[1];
      const panelBottom = 110 + Math.max(100, height * 0.5 - 175);
      assert.ok(centerY - 43 >= panelBottom + 12, `${height}px stack clears control panel`);
      assert.ok(centerY + 43 < height - 148, `${height}px stack clears bottom readouts`);
    }
  }
});

test('upper stage geometry shortens the full booster stack without changing state', t => {
  const { draw } = setup(t);
  const booster = draw();
  const upper = draw({ launch: { stage: 'upper' } });
  const rocketSize = calls => calls.find(call => call.name === 'drawImage' && call.args[0].url === '/flight/rocket.png').args[3];
  assert.ok(rocketSize(upper) > rocketSize(booster), 'the lunar spacecraft is larger within the shorter upper stage view');
  assert.equal(rocketSize(draw({ launch: { stage: 0, stageName: 'Booster' } })), rocketSize(booster));
  assert.equal(rocketSize(draw({ launch: { stage: 1, stageName: 'Upper stage' } })), rocketSize(upper));
  assert.ok(rocketSize(draw({ launch: { stage: 2, stageName: 'Lunar spacecraft' } })) > rocketSize(upper));
  assert.ok(landscape(draw({ phase: 'orbit-insertion', launch: { phase: undefined } })), 'top-level mission phase is accepted');
});

test('map, departure, high orbit and lunar surface preserve the established renderer', t => {
  const { draw } = setup(t);
  for (const extra of [{ viewMode: 'map' }, { launch: { phase: 'departure' } },
    { launch: { phase: 'transfer' } }, { launch: { altitude: 450_000 } }]) {
    const calls = draw(extra);
    assert.ok(!landscape(calls));
    assert.ok(calls.some(call => call.name === 'fillText' && call.args[0] === 'Spacecraft'));
  }
  const lunar = draw({ launch: { phase: 'lunar-descent' },
    landing: { altitude: 0, radialAngle: 0, landed: true } });
  assert.ok(lunar.some(call => call.name === 'drawImage' && call.args[0].url === '/flight/lunar-surface.png'));
});

test('paused and reduced motion ascent freezes decorative effects and disposes cleanly', t => {
  const { draw, renderer, calls } = setup(t);
  const frame = { paused: true, reducedMotion: true, thrusting: true, launch: { altitude: 10 } };
  const first = draw(frame);
  assert.deepEqual(draw(frame, 60_000), first);
  renderer.destroy();
  calls.length = 0;
  renderer.draw({});
  assert.equal(calls.length, 0);
});

test('shared launch image completion redraws paused views and releases destroyed views', async t => {
  const images = [];
  const originalImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  globalThis.Image = class {
    naturalWidth = 1672;
    naturalHeight = 941;
    set src(value) { this.url = value; images.push(this); }
  };
  t.after(() => originalImage ? Object.defineProperty(globalThis, 'Image', originalImage) : delete globalThis.Image);
  const { createOrbitalMap: createFresh } = await import('../render/orbitalMap.js?launch-loading-lifecycle');
  let draws = 0;
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, { get: (_, name) => {
    if (name === 'measureText') return () => ({ width: 50 });
    if (name === 'createLinearGradient' || name === 'createRadialGradient') return () => gradient;
    return () => { if (name === 'fillRect') draws++; };
  }, set: () => true });
  const canvas = { getContext: () => ctx, getBoundingClientRect: () => ({ width: 800, height: 620 }) };
  const live = createFresh(canvas);
  const disposed = createFresh(canvas);
  t.after(() => { live.destroy(); disposed.destroy(); });
  assert.equal(images.filter(image => image.url === '/flight/earth-launch.png').length, 1);
  const frame = { state: { time: 0, x: 6_371_000, y: 0, fuelMass: 500 }, config: ORBIT_CONFIG,
    paused: true, viewMode: 'flight', launch: { altitude: 0, radialAngle: 0, phase: 'ascent' } };
  live.draw(frame);
  disposed.draw(frame);
  disposed.destroy();
  draws = 0;
  images.find(image => image.url === '/flight/earth-launch.png').onload();
  assert.ok(draws > 0, 'the loaded landscape refreshes the live paused view');
  assert.equal(live.getStatus().loaded, 1);
  live.destroy();
  draws = 0;
  images.find(image => image.url === '/flight/rocket.png').onload();
  assert.equal(draws, 0, 'destroyed views no longer redraw');
});
