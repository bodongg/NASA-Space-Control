import test from 'node:test';
import assert from 'node:assert/strict';
import { createPresentationController } from '../ui/presentation.js';

class Element extends EventTarget {
  constructor(document) {
    super();
    this.ownerDocument = document;
    this.dataset = {};
    this.hidden = false;
    this.isConnected = true;
    this.attributes = new Map();
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  focus() { this.ownerDocument.activeElement = this; }
  click() { this.dispatchEvent(new Event('click')); }
}

function setup(requestFullscreen) {
  const document = new EventTarget();
  document.body = { style: { overflow: 'auto' } };
  document.fullscreenElement = null;
  const element = new Element(document);
  const enterButton = new Element(document);
  const exitButton = new Element(document);
  const hideButton = new Element(document);
  const before = new Element(document);
  before.focus();
  if (requestFullscreen) element.requestFullscreen = () => requestFullscreen(document, element);
  document.exitFullscreen = async () => {
    document.fullscreenElement = null;
    document.dispatchEvent(new Event('fullscreenchange'));
  };
  const changes = [];
  const controller = createPresentationController({
    element, enterButton, exitButton, hideButton,
    onChange: (state) => changes.push(state),
  });
  return { document, element, enterButton, exitButton, hideButton, before, changes, controller };
}

function escape(document) {
  const event = new Event('keydown', { cancelable: true });
  Object.defineProperty(event, 'key', { value: 'Escape' });
  document.dispatchEvent(event);
  return event;
}

// Catches missing fallback or cleanup after browser denial.
test('denied fullscreen expands the existing scene and Escape restores page and focus', async () => {
  const ui = setup(async () => { throw new Error('denied'); });
  const scene = ui.element;
  await ui.controller.enter();
  assert.deepEqual(ui.controller.getState(), { active: true, native: false, controlsHidden: false });
  assert.equal(ui.element, scene);
  assert.equal(scene.dataset.presentation, 'true');
  assert.equal(ui.document.body.style.overflow, 'hidden');
  assert.equal(ui.enterButton.hidden, true);
  assert.equal(ui.exitButton.hidden, false);
  assert.equal(ui.hideButton.hidden, false);
  assert.equal(escape(ui.document).defaultPrevented, true);
  assert.deepEqual(ui.controller.getState(), { active: false, native: false, controlsHidden: false });
  assert.equal(ui.document.body.style.overflow, 'auto');
  assert.equal(ui.document.activeElement, ui.enterButton);
  ui.controller.destroy();
});

// Catches hiding the wrong control region or stale accessibility state.
test('bound buttons enter, toggle secondary controls, and exit without native fullscreen', async () => {
  const ui = setup();
  assert.equal(ui.exitButton.hidden, true);
  assert.equal(ui.hideButton.hidden, true);
  ui.enterButton.click();
  assert.equal(ui.controller.getState().active, true);
  ui.hideButton.click();
  assert.equal(ui.element.dataset.controlsHidden, 'true');
  assert.equal(ui.hideButton.getAttribute('aria-controls'), 'presentation-controls');
  assert.equal(ui.hideButton.getAttribute('aria-expanded'), 'false');
  ui.exitButton.click();
  assert.equal(ui.controller.getState().active, false);
  ui.enterButton.click();
  assert.equal(ui.controller.getState().controlsHidden, false);
  assert.equal(ui.hideButton.getAttribute('aria-expanded'), 'true');
  await ui.controller.exit();
  ui.controller.destroy();
});

// Catches ignoring browser Escape or exiting another element's fullscreen.
test('native fullscreen changes follow browser exit and leave unrelated fullscreen alone', async () => {
  const ui = setup(async (document, element) => {
    document.fullscreenElement = element;
    document.dispatchEvent(new Event('fullscreenchange'));
  });
  await ui.controller.enter();
  assert.deepEqual(ui.controller.getState(), { active: true, native: true, controlsHidden: false });
  ui.document.fullscreenElement = null;
  ui.document.dispatchEvent(new Event('fullscreenchange'));
  assert.equal(ui.controller.getState().active, false);
  assert.equal(ui.document.body.style.overflow, 'auto');
  const other = new Element(ui.document);
  ui.document.fullscreenElement = other;
  ui.element.requestFullscreen = async () => { throw new Error('unavailable'); };
  await ui.controller.enter();
  await ui.controller.exit();
  assert.equal(ui.document.fullscreenElement, other);
  ui.controller.destroy();
});

// Catches late request resolution reopening an exited presentation.
test('exit while fullscreen request is pending cannot reactivate the scene', async () => {
  let finish;
  const ui = setup((document, element) => new Promise((resolve) => {
    finish = () => {
      document.fullscreenElement = element;
      document.dispatchEvent(new Event('fullscreenchange'));
      resolve();
    };
  }));
  const entering = ui.controller.enter();
  await ui.controller.exit();
  finish();
  await entering;
  assert.deepEqual(ui.controller.getState(), { active: false, native: false, controlsHidden: false });
  assert.equal(ui.document.fullscreenElement, null);
  assert.equal(ui.document.body.style.overflow, 'auto');
  ui.controller.destroy();
});

// Catches stale handlers/style writes after teardown, including late native entry.
test('destroy cleans active or pending presentations and removes button and key listeners', async () => {
  let finish;
  const ui = setup((document, element) => new Promise((resolve) => {
    finish = () => { document.fullscreenElement = element; resolve(); };
  }));
  const entering = ui.controller.enter();
  ui.controller.toggleControls();
  ui.controller.destroy();
  const count = ui.changes.length;
  ui.enterButton.click();
  ui.hideButton.click();
  assert.equal(escape(ui.document).defaultPrevented, false);
  finish();
  await entering;
  assert.equal(ui.document.fullscreenElement, null);
  assert.equal(ui.document.body.style.overflow, 'auto');
  assert.equal(ui.element.dataset.presentation, undefined);
  assert.equal(ui.element.dataset.controlsHidden, undefined);
  assert.equal(ui.changes.length, count);
});

// Catches replacing a caller's scroll style or focusing a detached enter button.
test('repeated cycles restore the original overflow and a connected prior focus', async () => {
  const ui = setup();
  ui.document.body.style.overflow = 'clip';
  ui.enterButton.isConnected = false;
  for (let cycle = 0; cycle < 2; cycle++) {
    ui.before.focus();
    await ui.controller.enter();
    await ui.controller.exit();
    assert.equal(ui.document.body.style.overflow, 'clip');
    assert.equal(ui.document.activeElement, ui.before);
  }
  ui.controller.destroy();
});

// Catches ignoring an explicit expanded-view choice when native fullscreen exists.
test('explicit expanded view skips native fullscreen and restores presentation lifecycle', async () => {
  let requested = false;
  const ui = setup(async (document, element) => {
    requested = true;
    document.fullscreenElement = element;
    document.dispatchEvent(new Event('fullscreenchange'));
  });
  await ui.controller.enter({ nativeFullscreen: false });
  assert.equal(requested, false);
  assert.deepEqual(ui.controller.getState(), { active: true, native: false, controlsHidden: false });
  assert.equal(ui.element.dataset.presentation, 'true');
  assert.equal(ui.document.body.style.overflow, 'hidden');
  assert.equal(escape(ui.document).defaultPrevented, true);
  assert.equal(ui.controller.getState().active, false);
  assert.equal(ui.document.body.style.overflow, 'auto');
  assert.equal(ui.document.activeElement, ui.enterButton);
  ui.controller.destroy();
});
