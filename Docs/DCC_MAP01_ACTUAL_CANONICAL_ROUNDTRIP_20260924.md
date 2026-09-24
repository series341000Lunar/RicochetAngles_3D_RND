# DCC-MAP-01 — Actual Canonical Stage Round-trip
Date: 2026-09-24 (Asia/Seoul)

**DCC-MAP-01 PASS — mandatory Gates A/B/C/D.**
Optional Gate E (static environment GLB) was not executed.
USER UX GATE remains PENDING. No production or long-term spatial authority promotion.

## Baseline and original source
- Branch: dcc-00-semantic-authoring; initial HEAD: 3cccba05029dc3ef279037d0d3b6e7a894570383.
- Initial working tree: clean. This report, adapter and tests are committed together on that feature branch.
- main is unchanged at b61739ee43ff733da12a4a0f3e5e593b01daabe3.
- Blender: C:/Program Files/Blender Foundation/Blender 5.2/blender.exe, **5.2.1 LTS**, build 9e2066aef7ef.
- Actual source: C:/Users/LunarGagarin/Documents/Topdown Tank/maps/H5E_PILOT_MAP_PASS2_14W_v0.1.json.
- That local checkout's origin is https://github.com/series341000Lunar/steel-angle-prototype.git, HEAD 37e62b5091b2312e18e681dd9077fb7ec969304e.
- Read the current original directly, not an attachment, fixture, embedded runtime string or MainlineReference copy.
- Original SHA-256 before/after: 9346ff550f79f1f91c306ff3fcc9bd1959c3170dd9a7f8ea055cda91097b56d5.
- Mainline map/code and Git working tree remain unchanged. No mainline commit or production deployment.

## Existing pipeline and bounded adapter
The existing DCC-00 core accepts ra-dcc00-authoring-v0 and a fixed 1280 x 3600 testbed at 14 units/m.
It cannot directly import h5e-map-v0.2. Its data schema, Tier A/B/C IDs, unknown preservation,
tombstones, native presentation timing, asset registry and HTTP revision contract remain intact.

Adapter: dcc00/blender_addon/ricochetangles_dcc00/h5e_map.py.
- import_map(): validates the H5E contract, stores the complete original document and hash,
  creates a separate review scene. Full payload remains available in the scene.
- export_document(): checks stable IDs, collection membership, native reference shapes and transforms,
  applies only explicit XY deltas to a deep JSON copy of the original.
- save_map(): confines output to dcc00/workspace/dcc-map-01; checks source hash and output revision,
  writes atomically, never writes the imported source path.
- Content-addressed source snapshot is evidence only, not preferred over the local original.
- Existing addon, floating editor and selection synchronization are reused.
  Canonical records have their own list and translation Inspector in the existing window.
- Semantic anchors and native POLY Curve reference geometry remain separate.
  Canonical curves do not become DCC-00 presentation-timing paths.
- DCC-00 operators are unavailable in a canonical scene to prevent accidental testbed Save/Reload.
  Original DCC-00 scenes retain the existing editing paths.
- Duplicate/missing/changed IDs, locked-record movement, shape edits, rotation/scale/Z edits,
  unsupported pivots and stale source/output block export.
- No canonical add/delete is introduced. Missing records never imply deletion.
  Existing DCC-00 tombstone and anonymous decoration behavior is unchanged.

## Coordinate audit
| Canonical H5E | Blender review | Existing Three.js reference layer |
|---|---|---|
| X right | X / 14 | X |
| Y down | -Y / 14 | Z |
| No authored height | Z = 0 | Y = 0 (reference lines lifted 2 units) |
| Top-left (0,0) | (0,0,0) | (0,0,0) |
| 0 degrees along +X | +X | +X |
| Clockwise degrees | negative radians around Z | negative radians around Y |

14 H5E units per Blender unit is the existing DCC-00 **review scale**, not an authoritative
production H5E-to-meter definition. RECT/CIRCLE use CENTER; POLYLINE uses absolute WORLD_POINTS
without a second rotation. Actual source has no nonzero WORLD_POINTS rotation; unsupported cases block.
Widths/radii/points use the same scale without additional offsets.

Untouched serialized coordinates are retained exactly instead of being regenerated from float32.
Intentional XY translation applies inverse conversion relative to the imported float baseline.

## Gates and measured results
| Gate | Result | Evidence |
|---|---|---|
| A canonical import | PASS | 57 objects, 130 markers, 10 annotations; 197 stable IDs; 6 zones, 5 layers |
| B NO-EDIT | PASS | Whole-document exact structural equality and tolerance equality; export drift 0 |
| C one edit | PASS | Only /objects/15/geometry/x changed; all other data unchanged |
| D ThreeJSDEV | PASS | Existing renderer, 197 records, payload equality, measured position change |
| E static GLB | NOT RUN | Optional, deferred |

NO-EDIT ADD=0, REMOVE=0, IDENTITY CHANGE=0. Equality includes metadata, world, axes, zones, layers,
collection order/membership, IDs, geometry, collision/LOS, actor/checkpoint/camera and unknown fields.
Additional nested unknown root/record/point payload preservation was tested.

Maximum Blender representation error: **0.000732421875 H5E units**.
NO-EDIT JSON export error: **0**, exact.
Declared Blender numeric tolerance: **0.002 H5E units**.

Selected: H5E_P1_TUT_COVER_01 (Tutorial Upper Cover), unlocked/editable static cover.
Visual guides/progress arrows are locked and were not unlocked to manufacture a test.
This isolated static placement avoids changing actor definitions, boss, trigger or checkpoint logic.
Only an R&D working copy changes; production collision tuning is untouched.

Requested X delta: +40. Actual: **+40.00006103515625**.
X: 3050 -> 3090.0000610351562. Intended-delta error: 0.00006103515625.
Y=390, width=340, height=80, rotation=-15 degrees, ID, collection, layer, zone, collision/LOS,
notes and every other field are unchanged. Exact +40 is not claimed; error is within tolerance.

## Runtime and UI verification
Existing dcc00/html/testbed.html?mode=canonical reuses the same iframe, scene, camera, renderer and vendor.
An opt-in reference layer loads no-edit.json or edited.json; demo scene visuals are hidden in this view.
No WORLD/gameplay arrays, collision routines, actor factories or schedulers are changed.
Runtime stays READY (paused); game-state serialization before/after is equal.

Full canonical record payload is retained in visual userData.
Tests compare the loaded document to the Blender export and check ID, role, metadata and position.
Entire-map and focused before/after screenshots were captured; selected cover is highlighted.
This proves reference-layer spatial compatibility, not playable mainline Stage integration.

A separate foreground Blender instance tested import from the existing floating editor,
shared scene, list/Inspector selection, export, DCC-00 operator exclusion and safe window close.
Native screenshots were inspected. The user's existing session was not edited.
Blender save/reopen and exported JSON reimport also pass.

## Automated checks and regression caveat
- h5e_roundtrip.py: PASS; no-edit, one edit, persistence, reimport, unknown fields and nine block cases.
- h5e_browser.cjs: PASS; actual Chrome/WebGL, no page errors; default DCC-00 mode and actual GLB previews also pass.
- h5e_mainline_validate.cjs: PASS; current local mainline tools/h5e-map-editor-core.js validateMap
  used directly read-only on both outputs, zero errors and zero warnings.
- h5e_native.py: PASS; Blender 5.2.1 native UI, stderr empty.
- Existing contract/HTTP tests: **13 PASS**, including stale workspace and tombstones.
- Existing G1 interactions: PASS.
- Current runtime renderer isolation: PASS, 600 frames each for LEGACY and TIGER_REMAP.
- Original tests/test_g1_isolation.cjs historical comparison: **FAIL / pre-existing snapshot mismatch**.
  The old before_g1.html loads current rnd_gameplay.js. Its detonateRndHE needs getWeakpointShape,
  which is absent from that old HTML: ReferenceError: getWeakpointShape is not defined
  at rnd_gameplay.js:225:110.
  Spike code and original G1 tests still byte-match starting HEAD; this test never loads DCC-MAP-01 code.
  h5e_current_isolation.cjs explicitly excludes that incompatible snapshot and does not claim
  legacyExact or historical functionsUnchanged. This is not reported as a full G1 PASS.
- Stock Blender brush-library relative-path warnings on .blend save do not affect canonical data.

## Evidence and reproduction
Tracked aggregate: Docs/DCC_MAP01_VALIDATION_20260924.json.

Local generated JSON (ignored, retained on disk):
- dcc00/workspace/dcc-map-01/source-9346ff550f79f1f91c306ff3fcc9bd1959c3170dd9a7f8ea055cda91097b56d5.json
- dcc00/workspace/dcc-map-01/no-edit.json
- dcc00/workspace/dcc-map-01/edited.json

Local dcc00/test-output/dcc-map-01/:
- canonical-review.blend
- blender.json, browser.json, native.json, mainline-parser.json
- canonical-editor.png, canonical-blender.png
- canonical-entire-map.png, canonical-before.png, canonical-after.png
- G1_current_isolation.json, G1_interactions.json

Reproduce with installed Blender 5.2, Python and Node:
1. blender --background --factory-startup --python-exit-code 1 --python dcc00/tests/h5e_roundtrip.py
2. python dcc00/server/authoring_server.py --port 18767
3. node dcc00/tests/h5e_browser.cjs
4. node dcc00/tests/h5e_mainline_validate.cjs
5. blender --factory-startup --enable-event-simulate --python dcc00/tests/h5e_native.py
6. python dcc00/tests/test_contract.py

Tests read the local original, not a checked-in canonical fixture.
Writes are confined to this repository's ignored working/evidence paths.

## Hands-on use and limitations
1. Launch_DCC00_Authoring.bat activates the current addon with installed Blender 5.2.
2. Existing floating editor or N-panel Canonical Review:
   **Import Canonical H5E Map (Read Only)**, choose the local original path above.
3. Import creates a separate scene shared by the windows and frames the full map.
4. Select an unlocked canonical anchor and translate XY. Other payload is retained.
5. **Export H5E Working Copy** writes dcc00/workspace/dcc-map-01/edited.json.
6. Native File > Save As preserves the review in a separate .blend.
7. With the normal authoring server running, open
   http://127.0.0.1:8766/dcc00/html/testbed.html?mode=canonical and choose Blender edit.

This is a bounded translation adapter, not a complete canonical semantic editor.
Arbitrary rotation/scale/topology edits, add/delete, timeline conversion, gameplay execution,
automatic merge or production actor/checkpoint integration are not claimed.
On stale source/output, preserve .blend before reimport; no automatic merge/overwrite.
The HTML editor remains the typed semantic editor/fallback.
Static GLB was not attempted. Next minimal step: user reviews the actual canonical spatial slice,
then optionally qualifies one explicitly scoped static environment export.
USER UX GATE remains PENDING; historical DCC-00 results remain valid.