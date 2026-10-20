export function Slider({ id, label, min, max, step = 1, value, unit = '', onInput = () => {} }) {
  const element = document.createElement('div');
  element.className = 'slider-field';
  const heading = document.createElement('div');
  heading.className = 'slider-heading';
  const caption = document.createElement('label');
  caption.htmlFor = id;
  caption.textContent = label;
  const output = document.createElement('output');
  output.htmlFor = id;
  output.className = 'font-mono';
  const input = document.createElement('input');
  input.type = 'range';
  input.id = id;
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  const limits = document.createElement('div');
  limits.className = 'slider-limits font-mono';
  const low = document.createElement('span');
  low.textContent = min + unit;
  const high = document.createElement('span');
  high.textContent = max + unit;
  limits.append(low, high);
  heading.append(caption, output);
  element.append(heading, input, limits);
  function setValue(next) {
    input.value = String(next);
    output.textContent = input.value + unit;
    input.setAttribute('aria-valuetext', output.textContent);
  }
  input.addEventListener('input', () => {
    setValue(input.valueAsNumber);
    onInput(input.valueAsNumber);
  });
  setValue(value);
  return { element, input, setValue };
}
