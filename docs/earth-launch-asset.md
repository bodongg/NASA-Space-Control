# Earth launch landscape asset

Generated on 2026-10-19 for the calculated Earth → atmosphere → Moon mission.

- Shipping file: `public/flight/earth-launch.png`.
- Origin: generated original using Codex built-in `image_gen.imagegen`; this is illustrative launch-site scenery, not a NASA photograph or a depiction of a specific real facility.
- Source output: `C:\Users\Xander Calz\.codex\generated_images\01a1549a-3012-73e3-8059-88630e5a3f94\exec-2dceab66-877d-4b03-8c66-620d5a1ff165.png`.
- Output: 1672 × 941 px, opaque 24-bit RGB PNG, approximately 16:9. No resizing, crop or pixel edits were applied.
- Visual inspection: the low distant land/water horizon is at approximately y=617 px (65.6% from top); the concrete apron begins near y=650 px (69.1%). The generated coastline is lower than the requested 60% horizon; use the measured geometry when placing the moving scene.
- Wide center and right foreground are empty concrete; central 60% contains no rocket, spacecraft, person, tower, flag, logo or text. Small distant service structures stay near the extreme edges. Morning illumination comes from upper left.
- The code draws the rocket, launch support, thrust, and all moving mission elements separately. This asset adds no physical geometry, force, time, vehicle or celestial body.
- Exact prompt is also embedded in the PNG `impeccable:prompt` tEXt chunk by Impeccable `embed-prompt.mjs`.

## Exact generation prompt

```text
Use case: photorealistic-natural
Asset type: one opaque 16:9 landscape background plate for a classroom Earth-to-Moon rocket simulation, 2048x1152 preferred.
Primary request: An empty coastal space-launch site on a clear Florida-like morning, photographed realistically at eye level from a flat concrete launch apron.
Scene/backdrop: The upper 60 percent is quiet clear blue sky, slightly paler near the horizon, with only a few thin distant white clouds. A low flat coastline of marsh grass and calm blue coastal water crosses the image at exactly 60 percent down from the top. Tiny distant low service infrastructure may be confined to the extreme left and right edges near the horizon.
Composition/framing: Wide horizontal 16:9, level horizon. The lower 40 percent is a broad flat concrete launch apron in convincing perspective, unobstructed especially through the center and right foreground. The central 60 percent of the full image width must contain only sky, low coastline and empty concrete: this space is reserved for a separately rendered moving rocket and launch support. Subtle concrete expansion seams and fine material texture, no strong painted stripes. Distant vegetation only along the very low horizon. No close objects.
Style/medium: Credible natural color editorial landscape photography, NASA launch-site documentary atmosphere, realistic scale, real material textures, restrained saturation, no stylized science fiction.
Lighting/mood: Soft clear morning illumination coming from upper left, quiet anticipation, crisp but natural visibility.
Constraints: Landscape only; no rocket, spacecraft, people, text, lettering, logos, watermarks, flags, flames, smoke, launch gantry or tower anywhere. No building or tall object within the central 60 percent. No planets, Moon, stars or celestial objects visible in the daytime sky. No futuristic neon. No UI, frame or border. Opaque background.
```

Built-in options: `transparent_background: false`; no input reference image. One image was generated and accepted after inspection.
