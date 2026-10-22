import { moonState } from '../orbital/bodies.js';
import { drawLunarSurface } from './lunarSurface.js';
import { drawEarthAscent } from './earthAscent.js';

const BACKGROUND = '#080b13';
const LABEL_FONT = '12px "Public Sans", Arial, sans-serif';
const DATA_FONT = '11px "JetBrains Mono", Consolas, monospace';
const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const assetCache = new Map();
const ASSETS = { rocket: '/flight/rocket.png', space: '/flight/space.png', earth: '/flight/earth.jpg', moon: '/flight/moon.jpg', surface: '/flight/lunar-surface.png', launch: '/flight/earth-launch.png' };
// NASA globe photos include black margins; crop to the photographed sphere before clipping.
const BODY_CROPS = { earth: [28, 28, 984, 984], moon: [144, 144, 2952, 2952] };

// One decoded image per URL, shared across renderer instances. Each view removes its own listener.
function loadAsset(url) {
  if (assetCache.has(url)) return assetCache.get(url);
  const asset = { image: null, status: 'loading', listeners: new Set() };
  assetCache.set(url, asset);
  if (typeof Image === 'undefined') {
    asset.status = 'failed';
    return asset;
  }
  const image = new Image();
  asset.image = image;
  function finish(status) {
    asset.status = status;
    image.onload = null;
    image.onerror = null;
    for (const listener of asset.listeners) listener();
  }
  image.onload = () => finish(image.naturalWidth > 0 ? 'loaded' : 'failed');
  image.onerror = () => finish('failed');
  image.src = url;
  return asset;
}

const overlap = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x))
  * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));

export function createOrbitalMap(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('The orbital map needs Canvas 2D support.');
  let width = 600;
  let height = 390;
  let lastFrame;
  let destroyed = false;
  let animationTime = 0;
  let lastWallTime;
  let lastSimulationTime;
  let displayHeading;
  let camera;
  const assets = Object.fromEntries(Object.entries(ASSETS).map(([name, url]) => [name, loadAsset(url)]));
  const redraw = () => { if (lastFrame && !destroyed) draw(lastFrame); };
  Object.values(assets).forEach(asset => asset.listeners.add(redraw));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width || canvas.clientWidth || width;
    height = rect.height || canvas.clientHeight || height;
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    const pixelsWide = Math.max(1, Math.round(width * dpr));
    const pixelsHigh = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== pixelsWide) canvas.width = pixelsWide;
    if (canvas.height !== pixelsHigh) canvas.height = pixelsHigh;
    ctx.setTransform(pixelsWide / width, 0, 0, pixelsHigh / height, 0, 0);
  }

  function line(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function background(flight, moving) {
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, width, height);
    const asset = assets.space;
    if (asset.status === 'loaded') {
      const image = asset.image;
      const cover = Math.max(width / image.naturalWidth, height / image.naturalHeight) * 1.035;
      const w = image.naturalWidth * cover;
      const h = image.naturalHeight * cover;
      const drift = moving ? Math.sin(animationTime * 0.025) * 3 : 0;
      ctx.globalAlpha = flight ? 0.86 : 0.28;
      ctx.drawImage(image, (width - w) / 2 + drift, (height - h) / 2, w, h);
      ctx.globalAlpha = 1;
    }
    const shade = ctx.createLinearGradient(0, 0, width, height);
    shade.addColorStop(0, 'rgba(2,5,12,0.06)');
    shade.addColorStop(1, flight ? 'rgba(2,5,12,0.36)' : 'rgba(2,5,12,0.46)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);
  }

  function draw(frame) {
    if (destroyed) return;
    lastFrame = frame;
    const { state, config, trail = [], prediction = [], closestPoint = null, heading = 0,
      thrusting = false, follow = 'earth', zoom = 1, viewMode = 'map', paused = false,
      reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false } = frame;
    resize();
    const now = globalThis.performance?.now() ?? 0;
    const wallDt = lastWallTime === undefined ? 0 : clamp((now - lastWallTime) / 1000, 0, 0.1);
    const easing = 1 - Math.exp(-10 * wallDt);
    const reset = lastSimulationTime !== undefined && state.time < lastSimulationTime;
    if (!paused && !reducedMotion) animationTime += wallDt;
    lastWallTime = now;
    lastSimulationTime = state.time;
    if (displayHeading === undefined || reducedMotion || reset) displayHeading = heading;
    else {
      const turn = Math.atan2(Math.sin(heading - displayHeading), Math.cos(heading - displayHeading));
      displayHeading += clamp(turn * easing, -TAU * wallDt, TAU * wallDt);
    }
    const flight = viewMode === 'flight';
    const moving = !paused && !reducedMotion;
    background(flight, moving);
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    if (flight && frame.launch && Number.isFinite(frame.launch.altitude)
      && Number.isFinite(frame.launch.radialAngle) && frame.launch.altitude < 450_000
      && ['ascent', 'orbit-insertion'].includes(frame.launch.phase ?? frame.phase)) {
      camera = undefined;
      drawEarthAscent(ctx, { width, height, launch: frame.launch, heading, thrusting,
        fuelMass: state.fuelMass, earthRadius: config.earth.radius,
        presentationControlsVisible: frame.presentationControlsVisible === true,
        assets, animationTime, moving });
      return;
    }

    if (flight && frame.landing && Number.isFinite(frame.landing.altitude)
      && Number.isFinite(frame.landing.radialAngle)
      && (frame.landing.altitude <= 2000 || frame.landing.landed || frame.landing.crashed)) {
      camera = undefined;
      drawLunarSurface(ctx, { width, height, landing: frame.landing, heading, thrusting,
        presentationControlsVisible: frame.presentationControlsVisible === true,
        assets, animationTime, moving });
      return;
    }

    const moon = moonState(state.time, config);
    const earthDistance = Math.hypot(state.x, state.y);
    const moonDistance = Math.hypot(state.x - moon.x, state.y - moon.y);
    const nearEarth = earthDistance - config.earth.radius <= moonDistance - config.moon.radius;
    const nearDistance = nearEarth ? earthDistance : moonDistance;
    const nearRadius = nearEarth ? config.earth.radius : config.moon.radius;
    const zoomFactor = clamp(Number.isFinite(zoom) ? zoom : 1, 1, 128);
    const rocketSize = flight ? clamp(width * 0.17, 86, 118) : 35;
    const clearance = rocketSize / 2 + 17;
    const overviewScale = Math.max(1, Math.min(width - 80, height - 100)) / (2.16 * config.moon.orbitRadius);
    const targetScale = flight
      ? clamp(Math.max(height / (Math.max(nearDistance, 1) * 2.3), clearance / Math.max(nearDistance - nearRadius, 1)), 1e-9, 0.002) * Math.min(zoomFactor, 8)
      : overviewScale * zoomFactor;
    const targetCenter = flight || follow === 'ship' ? state : follow === 'moon' ? moon : { x: 0, y: 0 };
    const followKey = flight ? 'flight' : follow;
    if (!camera || reducedMotion || reset) camera = { scale: targetScale, x: targetCenter.x, y: targetCenter.y, offsetX: 0, offsetY: 0, followKey };
    else {
      // Ease framing changes, while physical target motion follows immediately even at high warp.
      if (camera.followKey !== followKey) {
        camera.offsetX += camera.x - targetCenter.x;
        camera.offsetY += camera.y - targetCenter.y;
      }
      camera.scale = clamp(Math.exp(Math.log(camera.scale) + Math.log(targetScale / camera.scale) * easing), targetScale / 2, targetScale * 2);
      camera.offsetX *= 1 - easing;
      camera.offsetY *= 1 - easing;
      camera.x = targetCenter.x;
      camera.y = targetCenter.y;
      camera.followKey = followKey;
    }
    // Never ease through a body's surface or leave the current scene's useful zoom range.
    const clearanceScale = flight ? clamp(clearance / Math.max(nearDistance - nearRadius, 1), 1e-9, 0.002) * Math.min(zoomFactor, 8) : 0;
    const scale = camera.scale = Math.max(camera.scale, clearanceScale);
    camera.offsetX = clamp(camera.offsetX, -width * 0.12 / scale, width * 0.12 / scale);
    camera.offsetY = clamp(camera.offsetY, -height * 0.12 / scale, height * 0.12 / scale);
    const center = { x: targetCenter.x + camera.offsetX, y: targetCenter.y + camera.offsetY };
    const shipAnchor = flight ? { x: width * 0.60, y: height * 0.50 } : { x: width / 2, y: height / 2 };
    const project = ({ x, y }) => ({
      x: shipAnchor.x + (x - center.x) * scale,
      y: shipAnchor.y - (y - center.y) * scale,
    });
    const earthPoint = project({ x: 0, y: 0 });
    const moonPoint = project(moon);
    const shipPoint = project(state);
    const labels = [];
    const obstacles = [{ x: 10, y: height - 156, w: 180, h: 52 }];
    if (flight && width > 700) obstacles.push({ x: width - 300, y: 100, w: 300, h: Math.max(270, height - 335) });

    function labelBox(text, x, y) {
      ctx.font = LABEL_FONT;
      const w = Math.min(width - 20, ctx.measureText(text).width + 14);
      return { x: clamp(x, 10, Math.max(10, width - w - 10)),
        y: clamp(y, flight ? 110 : 100, Math.max(flight ? 110 : 100, height - (flight ? 170 : 80))), w, h: 25 };
    }

    function chooseLabel(text, candidates) {
      const boxes = candidates.map(([x, y]) => labelBox(text, x, y));
      const score = box => [...labels, ...obstacles].reduce((sum, other) => sum + overlap(box, other), 0);
      return boxes.reduce((best, box) => score(box) < score(best) ? box : best);
    }

    function paintLabel(text, box, color = '#f5f5f7') {
      ctx.fillStyle = 'rgba(5,9,16,0.85)';
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.font = LABEL_FONT;
      ctx.fillStyle = color;
      ctx.fillText(text, box.x + 7, box.y + 6, box.w - 14);
      labels.push(box);
    }

    if (!flight) {
      // Inertial axes and lunar orbit stay anchored to Earth's physical origin.
      ctx.strokeStyle = '#ffffff0d';
      if (earthPoint.x >= 0 && earthPoint.x <= width) line(earthPoint.x, 0, earthPoint.x, height);
      if (earthPoint.y >= 0 && earthPoint.y <= height) line(0, earthPoint.y, width, earthPoint.y);
      ctx.strokeStyle = '#aeb6c34d';
      ctx.setLineDash([4, 7]);
      ctx.beginPath();
      ctx.arc(earthPoint.x, earthPoint.y, config.moon.orbitRadius * scale, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function drawPath(points, color, dashed) {
      if (!points.length) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = dashed ? 1.5 : 1.7;
      ctx.setLineDash(dashed ? [7, 6] : []);
      ctx.beginPath();
      points.forEach((point, index) => {
        const p = project(point);
        if (index === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      if (!dashed) ctx.lineTo(shipPoint.x, shipPoint.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
    }
    if (!flight) drawPath(prediction, '#f5c181', true);
    drawPath(trail, '#a4e0bd', false);

    function body(name, key, point, physicalRadius, minRadius, distance) {
      // Enlarged artwork fits inside the available physical clearance from the ship.
      const physicalPixels = physicalRadius * scale;
      const maxArtRadius = Math.max(0, distance * scale - clearance);
      const radius = flight ? Math.max(physicalPixels, Math.min(minRadius, maxArtRadius)) : Math.max(minRadius, physicalPixels);
      if (point.x + radius < -12 || point.x - radius > width + 12
        || point.y + radius < -12 || point.y - radius > height + 12) return false;
      ctx.save();
      if (flight && key === 'earth') {
        const atmosphere = ctx.createRadialGradient(point.x, point.y, radius * 0.985, point.x, point.y, radius + Math.min(18, radius * 0.07));
        atmosphere.addColorStop(0, 'rgba(113,181,255,0)');
        atmosphere.addColorStop(0.6, 'rgba(107,177,253,0.34)');
        atmosphere.addColorStop(1, 'rgba(90,150,225,0)');
        ctx.fillStyle = atmosphere;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius + Math.min(18, radius * 0.07), 0, TAU);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, TAU);
      ctx.clip();
      const asset = assets[key];
      ctx.fillStyle = key === 'earth' ? '#245d95' : '#b3b4b4';
      ctx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
      if (asset.status === 'loaded') ctx.drawImage(asset.image, ...BODY_CROPS[key], point.x - radius, point.y - radius, radius * 2, radius * 2);
      const night = ctx.createLinearGradient(point.x - radius, point.y - radius * 0.3, point.x + radius, point.y + radius * 0.3);
      night.addColorStop(0, 'rgba(2,6,15,0)');
      night.addColorStop(0.45, 'rgba(2,6,15,0.02)');
      night.addColorStop(0.73, 'rgba(2,6,15,0.36)');
      night.addColorStop(1, 'rgba(2,6,15,0.84)');
      ctx.fillStyle = night;
      ctx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
      ctx.restore();
      ctx.strokeStyle = key === 'earth' ? '#92c8f366' : '#e6e4df33';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, TAU);
      ctx.stroke();
      // A partial horizon is named inside its visible disk; small bodies use exterior labels.
      const textWidth = ctx.measureText(name).width;
      const x = clamp(point.x - textWidth / 2 - 7, 16, Math.max(16, width - textWidth - 30));
      const y = radius > height * 0.65 ? clamp(point.y, 45, height - 110) : point.y + radius + 11;
      const box = chooseLabel(name, [[x, y], [x, point.y - radius - 36], [point.x + radius + 14, point.y - 13]]);
      paintLabel(name, box);
      if (radius < height * 0.65) obstacles.push({ x: point.x - radius, y: point.y - radius, w: radius * 2, h: radius * 2 });
      return true;
    }

    const earthVisible = body('Earth', 'earth', earthPoint, config.earth.radius, flight ? 75 : 14, earthDistance);
    const moonVisible = body('Moon', 'moon', moonPoint, config.moon.radius, flight ? 43 : 10, moonDistance);

    function bearing(name, point, distance) {
      const dx = point.x - shipPoint.x;
      const dy = point.y - shipPoint.y;
      const margin = 25;
      const reach = Math.min((width / 2 - margin) / Math.max(Math.abs(dx), 1), Math.max(20, height / 2 - 155) / Math.max(Math.abs(dy), 1));
      const edge = { x: width / 2 + dx * reach, y: height / 2 + dy * reach };
      const angle = Math.atan2(dy, dx);
      ctx.save();
      ctx.translate(edge.x, edge.y);
      ctx.rotate(angle);
      ctx.strokeStyle = '#d1d9e5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-7, -5);
      ctx.lineTo(0, 0);
      ctx.lineTo(-7, 5);
      ctx.stroke();
      ctx.restore();
      const text = `${name} · ${Math.round(distance / 1000).toLocaleString('en-US')} km`;
      const box = chooseLabel(text, [[edge.x - 72, edge.y + 13], [edge.x - 72, edge.y - 38], [edge.x + 15, edge.y - 12],
        [width - 510, edge.y - 12], [18, 120], [18, height - 200]]);
      paintLabel(text, box, '#d1d9e5');
    }
    if (flight && !earthVisible) bearing('Earth', earthPoint, earthDistance);
    if (flight && !moonVisible) bearing('Moon', moonPoint, moonDistance);

    if (shipPoint.x >= 0 && shipPoint.x <= width && shipPoint.y >= 0 && shipPoint.y <= height) {
      const half = rocketSize / 2;
      const shipText = 'Spacecraft';
      const box = chooseLabel(shipText, [[shipPoint.x + half + 12, shipPoint.y - half - 22],
        [shipPoint.x + 15, shipPoint.y + half + 23], [shipPoint.x - half - 95, shipPoint.y - half - 22],
        [shipPoint.x - 50, shipPoint.y + half + 23]]);
      ctx.strokeStyle = '#aeb6c3aa';
      line(shipPoint.x, shipPoint.y, clamp(shipPoint.x, box.x, box.x + box.w), clamp(shipPoint.y, box.y, box.y + box.h));
      paintLabel(shipText, box);
      ctx.save();
      ctx.translate(shipPoint.x, shipPoint.y);
      ctx.rotate(-displayHeading);
      if (thrusting) {
        const pulse = moving ? 1 + 0.065 * Math.sin(animationTime * 39) : 1;
        const nozzle = -rocketSize * 0.48;
        const length = rocketSize * (flight ? 0.85 : 0.55) * pulse;
        const flame = ctx.createLinearGradient(nozzle, 0, nozzle - length, 0);
        flame.addColorStop(0, '#effbff');
        flame.addColorStop(0.16, '#98cfff');
        flame.addColorStop(0.45, '#fbbb6cdd');
        flame.addColorStop(1, '#dc6f2800');
        ctx.fillStyle = flame;
        ctx.beginPath();
        ctx.moveTo(nozzle + 2, -rocketSize * 0.055);
        ctx.bezierCurveTo(nozzle - length * 0.27, -rocketSize * 0.09, nozzle - length * 0.72, -rocketSize * 0.025, nozzle - length, 0);
        ctx.bezierCurveTo(nozzle - length * 0.72, rocketSize * 0.025, nozzle - length * 0.27, rocketSize * 0.09, nozzle + 2, rocketSize * 0.055);
        ctx.closePath();
        ctx.fill();
      }
      const rocket = assets.rocket;
      if (rocket.status === 'loaded') {
        const image = rocket.image;
        const h = rocketSize * image.naturalHeight / image.naturalWidth;
        ctx.drawImage(image, -rocketSize / 2, -h / 2, rocketSize, h);
      } else {
        ctx.beginPath();
        ctx.moveTo(rocketSize / 2, 0);
        ctx.lineTo(-rocketSize * 0.38, -rocketSize * 0.2);
        ctx.lineTo(-rocketSize * 0.24, 0);
        ctx.lineTo(-rocketSize * 0.38, rocketSize * 0.2);
        ctx.closePath();
        ctx.fillStyle = '#dce3eb';
        ctx.fill();
      }
      ctx.restore();
    }

    if (!flight && closestPoint) {
      const point = project(closestPoint);
      if (point.x > 10 && point.x < width - 10 && point.y > 40 && point.y < height - 70) {
        ctx.strokeStyle = '#f5c181';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(point.x - 4, point.y - 4, 8, 8);
        const box = chooseLabel('Forecast closest', [[point.x + 14, point.y - 38], [point.x + 14, point.y + 18], [point.x - 140, point.y - 38]]);
        line(point.x, point.y, box.x + box.w / 2, box.y + box.h / 2);
        paintLabel('Forecast closest', box, '#f5c181');
      }
    }

    if (flight) return;
    // A physical 1/2/5 distance; body artwork may be enlarged, this bar never is.
    const desiredKm = Math.min(110, width * 0.28) / scale / 1000;
    const magnitude = 10 ** Math.floor(Math.log10(desiredKm));
    const fraction = desiredKm / magnitude;
    const km = (fraction >= 5 ? 5 : fraction >= 2 ? 2 : 1) * magnitude;
    const barLength = km * 1000 * scale;
    const barX = 24;
    const barY = height - 120;
    ctx.fillStyle = 'rgba(5,9,16,0.88)';
    ctx.fillRect(14, barY - 36, Math.max(140, barLength + 20), 51);
    ctx.strokeStyle = '#d6d8df';
    ctx.lineWidth = 1;
    line(barX, barY, barX + barLength, barY);
    line(barX, barY - 4, barX, barY + 4);
    line(barX + barLength, barY - 4, barX + barLength, barY + 4);
    ctx.font = DATA_FONT;
    ctx.fillStyle = '#d6d8df';
    ctx.fillText(`${km.toLocaleString('en-US', { maximumFractionDigits: 3 })} km`, barX, barY - 24);
  }

  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(redraw);
  observer?.observe(canvas);
  return {
    draw,
    getStatus() {
      const entries = Object.values(assets);
      return { loaded: entries.filter(asset => asset.status === 'loaded').length,
        total: entries.length, failed: entries.filter(asset => asset.status === 'failed').length };
    },
    destroy() {
      destroyed = true;
      lastFrame = undefined;
      observer?.disconnect();
      Object.values(assets).forEach(asset => asset.listeners.delete(redraw));
    },
  };
}



