import bpy,json
from pathlib import Path
from mathutils import Vector
R=Path(r"\\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV")
bpy.ops.wm.open_mainfile(filepath=str(R/'M41/source/M41_RND_v01.blend'))
gun=bpy.data.objects['GUN']
mx=max(v.co.x for v in gun.data.vertices)
front=[v.co for v in gun.data.vertices if abs(v.co.x-mx)<.001]
center=Vector((mx,(min(v.y for v in front)+max(v.y for v in front))/2,(min(v.z for v in front)+max(v.z for v in front))/2))
m=bpy.data.objects.new('MUZZLE',None);bpy.context.scene.collection.objects.link(m)
m.parent=gun;m.location=center;m.empty_display_type='ARROWS';m.empty_display_size=.2
bpy.context.view_layer.update()
report={'method':'GUN local +X maximum front-face vertices; Y/Z bounding midpoint','front_vertex_count':len(front),'local':list(center),'world_blender':list(m.matrix_world.translation),'parent':m.parent.name}
out=R/'M41/export/M41_RND_v02_muzzle.glb';blend=R/'M41/source/M41_RND_v02_muzzle.blend'
assert not out.exists() and not blend.exists()
bpy.ops.wm.save_as_mainfile(filepath=str(blend))
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_animations=False,export_cameras=False,export_lights=False,export_yup=True)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(out))
m=bpy.data.objects['MUZZLE'];assert m.parent.name=='GUN'
assert (m.matrix_world.translation-Vector(report['world_blender'])).length<1e-5
report['roundtrip']='PASS';report['glb_bytes']=out.stat().st_size
(R/'M41/notes/muzzle_asset_validation.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))

