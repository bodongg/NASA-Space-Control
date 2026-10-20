export function Readout({ label, value = '—', unit = '', tone = 'data', compact = false }) {
  const element = document.createElement('div');
  element.className = 'readout' + (compact ? ' readout-compact' : '');
  const caption = document.createElement('dt');
  caption.className = 'instrument-label';
  caption.textContent = label;
  const data = document.createElement('dd');
  data.className = 'readout-data';
  const number = document.createElement('span');
  number.className = 'readout-number';
  const suffix = document.createElement('span');
  suffix.className = 'readout-unit';
  suffix.textContent = unit;
  data.append(number, suffix);
  element.append(caption, data);
  function update(next, nextTone = tone) {
    number.textContent = String(next);
    element.dataset.tone = nextTone;
  }
  update(value);
  return { element, update };
}
