// SI throughout. These defaults describe an educational, planar model.
export const STANDARD_GRAVITY = 9.80665;

export const ORBIT_CONFIG = Object.freeze({
  earth: Object.freeze({ mu: 3.986004e14, radius: 6_371_000 }),
  moon: Object.freeze({
    mu: 4.9048e12, radius: 1_737_000,
    orbitRadius: 384_400_000, period: 27.32 * 86400, phase: 0, enabled: true,
  }),
  vehicle: Object.freeze({
    dryMass: 4000, fuelMass: 6000, specificImpulse: 450, maxThrust: 50_000,
  }),
  initialAltitude: 400_000,
  maxCoastStep: 1,
  maxBurnStep: 0.25,
});
