import { predictTrajectory } from './trajectory.js';

export function handleTrajectoryRequest(message) {
  const id = message?.id;
  try {
    const { state, config, options } = message;
    return { id, result: predictTrajectory(state, config, options) };
  } catch (error) {
    return { id, error: error instanceof Error ? error.message : 'Prediction failed' };
  }
}

if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  self.addEventListener('message', ({ data }) => self.postMessage(handleTrajectoryRequest(data)));
}
