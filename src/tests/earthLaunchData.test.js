import test from 'node:test';
import assert from 'node:assert/strict';
import { createMission } from '../orbital/mission.js';
import { createFlightRecord, appendTelemetry, summarizeRun, telemetryCsv, flightReportMarkdown } from '../orbital/telemetry.js';
import { saveFlightRecord, loadFlightRecords } from '../orbital/runStore.js';

const stages = [
  {stageName:'Booster',dryMass:25000,fuelMass:400000,maxThrust:7000000,specificImpulse:300},
  {stageName:'Upper stage',dryMass:8000,fuelMass:100000,maxThrust:1200000,specificImpulse:450},
  {stageName:'Lunar spacecraft',dryMass:4000,fuelMass:16000,maxThrust:100000,specificImpulse:450},
];
function launch() {
  const original = createMission();
  return {...original,preset:'launch',phase:'ascent',stageEvents:[],
    launch:{stage:0,stageName:'Booster',stages,liftedOff:true,departureElapsed:0,padAngle:0},
    config:{...original.config,vehicle:{dryMass:37000,fuelMass:516000,maxThrust:7000000,specificImpulse:300},atmosphere:{enabled:true,rotationRate:7.2921159e-5}},
    state:{...original.state,fuelMass:516000}};
}
function separated() {
  const start=launch();
  const end={...start,phase:'departure',launch:{...start.launch,stage:2,stageName:'Lunar spacecraft'},
    config:{...start.config,atmosphere:{...start.config.atmosphere,enabled:false},vehicle:stages[2]},
    state:{...start.state,time:1900,fuelMass:16000,deltaVUsed:8000},stageEvents:[
      {type:'stage-separation',stage:0,stageName:'Booster',time:168,discardedDryMass:25000,discardedFuelMass:0},
      {type:'stage-separation',stage:1,stageName:'Upper stage',time:1892,discardedDryMass:8000,discardedFuelMass:4560.4},
    ]};
  return {start,end};
}
const storage=()=>{let value;return {getItem:()=>value,setItem:(key,next)=>{value=next;}};};

test('launch samples record stage, actual Earth atmosphere and relative motion',()=>{
  const record=createFlightRecord(launch());
  assert.equal(record.samples[0].stageName,'Booster');
  assert.equal(record.samples[0].phase,'ascent');
  assert.ok(Number.isFinite(record.samples[0].earthVerticalSpeed));
  assert.ok(Number.isFinite(record.samples[0].dynamicPressure));
  assert.equal(record.launchSetup.stages.length,3);
});
test('launch summaries distinguish spent propellant from explicitly discarded upper-stage fuel',()=>{
  const {start,end}=separated();
  const initial=createFlightRecord(start);
  const record=appendTelemetry(initial,end,true);
  const summary=summarizeRun(record);
  assert.ok(Math.abs(summary.fuelUsed-495439.6)<1e-6);
  assert.equal(summary.discardedFuelMass,4560.4);
  assert.equal(summary.discardedDryMass,33000);
  assert.equal(record.stageEvents.length,2);
  assert.notEqual(record.stageEvents,end.stageEvents);
  assert.equal(initial.stageEvents.length,0);
});
test('launch records persist alongside older records and reject corrupt stage metadata',()=>{
  const store=storage();
  const {start,end}=separated();
  const record=appendTelemetry(createFlightRecord(start),end,true);
  assert.equal(saveFlightRecord(createFlightRecord(createMission()),store).ok,true);
  assert.equal(saveFlightRecord(record,store).ok,true);
  assert.equal(loadFlightRecords(store).length,2);
  const corrupt=structuredClone(record); corrupt.stageEvents[0].discardedFuelMass=-1;
  assert.equal(saveFlightRecord(corrupt,store).ok,false);
});
test('full-flight exports explain stages, drag, jettison and the whole mission interval',()=>{
  const {start,end}=separated();
  const record=appendTelemetry(createFlightRecord(start),end,true);
  const csv=telemetryCsv(record),report=flightReportMarkdown(record);
  assert.match(csv,/earth_vertical_speed_m_per_s/);
  assert.match(csv,/dynamic_pressure_Pa/);
  assert.match(csv,/discarded_fuel_mass_kg/);
  assert.match(report,/Earth launch/);
  assert.match(report,/atmospheric drag/);
  assert.match(report,/Booster/);
  assert.match(report,/Discarded propellant/);
  assert.ok(!report.includes('450 s departure burn already completed'));
  assert.ok(!report.includes('departure fuel and delta-v are excluded'));
});
