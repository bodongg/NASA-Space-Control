export function Panel({ title, description = '', className = '' }) {
  const element = document.createElement('section');
  element.className = 'panel ' + className;
  const header = document.createElement('header');
  header.className = 'panel-heading';
  const heading = document.createElement('h2');
  heading.textContent = title;
  header.append(heading);
  if (description) {
    const detail = document.createElement('p');
    detail.textContent = description;
    header.append(detail);
  }
  const body = document.createElement('div');
  body.className = 'panel-body';
  element.append(header, body);
  return { element, body };
}
