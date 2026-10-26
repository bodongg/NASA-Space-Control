> Current default —2026-10-19: **Earth launch → Moon** now calculates lift-off, atmospheric drag, stages, orbit insertion and the actual departure burn before lunar landing. Select **Launch mission**. See [Earth launch model/demo](earth-launch.md). Older post-departure instructions below apply to the explicitly selected shorter starts.

# Continuous lunar landing — 2026-10-19

The user requested a landing after the Earth–Moon journey. This extends checkpoint 4; the original flyby and Earth-orbit experiments remain available.

## Demonstrate

1. Open the default page and select **Start Moon flight**. **Moon landing · guided** begins above Earth after a simulated 450 s departure burn, not at a launch pad.
2. Keep guidance on. The mission coasts, cancels Moon-relative sideways velocity, brakes and descends. The engine command, fuel flow, flame and force explanation use the same computed controls.
3. Use **Enter fullscreen** or **Expand view**. Pause/exit remain available; **H** hides secondary controls. Flight/map/fullscreen changes preserve the mission. Pausing first makes state comparisons straightforward.
4. Near 2 km altitude, flight view changes to a Moon-local surface camera. Actual state, time, fuel and trajectory continue through the camera change. Terrain is illustrative, not a landing-site elevation dataset.
5. At contact, inspect incoming vertical/sideways speed, tilt and remaining fuel. The paused result is automatically saved; CSV/report retain the incoming values even though the landed state is at rest relative to the Moon.

**Manual experiment:** turn off automatic guidance. This disables automatic engine and attitude commands and retains the current heading with the engine off. Manual inputs can fail; re-enabling guidance does not guarantee recovery from every state. Restart creates a new fixed landing vehicle, never refuels an ongoing flight.

## Vehicle and continuity

The original flyby vehicle has 4,000 kg dry mass, 6,000 kg initial fuel, 50 kN thrust and 450 s Isp. Its roughly 901 kg of post-departure fuel cannot fund the full powered landing.

The landing profile has 4,000 kg dry mass, 16,000 kg initial fuel, 100 kN thrust and 450 s Isp. Its initial total mass and thrust are twice the original profile. During the identical 450 s full-throttle prograde burn, mass remains twice the original, so acceleration and departure trajectory match. The loaded state has 5,802.837870220537 kg fuel and about 3,955.7 m/s ideal delta-v remaining. A numerical reconstruction test verifies this state; there is no coast-to-descent teleport or fuel refill.

## Guidance and contact

`src/orbital/lunarLanding.js` wraps the existing orbital integrator. With Moon position R and spacecraft position r, define outward u=(r−R)/|r−R| and tangent t=(−u_y,u_x). Resolve relative velocity v−V into vertical v_r and sideways v_t. Altitude is |r−R|−R_moon.

The controller subtracts the prescribed Moon's acceleration, sets a bounded inward-speed target from available braking acceleration and height, cancels sideways motion and compensates relative radial/tangential dynamics. Near the surface the target reduces to 0.30 m/s descent. Throttle is clamped to engine capability; it burns actual propellant using T/(Isp g0). Attitude follows the command directly: rotational inertia and torque are not modeled.

Guidance is recalculated at ≤0.25 s steps within 20,000 km of the Moon; far coasting uses ≤1 s steps. Warp caps: 10,000× far coast, 1,000× lunar approach, 100× below 100 km, 10× below 10 km, 1× below 3 m. Manual burns keep the existing 10× cap. Rendering speed does not change the physics step bounds.

Contact uses the original swept moving-body event detector. A successful touchdown requires |v_r|≤2 m/s, |v_t|≤1 m/s and thrust-axis tilt≤10° from local outward vertical. These are teaching/game criteria, not flight certification. Incoming contact values are saved before the terminal state is placed at rest relative to the Moon. Unsafe contact remains a Moon impact. Terminal missions freeze.

## Numerical evidence

The full ≤0.25 s guidance run reaches actual contact around mission t=223096.59 s (2d 13:58:16), with vertical speed −0.29997 m/s, sideways speed about 0.0000073 m/s and approximately 414.5 kg fuel. A variable-frame/warp run independently reaches contact with about −0.30000 m/s vertical speed and 414.6 kg fuel. Small numerical differences are expected from partial steps.

Tests cover finite-burn reconstruction, whole-journey contact, fuel accounting, incoming evidence, unsafe manual impact, warp, immutability and terminal freeze. Renderer tests cover altitude/contact projection, heading, actual-thrust exhaust, phone control clearance, terrain proportions and map preservation. See lunar-landing-validation.txt for the final suite/build and browser evidence.

## Limits and remaining assessed work

This is planar point-mass Newtonian motion with a circular prescribed Moon, differential lunar gravity, constant engine performance, direct attitude control, no atmosphere/launch/staging or landing-leg dynamics. The Moon-local camera uses a point contact foot and illustrative terrain. The model does not simulate orbit capture, Apollo vehicle staging or a geographically chosen landing site. The engine-off forecast excludes future guidance burns; it is not the guided landing prediction. Earth-centered energy charts remain Earth-centered and need not conserve energy with a moving Moon or fuel burn.

School laptop/projector/offline rehearsal, final report interpretation, team contributions and reflection remain. Mars, 3D, sound and a backend remain deferred. Artwork provenance: lunar-surface-asset.md and public/flight/credits.md.
