# Phase V4B — Toon Ramp — 2026-09-21

Update: Color Grading and Toon now have independent toggles. Both OFF bypasses postprocessing; either alone works; both ON preserves Tone → Toon → Grade. Original baseline/hash statements below describe the initial V4B delivery; the subsequent HTML change only updates Focus linear-output detection to either-effect-active. See V4B_independent_toggles.json.

Status: TECHNICAL PASS / VISUAL CANDIDATE, USER REVIEW PENDING.
Scope: ThreeJSDEV R&D only. No mainline, Unity, GLB or gameplay edits. V5 not started.

## 1. V4A baseline
Backups and SHA-256 recorded in V4B_baseline.json. Post FX and Toon both default OFF. Existing tone/grade sliders retained, open and scrollable. Panel height capped at 270px / 38vh to preserve the aiming area.

## 2. Processing order
World HDR → OutputPass tone mapping + sRGB encoding → Toon → Creative Grade → protected yellow contour. Canvas HUD remains separate.
OutputPass is retained in its existing V4A position. Toon decodes its display RGB to linear for luminance and blending, then re-encodes for the existing display-domain Grade. There is no second tone mapper or final double gamma conversion.

## 3. V4A changes
rnd_world_grade.js inserts one ShaderPass before Grade, exposes Toon controls and defaults Post FX OFF. New rnd_toon_ramp.js owns the ramp shader/UI. OFF bypass and Post ON/Toon zero match the pre-V4B screenshots exactly (see toon_v4b_validation.json). V4A controls and presets remain.

## 4. PNG inspection
Source: Z:\RicochetAngles\00_Asset\TEX_Proj\T_Lut_03.png.
256×32 RGBA; alpha 255 throughout; horizontal near-grayscale ramp, 115 distinct center-row RGB values. Soft transitions mean this is not a strict three-level LUT. Rows differ slightly (maximum 5 code values); R/G differ by at most 1.
Source and HTTP copy spike/textures/T_Lut_03.png SHA-256:
2aa19079fbb47a0854cc38d7411210b20a1949bec52b082aa01e50d1b19f4cb7.
Original unchanged. Full samples/provenance: V4B_ramp_inspection.json.

## 5. Sampling
1D luminance remap, U=perceptual luminance, V=0.5. Raw NoColorSpace data; clamp, no mipmaps; default Nearest, optional Linear. Output RGB is reduced to a grayscale luminance target, not applied as a color texture or 3D color LUT.
Nearest versus Linear at strength .6: mean absolute screen difference .519 /255, max 3. Small difference is expected for this already softened ramp.

## 6. Numeric modes and fallback
Editable thresholds / output levels, validated ascending within 0..1:
- Numeric 3: thresholds .33/.66; levels .16/.55/.95.
- Numeric 4: thresholds .28/.52/.78; levels .16/.38/.66/1.
- Numeric 5: thresholds .2/.4/.6/.8; levels .12/.3/.49/.72/.95.
PNG load failure visibly reports Numeric 4 fallback. Deliberate HTTP 404 test passed. Invalid numeric edits retain the previous values.

## 7. Luminance and color
Decode sRGB, calculate linear Y=dot(RGB,[.2126,.7152,.0722]), encode scalar Y to the perceptual ramp axis, sample/decode target Y. Scale original linear RGB by targetY/Y. Near zero uses neutral target gray. Uniform gamut compression preserves RGB ratios, though saturated colors may not attain the exact target luminance. Terrain hue is retained; no whole-world grayscale.

## 8. Strength
0..1, default .6 while disabled. Linear-light original/toon blend. Strength 0 skips the pass and exactly matches V4A. Color Grading and Toon are independently enabled. Color Grading owns tone mapping, exposure and creative grade; Toon alone uses no tone mapping, exposure 1, and bypasses creative grade. Mode, filtering, strength and numeric values are interactive.

## 9. Tone mappers
None, ACES, Cineon, Reinhard captured. With artist ramp .6, None/Reinhard produce brighter terrain, Cineon more green midtones, ACES stronger separation. No mapper-specific corrective table.

## 10. Artist versus Numeric
Artist .4–.6 is the preferred review range. Artist 1.0 is more posterized. Numeric 3 at 1.0 loses important bevel/roof variation. Numeric 4/5 at 1.0 accentuate ground grid, crosshatching and threshold boundaries. Full-strength numeric modes are comparison tools, not approved presets.

## 11. Vehicles
Boss, Panzer, truck and Pak compared. Artist .4–.6 retains more small-part and armor-plane information than Numeric 3 full strength. Thin Pak parts remain visible in captures. No geometry/material-source edits.

## 12. Terrain
Hue remains green. Grid/detail and shadow boundaries become more conspicuous as strength rises. Full-strength numeric terrain banding is not accepted as a final art result.

## 13. Focus
Existing V2B grayscale/Fresnel response remains. Artist .6 retains multiple gray levels; some dark sides are near black at 45°. No Focus-specific toon exception or shader retune. Existing Focus regression passed.

## 14. Contour
Protected contour is rendered after postprocessing. Exact yellow (255,217,13) count stayed 2034 pixels across six comparison modes. Existing V1 checks all passed after reducing panel height. Initial real-mouse tests exposed panel overlap; the final scrollable panel resolves it without changing selection rules.

## 15. Muzzle light
User ×3 intensity retained: player 54000; boss scale 2 peak 480000, ranges 115/270; 90ms realtime duration. V3 regression passed. Player/boss flash captures show the light pool, with stronger stepping under Toon. No bloom added.

## 16. Q
Q shell remains visible in the captured scene. Canvas markers/HUD remain identical; existing Q regression passed.

## 17. Cameras
75° baseline plus 90° and 45° captures. Focus and geometry remain visible; 45° increases dark-side compression. No camera-specific settings or gameplay changes.

## 18. Gameplay isolation
600-frame deterministic traces match Post OFF, Post ON/Toon OFF, and Toon ON. Render read-only and HUD comparison passed. Existing R1, R2, final, Focus, contour and muzzle suites passed. Gameplay, actors, Focus, contour, muzzle and main HTML hashes remain equal to baseline.
Resize, DPR, Canvas fallback/comparison, return to Three.js and restart passed. Browser/shader errors: none in the normal path.

## 19. Performance
Headless Chrome, RTX 5090 ANGLE D3D11, 1280×720, DPR1, 75°, shadow ON, 90 RAF samples. These are smoke measurements, not hardware-independent GPU benchmarks.

| Mode | FPS | Draw calls | Triangles | Total passes |
|---|---:|---:|---:|---:|
| Post OFF | ~60 | 116 | 190346 | 0 |
| Post ON / Toon OFF | ~60 | 118 | 190348 | 3 |
| Artist Toon ON | ~60 | 119 | 190349 | 4 |
| Numeric 5 ON | ~60 | 119 | 190349 | 4 |

Targets 1280×720, MSAA4. Programs stable at 16. Artist timing used Linear filtering after the UI filter test; default remains Nearest. Toon adds one fullscreen pass. No broad stress/performance certification inferred.

## 20. Preferred candidate
For review: ACES + T_Lut_03 at .4–.6. Compare Neutral Grade first, then existing Cinematic A. This is a recommendation, not a frozen preset. Defaults remain OFF.

## 21. Known limitations
Numeric full strength can flatten vehicle shading and reveal high-frequency texture/terrain patterns. Ramp near-black lift uses neutral gray. Gamut compression can change requested target luminance. Stationary captures and automated browser tests do not establish user acceptance during extended play.

## 22. V5 readiness
Technical implementation ready for user review. Visual approval pending, especially terrain banding, dark Focus sides and preferred strength/grade. V5 Selective Bloom/Glow NOT STARTED.

## Evidence
- [Comparison sheet](toon_v4b/V4B_comparison.png)
- [Vehicle comparison](toon_v4b/V4B_vehicle_comparison.png)
- [Small vehicle candidates](toon_v4b/V4B_small_vehicle_candidates.png)
- [Tone/camera comparison](toon_v4b/V4B_tone_camera.png)
- [Controls](toon_v4b/V4B_controls.png)
- [Automated validation](toon_v4b_validation.json)
- [Live controls and performance](toon_v4b_live.json)
- [Pixel metrics](toon_v4b/V4B_pixel_metrics.json)
- Existing regression evidence: toon_v4b/regression/

Required captures:
- [V4B_A_Toon_OFF.png](toon_v4b/V4B_A_Toon_OFF.png)
- [V4B_B_T_Lut_03_100.png](toon_v4b/V4B_B_T_Lut_03_100.png)
- [V4B_C_T_Lut_03_60.png](toon_v4b/V4B_C_T_Lut_03_60.png)
- [V4B_D_Numeric3.png](toon_v4b/V4B_D_Numeric3.png)
- [V4B_E_Numeric4.png](toon_v4b/V4B_E_Numeric4.png)
- [V4B_F_Numeric5.png](toon_v4b/V4B_F_Numeric5.png)
- [V4B_G_Focus.png](toon_v4b/V4B_G_Focus.png)
- [V4B_H_PlayerMuzzle.png](toon_v4b/V4B_H_PlayerMuzzle.png)
- [V4B_I_BossMuzzle.png](toon_v4b/V4B_I_BossMuzzle.png)
- [V4B_J_QShell.png](toon_v4b/V4B_J_QShell.png)
