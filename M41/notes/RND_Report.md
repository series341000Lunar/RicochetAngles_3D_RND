# M41 Real-Asset Three.js Vertical Slice + Render Stress Test

Date: 2026-09-20
Status: R&D implementation and automated browser verification COMPLETE.
Scope: 01_RND/ThreeJSDEV only. Formal production adoption is not implied.

## 1. Source and modification scope

Source: Z:/RicochetAngles/00_Asset/MODEL/M41/ForHTML/RigPrototype_v01/M41_HTMLRigPrototype_v01.blend

Existing stylized M41 shape, long turret and curved mantlet are retained.
This derivative bakes evaluated geometry, reduces bevel segments to one, removes tiny bolts/straps/handles and track shoes/pads.
Each track is one static mesh containing a continuous band and simplified wheels.
Mantlet belongs to TURRET; GUN contains barrel and muzzle brake.
Canonical source and original Primitive Spike were hash-checked unchanged.

## 2. Deliverables and cost

- [Blender derivative](../source/M41_RND_v01.blend)
- [Runtime GLB](../export/M41_RND_v01.glb)
- Size: 866,348 bytes (846.04 KiB)
- Meshes: 5
- Triangles: 17,078
- Materials: 3 constant base-color materials; metallic 0, roughness 0.85
- Texture/image count: 0; dimensions N/A
- Skeleton, skin, armature, animation, morph target: none

| Mesh | Triangles |
|---|---:|
| HULL | 7,460 |
| TRACK_L | 1,688 |
| TRACK_R | 1,688 |
| TURRET | 5,122 |
| GUN | 1,120 |

This is a first draw-call baseline, not a minimum-triangle production optimization.

## 3. Hierarchy and pivots

    M41_ROOT
    └─ HULL
       ├─ TRACK_L
       ├─ TRACK_R
       └─ TURRET_PIVOT
          └─ TURRET
             └─ GUN

Root is the source ground-contact center. Turret ring and gun trunnion are retained.
Derivative Blender: +X forward / +Z up, meters.
GLB: +X forward / +Y up, meters.
Source +Y forward was rotated -90 degrees around Blender Z with geometry and pivots transformed together.
No runtime orientation correction is needed.

GLB turret pivot relative to HULL: approximately (-0.100, 1.883, 0) m.
GUN relative to TURRET: approximately (1.115, 0.385, 0) m.
Gun longitudinal/muzzle direction: +X. No negative scale.
Full neutral bounds: approximately 6.260 × 3.470 × 2.850 m (GLB X/Y/Z).

## 4. Three.js integration

[GLB Spike](../../spike/RicochetAngles_Legacy_ThreeJS_GLBSPIKE.html) retains the entire original classic gameplay script verbatim.
Only the independent renderer module and its panel are extended. Boss stays Primitive.

Three.js and standard GLTFLoader are pinned to 0.160.1 under spike/vendor with MIT license and provenance hashes.
Loader import paths use local modules. One isolated core patch changes UUID generation from Math.random to crypto.getRandomValues so asynchronous loading cannot consume gameplay RNG.
Loader parsing/rendering algorithms are unchanged. See spike/vendor/provenance.json.
API reference: https://threejs.org/docs/#examples/en/loaders/GLTFLoader

Loading is asynchronous; gameplay continues during loading and GLB failure retains the Primitive player.
Imported materials use base-color MeshStandardMaterial; the existing Hemisphere/Directional lights provide world-fixed shading.

Adapter:
- Game X → Three X, Game Y → Three Z, height → Three Y.
- Visual scale only: 14 legacy world units/m; hull length about 65.16 units vs Primitive 62.
- HULL.rotation.y = -player.angle.
- TURRET_PIVOT.rotation.y = -(player.turretAngle - player.angle).
- GUN fully inherits yaw; no elevation or recoil.
- alive / hitFlash affects player-only material copies, leaving stress materials unchanged.

Visual geometry does not redefine hitboxes or legacy shell spawn distance.

## 5. P stress mode

P keydown adds one hierarchy clone, including browser repeat.
P is intercepted before legacy input and does not set input.keys.p.
Geometry/material resources are shared; Object3D hierarchies are distinct.
Dummies have no actor registration, collision, HP, AI, target, shooting or gameplay update.

Neutral full-model bounds including the gun set grid spacing:
- X: about 118.314 legacy units (bounds × 1.35)
- Z: about 57.855 legacy units (bounds × 1.45)
- 10 columns, starting near viewport top-left below the main HUD.
- Positions follow the existing camera every rendered frame.
- Conservative capacity at 1280×720: 100. Extra rows continue below view with a panel warning.
- No automatic shrink, overlap or instancing.

These are actual Scene meshes with lighting and cast/receive shadows.
Shadow checkbox updates both flags and renderer shadow map.
R resets gameplay while preserving stress clones.
Clear stress removes clones without disposing shared geometry/material resources.
Stats show FPS, calls, meshes, DPR, triangles, shadow state and stress count.

## 6. Browser results

Windows Chrome 153 headless, ANGLE / NVIDIA GeForce RTX 5090 / Direct3D11.
1280×720, DPR 1, 90-degree camera.
Approximately 1.8 seconds per count; panel samples roughly every 0.6 seconds.
Short vsync-capped samples, not maximum-throughput or sustained/cross-device certification.

| Stress tanks | Shadow | FPS | Draw calls | Scene meshes | Triangles (passes included) |
|---:|:---:|---:|---:|---:|---:|
| 0 | ON | 60 | 45 | 32 | 34,614 |
| 10 | ON | 60 | 145 | 82 | 376,174 |
| 20 | ON | 60 | 245 | 132 | 717,734 |
| 40 | ON | 60 | 445 | 232 | 1,400,854 |
| 80 | ON | 60 | 845 | 432 | 2,767,094 |
| 0 | OFF | 60 | 20 | 32 | 17,252 |
| 10 | OFF | 60 | 70 | 82 | 188,032 |
| 20 | OFF | 60 | 120 | 132 | 358,812 |
| 40 | OFF | 60 | 220 | 232 | 700,372 |
| 80 | OFF | 60 | 420 | 432 | 1,383,492 |

Calls/triangles include shadow passes. Scene meshes include player, boss, obstacles and pooled shells, not only visible meshes.
80 dummies add 400 meshes. Each tank adds approximately 10 calls with shadows, 5 without shadows.

## 7. Verification

PASS:
- Export/fresh Blender import: hierarchy, pivot positions and dimensions match within 0.0001 m.
- GLB structure: 5 meshes, 3 materials, no textures/skins/animations/morph targets; positive scales.
- Actual GLB WebGL isometric/top/side captures inspected: hull, long turret, curved mantlet, gun and two tracks present.
- Hull and turret world direction match gameplay at nonzero independent angles.
- Actual W/D input movement and mouse aiming.
- Actual held click generates a shell, advances traveled distance and starts reload.
- Controlled browser scenarios: obstacle overlap resolution, shell damage, penetration and ricochet calculations.
- Controlled boss weakpoint/engine penetration sequence reaches HP 0 / won; player penetration lowers HP 5→4.
- R restores player HP 5 / boss HP 10 and retains stress count.
- P once adds one dummy. Repeated addition preserves serialized game and consumes zero gameplay RNG calls.
- Geometry/material shared, hierarchy distinct.
- Camera displacement preserves stress grid viewport offsets.
- Shadow ON/OFF flags and visible ground shadows.
- 960×800 resize: Canvas rectangles remain aligned.
- Blocked GLB request retains enabled Primitive player and playing state.
- Async GLTF parsing consumes zero Math.random calls after UUID isolation.
- Render leaves serialized gameplay unchanged.
- Browser pageerror count: 0.

## 8. Unresolved limits

- Automated input and controlled scenarios are not a human full-combat playthrough.
- Ricochet is a calculation check, not exhaustive bank-shot play.
- Blender MCP was unavailable: background Blender exported/reimported; visual inspection used actual GLB WebGL views, not an interactive Blender viewport.
- 80/85-degree modes retain existing experimental height parallax; 90 degrees is the verified alignment baseline.
- Beyond viewport capacity, offscreen culling affects draw-call interpretation.
- Existing HUD or bottom-right panel can cover models.
- 14 units/m is R&D visual tuning, not production scale adoption. Collider/muzzle offsets remain gameplay authority.
- Long-duration frame-time, lower-end GPU, mobile and cross-browser performance remain UNVERIFIED.

## 9. Next R&D

1. Sustained frame-time on target lower-spec hardware and DPR 1.5.
2. Visual silhouette versus unchanged hitboxes and shell spawn point.
3. Decide whether tilted views are useful before resolving height alignment.
4. Based on measurements, simplify remaining small geometry or compare instancing as a separate mode.

## 10. Evidence

- [Reimport validation](asset_validation.json)
- [Structure and source preservation](final_validation.json)
- [Gameplay script preservation](code_preservation.json)
- [Browser and stress samples](browser_validation.json)
- [Combat and loader checks](browser_additional_validation.json)
- [Isometric](../preview/GLB_isometric.png)
- [Side](../preview/GLB_side.png)
- [Top](../preview/GLB_top.png)
- [80 tanks](../preview/stress_80.png)

Build/test scripts are retained here for traceability. Asset and Spike build scripts refuse to overwrite existing versioned outputs.
