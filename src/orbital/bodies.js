import { ORBIT_CONFIG } from './config.js';

// Prescribed circular ephemeris, not an integrated Earth–Moon system.
export function moonState(time, config = ORBIT_CONFIG) {
  const { orbitRadius, period, phase } = config.moon;
  if (!Number.isFinite(time) || !Number.isFinite(phase)
    || !Number.isFinite(orbitRadius) || orbitRadius <= 0
    || !Number.isFinite(period) || period <= 0) {
    throw new RangeError('Moon ephemeris needs finite time/phase and positive radius/period');
  }
  const omega = 2 * Math.PI / period;
  const angle = phase + omega * time;
  const x = orbitRadius * Math.cos(angle);
  const y = orbitRadius * Math.sin(angle);
  return { x, y, vx: -omega * y, vy: omega * x };
}
