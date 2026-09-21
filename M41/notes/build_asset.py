import bpy, math, json, hashlib
from pathlib import Path
from mathutils import Matrix, Vector
R=Path(r"\\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV")
S=Path(r"\\192.168.87.201\Projects\RicochetAngles\00_Asset\MODEL\M41\ForHTML\RigPrototype_v01\M41_HTMLRigPrototype_v01.blend")
for d in ['M41/source','M41/export','M41/preview','M41/notes','spike']: (R/d).mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(S))
sourcehash=hashlib.sha256(S.read_bytes()).hexdigest()
# Bake a clockwise quarter turn: Blender +Y forward becomes +X. glTF maps Blender +Z to +Y.
rot=Matrix.Rotation(-math.pi/2,4,'Z')
pivot=rot@bpy.data.objects['M41_TURRET_YAW'].matrix_world.translation
gunpivot=rot@bpy.data.objects['M41_GUN_PITCH'].matrix_world.translation
groups={k:[] for k in ['HULL','TURRET','GUN','TRACK_L','TRACK_R']}
kept=[]; omitted=[]
for o in list(bpy.data.objects):
 if o.type!='MESH' or not o.name.startswith('M41_'): continue
 n=o.name
 if 'Cutter' in n or any(t in n for t in ['Bolt','Strap','Fastener','Review_Star','Vision','GrabRail','Rail_Foot','Handle','Hinge','Latch','Track_Pads','Track_Shoes','Suspension','Recess','Hub','SideCap','UpperLug','Sight']):
  omitted.append(n); continue
 ancestors=[]; p=o.parent
 while p: ancestors.append(p.name); p=p.parent
 if 'M41_TRACK_L' in ancestors or 'M41_TRACK_R' in ancestors:
  key='TRACK_L' if 'M41_TRACK_L' in ancestors else 'TRACK_R'
  if not ('Track_Band' in n or ('Roadwheel' in n and 'Outer' in n) or n in ['M41_Front_Sprocket_L','M41_Front_Sprocket_R','M41_Rear_Idler_L','M41_Rear_Idler_R']):
   omitted.append(n); continue
 elif n in ['M41_Main_Gun','M41_Muzzle_Brake']: key='GUN'
 elif 'M41_TURRET_YAW' in ancestors: key='TURRET'
 elif 'M41_HULL' in ancestors: key='HULL'
 else: continue
 for mod in o.modifiers:
  if mod.type=='BEVEL': mod.segments=1
  if mod.type=='SUBSURF': mod.show_viewport=False; mod.show_render=False
 groups[key].append(o); kept.append(n)
bpy.context.view_layer.update()
deps=bpy.context.evaluated_depsgraph_get()
baked={}
for key,objs in groups.items():
 vs=[]; fs=[]
 origin=pivot if key=='TURRET' else gunpivot if key=='GUN' else Vector((0,0,0))
 for o in objs:
  ev=o.evaluated_get(deps); m=ev.to_mesh(); start=len(vs)
  vs.extend(tuple(rot@o.matrix_world@v.co-origin) for v in m.vertices)
  fs.extend(tuple(start+i for i in p.vertices) for p in m.polygons)
  ev.to_mesh_clear()
 baked[key]=(vs,fs,origin)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene; scene.unit_settings.system='METRIC'; scene.unit_settings.scale_length=1
def material(name,color):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF'); bs.inputs['Base Color'].default_value=(*color,1); bs.inputs['Roughness'].default_value=.85
 return m
armor=material('Armor_BaseColor',(.24,.31,.18)); dark=material('Track_BaseColor',(.055,.065,.045)); accent=material('Gun_BaseColor',(.33,.38,.25))
root=bpy.data.objects.new('M41_ROOT',None); scene.collection.objects.link(root)
objects={}
for k,(vs,fs,origin) in baked.items():
 m=bpy.data.meshes.new(k+'_mesh'); m.from_pydata(vs,[],fs); m.update()
 o=bpy.data.objects.new(k,m); scene.collection.objects.link(o); o.location=origin; m.materials.append(dark if k.startswith('TRACK') else accent if k=='GUN' else armor); objects[k]=o
tp=bpy.data.objects.new('TURRET_PIVOT',None); scene.collection.objects.link(tp); tp.location=pivot
def parent(o,p):
 w=o.matrix_world.copy(); o.parent=p; o.matrix_world=w
bpy.context.view_layer.update()
parent(objects['HULL'],root)
for k in ['TRACK_L','TRACK_R']: parent(objects[k],objects['HULL'])
parent(tp,objects['HULL']); parent(objects['TURRET'],tp); parent(objects['GUN'],objects['TURRET'])
bpy.context.view_layer.update()
out=R/'M41/export/M41_RND_v01.glb'; blend=R/'M41/source/M41_RND_v01.blend'
assert not out.exists() and not blend.exists()
bpy.ops.wm.save_as_mainfile(filepath=str(blend))
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',export_animations=False,export_cameras=False,export_lights=False,export_yup=True)
before={o.name:{'parent':o.parent.name if o.parent else None,'world':list(o.matrix_world.translation),'dimensions':list(o.dimensions)} for o in scene.objects}
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(out))
after={o.name:{'parent':o.parent.name if o.parent else None,'world':list(o.matrix_world.translation),'dimensions':list(o.dimensions)} for o in bpy.context.scene.objects}
assert set(before)==set(after)
for n in before:
 assert before[n]['parent']==after[n]['parent']
 assert max(abs(a-b) for a,b in zip(before[n]['world'],after[n]['world']))<1e-4
 assert max(abs(a-b) for a,b in zip(before[n]['dimensions'],after[n]['dimensions']))<1e-4
assert not any(o.type=='ARMATURE' for o in bpy.data.objects)
assert not bpy.data.actions
meshes=[o for o in bpy.data.objects if o.type=='MESH']; tris=0
for o in meshes: o.data.calc_loop_triangles(); tris+=len(o.data.loop_triangles)
report={'source':str(S),'source_sha256':sourcehash,'source_unchanged':sourcehash==hashlib.sha256(S.read_bytes()).hexdigest(),'glb_bytes':out.stat().st_size,'mesh_count':len(meshes),'triangles':tris,'materials':len(bpy.data.materials),'textures':0,'hierarchy':after,'roundtrip':'PASS','kept':kept,'omitted':omitted,'axis':'Blender derivative +X forward +Z up; GLB +X forward +Y up; meters'}
(R/'M41/notes/asset_validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('RESULT',json.dumps({k:v for k,v in report.items() if k not in ['kept','omitted','hierarchy']}))

