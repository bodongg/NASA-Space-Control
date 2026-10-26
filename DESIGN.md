---
name: "Rocket Landing: Mission Control"
description: "NASA-inspired photographic editorial framing for an independent student physics lab."
colors:
  space: "#000000"
  panel: "#ffffff"
  line: "#d8d8d8"
  ink: "#17171b"
  muted: "#57575d"
  data: "#154cb8"
  nominal: "#1b6843"
  caution: "#8c4a09"
  critical: "#b6271c"
  action: "#d53227"
  action-hover: "#b72b20"
  vector-surface: "#101014"
  soft-surface: "#f4f4f6"
  focus: "#3379f4"
  vector-nominal: "#a4e0bd"
  vector-caution: "#f5c181"
  weight-vector: "#f36d5b"
  flyby-surface: "#eaf4ee"
  flyby-ink: "#155435"
  failure-surface: "#fbece9"
  failure-ink: "#8a2119"
  flight-panel: "#08111ff5"
  flight-panel-base: "#08111f"
  flight-control: "#142238"
  flight-toolbar: "#0b1425"
  flight-hover: "#26364c"
  flight-panel-line: "#506078"
  flight-control-line: "#7b8da5"
  flight-toolbar-line: "#8493a8"
  flight-label: "#d4dde8"
  flight-caption: "#e1e8ee"
  flight-limit: "#c3cfdd"
  flight-action-hover: "#ab261d"
  flight-slider-accent: "#ef5549"
  flight-outcome: "#12442d"
typography:
  display:
    fontFamily: "Inter, Public Sans, sans-serif"
    fontSize: "clamp(56px, 6.7vw, 88px)"
    fontWeight: 700
    lineHeight: 1.015
    letterSpacing: "-.04em"
  headline:
    fontFamily: "Inter, Public Sans, sans-serif"
    fontSize: "clamp(32px, 3.2vw, 46px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-.035em"
  title:
    fontFamily: "Inter, Public Sans, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-.025em"
  body:
    fontFamily: "Public Sans, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Public Sans, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  measurement:
    fontFamily: "Inter, Public Sans, sans-serif"
    fontSize: "clamp(30px, 3.5vw, 48px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-.04em"
  technical:
    fontFamily: "JetBrains Mono, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.75
  flight-title:
    fontFamily: "Inter, Public Sans, sans-serif"
    fontSize: "clamp(36px, 4vw, 52px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-.035em"
  flight-measurement:
    fontFamily: "Inter, Public Sans, sans-serif"
    fontSize: "clamp(22px, 2.25vw, 31px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-.025em"
  mission-clock:
    fontFamily: "JetBrains Mono, Consolas, monospace"
    fontSize: "18px"
    fontWeight: 400
  flight-detail:
    fontFamily: "Public Sans, Arial, sans-serif"
    fontSize: "9px"
  flight-label:
    fontFamily: "Public Sans, Arial, sans-serif"
    fontSize: "10px"
  flight-caption:
    fontFamily: "Public Sans, Arial, sans-serif"
    fontSize: "11px"
  flight-control:
    fontFamily: "Public Sans, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 700
  flight-value-phone:
    fontFamily: "JetBrains Mono, Consolas, monospace"
    fontSize: "14px"
    fontWeight: 500
  flight-heading-phone:
    fontFamily: "Inter, Public Sans, sans-serif"
    fontSize: "18px"
    fontWeight: 700
  flight-value:
    fontFamily: "JetBrains Mono, Consolas, monospace"
    fontSize: "19px"
    fontWeight: 500
  flight-heading:
    fontFamily: "Inter, Public Sans, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-.025em"
rounded:
  square: "0"
  circular: "50%"
spacing:
  small: "10px"
  medium: "24px"
  large: "28px"
  workspace: "44px"
components:
  button-primary:
    backgroundColor: "{colors.action}"
    textColor: "{colors.panel}"
    rounded: "{rounded.square}"
    padding: "12px 19px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-primary-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "12px 19px"
    height: "48px"
  select:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "12px"
    height: "48px"
    width: "100%"
  vector-panel:
    backgroundColor: "{colors.vector-surface}"
    textColor: "{colors.panel}"
    rounded: "{rounded.square}"
    padding: "27px 30px"
  readout:
    textColor: "{colors.data}"
    typography: "{typography.measurement}"
  flight-readout:
    textColor: "{colors.ink}"
    typography: "{typography.flight-measurement}"
  mission-notice:
    backgroundColor: "{colors.soft-surface}"
    rounded: "{rounded.square}"
    padding: "15px 18px"
  mission-notice-flyby:
    backgroundColor: "{colors.flyby-surface}"
    textColor: "{colors.flyby-ink}"
  mission-notice-failure:
    backgroundColor: "{colors.failure-surface}"
    textColor: "{colors.failure-ink}"
  flight-toolbar-button:
    backgroundColor: "{colors.flight-toolbar}"
    textColor: "{colors.panel}"
    typography: "{typography.flight-control}"
    rounded: "{rounded.square}"
    padding: "11px 15px"
    height: "48px"
  flight-controls-panel:
    backgroundColor: "{colors.flight-panel}"
    textColor: "{colors.panel}"
    rounded: "{rounded.square}"
    padding: "20px"
    width: "280px"
---
# Design System: Rocket Landing: Mission Control

## Overview

**Creative North Star: "NASA photographic editorial lab"**

NASA’s photographic editorial language frames an independent classroom physics lab. A black masthead centers the official insignia; a large white headline sits beside the Apollo 11 lunar module photograph. The working area shifts to white, with red actions, dark text, and a dark force diagram.

Public Sans explanations, bold Inter headings and measurements, and restrained monospaced technical annotations keep the preflight check readable. The footer explicitly identifies the student project as unaffiliated with and not endorsed by NASA, and links to the reference and photograph credit.


The default Earth–Moon surface begins on a coastal Earth launch pad, rises through a blue atmosphere into space, and continues to a calculated lunar landing. It extends the same world with a spacecraft-following photographic flight scene: a recognizable white/silver rocket, NASA Earth and Moon globes, a restrained starfield, and distant illustrative planets. White editorial controls, scientific telemetry, and the physical orbital map remain paired with the scene. Presentation expands the same Canvas and mission. The Apollo 11 hero and preflight laboratory remain at ?view=landing; the flight contract is docs/surfaces/orbital-flight.md.

**Key Characteristics:**

- Black masthead and photographic Apollo 11 hero.
- White laboratory surfaces with red actions.
- Bold Inter hierarchy with Public Sans explanations and local font assets.
- Dark force diagram with white thrust and coral weight vectors.
- Dark blue, green, and amber readouts with explicit labels and units.
- Photographic flight subjects with a quiet navy presentation overlay and a separate physical map.
- A calculated launch scene whose sky, clouds, curvature and vehicle stages follow actual altitude and mission state.


## Colors

Red identifies actions; the scientific readings use a separate dark semantic palette against white.

### Primary

- **Action Red:** primary buttons and the hero controls link; the deeper action tone appears on hover.
- **Critical Red:** the critical semantic token, separate from the action treatment.

### Secondary

- **Data Blue:** ordinary live readouts.
- **Nominal Green:** measurements or statuses meeting their defined condition.
- **Caution Amber:** below-hover or downward-acceleration readings.
- **Light Diagram Green / Amber:** high-contrast status variants inside the dark force panel.
- **Coral Weight:** weight vector and its legend; thrust is white in this diagram.
- **Light Diagram Green:** also identifies the orbital traveled path and visible map legend.
- **Flyby Surface / Ink:** pale green and dark green pair for successful flyby notices.
- **Failure Surface / Ink:** pale red and dark red pair for impact, lost, and computational error notices.

### Neutral

- **Space Black:** masthead, hero backdrop, and footer.
- **Panel White:** laboratory background and text on dark surfaces.
- **Ink:** primary text, slider handles, and structural rules.
- **Muted:** labels, explanations, and units.
- **Line:** thin laboratory separators.
- **Vector Surface:** dark force panel.
- **Soft Surface:** equation strip and explanatory section.
- **Focus Blue:** visible keyboard focus on white editorial surfaces; scene controls use a white focus outline.
- **Flight Panel / Panel Base:** near-black navy overlay; the panel uses its alpha-bearing token over the scene.
- **Flight Control / Toolbar / Hover:** deep navy control surfaces with a lighter hover step.
- **Flight Panel Line / Control Line / Toolbar Line:** three slate outline strengths for overlay structure and interaction.
- **Flight Label / Caption / Limit:** pale slate text for readout labels, scene identity, and slider limits.
- **Flight Action Hover / Slider Accent / Outcome:** context-specific red hover, range accent, and deep green result surface.

The flight navy ramp records the actual presentation CSS, including #08111f, #142238, #0b1425, #26364c, #506078, #7b8da5, #8493a8, #d4dde8, #e1e8ee, and #c3cfdd. These are intentional scene materials; white editorial surfaces remain the surrounding visual frame.

**The Text With Tone Rule.** Status lights and readouts pair semantic color with visible text or numbers; color never carries the meaning alone.

## Typography

**Display Font:** Inter, with Public Sans and sans-serif fallbacks.  
**Body Font:** Public Sans, with Arial and sans-serif fallbacks.  
**Technical Font:** JetBrains Mono, with Consolas and monospace fallbacks.

All four font files are local: Inter Bold, Public Sans Regular, Public Sans Bold, and JetBrains Mono Regular under `public/fonts/`. Headings and large readouts are bold Inter; measurements are tabular numerals, not monospaced display figures. Technical outputs, equations, and vector annotations use the regular mono face.

### Hierarchy

- **Display:** two-line photographic hero title; desktop maximum (88px), intermediate layout (68px), phone (52px).
- **Headline:** lab and model section headings; phone section titles (33px).
- **Title:** panel headings; phone (21px).
- **Body:** laboratory introduction; hero description is larger (17px) and phone hero text is smaller (14px).
- **Label:** instrument labels; phone instrument labels (10px).
- **Measurement:** large tabular figures with separate units; intermediate (36px), phone (37px).
- **Technical:** equation and numeric annotations; equation phone size (10px).
- **Flight title:** compact Inter heading above the map; phone override (39px).
- **Flight measurement:** ink tabular orbital telemetry with explicit units (10px); compact and phone override (29px). Critical fuel uses Critical Red.
- **Mission clock:** regular mono tabular elapsed time; compact (16px), phone (15px).

The scene uses a compact, source-derived type scale: Public Sans detail (9px) on phones; labels and limits (10px); identity/loading copy and panel help (11px); controls and fields (12px); mono readouts on phones (14px), compact desktop (16px), and full scene (19px). Inter phase headings use (21px), reducing to (18px) on phones; the overlay controls heading uses Inter (19px). Phone scale notes and labels are supplementary: the full HTML telemetry, units, and explanations remain below the scene.

Orbital introductions use Public Sans (14px, line-height 1.7), phone (13px). Instrument labels use (10px, line-height 1.5). Flight controls headings use Inter (23px, line-height 1.2), phone (27px). Guide headings use Inter (34px), phone (30px); guide body uses Public Sans (13px, line-height 1.85).

**The Explicit Units Rule.** Keep units next to their measurements and retain separate explanatory labels.

## Layout

The preserved landing page shell is capped at (1320px), with total desktop side allowance (96px). At widths up to (1000px), total side allowance is (56px); at (600px), it is (40px). The masthead uses three columns (1fr auto 1fr), centering the local NASA insignia; desktop masthead height is (96px), phone (82px).

The desktop hero has a minimum height of (630px), a left-aligned headline, and an image occupying the right (66%). Its dark directional gradient preserves text contrast. Between (601px) and (1000px), the photograph uses width (58%) and object position (0% 48%) to keep the lunar module clear of the headline. At (600px) and below, the hero becomes (690px) minimum height: the image moves beneath the text, spans the width, is (350px) tall, and uses object position (50% 35%). Photo credit remains visible.

The laboratory uses controls and force diagram columns (0.8fr / 1.45fr), with (44px) gaps. The response section spans both columns. At (1000px), columns tighten and gaps become (30px). At (820px), panels stack and controls briefly use two internal columns; below (600px), controls return to one column. Four readouts become two columns at (820px). Model and footer sections become one column at (600px). Preserve explicit units and readable vector labels at each size.

### Orbital flight surface

The default route follows docs/surfaces/orbital-flight.md. Its shell is capped at (1440px) with total side allowance (80px). The introduction uses vertical padding (40px 32px). A heavy ink rule (3px) starts the workspace: flexible map column, fixed controls rail (318px), thin divider (1px) and matching gutters (28px). The full-width white mission strip stays sticky at top (0, z-index 3), pairing clock/state with run/reset actions. A wrapping mode/camera/zoom toolbar (minimum 66px) sits above the shared flight stage (620px high, minimum 480px). Flight is the default mode and follows the spacecraft; Map retains the physical overview and selectable body camera. Caption, mission notice, and telemetry in four columns follow; launch adds Earth vertical speed and dynamic pressure. Telemetry cells use thin top rules; controls use a vertical gap (25px). The operating guide uses two columns with gap (70px).

At (1100px) and below: total side allowance (48px), controls rail (280px), gutters (20px), two telemetry columns, hidden introduction guide shortcut. At (760px) and below: total side allowance (32px), a two-row sticky mission strip with equal-width run buttons, and flight-stage height (560px). The shared stage overrides the underlying map-only Canvas height (365px). Content stacks map, notice, telemetry, then controls. Controls start below a heavy rule, starting-point select and Load start share a row, and guide/footer become one column. Shared masthead phone rules still apply at (600px).

Presentation fills the viewport with the same stage (100vw by 100dvh). Enter fullscreen requests native fullscreen; Expand view explicitly enters the same fixed in-page presentation, which also remains the fallback if native fullscreen is denied. The secondary panel is right-aligned (280px wide), begins at (110px), and scrolls within its maximum height. At (760px) and below it starts at (110px), uses width min(280px, 100% - 32px), and max-height max(100px, 50% - 175px). At a (390 × 844px) viewport it ends at (357px), above the scene center (422px), preserving the ship. Short viewports (550px high or less) use a top (85px) and height allowance (100% - 170px).

Pause/resume, mode, controls toggle and exit actions form a wrapping bottom toolbar with (48px) minimum targets. The panel and secondary scene readouts can hide while pause and exit stay visible. Phone readouts sit above the toolbar. During Earth ascent they use the existing opaque navy panel material for contrast against the bright landscape. The atmosphere badge begins at (90px) on desktop. With phone presentation controls open, it begins at (74px), uses compact padding (6px 10px), and hides its supplementary stage/vertical-speed line; its lower edge (105.6px) clears the panel beginning at (110px). Full stage and numerical information remain available in HTML telemetry.

**The Map With Measurements Rule.** Keep the orbital map paired with HTML telemetry and the visible distance-scale disclaimer.

## Elevation & Depth

Depth comes from photographic hero/flight artwork, restrained scene gradients, and transitions between black, white, dark diagram and soft gray surfaces. No box shadows are used. Thin separators and heavier top rules organize the lab. Scene readouts use black text shadows for contrast over imagery; the translucent navy control panel uses a thin slate border.

**The Flat Surface Rule.** Use surface contrast and thin dividers for hierarchy; the shipped system has no box shadows.

## Shapes

Controls, panels, and action links have square corners. Thin neutral borders frame the native select and secondary action. Sliders use a thin track and round ink handle with a white border. Status dots are circular; the scientific diagram uses authored SVG axes, vectors, and markers.

## Components

### Buttons

Square Public Sans bold controls with a minimum height (48px). Primary actions are red with white text, deepen on hover, and turn ink when the thrust toggle is pressed; its visible label changes to “Disable thrust.” Secondary actions are transparent with a neutral outline and a soft gray hover surface. Disabled controls use opacity (.5). Keyboard focus uses a (3px) blue outline with offset (5px).

### Inputs / Fields

The landing environment is a visibly labelled native select: white background, square neutral border, full width. Native range inputs remain keyboard operable and touch targets are (24px) tall; the visual track is (3px), the handle is round. Show the current value and both limits. Control headings are bold; numeric command output uses the local mono face.

### Navigation

The black masthead places the project name on the left, the unchanged official NASA insignia in the center, and compact bold links on the right. Links underline on hover. On phones the first navigation link hides, preserving the project name, logo, and physics link. Directional arrows are inline SVG paths, with rotation used for direction.

### Cards / Containers

Laboratory sections remain open white surfaces with thin dividing rules and heavier ink top rules. The force panel is a square dark surface with internal gray dividers, light text, and no shadow. The equation strip is a soft gray horizontal grouping that stacks at (1000px).

### Measurement Readout

A description-list label sits above a bold Inter figure, with muted unit aligned at its baseline. Separate columns use thin dividers. Data, nominal, and caution tones describe their current physics state. Keep tabular numerals and explicit units.

### Force Diagram, Gauge, and Status

The force panel shows a white thrust vector and coral weight vector on dashed gray axes. A local mono mass annotation accompanies the center point. Its legend moves above the SVG on phones to preserve legibility. The engine gauge is a thin track (4px) with a transform-scaled fill; white is the ordinary data tone on the dark panel. Status dots repeat visible status text, with light green and amber variants for the dark background.

### Orbital Map, Mission Strip, and Controls

One Canvas switches between Flight view and Orbital map. During ascent and orbit insertion below (450km), Flight uses an Earth-local projection with a coastal launch plate, blue-to-black sky, fading cloud-bearing landscape and curved photographic Earth. Between (120km) and (450km), that projection blends into the existing orbital world. Its illustrative camera uses the actual altitude, radial angle and commanded heading; the co-rotating launch pad moves relative to the spacecraft. The attached booster body and upper stage change geometry at actual separation. Flight then uses the photographic rocket at its simulated position, NASA Earth/Moon globe imagery, and the local dark background with distant illustrative Saturn/Jupiter. Its adaptive camera follows the spacecraft, placing the ship around (60% width, 50% height). Map keeps physical distances and the green traveled path, optional dashed amber forecast, visible legend, body camera select, inline-SVG zoom actions, and Overview; body/rocket artwork is enlarged for visibility. Caption and scale note explain enhanced artwork and illustrative scenery. Map hides duplicate in-scene readouts while retaining the outside HTML telemetry; its scale note reads “Distances to scale · artwork enlarged” and sits 72px above the bottom to clear the physical distance bar. Flight view retains its existing readouts and scale-note layout. Canvas has a descriptive accessible label and keyboard focus; precise measurements remain in the HTML description list.

The engine flame appears only during running, fueled thrust; coast, pause and exhausted fuel show no exhaust. Loading/failure text reports missing imagery. Phase, clock, speed, Moon altitude, fuel and terminal outcome are HTML overlays. The forecast remains a Map aid and is hidden from the Flight legend.

The run action uses the shared red primary variant; Reset uses the outlined secondary. Terminal outcomes disable the run action and label it “Flight complete”; Reset remains available. The mono clock and bold Public Sans mission state share a thin divider. The orbital engine toggle is outlined at rest and red when pressed; prograde/retrograde buttons turn ink when pressed. Shared focus outlines and disabled opacity (.5) still apply. Native labelled selects and ranges retain their visible values, limits, and nearby explanatory text.

### Orbital Mission Notice

A square soft surface with minimum height (64px), text (12px, line-height 1.7), and padding from its token carries a polite live result. Flyby uses the pale green/dark green pair; impact, lost, and error use pale red/dark red. Success text states “Flyby objective complete; flight paused.” On phones, padding becomes (13px 15px), text (11px). Keep explicit outcome text, the selected starting-point explanation, stage and atmosphere labels, warp limit explanation, and guidance/manual heading text. Earth launch is the default; shorter landing and flyby starts explicitly disclose their completed departure burn.

### Mission workbench and scientific analysis (checkpoint 3)

The shipped workbench extends the orbital flight surface with live physics, vehicle setup, a flight report, and scientific Chart.js panels. Sources are `src/mission-workbench.css`, `src/analysis.css`, `src/charts.js`, and `src/ui/MissionWorkbench.js`. Checkpoint 4 now adds the photographic flight stage and presentation controls; the implemented contract supersedes the older planning-only artwork brief.

Sections open with a heavy ink rule (3px), generous vertical padding (33px 40px), and bold Inter headings (29–38px). The physics explanation and soft gray calculation block use two columns (0.8fr / 1.2fr, 70px gap). Equations and live force values use JetBrains Mono, with a two-column description list and explicit acceleration units. The launch calculation includes atmospheric drag separately from gravity and thrust; the explanatory copy distinguishes free-flight acceleration from pad support before lift-off. The vehicle form reuses four labelled native sliders, a blue ideal delta-v figure, and the red “Apply to new LEO flight” action with its qualified departure reference. Vehicle sliders become two columns at (1000px); physics and vehicle controls stack at (760px).

The engine-off forecast uses a labelled checkbox and outlined refresh action (40px minimum height) above the map, followed by snapshot time, the 72-hour horizon, projected approach, and the reminder that burns change the estimate. Dashed light amber identifies the forecast on the dark map; green identifies traveled history. Preserve both the legend and explanatory text, including pending, hidden, and failure states.

The inline report uses labelled tabular summary figures in three columns, reducing to two at (760px). Launch adds discarded unburned propellant and discarded stage dry mass; measured contact adds incoming vertical speed, sideways speed, tilt and remaining fuel. Segment fuel used excludes discarded residual propellant. Launch CSV and Markdown exports identify active stage, phase, atmosphere, initial stack, separation events and drag assumptions. Ideal staged delta-v assumes every attached stage burns all remaining propellant; actual insertion may discard upper-stage reserve. Save run is red; CSV and report downloads are outlined. Actions wrap, and on phones share available width with a (140px) basis. A labelled native select (520px maximum width) chooses a saved comparison; status text explains browser storage and differences between starts. Outcome text carries success or failure tone alongside its explicit label.

Scientific charts sit on flat white figures with thin top dividers: speed and energy share two columns, and the recorded trajectory spans the width. At (900px) they become one column. Plot heights are (300px), trajectory (380px); at (600px), these become (285px) and (340px). Titles use Inter (21px), captions use muted Public Sans, and axes retain names and units. Two-pixel straight lines have no fill or animation; a single starting sample is a visible dot. Blue represents speed/kinetic energy, amber potential, ink total energy, and green the current path. Dashed red overlays identify saved runs aligned to their own elapsed start. Bottom legends and explanatory captions carry the meaning alongside color.

**The Scientific Evidence Rule.** Pair chart canvases with descriptive accessible labels, visible units, and the keyboard-focusable numerical start/latest table. Preserve the trajectory caption explaining independently scaled axes and the energy caption explaining the moving Moon and changing fuel mass. Forecast and recorded travel remain visibly distinguished.

### Flight Presentation

The stage is the presentation surface; entry and exit never recreate the Canvas or mission record. Entry temporarily selects Flight, spacecraft follow and default zoom; exit restores prior view/camera/zoom. Pause state, throttle, fuel and mission time are preserved across the transition. In-scene engine, throttle, manual heading, prograde/retrograde and warp controls share the outer rail state. The page opens paused at mission time zero on Earth launch → Moon with Automatic mission guidance enabled and requested (10,000×) warp. Launch mission begins actual thrust, fuel use and a calculated ascent through atmospheric layers, insertion near (400km), stage separation, an actual (450s) lunar departure burn, coast, braking and powered descent. Effective warp is bounded by phase and altitude: the pad/lower ascent starts at up to (5×). The primary action then becomes Pause flight / Resume flight. Moon landing · post-departure, Moon flyby · coast and Earth orbit · practice remain explicit shorter starts. Start Moon mission on the normal page and Restart Moon mission in presentation archive the current meaningful workbench segment and start a fresh Earth launch. Their reset is deliberate; ordinary view/camera/presentation transitions preserve the running mission.

P pauses/resumes, F enters/exits presentation, H hides/shows secondary controls, and Escape exits. Shortcuts ignore form editing and modifiers. Tab and Shift+Tab cycle through visible enabled controls inside the stage during presentation. Entry focuses pause or exit; exit restores focus to Enter fullscreen and body scrolling. Hide controls keeps pause/resume and exit reachable; terminal phase remains visible; the outcome banner appears when secondary controls hide, avoiding overlap with the open panel. White (3px) focus rings distinguish scene controls.

Renderer motion is cosmetic: elapsed wall time is clamped to (0–0.1s), easing is 1 - exp(-10 × wallDt), and displayed rocket heading takes the shortest turn with a bounded angular step. Zoom eases in log space, bounded around target scale; camera changes use bounded decaying offsets while physical target motion follows immediately. A clearance bound protects the visible body/ship relationship. Reduced motion bypasses heading/camera easing and ambient drift. Display values do not change the numerical model.

### Guided lunar landing

Native checkbox guidance appears in both rails; while on, engine, throttle and heading controls display actual commands and disable manual editing. Switching guidance off retains heading and turns the manual engine off. Labels explain the override. Near-surface speed and altitude use m/s and meters; terminal speed is explicitly incoming contact speed. Extra HTML telemetry resolves signed Moon-relative vertical and sideways motion.

At ≤2km Moon altitude, Flight switches projection to a local surface without changing the integrated state. Regolith artwork has a (64.2%) source horizon, cropped proportionally above the contact plane. Altitude controls foot clearance, actual local attitude controls orientation, and fueled active thrust controls exhaust. At contact, visible mechanical feet meet the illustrative plane; terminal pause removes the flame. The picture uses a physical point-contact model. The map keeps its orbital geometry.

The normal surface composition anchors the rocket around (45% width), (64%) on phones, with ground at (76% height), (73%) on phones. Phone open-panel clearance protects the rocket nose. The scene uses the existing Light Diagram Green for terminal heading/contact confirmation and the existing bold (12px) guidance label. Surface asset provenance is in docs/lunar-surface-asset.md.

### Atmospheric teaching labels

The navy atmosphere badge follows actual altitude: troposphere below (12km), stratosphere (12–50km), mesosphere (50–85km), thermosphere (85–600km), exosphere above (600km). These are approximate educational boundaries. The (100km) conventional space boundary is explicitly inside the thermosphere; it does not mark an end to the atmosphere. The landscape and clouds fade away by (12km), while the calculated exponential drag density approaches zero with altitude. Keep these labels distinct from measured density and dynamic pressure.

### Assets and Attribution

Use local `/images/nasa-logo.svg` unchanged and local `/images/tranquility-base.jpg`. The hero identifies the Apollo 11 photograph as NASA / Neil Armstrong; footer links provide reference and photo credit. Retain the explicit statement: “An independent Physics 1 student simulation inspired by NASA. This project is not affiliated with or endorsed by NASA.”

Six flight assets are local: /flight/rocket.png, /flight/space.png, /flight/earth.jpg, /flight/moon.jpg, /flight/lunar-surface.png and /flight/earth-launch.png. The generated coastal launch image is illustrative scenery, measured at (1672 × 941px) with its horizon at (65.6%); proportional cover placement fills the scene without a hard photo/sky seam. It contains no rocket: the model supplies the moving stack and support. Its exact prompt and provenance are in docs/earth-launch-asset.md. Rocket and starfield are generated originals; Earth is Apollo 17 Blue Marble (NASA Johnson Space Center), and Moon is an LRO-data near-side globe (NASA/GSFC/Arizona State University). Full origins, source URLs, prompts, dimensions and inspection notes live in docs/flight-assets.md; public credits live in public/flight/credits.md. Scenery planets are decorative and do not add physical bodies.

Button color changes take (.15s); gauge changes take (.18s ease-out). Reduced-motion preference disables smooth scrolling and shortens transitions to (.01ms).

## Do's and Don'ts

### Do:

- **Do** preserve the centered official insignia and visible NASA asset credits.
- **Do** keep the independent student project and NASA non-affiliation disclaimer.
- **Do** use Inter for bold headings and readout figures, Public Sans for explanations, and JetBrains Mono for technical annotations.
- **Do** pair every measurement with its label and unit, and status color with visible text.
- **Do** preserve the responsive image crop and stacking rules when extending this page.
- **Do** author directional icons as inline SVG paths.
- **Do** preserve recognizable photographic flight subjects, scale caveats and accessible presentation controls.
- **Do** keep camera/orientation easing separate from physical state and respect reduced motion.

### Don't:

- **Don't** restore the superseded cyan HUD palette or decorative corner brackets.
- **Don't** alter the NASA insignia or imply NASA affiliation or endorsement.
- **Don't** replace local fonts or images with remote runtime dependencies.
- **Don't** use text glyphs as directional icons or make status depend on color alone.
