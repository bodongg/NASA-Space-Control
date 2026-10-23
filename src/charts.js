import { Chart, LineController, LineElement, PointElement, LinearScale, Tooltip, Legend } from 'chart.js';
import './analysis.css';

Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Legend);

const COLORS = { blue: '#154cb8', amber: '#8c4a09', ink: '#17171b', green: '#1b6843', red: '#b6271c' };
const number = (value, digits = 3) => Number.isFinite(value)
  ? value.toLocaleString('en-US', { maximumFractionDigits: digits }) : '—';
const elapsed = (sample, record) => (sample.time - record.initialTime) / 3600;

// Keep both endpoints when a caller supplies more than the recorded history limit.
function samplesOf(record) {
  const samples = record?.samples ?? [];
  if (samples.length <= 2500) return samples;
  return Array.from({ length: 2500 }, (_, i) => samples[Math.round(i * (samples.length - 1) / 2499)]);
}

function series(label, color, points, dashed = false) {
  return {
    label, data: points, borderColor: color, backgroundColor: color,
    borderWidth: 2, borderDash: dashed ? [7, 5] : [],
    pointRadius: points.length === 1 ? 4 : 0, pointHitRadius: 8,
    pointHoverRadius: 4, fill: false, tension: 0, showLine: true,
  };
}

function chartOptions(xTitle, yTitle) {
  const axis = (title) => ({
    type: 'linear', title: { display: true, text: title, color: COLORS.ink, font: { size: 12, weight: 'bold' } },
    ticks: { color: '#57575d', maxTicksLimit: 6, font: { size: 11 }, callback: value => number(value, 2) },
    grid: { color: '#d8d8d8' }, border: { color: '#b9b9bf' },
  });
  return {
    responsive: true, maintainAspectRatio: false, animation: false, parsing: false,
    font: { family: 'Public Sans, Arial, sans-serif' },
    interaction: { mode: 'nearest', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { color: COLORS.ink, boxWidth: 22, boxHeight: 2, padding: 16, font: { family: 'Public Sans, Arial, sans-serif', size: 11 } } },
      tooltip: { callbacks: { title: items => xTitle + ': ' + number(items[0].parsed.x), label: context => context.dataset.label + ' · ' + yTitle + ': ' + number(context.parsed.y) } },
    },
    scales: { x: axis(xTitle), y: axis(yTitle) },
  };
}

/** Render bounded live records. Caller controls update cadence (at most 2 Hz). */
export function createAnalysisPanel(host) {
  const panel = document.createElement('div');
  panel.className = 'analysis-panel';
  panel.innerHTML = `
    <p class="analysis-intro">Follow speed, energy and the traveled path as the flight advances. Time starts at zero for each run, including the post-departure preset.</p>
    <div class="analysis-chart-grid">
      <figure class="analysis-figure">
        <h3>Speed through the flight</h3>
        <div class="analysis-chart-wrap"><canvas role="img" aria-label="Speed versus elapsed time in hours"></canvas></div>
        <figcaption>Earth-centered speed. Gravity and thrust change both the direction and size of velocity.</figcaption>
      </figure>
      <figure class="analysis-figure">
        <h3>Where the energy goes</h3>
        <div class="analysis-chart-wrap"><canvas role="img" aria-label="Kinetic, potential and total energy versus elapsed time in hours"></canvas></div>
        <figcaption>Kinetic + potential = total energy. Potential includes the Moon’s indirect term. The moving Moon and changing fuel mass mean spacecraft energy need not stay constant.</figcaption>
      </figure>
      <figure class="analysis-figure analysis-trajectory">
        <h3>The path in two dimensions</h3>
        <div class="analysis-chart-wrap analysis-trajectory-wrap"><canvas role="img" aria-label="Traveled spacecraft trajectory in Earth-centered x and y coordinates in kilometers"></canvas></div>
        <figcaption>Earth is at (0, 0); +x points right and +y points up. Axis ranges scale independently: use the flight map to judge orbital shape. Lines show recorded travel, not a prediction.</figcaption>
      </figure>
    </div>
    <p class="analysis-history-note">No flight data yet. Load a starting point to begin.</p>
    <div class="analysis-table-wrap" tabindex="0" role="region" aria-label="Numerical chart summary, scroll horizontally on small screens">
      <table class="analysis-table">
        <caption>Measurements behind the charts</caption>
        <thead><tr><th scope="col">Run / sample</th><th scope="col">Elapsed (h)</th><th scope="col">Speed (km/s)</th><th scope="col">Specific energy (MJ/kg)</th><th scope="col">Total energy (GJ)</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>`;
  host.append(panel);
  const canvases = [...panel.querySelectorAll('canvas')];
  const speed = new Chart(canvases[0], { type: 'line', data: { datasets: [] }, options: chartOptions('Elapsed time (h)', 'Speed (km/s)') });
  const energy = new Chart(canvases[1], { type: 'line', data: { datasets: [] }, options: chartOptions('Elapsed time (h)', 'Energy (GJ)') });
  // Orbital x positions reverse direction; parsing must inspect unsorted extrema.
  const trajectory = new Chart(canvases[2], { type: 'line', data: { datasets: [] }, options: { ...chartOptions('Earth-centered x (km)', 'Earth-centered y (km)'), parsing: true } });
  const history = panel.querySelector('.analysis-history-note');
  const body = panel.querySelector('tbody');
  let destroyed = false;

  function update(record, comparison = null) {
    if (destroyed) return;
    const live = samplesOf(record);
    const saved = samplesOf(comparison);
    const timePoints = (samples, run, key, divisor) => samples.map(sample => ({ x: elapsed(sample, run), y: sample[key] / divisor }));
    const pathPoints = samples => samples.map(sample => ({ x: sample.x / 1000, y: sample.y / 1000 }));
    speed.data.datasets = [series('Current speed', COLORS.blue, timePoints(live, record, 'speed', 1000))];
    energy.data.datasets = [
      series('Kinetic', COLORS.blue, timePoints(live, record, 'kinetic', 1e9)),
      series('Potential', COLORS.amber, timePoints(live, record, 'potential', 1e9)),
      series('Total', COLORS.ink, timePoints(live, record, 'total', 1e9)),
    ];
    trajectory.data.datasets = [series('Current path', COLORS.green, pathPoints(live))];
    if (saved.length) {
      speed.data.datasets.push(series('Saved speed', COLORS.red, timePoints(saved, comparison, 'speed', 1000), true));
      energy.data.datasets.push(series('Saved total', COLORS.red, timePoints(saved, comparison, 'total', 1e9), true));
      trajectory.data.datasets.push(series('Saved path', COLORS.red, pathPoints(saved), true));
    }
    speed.options.scales.x.min = 0;
    energy.options.scales.x.min = 0;
    const duration = Math.max(0, ...live.map(sample => elapsed(sample, record)), ...saved.map(sample => elapsed(sample, comparison)));
    // Give the initial datum a visible interval until simulation time advances.
    speed.options.scales.x.max = duration > 0 ? undefined : 1;
    energy.options.scales.x.max = duration > 0 ? undefined : 1;
    for (const chart of [speed, energy, trajectory]) chart.update('none');

    history.textContent = live.length === 0 ? 'No flight data yet. Load a starting point to begin.'
      : live.length === 1 ? 'Starting measurements are shown as dots. Start the flight to grow the curves.'
        : `${number(live.length, 0)} current samples shown over ${number(elapsed(live.at(-1), record), 2)} hours. Charts retain at most 2,500 samples per run, including the starting and latest measurements.`;
    if (saved.length) history.textContent += ' Dashed red lines show the selected saved run, aligned to its own start.';
    body.replaceChildren();
    for (const [run, samples, name] of [[record, live, 'Current'], [comparison, saved, 'Saved']]) {
      if (!samples.length) continue;
      const entries = samples.length === 1 ? [[samples[0], 'start / latest']] : [[samples[0], 'start'], [samples.at(-1), 'latest']];
      for (const [sample, position] of entries) {
        const row = document.createElement('tr');
        const label = document.createElement('th');
        label.scope = 'row';
        label.textContent = `${name} · ${position}`;
        row.append(label);
        for (const value of [elapsed(sample, run), sample.speed / 1000, sample.specificEnergy / 1e6, sample.total / 1e9]) {
          const cell = document.createElement('td');
          cell.textContent = number(value);
          row.append(cell);
        }
        body.append(row);
      }
    }
    const latest = live.at(-1);
    const timing = latest ? `Latest at ${number(elapsed(latest, record), 2)} hours.` : 'No measurements yet.';
    canvases[0].setAttribute('aria-label', `Speed in kilometers per second versus elapsed hours. ${timing} ${latest ? `Current speed ${number(latest.speed / 1000)} kilometers per second.` : ''} Numerical start and latest measurements follow the charts.`);
    canvases[1].setAttribute('aria-label', `Kinetic, potential and total energy in gigajoules versus elapsed hours. ${timing} ${latest ? `Current total ${number(latest.total / 1e9)} gigajoules.` : ''} Numerical start and latest measurements follow the charts.`);
    canvases[2].setAttribute('aria-label', `Recorded Earth-centered trajectory in kilometers, positive x right and positive y up, with independent axis ranges. ${latest ? `Latest position x ${number(latest.x / 1000)}, y ${number(latest.y / 1000)} kilometers.` : timing}`);
  }

  update(null);
  return {
    update,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const chart of [speed, energy, trajectory]) chart.destroy();
      panel.remove();
    },
  };
}






