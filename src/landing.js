import './styles.css';
import { DEFAULT_CONFIG, PLANETS } from './config.js';
import { acceleration, createInitialState } from './physics.js';
import { Panel } from './ui/components/Panel.js';
import { Readout } from './ui/components/Readout.js';
import { Gauge } from './ui/components/Gauge.js';
import { StatusLight } from './ui/components/StatusLight.js';
import { Slider } from './ui/components/Slider.js';
import { Button } from './ui/components/Button.js';

const app = document.querySelector('#app');
app.innerHTML = '<header id="top" class="site-header"><div class="header-inner"><a class="project-brand" href="#top">Rocket Landing<span>Mission Control</span></a><a class="nasa-brand" href="https://www.nasa.gov/" target="_blank" rel="noopener noreferrer" aria-label="NASA reference website"><img src="/images/nasa-logo.svg" alt="NASA" width="64" height="64"/></a><nav class="header-nav" aria-label="Project navigation"><a href="#preflight">Preflight</a><a href="#physics">The physics <svg class="arrow-icon arrow-diagonal" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a></nav></div></header><main><section class="mission-hero" aria-labelledby="mission-title"><img class="hero-image" src="/images/tranquility-base.jpg" alt="The Apollo 11 lunar module at Tranquility Base, photographed by Neil Armstrong." width="1041" height="1048"/><div class="hero-overlay"></div><div class="hero-content app-shell"><h1 id="mission-title">The final<br>400 meters.</h1><p>Take control of thrust and direction. Explore the physics that brings a spacecraft safely to the surface.</p><a class="hero-action" href="#preflight">Explore the controls <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg></a></div><div class="hero-bottom app-shell"><dl class="mission-facts"><div><dt>The simulation</dt><dd>2D powered descent</dd></div><div><dt>Your starting point</dt><dd>400 m above the surface</dd></div><div><dt>The objective</dt><dd>A controlled touchdown</dd></div></dl><p class="photo-credit">Apollo 11 · Tranquility Base<br>NASA / Neil Armstrong</p></div></section><section id="preflight" class="lab-section"><div class="app-shell"><div class="workspace-heading"><div><h2>Before the descent.</h2><p>Get a feel for the forces. Choose a world, set your angle, and see what your engine can do.</p></div><span class="workspace-phase">Preflight lab <svg class="arrow-icon arrow-down" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></span></div><div id="workspace" class="workspace-grid"></div></div></section><section class="model-section"><div class="app-shell model-layout"><h2>Small adjustments.<br>Measurable changes.</h2><div><p>Tilting the engine redirects part of its thrust sideways. That means less force is available to oppose gravity, even when the throttle stays the same.</p><p>This preflight check holds the vehicle at the surface and keeps its fuel mass constant. The readings show the instantaneous acceleration the forces would produce.</p><a href="#preflight" class="text-link">Try another angle <svg class="arrow-icon arrow-up" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a></div></div></section></main><footer class="page-footer"><div class="app-shell footer-layout"><div><h2>Rocket Landing.</h2><p>An independent Physics 1 student simulation inspired by NASA. This project is not affiliated with or endorsed by NASA.</p></div><div class="footer-links"><a href="https://www.nasa.gov/" target="_blank" rel="noopener noreferrer">NASA design reference <svg class="arrow-icon arrow-diagonal" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a><a href="https://www.nasa.gov/image-article/lunar-module-tranquility-base/" target="_blank" rel="noopener noreferrer">Photograph & credit <svg class="arrow-icon arrow-diagonal" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a><span>NASA insignia and imagery: NASA</span></div></div></footer>';
const workspace = document.querySelector('#workspace');
const controlsPanel = Panel({ title: 'Configure your engine', description: 'Test your settings before committing to a descent.', className: 'controls-panel' });
const vectorPanel = Panel({ title: 'See the forces', description: 'Angle is measured from vertical. Positive points right.', className: 'vector-panel' });
const responsePanel = Panel({ title: 'Understand the response', description: 'Real calculations from your engine, mass, and environment.', className: 'response-panel' });
responsePanel.element.id = 'physics';
workspace.append(controlsPanel.element, vectorPanel.element, responsePanel.element);

const planetField = document.createElement('div');
planetField.className = 'planet-field';
const planetLabel = document.createElement('label');
planetLabel.className = 'field-label';
planetLabel.htmlFor = 'planet';
planetLabel.textContent = 'Landing environment';
const planetSelect = document.createElement('select');
planetSelect.id = 'planet';
for (const planet of Object.values(PLANETS)) {
  const option = document.createElement('option');
  option.value = planet.name;
  option.textContent = planet.name;
  planetSelect.append(option);
}
planetField.append(planetLabel, planetSelect);
controlsPanel.body.append(planetField);

let enabled = false;
let throttle = 25;
let angle = 0;
const throttleSlider = Slider({ id: 'throttle', label: 'Throttle command', min: 0, max: 100, value: throttle, unit: '%', onInput(value) { throttle = value; update(); } });
const angleSlider = Slider({ id: 'angle', label: 'Thrust angle', min: -30, max: 30, value: angle, unit: '°', onInput(value) { angle = value; update(); } });
const buttons = document.createElement('div');
buttons.className = 'button-row';
const engineButton = Button({ label: 'Enable thrust', onClick() { enabled = !enabled; update(); } });
engineButton.setAttribute('aria-pressed', 'false');
const resetButton = Button({ label: 'Reset', variant: 'secondary', onClick() {
  enabled = false;
  throttle = 25;
  angle = 0;
  planetSelect.value = 'Moon';
  throttleSlider.setValue(throttle);
  angleSlider.setValue(angle);
  update();
} });
buttons.append(engineButton, resetButton);
const massNote = document.createElement('p');
massNote.className = 'model-note';
const initialMass = DEFAULT_CONFIG.vehicle.dryMass + DEFAULT_CONFIG.vehicle.fuelMass;
massNote.textContent = 'Vehicle mass ' + initialMass.toLocaleString('en-US') + ' kg · fuel ' + DEFAULT_CONFIG.vehicle.fuelMass.toLocaleString('en-US') + ' kg · maximum thrust ' + (DEFAULT_CONFIG.vehicle.maxThrust / 1000) + ' kN. Fuel is held constant during this engine check.';
controlsPanel.body.append(throttleSlider.element, angleSlider.element, buttons, massNote);

const engineStatus = StatusLight({ label: 'Engine', status: 'Off' });
const forceStatus = StatusLight({ label: 'Vertical force', status: 'Below hover', tone: 'caution' });
const statusRow = document.createElement('div');
statusRow.className = 'status-row';
statusRow.append(engineStatus.element, forceStatus.element);
const stage = document.createElement('div');
stage.className = 'vector-stage';
stage.innerHTML = '<div class="vector-legend font-mono"><span><i style="background:var(--color-data)"></i>THRUST</span><span><i style="background:var(--color-caution)"></i>WEIGHT</span></div><svg viewBox="0 0 600 320" role="img" aria-labelledby="force-title"><title id="force-title">Thrust and weight vector diagram</title><defs><marker id="thrust-tip" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 6 3 0 6" fill="none" stroke="#ffffff" stroke-width="1.3"/></marker><marker id="weight-tip" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 6 3 0 6" fill="none" stroke="#f36d5b" stroke-width="1.3"/></marker></defs><path class="vector-axis" d="M90 160H530M300 20V295"/><text x="310" y="25">+y</text><text x="530" y="153">+x</text><g id="thrust-group"><line id="thrust-line" class="force-line" x1="300" y1="160" x2="300" y2="160" stroke="#ffffff" marker-end="url(#thrust-tip)"/></g><line id="weight-line" class="force-line" x1="300" y1="160" x2="300" y2="190" stroke="#f36d5b" marker-end="url(#weight-tip)"/><circle cx="300" cy="160" r="5" fill="#ffffff"/><text id="mass-label" x="315" y="176"></text></svg>';
const outputGauge = Gauge({ label: 'Engine output', value: 0 });
const hoverNote = document.createElement('div');
hoverNote.className = 'hover-note';
hoverNote.innerHTML = '<span>Throttle to balance weight</span><strong id="hover-target" class="font-mono"></strong>';
vectorPanel.body.append(statusRow, stage, outputGauge.element, hoverNote);

const readouts = document.createElement('dl');
readouts.className = 'readout-grid';
const thrustReadout = Readout({ label: 'Thrust', unit: 'kN', value: '0.00' });
const ratioReadout = Readout({ label: 'Thrust / weight', unit: 'ratio', value: '0.00' });
const verticalReadout = Readout({ label: 'Vertical acceleration', unit: 'm/s²', value: '-1.62' });
const horizontalReadout = Readout({ label: 'Horizontal acceleration', unit: 'm/s²', value: '0.00' });
readouts.append(thrustReadout.element, ratioReadout.element, verticalReadout.element, horizontalReadout.element);
const equationStrip = document.createElement('div');
equationStrip.className = 'equation-strip';
const equation = document.createElement('code');
const explanation = document.createElement('p');
explanation.setAttribute('aria-live', 'polite');
equationStrip.append(equation, explanation);
responsePanel.body.append(readouts, equationStrip);

function update() {
  const planet = PLANETS[planetSelect.value];
  const config = { ...DEFAULT_CONFIG, planet };
  const state = createInitialState(config, { y: 0, vx: 0, vy: 0 });
  const fraction = enabled ? throttle / 100 : 0;
  const radians = angle * Math.PI / 180;
  const result = acceleration(state, { throttle: fraction, angle: radians }, config);
  const mass = config.vehicle.dryMass + state.fuelMass;
  const thrust = fraction * config.vehicle.maxThrust;
  const ratio = thrust / (mass * planet.gravity);
  const hover = mass * planet.gravity / (config.vehicle.maxThrust * Math.cos(radians)) * 100;
  thrustReadout.update((thrust / 1000).toFixed(2));
  ratioReadout.update(ratio.toFixed(2), thrust * Math.cos(radians) >= mass * planet.gravity ? 'nominal' : 'caution');
  verticalReadout.update(result.ay.toFixed(2), result.ay >= 0 ? 'nominal' : 'caution');
  horizontalReadout.update(Math.abs(result.ax) < 0.005 ? '0.00' : result.ax.toFixed(2));
  engineButton.textContent = enabled ? 'Disable thrust' : 'Enable thrust';
  engineButton.setAttribute('aria-pressed', String(enabled));
  engineStatus.update(enabled && throttle > 0 ? 'Firing' : 'Off', enabled && throttle > 0 ? 'nominal' : 'neutral');
  forceStatus.update(result.ay >= 0 ? 'Above hover' : 'Below hover', result.ay >= 0 ? 'nominal' : 'caution');
  outputGauge.update(enabled ? throttle : 0);
  document.querySelector('#hover-target').textContent = hover.toFixed(1) + '%';
  document.querySelector('#thrust-line').setAttribute('y2', String(160 - fraction * 130));
  document.querySelector('#thrust-line').style.visibility = thrust > 0 ? 'visible' : 'hidden';
  document.querySelector('#thrust-group').setAttribute('transform', 'rotate(' + angle + ' 300 160)');
  document.querySelector('#weight-line').setAttribute('y2', String(160 + mass * planet.gravity / config.vehicle.maxThrust * 130));
  document.querySelector('#mass-label').textContent = 'm = ' + mass.toLocaleString('en-US') + ' kg';
  equation.textContent = 'aᵧ = (' + thrust.toLocaleString('en-US') + ' N × cos ' + angle + '°) / ' + mass.toLocaleString('en-US') + ' kg − ' + planet.gravity.toFixed(2) + ' m/s²';
  explanation.textContent = result.ay >= 0 ? 'Thrust can oppose the downward acceleration.' : 'Gravity exceeds the upward thrust component.';
}
planetSelect.addEventListener('change', update);
update();



