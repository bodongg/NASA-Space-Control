# Orbital flight

Updated 2026-10-19. Mode: Operate. User task: launch from Earth through atmospheric layers, travel to and land on the Moon under calculated guidance; inspect or override commands and present a repeatable Physics 1 demonstration.

## Visual authority

Inherit DESIGN.md: black NASA masthead, centered unchanged official insignia, Inter headings, Public Sans explanations, tabular figures, white editorial working surfaces, red actions and square scientific panels. Preserve the landing laboratory at ?view=landing and the workbench/analysis below the scene.

Default Flight starts on a coastal Earth pad. In ascent/insertion below 450 km, an Earth-local camera uses actual altitude, radial angle, heading and attached stage. The generated launch photo is 1672 × 941px with a measured 65.6% horizon; proportional cover placement fills the scene without a hard photo/sky seam. Separately drawn support/booster/upper-stage geometry reflects the actual stack. The pad co-rotates with Earth; the camera follows the spacecraft. Clouds and landscape fade by 12 km, sky darkens, photographic Earth curvature appears, and the local projection blends into the existing orbital scene between 120 and 450 km. View changes never replace the numerical state.

The orbital scene follows a recognizable white/silver rocket with NASA Earth/Moon globes, a local starfield and small illustrative Saturn/Jupiter. Flight artwork is enhanced; scenery planets add no numerical forces. Active fueled thrust alone produces exhaust while running. Pause, coast, fuel exhaustion and terminal contact show no flame.

Orbital map shares the mission/Canvas and retains physical distances, enlarged artwork, selectable spacecraft/Earth/Moon camera, green traveled history, optional dashed amber engine-off forecast, closest approach, zoom and Overview. Keep legend, units, caption and scale disclaimer. Map hides duplicate in-scene readouts; HTML telemetry stays visible. Its scale note reads “Distances to scale · artwork enlarged” and sits 72px above the bottom to clear the distance bar.

## Composition and responsive behavior

The shell is capped at 1440px. Desktop places the sticky clock/run strip above the mode/camera toolbar and a 620px scene (480px minimum), with controls in a 318px rail (280px at 1100px); telemetry, physics, vehicle setup, reports, charts and guide follow. Telemetry uses four columns, two below 1100px. At 760px and below, stack scene, notice, telemetry and outer controls; the scene is 560px high and the strip wraps with equal-width run actions.

Presentation uses the same stage at 100vw × 100dvh. Its scrollable panel is 280px wide and begins at 110px. On phones its width is min(280px, 100% - 32px), maximum height max(100px, 50% - 175px); at 390 × 844px its lower edge is 357px. At heights ≤550px, use the existing 85px top and 100% - 170px height limit. The ascent camera places the ship at 43% width on desktop, 64% on phones, with an altitude-dependent rise; open phone controls reserve nose clearance. The ground sits 160px above the bottom on desktop, 220px on phones.

The atmosphere badge uses existing opaque navy material at top 90px/left 24px with 14px layer text and 10px supplementary copy. With phone presentation controls open, it begins at 74px/left 16px, uses 6px 10px padding and hides the supplementary line; its 105.6px lower edge clears the 110px controls panel. Full stage/vertical-speed data remain in HTML. Earth-ascent readouts also use navy backing for contrast against the bright photo. Keep wrapping toolbar actions at 48px minimum and supplementary readouts above them.

## Default journey and controls

The page opens paused at t=0 on Earth launch → Moon, with Automatic mission guidance enabled and requested 10,000× warp. Launch mission begins real thrust and propellant flow; guidance climbs through atmosphere, builds sideways speed for approximately 400km orbit, separates stages, performs the actual 450s departure burn, coasts, brakes and lands. The initial stack is 553,000kg, including 516,000kg attached propellant. Stage changes discard specified dry/residual mass without changing position, velocity or time. Lunar contact uses the actual integrated arrival.

Load start explicitly selects Earth launch → Moon, Moon landing · post-departure, Moon flyby · coast or Earth orbit · practice. Shorter lunar starts disclose their completed 450s departure burn. Practice begins in circular LEO at 1×; remaining near Earth is expected without departure. Start Moon mission and presentation Restart Moon mission archive a meaningful current recording, reset to a fresh Earth launch and start it. Ordinary Pause/Resume operates the current journey.

Native guidance checkboxes synchronize both rails. While enabled, manual engine/throttle/heading and direction controls are disabled and show the actual command. Switching guidance off retains heading and turns the manual engine off. Manual operation can fail. Active vehicle labels show the current stage, attached dry mass, stage-configuration fuel, thrust and Isp. Current remaining fuel is separate. Ideal staged delta-v assumes all attached propellant can be burned; insertion can discard upper-stage reserve.

Requested warp is bounded by phase: guided lower ascent below 10km permits up to 5×, below 200km 20×, higher insertion 50×, departure 100×; lunar/coast limits then follow the existing guidance safety rules. Ascent and close lunar guidance steps are ≤0.25s, with fuel/burn-end splits. Effective rate is visible beside the requested select.

## Atmosphere and scientific limits

Layer labels follow actual altitude using approximate thresholds: troposphere <12km, stratosphere 12–50km, mesosphere 50–85km, thermosphere 85–600km, exosphere >600km. The 100km conventional space boundary lies inside the thermosphere, and the upper atmosphere continues above it. The badge names the layer and, when space permits, active stage, Earth vertical speed and crossing of 100km. Camera scenery is illustrative.

This is planar point-mass translation with ideal engines and direct attitude control, a prescribed circular Moon and instantaneous staging. Drag uses rho=1.225 exp(-h/8500), CdA=15m² and atmosphere rotating with Earth. It acts on the active configuration throughout the launch journey and fades continuously with density. It is not a temperature/chemistry layer model. Winds, heating, torque and detailed launch aerodynamics are omitted. The live forces panel shows free-flight gravity/thrust/drag; the pad supplies support before lift-off. Sources and approved model are recorded in docs/superpowers/specs/2026-10-19-earth-launch-design.md.

## Lunar surface and reporting

Below 2km Moon altitude, Flight switches to the existing illustrative regolith projection at actual altitude and attitude. Mechanical feet meet the calculated point-contact plane. Normal surface anchors remain 45% width/76% height on desktop, 64%/73% on phones. Safe swept contact requires absolute vertical speed ≤2m/s, sideways speed ≤1m/s and tilt ≤10°. Hard contact remains an impact. Successful contact pauses and saves, with incoming speed evidence retained separately from the resting Moon-relative state. Text-supported green outcome semantics apply to landing and flyby.

Launch telemetry includes actual attached mass/fuel, phase/stage, Earth radial/tangential speeds, atmosphere layer, density and dynamic pressure. CSV/Markdown retain initial stack, stage constants, separation times/discarded mass and drag assumptions. Fuel used excludes explicitly discarded propellant; the report shows discarded fuel and stage dry mass separately. Measured contact adds incoming vertical/sideways speed, tilt and remaining fuel. Old saved flyby/landing records stay compatible.

The engine-off forecast is unavailable during ascent/departure; after departure it excludes future guidance burns and is not a powered landing forecast. It stops at successful contact. Charts remain Earth-centered, and their speed differs from Moon-relative descent/contact speed. Moving-Moon gravity, mass changes and propellant exchanges make energy time-dependent. Keep accessible chart labels, explicit units, numerical tables and the independently scaled trajectory-axis caveat.

## Presentation and motion contract

Enter fullscreen requests native fullscreen; Expand view provides fixed in-page presentation and fallback if native fullscreen is unavailable. Entry temporarily selects Flight, spacecraft follow and default zoom. Exit restores prior view/camera/zoom, focus and scrolling. Time, fuel, pause state, commands, Canvas identity and recording persist through views/resizes.

Hide controls removes secondary panel/readouts while pause/resume and exit remain reachable. Terminal outcome remains visible; completed missions disable run and retain reports/reset. P pauses/resumes, F switches presentation, H toggles controls, Escape exits; shortcuts ignore form editing/modifiers. Tab/Shift+Tab stay among visible enabled stage controls. Entry focuses pause or exit; exit focuses Enter fullscreen. White scene and blue editorial focus rings remain visible. Browser backgrounding pauses simulation.

Displayed heading takes the shortest bounded turn; wall-frame time clamps to 0–0.1s with exponential easing. Log-space zoom and bounded camera-switch offsets leave the physical target following immediately. Reduced motion bypasses cosmetic easing and ambient drift. Camera/photo/sky transitions do not modify physics or manufacture orbit insertion/contact.

## Evidence, attribution and remaining work

Six local flight assets: generated coastal launch landscape, lunar regolith, transparent rocket and starfield; NASA Apollo 17 Blue Marble Earth and NASA/GSFC/Arizona State University LRO-data lunar globe. Retain independent-project/non-affiliation text and credits. Origins, prompts and measured geometry: docs/flight-assets.md, docs/earth-launch-asset.md and docs/lunar-surface-asset.md; public credits: public/flight/credits.md.

The implemented launch design is docs/superpowers/specs/2026-10-19-earth-launch-design.md. Final root verification reports 113 tests and production build passing, with independent numerical/data review approving shipment after its findings were fixed. Numerical pad-to-contact validation reaches t≈225,096.698s, ≈411.018kg fuel and incoming vertical speed ≈−0.298313m/s. Separately, the actual continuous production-browser pad-to-contact run reached clock 2d 14:31:34, incoming vertical speed −0.297m/s, sideways speed 0.000m/s, tilt 0.001° and 411.0kg fuel, then automatically paused and saved. The report showed initial mass 553,000kg, about 511,034kg burned propellant, 4,554.9kg discarded residual propellant and 33,000kg discarded stage dry mass.

Production-browser checks captured first-stage ascent at 8.334km and upper-stage ascent at 399km in the thermosphere. Paused ascent clock 00:06:01, altitude 176km and fuel 63,531kg stayed identical through Flight → Map → Flight, expanded-view exit and native fullscreen entry at 1536 × 864; hiding controls and resume were exercised. Corrected desktop/phone pad captures show grounded stack, landscape and badge/panel clearance. Evidence: docs/earth-launch-validation.txt and docs/screenshots/earth-launch-{desktop-pad-final,phone-pad-final,lift-off,upper-atmosphere-native,moon-landed-clean,whole-journey-map}.jpg. These observations do not claim school-hardware or later phone/result checks.

Historical 2026-10-19 checkpoints independently demonstrated a browser flyby at 2d10:17:58 and the shorter post-departure lunar landing at 2d13:58:16, about 415kg fuel. The earlier landing numerical reviewer completed 16 focused checks before usage limits prevented its final UI/data verdict; do not reinterpret that historical result as the new launch review. Local earlier high-refresh rAF samples were short browser callback measurements, not classroom FPS guarantees.

School-laptop/projector/offline rehearsal, student interpretation/contributions/reflection and final submission remain team work. This extension does not finish the entire assignment or authorize capture, Mars, 3D, sound or backend work.
