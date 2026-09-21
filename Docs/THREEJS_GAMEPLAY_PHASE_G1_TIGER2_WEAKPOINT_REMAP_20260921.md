# Phase G1 — Tiger II Weakpoint Canonical Remap
Date: 2026-09-21
Status: **TECHNICAL PASS / visual candidate, user review pending**

## Scope and baseline
R&D only. Tiger II Uniform ×2.0, 75° presentation / 90° orthographic authoring.
Canonical asset: `Panzer6B_Tiger2/export/Panzer6B_Tiger2_RND_v01.glb`.
Existing Canvas shell / armor / Boss state remains gameplay authority. Three.js supplies surface projection only.
V5 Bloom shader, tuning and pass order were not changed. Mainline HTML Edition, Unity and GLB source were not edited.
Default preset is TIGER_REMAP; LEGACY remains selectable and retains the original coordinate definitions and transform.

## Actual geometry and coordinate convention
Inspected GLB nodes, mesh vertices and connected components; used downward Three.js ray probes only in the authoring test.
Evidence: [geometry](G1_geometry_inspection.json), [components](G1_turret_components.json), [surface probes](G1_surface_probes.json), [top view](G1_asset_top.jpg).
Runtime weakpoint collision does not use raycasting.

GLB +X is forward, Y is height, Z is lateral. Gameplay local X = GLB X, local Y = GLB Z.
The adapter uses HULL rotation.y = -hullAngle and TURRET_PIVOT rotation.y = -(turretAngle - hullAngle).
Actual units-per-meter is 14; Uniform ×2 gives the fixed canonical multiplier **28 gameplay units/m**.
Visual scale/camera changes never regenerate gameplay offsets.

Hierarchy: ROOT → HULL → TURRET_PIVOT → TURRET → GUN → MUZZLE.
TURRET_PIVOT translation is (-0.11809732019901276, 2.045936107635498, 0) meters; TURRET is identity.
All three anchors are owned by TURRET, not by a fixed Boss-root XYZ.

For owner-local anchor A and pivot P:
```text
world2D = bossRoot
        + R(hullAngle)   * (P.x, P.z) * 28
        + R(turretAngle) * (A.x, A.z) * 28
```
The pivot displacement rotates with the hull; the surface displacement rotates with the turret.
The full owner matrix and XYZ are used independently for the Three camera projection.

## Semantic anchors
This maps existing gameplay semantics to plausible model surfaces, not historical vulnerability.

| Semantic | Actual geometry choice | Owner-local XYZ (meters) |
|---|---|---|
| GUN PORT | Top of forward mantlet / barrel-collar ring, visibly connected to barrel | (2.4062328338623047, 0.8915646331065865, 0) |
| VISION SLIT | Small forward roof observation/periscope box, centered in X/Z | (0.6396937966346741, 1.17033052444458, -0.41334056854248047) |
| CUPOLA | Actual commander cupola cap, centered in X/Z | (-0.3050847351551056, 1.5303442478179932, -0.5215964913368225) |

VISION SLIT changes ownership from legacy hull-relative to turret-relative. Its armor, shape and state effect do not change.
Descriptors separate ownerNode / visualAnchorLocal3D from gameplayAnchorLocal2D.

| Semantic | New turret-local 2D units | New neutral Boss-root 2D units |
|---|---|---|
| GUN PORT | (67.374519, 0) | (64.067794, 0) |
| VISION SLIT | (17.911426, -11.573536) | (14.604701, -11.573536) |
| CUPOLA | (-8.542373, -14.604702) | (-11.849098, -14.604702) |

For comparable OLD/NEW coordinates below, both hull and turret angles are zero and the root is at zero:

| Semantic | Old root-neutral XY | New root-neutral XY | Delta XY |
|---|---|---|---|
| GUN PORT | (49, 0) | (64.067794, 0) | (+15.067794, 0) |
| VISION SLIT | (99, -18) | (14.604701, -11.573536) | (-84.395299, +6.426464) |
| CUPOLA | (-7, -36) | (-11.849098, -14.604702) | (-4.849098, +21.395298) |

## Shapes and gameplay semantics
Existing rectangular dimensions remain: GUN PORT 18×18, VISION SLIT 14×24, CUPOLA 20×17.
Existing armor pairs remain 38/135, 42/155, 46/120 respectively.
ENGINE retains position (-103,0), size 20×44, armor 34/70. Tracks and engine/core are not remapped.
No changes to Boss HP, damage, state transitions, phase, score, Q, Bullet Time, AI, movement or projectile physics.
Only the three weakpoint transforms and their presentation anchors change.

## Hull coverage and actual hit-path compatibility
The current code does **not** require a weakpoint to pass a hull-first broadphase gate.
getShellHitWithBoss checks weakpoint rectangles independently; an active-weakpoint aim test can suppress lower body/track/turret candidates before earliest-hit selection.
Consequently, an anchor outside the hull rectangle is not automatically unreachable.

Measured legacy hull: 190×112 units.
Measured GLB HULL footprint: approximately 161.88×100.03 units at ×2.
Thus the actual body is not larger than the legacy hull rectangle in this asset. The complete asset including its long barrel extends farther; these are different bounds.

Across 16 independent hull/turret angle combinations:
- 4 of 48 anchor centers lie outside the legacy hull; all are GUN PORT.
- 12 of 48 weakpoint rectangles partly extend outside it.
- All tested active center/inside-edge shots still reach their intended weakpoint.

**Geometric coverage mismatch: DETECTED / OPEN. Unreachable weakpoint due to broadphase: not observed.**
No hull resize and no interaction envelope were added.
[H screenshot](g1/G1_H_broadphase_mismatch.png) shows orange legacy hull, white dashed actual HULL footprint, violet full-asset footprint, anchors and shapes.
Future footprint review may consider body/contact semantics separately; the evidence does not justify an envelope workaround now.

## Validation
| Check | Result |
|---|---|
| Hull and turret independently 0°,45°,90°,135° | PASS, 16 combinations |
| 90° full 3D projection vs 2D anchor | PASS; maximum logical-pixel delta 5.115907697472721e-13 |
| Actual stock fireShell / updateShells / armor path | PASS, 240 paths |
| Center and both slightly-inside edges | Correct active weakpoint and expected engine-exposure transition |
| Both slightly-outside edges | Intended weakpoint missed; ordinary armor may still be hit |
| Engine hit | Expected Boss HP decrement preserved |
| Left/right track shots in both presets | Expected corresponding track damage, Boss HP unchanged |
| Q in both presets | Expected weakpoint transition / barrage latch |
| LEGACY restoration | Exact baseline deterministic trace preserved |
| Renderer on/off isolation | PASS for each preset, 600 frames |
| Camera/visual-scale changes | Fixed gameplay offsets preserved; noncanonical visual warning |
| UI preset/debug/3D-label controls and R restart | PASS |
| Contour, Focus, Q, Bullet Time, muzzle bridge, stress and asset switching | Existing regression suites PASS |

Tests use actual 2D projectile simulation with fixed random dispersion for reproducible aiming. Edge probes are 0.25 units inside/outside. This is controlled browser validation, not exhaustive player testing.
Eight gameplay function bodies, including collision, armor, Boss update and Q paths, remain identical.
LEGACY vs TIGER_REMAP can intentionally produce different hit results because positions differ; renderer isolation is tested within each preset.

Evidence:
[G1 validation](G1_validation.json),
[600-frame isolation](G1_isolation.json),
[track/Q/UI/restart](G1_interactions.json),
[preservation hashes](G1_preservation.json).
Existing suites: [final](g1/regression/final_regression.json), [contour](g1/regression/contour_v1_validation.json), [Focus](g1/regression/focus_v2_validation.json), [muzzle](g1/regression/muzzle_v3_validation.json), [R2](g1/regression/R2_validation.json).

## 75° presentation and remaining limitations
Labels/brackets follow full XYZ surface projection. Visual inspection places CUPOLA on the circular cap, VISION SLIT on the roof box and GUN PORT on the mantlet collar.
Focus and yellow contour remain readable in the captured pose. Final aesthetic/play-feel approval remains with the user.

At 75°, height produces a deliberate vertical difference between the surface label and the ground-plane gameplay hit anchor:
- GUN PORT: approximately -22.04 logical pixels.
- VISION SLIT: approximately -24.13 logical pixels.
- CUPOLA: approximately -26.83 logical pixels.

This follows screenY = gameplayScreenY - worldHeight × cot(75°).
A click directly on the elevated label is therefore not guaranteed to aim at its 2D hit center. G1 does not alter aim mapping or projectile physics to hide this distinction.
This aiming/presentation parallax remains an explicit UX review item, not a 90° coordinate error.

Canonical visual validation applies to Tiger II Uniform ×2. Other assets/scales display a noncanonical notice and disable the Tiger surface-label projection; gameplay coordinates remain the fixed selected preset.
Existing weakpoint sizes are retained; no size rebalance is approved by this phase.

## Screenshots
A–G use the same Boss pose; H uses a separate hull/turret pose to expose coverage mismatch.
- [A — 90° legacy](g1/G1_A_90_old_weakpoints.png)
- [B — 90° 3D anchors](g1/G1_B_90_3D_anchors.png)
- [C — 90° new gameplay anchors](g1/G1_C_90_new_2D_anchors.png)
- [D — 90° overlay](g1/G1_D_90_overlay_compare.png)
- [E — 75° old labels](g1/G1_E_75_old_labels.png)
- [F — 75° new surface labels](g1/G1_F_75_new_3D_anchor_labels.png)
- [G — 75° Focus](g1/G1_G_75_focus_target.png)
- [H — bounds mismatch](g1/G1_H_broadphase_mismatch.png)
- [Cropped comparison sheet](g1/G1_comparison.jpg) — full PNGs above remain authoritative.

## Files and reproduction
- spike/rnd_tiger_weakpoints.js: fixed authoring snapshot, LEGACY fallback, pure 2D transform.
- spike/rnd_tiger_anchors.js: owner-matrix projection, debug markers/bounds, comparison UI.
- spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html: G1 loading/render/presentation hooks.
- Pre-G1 HTML retained as RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.before_g1.html.
- tests/probe_g1_geometry.cjs, test_g1_remap.cjs, test_g1_isolation.cjs, test_g1_interactions.cjs, run_g1_regression.cjs.

Start the existing local R&D server, open the multi-asset page, wait READY and press START.
In the R&D panel select G1 Weakpoints = LEGACY / TIGER_REMAP; use Debug OVERLAY at90°, BOUNDS for hull coverage, and 3D anchor labels at75°.
Debug spheres are authoring-only and are excluded from the Bloom registry.

## Recommendation / phase boundary
Keep this as a reversible Tiger II G1 candidate for user play review, especially75° aiming parallax and unchanged hit-rectangle sizes.
The demonstrated authoring rule is owner-node-local XYZ → fixed canonical X/Z gameplay offset, with independent surface projection.
Do not start G2, remap tracks/engine, expand collision or decide the long-term Boss asset direction from this report. Those choices remain pending user review.
