const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Projection only: the caller keeps the Earth-centered integration and contact rules.
export function drawLunarSurface(ctx, { width, height, landing, heading, thrusting,
  presentationControlsVisible, assets, animationTime, moving }) {
  const phone = width <= 700;
  const length = clamp(width * 0.17, 86, 118);
  const groundY = height * (phone ? 0.73 : 0.76);
  const panelBottom = 110 + Math.max(100, height * 0.5 - 175);
  const clearTop = phone && presentationControlsVisible ? panelBottom + 18 : 120;
  const topFoot = Math.min(groundY - 12, clearTop + length * 1.12);
  const available = Math.max(12, groundY - topFoot);
  const altitude = Math.max(0, landing.altitude);
  // Auto framing retains visible terrain at 2 km, then reveals the final meters continuously.
  const gap = available * Math.log1p(Math.min(altitude, 2000) / 40) / Math.log1p(2000 / 40);
  const footY = groundY - gap;
  const anchorX = width * (phone ? 0.64 : 0.45);
  const rotation = heading - landing.radialAngle - Math.PI / 2;
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  const legs = [[-length * 0.57, -length * 0.24], [-length * 0.57, length * 0.24]];
  const imageHeight = assets.rocket.status === 'loaded'
    ? length * assets.rocket.image.naturalHeight / assets.rocket.image.naturalWidth : length / 3;
  const points = [...legs, ...legs.map(([x, y]) => [x, y + Math.sign(y) * length * 0.08]),
    ...[-1, 1].flatMap(x => [-1, 1].map(y => [x * length / 2, y * imageHeight / 2]))];
  const down = Math.max(...points.map(([x, y]) => x * sine + y * cosine));
  const centerY = footY - down;

  ctx.fillStyle = '#777670';
  ctx.fillRect(0, groundY, width, height - groundY);
  const terrain = assets.surface;
  if (terrain.status === 'loaded') {
    const image = terrain.image;
    const horizonY = groundY - Math.min(65, height * 0.08);
    const terrainHeight = height - horizonY;
    const cover = Math.max(width / image.naturalWidth, terrainHeight / (image.naturalHeight * 0.37));
    const sourceWidth = width / cover;
    const sourceHeight = terrainHeight / cover;
    // This local asset's ridge is at 64.2%; retain its edge above the contact plane.
    ctx.drawImage(image, (image.naturalWidth - sourceWidth) / 2, image.naturalHeight * 0.63,
      sourceWidth, sourceHeight, 0, horizonY, width, terrainHeight);
  }
  const shade = ctx.createLinearGradient(0, groundY, 0, height);
  shade.addColorStop(0, 'rgba(8,9,12,0.02)');
  shade.addColorStop(1, 'rgba(5,6,9,0.52)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, groundY, width, height - groundY);

  // Shadow closes against the contact point; a thin mark identifies the physical plane.
  ctx.fillStyle = `rgba(0,0,0,${0.3 / (1 + altitude / 60)})`;
  ctx.beginPath();
  ctx.moveTo(anchorX - length * 0.3, groundY + 3);
  ctx.lineTo(anchorX - length * 0.2, groundY - 2);
  ctx.lineTo(anchorX + length * 0.2, groundY - 2);
  ctx.lineTo(anchorX + length * 0.3, groundY + 3);
  ctx.lineTo(anchorX + length * 0.2, groundY + 8);
  ctx.lineTo(anchorX - length * 0.2, groundY + 8);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  // Actual exhaust can reach the surface, but never be painted below it.
  ctx.beginPath();
  ctx.rect(0, 0, width, groundY);
  ctx.clip();
  ctx.translate(anchorX, centerY);
  ctx.rotate(rotation);
  if (thrusting && !landing.landed && !landing.crashed) {
    const nozzle = -length * 0.48;
    const flameLength = length * 0.68 * (moving ? 1 + Math.sin(animationTime * 39) * 0.05 : 1);
    const flame = ctx.createLinearGradient(nozzle, 0, nozzle - flameLength, 0);
    flame.addColorStop(0, '#effbff');
    flame.addColorStop(0.2, '#98cfff');
    flame.addColorStop(0.55, '#fbbb6cdd');
    flame.addColorStop(1, '#dc6f2800');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(nozzle, -length * 0.055);
    ctx.bezierCurveTo(nozzle - flameLength * 0.3, -length * 0.09, nozzle - flameLength * 0.8, -length * 0.02, nozzle - flameLength, 0);
    ctx.bezierCurveTo(nozzle - flameLength * 0.8, length * 0.02, nozzle - flameLength * 0.3, length * 0.09, nozzle, length * 0.055);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = '#c7c7c1';
  ctx.lineWidth = 3;
  for (const [x, y] of legs) {
    ctx.beginPath();
    ctx.moveTo(-length * 0.27, Math.sign(y) * length * 0.08);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + Math.sign(y) * length * 0.08);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-length * 0.44, Math.sign(y) * length * 0.07);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  if (assets.rocket.status === 'loaded') {
    ctx.drawImage(assets.rocket.image, -length / 2, -imageHeight / 2, length, imageHeight);
  } else {
    ctx.fillStyle = '#e7e8e8';
    ctx.beginPath();
    ctx.moveTo(length / 2, 0);
    ctx.lineTo(length * 0.29, -length * 0.13);
    ctx.lineTo(-length * 0.47, -length * 0.13);
    ctx.lineTo(-length * 0.47, length * 0.13);
    ctx.lineTo(length * 0.29, length * 0.13);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const labelX = clamp(anchorX + length * 0.42, 16, width - (phone ? 112 : 180));
  const labelY = clamp(groundY - 30, 120, height - 135);
  ctx.font = '11px "JetBrains Mono", Consolas, monospace';
  ctx.fillStyle = '#fff';
  ctx.fillText(`Moon · ${altitude.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m`, labelX, labelY);
  ctx.fillStyle = landing.landed ? '#a4e0bd' : landing.crashed ? '#ffb3a8' : '#d4dde8';
  ctx.fillText(landing.landed ? 'SURFACE CONTACT' : landing.crashed ? 'HARD IMPACT' : 'LUNAR DESCENT', labelX, labelY + 18);
}
