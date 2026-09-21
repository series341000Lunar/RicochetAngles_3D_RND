# Panzer6B_Tiger2 GLB derivative v01

- Source: \\192.168.87.201\Projects\RicochetAngles\00_Asset\MODEL\Panzer6B_Tiger2\Panzer6B_Tiger2_v04.blend
- Selection: latest v04, preserving previous hull, turret, barrel and concentric mantlet revisions.
- Naming: Pazner6B_Tiger2 -> Panzer6B_Tiger2; 7 Blender files corrected and geometry hashes unchanged. Source geometry was not redesigned. Historical RUN_LOG, exact prompt text and reference-image pixels retained.
- Naming backup: \\192.168.87.201\Projects\RicochetAngles/99_temp/Panzer6B_name_correction_20260920_145149/before_name_correction.zip
- Naming evidence: \\192.168.87.201\Projects\RicochetAngles/00_Asset/MODEL/Panzer6B_Tiger2/work/name_correction_20260920.json
- Older v04 validation binary hashes refer to files BEFORE authorized naming correction. This report's protected SHA256 is the post-correction baseline.
- Source unit: meter; world root scale 0.98414433 baked into geometry. No normalization to M41.
- Axis: source +Y/+Z -> Blender +X/+Z via -90 deg Z; GLB +X forward/+Y up.
- Root: candidate ground-contact footprint center; uniform offset applied to geometry and pivots. Not a claim of approved root.
- Turret pivot: actual Turret ring center; gun: existing GUN_PITCH trunnion; MUZZLE: actual front lip center.
- Mantlet included in TURRET, not GUN.
- Simplification: merged to 5 meshes, each track static and includes 3 road wheels, omitted links/bolts/handles, continuous belt outer envelope extended to source tread extent.
- Counts: 5 meshes / 8 nodes / 10 material primitives / 37564 triangles / 3 materials / 0 textures.
- GLB: 1731556 bytes.
- Dimensions: [9.364132165908813, 3.572444200515747, 3.795574903488159] meters (length/width/height).
- Technical: PASS. Fresh empty-scene reimport; hierarchy, names, transforms, side labels, muzzle center, 30 deg yaw and -10 deg pitch, neutral restore, saved Blender reopen verified. No animation, skins, armatures or negative scales.
- Visual: PASS (agent inspection only). Top, side and actual isometric viewport inspected against source. Characteristic hull, turret, long gun and concentric mantlet preserved.
- Limitations: candidate root pending user acceptance; collision envelope and runtime use UNVERIFIED. Smooth bands intentionally omit tread detail. No HTML or gameplay integration. Materials provisional.
- Detailed evidence: asset_validation_v01.json; build_v01.py; preview directory.

## Outputs
- \\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV\Panzer6B_Tiger2\source\Panzer6B_Tiger2_RND_v01.blend
- \\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV\Panzer6B_Tiger2\export\Panzer6B_Tiger2_RND_v01.glb
- \\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV\Panzer6B_Tiger2\preview\Panzer6B_Tiger2_RND_v01_isometric.png
- \\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV\Panzer6B_Tiger2\preview\Panzer6B_Tiger2_RND_v01_top.png
- \\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV\Panzer6B_Tiger2\preview\Panzer6B_Tiger2_RND_v01_side.png