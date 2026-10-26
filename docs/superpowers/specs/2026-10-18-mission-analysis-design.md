# Checkpoint 3 — mission analysis and educational delivery

User approved proceeding on 2026-10-18. This extends the established NASA-style flight screen. Keep rocket/Earth/Moon artwork and solar-system scenery for checkpoint 4, where recognizable assets, visual coherence, animation, projector readability and a rehearsed professor-facing demonstration are explicit acceptance requirements. Visual impact is part of the assessed presentation, not an optional extra. No claim can guarantee a grade or audience reaction.

## Scope and flow

Add an engine-off trajectory prediction in a worker, differentiated from traveled history and labeled with snapshot time and approximation limits. Run the same Verlet model and retain surface/lost guards; allow forecast to continue beyond the flyby target to estimate closest approach. Request at most once per 2.5 wall seconds and meaningful simulation change; only one job in flight. Ignore stale reset results. Visibility pause continues to protect flight. A prediction failure does not disable flying.

Add a live physics section explaining Earth gravity, differential Moon gravity, thrust/mass and total acceleration with current numbers. Add vehicle sliders (dry mass, initial fuel, thrust, Isp), live ideal delta-v and a qualified ideal departure reference. Applying creates a paused custom LEO flight. The verified post-departure preset remains fixed and reproducible.

Add an inline flight report with current/terminal outcome, elapsed time from loaded start, mission clock, fuel/delta-v used during this recorded segment, closest altitude and sample count. Record the initial and terminal sample, include a current forced sample for export/save, and adaptively decimate bounded history without dropping its endpoints. Save up to three runs locally with explicit quota/corruption recovery. Export CSV in SI units with setup metadata and a Markdown report containing equations, results and limitations. Auto-save terminal runs; retain current history until reset. Save a meaningful current run before a reset/config change.

Add live Chart.js speed/energy graphs and a trajectory analysis plot. A selected saved run overlays the current run; elapsed-time axes align to each loaded start. Energy is not expected to stay constant with the moving Moon or fuel consumption. The Earth–Moon preset begins after its finite departure burn; all segment summaries and exports state that boundary. Comparisons explain differences in initial mass and starting mode.

## Files and interfaces

- orbital/mission.js: additive vehicle overrides for LEO and optional stopAtFlyby=false for forecast continuation; original defaults unchanged.
- orbital/trajectory.js + trajectoryWorker.js: immutable guarded coast forecast.
- orbital/telemetry.js + runStore.js: SI samples, bounded records, summary, CSV and recoverable local storage.
- charts.js + analysis.css: createAnalysisPanel(host).update(record,comparison) and destroy(). Chart.js is within the previously approved stack.
- ui/MissionWorkbench.js + mission-workbench.css: prediction lifecycle, vehicle/physics/report/analysis UI. Flight screen retains scheduler/control ownership.
- render/orbitalMap.js: dashed forecast and projected-approach marker, separate from traveled path.

## Acceptance

All prior tests/build pass. New tests cover custom vehicle effects, guarded coast accuracy and no mutation, sampler endpoints, segment-relative summaries, CSV values and persistence failures. Browser checks cover prediction response without blocking flight, live forces, custom vehicle reset/delta-v, full transfer outcome, terminal summary, CSV/report downloads, saved-run comparison and reload persistence. Desktop and phone layouts remain readable without horizontal overflow. Review code and screenshots; save report evidence and concise Obsidian state. Stop after this checkpoint for user review.
