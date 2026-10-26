# Lunar surface artwork

Created 2026-10-19 for the actual powered-descent flight camera.

- Asset: `public/flight/lunar-surface.png`
- Source: AI generated with the built-in OpenAI `image_gen.imagegen` tool, then one targeted image edit with the same tool. It is illustrative scenery, not a NASA photograph or a surveyed landing location.
- Format: opaque PNG, 1672 x 941 pixels (approximately 16:9).
- Composition: central horizon at y = 604 pixels (64.2% of height); sampled low ridges span approximately y = 593-607. Ground occupies the lower 36%; the upper field is black space.
- Materials: gray granular lunar regolith, small rocks and shallow craters, a broad open center, hard sunlight from upper left.
- Physics: the image has no physical length scale, collision data or surface elevation data. The renderer must position it against the simulation's computed ground line; the visual rocks and craters do not define collision geometry.
- Preparation: copied from the built-in tool's generated PNG without resizing, cropping, color changes or recompression. Impeccable's shipped `embed-prompt.mjs` embeds the exact final edit prompt as `impeccable:prompt` PNG metadata.
- Inspection: reviewed the generated scene visually; no Earth/planet disk, stars, people, rocket, lander, flags, structures, text or UI appear. Read dimensions from the PNG and sampled horizon positions. Ground and sky are opaque.
- Initial source filename: `exec-83a1835a-71cd-4133-9c26-b0128b04db12.png`.
- Selected final source filename: `exec-9501cb4a-eeb4-47ae-91aa-e99c72f391a8.png`.

## Initial generation prompt

```text
Use case: photorealistic-natural
Asset type: landscape raster backdrop for the actual close powered-descent camera in a Moon landing physics simulation.
Primary request: a scientifically plausible photorealistic lunar regolith plain seen from a low camera on the Moon, suitable as a calm broad landing area.
Composition/framing: wide 16:9 image, level horizon at exactly 64 percent of image height from the top, leaving the upper 64 percent as pure featureless black space and the lower 36 percent as ground. The ground reaches all three lower image edges. Broad gently undulating open plain with unobstructed center; subtle low distant ridges at the horizon, a few small shallow natural craters and scattered small rocks near the outer foreground. No large central crater or mountainous foreground. Crisp natural fine granular dusty regolith, understated detail that holds up to camera zoom. No stylized pattern.
Lighting/mood: hard neutral white sunlight from upper left, physical dark shadows falling to lower right, no atmosphere, no haze, no glow, no visible sun, no lens flare. Restrained contrast across the ground so a white and silver rocket will remain clearly legible when composited above it.
Color palette: neutral gray lunar dust with subtle warm gray sunlit material, charcoal shadows, perfectly black sky. Natural photographic texture and realism, Apollo lunar surface photographic material quality.
Constraints: scene only. No Earth, no Moon disk, no planets, no stars, no people, no spacecraft, no lander, no rocket, no flags, no buildings, no roads, no landing pad, no text, no diagrams, no UI, no logos, no watermark. No artistic poster, no cartoon, no illustration. Opaque output, not a cutout.
```

The initial image placed its horizon at about 58% of height. The final tool edit corrected the composition.

## Exact final edit prompt

The initial generated lunar image was supplied as the edit reference. Transparent background was false for both tool calls.

```text
Use case: precise-object-edit
Asset type: opaque wide landscape terrain backdrop for the powered-descent camera in a Moon landing physics simulation.
Edit target: the supplied lunar regolith photograph.
Change only the composition: move the lunar horizon downward so it crosses at exactly 64 percent of the full image height measured from the top. The upper 64 percent of the final image must be featureless pure black space. The remaining lower 36 percent must show the natural gray lunar plain and rocks. Keep the same wide 16:9 canvas and the same scene's photographic material quality, crisp granular detail, hard sunlight from upper left, dark shadows toward lower right, subdued gray palette, broad open central landing area, restrained low ridges and natural small craters.
Preserve a natural photographic viewpoint without stretching the existing terrain texture. No Earth, Moon disk, planets, stars, people, spacecraft, lander, rocket, flag, building, road, landing pad, text, UI, logo, watermark, haze, lens flare, atmosphere, or poster styling. No new objects. Opaque output.
```

## Provenance verification

Run the shipped Impeccable reader against the source asset:

```powershell
node "C:\Users\Xander Calz\.agents\skills\impeccable\scripts\embed-prompt.mjs" "public/flight/lunar-surface.png" --read
```

The embedded prompt should exactly match the final edit prompt above. Keep the asset local for offline classroom use.
