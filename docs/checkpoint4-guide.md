> Current default —2026-10-19: **Earth launch → Moon** now calculates lift-off, atmospheric drag, stages, orbit insertion and the actual departure burn before lunar landing. Select **Launch mission**. See [Earth launch model/demo](earth-launch.md). Older post-departure instructions below apply to the explicitly selected shorter starts.

> Current extension — 2026-10-19: the default is now **Moon landing · guided**, with continuous coast, braking, powered descent and calculated touchdown. See [lunar landing model/demo](lunar-landing.md) and current validation. The original flyby instructions below apply when **Moon flyby · coast** is selected.

# Checkpoint 4 — illustrated flight and presentation

Implemented 2026-10-18 with user approval for the rocket visuals and fullscreen presentation. The existing Earth–Moon physics, forecasts, charts, reports and landing fallback remain available. Visual review resolved all three listed fixes. Classroom hardware checks, team rehearsal and student reflection are pending.

## Start and choose a view

Run `npm install`, then `npm run dev` and open the local Vite URL. For a production rehearsal, run `npm run build`, then `npm run preview`. Load the page once and confirm all four flight images finish loading before presenting. Flight images and fonts are bundled locally; the NASA reference link requires a connection.

**Flight view** follows the spacecraft and shows the recognizable rocket, thrust exhaust, photographed Earth/Moon and space artwork. **Orbital map** gives the physical distance overview, camera/zoom, green traveled path, dashed amber engine-off forecast and forecast closest marker when a forecast is available. Switching views preserves flight data. Enlarged body/rocket artwork is not a collision boundary; background planets are illustrative scenery. Use map geometry and numerical readouts for measurements.

## Presentation controls

| Action | Control |
| --- | --- |
| Fill the display | **Enter fullscreen** or **F**; requests browser fullscreen |
| Fill the browser window | **Expand view**; uses the same presentation without a native fullscreen request |
| Hide or restore secondary overlays and flight panel | **Hide controls / Show controls**, or **H** during presentation |
| Start, pause or resume the active flight | Persistent scene button, or **P** |
| Leave presentation | **Exit presentation**, **Escape**, or **F** |
| Toggle engine | **Enable/Disable engine**, or **Space** when a button/link is not focused |
| Change manual heading | Slider, or left/right arrows in 5° steps |

Fullscreen automatically retains the expanded presentation if the browser denies or lacks the native API. Hiding controls leaves the toolbar, pause/resume and exit accessible. The visible flight panel offers engine, throttle, heading, prograde/retrograde and warp controls; it scrolls on smaller displays. Tab stays within the presentation controls while active. Shortcuts are suppressed while typing in inputs/selects/textareas; native button activation remains available.

Entering presentation frames and follows the spacecraft. Exiting restores the previous camera/view/zoom and returns focus to the entry control. Resizing changes the renderer, not the mission. Entry/exit do not pause a running flight; pause first to compare unchanged readings. A hidden browser tab pauses the simulation. Reduced-motion settings bypass display heading/camera easing and suppress decorative background/flame movement.

## Repeatable classroom sequence

1. Open the page: **Moon mission · post-burn** is prepared and paused at 10,000× warp. Its simulated 450 s departure burn is already complete, with about 901.419 kg fuel remaining. This starts above Earth, not on the ground. Explain the forces and engine-off coasting.
2. Select **Start Moon flight** in the normal page or scene. This primary action follows the verified lunar route without opening another menu. Keep the engine off for the unmodified demonstration; changing thrust changes its outcome.
3. Enter fullscreen or expand view if desired. **H** hides/restores overlays; **P** pauses. Switching views preserves the flight. **Restart Moon mission** intentionally replaces the current flight with a new verified transfer and saves the prior meaningful segment. It is a restart, not a continuation of manual flight.
4. Let the coast run to the flyby objective. The actual browser demonstration stopped automatically at **2d 10:17:59**, with the displayed Moon altitude about **19,999 km**. The target is 20,000 km above the lunar surface; reaching it is flyby success, not capture or closest approach. Safe warp can reduce the actual rate near an encounter.
5. Exit presentation. Inspect forces, request an engine-off forecast, switch to the orbital map for geometry, and inspect the speed/energy/trajectory charts. Compare saved runs and download CSV or a Markdown report. The post-departure coast segment correctly excludes the completed burn from its fuel/delta-v totals.

For optional manual experiments, choose **Earth orbit · practice** and **Load start**, then **Start Earth orbit**. This circular orbit stays near Earth without a departure burn. Enable the engine to explore thrust and fuel consumption; powered warp is capped at 10×. The practice panel's **Start Moon mission** action starts a new verified transfer and saves the prior meaningful segment. **Reset flight** resets the current preset and preserves configured LEO vehicle properties. Loading/restarting intentionally replaces flight data; changing view does not.

## Verification and remaining evidence

Implementation verification reported 64 passing tests and a successful production build. Browser checks entered actual native fullscreen, hid/restored controls, used P while buttons were focused, exited through Escape and Exit presentation, and completed the lunar demo. A paused manual flight at **0d 00:00:20 / 5,840 kg** retained those values across view switching and presentation exit/report inspection. The checked browser session had no warnings/errors; 1440 px desktop and 390 px phone layouts had no horizontal page overflow. These checks do not establish physical projector or school-laptop performance.

Completed evidence captures are `docs/screenshots/checkpoint4-desktop.jpg`, `checkpoint4-mobile.jpg`, `checkpoint4-powered-flight.jpg`, `checkpoint4-lunar-success.jpg`, `checkpoint4-mobile-presentation.jpg`, `checkpoint4-user-1280.jpg` and `checkpoint4-analysis.jpg`. See [validation](checkpoint4-validation.txt) and the [visual review record](checkpoint4-review.md). Complete the actual classroom laptop/projector/offline rehearsal, team interpretation and reflection before submission.

See [asset provenance](flight-assets.md) and production [credits](../public/flight/credits.md), served at `/flight/credits.md`. The four flight images total about 3.8 MB. Illustrated scale, decorative lighting and distant planets do not alter physical distances, forces, collision radii or mission outcomes. Capture, Mars and 3D remain deferred.
