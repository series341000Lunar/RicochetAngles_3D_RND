# Three.js Visual R&D — Phase V4A Tone Mapping + Color Grade
Date: 2026-09-20
Status: TECHNICAL PASS / VISUAL REVIEW CANDIDATE
Final mapper / look / palette / exposure: OPEN. V4B and V5 not implemented.

## 1. V3 baseline
[V4A_baseline.json](V4A_baseline.json) records source hashes and previous color setup. Six source files were preserved as *.before_v4a.* before edits.
Player intensity 54,000 and Boss ×2 intensity 480,000 (user's ×3 retune), ranges 115/270, real-time 90 ms pulse and 20 ms smoke ramp are preserved. Gameplay, actors, muzzle module and contour module are byte-identical.
Work stays inside ThreeJSDEV; no main HTML Edition, Unity or GLB edits.

## 2. Postprocess architecture
Three scene → linear HDR RenderPass → OutputPass (tone map + sRGB) → display-space Color Grade → unchanged V1 yellow contour → separate Canvas HUD.
The user requested grading after tone mapping. Thus the grade intentionally follows OutputPass instead of preceding it. The final grade shader writes already encoded display RGB and performs no further tone mapping or sRGB conversion.

## 3. Previous/current color pipeline
Previous: direct WebGLRenderer, SRGBColorSpace, NoToneMapping, exposure 1, native antialiasing.
Current ON: linear HalfFloat render targets, four MSAA samples when available, one tone mapping/output conversion, one grade pass. Post FX OFF restores direct NoToneMapping/exposure-1 output.
Neutral comparison over the top 1280×530 region:
- Normal: mean absolute difference 0.316/255, 99th percentile 4/255.
- Focus: mean absolute difference 0.341/255, 99th percentile 4/255.
Approximately 7% of pixels have some channel differing by >3; this is practical visual equivalence, not exact framebuffer equality. Intermediate precision and linear offscreen MSAA differ from direct framebuffer antialiasing. [Metrics](tone_v4a/neutral_pixel_metrics.json).

## 4. EffectComposer / OutputPass
Official Three r160 modules vendored locally under spike/vendor/postprocessing/. Import paths only relocated; source and local hashes/URLs recorded in provenance.json; existing Three MIT license retained.
References: [r160 OutputPass](https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/jsm/postprocessing/OutputPass.js), [r160 OutputShader](https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/jsm/shaders/OutputShader.js).
RenderPass explicitly uses NoToneMapping for linear scene output. OutputPass reads selected mode/exposure. The grade ShaderPass has toneMapped=false and no output-conversion chunk.
Composer has three passes, including RenderPass; two additional fullscreen draws. Composer buffers follow actual renderer size/pixel ratio. No new targets allocated every frame.

## 5. Tone modes
None / ACES Filmic / Cineon / Reinhard, live selector without reload or scene-material recreation.
OutputPass may compile/cache its own small shader variant when switching modes. Scene materials are not replaced by tone switching.

## 6. Exposure
0.5..2.0 slider, initial 1.0. ACES/Cineon/Reinhard use the official tone mapping functions' exposure.
r160 OutputPass's NONE path normally does not apply exposure. A small instance-level shader addition multiplies linear RGB by exposure only when none of the three selected tone-mapper defines is present. The same control therefore works in None, without double exposure in mapped modes. Vendor source remains unchanged.

## 7. Contrast / saturation
After output conversion, display RGB:
contrast: (rgb - 0.5) × contrast + 0.5, range 0.7..1.5.
saturation: mix(luminance, rgb, saturation), range 0..1.5.
Neutral = 1 for both. Final RGB clamps to display range. Extreme user settings can clip; presets remain mild.

## 8. Shadow / mid / highlight
Using display luminance Y:
shadow = 1 - smoothstep(0.12, 0.42, Y)
highlight = smoothstep(0.55, 0.90, Y)
mid = 1 - shadow - highlight.
Smooth weighted gains: shadow 0.7..1.2, mid 0.85..1.15, highlight 0.8..1.15.
Optional shared Cool/Warm amount 0..0.1 multiplies subtle cool-shadow / warm-highlight RGB offsets; midpoint is neutral. No hard bands, LUT, color wheels or quantization.
Advanced controls stay collapsed by default.

## 9. Presets / UI
Post FX controls are in a collapsed panel section, preserving the game view.
| Preset | Tone | Exposure | Contrast | Saturation | Shadow | Mid | Highlight | Tint |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Neutral | None | 1 | 1 | 1 | 1 | 1 | 1 | 0 |
| Cinematic A — initial candidate | ACES | 1 | 1.06 | 0.94 | 0.96 | 1.02 | 1 | 0.035 |
| Cinematic B | Cineon | 1 | 1.03 | 0.98 | 0.98 | 1 | 1 | 0.02 |

Default candidate is Cinematic A, not final art direction. OFF bypasses all new processing. All requested sliders and presets are live.

## 10. Yellow contour
Drawn after color grade, with renderer toneMapping reset to NoToneMapping.
In the matched Boss-fire screenshots, all four modes retain 2,034 pixels of exact RGB (255,217,13), matching the existing contour color. No desaturated/whitened target feedback.
Existing depth-independent contour limitation is unchanged.

## 11. Focus material
V2B artistic values remain interior 0.22, power 2.0, gain 1.25.
A color-space adapter preserves its original display-domain calculation: encode the linear intermediate to display RGB for the existing Focus calculation, then decode back to linear before OutputPass. Direct/bypass path does not apply that round trip.
ACES retains a dark body and bright rim. Some underside/track regions are quite dark, especially at 45°; user review should judge detail tolerance. No change to target authority, original-material restoration or charge logic.

## 12. Muzzle light
All four modes captured at the same frozen shot age with the ×3 light setting.
In a fixed diagnostic rectangle around Boss front armor (not a segmentation mask), pixels with all RGB channels >=250 were 24.87% for None and 0% for ACES/Cineon/Reinhard. [Metrics](tone_v4a/highlight_color_metrics.json).
Mapped modes keep gradation around the bright front/ground pool; peak remains clear. This does not assert zero clipping at every possible angle/exposure.
Existing Focus luminance clamp still reduces light response on focused armor. No emissive assist or new light tuning.

## 13. Q
Descending shell and impact sampled for all four modes. Small shell remains visible; Canvas marker rings/labels retain exact color. Material and gameplay impacts unchanged.
All scenario captures (normal, contour, Focus, Player fire, Boss fire, Q descending, Q impact) are in tone_v4a/, named by mapper and scenario.

## 14. Camera comparison
75° remains main view. Same Cinematic A preset checked on Focus at 75°, 90°, 45°:
[Preset/camera comparison](tone_v4a/V4A_presets_cameras.png).
90° preserves top shape with relatively uniform dark Focus faces; 45° increases side/track visibility but deep shadows reduce fine detail. No black screen or severe whole-object collapse observed.
[Four-mapper normal comparison](tone_v4a/V4A_tone_comparison.png).
[Fire/Focus/Q comparison](tone_v4a/V4A_effects_comparison.png).

## 15. Gameplay isolation / lifecycle
[Core validation](tone_v4a_validation.json), [UI/HUD/DPR/performance validation](tone_v4a_live.json).
600-frame serialized gameplay trace identical with Post FX OFF/ON; movement, firing, Focus, Q and Bullet Time included.
Mode/preset switches leave gameplay and material references unchanged. Canvas HUD canvas data URL is byte-identical across the four modes.
PASS: sliders, None exposure, viewport resize, DPR change, initial DPR 2 capped at 1.5, render target resizing, Canvas/Three switch, actor/boss death and restart.
Existing Focus, contour, R1, R2, final combat and V3 muzzle suites all PASS; saved separately under tone_v4a/regression/.

## 16. Performance
Chrome headless / RTX 5090 / 1280×720 / DPR 1 / 75° / shadows ON. Native RAF samples of fixed gameplay pose:
| Stress | Configuration | FPS | Calls | Triangles |
|---:|---|---:|---:|---:|
| 0 | V3 bypass | 53.6 | 116 | 190,346 |
| 0 | Neutral | 60.0 | 118 | 190,348 |
| 0 | Cinematic A | 60.0 | 118 | 190,348 |
| 0 | Cinematic B | 60.0 | 118 | 190,348 |
| 100 | V3 bypass | 60.0 | 1,116 | 3,605,946 |
| 100 | Neutral | 60.0 | 1,118 | 3,605,948 |
| 100 | Cinematic A | 60.0 | 1,118 | 3,605,948 |
| 100 | Cinematic B | 60.0 | 1,118 | 3,605,948 |

The lower first bypass sample is measurement variability, not evidence that postprocessing is faster. These short refresh-limited samples are not GPU-time measurements or minimum-spec guarantees.
ON: three composer passes total, two added fullscreen triangles/draws; target size 1280×720, MSAA 4. At renderer DPR 1.5, targets 1920×1080. OFF: direct scene rendering; buffers retained for reuse.

## 17. Issues encountered / resolved
Initial Focus compilation referenced an inverse sRGB helper not available in this r160 shader context. Replaced it with the standard piecewise sRGB inverse transfer function; final tests have no shader errors.
Explicit linear/display-domain handling prevents duplicate output conversion. NONE exposure required the small OutputPass instance addition described above.
Performance test initially passed a timestamp instead of a callback to RAF; corrected test harness and reran successfully. This was not a production rendering failure.
Neutral is approximately equivalent, not pixel-exact, because of offscreen precision/MSAA.

## 18. Preferred candidates
Retain Cinematic A / ACES and Cinematic B / Cineon for user review. ACES gives strong terrain/vehicle separation and controlled bright firing surfaces; Cineon is another useful, slightly different highlight/midtone treatment.
Reinhard remains available as a softer comparison. No final mapper, palette or exposure selected.

## 19. Limitations
Existing green terrain naturally remains green; grade is mild, not a new palette. Focus dark areas and extreme exposure/contrast settings need visual judgment.
Mapped flash/material colors differ from unprocessed material output by design; critical Canvas UI and target contour are protected.
No LUT, toon bands, bloom/glow, player outline, local X-ray, vignette, grain, SSAO or additional lighting system.
Firefox/manual gameplay and final user art approval are not claimed.

## 20. V4B readiness
Technical foundation is ready for review, not automatic progression.
User should review Neutral/ACES/Cineon/Reinhard, Focus and muzzle captures, then retain one or two candidates. V4B quantization and V5 selective bloom are deliberately unimplemented.

Required captures:
[V4A_A_Neutral](tone_v4a/V4A_A_Neutral.png),
[V4A_B_ACES](tone_v4a/V4A_B_ACES.png),
[V4A_C_Cineon](tone_v4a/V4A_C_Cineon.png),
[V4A_D_Reinhard](tone_v4a/V4A_D_Reinhard.png),
[V4A_E_ACES_Focus](tone_v4a/V4A_E_ACES_Focus.png),
[V4A_F_ACES_PlayerMuzzle](tone_v4a/V4A_F_ACES_PlayerMuzzle.png),
[V4A_G_ACES_BossMuzzle](tone_v4a/V4A_G_ACES_BossMuzzle.png),
[V4A_H_ACES_QShell](tone_v4a/V4A_H_ACES_QShell.png).
The four main mapper captures use otherwise neutral grade to isolate the mapper. Separate preset_* captures show the actual grade presets.
