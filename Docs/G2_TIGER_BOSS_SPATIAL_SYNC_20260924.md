# Tiger II Boss spatial contract sync — G2

**Scope:** `01_RND/ThreeJSDEV` Multi-Asset R&D only. **Status:** automated PASS; human play and art review UNVERIFIED. **Date:** 2026-09-24.

## Purpose and authority

The Tiger II GLB supplies a fixed spatial reference for the Boss 2D gameplay proxy. Projectile collision, armor, weakpoint activation, damage, vehicle collision, and stage logic remain in the existing 2D game. Authoring uses **90° orthographic top-down**. **75°** is a presentation check: the visible roof shifts on screen with height, while projectile envelopes stay on the 2D ground plane.

The source is `Panzer6B_Tiger2/export/Panzer6B_Tiger2_RND_v01.glb`, SHA-256 `e0eeeb1988f66089ada78e221ba0e43296518f0ecfde5cabbbc901b048ad6c20`, verified again on 2026-09-24. It is read only. Source bounds came from `Docs/G1_geometry_inspection.json`; surface points for GUN PORT, VISION SLIT, and CUPOLA came from `Docs/G1_surface_probes.json`. Canonical comparison is Tiger II, uniform ×2, **28 gameplay units per GLB metre**. Coordinates below are Boss local 2D: `+X` forward, `+Y` source `+Z`. They rotate with the hull; turret bounds and the three turret weakpoints follow turret rotation around the measured pivot (`x=-3.31` units).

## Footprint comparison

| Component | Old 2D center and size (units) | New projectile / interaction center and size (units) | Measured visual reference |
| --- | --- | --- | --- |
| HULL | `(0, 0)`, `190 × 112` | `(-2.28, 0)`, `161.88 × 76` | mesh AABB `161.88 × 100.03` |
| TRACK_L | `(0, -70)`, `174 × 25` | `(0, -38.58)`, `161.14 × 20.39` | measured track AABB |
| TRACK_R | `(0, +70)`, `174 × 25` | `(0, +38.58)`, `161.14 × 20.39` | measured track AABB |
| TURRET | `(0, 0)`, `76 × 64` | `(5.04, 0)` relative to turret pivot, `129.36 × 75.19` | measured turret AABB |
| GUN | no separate hit rectangle | visual reference only | turret-local `(125.66, 0)`, `113.26 × 13.78`; no barrel collider added |
| ENGINE | `(-103, 0)`, `20 × 44` | `(-63, 0)`, `32.2 × 43.4` | hand-authored inside rear engine deck |
| CORE | none | `(-44.8, 0)`, `22.4 × 28` | internal semantic reference only |

The full HULL mesh AABB includes side skirts over the tracks. Its projectile armor rectangle is narrowed to 76 units high so the measured track rectangles remain independently hittable; the union follows the visual silhouette. That 76-unit depth, ENGINE, and CORE envelopes are explicit calibration choices, not raw mesh colliders. The new 2D fallback drawing, contour selection, HE track targeting, and Focus X-ray hull box use the same authored proxy.

**Vehicle collision** retains the original Boss circle, radius `105` units. It is deliberately more generous than the new projectile outline and is shown separately in pink. No vehicle-contact feel change was introduced.

## Weakpoint and semantic placement

- GUN PORT, VISION SLIT, and CUPOLA keep the G1 measured 3D surface anchors and turret-following 2D interaction positions. Selecting `LEGACY` or `TIGER_REMAP` retains those prior modes for comparison.
- ENGINE now uses the rear HULL interaction rectangle above. Its displayed label anchors to the HULL surface at `(-2.3, 2.01, 0)` metres, measured by a read-only mesh probe. The label and damage rectangle intentionally have separate coordinates. Both stay within the rear deck in the 90° reference image.
- CORE uses an internal rear-center rectangle and a separate HULL roof indicator at `(-1.6, 2.06, 0)` metres. CORE has **no active weakpoint, armor, or damage handler** in this phase.
- TRACK_L/R keep their existing module health, destruction, and repair rules; their rectangles move to the measured bands.

The `TIGER_SPATIAL` preset is the R&D default. Its numbers remain fixed when a visual-only Tiger I, scale, or low/wide comparison is selected; the panel warns `VISUAL NONCANONICAL`. A visual setting never silently rewrites 2D gameplay authority.

## Debug comparison and preview

Open **G2 Boss Spatial Sync · compare** in the bottom-right R&D panel. Component choices separate HULL, TURRET, TRACKS, ENGINE/CORE, and weakpoint anchors. Old proxy is orange dashed; new projectile proxy cyan; measured visual AABB white dashed; vehicle collision pink; the ENGINE/CORE roof presentation points yellow. Labels can be toggled independently. For a clean comparison use Tiger II / Uniform / Scale 2, then switch 90° and 75°.

| Preview | File |
| --- | --- |
| 90° old / new / visual / collision | [01_90_old_new_overlay.png](g2_spatial/01_90_old_new_overlay.png) |
| 75° play presentation | [02_75_play_scene.png](g2_spatial/02_75_play_scene.png) |
| 90° weakpoint positions | [03_90_weakpoint_labels.png](g2_spatial/03_90_weakpoint_labels.png) |
| 90° ENGINE / CORE close-up | [04_90_engine_core.png](g2_spatial/04_90_engine_core.png) |
| Front / side / rear samples | [front](g2_spatial/05_90_front.png), [side](g2_spatial/06_90_side.png), [rear](g2_spatial/07_90_rear.png) |
| 75° old / new overlay | [08_75_old_new_overlay.png](g2_spatial/08_75_old_new_overlay.png) |

Preview capture magnifies both browser canvases with CSS for inspection; gameplay coordinates and renderer scale are unchanged.

## Validation

Run `node tests/test_g2_spatial.cjs` while the local HTTP server serves the repository at port `8765`. Detailed machine results: [validation.json](g2_spatial/validation.json). On 2026-09-24, **19/19 checks PASS** with no page errors: GLB-derived dimensions; ENGINE/CORE inside hull; track band accessibility; original vehicle radius; prior LEGACY and G1 transform modes; a 180-frame exact LEGACY combat trace against the backed-up HTML and JS; visual scale independence; front, side, rear, and both track hit samples; existing engine shot resolution reduced Boss HP from 10 to 9; render left gameplay state unchanged; 120 gameplay ticks completed; 90°/75° engine surface projection returned finite positions.

Sample hit outcomes: front HULL armor `155`, side RIGHT TRACK armor `42`, rear HULL armor `70`, and both side track module hits armor `42`. The 90° preview shows the old ENGINE marker outside the rear while the new rectangle and label sit on the rear deck. In the 75° preview the roof label moves about 15 screen units above its 2D ground-plane coordinate at intrinsic canvas scale, as expected from projection.

The original page was copied to `spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.before_spatial_sync.html` before editing. Companion JS backups are in the same directory with the `.before_spatial_sync.js` suffix. No GLB, Blender source, mainline HTML, or Unity file was changed.

## Known issues and next decision

- The HULL, TURRET, and TRACK envelopes are oriented rectangles, so corners are an approximation of sloped geometry. ENGINE and CORE dimensions are hand tuned within measured regions.
- The inherited active-weakpoint path can let a precisely aimed projectile pass lower armor before reaching its marker. This behavior was preserved; the scope did not redesign Boss combat.
- 75° visual surfaces and 2D ground-plane outlines do not perfectly overlap. 90° remains the calibration view.
- Human feel/readability review and a sustained manual Boss fight remain **UNVERIFIED**. Use the previews and live toggle to decide whether to adopt this R&D preset into a later product integration task.