# Three.js Visual R&D — Phase V2 Focus / Fresnel
Date: 2026-09-20
Status: TECHNICAL PASS / VISUAL REVIEW CANDIDATE / KEEP
V3: NOT IMPLEMENTED — user visual review pending.

## 1. V1 baseline
Executable: spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html.
Before editing, the HTML, rnd_gameplay.js, rnd_actors.js and rnd_target_contour.js were copied to matching *.before_focus_v2.* files. Exact SHA-256, byte sizes, executable path and the existing passing V1 validation are recorded in [V2_V1_baseline.json](V2_V1_baseline.json). V1 validation/screenshots are preserved; rerun outputs are separate under focus_v2/regression/.
Only the R&D renderer HTML, new renderer module/tests and R&D documentation were changed. Main HTML Edition, Unity, canonical assets and GLBs were not edited.

## 2. Focus activation source
Read game.precisionAim.charge / 0.35, clamped to 0..1. Existing updateTimeModeTimers(realDt) owns charge and ready state: 350 ms real-time charge, full at READY. No additional Shift handler, timer or gameplay state machine.
Requires enabled Three renderer, Focus Material toggle, valid V1-selected live actor and its loaded GLB root. Release restores immediately; no separate fade-out timer.
Existing gameplay currently disables Focus during Bullet Time. V2 respects that rule, rather than introducing slow-motion Focus or changing eligibility.

## 3. Target authority
Read game.targetContourTargetId. Resolve that ID in roleVisuals only after gameplay has selected it. No new picking, Raycaster, bounds, depth or material-ID targeting. V1 gameplay and contour module remain byte-identical to the baseline.

## 4. Material / shader implementation
spike/rnd_focus_material.js creates cached clones of the original materials and adds onBeforeCompile code to standard PBR shaders. The existing PBR render is calculated first. RGB presentation is mixed after colorspace conversion; alpha, depth and shadow paths are retained.
Orthographic view direction is constant view-space +Z; perspective uses normalized vViewPosition. The fragment normal includes the existing material normal calculation.
Every mesh beneath the selected root is covered, including all primitives and material-array slots. One variant per distinct original material per root; variants reused across target switches. No fullscreen postprocess or extra Focus geometry/pass.

## 5. Original material preservation
Store original material references, including exact array identity. Restore those references on release/target switch/loss/death/despawn/restart/Canvas mode/renderer failure or disable.
Clones inherit roughness, metalness, transparency, side, alpha/depth/blend and maps. Dynamic base color/emissive/opacity are read from the original each render so existing hit flashes are preserved. Source materials are never written by V2.
Actor cleanup releases cached variants before existing role-material disposal. A repeated 20-cycle boss cleanup test and synthetic multi-material-array test pass.
Normal OFF render matches V1 pixel-for-pixel in the 1280×550 comparison region (UI panel excluded), with a seeded matched fixture.

## 6. Grayscale
Using display-space RGB after the original shader's tone mapping/color conversion:
L = dot(rgb, vec3(0.2126, 0.7152, 0.0722))
gray = 0.35 * clamp(L / 0.5, 0.55, 1.25)
This preserves some illumination/part variation rather than filling the whole model with a flat constant. Interior range is approximately 0.193..0.438 before the Fresnel mix and Canvas overlay.

## 7. Fresnel
F = pow(1 - clamp(dot(normalize(normal), viewDir), 0, 1), 2.5)
focusRGB = vec3(mix(gray, 1.0, F))
outputRGB = mix(originalRGB, focusRGB, charge / 0.35)
This is a surface-angle effect across the entire actor, not a reticle-local window. The yellow contour remains the unchanged V1 renderer pass.

## 8. Tuning / controls
Interior 0.35; rim maximum 1.0; power 2.5. Initial requested values retained after screenshot inspection: the broad top faces remain dark and neither Panzer nor Tiger becomes an all-white mass. No per-asset exceptions or material editor.
Panel: Focus Material checkbox, default ON. Other selectors/defaults remain 75°, Tiger II uniform ×2 and shadows ON.

## 9. Panzer III
[Normal](focus_v2/V2_A_75_Panzer_normal.png) / [Focus](focus_v2/V2_B_75_Panzer_focus.png).
At native small size, the body becomes darker and the upper edges remain distinct. No whole-body white-out observed. Canvas rectangle and yellow contour dominate some boundary pixels; fine material differences are naturally less visible than on the boss.

## 10. Pak 40
[Normal](focus_v2/V2_C_75_Pak_normal.png) / [Focus](focus_v2/V2_D_75_Pak_focus.png).
Shield/body retains darker interior; barrel/supports remain separate. No disappearing geometry or shader artifact observed. Thin geometry already occupies few pixels and the V1 2.5 px yellow contour visually dominates; Fresnel alone is a subtle cue here. No Pak-specific shader was introduced.

## 11. Tiger II uniform ×2
[Normal](focus_v2/V2_E_75_Boss_normal.png) / [Focus](focus_v2/V2_F_75_Boss_focus.png).
75° main view: dark turret/hull faces, bright bevel/side features, continuous yellow silhouette. No broad white-out. The existing geometry detail and part boundaries remain readable. This is a visual review candidate, not final art approval.

## 12. Camera comparison
- [90°](focus_v2/V2_G_90_Boss_focus.png): top faces are relatively uniform, as expected from the view-angle term. Original illumination/detail retains some separation.
- 75°: main evaluation view; useful edge/body contrast.
- [60°](focus_v2/V2_I_60_Boss_focus.png): stronger side visibility, no broad white fill observed.
- [45° diagnostic](focus_v2/V2_H_45_Boss_focus_diagnostic.png): more side/track detail; existing ground-space Canvas overlay and elevated GLB surfaces visibly separate. This inherited projection limitation is not corrected by V2.
Camera selection does not change gameplay authority.

## 13. Canvas X-ray + material readability
Existing Canvas Focus information, aim line, analysis rectangle and weakpoint text are unchanged. The captured VISION SLIT label remains readable; preliminary captures also showed GUN PORT/CUPOLA readable.
The existing translucent green Canvas rectangle tints the grayscale beneath it; therefore the final composite is not purely neutral gray. At 75° it is readable but visually busier than the material alone; on Pak/Panzer the rectangle competes with the yellow contour. Kept intentionally for user comparison, not removed or recolored.
[Comparison contact sheet](focus_v2/V2_comparison_contact_sheet.png) includes all target/camera samples.

## 14. Lifecycle
PASS: half charge, READY, exact material restoration on release, A→B, loss, death, despawn, restart, Canvas-only, renderer disabled, Three return, boss scale change, glass material properties and repeated cleanup.
Kübelwagen transparent glass retains alpha, blend, depthWrite and side. [Capture](focus_v2/V2_J_75_Kubelwagen_focus.png). No special transparent X-ray behavior was added.
First use can compile a new shader variant; subsequent stable frames allocate no materials and compile no shaders.

## 15. Gameplay isolation / regression
[Focus checks](focus_v2_validation.json), [V1/V2 parity](focus_v2_parity.json), [real input](focus_v2_live.json).
- 600 frames: every serialized game state identical between V1 backup and V2 (movement, firing, Focus, Q and Bullet Time included).
- Repeated render calls leave serialized gameplay unchanged.
- Existing suites rerun separately: R1 23 checks, R2 32 checks, final regression 15 checks, startup 7 checks at each of 0/1000 ms script delay, V1 contour 17 checks, live browser 19 checks — all PASS.
- Existing firing, ricochet/obstacle collision, actor damage/death, Q impacts, Focus dispersion, muzzle bridge, stress, shadow toggle, restart and resize checked by these suites.
No target, projectile, damage, armor, dispersion or timing implementation changed.

## 16. Performance
Chrome headless / ANGLE D3D11 / RTX 5090 / 1280×720 / DPR 1 / 75° / shadows ON. Stable scene, real requestAnimationFrame sample; gameplay held fixed for a fair presentation comparison.

| Condition | FPS | Draw calls | Triangles | Programs |
|---|---:|---:|---:|---:|
| OFF, Panzer selected | 60.0 | 127 | 196,968 | 10 |
| ON, Panzer selected | 60.0 | 127 | 196,968 | 10 |
| OFF, Tiger ×2 selected | 60.0 | 127 | 227,912 | 10 |
| ON, Tiger ×2 selected | 60.0 | 127 | 227,912 | 10 |

Programs are measured after warm-up, including previously compiled variants. Different target triangle totals come from the existing V1 silhouette mask, not V2.
No per-frame material allocations or shader compilations during samples. FPS is refresh-limited; this is not a GPU-time benchmark and does not prove zero shader cost or minimum-spec suitability.
The timer-driven stress loop in focus_v2_validation.json reports about 196–200 renders/sec, not display FPS; use focus_v2_live.json for display cadence.
Separate existing live stress: 0/25/100 tanks with shadows and 100 without shadows all sampled 60 FPS on this machine.

## 17. Known limitations
- Canvas green fill tints grayscale and competes with the contour on small assets.
- Grazing side faces can be bright by design; 90° top faces are more uniform.
- Pak thin pieces have little interior pixel area; yellow contour is more prominent than grayscale.
- V1 silhouette remains independent of scene-depth occlusion; unchanged.
- V1 target footprint and existing Canvas X-ray resolver are separate existing systems; V2 follows V1 only.
- GLB elevation vs ground-space Canvas alignment remains particularly noticeable at 45°.
- First activation may compile variants; no prewarming framework added.
- Browser automation and screenshot review passed; user's visual approval and Firefox/manual play are not claimed.

## 18. V3 readiness
KEEP V2 as the whole-target baseline; technical checks PASS and screenshots are ready for user visual review.
V3 radial/local window is NOT implemented. Proceed only after the user reviews the Normal/Focus pairs, tuning and limitations.
