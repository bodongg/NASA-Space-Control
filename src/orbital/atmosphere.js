// Exponential teaching model; layer thresholds are approximate, not chemistry.
export function atmosphereAt(altitude) {
  if (!Number.isFinite(altitude)) throw new RangeError('Atmosphere altitude must be finite');
  const height = Math.max(0, altitude);
  const layer = height < 12000 ? 'troposphere' : height < 50000 ? 'stratosphere'
    : height < 85000 ? 'mesosphere' : height < 600000 ? 'thermosphere' : 'exosphere';
  return { density: 1.225 * Math.exp(-height / 8500), layer };
}

export function atmosphericDragAcceleration(state, config) {
  if (!config.atmosphere?.enabled) return { ax: 0, ay: 0 };
  const { dragArea, rotationRate } = config.atmosphere;
  const mass = config.vehicle.dryMass + state.fuelMass;
  if (!Number.isFinite(dragArea) || dragArea < 0 || !Number.isFinite(rotationRate)
    || !Number.isFinite(mass) || mass <= 0
    || !['x', 'y', 'vx', 'vy'].every((key) => Number.isFinite(state[key]))) {
    throw new RangeError('Atmosphere drag inputs must be finite and physical');
  }
  const relativeX = state.vx + rotationRate * state.y;
  const relativeY = state.vy - rotationRate * state.x;
  const speed = Math.hypot(relativeX, relativeY);
  if (speed === 0 || dragArea === 0) return { ax: 0, ay: 0 };
  const { density } = atmosphereAt(Math.hypot(state.x, state.y) - config.earth.radius);
  const factor = -0.5 * density * dragArea * speed / mass;
  return { ax: factor * relativeX, ay: factor * relativeY };
}
