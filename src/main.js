import './styles.css';

// Keep the earlier preflight lab available as a working fallback.
if (new URLSearchParams(location.search).get('view') === 'landing') {
  document.title = 'Rocket Landing — Mission Control';
  await import('./landing.js');
} else {
  const { mountFlight } = await import('./ui/screens/OrbitalFlight.js');
  const dispose = mountFlight(document.querySelector('#app'));
  if (import.meta.hot) import.meta.hot.dispose(dispose);
}
