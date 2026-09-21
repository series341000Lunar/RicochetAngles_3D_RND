# M4A3E2 GLB derivative v01

Source: \\192.168.87.201\Projects\RicochetAngles\00_Asset\MODEL\M4A3E2\M4A3E2_v06.blend

Selected because it is the separately saved current-session VVSS variant from M4A3E2_v05. Legacy M4A3E8 models were not opened or referenced. Source SHA-256 unchanged: PASS.

Blender: \\192.168.87.201\Projects\RicochetAngles\01_RND/ThreeJSDEV\M4A3E2\source\M4A3E2_RND_v01.blend

GLB: \\192.168.87.201\Projects\RicochetAngles\01_RND/ThreeJSDEV\M4A3E2\export\M4A3E2_RND_v01.glb

Evaluated geometry merged into 5 meshes; small bolt/clasp objects omitted; HVSS instances realized; materials consolidated to 3; mantlet assigned to TURRET.

Bytes: 6985480; meshes: 5; triangles: 125556; materials: 3; textures: 0; material primitives: 12.

Dimensions (length, width, height; all protrusions): [7.223815679550171, 3.620000123977661, 3.942500114440918] meters. No global rescaling.

Technical PASS: exact requested hierarchy, root preserved at origin/ground plane, turret ring and gun trunnion pivots retained; MUZZLE at frontmost barrel-brake centerline; +X forward/+Y up in GLB. Unit and negative-scale checks pass. No animations, skins, armatures, texture references. Reimported in a fresh scene. Turret 30 degrees and gun -10 degrees tested; muzzle hierarchy error 2.384185791015625e-07, neutral restore error 0.0. Saved GLB remains neutral. Blender reopened with one scene/eight objects.

Visual PASS (agent inspection, not user approval): actual reimport top, side, isometric previews inspected. Track and wheel assembly is one static mesh per side. Both keep two bogies/four visible wheel stations per side; HVSS preserves dual wheels and horizontal volutes.

Preview files:
- \\192.168.87.201\Projects\RicochetAngles\01_RND/ThreeJSDEV\M4A3E2\preview\M4A3E2_RND_v01_top.png
- \\192.168.87.201\Projects\RicochetAngles\01_RND/ThreeJSDEV\M4A3E2\preview\M4A3E2_RND_v01_side.png
- \\192.168.87.201\Projects\RicochetAngles\01_RND/ThreeJSDEV\M4A3E2\preview\M4A3E2_RND_v01_isometric.png

Reference: M41/source/M41_RND_v02_muzzle.blend and M41/export/M41_RND_v02_muzzle.glb inspected for structure/unit/axis only. No M41 silhouette transfer.

Limitations:
- Stylized two-bogie/four-roadwheel-station design per side; not a dimensionally researched historical reconstruction.
- Geometry budget and runtime performance not specified/tested.
- HTML/Three.js/Unity integration not performed; user visual approval pending.

Implementation checks: importer uses quaternion rotation; test switched rotation mode to XYZ before rotation. Initial library-only split files were opened and normally saved before derivative creation.
