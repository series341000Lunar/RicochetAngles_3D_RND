# Panzer3 GLB derivative v01 — build and validation

Date: 2026-09-20
Status: TECHNICAL PASS / VISUAL PASS
Scope: Blender derivative, GLB export, fresh-Blender re-import, and validation images only. HTML loading and game integration were not performed.

## Source selection and protection

- Source: `Z:\RicochetAngles\00_Asset\MODEL\Panzer3\Panzer3_AusfN_v01.blend`
- Resolved source: `\\192.168.87.201\Projects\RicochetAngles\00_Asset\MODEL\Panzer3\Panzer3_AusfN_v01.blend`
- Selection reason: this is the existing user-approved/canonical Panzer3 geometry, already metric and already carrying the approved vehicle root and turret/gun/muzzle pivots.
- Source SHA-256 before/after: `c50e1ca3c9029fdde7069f75bf5d77ba201a2791d6ba714397769fcdf64ebc6c`
- Source unchanged: PASS

## Derivative and simplification

- Preserved the compact Ausf. N silhouette, six road wheels per side, upper/lower hull masses, tapered turret, cupola, rear turret bin, mantlet, short thick gun, and muzzle opening.
- Reused the approved root `VEH_PANZER3_01`; the source root remains at the ground-contact footprint center.
- Baked the source `-Y` forward geometry and pivots together by +90 degrees around Blender Z, producing Blender `+X` forward / `+Z` up and GLB `+X` forward / `+Y` up.
- Merged output to five meshes: `HULL`, `TRACK_L`, `TRACK_R`, `TURRET`, and `GUN`.
- Each track side is one static mesh. Continuous bands and simplified road wheels/sprocket/idler/return rollers were retained; individual links/grousers, wheel recesses/hubs, sprocket teeth/recesses, suspension arms, and other small running-gear details were omitted.
- Small hinges, latches, handles, clamps, and recess-only details were omitted where they did not affect top-down or oblique recognition.
- Mantlet is included in `TURRET`; barrel-moving parts are included in `GUN`.
- Materials: three constant base-color materials (`Armor_BaseColor`, `Track_BaseColor`, `Gun_BaseColor`), metallic 0, roughness 0.82, no textures.

## Outputs

- Blender: `Z:\RicochetAngles\01_RND\ThreeJSDEV\Panzer3\source\Panzer3_RND_v01.blend`
- GLB: `Z:\RicochetAngles\01_RND\ThreeJSDEV\Panzer3\export\Panzer3_RND_v01.glb`
- GLB size: 337,372 bytes (329.46 KiB)
- Validation JSON: `Z:\RicochetAngles\01_RND\ThreeJSDEV\Panzer3\notes\asset_validation_v01.json`
- Preview: `Panzer3_RND_v01_isometric.png`, `Panzer3_RND_v01_top.png`, `Panzer3_RND_v01_side.png`

## Geometry and hierarchy

- Meshes: 5
- Triangles: 6,620
- Per mesh: HULL 3,112; TRACK_L 1,048; TRACK_R 1,048; TURRET 1,132; GUN 280
- Materials: 3
- Textures/images: 0
- Full neutral bounds in Blender X/Y/Z: approximately 4.640 x 3.280 x 2.920 m

```text
VEH_PANZER3_01
└─ HULL
   ├─ TRACK_L
   ├─ TRACK_R
   └─ TURRET_PIVOT
      └─ TURRET
         └─ GUN
            └─ MUZZLE
```

Blender-space pivot/world positions in meters:

- ROOT: (0.000, 0.000, 0.000)
- TURRET_PIVOT: (0.120, 0.000, 1.870)
- GUN: (1.070, 0.000, 2.290)
- MUZZLE: (2.320, 0.000, 2.290)
- MUZZLE basis: the existing approved/source `Muzzle` node, transformed together with geometry and pivots.

## Technical validation

PASS:

- Fresh Blender import retained all eight hierarchy nodes and exact parent relationships.
- Maximum world-location round-trip error: 0.000000176 m.
- Maximum dimension round-trip error: 0.0 m.
- Turret yaw and gun pitch test moved MUZZLE through the expected hierarchy; neutral-pose restore matrix error: 0.0.
- MUZZLE direction is local/world +X from GUN in neutral pose.
- TRACK_L remains on the vehicle-left side and TRACK_R on the vehicle-right side relative to +X forward.
- Metric scale retained; no forced normalization to M41.
- No negative scale, armature, skin, skeleton, action, animation, morph target, or texture dependency.

## Visual validation

PASS after actual inspection of the rendered GLB re-import:

- Isometric: Panzer3 compact hull/turret massing, short thick gun, cupola, rear bin, six-wheel running gear, and separate tracks are present and attached.
- Top: tapered turret, cupola, gun direction, hull/fender footprint, and left/right tracks remain readable.
- Side: six road wheels, continuous track silhouette, turret height, rear bin, and short-gun proportion remain recognizable; no obvious detached components or collapsed geometry.

## Limits

- Preview materials and neutral lighting are validation-only and do not establish final Art Direction.
- HTML/Three.js loading, renderer behavior, display scale, gameplay adapters, collision, damage, recoil, muzzle FX, and runtime performance are UNVERIFIED / out of scope.
- This technical and agent visual PASS is not a claim of new user visual approval or a new canonical revision.
