# COASTAL BATTERY GLB DERIVATIVE

**PASS WITH CONDITIONS — Max → evaluated FBX → Blender Bridge → GLB.**
**Hierarchy / functional semantic nodes / actual Browser: PASS.**
**Final derivative user visual review REQUIRED. P6 runtime integration NOT STARTED.**

## Source Max
- Current clean saved live scene CoastalBattery_Master_v005.max, PID64104,79 nodes. Selection was based on live scene identity, not highest filename.
- UNC: \\192.168.87.201\Projects\RicochetAngles\00_Asset\MODEL\Stage1_CostalBattery\CoastalBattery_Master_v005.max
- SHA-256: b2eca1a898cc1ae6ba71c31eac6b10abd09e8ec2d33a4f6b383ec3d286a18569
- Timestamp UTC: 2026-10-09T13:20:20.5020000Z
- Max2026.3.4 / VRay source preserved; system meters×1; source spatial root identity; neutral frame0 /30fps /range0–260.
- Asset Addendum declares Functional Master reviewed. New GLB final-art/production approval is separate.

## Packaging
SHARED + COUPLER_N + COUPLER_S.

| Component | Bytes | Nodes | Meshes | Triangles | Materials |
|---|---:|---:|---:|---:|---:|
| SHARED | 202656 | 48 | 42 | 4072 | 4 |
| COUPLER_N | 71212 | 11 | 10 | 1336 | 3 |
| COUPLER_S | 71208 | 11 | 10 | 1336 | 3 |

Delivery: \\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV\Stage1_CostalBattery
Static GLBs in export; editable static/reference .blend in source; actual viewport/WebGL captures in preview; exact contracts/manifests in notes.

Measured kit345,076B versus complete-N + complete-S546,212B: saves201,136B (36.8%). Two loads per selected configuration versus one complete file. Actual complete comparisons retained as evidence only in validation/packaging_comparison. No production consumer/general loader framework change.

Component GLTF scene wrappers attach with identity under a common asset-instance group. Each source root already carries its source offset; do not zero it or apply the offset twice. Preserve authored names and use component/instance-qualified lookup. Coupler roots remain independent of the source main root.

**Placement condition:** source has one main body plus detached N/S couplers mirrored around MaxY=-20. A second main-body world pose is not specified. S composition tests source offsets/handed mechanism, not an approved complete battlefield S layout. P6 must choose placement; no second body was authored.

## A / B0 / B1 / C
A: actual v005 evaluated geometry, source corner normals/material IDs, exact semantic local/world matrices and53 sampled controller poses.
B0 raw Autodesk FBX:70 names/parents/node neutral matrices match, but **32/62 mesh triangle correspondences FAIL**. Raw geometry transfer not approved.
First evaluated hierarchical FBX:18 world-placement correspondence failures, retained as negative control.
Evaluated-flat FBX:62/62 mesh geometry correspondences PASS /6,744 source triangles. Flat graph is an interchange geometry carrier. Offline Bridge reconstruction uses exact Max source matrices, not guessed/rounded coordinates.
B1: all70 names/parents/pivots retained, source geometry unchanged; no static aggregation. Source corner normals restored; source IDs1–4 converted to PBR.
C: actual fresh-scene final GLB reimport. Position error max0m; neutral matrix error0; normal angle max0.00280119581° (<0.1°). Material correspondence PASS.
Final negative scale0 /invalid matrix0 /invalid positions0 /invalid or zero normals0 /duplicate names0.
No source UVs on62 runtime meshes. No new textures/bake/skins/cameras/lights/animation/instancing/compression/quantization or external buffer dependency.
SHARED retains15 zero-area triangles from source ngon triangulation. Undefined source zero-normal angles are excluded; surface shape is unchanged. Conversion does not certify this inherited topology as optimized.
Final GLBs require no runtime geometry rebase/hierarchy recovery. Matrix sidecars are offline conversion/validation inputs.

This is **Max FBX → Blender Bridge Export**. Autodesk Built-in Native GLB Direct and Khronos Plugin Direct: **NOT RUN** for this asset.

## Hierarchy / functional semantic nodes
All70 source semantic/detail nodes preserved, including crosshead/trunnions, both recoil/barrel/muzzle/breech/sleeve chains, readiness rails/sliders/inserts, full Reload branch, N/S Coupler/Service Trunk/lids/foundations/gear teeth. Three production components cover48+11+11 nodes and42+10+10 meshes.

- Turret yaw±25°: rotating gun structures/readiness follow; fixed base/casemate/reloader/N/S Coupler/service trunks unchanged.
- Elevation source0°/32° endpoints: cradle/recoil/barrel chains follow; fixed/yaw bases do not pitch. Source mechanical limits beyond tests UNVERIFIED.
- Recoil A/B independent; other chain unchanged.
- Readiness A/B min/mid/max independent. Midpoint is a declared diagnostic between actual source endpoints, not new gameplay/mechanical authority.
- PRE_OPEN /OPEN /CLOSING N/S; DIRECT /INDIRECT; source OFFLINE; reloader operational and combined yaw/pitch/recoil tested.
- RAMMER_B/OFFLINE source uses coupled TRS; it was not reduced to an assumed single linear axis.
-77 Blender/GLB cases PASS; same-scene neutral reset0.
- Actual Max rigid-geometry checks14 poses: max3.96090672e-06m.
- N/S reflection53 sampled frames: max5.24520874e-06m; source-S winding disagreements0.
- Final S meshes are unique evaluated geometry with positive transforms. Source Reference+Mirror+Expression architecture remains intact in Max.

## MUZZLE A/B
BARREL_A/B parent relation, finite matrix, tip-plane center, location and forward checked independently.
Tip center error max1.19732012e-07m (<0.001m).
Uniform positive-determinant basis maps source−X gun forward/Z-up to GLB+X forward/Y-up, including all functional travel axes.
Approximate neutral anchors: (14.32,4.15,+1.10)/(14.32,4.15,−1.10)m; GLB local+X forward. Exact values are in SEMANTIC_BINDING.json. Rounded report values are not authority.
Presentation anchors only; gameplay projectile/collision origin untouched.

## Animation
Master keys/controllers/expressions/reference connections unchanged by hash and live journal.
Static GLB baked clips0.
Separate CoastalBattery_ANIM_REFERENCE.blend:53 actual Max-evaluated TRS samples0–260f at5f/30fps. Ordinary save/reopen sampled pose matrix error<=4.7683716e-6. Inter-sample interpolation is approximate/UNVERIFIED; not native Max controllers. DCC frames are not scheduler timing.
Animated validation GLB NOT CREATED (optional). No animation-end event gameplay authority.

## Browser
**PASS — actual local Three.js r160 /GLTFLoader, WebGL2, NVIDIA RTX5090 ANGLE D3D11.** No software/headless/CDN.
Initial loaded neutral matrices checked before diagnostic overrides.77 pose cases PASS; maximum matrix error2.09888743e-08; dual muzzle directions <=0.1°; neutral reset0.
N/S visibility/packaging, shared main clone transform isolation/removal and N re-load PASS. Reload semantic count70. Shared mesh/material data not disposed per clone; extended disposal/stress/performance tests NOT RUN.
Actual top/side/quarter and mechanism screenshots inspected. Larger scene-frustum shadow acne resolved in harness only using bias−0.001/normalBias0.05; initial captures retained. Asset geometry/materials unchanged.
Viewer while local server runs: http://127.0.0.1:55450/
Restart validation/server.py for a new local port. Existing H5E/ThreeJSDEV consumers untouched.

## Original preservation / editable Bridge
**PASS —57 original source-folder SHA-256 unchanged.** v003/v004/v005, source FBX/USD, TASK/RUN_LOG, work/scripts and references retained.
Live Max79 nodes /journal6155 unchanged /dirty=false. Blender startup Scene Cube/Camera/Light retained; only new task scenes added.
Delivered static and sampled-reference .blend saved by ordinary save_as_mainfile and re-opened in isolated Blender; correct active70-node/62-mesh asset scene. Static actions0 /reference sampled actions70. Library staging files are not editable delivery.
Input locks bind Max-copy/FBX/sidecars to exact hashes. Conversion refuses existing export filenames; replay in a fresh scoped revision, never reuse stale sidecars after source changes.

## Excluded production nodes
- Plane001 (CB_REF_User)
- Cylinder001 (CB_REF_User)
- Box001 (CB_REF_User)
- REVIEW_HERO_ISO (CB_ReviewCameras)
- REVIEW_TOP (CB_ReviewCameras)
- REVIEW_FRONT_WEST (CB_ReviewCameras)
- REVIEW_SIDE_SOUTH (CB_ReviewCameras)
- REVIEW_GAMEPLAY_75 (CB_ReviewCameras)
- COUPLER_MIRROR_PLANE (COUPLER_S)

Reference/marker layer and previous source logs establish provenance. Mirror-plane driver retained in Max; final static S is evaluated and reference animation is sampled, so production hierarchy needs no driver.

## Conditions / adjustments
1. Asset Addendum1–4 PBR roles overrides generic1–3 target; all4 source roles retained.
2. Addendum says clean N/S derivatives; actual Max still has Reference+Mirror+Expression. Evaluated unique GLB geometry satisfies clean runtime requirement without destructive Reset XForm on the keyed source.
3. Run006 source log reports v005 contacts: neutral RING_N↔RELOAD_FOUNDATION0.12m; OPEN HOOD_L_N↔CONCRETE_CASEMATE0.48m; OFFLINE GEAR_TEETH_N↔HOOD_L_N0.058m. **SOURCE_LOG_REPORTED /NOT REMEASURED_THIS_JOB**. Approved source shape preserved; technical export PASS does not certify contact clearance.
4. S body battlefield placement not specified; retain original coupler offsets and leave P6 placement decision separate.
5. Full-angle/all-stroke/all-state clearance UNVERIFIED;15 inherited zero-area faces retained.
6. Final derivative Art/Canonical/Production approval not granted by this job; user visual review REQUIRED.
7. Resource stress/performance and native-animation controller transfer not approved by sampled functional tests.

## P6 runtime integration
**NOT STARTED.** No H5E consumer, hitbox/collision/damage/weakpoint, Coupler/reloader gameplay target mapping, scheduler/PRE_OPEN/readiness/Indirect timing, registry or Unity changes.
