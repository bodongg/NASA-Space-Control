const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const smooth = (low, high, value) => {
  const t = clamp((value - low) / (high - low), 0, 1);
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => `rgb(${a.map((value, i) => Math.round(value + (b[i] - value) * t)).join(',')})`;

// This is only a camera: altitude, heading, stage and engine state come from the integrator.
export function drawEarthAscent(ctx, { width, height, launch, heading, thrusting, fuelMass, earthRadius,
  presentationControlsVisible, assets, animationTime, moving }) {
  const altitude = Math.max(0, launch.altitude - (launch.padAltitude || 0));
  const phone = width <= 700;
  const stage = typeof launch.stage === 'number' ? launch.stage
    : /upper/i.test(launch.stage) ? 1 : /lunar|spacecraft/i.test(launch.stage) ? 2 : 0;
  const length = (phone ? clamp(height * 0.13, 86, 110) : clamp(width * 0.125, 118, 170))
    * (stage === 0 ? 1 : stage === 1 ? 0.86 : 0.72);
  const rocketLength = length * (stage === 0 ? 0.52 : stage === 1 ? 0.74 : 1);
  const rocketHeight = assets.rocket.status === 'loaded'
    ? rocketLength * assets.rocket.image.naturalHeight / assets.rocket.image.naturalWidth : rocketLength * 0.28;
  const rocketX = (length - rocketLength) / 2;
  const rotation = heading - launch.radialAngle - Math.PI / 2;
  const points = [[-length / 2, -length * 0.12], [-length / 2, length * 0.12],
    ...[-1, 1].flatMap(x => [-1, 1].map(y => [rocketX + x * rocketLength / 2, y * rocketHeight / 2]))];
  const projectedY = points.map(([x, y]) => x * Math.sin(rotation) + y * Math.cos(rotation));
  const down = Math.max(...projectedY);
  const up = -Math.min(...projectedY);
  const groundY = height - (phone ? 220 : 160);
  const panelBottom = 110 + Math.max(100, height * 0.5 - 175);
  const clearTop = phone && presentationControlsVisible ? panelBottom + 18 : 120;
  const available = Math.max(0, groundY - down - up - clearTop);
  const rise = available * Math.log1p(Math.min(altitude, 100_000) / 300) / Math.log1p(100_000 / 300);
  const centerY = groundY - down - rise;
  const centerX = width * (phone ? 0.64 : 0.43);
  const longitude = launch.radialAngle - (launch.launchAngle ?? launch.radialAngle);
  const padDistance = Math.atan2(Math.sin(longitude), Math.cos(longitude)) * earthRadius;
  const padScale = available / ((300 + altitude) * Math.log1p(100_000 / 300));
  const padX = centerX - padDistance * padScale;
  const space = smooth(0, 120_000, altitude);
  const dissolve = smooth(120_000, 450_000, altitude);

  ctx.save();
  ctx.globalAlpha = 1 - dissolve;
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, mix([21, 100, 166], [2, 5, 12], space));
  sky.addColorStop(0.6, mix([88, 159, 201], [5, 14, 29], space));
  sky.addColorStop(1, mix([178, 211, 224], [17, 44, 68], space));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const curve = smooth(2_000, 100_000, altitude);
  const horizonY = groundY + height * 0.12 * curve;
  const radius = width * (8 - 6.8 * curve);
  const earthY = horizonY + radius;
  if (altitude > 2_000) {
    ctx.save();
    ctx.globalAlpha = (1 - dissolve) * smooth(2_000, 30_000, altitude);
    const rim = ctx.createRadialGradient(width / 2, earthY, radius - 3, width / 2, earthY, radius + 24);
    rim.addColorStop(0, 'rgba(135,199,242,0.1)');
    rim.addColorStop(0.3, 'rgba(136,204,255,0.65)');
    rim.addColorStop(1, 'rgba(80,146,226,0)');
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(width / 2, earthY, radius + 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width / 2, earthY, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#245d95';
    ctx.fillRect(0, horizonY, width, height - horizonY);
    if (assets.earth.status === 'loaded') {
      ctx.drawImage(assets.earth.image, 28, 28, 984, 984,
        width / 2 - radius, horizonY, radius * 2, radius * 2);
    }
    ctx.restore();
  }

  // The measured landscape has its coast at 65.6%; its cloud-bearing sky ends by 12 km.
  const terrainOpacity = 1 - smooth(0, 12_000, altitude);
  if (terrainOpacity > 0) {
    ctx.save();
    ctx.globalAlpha = terrainOpacity;
    const landscape = assets.launch;
    if (landscape.status === 'loaded') {
      const image = landscape.image;
      const horizonY = groundY - 45 + Math.min(altitude / 60, 150);
      const cover = Math.max(width / image.naturalWidth, height / image.naturalHeight,
        horizonY / (image.naturalHeight * 0.656));
      const w = image.naturalWidth * cover;
      const h = image.naturalHeight * cover;
      ctx.drawImage(image, (width - w) / 2, Math.min(0, horizonY - h * 0.656), w, h);
    }
    ctx.fillStyle = 'rgba(37,48,48,0.18)';
    ctx.fillRect(0, groundY, width, height - groundY);
    ctx.fillStyle = '#676c6b';
    ctx.fillRect(padX - length * 0.32, groundY, length * 0.64, 6);
    ctx.strokeStyle = '#bfc4c1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padX - length * 0.32, groundY);
    ctx.lineTo(padX + length * 0.32, groundY);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();

  const firing = thrusting && fuelMass > 0 && !launch.crashed && !launch.landed;
  if (firing && altitude < 500) {
    const opacity = 0.18 * (1 - altitude / 500);
    ctx.fillStyle = `rgba(231,222,203,${opacity})`;
    for (let i = 0; i < 7; i++) {
      const spread = moving ? (animationTime * 0.45 + i / 7) % 1 : i / 7;
      for (const direction of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(centerX + direction * spread * length * 1.5, groundY + 10 - spread * 9,
          8 + spread * 22, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, groundY);
  ctx.clip();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  if (firing) {
    const nozzle = -length * 0.48;
    const flameLength = length * 0.7 * (moving ? 1 + 0.05 * Math.sin(animationTime * 39) : 1);
    const flame = ctx.createLinearGradient(nozzle, 0, nozzle - flameLength, 0);
    flame.addColorStop(0, '#effbff');
    flame.addColorStop(0.2, '#98cfff');
    flame.addColorStop(0.55, '#fbbb6cdd');
    flame.addColorStop(1, '#dc6f2800');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(nozzle, -length * 0.045);
    ctx.bezierCurveTo(nozzle - flameLength * 0.25, -length * 0.08, nozzle - flameLength * 0.8, -length * 0.02, nozzle - flameLength, 0);
    ctx.bezierCurveTo(nozzle - flameLength * 0.8, length * 0.02, nozzle - flameLength * 0.25, length * 0.08, nozzle, length * 0.045);
    ctx.closePath();
    ctx.fill();
  }
  if (stage < 2) {
    const booster = ctx.createLinearGradient(0, -length * 0.075, 0, length * 0.075);
    booster.addColorStop(0, '#9aa5ab');
    booster.addColorStop(0.35, '#f3f4f1');
    booster.addColorStop(0.75, '#d7dedf');
    booster.addColorStop(1, '#66767d');
    ctx.fillStyle = booster;
    ctx.fillRect(-length * 0.46, -length * 0.075, length - rocketLength, length * 0.15);
    ctx.fillStyle = '#25333e';
    ctx.fillRect(-length * 0.42, -length * 0.077, length * 0.04, length * 0.154);
    ctx.fillRect(-length * 0.49, -length * 0.055, length * 0.055, length * 0.11);
  }
  ctx.strokeStyle = '#b9c2c5';
  ctx.lineWidth = 2;
  for (const direction of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-length * 0.38, direction * length * 0.065);
    ctx.lineTo(-length * 0.5, direction * length * 0.12);
    ctx.stroke();
  }
  if (assets.rocket.status === 'loaded') {
    ctx.drawImage(assets.rocket.image, rocketX - rocketLength / 2, -rocketHeight / 2, rocketLength, rocketHeight);
  } else {
    ctx.fillStyle = '#e7e8e8';
    ctx.beginPath();
    ctx.moveTo(length / 2, 0);
    ctx.lineTo(rocketX + rocketLength * 0.3, -rocketHeight / 2);
    ctx.lineTo(rocketX - rocketLength / 2, -rocketHeight / 2);
    ctx.lineTo(rocketX - rocketLength / 2, rocketHeight / 2);
    ctx.lineTo(rocketX + rocketLength * 0.3, rocketHeight / 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
