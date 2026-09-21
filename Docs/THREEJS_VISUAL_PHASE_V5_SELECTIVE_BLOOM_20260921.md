# Phase V5 — Selective Bloom / Glow
Date: 2026-09-21
Status: TECHNICAL PASS / VISUAL CANDIDATE — user review pending.
Scope: ThreeJSDEV R&D only. No HTML mainline, Unity, GLB or gameplay-source edits.

## 1. V4C baseline
Startup LOADING/READY/START, six GLBs, shader/FX preparation, 75° camera, shadows, pooled muzzle lights, Q, Focus, contour and independent Grade/Toon remain.
Bloom default OFF. Tone=None; Grade OFF; Toon OFF with Numeric 4 selected. Bitmap remains outside primary path.
Pre-change main HTML and world-grade copies saved as *.before_v5.*.

## 2. Architecture
Explicit registry → dedicated half-resolution linear HDR source buffer → threshold extraction + horizontal Gaussian blur → vertical Gaussian blur → late composite.
A small two-pass separable blur uses the local r160 ShaderPass / FullScreenQuad APIs. UnrealBloomPass was not added: a multi-mip general bloom chain is unnecessary for these small short-lived sources. No new generic postprocess/VFX framework.

## 3. Eligibility ownership
Renderer presentation registry only. register() accepts playerFlash, bossFlash or qShell; it marks userData.bloomEligible and creates a reusable proxy sharing source geometry.
Registered: one existing Player flash, one existing Boss flash, 32 pooled Q shells = 34 slots. Six active Q markers yield six active sources. Ordinary shells are not registered.
Proxy matrices, color, opacity and visibility follow the existing source. Player/Boss death gates stop emission. No gameplay event or separate glow timer.

## 4. Pass order
Base world linear HDR → OutputPass (optional tone + sRGB encoding) → optional Numeric Toon → optional Color Grade → Bloom composite → yellow contour.
Canvas HUD/weakpoints/text/warnings remain separate.

Two alternatives considered:
- Bloom composite before Toon/Grade: rejected, because the glow gradient would enter luminance quantization and grade thresholds, creating bands.
- Tone/Toon/Grade then Bloom, then contour: selected. The base retains its existing color logic while the halo stays smooth and the yellow feedback remains crisp.

The source buffer is computed separately before the composer draws; its final contribution is added only after Toon/Grade. Bright world pixels are never used as the bloom source.

## 5. Color space / HDR
Three dedicated RGBA half-float targets, no sRGB intermediate encoding, at half drawing-buffer dimensions (640×360 at 1280×720 DPR1). Bloom shader outputs linear radiance.
Composite decodes the existing display RGB, adds the linear glow, then encodes once back to display RGB. Alpha is preserved. No second tone mapper. High HDR radiance can saturate the final display core intentionally.
Render-target texture assigned to ShaderPass uniforms after construction, avoiding UniformsUtils texture cloning.
Bloom OFF preserves the old direct-render bypass. Bloom ON without Grade/Toon uses the composer; therefore antialiasing/precision can produce small scene-edge differences versus direct render. These are not global bloom emission.

## 6. Muzzle flash
Only the existing actual-GLB-MUZZLE flash meshes emit glow. Proxy energy 8, source opacity follows flash lifetime. No changes to source flash geometry, smoke, bridge, recoil, fire timing or muzzle PointLight.
PointLight still illuminates surrounding surfaces; Bloom supplies only a small image-space core halo.
The ×3 V3 light is dominant at peak. Required OFF/ON flash captures use the same pose at +75ms wall-clock / +7.5ms simulation (the current .1 simulation scale), where the light has decayed enough to distinguish the glow. Peak lighting has not been reduced to improve the comparison.

## 7. Q shell
Q proxy energy 2 (one quarter of muzzle proxy energy). A small continuous halo follows each existing pooled vertical shell. The captured core remains a small shape, not a large sphere.
Gameplay markers still own timing/impact/damage. Reset/removal detaches or hides sources and clears the glow buffer.

## 8. Exclusions
No registration for Player/Boss bodies, Panzer, Pak, Kübelwagen, stress clones, armor detail, Focus/Fresnel, yellow contour, ground, grid, obstacles, smoke or ordinary projectile bodies.
No conversion of Canvas impacts to Three.js. No future Critical/impact subsystem.
Same-pipeline test with bright Focus/contour and no eligible FX: strength 0 versus .6 images are pixel-identical.
Isolated Player glow: 1222 pixels changed by >1 code value, none beyond 32px from the source center. This is a measured capture bound, not a world-unit glow contract.

## 9. Numeric 4
Numeric 4 plus Bloom captured at 75°, 45° and 90°. Existing hard lighting bands remain on world surfaces; added glow stays soft because it bypasses quantization.
Large circular lighting bands in the combined screenshots belong to existing PointLight + Numeric Toon, not emission from the ground.

## 10. Focus
Dark body / white Fresnel retained. Focus is absent from the registry. Bright-Focus-only test yields zero glow contribution. Focus + Boss flash produces only muzzle glow. Existing Focus regression passed.

## 11. Contour / HUD
Contour drawn last in Three.js. Exact yellow (255,217,13) counts match OFF/ON:
Player pair 2025/2025; Boss 2011/2011; Q 1493/1493.
Counts differ between scenarios because their original overlays/poses differ, not due to Bloom.
Canvas HUD data URLs are exactly equal in each OFF/ON pair. Existing real-mouse contour selection passed.

## 12. Prewarm
Reuses V4C preparation: registers pooled proxies after pool creation, prepares source/blur/composite targets and both standalone/combined post paths before READY, then restores Bloom OFF.
No live shots, collisions, sound or simulation during preparation. Bloom proxy/material creation occurs under the existing visual random stream.
First-use checks: programs 36→36 and textures 7→7 for idle, Player, Boss, Q and Focus. Resize/DPR intentionally reallocates target dimensions as before.

## 13. First-use stability
Actual first Bloom activation render + WebGL completion wait:
- Idle: 1.8ms
- Player: 1.1ms
- Boss: 1.3ms
- Q: 1.3ms
No added shader program or texture on these first uses. These are headless-browser wall-time observations, not universal latency guarantees or pure GPU timer queries.

## 14. Cameras / visual review
75° lead, 90° projection reference, 45° diagnostic captured. Muzzle and Q halos remain compact; no broad bloom veil obscures the tank silhouette in the inspected captures. Yellow contour and white Fresnel remain distinct.
At strong initial PointLight peak, subtle Bloom can be difficult to distinguish. Expanded smoke can receive the screen-space halo overlay but never emits it.

## 15. Performance
Chrome headless, 1280×720, DPR1, camera75°, shadows ON, 90 RAF samples per case. Frozen presentation fixture isolates rendering; FPS is refresh-limited. CPU submission time is not GPU duration.

| Case | FPS | CPU submit ms | Draw calls | Triangles | Passes |
|---|---:|---:|---:|---:|---:|
| OFF | 60.7 | 0.94 | 116 | 190346 | 0 |
| ON idle | 60.0 | 1.40 | 118 | 190348 | 5 |
| Player | 60.0 | 1.39 | 124 | 190670 | 6 |
| Boss | 60.0 | 1.36 | 126 | 190830 | 6 |
| Q | 60.0 | 1.23 | 132 | 190566 | 6 |
| Stress100 OFF | 60.0 | 2.89 | 1116 | 3605946 | 0 |
| Stress100 ON | 60.0 | 3.03 | 1118 | 3605948 | 5 |


Median RAF interval ~16.7ms, p95 ~16.7–16.8ms throughout. Bloom targets 640×360; base targets1280×720 MSAA4.
Reported pass count includes world render and dedicated source/clear renders, not just fullscreen draw calls. Idle skips blur and clears the target; active Bloom adds source + two blur + composite. Numeric/Grade each add their pass if enabled.
Three half-resolution RGBA16F color targets cost about 5.3MiB, excluding driver overhead and existing base targets. Stress clones do not enter the source registry. Measurements do not certify lower-end hardware.

## 16. Gameplay isolation / regression
PASS: 600-frame gameplay traces equal Bloom OFF/ON, including fire, Focus, Q and Bullet Time; renderer read-only state check; defaults; real UI toggles/sliders; target switch; Player/Boss death; flash expiry; R restart; Canvas/Three switch; resize; DPR; cleared buffer after reset.
Existing contour, Focus, muzzle lights and independent Grade/Toon regressions passed. Normal-path page/shader errors: none.
rnd_gameplay.js, rnd_actors.js, muzzle-light, Toon, Focus and contour source modules are unchanged by V5. The main HTML only registers/prewarms the presentation sources.

## 17. Selected tuning
- Bloom OFF initially
- Strength .60 (UI 0–1.5)
- Radius .25 (UI 0–1; controls Gaussian sample spacing, not world meters)
- Threshold .85 (UI 0–4; source-internal linear luminance threshold)
- Muzzle proxy energy8 / Q proxy energy2
All user controls are renderer-only. No need to enable Color Grading or Toon first. Values are review candidates, not final art direction.

## 18. Known limits
The dedicated source pass is a small screen-space proxy pass, not scene-depth-aware volumetric glow. A Q halo can overlay foreground geometry; its small radius limits this in the current captures. Smoke is not an emitter but can be overlaid by the halo.
No temporal history: nothing should persist after source disappearance. First-use stability applies to warmed current paths; new materials, context loss or larger resized targets may need preparation.
Post-OFF/direct versus Bloom-ON/composer pixel differences include MSAA/precision; same-pipeline strength-zero comparisons are used to prove selective contribution.
Visual strength/acceptance in the user's normal browser remains for review. No global auto-bloom or automatic gameplay decisions.

## 19. V6 readiness
V5 technical implementation and visual candidate ready for review. V6 Visual Stack Review / Consolidation not started; no new effects added beyond this phase.

## Outputs
- [Comparison sheet](bloom_v5/V5_comparison.jpg)
- [Enlarged comparisons](bloom_v5/V5_crops.jpg)
- [Camera / Numeric 4](bloom_v5/V5_cameras.jpg)
- [Functional checks](V5_validation.json)
- [Performance](V5_performance.json)
- [Pixel checks](bloom_v5/V5_pixel_metrics.json)
- Regression outputs: bloom_v5/regression/
- Required V5_A through V5_H PNGs: bloom_v5/

Runtime files:
- spike/rnd_selective_bloom.js (new)
- spike/rnd_world_grade.js
- spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html

Tests: test_bloom_v5.cjs, test_bloom_perf.cjs, build_v5_comparison.py, run_v5_regression.cjs.
