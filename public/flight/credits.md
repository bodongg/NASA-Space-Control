# Flight artwork

Added 2026-10-18 for checkpoint 4. Rocket and background were created with the built-in image_gen tool. Earth and Moon are locally bundled official NASA imagery, independent of the generated decorative background. The Saturn and Jupiter in that background are illustrative decoration and do not represent positions or scale in the physical simulation.

| Asset | Dimensions | Origin and display notes |
| --- | --- | --- |
| public/flight/rocket.png | 2172 x 724 | Original generated render. True alpha, nose right (+x), engine left. Alpha >16 bounds are x30..2144, y128..557. No baked exhaust. |
| public/flight/space.png | 1672 x 941 | Original generated background. Dark center, restrained Milky Way, tiny decorative Saturn/Jupiter in the upper corners. |
| public/flight/earth.jpg | 1041 x 1041 | Apollo 17 Blue Marble; black corners. Approximate globe source crop x28, y28, 984 x 984 for circular drawing. |
| public/flight/moon.jpg | 3240 x 3240 | LRO near-side photographic-data globe; black corners. Approximate globe source crop x144, y144, 2952 x 2952 for circular drawing. |

## Earth credit and source

NASA Apollo 17 Blue Marble, photograph AS17-148-22727 (December 7, 1972). Image courtesy of the Earth Science and Remote Sensing Unit, NASA Johnson Space Center. Official source https://www.nasa.gov/image-article/apollo-17-blue-marble/ ; downloaded https://www.nasa.gov/wp-content/uploads/2023/03/as17-148-22727_lrg.jpg ; retrieved 2026-10-18. Original pixels preserved; source metadata added.

The alternate [NASA SVS source](https://svs.gsfc.nasa.gov/30613) corroborates the photograph and attribution. Its image download timed out, so the file above was fetched from NASA's main site.

## Moon credit and source

NASA Lunar Reconnaissance Orbiter near-side lunar globe, based on spacecraft camera data. Credit NASA/GSFC/Arizona State University. Official source https://spaceplace.nasa.gov/all-about-the-moon/en/ ; downloaded https://spaceplace.nasa.gov/all-about-the-moon/en/the-moon-near-side.en.jpg ; retrieved 2026-10-18. Original pixels preserved; source metadata added.

This lunar image is a globe assembled from actual LRO observations, rather than an AI-generated lunar surface. It is bundled at its native source resolution because the JPEG is only about 633 KB.

## Rocket generation prompt

Use case: stylized-concept. Asset type: transparent sprite for a realistic orbital flight simulation. Primary request: an original photorealistic 3D render of a sleek white and brushed silver orbital transfer rocket, isolated with true alpha transparency. Exact side profile, horizontal axis, pointed capsule nose facing RIGHT (+x) and engine bell facing LEFT. Rocket fills a wide landscape canvas with only a small transparent border, all parts fully visible. Long clean cylindrical white body, subtly dark panel bands, small silver fins near the left engine, convincing engine bell, gentle top-left studio illumination and realistic material detail. Readable recognizable silhouette at only 80 pixels long. The entire rocket is one compact spacecraft, no detached parts. Constraints: no engine flame or exhaust, no ground, no shadow outside the object, no text, no logos, no insignia, no background, no fake checkerboard. Actual transparent PNG with clean alpha edges. Keep the rocket nearly horizontal and directly side-on, not in perspective.

Generation: built-in image_gen, transparent_background=true, no input images. Original generated file: C:/Users/Xander Calz/.codex/generated_images/01a14f4f-7125-7570-be42-45c22d262573/exec-54606e3c-34bd-415b-a285-db15ff84b654.png

## Space generation prompt

Use case: scientific-educational. Asset type: cinematic wide background art for a fullscreen orbital flight simulator. Create a beautifully restrained photorealistic NASA science photography inspired cosmic backdrop, 16:9 or wider landscape, deep almost-black navy space and a fine natural sparse starfield with varying tiny star sizes. A very subtle dusty Milky Way arc along the upper third, delicate cool blue haze at far edges, mostly black clear central and lower areas so white orbital geometry remains readable. Two very small decorative realistically shaded distant planets only: a tiny ringed Saturn toward the upper-left corner and tiny Jupiter toward the upper-right corner, each less than 5 percent of image width. These are illustrative distant objects, not a scale solar system layout. Keep the whole scene dark and calm, realistic astrophotography texture, extraordinary depth without bright nebula clouds. No Earth, no Moon, no rocket or spacecraft, no sun, no UI, no diagrams, no text, no logos or watermark. No horizon. The middle half of the image should remain very dark and visually quiet.

Generation: built-in image_gen, transparent_background=false, no input images. Original generated file: C:/Users/Xander Calz/.codex/generated_images/01a14f4f-7125-7570-be42-45c22d262573/exec-2b730bd5-ccd6-4c22-8cb4-2f3e446618ee.png

## Verification

All four files were opened and inspected. Rocket direction, alpha, absence of text/exhaust, dark central backdrop, and complete Earth/Moon globe framing were checked. Generation prompts or source provenance are embedded in each file with Impeccable's embed-prompt.mjs. No pixel editing was performed.

## Lunar surface — 2026-10-19

`public/flight/lunar-surface.png` is generated illustrative terrain, 1672×941 opaque PNG, horizon at64.2% image height. Created with image_gen and one composition edit; inspected and exact prompt embedded. No spacecraft or other objects are baked into the surface. It is not a NASA photograph or a surveyed landing location. Full prompt/provenance: docs/lunar-surface-asset.md. The scene draws the existing rocket at the altitude and attitude calculated by the mission model.

## Earth launch landscape —2026-10-19

`/flight/earth-launch.png` is an original generated illustrative coastal launch site,1672×941 opaque RGB PNG. It is not a NASA photograph or a surveyed launch location. No rocket or labels are baked in; code draws the staged vehicle and actual-thrust plume. Exact prompt embedded in PNG and recorded in docs/earth-launch-asset.md. Source horizon65.6%, concrete69.1%; proportionate cover and altitude fade preserve the photograph-like setting. The physical atmosphere is a separate simplified numerical model.
