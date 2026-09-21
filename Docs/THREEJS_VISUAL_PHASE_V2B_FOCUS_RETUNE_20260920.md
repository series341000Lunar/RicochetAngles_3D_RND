# Three.js Visual R&D — Phase V2B Focus Contrast Retune
Date: 2026-09-20
Result: TECHNICAL PASS / VISUAL PASS CANDIDATE / KEEP FOR USER REVIEW.
Scope: existing R&D only. V3, main HTML Edition, Unity and GLB assets untouched.

## 1. V2 baseline
Executable remains spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html.
Before edits, HTML, rnd_focus_material.js, rnd_gameplay.js, rnd_actors.js and rnd_target_contour.js were preserved as *.before_v2b.*. Hashes/sizes: [V2B_baseline.json](V2B_baseline.json).
V2 reports and captures remain intact. Comparison tests serve the backed-up V2 material/gameplay scripts through Playwright request routing; production executable is not replaced.
Implementation changes are limited to rnd_focus_material.js and the analysis-box drawing block in rnd_gameplay.js.

## 2. Purpose
Stronger distinction between normal and Focus: dark neutral body + bright neutral edge, with yellow exclusively for the existing target contour. Reduce overlay clutter by hiding the green box/fill by default. Whole-target mode and gameplay-owned target authority remain unchanged.

## 3. Contrast retune
Compared three candidates at the same seeded poses for Panzer, Pak and Tiger:
| Candidate | Interior | Fresnel power | Fresnel gain |
|---|---:|---:|---:|
| A | 0.25 | 2.4 | 1.15 |
| B — selected | 0.22 | 2.0 | 1.25 |
| C | 0.18 | 2.8 | 1.25 |

B keeps more interior detail than C while offering a stronger bright-edge cue than A. No per-vehicle exceptions or new material editor. [Candidate sheet](focus_v2b/V2B_candidates.png).

## 4. Interior
0.35 → 0.22.
The existing luminance/detail formula is retained:
gray = interior * clamp(dot(displayRGB, vec3(0.2126,0.7152,0.0722)) / 0.5, 0.55, 1.25).
The resulting body range before Fresnel is approximately 0.121..0.275. Removing the green translucent rectangle also eliminates its tint from the surface.

## 5. Fresnel
Power 2.5 → 2.0; gain 1.0 → 1.25; maximum stays neutral white 1.0.
F = min(1.0, 1.25 * pow(1 - clamp(dot(normal, viewDir),0,1),2.0)).
focusRGB = mix(gray, 1.0, F).
Gain/power make intermediate grazing surfaces brighter without raising white above 1.0. Existing charge interpolation, original-material references, cached clones, alpha/depth/shadow behavior and cleanup are unchanged.

## 6. Green box
Investigation: Gameplay / GLB bounds was already OFF. The visible green rectangle and translucent green fill actually came from the Canvas precision-analysis overlay.
Those two drawing calls now require the existing Gameplay / GLB bounds checkbox. Default remains OFF; debug ON can restore the box. The analysis computation, hit marker, weakpoint text, aim/firing preview line and HUD remain.
This is a presentation-only condition; target selection and analysis data are untouched. Canvas-only mode also defaults to no green analysis rectangle.

## 7. Panzer
[75° Focus](focus_v2b/V2B_A_75_Panzer_focus.png).
Darker body and brighter edge/track detail read more clearly than V2; no all-white mass. At native small size, crosshair and yellow contour still occupy significant pixel area.

## 8. Pak 40
[75° Focus](focus_v2b/V2B_B_75_Pak_focus.png).
Thin members remain visible and connected; no severe new fragmentation observed. White grazing highlights are strong on narrow pieces, while yellow contour still dominates the smallest geometry. No Pak-specific compensation.

## 9. Tiger II uniform ×2
[75° Focus](focus_v2b/V2B_C_75_Boss_focus.png) / [clean UI](focus_v2b/V2B_D_75_Boss_focus_cleanUI.png).
The large turret/body surfaces are clearly dark; bevels, slopes and side features are bright. Yellow outline and white surface highlights remain distinguishable. VISION SLIT label and aiming line remain visible.
Clean UI capture hides only the R&D panel; gameplay HUD/weakpoint information remains.

## 10. Camera comparison
- 75°: main evaluation view; chosen balance of body darkness and bright edge.
- [90°](focus_v2b/V2B_E_90_Boss_focus.png): broad top remains dark; turret slopes become brighter bands. Still readable, with less shading variation on flat top faces.
- [45°](focus_v2b/V2B_F_45_Boss_focus.png): side/track detail is more visible; large side faces can be very dark. No broad white washout observed. Existing ground-space weakpoint overlay vs elevated GLB projection difference remains.
[Before/after and camera sheet](focus_v2b/V2B_comparison.png).

## 11. Readability conclusion
KEEP / visual review candidate. Removing the green fill and rectangle is a substantial reduction in clutter; body/edge contrast is visibly stronger on Tiger and Panzer.
[Matched V2 before](focus_v2b/V2_compare_before.png) / [V2B after](focus_v2b/V2_compare_after.png).
These are automated matched-pose captures plus agent visual inspection, not user art approval.

## 12. Gameplay isolation / validation
[Main V2B validation](focus_v2b_validation.json).
- 600 frames of serialized game state exactly match V2: movement/fire/Focus/Q/Bullet Time.
- Focus OFF comparison region matches V2 pixel-for-pixel.
- Green box OFF by default, debug ON restores it; weakpoint analysis remains available.
- Focus lifecycle: charge, release, A→B, target loss, death/despawn, restart, Canvas/Three switch, renderer disable, glass material properties, no stale material — PASS.
- V1 contour suite 17 checks, R1 23 checks, R2 32 checks, final combat regression 15 checks — PASS.
- Real Shift press/release and Focus toggle — PASS.
Outputs are under focus_v2b/regression/; V2 results were not overwritten.
Same 75°/shadow ON stable sample: Panzer/Tiger OFF and ON approximately 60 FPS, unchanged draw calls/triangles; no steady-state per-frame material allocation or shader compile. Chrome headless, RTX 5090, refresh-limited; not minimum-spec evidence.
An initial screenshot-equivalence check exposed inconsistent test mouse-world coordinates, confined to the crosshair; the fixture was corrected to match screen and world inputs before the final passing comparison. No gameplay correction was made.

## 13. Known limitations
Small Pak geometry is still dominated by the inherited 2.5 px yellow contour. At 90°, grazing sloped armor produces brighter bands; at 45°, some large side faces are quite dark. These are surface-angle effects, not a screen-space outline.
V1 scene-depth-independent contour and Canvas/GLB projection alignment remain unchanged.
Debug ON intentionally restores the green analysis box. First Focus use can compile cached variants.
Firefox/manual play and final user visual approval are not claimed.

## 14. Next recommendation
Review V2B as a possible final whole-target Focus direction. No immediate local X-ray window is recommended or implemented.
After user review, choose whether to retain this Focus treatment or separately request Player outline / muzzle lighting / postprocess R&D. None of those next phases has been started.
