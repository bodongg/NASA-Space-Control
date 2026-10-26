> Current default —2026-10-19: **Earth launch → Moon** now calculates lift-off, atmospheric drag, stages, orbit insertion and the actual departure burn before lunar landing. Select **Launch mission**. See [Earth launch model/demo](earth-launch.md). Older post-departure instructions below apply to the explicitly selected shorter starts.

> Current extension — 2026-10-19: the default is now **Moon landing · guided**, with continuous coast, braking, powered descent and calculated touchdown. See [lunar landing model/demo](lunar-landing.md) and current validation. The original flyby instructions below apply when **Moon flyby · coast** is selected.

# Playable mission — checkpoint 2

The default browser route is the Earth–Moon flight display. The original landing preflight remains at ?view=landing; landing engine/config/tests and NASA assets are preserved. No dependencies were added.

## Run and demonstrate

From C:\Users\Xander Calz\OneDrive\Desktop\rocket-landing:

```powershell
npm run dev
```

Open the Vite URL. **Moon mission · post-burn** is the default, paused with the engine off and 10,000× warp selected. Press **Start Moon flight**. Coast until the automatic lunar flyby outcome at about 2 days 10 hours mission time. On a responsive laptop, this takes roughly half a minute of foreground browser time; actual rate depends on the device. The simulation pauses when the tab is hidden.

The preset starts AFTER a simulated 450 s full-throttle prograde departure burn. It is not a launch or live autopilot. Original vehicle constants remain unchanged; about 901 kg fuel and 0.897 km/s ideal delta-v remain. See flyby-preset.md for exact recipe, validation and physical continued-coast closest approach. The game stops at the flyby target, before closest approach.

For manual flying, load **Earth orbit · practice**. It begins at 400 km altitude with circular tangential velocity. Enable engine to apply thrust; engine off is unpowered coasting, not a stop command. Manual heading is counterclockwise from +x. Prograde/retrograde continuously follow the current velocity direction; moving the heading slider returns to manual control.

## Controls

| Control | Behavior |
| --- | --- |
| Start / Pause / Resume | Controls simulation time; terminal flight displays Flight complete |
| Reset flight | Restores the currently loaded starting preset, paused with engine off |
| Starting point + Load start | Loads the chosen manual or post-burn start |
| Enable / Disable engine | Toggles thrust; actual force also depends on throttle and fuel |
| Throttle | 0–100% of 50 kN |
| Heading | -180° to +180°, measured counterclockwise from +x |
| Prograde / Retrograde | Track along/opposite velocity until manual heading changes |
| Time warp | Request 1×, 10×, 100×, 1,000× or 10,000×; safety limits can reduce it |
| Camera | Follow Earth, spacecraft or moving Moon |
| Zoom / Overview | 1×–128× map magnification; Overview restores Earth camera at 1× |
| Space / P / Left / Right | Engine, pause, +5° / -5° manual heading. Shortcuts ignore form/link/button focus; native controls retain their own keyboard behavior |

## Outcomes and numerical safeguards

- Flyby succeeds when lunar altitude reaches 20,000 km or less without an impact.
- Earth/Moon impact stops flight at the detected surface. Mission steps are <=1 s; powered substeps are <=0.25 s and split again at fuel exhaustion. Swept relative line segments detect surface crossings even if both endpoints lie outside. Moon positions move during each step. Contact state is interpolated to the surface. This is a numerical chord approximation, not an exact continuous collision solution.
- Lost means crossing a radius of 1,000,000 km from Earth's center.
- Empty fuel is not failure; the spacecraft coasts.
- Powered warp is <=10×. Near Earth below 100 km altitude or the Moon below 10,000 km altitude, unpowered warp is <=100×. Fast-coast work is processed in chunks <=120 simulated seconds, rechecking limits between chunks.
- The browser loop caps wall delta at 0.05 s and stops work after 8 ms or 50 chunks per frame. Unprocessed catch-up is dropped, so a slow device runs below requested warp instead of creating an ever-growing backlog. Actual rate is displayed. Tab hiding pauses flight and clears wall-time catch-up.
- A numerical error pauses flight with a Reset flight recovery message.

The display shows actual traveled history, not a predicted trajectory. Body markers are enlarged for visibility; path distances and km scale bar use physical coordinates. Earth periapsis/apoapsis values are instantaneous two-body estimates: lunar gravity can change them substantially. Negative periapsis altitude means the current Earth-only estimate intersects Earth; it is not an already-detected collision.

## Verification and remaining scope

Run npm test and npm run build. Mission tests reconstruct the finite departure burn, fly the actual stored preset through the same mission function, test its continued physical coast, and cover impacts, swept collisions, moving Moon, empty fuel, warp and invalid inputs. Original orbital/landing tests remain included.

Browser verification covers start/pause, prograde, fuel consumption, powered 10× cap, keyboard P/Space, actual transfer success, zoom/follow, reset and the preserved landing route. Desktop and phone layouts are checked for overflow. Numerical CSV, prediction, charts, vehicle configuration, full result/analysis screens and report evidence are checkpoint 3; capture/Mars/3D remain upgrades.
