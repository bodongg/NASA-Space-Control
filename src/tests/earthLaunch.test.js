import test from 'node:test';
import assert from 'node:assert/strict';
import { orbitalAcceleration, stepOrbit } from '../orbital/physics.js';
import { lunarLandingDiagnostics } from '../orbital/lunarLanding.js';
import { moonState } from '../orbital/bodies.js';
const api = await import('../orbital/earthLaunch.js').catch((error) => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return {};
});
const near = (a, b, tolerance) => assert.ok(Math.abs(a-b) <= tolerance, `${a} versus ${b}`);

test('launch starts on the rotating pad with a stack that can lift off and has all tanks attached', () => {
  assert.equal(typeof api.createEarthLaunchMission, 'function');
  const m=api.createEarthLaunchMission(), d=api.earthLaunchDiagnostics(m);
  assert.equal(m.preset,'launch'); assert.equal(m.phase,'ascent'); assert.equal(m.state.time,0);
  near(d.altitude,0,1e-7); near(d.verticalSpeed,0,1e-9); near(d.horizontalSpeed,464.580703989,1e-6);
  assert.equal(m.config.vehicle.dryMass+m.state.fuelMass,553000);
  const thrustAcceleration=m.config.vehicle.maxThrust/(m.config.vehicle.dryMass+m.state.fuelMass);
  assert.ok(thrustAcceleration>9.81);
  assert.equal(m.state.fuelMass,516000); assert.equal(m.launch.liftedOff,false);
  assert.ok(Object.isFrozen(api.EARTH_LAUNCH_STAGES));
});

test('pad support holds a nonlifting engine, burns actual propellant and permits later liftoff', () => {
  const m=api.createEarthLaunchMission(), initial=structuredClone(m);
  const held=api.advanceEarthLaunch(m,{throttle:.1,heading:0},10,{guided:false});
  assert.equal(held.status,'active'); assert.equal(held.launch.liftedOff,false);
  near(api.earthLaunchDiagnostics(held).altitude,0,1e-7);
  assert.ok(held.state.fuelMass<m.state.fuelMass);
  near(held.state.time,10,1e-12);
  const lifted=api.advanceEarthLaunch(held,{},10);
  assert.equal(lifted.launch.liftedOff,true); assert.ok(api.earthLaunchDiagnostics(lifted).altitude>0);
  assert.deepEqual(m,initial);
});

test('discarding both ascent stages on the pad never turns supported rest into an impact', () => {
  const exhausted=api.advanceEarthLaunch(api.createEarthLaunchMission(),{throttle:1,heading:Math.PI},550,{guided:false});
  assert.equal(exhausted.launch.stage,2); assert.equal(exhausted.launch.liftedOff,false);
  const waiting=api.advanceEarthLaunch(exhausted,{throttle:0},800,{guided:false});
  assert.equal(waiting.status,'active'); assert.equal(waiting.launch.liftedOff,false);
  near(api.earthLaunchDiagnostics(waiting).altitude,0,1e-7);
  assert.equal(waiting.state.fuelMass,exhausted.state.fuelMass);
  assert.equal(waiting.state.time,1350);
  assert.equal(waiting.launch.departureElapsed,0);
});

test('co-rotating pad support tracks the real closest lunar altitude while time advances', () => {
  const initial=api.createEarthLaunchMission();
  const waiting=api.advanceEarthLaunch(initial,{throttle:0},63000,{guided:false});
  const moon=moonState(waiting.state.time,waiting.config);
  const currentAltitude=Math.hypot(waiting.state.x-moon.x,waiting.state.y-moon.y)-waiting.config.moon.radius;
  assert.ok(waiting.closestAltitude<=currentAltitude+1e-5);
  assert.ok(waiting.closestAltitude<initial.closestAltitude-1e6);
  assert.equal(waiting.state.fuelMass,initial.state.fuelMass);
  assert.equal(waiting.status,'active');
});

test('the lunar spacecraft still experiences Earth air drag after early manual stage separation', () => {
  const m=api.advanceEarthLaunch(api.createEarthLaunchMission(),{throttle:1,heading:Math.PI},550,{guided:false});
  assert.equal(m.launch.stage,2);
  const moving={...m.state,vx:m.state.vx+100,vy:m.state.vy+200};
  const actual=orbitalAcceleration(moving,{},m.config);
  const vacuum=orbitalAcceleration(moving,{},{...m.config,atmosphere:{...m.config.atmosphere,enabled:false}});
  assert.ok((actual.ax-vacuum.ax)*100+(actual.ay-vacuum.ay)*200<0);
});

test('ideal staged delta-v counts full remaining propellant and reduces to the lander rocket equation', () => {
  const m=api.createEarthLaunchMission();
  const expected=9.80665*(300*Math.log(553000/153000)+450*Math.log(128000/28000)+450*Math.log(20000/4000));
  near(api.earthLaunchDiagnostics(m).idealDeltaVRemaining,expected,1e-8);
  const lander=api.advanceEarthLaunch(m,{},2400);
  assert.equal(lander.launch.stage,2);
  near(api.earthLaunchDiagnostics(lander).idealDeltaVRemaining,
    450*9.80665*Math.log((4000+lander.state.fuelMass)/4000),1e-8);
});

test('guided launch preserves physical state and mass through actual insertion, departure and lunar contact', (t) => {
  let m=api.createEarthLaunchMission(), initial=structuredClone(m), previous=m, frames=0;
  const phases=new Set([m.phase]); let insertion;
  while(m.status==='active'&&m.state.time<260000&&frames<100000){
    const c=api.earthLaunchGuidance(m), warp=api.earthLaunchWarp(m,c,10000);
    const chunk=[1/60,1/48,1/30][frames++%3]*warp;
    previous=m; m=api.advanceEarthLaunch(m,c,chunk);
    assert.ok(m.state.time>=previous.state.time);
    assert.ok(m.state.fuelMass<=previous.state.fuelMass+1e-7);
    for(const value of Object.values(m.state)) assert.ok(Number.isFinite(value));
    assert.equal(m.preset,'launch'); phases.add(m.phase);
    if(previous.launch.stage===1&&m.launch.stage===2) insertion=m.stageEvents.at(-1);
  }
  assert.equal(m.status,'landed'); assert.equal(m.phase,'landed');
  assert.ok(m.state.time>220000&&m.state.time<240000);
  assert.ok(m.state.fuelMass>300&&m.state.fuelMass<500);
  assert.ok(Math.abs(m.touchdown.verticalSpeed)<.4);
  assert.ok(Math.abs(m.touchdown.horizontalSpeed)<.01);
  assert.ok(m.touchdown.tilt<10*Math.PI/180);
  near(lunarLandingDiagnostics(m).altitude,0,1e-6);
  for(const p of ['ascent','orbit-insertion','departure','transfer','braking','descent','final-descent','landed']) assert.ok(phases.has(p),p);
  assert.equal(m.stageEvents.length,2);
  for(const e of m.stageEvents){
    for(const key of ['x','y','vx','vy','time','deltaVUsed']) assert.equal(e.before[key],e.after[key],key);
    near(e.before.fuelMass-e.after.fuelMass,e.discardedFuelMass,1e-6);
    near(e.before.dryMass-e.after.dryMass,e.discardedDryMass,1e-6);
    assert.ok(Object.isFrozen(e)); assert.ok(Object.isFrozen(e.before));
  }
  assert.ok(insertion.discardedFuelMass>3000&&insertion.discardedFuelMass<6000);
  near(Math.hypot(insertion.before.x,insertion.before.y)-m.config.earth.radius,400000,1);
  assert.equal(m.launch.departureElapsed,450);
  assert.deepEqual(api.advanceEarthLaunch(m,{throttle:1},10000),m);
  assert.deepEqual(initial,api.createEarthLaunchMission());
  t.diagnostic(JSON.stringify({frames,time:m.state.time,fuel:m.state.fuelMass,touchdown:m.touchdown,events:m.stageEvents}));
});

test('manual cutoff after liftoff causes a real Earth impact and freezes the crash', () => {
  let m=api.advanceEarthLaunch(api.createEarthLaunchMission(),{},10);
  for(let i=0;i<500&&m.status==='active';i++)m=api.advanceEarthLaunch(m,{throttle:0},1,{guided:false});
  assert.equal(m.status,'earth-impact'); assert.equal(m.phase,'crash');
  assert.deepEqual(api.advanceEarthLaunch(m,{throttle:1},1000),m);
});

test('invalid initial body overlaps crash before evaluating gravity or applying pad support', () => {
  const m=api.createEarthLaunchMission();
  for(const x of [0,m.config.earth.radius-1]){
    const overlapping={...m,state:{...m.state,x,y:0}};
    const after=api.advanceEarthLaunch(overlapping,{},1);
    assert.equal(after.status,'earth-impact'); assert.equal(after.phase,'crash');
    assert.equal(after.state.time,0);
  }
});

test('guided and manual warp are bounded, controls finite, and invalid inputs reject before integration', () => {
  const m=api.createEarthLaunchMission();
  assert.equal(api.earthLaunchWarp(m,{},10000),5);
  assert.equal(api.earthLaunchWarp(m,{throttle:1},10000,false),5);
  const higher={...m,launch:{...m.launch,liftedOff:true},state:{...m.state,x:m.config.earth.radius+20000}};
  assert.equal(api.earthLaunchWarp(higher,{},10000),20);
  for(const seconds of [-1,NaN,Infinity]) assert.throws(()=>api.advanceEarthLaunch(m,{},seconds),RangeError);
  for(const c of [{throttle:NaN},{heading:Infinity}]) {
    assert.throws(()=>api.advanceEarthLaunch(m,c,1),RangeError);
    assert.throws(()=>api.earthLaunchWarp(m,c,10),RangeError);
  }
  for(const warp of [0,NaN,Infinity])assert.throws(()=>api.earthLaunchWarp(m,{},warp),RangeError);
  assert.deepEqual(api.advanceEarthLaunch(m,{},0),m);
  const corrupted={...m,state:{...m.state,vx:NaN}};
  assert.throws(()=>api.earthLaunchDiagnostics(corrupted),RangeError);
});
