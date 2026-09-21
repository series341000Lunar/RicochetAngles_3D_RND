# Panzer6_Tiger1 GLB derivative v01 — build and validation

Date: 2026-09-20
Status: TECHNICAL PASS / VISUAL PASS
Scope: Blender derivative, GLB export, fresh-Blender re-import, and validation images only. HTML loading and game integration were not performed.

## Source selection and protection

- Source: `Z:\RicochetAngles\00_Asset\MODEL\Panzer6_Tiger1\Panzer6_Tiger1_v3.blend`
- Resolved source: `\\192.168.87.201\Projects\RicochetAngles\00_Asset\MODEL\Panzer6_Tiger1\Panzer6_Tiger1_v3.blend`
- Selection reason: v3 is the latest source revision; it preserves the v2 geometry/counts while adding the functional `Panzer6_Tiger1_TurretPivot` and `Panzer6_Tiger1_GunPivot` parenting needed for this derivative. This selection does not assert canonical approval.
- Source SHA-256 before/after: `75bce49d5a6a4df1cc7281cc53cb0d4d85bdd1ea0db0198ae1e7a84c43430db5`
- Source unchanged: PASS

## Derivative and simplification

- Preserved the Panzer6_Tiger1-specific boxy hull and turret massing, broad mantlet, long gun and muzzle brake, engine deck, rear filters/exhaust assemblies, road-wheel rhythm, and wide track footprint.
- Reused the existing source root `Panzer6_Tiger1_ROOT` at the ground-contact footprint center.
- Baked the source `-Y` forward geometry and pivots together by +90 degrees around Blender Z, producing Blender `+X` forward / `+Z` up and GLB `+X` forward / `+Y` up.
- Merged output to five meshes: `HULL`, `TRACK_L`, `TRACK_R`, `TURRET`, and `GUN`.
- Each track side is one static mesh. Continuous bands, road-wheel tire/disc forms, sprocket, and idler were retained; source track-link assemblies, wheel bolts, recesses, and small hubs were omitted.
- Tow cables, cable clamps, small handles, hinges, latches, bolts, and recess-only details were omitted where they did not affect silhouette or top-down recognition.
- Mantlet is included in `TURRET`; collar, sleeve, barrel, muzzle brake, bore, and brake slots are included in `GUN`.
- Materials: three constant base-color materials (`Armor_BaseColor`, `Track_BaseColor`, `Gun_BaseColor`), metallic 0, roughness 0.82, no textures.

## Outputs

- Blender: `Z:\RicochetAngles\01_RND\ThreeJSDEV\Panzer6_Tiger1\source\Panzer6_Tiger1_RND_v01.blend`
- GLB: `Z:\RicochetAngles\01_RND\ThreeJSDEV\Panzer6_Tiger1\export\Panzer6_Tiger1_RND_v01.glb`
- GLB size: 365,960 bytes (357.38 KiB)
- Validation JSON: `Z:\RicochetAngles\01_RND\ThreeJSDEV\Panzer6_Tiger1\notes\asset_validation_v01.json`
- Preview: `Panzer6_Tiger1_RND_v01_isometric.png`, `Panzer6_Tiger1_RND_v01_top.png`, `Panzer6_Tiger1_RND_v01_side.png`

## Geometry and hierarchy

- Meshes: 5
- Triangles: 8,032
- Per mesh: HULL 3,144; TRACK_L 1,808; TRACK_R 1,808; TURRET 836; GUN 436
- Materials: 3
- Textures/images: 0
- Full neutral bounds in Blender X/Y/Z: approximately 8.572 x 4.063 x 3.883 m

```text
Panzer6_Tiger1_ROOT
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
- TURRET_PIVOT: (0.205, 0.000, 2.342)
- GUN: (1.348, 0.000, 2.985)
- MUZZLE: (5.326, 0.000, 2.998)
- MUZZLE basis: the center of the GUN local +X front-face vertices at the actual muzzle lip end.

## Technical validation

PASS:

- Fresh Blender import retained all eight hierarchy nodes and exact parent relationships.
- Maximum world-location round-trip error: 0.000000400 m.
- Maximum dimension round-trip error: 0.0 m.
- Turret yaw and gun pitch test moved MUZZLE through the expected hierarchy; neutral-pose restore matrix error: 0.0.
- MUZZLE direction is +X from GUN in neutral pose and is centered at the muzzle opening.
- TRACK_L remains on the vehicle-left side and TRACK_R on the vehicle-right side relative to +X forward.
- Metric scale and the larger Panzer6_Tiger1/Panzer3 size difference are retained; no forced normalization to M41.
- No negative scale, armature, skin, skeleton, action, animation, morph target, or texture dependency.

## Visual validation

PASS after actual inspection of the rendered GLB re-import:

- Isometric: boxy Panzer6_Tiger1 hull/turret, broad mantlet, long tapered gun/muzzle brake, rear engine details, filters/exhausts, and separate tracks are present and attached.
- Top: broad rectangular footprint, turret roof/cupola forms, engine-deck layout, long gun direction, and left/right tracks remain readable.
- Side: tall boxy superstructure, turret/mantlet relationship, long-gun silhouette, rear filter/exhaust mass, road wheels, and continuous track are recognizable; no obvious detached components or collapsed geometry.

## Limits

- Preview materials and neutral lighting are validation-only and do not establish final Art Direction.
- HTML/Three.js loading, renderer behavior, display scale, gameplay adapters, collision, damage, recoil, muzzle FX, and runtime performance are UNVERIFIED / out of scope.
- Panzer6_Tiger1 v3 was selected as the best structural source, but this work does not claim user/canonical approval for Panzer6_Tiger1.


Naming correction 2026-09-20: see NAME_CORRECTION_20260920.md and name_correction_20260920.json for current names, hashes and GLB sizes. Earlier binary hashes/sizes refer to pre-correction files.
