import test from 'node:test';
import assert from 'node:assert/strict';
import { ORBIT_CONFIG } from '../orbital/config.js';
import { createOrbitState, orbitalAcceleration, stepOrbit } from '../orbital/physics.js';
const api = await import('../orbital/atmosphere.js').catch((error) => {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  return {};
});

test('exponential density decreases and teaching layers change at declared boundaries', () => {
  assert.equal(typeof api.atmosphereAt,'function');
  assert.equal(api.atmosphereAt(0).density,1.225);
  assert.ok(api.atmosphereAt(0).density>api.atmosphereAt(50000).density);
  for(const [h,layer] of [[0,'troposphere'],[11999,'troposphere'],[12000,'stratosphere'],[50000,'mesosphere'],[85000,'thermosphere'],[100000,'thermosphere'],[600000,'exosphere']])assert.equal(api.atmosphereAt(h).layer,layer);
  assert.throws(()=>api.atmosphereAt(NaN),RangeError);
});

test('drag opposes atmosphere-relative velocity and vanishes for a corotating vehicle', () => {
  const config={...ORBIT_CONFIG,atmosphere:{enabled:true,dragArea:15,rotationRate:7.2921159e-5}};
  const r=ORBIT_CONFIG.earth.radius+1000;
  const s=createOrbitState(config,{x:r,y:0,vx:100,vy:7.2921159e-5*r+200});
  const a=api.atmosphericDragAcceleration(s,config);
  assert.ok(a.ax*100+a.ay*200<0);
  const still=api.atmosphericDragAcceleration({...s,vx:0,vy:7.2921159e-5*r},config);
  assert.deepEqual(still,{ax:0,ay:0});
  const disabled={...config,atmosphere:{...config.atmosphere,enabled:false}};
  assert.deepEqual(api.atmosphericDragAcceleration(s,disabled),{ax:0,ay:0});
  assert.deepEqual(stepOrbit(s,{},disabled,.25),stepOrbit(s,{},ORBIT_CONFIG,.25));
  const drag=orbitalAcceleration(s,{},config), vacuum=orbitalAcceleration(s,{},disabled);
  assert.ok(drag.ax<vacuum.ax); assert.ok(drag.ay<vacuum.ay);
  assert.throws(()=>api.atmosphericDragAcceleration(s,{...config,atmosphere:{...config.atmosphere,dragArea:-1}}),RangeError);
});
