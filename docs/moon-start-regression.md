# Moon-start correction — 2026-10-19

## Reproduction and cause

The user saw the spacecraft circling Earth instead of traveling to the Moon. Actual initial DOM reproduced `mission-preset=leo`, `time-warp=1`, and a coast forecast remaining about375,892km above the Moon. The main Start button only unpaused that circular Earth orbit. The physics was behaving as configured; the initial mission flow contradicted the product goal.

## Correction

- Mount the verified `transfer` preset, paused at mission t450s, engine off, prepared10,000× warp and heading derived from velocity. Synchronize both setup selectors to this state.
- Primary action says **Start Moon flight**. First-viewport copy discloses the already simulated450s departure burn and engine-off coast. It is not a ground launch.
- Manual mode is **Earth orbit · practice**, with **Start Earth orbit** and an explicit explanation that circular coasting remains around Earth without a departure burn.
- Practice offers **Start Moon mission**; presentation offers **Restart Moon mission**. Both use the same load/archive/start handler and disclose replacing the run. Pause/resume/view switching preserve the current run.
- Map-only overlays no longer cover the physical scale: duplicate in-scene readouts are hidden, outside HTML telemetry remains, and the accurate scale note sits72px above the bottom. Flight overlays are unchanged.

## Actual regression checks

1. Before fix, the initial DOM condition `preset === 'transfer' && warp === '10000'` failed (leo/1). After mount/reload it passed; ordinary scene/main button says Start Moon flight.
2. Normal Start Moon flight completed the actual flyby without loading a hidden demonstration: mission time about2d10:17:58–59, Earth altitude366,564km, Moon altitude19,999km; terminal run auto-saved.
3. A second run was paused mid-transfer at1d00:49:48: Earth altitude213,335km and Moon altitude180,829km. Map capture shows the green traveled path leaving Earth. Resumed flight also completed and auto-saved.
4. Selecting practice + Load start produced Start Earth orbit, its explanatory notice and visible Moon shortcut. That shortcut loaded transfer/10,000× and started coasting.
5. Desktop1280px, phone390px and actual user714px captures opened and checked. Phone map note ends at y772, toolbar begins near y782; distance bar is clear. No page overflow observed.
6. Final `npm test`:64/64 pass; `npm run build`:pass. No orbital equations or asset files changed. Detector's only finding was an advisory existing16px tablet font outside the documented ramp; no structural finding.

## Review and evidence

Fresh independent review used the user's screenshot, source and corrected captures. Final disposition **ship** for this bounded fix: default route, departure disclosure, practice/recovery, outward trajectory, guide consistency and physical scale readability all resolved.

Evidence: `docs/screenshots/moon-start-desktop.jpg`, `moon-start-mobile.jpg`, `moon-start-user-714.jpg`, `moon-start-phone-map.jpg`, `moon-start-moon-route.jpg`, `moon-start-moon-arrival.jpg`. DESIGN/PRODUCT/surface/sidecar and current guide/startup instructions record the new default. Physical classroom rehearsal and student reflection remain team tasks.
