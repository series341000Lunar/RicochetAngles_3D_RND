# 75mm_PAK_40 GLB RND v01

Source: Z:/RicochetAngles/00_Asset/MODEL/75mm_PAK_40/75mm_PAK_40_v02.blend
Reason: latest v02 has explicitly requested tank-style 3-mesh / 6-node structure.
User confirmed omit TRACK_L/R; retain wheels/spades inside HULL and existing ROOT/TURRET_PIVOT.
No additional shape simplification, scale change or pivot relocation required.
Source and M41 reference hashes unchanged.

Outputs:
- source/75mm_PAK_40_RND_v01.blend
- export/75mm_PAK_40_RND_v01.glb
- preview/75mm_PAK_40_RND_v01_{isometric,top,side}.png
- notes/asset_validation_v01.json
- notes/AT_GUN_LIKE_GLB_PROMPT.md

GLB: 329756 bytes; 6 nodes, 3 meshes, 9 material primitives, 10708 triangles, 3 materials, 0 textures.
Dimensions: 5.34 x 2.54 x 1.60 meters.
Axis: +X forward, +Y up. Standard Blender glTF export_yup conversion; no gameplay scale baked.
Hierarchy: 75mm_PAK_40_ROOT > HULL > TURRET_PIVOT > TURRET > GUN > MUZZLE.

Technical PASS: fresh-scene reimport, names/parents, dimensions/pivots, MUZZLE actual tip/local forward, yaw30/pitch10 transform tests and neutral restore, positive scales, no animation/skin/armature, saved Blender reopen.
Visual PASS: actual reimported isometric viewport plus top and side examined; neutral silhouette and component placement retained.
Limitations: nonphysical aiming intersections explicitly accepted; no motion-clearance claim, HTML/game integration, performance or art-direction approval.

Unsaved active session was preserved before loading source:
Z:/RicochetAngles/99_temp/PAK40_unsaved_before_export_20260920_154151.blend
