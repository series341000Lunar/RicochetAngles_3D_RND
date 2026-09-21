# SHIP_LCT GLB derivative v01
Source: MODEL/SHIP_LCT/SHIP_LCT_v04.blend, latest localized deck-penetration correction. Disk source used; active unsaved Blender session preserved.
User decision: retain ramp as separate part.
Structure: SHIP_LCT_ROOT > HULL, RAMP, RAMP_WIRE_L, RAMP_WIRE_R.
Root retained at source datum (not a newly claimed approved origin). RAMP origin is bottom hinge, GLB coordinate (16.69,0.65,0). Opening rotates around GLB Z; wires remain independent at upper anchors and require downstream endpoint adjustment. No driver, automatic cable motion, animation, skin or armature included.
Geometry: evaluated source geometry retained, modifiers baked, fixed parts combined. No decimation or silhouette redesign. Three temporary base-color materials; no textures. Source -X bow converted to final +X, Blender Z up exported once to GLB Y up. M41 raw GLB convention checked; its vehicle hierarchy not reused.
Technical: GLB JSON hierarchy/counts inspected; neutral bounds match source exactly; root transform test and ramp pivot test passed after clean reimport; derivative reopened; source SHA-256 equal. Initial root test selected wrong same-name scene object; corrected with clean import.
Visual: reimported GLB rendered and inspected in top, side, isometric views. Hull/deck, ramp, bridge, funnel, mast, railings and stern components retained.
Counts: 5 nodes / 4 meshes / 7 primitives / 83100 triangles / 3 materials / 0 textures. 4713436 bytes.
Size: length 36.9967 m, beam 8.4545 m, height 11.6370 m; original estimated scale unchanged.
Limits: runtime wiring/animation, HTML integration, physics and user visual approval not verified or implied.
