# ThreeJSDEV-ENV-01 — Actual Stage Layout + Static World GLB
Date: 2026-09-24

**ThreeJSDEV-ENV-01 PARTIAL PASS.** All implemented technical gates pass.
**USER VISUAL REVIEW and production-workflow UX approval remain PENDING.**
No mainline absorption, canonical migration or Blender authority promotion is performed.
DCC-00 and DCC-MAP-01 baseline conclusions remain unchanged.

## 1. Repository and baseline
- Repository: series341000Lunar/RicochetAngles_3D_RND; local ThreeJSDEV checkout.
- Branch: dcc-00-semantic-authoring; starting HEAD 0a428e9; starting tree CLEAN.
- This report and implementation are committed together on the existing feature branch.
- main remains b61739ee43ff733da12a4a0f3e5e593b01daabe3.
- Blender: 5.2.1 LTS, build 9e2066aef7ef, C:/Program Files/Blender Foundation/Blender 5.2/blender.exe.
- Baseline reused: existing DCC addon/floating editor, H5E preservation adapter,
  DCC testbed iframe, Three.js renderer/scene/camera/lighting and GLTFLoader.
- No new renderer, WebGL context, simulation loop, scene exporter in Three.js, physics, streaming or ECS.

## 2. Stage input and preservation
Input is the **current** dcc00/workspace/dcc-map-01/edited.json.
Its cover X was 3050 at task start, not the earlier DCC-MAP-01 example value 3090.
Current source working-map SHA-256:
3b6c35459414b4d08b7327d60d3bc2ec2e8cceba582248f4c316411edaf4d2a9.

ENV output is a separate successor working copy:
- dcc00/workspace/env01/map.json
- dcc00/workspace/env01/geometry.glb
- dcc00/workspace/env01/authoring.blend

The prior working map is unchanged. The original mainline map is also unchanged:
C:/Users/LunarGagarin/Documents/Topdown Tank/maps/H5E_PILOT_MAP_PASS2_14W_v0.1.json,
SHA-256 9346ff550f79f1f91c306ff3fcc9bd1959c3170dd9a7f8ea055cda91097b56d5.
Mainline Git tree remains clean; no mainline file or runtime modification.
Preservation hashes are checked after each Blender authoring iteration and during final evidence collection.

The ENV map retains 57 objects / 130 markers / 10 annotations, world 17920 x 1440,
all stable IDs, unknown data and semantic payloads. Only the deliberate ENV-local cover X changes.
Map data drives bounds, record positions, ID lookup/highlight, reference overlay and alignment checks.
It does not rebuild gameplay actors, collision, checkpoints, AI, progression or boss systems.

## 3. Implementation paths and controls
- Blender bounded modeling/reproduction: dcc00/env01/author_scene.py.
- Same-instance addon exports: dcc00/blender_addon/ricochetangles_dcc00/env01.py.
- Existing H5E adapter supplies import, source preservation and edit reconciliation.
- Shared map conversion: dcc00/html/src/map_reference.js, extracted unchanged from canonical preview.
- ENV loader: dcc00/html/src/env01_preview.js.
- Existing surface: dcc00/html/testbed.html?mode=env01.
- Load / Reload map + GLB, whole-stage / slice framing, 90/75 degree camera presets,
  map-bounds / semantic / ENV visibility and known stable-ID highlight/focus.
- Unknown selection preserves the prior selection. Bad map reload retains the prior stage.
- Missing GLB retains map/IDs, removes stale ENV geometry and shows a clear message.
- Reload parses fresh local HTTP resources with cache busting; this is not an editor/exporter in Three.js.

The existing paused review render callback draws the existing renderer; no gameplay stepping is added.
Existing default DCC mode and canonical reference mode remain functional.

## 4. Blender → GLB → Three.js contract
Let authored H5E reference coordinates be (x,y) and Blender presentation height be zB.

1. Blender review coordinates: (x/14, -y/14, zB).
2. Native Blender glTF export with export_yup=True: (x/14, zB, y/14).
3. Three.js GLB root uniform scale = 14: (x, 14*zB, y).

No corrective Blender rotation, imported-root rotation, reflection or translation is added.
Fourteen H5E units per Blender unit remains a review scale, not a real-world meter definition.
Geometry height stays presentation-only and never changes semantic X/Y.

The exporter uses only the active scene and selected ENV01_STATIC collection objects.
Allowed object types: MESH and EMPTY; names must start ENV_ and cannot be semantic anchors.
It disables animations/cameras/lights/compression and scene/custom-property extras.
The final GLB has no external textures/buffers, absolute PC paths, NAS URIs or interactive actors.
The runtime fetches relative HTTP paths under the repository; the GLB itself is self-contained.
The underlying existing R&D host still needs to serve its normal local renderer/vendor resources.

Both map and GLB exports check output revision and atomically replace completed derivatives. Map export also checks the imported working source hash.
A changed output/source blocks export rather than silently overwriting. Native Blender Save preserves
the updated revision fields for the next authoring session.

## 5. Bounded environment and design choice
The slice is around the previously measured Tutorial Upper Cover and neighboring traversal route.
This gives explicit authored center/route references without modeling all 14W.

Static visual objects:
- ENV_GROUND_01: one 1550 x 1200 reference-unit ground slab.
- ENV_ROAD_01: one authored three-station gravel strip following the local route, width 164.
- ENV_WALL_01: rectangular cover visual, 340 x 80 footprint, height 84, yaw -15 degrees.
- ENV_WALL_02: circular cover visual, radius 90, height 45.
- ENV_BUNKER_FLOOR/BACK/LEFT/RIGHT/FRONT_L/FRONT_R/LINTEL/ROOF:
  one unoccupied landmark shell, floor 250 x 200, roof top height 134.
- ENV_PROP_CRATE_01..03: three crates, 42 x 42 x 40.
- ENV_PROP_BARREL_01..02: two barrels, radius 17, height 44.
- ENV_PROP_ROCK_01..02: two simple rock props.
- ENV_ANCHOR_A/B/C: three named visual QA references, not gameplay IDs.

Total: 19 mesh nodes, 3 Empty anchor nodes, 8 materials, 668 triangles.
GLB size: **53,572 bytes** (~52.3 KiB). External dependency count: 0.
Measured draw calls: **39** with semantic overlay off; **54** in the initial overlay measurement.
These include the existing shadow pass and visible reference lines, not just GLB mesh count.
Measured render triangles: 1336 including shadow rendering. These are observations, not performance budgets.

No Player/Enemy/AT Gun/interactive Pillbox/trigger/checkpoint/weakpoint is baked into the derivative.
Wall meshes are explicitly visual counterparts; map collision flags remain data only.
The bunker is an empty visual shell with no actor or damage identity.

## 6. Measured alignment
Declared tolerance: **0.002 H5E reference units**. All three pass in 90 and 75 degree review.

Final map after the intentional +28-unit edit:
| Anchor | H5E expected (X,Y,height) | Blender authored (X,Y,Z) | Three.js measured (X,Y-height,Z) | Error |
|---|---|---|---|---|
| A cover center | (3078,390,0) | (219.8571472168,-27.8571434021,0) | (3078.0000610352,0,390.0000076294) | 0.0000615101 |
| B round cover | (3250,1050,0) | (232.1428527832,-75,0) | (3249.9999389648,0,1050) | 0.0000610352 |
| C route point[3] | (2800,800,0) | (200,-57.1428565979,0) | (2800,0,799.9999923706) | 0.0000076294 |

Not only Empty markers were tested:
- Actual ENV_WALL_01 object footprint origin matches A.
- Actual ENV_WALL_02 mesh center matches B in XY; its center height is presentation-only 22.5.
- Actual road cross-section midpoint matches C in XY; road surface lift is 2.1.
Maximum measured XY error: **0.0000615101**, comfortably below tolerance.
No height-induced semantic repositioning occurs.

## 7. Re-export and map iteration
Initial map cover X=3050 and GLB wall/anchor aligned there.

Mesh iteration:
- Reopened the saved Blender source.
- Moved only ENV_PROP_CRATE_01 by Blender +2 X = H5E +28.
- Native GLB re-export and same-browser reload.
- Only that node position changed; the entire map remained identical.
- All three alignment anchors remained within tolerance.

Map iteration:
- Reopened the saved source again.
- Moved only H5E_P1_TUT_COVER_01 semantic X by +28, giving X=3078 exactly.
- Only /objects/15/geometry/x changed in the exported working map.
- Explicitly moved ENV_WALL_01 and ENV_ANCHOR_A +28 to maintain authored alignment,
  then re-exported GLB. This is an authoring action, not runtime mesh-to-map authority.
- Reload showed the expected semantic and matching visual change; other records/nodes were unchanged.

Observed scripted Blender work/save/export durations: mesh ~0.68 s, map ~0.67 s,
excluding process startup and human editing. Same-browser fetch/decode/reload observations were
about 41–47 ms in this local run. These are not UX/performance guarantees; manual iteration feel is pending.

GUI test:
- Opened saved authoring.blend in a separate Blender instance.
- Used the existing floating editor's actual map/GLB export operators.
- Shared scene and no-edit map hash equality pass.
- GLB JSON structure is identical; three float32 bytes differed after GUI modifier evaluation.
  Maximum float accessor difference is 5.960464477539063e-08 (far below declared spatial tolerance).
  Byte-identical GLB re-export is not claimed.
- Saved the source with current output revisions and closed only the test instance.

## 8. Camera, browser and regression results
- 90 degrees: PASS technical projection/alignment; screenshot retained.
- 75 degrees: PASS technical rendering/readability evidence; user art/readability approval PENDING.
- Native .blend load and GUI export: PASS, no native stderr.
- Browser iteration: PASS, no page exceptions.
- Intentional missing-GLB and malformed-map tests: expected handled errors, fail-soft PASS.
- Shared canonical mode: PASS, 197 records.
- Existing default DCC preview: PASS, 15 previews / 5 actual GLBs.
- Existing DCC contract/HTTP tests: 13 PASS.
- Existing G1 interactions: PASS.
- Current runtime renderer isolation: PASS, 600 frames for LEGACY and TIGER_REMAP.
- Historical before_g1 comparison was not rerun; the previously documented snapshot dependency
  mismatch remains a known baseline limitation. No full historical G1 PASS is claimed.
- Mainline source, prior working JSON, gameplay state and spike/gameplay code remain unchanged.

## 9. Evidence and local assets
Tracked aggregate: Docs/THREEJSDEV_ENV01_VALIDATION_20260924.json.
Local generated assets/evidence stay ignored and are retained on disk, not uploaded as repository fixtures.

Under dcc00/test-output/env01:
- runtime.json: before/after positions, changes, anchors, stats, toggles/fail-soft.
- geometry-and-regression.json: actual mesh measurements and old-mode smoke.
- native.json, G1_current_isolation.json, G1_interactions.json, contracts.log.
- init/mesh/map-blender.json and export logs.
- preservation.json and initial/mesh/map JSON + GLB snapshots.
- review-75.png, review-90.png, review-90-overlay.png, whole-stage.png.
- mesh/final before-after screenshots, missing-env.png.
- blender-editor.png, blender-environment.png.

An early diagnostic GLB with unwanted scene extras is retained only in test-output for diagnosis;
it is not the runtime geometry.glb. Final export explicitly excludes extras and other scenes.

## 10. Hands-on review and reproduction
Run **Launch_ENV01_Review.bat**. It reuses the existing authoring server, opens ENV review and
the saved authoring.blend in Blender 5.2. It does not change global preferences or keymaps.
Equivalent browser URL: http://127.0.0.1:8766/dcc00/html/testbed.html?mode=env01.

In Blender:
1. Edit an ENV01_STATIC mesh using normal Blender tools.
2. Use **Export ENV-01 geometry.glb** in the existing floating editor.
3. For an unlocked map anchor, use **Export ENV-01 Stage Map**.
4. Save authoring.blend after exports to retain the current revision stamps.
5. In the browser click Reload map + GLB, toggle semantic overlay, choose 90/75 degrees.

Creation script for a fresh derivative:
blender --background --factory-startup --python-exit-code 1 --python dcc00/env01/author_scene.py -- init
It refuses to overwrite an existing authoring.blend.

Automated iteration:
node dcc00/tests/env01_iteration.cjs
This intentionally moves local ENV working objects/map; preserve manual work before replaying it.
It never changes the previous DCC-MAP-01 working map or mainline original.

Read-only final checks:
node dcc00/tests/env01_geometry.cjs
python dcc00/tests/test_contract.py
Native GUI test requires authoring.blend as the opened Blender file and --enable-event-simulate.

## 11. USER VISUAL REVIEW and next phase
Pending user decisions:
- Overall Stage scale and how the small slice sits within 14W.
- Ground/road proportions, wall/bunker heights and prop spacing.
- 75-degree top-down readability.
- Semantic/mesh alignment with overlay toggled.
- Actual editing UX and GLB re-export/reload feel.

This is a simple material-blockout slice, not final art or a whole Stage environment.
There are no textures, streaming, LOD, navmesh or gameplay integration.
A selected semantic reference is not automatically moved when a visual mesh is edited.
Edits requiring intentional alignment must be authored explicitly.

Next minimum step: user reviews and corrects this bounded slice's proportions/heights and workflow.
Only after that approval should a subsequent phase consider another small environment area or
a stable contract for selective future mainline absorption. No mainline absorption is implemented here.

**Final: ThreeJSDEV-ENV-01 PARTIAL PASS — technical gates PASS; USER VISUAL REVIEW PENDING.**