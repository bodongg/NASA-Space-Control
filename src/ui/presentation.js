/** Manage presentation UI without touching, moving, or recreating the flight scene. */
export function createPresentationController({ element, enterButton, exitButton, hideButton, onChange }) {
  const document = element.ownerDocument;
  const state = { active: false, native: false, controlsHidden: false };
  let destroyed = false;
  let revision = 0;
  let previousOverflow;
  let previousFocus;

  const getState = () => ({ ...state });

  function render(notify = true) {
    element.dataset.presentation = String(state.active);
    element.dataset.controlsHidden = String(state.controlsHidden);
    enterButton.hidden = state.active;
    exitButton.hidden = !state.active;
    hideButton.hidden = !state.active;
    hideButton.setAttribute('aria-controls', 'presentation-controls');
    hideButton.setAttribute('aria-expanded', String(!state.controlsHidden));
    if (notify) onChange?.(getState());
  }

  function deactivate() {
    if (!state.active) return;
    state.active = false;
    state.native = false;
    state.controlsHidden = false;
    document.body.style.overflow = previousOverflow;
    render();
    const focusTarget = enterButton.isConnected ? enterButton : previousFocus;
    if (focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });
  }

  async function releaseFullscreen() {
    if (document.fullscreenElement !== element) return;
    try {
      await document.exitFullscreen?.();
    } catch {
      // The browser still allows its own Escape action if an exit request fails.
    }
  }

  async function enter({ nativeFullscreen = true } = {}) {
    if (destroyed || state.active) return getState();
    const requestRevision = ++revision;
    previousOverflow = document.body.style.overflow;
    previousFocus = document.activeElement;
    state.active = true;
    state.native = document.fullscreenElement === element;
    state.controlsHidden = false;
    document.body.style.overflow = 'hidden';
    render();
    try {
      if (nativeFullscreen && !state.native) await element.requestFullscreen?.();
    } catch {
      // Denied or unavailable native fullscreen retains the expanded page view.
    }
    if (destroyed || !state.active) {
      await releaseFullscreen();
    } else if (requestRevision === revision) {
      const native = document.fullscreenElement === element;
      if (native !== state.native) {
        state.native = native;
        render();
      }
    }
    return getState();
  }

  async function exit() {
    if (destroyed) return getState();
    revision++;
    deactivate();
    await releaseFullscreen();
    return getState();
  }

  function toggleControls() {
    if (destroyed || !state.active) return getState();
    state.controlsHidden = !state.controlsHidden;
    render();
    return getState();
  }

  function onFullscreenChange() {
    if (destroyed) return;
    if (document.fullscreenElement === element) {
      if (!state.active) {
        void releaseFullscreen();
      } else if (!state.native) {
        state.native = true;
        render();
      }
    } else if (state.native) {
      revision++;
      deactivate();
    }
  }

  function onKeyDown(event) {
    if (event.key !== 'Escape' || !state.active) return;
    if (!state.native) event.preventDefault();
    void exit();
  }

  function onEnter() { void enter(); }
  function onExit() { void exit(); }
  enterButton.addEventListener('click', onEnter);
  exitButton.addEventListener('click', onExit);
  hideButton.addEventListener('click', toggleControls);
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('keydown', onKeyDown);
  render(false);

  function destroy() {
    if (destroyed) return;
    revision++;
    deactivate();
    destroyed = true;
    enterButton.removeEventListener('click', onEnter);
    exitButton.removeEventListener('click', onExit);
    hideButton.removeEventListener('click', toggleControls);
    document.removeEventListener('fullscreenchange', onFullscreenChange);
    document.removeEventListener('keydown', onKeyDown);
    delete element.dataset.presentation;
    delete element.dataset.controlsHidden;
    void releaseFullscreen();
  }

  return { enter, exit, toggleControls, getState, destroy };
}

