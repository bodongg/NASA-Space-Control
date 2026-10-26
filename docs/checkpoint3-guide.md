# Prediction, setup and analysis — checkpoint 3

## Try the educational workflow

Run npm run dev in the rocket-landing project and open its printed URL. Choose Lunar transfer · post-burn, Load start, then Start flight. Leave the engine off. The dashed amber forecast and its closest-approach marker are separate from the green traveled history. Scroll to The forces behind the flight, Build your vehicle, and Flight report & analysis, or use the sidebar links.

The report automatically records the initial state and terminal outcome. A terminal run is saved locally. Resetting/applying a new vehicle also saves a meaningful previous segment before starting over. Save run records the current partial flight. Choose a saved run to overlay speed, total energy and traveled trajectory. Up to three runs remain in this browser after reload; unavailable/full storage reports a recovery message and CSV remains available.

Download CSV produces setup metadata followed by a unit-labeled SI telemetry table. Metadata lines begin #. Download report produces a Markdown flight report with measured results, setup, equations, assumptions and a student-reflection section. Add actual screenshots, interpretation and team contributions before submission.

## Forecast interpretation

The worker advances the same velocity-Verlet engine with surface/lost guards and no thrust. It continues beyond the game's flyby target to estimate the later closest approach, over a maximum three-day horizon. Snapshot time and estimated approach time are displayed in absolute mission hours. A forecast is not a guarantee or autopilot; burning changes its starting state, and numerical substeps approximate the trajectory.

Only one job runs at once. Reset terminates the worker and invalidates results. Refreshes are at least 2.5 wall seconds apart, after 10 simulation seconds during a fueled burn or 7,200 seconds during coast; changing the engine command also invalidates the cache. Force Refresh requests a snapshot as soon as no job is pending. Hiding the checkbox hides the line and marker. Forecast failure leaves flight controls working and offers a retry.

The verified transfer's three-day forecast estimates closest lunar surface altitude at about 3,523.662 km at mission t=224,228 s. The actual game succeeds and stops earlier, when altitude first enters 20,000 km, around t=209,879 s. Thus the report's closest reached altitude and forecast's future closest approach intentionally differ.

## Live forces and vehicle setup

The physics panel shows current mass, commanded thrust, Earth acceleration, differential Moon acceleration, thrust acceleration, and their vector sum. Small nonzero accelerations use scientific notation. When paused, the panel describes the instantaneous command without claiming time advances.

Vehicle sliders set dry mass, initial fuel, maximum thrust and Isp for a NEW paused 400 km circular LEO run. Reset restores that run's configured vehicle. Loading the stock LEO start restores stock values. The transfer preset always uses its original tested setup. The ideal delta-v budget is Isp*g0*ln((dry+fuel)/dry). Its 3.084 km/s departure reference assumes an impulsive Earth-only transfer from 400 km LEO to lunar distance; finite burns, timing and corrections require margin. It does not prove mission success.

## Telemetry and charts

Record sampling normally occurs at intervals of at least 60 simulation seconds, with forced current samples for pause, save/export and terminal state. Adaptive decimation keeps at most 2,500 samples while retaining initial/latest endpoints. It is sampled evidence, not a log of every internal solver substep.

Charts use Chart.js: speed in km/s against elapsed hours; kinetic/potential/total energy in GJ against elapsed hours; x/y traveled path in km. The numerical table provides accessible start/latest measurements including specific energy in MJ/kg. Saved-run overlays align each run's loaded start to zero elapsed time. The trajectory graph preserves chronological order and supports nonmonotonic x coordinates; its axes scale independently, so judge orbital shape using the equal-coordinate-scale flight map.

Energy includes the indirect Moon potential needed by the Earth-centered acceleration model. The prescribed moving Moon and fuel/exhaust exchanges make spacecraft mechanical energy time-dependent. Compare mass and initial mode when comparing energies. Conservation is validated separately in Earth-only unpowered tests.

For the transfer preset, departure happens BEFORE loading. Time, fuel used and delta-v used in the segment summary are differences from its first recorded state (t=450 s, about 901 kg fuel). Its completed departure used about 3.147 km/s ideal delta-v and 5,099 kg fuel; those values are not silently added to a coast-only segment.

## Verification evidence

- All original tests plus custom vehicle, forecast, sampling/summary/CSV and storage tests run with npm test.
- npm run build includes the forecast worker and live charts.
- A real Chart.js regression used an almost full LEO orbit: actual x range approximately -6,771 to +6,771 km must fit chart limits despite returning near its starting x coordinate.
- Browser checks cover live forces, custom vehicle/reset, real CSV/report downloads, storage after reload, saved overlays, forecast output and actual flyby outcome.

The next checkpoint upgrades rocket/Earth/Moon artwork, space scenery, animation and presentation design; see checkpoint4-visual-brief.md. These illustrated visuals are not implemented by this checkpoint.
