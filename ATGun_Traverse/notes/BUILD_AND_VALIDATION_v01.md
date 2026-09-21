# ATGun_Traverse — Static Prop GLB v01

## Source and scope

Source: \\192.168.87.201\Projects\RicochetAngles\00_Asset\MODEL\ATGun_Traverse\ATGun_Traverse_v01.blend
Selected because it is the current completed exterior model and the only .blend in the designated MODEL folder.
The original file was clean when inspected. No other unsaved work was discarded.
M41 v02 muzzle reference had already been inspected in this task for meter/axis/export conventions; its GLB nodes were checked again. No M41 hierarchy, size, or geometry was transferred.

## Changes

All 265 visible exterior mesh/curve objects evaluated and merged into PROP. Geometry detail and all components retained; no decimation or part removal. Curves and modifiers baked in derivative only. Four source materials consolidated to three simple base colors: main/mechanical gray, rubber/recess dark, and lamp lens. Lamp has no emission or light.

Hierarchy: ATGun_Traverse_ROOT (Empty) -> PROP (Mesh).
Both nodes have identity transforms. PROP local translation/rotation zero, scale one.

No origin had been explicitly adopted by the user. Candidate selected: axle-center projection onto ground, source Blender coordinate (-0.16, 0, 0). Geometry translated +0.16m in X so candidate ROOT is at origin. This changes the placement datum, not dimensions or relative shape; not reported as an approved origin.
Blender is meters, +X toward tow eye, +Z up; exporter performs the single Z-up to Y-up conversion. GLB is meters, +X forward, +Y up.
Dimensions including tow eye, rear pipe/handle and roof fittings: 3.453233 x 1.880000 x 1.837071m (length/width/height).

## Deliverables

- Blender: \\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV\ATGun_Traverse\source\ATGun_Traverse_RND_v01.blend
- GLB: \\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV\ATGun_Traverse\export\ATGun_Traverse_RND_v01.glb
- Preview: preview/ATGun_Traverse_RND_v01_top.png
- Preview: preview/ATGun_Traverse_RND_v01_side.png
- Preview: preview/ATGun_Traverse_RND_v01_isometric.png
- Detailed evidence: notes/ATGun_Traverse_RND_v01_validation.json
- Source evaluated vertex positions for round-trip comparison: notes/ATGun_Traverse_RND_v01_geometry_points.json

## Statistics

GLB bytes: 2,189,108
Nodes: 2
Meshes: 1
Material primitives: 3
Triangles: 55,740
Materials: 3
Textures: 0

## Technical validation — PASS

- Exact 2-node hierarchy checked directly in GLB JSON and fresh-scene reimport.
- One PROP mesh, correct parent, ROOT without mesh; identity local transforms.
- No negative scales, cameras, lights, animation, skin, armature, image or texture dependencies.
- GLB bounds inspected: Y is ground-to-roof height, +X extends toward towing eye.
- Fresh-scene reimported vertices compared bidirectionally against source evaluated vertices after documented origin offset: maximum nearest-position error 0m.
- All 265 source geometry objects included; triangle count preserved.
- ROOT translation (2,1,0.5)m and yaw 37 degrees: whole PROP follows, error 0m. Neutral restoration error 0m.
- Saved Blender reopened successfully with exactly two objects.
- Exported GLB and saved Blender remain neutral; test performed in separate reimport scene.
- Original SHA-256 before/after equal: 56a8db36f934b10508b30e8c93e73899d9daa80b3906f27c571d9dee2d965cc2

## Visual validation — PASS

Actual reimport top, side and isometric PNGs inspected. Wheels, fenders, A-frame drawbar, towing eye, jack, closed enclosure, louvers, cables, lamp and rear attachments present. Main silhouette and proportions retained. Mechanical fittings have less color contrast after material consolidation; geometry retained.

## Remaining limitations

Origin candidate and visual inspection are not user approval. Runtime performance, HTML/Three.js loading, Unity integration, gameplay scale and physics remain untested and outside scope. No runtime files changed.
