export function StatusLight({ label, status = 'Standby', tone = 'neutral' }) {
  const element = document.createElement('div');
  element.className = 'status-light';
  const dot = document.createElement('span');
  dot.className = 'status-dot';
  dot.setAttribute('aria-hidden', 'true');
  const name = document.createElement('span');
  name.textContent = label;
  const state = document.createElement('strong');
  state.setAttribute('aria-live', 'polite');
  element.append(dot, name, state);
  function update(next, nextTone = tone) {
    state.textContent = next;
    element.dataset.tone = nextTone;
  }
  update(status);
  return { element, update };
}
