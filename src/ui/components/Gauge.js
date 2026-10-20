export function Gauge({ label, min = 0, max = 100, value = 0, unit = '%' }) {
  const element = document.createElement('div');
  element.className = 'gauge';
  const heading = document.createElement('div');
  heading.className = 'gauge-heading';
  const name = document.createElement('span');
  name.textContent = label;
  const output = document.createElement('span');
  output.className = 'font-mono';
  heading.append(name, output);
  const track = document.createElement('div');
  track.className = 'gauge-track';
  track.setAttribute('role', 'meter');
  track.setAttribute('aria-label', label);
  track.setAttribute('aria-valuemin', String(min));
  track.setAttribute('aria-valuemax', String(max));
  const fill = document.createElement('div');
  fill.className = 'gauge-fill';
  track.append(fill);
  element.append(heading, track);
  function update(next, tone = 'data') {
    const clamped = Math.min(max, Math.max(min, next));
    fill.style.transform = 'scaleX(' + (max === min ? 0 : (clamped - min) / (max - min)) + ')';
    output.textContent = clamped.toFixed(0) + ' ' + unit;
    track.setAttribute('aria-valuenow', String(clamped));
    track.setAttribute('aria-valuetext', output.textContent);
    element.dataset.tone = tone;
  }
  update(value);
  return { element, update };
}

