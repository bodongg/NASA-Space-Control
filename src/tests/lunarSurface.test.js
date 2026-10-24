import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrbitalMap } from '../render/orbitalMap.js';
import { ORBIT_CONFIG } from '../orbital/config.js';
import { moonState } from '../orbital/bodies.js';

function setup(t, width = 1200, height = 800) {
  let now = 0;
  t.mock.method(globalThis.performance, 'now', () => now);
  const imageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  globalThis.Image = class {
    naturalWidth = 2048;
    naturalHeight = 1024;
    set src(value) { this.url = value; this.onload?.(); }
  };
  t.after(() => imageDescriptor ? Object.defineProperty(globalThis, 'Image', imageDescriptor) : delete globalThis.Image);
  const calls = [];
  const ctx = { measureText: text => ({ width: text.length * 7 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }) };
  for (const name of ['setTransform', 'fillRect', 'beginPath', 'moveTo', 'lineTo', 'stroke',
    'setLineDash', 'arc', 'save', 'clip', 'restore', 'fill', 'fillText', 'translate', 'rotate',
    'bezierCurveTo', 'closePath', 'drawImage', 'strokeRect', 'rect']) {
    ctx[name] = (...args) => calls.push({ name, args });
  }
  const moon = moonState(100, ORBIT_CONFIG);
  const state = Object.freeze({ time: 100, x: moon.x + ORBIT_CONFIG.moon.radius + 100,
    y: moon.y, vx: moon.vx, vy: moon.vy, fuelMass: 500 });
  const renderer = createOrbitalMap({ getContext: () => ctx,
    getBoundingClientRect: () => ({ width, height }) });
  t.after(() => renderer.destroy());
  function draw(extra = {}, elapsed = 16) {
    now += elapsed;
    calls.length = 0;
    const frame = Object.freeze({ state, config: ORBIT_CONFIG, viewMode: 'flight', heading: 0,
      reducedMotion: true, landing: Object.freeze({ altitude: 100, radialAngle: 0, phase: 'descent', ...extra.landing }), ...extra });
    const before = structuredClone(frame);
    renderer.draw(frame);
    assert.deepEqual(frame, before, 'rendering must not mutate physical or landing inputs');
    return [...calls];
  }
  return { draw, renderer, calls };
}

const rocketPose = calls => ({
  position: calls.findLast(call => call.name === 'translate')?.args,
  angle: calls.findLast(call => call.name === 'rotate')?.args[0],
});
const ground = calls => calls.find(call => call.name === 'fillRect' && call.args[0] === 0
  && call.args[1] > 200 && call.args[2] >= 390)?.args[1];

// Catches camera framing that stops following physical altitude or leaves the hull below contact.
test('actual lunar altitude descends to landing feet at visible ground contact', t => {
  const { draw } = setup(t);
  const high = draw({ landing: { altitude: 100, radialAngle: 0 } });
  const low = draw({ landing: { altitude: 20, radialAngle: 0 } });
  const contact = draw({ paused: true, landing: { altitude: 0, radialAngle: 0, landed: true } });
  assert.ok(rocketPose(high).position[1] < rocketPose(low).position[1]);
  assert.ok(rocketPose(low).position[1] < rocketPose(contact).position[1]);
  const legEnds = contact.filter(call => call.name === 'lineTo').map(call => call.args)
    .filter(([x, y]) => x < -40 && Math.abs(y) < 40);
  assert.ok(legEnds.length >= 2, 'mechanical legs are drawn');
  const lowestLeg = Math.max(...legEnds.map(([x]) => -x));
  assert.ok(Math.abs(rocketPose(contact).position[1] + lowestLeg - ground(contact)) < 0.01,
    'upright lowest foot touches the physical contact plane');
  assert.ok(contact.some(call => call.name === 'fillText' && call.args[0].includes('0.0 m')));
  assert.ok(contact.some(call => call.name === 'drawImage' && call.args[0].url === '/flight/lunar-surface.png'));
});

// Catches inertial heading reuse and decorative flames after guidance shuts the engine off.
test('lunar frame transforms actual heading and only actual active thrust draws exhaust', t => {
  const { draw } = setup(t);
  const radial = draw({ heading: 1, landing: { altitude: 20, radialAngle: 1 } });
  assert.ok(Math.abs(rocketPose(radial).angle + Math.PI / 2) < 1e-12);
  const off = draw({ heading: 1.2, landing: { altitude: 20, radialAngle: 1 } });
  assert.equal(off.filter(call => call.name === 'bezierCurveTo').length, 0);
  assert.ok(Math.abs(rocketPose(off).angle - (0.2 - Math.PI / 2)) < 1e-12);
  const on = draw({ thrusting: true, landing: { altitude: 20, radialAngle: 0 } });
  assert.ok(on.some(call => call.name === 'bezierCurveTo'));
  const landed = draw({ thrusting: true, landing: { altitude: 0, radialAngle: 0, landed: true } });
  const crash = draw({ thrusting: true, landing: { altitude: -3, radialAngle: 0, crashed: true } });
  assert.equal(landed.filter(call => call.name === 'bezierCurveTo').length, 0);
  assert.equal(crash.filter(call => call.name === 'bezierCurveTo').length, 0);
});

// Catches the final descent/rocket being hidden behind phone presentation controls.
test('phone camera reserves the open control panel and still shows the surface', t => {
  const { draw } = setup(t, 390, 844);
  const open = draw({ presentationControlsVisible: true, landing: { altitude: 1800, radialAngle: 0 } });
  const closed = draw({ presentationControlsVisible: false, landing: { altitude: 1800, radialAngle: 0 } });
  assert.ok(rocketPose(open).position[1] - 46 >= 375, 'rocket nose clears the panel ending at 357px');
  assert.ok(ground(open) > rocketPose(open).position[1] && ground(open) < 844 - 150);
  assert.ok(rocketPose(closed).position[1] < rocketPose(open).position[1]);
  const terrain = open.find(call => call.name === 'drawImage' && call.args[0].url === '/flight/lunar-surface.png').args;
  assert.ok(Math.abs(terrain[3] / terrain[4] - terrain[7] / terrain[8]) < 1e-9,
    'phone crop preserves crater and rock proportions');
});

// Catches an angled hull or landing pad extending below ground after a manual hard impact.
test('tilted contact keeps the entire hull and mechanical feet above the ground plane', t => {
  const { draw } = setup(t);
  for (const heading of [0.4, -0.8, Math.PI / 2, Math.PI]) {
    const calls = draw({ heading, landing: { altitude: -1, radialAngle: 0, crashed: true } });
    const pose = rocketPose(calls);
    const hull = calls.find(call => call.name === 'drawImage' && call.args[0].url === '/flight/rocket.png').args;
    const corners = [[hull[1], hull[2]], [hull[1] + hull[3], hull[2]],
      [hull[1], hull[2] + hull[4]], [hull[1] + hull[3], hull[2] + hull[4]]];
    const translateIndex = calls.findLastIndex(call => call.name === 'translate');
    const feet = calls.slice(translateIndex).filter(call => call.name === 'lineTo' && call.args[0] < -40)
      .map(call => call.args);
    for (const [x, y] of [...corners, ...feet]) {
      const screenY = pose.position[1] + x * Math.sin(pose.angle) + y * Math.cos(pose.angle);
      assert.ok(screenY <= ground(calls) + 0.001, 'hull and foot never penetrate the contact plane');
    }
  }
});

// Catches surface camera leaking into Map mode, drift while paused, and listeners after disposal.
test('surface rendering preserves map mode, reduced motion, pause and disposal', t => {
  const { draw, renderer, calls } = setup(t);
  const still = { paused: true, reducedMotion: true,
    landing: { altitude: 0, radialAngle: 0, landed: true } };
  const first = draw(still);
  assert.deepEqual(draw(still, 10_000), first);
  const map = draw({ ...still, viewMode: 'map' });
  assert.ok(map.some(call => call.name === 'fillText' && call.args[0] === 'Moon'));
  assert.ok(!map.some(call => call.name === 'drawImage' && call.args[0].url === '/flight/lunar-surface.png'));
  renderer.destroy();
  calls.length = 0;
  renderer.draw({});
  assert.equal(calls.length, 0);
});

// Catches loading the same terrain for every view or retaining redraws after the view is destroyed.
test('shared terrain image loading redraws live views and releases disposed views', async t => {
  const images = [];
  const imageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  globalThis.Image = class {
    naturalWidth = 1672;
    naturalHeight = 941;
    set src(value) { this.url = value; images.push(this); }
  };
  t.after(() => imageDescriptor ? Object.defineProperty(globalThis, 'Image', imageDescriptor) : delete globalThis.Image);
  const { createOrbitalMap: createFresh } = await import('../render/orbitalMap.js?loading-lifecycle');
  let draws = 0;
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, { get: (_, name) => {
    if (name === 'measureText') return () => ({ width: 50 });
    if (name === 'createLinearGradient' || name === 'createRadialGradient') return () => gradient;
    return () => { if (name === 'fillRect') draws++; };
  }, set: () => true });
  const canvas = { getContext: () => ctx, getBoundingClientRect: () => ({ width: 800, height: 600 }) };
  const live = createFresh(canvas);
  const disposed = createFresh(canvas);
  t.after(() => { live.destroy(); disposed.destroy(); });
  assert.equal(images.filter(image => image.url === '/flight/lunar-surface.png').length, 1);
  const frame = { state: { time: 100, x: 20_000_000, y: 0 }, config: ORBIT_CONFIG,
    viewMode: 'flight', landing: { altitude: 0, radialAngle: 0, landed: true } };
  live.draw(frame);
  disposed.draw(frame);
  disposed.destroy();
  draws = 0;
  const terrain = images.find(image => image.url === '/flight/lunar-surface.png');
  terrain.onload();
  assert.ok(draws > 0, 'asset completion refreshes the live paused view');
  live.destroy();
  draws = 0;
  images.find(image => image.url === '/flight/rocket.png').onload();
  assert.equal(draws, 0, 'destroyed views no longer redraw on delayed asset completion');
});
