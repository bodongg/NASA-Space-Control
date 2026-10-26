# Continuous Earth–Moon landing

User authorization 2026-10-19: extend the Moon journey to a visible lunar landing. This supersedes the former flyby-only goal for the default mission. Use the brainstorming, writing-plans, subagent-driven-development, TDD and Impeccable workflows; preserve the existing NASA world.

## Physics and scope

Default landing mission begins after the same simulated450s departure, above Earth. New fixed landing vehicle: dry4000kg, initial fuel16000kg, Isp450s, thrust100000N; Moon phase2.6rad. Its initial total mass/thrust are twice the old profile, so reconstructing the finite burn gives exactly the same position/velocity, with5802.837870kg postburn fuel. Preserve the original transfer/flyby and manual LEO factory/tests.

Coast, approach braking and descent advance the same Earth-centered state under existing Earth/Moon gravitation. No position/velocity replacement, refueling, scene teleport or manufactured success. Guidance uses Moon-relative radial/tangential velocities and the verified acceleration/sink envelope in the feasibility scripts. Recompute controls at each substep, at most.25s during approach/descent; existing swept surface collision remains authoritative. At physical lunar contact classify safe touchdown only with absolute radial speed<=2m/s, tangential speed<=1m/s and thrust/vehicle tilt<=10deg from the surface normal. Hard impact, fuel exhaustion and manual deviations can fail. Store precontact speeds in touchdown evidence; landed state may inherit Moon velocity to represent rest relative to the surface.

Actual throwaway probe reached surface at t223096.592s, radial−.300m/s, tangential.000007m/s, remaining fuel414.495kg; production must reproduce with tests. These are educational model results, not real spacecraft specifications.

## Module contracts

`src/orbital/lunarLanding.js` exports `createLunarLandingMission()`, `lunarLandingDiagnostics(mission)`, `lunarLandingGuidance(mission)`, `advanceLunarLanding(mission, manualControls, seconds, {guided=true}={})`, `lunarLandingWarp(mission, effectiveControls, requested, guided=true)`. Mission shape remains state/config/status/closestAltitude/preset, preset=`landing`, with phase and optional touchdown evidence. Diagnostics exposes altitude, verticalSpeed (outward positive), horizontalSpeed (signed tangent), speed, radialAngle. Guidance returns finite throttle/heading/phase. Terminal success status=`landed`; failures use existing impact/lost states. Guided warp stays bounded, slows below10km and below100m; manual burn retains10× cap. Integrate guidance each numerical substep at every allowed warp.

`createOrbitalMap().draw(frame)` accepts optional `landing` diagnostics/phase/landed data and `presentationControlsVisible`. Render world travel from existing actual positions. For final descent below~2000m, switch only the camera/projection to Moon-local surface coordinates: actual altitude moves the rocket to physical contact, actual thrust drives exhaust, actual heading transforms into Moon-local orientation. Show recognizable lunar terrain, grounded touchdown and a persistent outcome; do not alter numerical state. Reserve phone control/readout/pause/exit areas, respect reduced motion and preserve Map mode.

## Experience and evidence

Default action Start Moon landing. Guided landing on by default for a repeatable presentation; explicit guidance toggle permits manual throttle/heading experiments. Guided commands appear in live forces/readouts and flame. Display lunar altitude and Moon-relative vertical/horizontal speeds clearly, alongside existing Earth-centered chart units. Fullscreen/expanded, pause/exit/keyboard and state preservation remain. Moon landing, flyby and Earth practice are explicitly distinct starts; changing a start archives prior meaningful data.

Telemetry, stored runs, CSV and Markdown reports accept landing/landed and include touchdown speeds/landing phases without rejecting older records. Engine-off forecasts remain labeled snapshots excluding future guidance burns; no coast prediction is advertised as a landing forecast. NASA assets/fonts and educational limitations stay credited.

Complete meaningful numerical contact/guidance/fuel and backward-compatibility tests, production build, actual main-button browser landing, guided/manual failure checks, scene/map/fullscreen state preservation, desktop/user/phone visual review, saved result/export evidence, and Obsidian update. Physical classroom rehearsal and student reflection remain team tasks.
