export const STANDARD_GRAVITY = 9.81;

export const PLANETS = Object.freeze({
  Moon: Object.freeze({ name: 'Moon', gravity: 1.62, surfaceDensity: 0, scaleHeight: 1 }),
  Mars: Object.freeze({ name: 'Mars', gravity: 3.71, surfaceDensity: 0.01225, scaleHeight: 11000 }),
  Earth: Object.freeze({ name: 'Earth', gravity: 9.81, surfaceDensity: 1.225, scaleHeight: 8500 }),
});

export const DEFAULT_VEHICLE = Object.freeze({
  dryMass: 1200,
  fuelMass: 800,
  maxThrust: 30000,
  specificImpulse: 300,
  dragCoefficient: 0.75,
  referenceArea: 4,
});

export const DEFAULT_CONFIG = Object.freeze({
  planet: PLANETS.Moon,
  vehicle: DEFAULT_VEHICLE,
  dragEnabled: true,
  landing: Object.freeze({
    padCenterX: 0,
    padHalfWidth: 15,
    safeVerticalSpeed: 4,
    safeHorizontalSpeed: 2,
  }),
});
