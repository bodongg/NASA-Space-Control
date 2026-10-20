export function Button({ label, variant = 'primary', onClick = () => {}, disabled = false }) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'control-button control-button-' + variant;
  element.textContent = label;
  element.disabled = disabled;
  element.addEventListener('click', onClick);
  return element;
}
