# ThreeJSDEV Playable ENV Recovery
**TECHNICAL RECOVERY PASS / USER VISUAL REVIEW REQUIRED**

## 1. Repository / baseline / completion
Repository series341000Lunar/RicochetAngles_3D_RND, branch dcc-00-semantic-authoring.
Starting local and remote HEAD: b3924a902db0206dbbdbf258cc50cf1ed20db4bf; clean.
Completion commit subject: "feat: recover static ENV art in playable Multi-Asset stage".
The final response records the verified final local/remote SHA for the commit containing this report. No main merge.

## 2. Exact playable entry
spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html, served by existing Launch_MultiAsset_RND.bat on localhost8765. START enters PLAYING.
No DCC review surface is described as the Current Stage in this recovery.

## 3. Modified files
The only edited existing runtime file is that playable HTML: two startup lines import/call the static visual loader after existing vehicle asset preparation.
New files: spike/rnd_static_environment.js; dcc00/env01/playable_environment.py; Export_Playable_ENV.bat/.ps1; bounded capture/controls/isolation/source/regression evidence scripts under dcc00/tests; this report, Korean review guide and aggregate evidence.
No navigation, editor, addon, schema or existing regression body was edited.

## 4. Gameplay/map structure
WORLD remains1280x3600 with initialOffsetY1440. makePlayer/makeBoss, OBSTACLE_CANDIDATES, makeObstacles, resetGame, spawnRndActors, camera follow, combat, HP, Focus, Q, weakpoints and projectile authority are unchanged.
No layout JSON, serialization, map round-trip, generic editor or map system was introduced.

## 5. Current source used
Current manual dcc00/workspace/env01/authoring.blend and geometry.glb were backed up before work.
Source blend SHA256 ab171e622e5683196661df17f51145c7c8f9ce8f1995437b4c26b9aa0a0fdd9e.
Source GLB SHA256 dcb1a2a0467f4702b0e495f118828de8a0bafffd3d0b9853144536f1e3a16722.
These differ from the earlier art report; no historical version was restored.
All212 current static mesh objects were copied from the saved Blender source; no H5E semantic scene/source JSON was copied into the active derivative scene.

## 6. Preservation
Exact entry .blend/GLB/map copies and pre-change playable HTML: dcc00/test-output/playable-env-recovery-20260925/before/.
preservation.json records protected files. source-verification.json confirms their hashes still match,212 static objects reload, five reference-only spawn guides exist, and no H5E semantic scene/object data is active.
QA originals and rollback copies remain on disk. Final derivative artifacts are ignored local production files, not Git fixtures.

## 7. Retarget
Separate visual derivative: dcc00/workspace/playable-env/authoring.blend and geometry.glb. This is not a new Stage/map authority.
Existing art was rotated on the ground plane and initially scaled0.7 for this authored composition, then wall/bunker/circular cover/crates/barrels were individually repositioned using actual playable world/spawn/road positions.
Existing ground/road meshes were reshaped for a bounded longitudinal area; the road follows the existing centerline X640 and visual width230. Original collision obstacles are still visible and authoritative.
No H5E stable ID, map bounds or route is used as playable input.

## 8. Runtime integration
Same scene, renderer, WebGL context, lights, camera and render loop.
loadPlayableEnvironment adds one GLB root before startup READY; no existing child is hidden. DCC review iframes skip this added layer.
GLTF parsing's asynchronous UUID allocation runs on a temporary visual random stream while startup blocks gameplay input; the original random function is restored in finally before START. Vehicle asset loads finish first.
Missing/invalid GLB fails soft to the original playable stage. The full-page reload pattern is used; no live reload system or extra UI was introduced.
Ground/flat overlays receive shadows without casting a second near-coplanar ground shadow; volumetric art casts shadows normally.

## 9. Coordinates/scale
Existing conversion retained: Blender(x,-y,height)/14 -> native glTF(x,height,y)/14 -> root scalar14.
The0.7 art resize is baked composition work, not a new world-scale contract.
Final mesh bounds from saved Blender: X20.0000005–1260, Y1099.99997–2499.99997, height-22.399999–154.490465. Below-ground rock/knoll parts are intentional visual geometry, not terrain collision.
Semantic anchors are excluded. Reference-only spawn empties are excluded by the existing bounded collection exporter.

## 10. Actual gameplay
playable_env_controls.cjs starts the actual entry and drives keyboard/mouse input. W/S, A/D, turret aim, fire, Shift Focus, Q targeting/confirm, Enemy/Boss activity, restart, existing obstacle separation, vehicle/environment coexistence and reload→START passed; no page errors.
Separate real-time requestAnimationFrame execution was used for final screenshots; game time advances with state PLAYING and staticEnvironment READY. Not a paused review capture.
The initial A/D assertion assumed forward steering while still coasting backward; corrected the test setup using the existing restart key, preserving Legacy reverse-steering behavior.

## 11. Isolation / existing regressions
Same startup seed: random call count3, next random0.35108551452867687 for before/after/missing asset.
Same complete initial game hash and600-frame complete game traces across all three:
700aced8ace6cde44845c357e8ead8a8fdc62ebb5e02bea71e5cd841d7d3c7c4.
Trace includes player/Boss/HP/projectiles/obstacles/timers/Focus/Q/restart.
Existing G1 interactions PASS. Existing G2 spatial PASS. Existing G3 Canvas PASS (including Focus/Bullet Time/Boss/restart and Three/Canvas toggle).
Regression bodies were reused with only evidence destinations redirected in memory; prior reports were not overwritten.
Initial test waits accidentally used RAF polling while RAF was disabled for deterministic stepping; changed test polling to timer100ms. Product startup did not fail.

## 12. Actual art iteration / export
First retarget export loaded in real playable runtime and START: PLAYING,212 meshes.
Inspected first-playable-75.png. Refine pass moved/lowered wall, moved bunker, separated crates, corrected road polygon normals, reexported. Browser reload→START showed changed art.
Final bounds review moved the bunker soil apron90units left, without gameplay edits.
Final derivative GLB SHA2564c1f671edc72e8a8fb796ef52cd6f463950fdff76f9da4229ab4d7841cb63f3a; source blend SHA2564824ddbbcc75d1994b469633e2e1549971ad527aa7937667ad85393e9a4546b0.
The unchanged env01.export_glb function is called with scoped derivative ROOT/COLLECTION, restored afterward. Revision checks and atomic replacement remain in use.
Export_Playable_ENV.bat was executed successfully. A native Blender Text entry "Export Playable ENV" also calls this script in-session without opening/replacing another scene; its presence survives save/reload. Human GUI Text-editor usage remains a UX review item.
For batch export, save/close before exporting and reopen afterward to refresh output revision. In-session Text export updates the active scene revision and saves it.

## 13. Screenshots
dcc00/test-output/playable-env-recovery-20260925/playable-75.png: actual gameplay.
dcc00/test-output/playable-env-recovery-20260925/playable-90.png: actual spatial reference.
Both inspected; existing HUD and panel remain. Some world parts naturally lie outside the player-follow viewport.

## 14. Untouched scope
Protected hashes: ENV01 original blend/GLB/map, DCC-MAP edited.json, h5e_map.py, canonical_preview.js, map_reference.js, env01_preview.js, rnd_gameplay.js and rnd_actors.js.
No H5E import, sync, map export, canonical source write, Mainline or Unity integration.
DCC-MAP PASS retained; H5E KEEP/HOLD; original ENV review HISTORICAL/QA.

## 15. Limitations / visual gate
Static art has no new collisions, projectile hits, AI blocking or spawn authority; crossing a visual wall remains possible. Existing obstacles alone control gameplay collisions.
Bounded art recovery, not a completed map. Legacy layout remains hardcoded. Canvas fallback has no static GLB art.
Artifacts are local ignored assets: another checkout without them starts without static ENV, by design.
No full-stage performance or visual approval claimed. Environment scale, road width, wall height, bunker size, vehicle proportions, prop spacing, density,75-degree readability and art direction remain USER VISUAL REVIEW REQUIRED.
Native Text export GUI feel is not human-approved. Navigation remains a separate issue.

## 16. Commit / push and gate answers
Changes are committed/pushed only on the current feature branch; verify final SHA in completion response.
A playable launch PASS; B static ENV visible PASS; C existing interactions PASS; D authority unchanged PASS; E Blender→GLB→playable iteration PASS; F75/90 captures PASS; G protected scope unchanged PASS; H manual sources/backups preserved PASS.
Q1 yes, art appears in actual MULTI_ASSET_RND. Q2 yes, existing gameplay runs concurrently. Q3 no Legacy layout redesign. Q4 no H5E/ENV01 map input. Q5 yes, edit/export/reload/START loop verified. Q6 visual proportions/density/readability/direction remain user decisions.
