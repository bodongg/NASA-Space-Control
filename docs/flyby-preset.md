# Verified lunar flyby preset

The **transfer** preset starts immediately after a finite departure burn near Earth. Its departure has already happened when the map opens: the vehicle remains manually controllable, and no autopilot runs during play. The **leo** preset starts the original 400 km circular orbit with full fuel for manual experiments.

## Reproducible departure

Use the existing SI configuration unchanged: Earth radius 6,371,000 m; gravitational parameter 3.986004e14 m³/s²; lunar orbit radius 384,400,000 m; lunar period 2,360,448 s; lunar radius 1,737,000 m; Moon enabled. Set the Moon's initial phase to **2.6 radians**.

Start at x=6,771,000 m, y=0, vx=0, vy=sqrt(muEarth/6,771,000). Dry mass is 4,000 kg, starting propellant 6,000 kg, specific impulse 450 s, and maximum thrust 50,000 N. No extra propellant is required.

Burn at full throttle for **450 seconds**. Every **0.25 s**, recompute inertial heading as atan2(vy,vx), then advance stepOrbit with its default velocity Verlet integrator for 0.25 s. This models finite, velocity-prograde guidance during preset preparation. Stop thrust after the burn.

The checked post-departure state, stored as constants rather than recalculated on every reset:

| Quantity | Value |
| --- | ---: |
| x | 5,810,713.295755245 m |
| y | 3,907,260.8748479267 m |
| vx | -4,435.215612741942 m/s |
| vy | 9,649.438753251181 m/s |
| Remaining propellant | 901.4189351102686 kg |
| Elapsed simulation time | 450 s |
| Accumulated ideal thrust delta-v | 3,146.72998190761 m/s |

## Flight verification

Coast with throttle zero through advanceMission(mission, {}, 120), repeating while status is active. Each call internally checks events at intervals no longer than 1 s, with powered intervals no longer than 0.25 s and an exact split at fuel exhaustion.

The real preset reaches the 20,000 km lunar surface altitude success region at **t=209,879 s**, about **2.429 days after the initial LEO state**. Its sampled lunar altitude is **19,999.071 km**; remaining fuel is **901.419 kg**. This is the game's terminal flyby result. The result records the closest altitude reached before stopping, so it does not claim to have simulated the later periapsis during play.

An additional unpowered physical coast using stepOrbit with 1 s steps, continued after the game success threshold, reaches a closest surface altitude of approximately **3,523.662 km** at **t=224,228 s**. The automated flight test continues to t=250,000 s and verifies no Earth or Moon impact and a closest altitude between 3,000 and 4,000 km. This continuation validates the flyby geometry; it is not a claim of lunar capture.

Run:

~~~text
node --test src/tests/mission.test.js
~~~

The same test reconstructs the departure burn and compares all stored state fields to the numerical result within 1e-6 in their SI units. Separate tests cover swept Earth collisions, moving-Moon collisions, overlaps, stopping terminal missions, fuel exhaustion, the lost boundary, warp limits, invalid inputs and input immutability.

## Event and scheduler limits

Surface events use segment crossings, including Moon motion during each interval. They interpolate the stopping time, integrate velocity and fuel only until that instant, and place the endpoint on the body's surface before stopping. This prevents outside endpoints from tunneling through a body and avoids sampling the point-mass singularity. Surface crossing time uses a straight chord over at most 1 s (0.25 s when powered), so it remains a numerical estimate.

safeWarp caps a fueled burn at 10x, coasting within 10,000 km of the lunar surface or below 100 km Earth altitude at 100x, and distant coasting at 10,000x. An empty tank counts as coasting. The browser separately limits work per frame and each advance call to at most 120 simulated seconds; requested warp can exceed the simulation throughput that the current frame budget permits.

