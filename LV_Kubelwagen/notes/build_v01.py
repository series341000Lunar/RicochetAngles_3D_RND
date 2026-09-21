import bpy, math, json, hashlib, struct
from pathlib import Path
from mathutils import Matrix, Vector, Quaternion
B=Path(r"\\192.168.87.201\Projects\RicochetAngles")
R=B/'01_RND/ThreeJSDEV'
def window_op(op,**kwargs):
    w=next(iter(bpy.context.window_manager.windows))
    a=next(a for a in w.screen.areas if a.type=='VIEW_3D')
    r=next(r for r in a.regions if r.type=='WINDOW')
    sc=w.scene
    with bpy.context.temp_override(window=w,area=a,region=r,scene=sc,view_layer=sc.view_layers[0],active_object=sc.objects.get('HULL'),object=sc.objects.get('HULL'),selected_objects=list(sc.objects)):
        return op(**kwargs)
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def worldverts(o):
    dg=bpy.context.evaluated_depsgraph_get();e=o.evaluated_get(dg);m=e.to_mesh()
    vs=[e.matrix_world@v.co for v in m.vertices];e.to_mesh_clear();return vs
def bounds(vs): return [[min(v[i] for v in vs) for i in range(3)],[max(v[i] for v in vs) for i in range(3)]]
def preview(vehicle,tag,source=False):
    scene=bpy.context.scene
    geo=[o for o in scene.objects if o.type=='MESH' and not o.hide_render]
    pts=[v for o in geo for v in worldverts(o)]
    lo,hi=bounds(pts);center=(Vector(lo)+Vector(hi))/2; span=max(hi[i]-lo[i] for i in range(3))
    ca=bpy.data.cameras.new('VerificationCamera');cam=bpy.data.objects.new('VerificationCamera',ca);scene.collection.objects.link(cam);scene.camera=cam;ca.type='ORTHO'
    scene.render.engine='BLENDER_WORKBENCH';scene.render.resolution_x=1400;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
    if scene.world is None:scene.world=bpy.data.worlds.new('VerificationWorld')
    shading=scene.display.shading;shading.light='STUDIO';shading.color_type='MATERIAL';shading.show_shadows=True;shading.show_cavity=True;shading.cavity_type='BOTH';shading.background_type='WORLD';scene.world.color=(.075,.075,.075)
    views=[('isometric',Vector((9,-12,9)) if source else Vector((9,12,6))),('top',Vector((0,0,20))),('side',Vector((20,0,0)) if source else Vector((0,-20,0)))]
    paths=[]
    for label,direction in views:
        cam.location=center+direction.normalized()*25
        cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler()
        quat=cam.rotation_euler.to_quaternion();right=quat@Vector((1,0,0));up=quat@Vector((0,1,0))
        xx=[(v-center).dot(right) for v in pts];yy=[(v-center).dot(up) for v in pts]
        cam.location+=right*((min(xx)+max(xx))/2)+up*((min(yy)+max(yy))/2)
        ca.ortho_scale=max(max(xx)-min(xx),(max(yy)-min(yy))*scene.render.resolution_x/scene.render.resolution_y)*1.12
        path=R/vehicle/'preview'/f'{vehicle}_{tag}_{label}.png'
        scene.render.filepath=str(path)
        if label=='isometric' and not source:
            win=next(iter(bpy.context.window_manager.windows));area=next(a for a in win.screen.areas if a.type=='VIEW_3D');region=next(r for r in area.regions if r.type=='WINDOW')
            area.spaces.active.region_3d.view_perspective='CAMERA'
            area.spaces.active.shading.type='SOLID';area.spaces.active.shading.color_type='MATERIAL'
            area.spaces.active.overlay.show_overlays=False
            with bpy.context.temp_override(window=win,area=area,region=region,scene=scene):
                bpy.ops.render.opengl(write_still=True,view_context=True)
        else:bpy.ops.render.render(write_still=True)
        paths.append(str(path))
    bpy.data.objects.remove(cam,do_unlink=True)
    return paths
def state():
    bpy.context.view_layer.update()
    return {o.name:{'parent':o.parent.name if o.parent else None,'world':list(o.matrix_world.translation),'matrix':[list(r) for r in o.matrix_world],'scale':list(o.scale),'dimensions':list(o.dimensions)} for o in bpy.context.scene.objects}
def motion_check():
    obs=bpy.context.scene.objects;tp=obs['TURRET_PIVOT'];gun=obs['GUN'];mu=obs['MUZZLE']
    tp.rotation_mode='XYZ';gun.rotation_mode='XYZ'
    before={o.name:o.matrix_world.copy() for o in obs};rt=tp.rotation_euler.copy();rg=gun.rotation_euler.copy()
    tp.rotation_euler.z+=math.radians(30);bpy.context.view_layer.update()
    expected=Matrix.Translation(before['TURRET_PIVOT'].translation)@Matrix.Rotation(math.radians(30),4,'Z')@Matrix.Translation(-before['TURRET_PIVOT'].translation)@before['MUZZLE']
    yaw_error=(mu.matrix_world.translation-expected.translation).length
    hull_error=max(abs(obs[n].matrix_world[i][j]-before[n][i][j]) for n in ['HULL','TRACK_L','TRACK_R'] for i in range(4) for j in range(4))
    turret_after_yaw=obs['TURRET'].matrix_world.copy();gun_before_pitch=gun.matrix_world.copy()
    gun.rotation_euler.y-=math.radians(10);bpy.context.view_layer.update()
    predicted=gun_before_pitch@Matrix.Rotation(math.radians(-10),4,'Y')@gun_before_pitch.inverted()@expected
    pitch_error=(mu.matrix_world.translation-predicted.translation).length
    fixed_turret=max(abs(obs['TURRET'].matrix_world[i][j]-turret_after_yaw[i][j]) for i in range(4) for j in range(4))
    tp.rotation_euler=rt;gun.rotation_euler=rg;bpy.context.view_layer.update()
    restore=max(abs(o.matrix_world[i][j]-before[o.name][i][j]) for o in obs for i in range(4) for j in range(4))
    assert max(yaw_error,pitch_error,hull_error,fixed_turret,restore)<1e-5
    return {'yaw_30_error_m':yaw_error,'pitch_minus10_error_m':pitch_error,'stationary_hull_tracks_error':hull_error,'mantlet_turret_fixed_during_pitch_error':fixed_turret,'neutral_restore_matrix_error':restore}
def parse_glb(path):
    raw=path.read_bytes();magic,version,total=struct.unpack_from('<4sII',raw,0);assert magic==b'glTF' and version==2 and total==len(raw)
    ln,typ=struct.unpack_from('<II',raw,12);assert typ==0x4e4f534a
    doc=json.loads(raw[20:20+ln]);return doc

from mathutils.bvhtree import BVHTree
D=R/'LV_Kubelwagen';src=B/'00_Asset/MODEL/LV_Kubelwagen/LV_Kubelwagen_v01.blend'
for sub in ['source','export','preview','notes']:(D/sub).mkdir(parents=True,exist_ok=True)
blend=D/'source/LV_Kubelwagen_RND_v01.blend';glb=D/'export/LV_Kubelwagen_RND_v01.glb'
assert not blend.exists() and not glb.exists() and not bpy.data.is_dirty
protected=[src,R/'M41/source/M41_RND_v02_muzzle.blend',R/'M41/export/M41_RND_v02_muzzle.glb']
hashes={str(p):sha(p) for p in protected}
m41doc=parse_glb(protected[2]);assert any(n['name']=='MUZZLE' for n in m41doc['nodes'])
bpy.ops.wm.open_mainfile(filepath=str(src));bpy.context.view_layer.update()
assert bpy.context.scene.unit_settings.scale_length==1
root=bpy.data.objects['LV_Kubelwagen_ROOT'];hullold=bpy.data.objects['HULL']
origins={'HULL':hullold.matrix_world.translation.copy()}
origins.update({n:bpy.data.objects[n].matrix_world.translation.copy() for n in ['WHEEL_FL','WHEEL_FR','WHEEL_RL','WHEEL_RR']})
mats=[bpy.data.materials[n] for n in ['Body_Gray','Rubber_Mechanical','Canvas_Seats','Glass','Light_Marking']]
groups={n:[] for n in origins}
oldgeo=[o for o in bpy.context.scene.objects if o.type in {'MESH','FONT'}]
for o in oldgeo:
 k=o.parent.name if o.parent and o.parent.name in groups and o.parent.name!='HULL' else 'HULL'
 groups[k].append(o)
# Capture fixed fender surfaces for diagnostic intersection checks after export/import.
fenders={}
dg=bpy.context.evaluated_depsgraph_get()
for tag in ['FL','FR','RL','RR']:
 vs=[];fs=[]
 for name in ['Fender_'+tag,'Fender lip_'+tag]:
  o=bpy.data.objects[name];e=o.evaluated_get(dg);me=e.to_mesh();me.calc_loop_triangles();start=len(vs)
  vs.extend(tuple(e.matrix_world@v.co) for v in me.vertices)
  fs.extend(tuple(start+i for i in t.vertices) for t in me.loop_triangles);e.to_mesh_clear()
 fenders[tag]=(vs,fs)
# Merge evaluated source geometry, retaining shading and all five source materials.
joined={};source_map={};tri_before={};maxerr=0
for key,obs in groups.items():
 vs=[];fs=[];mi=[];sm=[];norm=[];world=[];tri=0
 for o in obs:
  e=o.evaluated_get(dg);me=e.to_mesh();me.calc_loop_triangles();tri+=len(me.loop_triangles);start=len(vs)
  w=[e.matrix_world@v.co for v in me.vertices];world.extend(w);vs.extend(tuple(v-origins[key]) for v in w)
  nm=e.matrix_world.to_3x3().inverted().transposed()
  for p in me.polygons:
   fs.append(tuple(start+i for i in p.vertices));mi.append([m.name for m in mats].index(me.materials[p.material_index].name));sm.append(p.use_smooth)
   norm.extend(tuple((nm@me.corner_normals[i].vector).normalized()) for i in p.loop_indices)
  e.to_mesh_clear()
 me=bpy.data.meshes.new(key+'_RND_Mesh');me.from_pydata(vs,[],fs);me.update()
 for m in mats:me.materials.append(m)
 for p,idx,smooth in zip(me.polygons,mi,sm):p.material_index=idx;p.use_smooth=smooth
 me.normals_split_custom_set(norm)
 o=bpy.data.objects.new(key+'_RND',me);root.users_collection[0].objects.link(o);o.location=origins[key]
 bpy.context.view_layer.update()
 err=max((o.matrix_world@v.co-world[i]).length for i,v in enumerate(me.vertices));maxerr=max(maxerr,err)
 me.calc_loop_triangles();assert len(me.loop_triangles)==tri
 joined[key]=o;tri_before[key]=tri;source_map[key]=[o.name for o in obs]
assert maxerr<1e-6
for o in list(bpy.context.scene.objects):
 if o!=root and o not in joined.values():bpy.data.objects.remove(o,do_unlink=True)
for k,o in joined.items():o.name=k
def parent(o,p):
 w=o.matrix_world.copy();o.parent=p;o.matrix_parent_inverse=Matrix.Identity(4);o.matrix_world=w;bpy.context.view_layer.update()
parent(joined['HULL'],root)
for tag in ['FL','FR']:
 name='STEER_'+tag;o=bpy.data.objects.new(name,None);root.users_collection[0].objects.link(o);o.location=origins['WHEEL_'+tag];bpy.context.view_layer.update()
 parent(o,joined['HULL']);parent(joined['WHEEL_'+tag],o)
 o.empty_display_type='ARROWS';o.empty_display_size=.18
for tag in ['RL','RR']:parent(joined['WHEEL_'+tag],joined['HULL'])
bpy.context.view_layer.update()
before=state();assert len(before)==8
assert all(max(abs(v-1) for v in o.scale)<1e-6 for o in bpy.context.scene.objects)
assert all(max(abs(v) for v in o.rotation_euler)<1e-6 for o in bpy.context.scene.objects)
root['derivative']='GLB preparation; original source preserved; steering transforms only, no implemented controls'
bpy.ops.wm.save_as_mainfile(filepath=str(blend))
window_op(bpy.ops.export_scene.gltf,filepath=str(glb),export_format='GLB',export_yup=True,export_animations=False,export_skins=False,export_morph=False,export_cameras=False,export_lights=False,export_texcoords=False,export_tangents=False,export_normals=True,export_extras=False)
doc=parse_glb(glb)
assert len(doc['nodes'])==8 and len(doc['meshes'])==5
assert all(not doc.get(k) for k in ['images','textures','skins','animations'])
assert all('rotation' not in n and 'matrix' not in n and all(abs(v-1)<1e-6 for v in n.get('scale',[1,1,1])) for n in doc['nodes'])
parents={c:i for i,n in enumerate(doc['nodes']) for c in n.get('children',[])}
def pos(i):
 t=Vector(doc['nodes'][i].get('translation',[0,0,0]))
 return t+pos(parents[i]) if i in parents else t
positions={n['name']:list(pos(i)) for i,n in enumerate(doc['nodes'])}
for name,p in positions.items():
 w=before[name]['world'];assert (Vector(p)-Vector((w[0],w[2],-w[1]))).length<1e-5
for n in doc['nodes']:
 if n['name'] in ['WHEEL_FL','WHEEL_FR']:assert Vector(n.get('translation',[0,0,0])).length<1e-6
glass=next(m for m in doc['materials'] if m['name']=='Glass')
assert glass.get('alphaMode')=='BLEND' and abs(glass['pbrMetallicRoughness']['baseColorFactor'][3]-.23)<1e-5
bpy.ops.wm.read_homefile(use_empty=True,use_factory_startup=True)
window_op(bpy.ops.import_scene.gltf,filepath=str(glb))
after=state();assert set(after)==set(before)
assert all(after[n]['parent']==before[n]['parent'] for n in before)
locerr=max((Vector(before[n]['world'])-Vector(after[n]['world'])).length for n in before)
dimerr=max(abs(before[n]['dimensions'][i]-after[n]['dimensions'][i]) for n in before for i in range(3))
assert max(locerr,dimerr)<1e-5
for o in bpy.context.scene.objects:o.rotation_mode='XYZ'
def matrixerr(a,b):return max(abs(a[i][j]-b[i][j]) for i in range(4) for j in range(4))
base={o.name:o.matrix_world.copy() for o in bpy.context.scene.objects}
motion=[]
for tag in ['FL','FR']:
 steer=bpy.data.objects['STEER_'+tag];wheel=bpy.data.objects['WHEEL_'+tag];p=steer.matrix_world.translation.copy()
 for deg in [-25,25]:
  steer.rotation_euler.z=math.radians(deg);bpy.context.view_layer.update()
  expected=Matrix.Translation(p)@Matrix.Rotation(math.radians(deg),4,'Z')@Matrix.Translation(-p)@base[wheel.name]
  steererr=matrixerr(wheel.matrix_world,expected)
  stationary=max(matrixerr(o.matrix_world,base[o.name]) for o in bpy.context.scene.objects if o.name not in [steer.name,wheel.name])
  # GLB +Z corresponds to Blender -Y.
  wheel.rotation_euler.y=-math.radians(60);bpy.context.view_layer.update()
  spinerr=matrixerr(wheel.matrix_world,expected@Matrix.Rotation(-math.radians(60),4,'Y'))
  centererr=(wheel.matrix_world.translation-p).length
  assert max(steererr,stationary,spinerr,centererr)<1e-5
  motion.append({'wheel':wheel.name,'steer_degrees':deg,'GLB_spin_local_Z_degrees':60,'steer_matrix_error':steererr,'stationary_others_error':stationary,'spin_error':spinerr,'center_drift_m':centererr})
  wheel.rotation_euler.y=0;steer.rotation_euler.z=0;bpy.context.view_layer.update()
for tag in ['RL','RR']:
 o=bpy.data.objects['WHEEL_'+tag];o.rotation_euler.y=-math.radians(60);bpy.context.view_layer.update()
 err=matrixerr(o.matrix_world,base[o.name]@Matrix.Rotation(-math.radians(60),4,'Y'));assert err<1e-5
 motion.append({'wheel':o.name,'GLB_spin_local_Z_degrees':60,'spin_error':err})
 o.rotation_euler.y=0;bpy.context.view_layer.update()
restore=max(matrixerr(o.matrix_world,base[o.name]) for o in bpy.context.scene.objects);assert restore<1e-6
# Surface intersections are geometric diagnostics, not runtime physics/colliders.
def wheel_bvh(tag):
 o=bpy.data.objects['WHEEL_'+tag];o.data.calc_loop_triangles()
 return BVHTree.FromPolygons([o.matrix_world@v.co for v in o.data.vertices],[tuple(t.vertices) for t in o.data.loop_triangles],all_triangles=True,epsilon=1e-6)
collisions=[]
for deg in [0,-25,25]:
 for tag in ['FL','FR']:bpy.data.objects['STEER_'+tag].rotation_euler.z=math.radians(deg)
 bpy.context.view_layer.update()
 for tag in ['FL','FR']:
  v,f=fenders[tag];fixed=BVHTree.FromPolygons(v,f,all_triangles=True,epsilon=1e-6)
  overlaps=wheel_bvh(tag).overlap(fixed);collisions.append({'wheel':tag,'steering_deg':deg,'wheel_fender_surface_triangle_pairs':len(overlaps)})
 if deg==0:neutral=preview('LV_Kubelwagen','RND_v01')
 else:preview('LV_Kubelwagen','steer_'+('minus25' if deg<0 else 'plus25'))
for tag in ['FL','FR']:bpy.data.objects['STEER_'+tag].rotation_euler.z=0
bpy.context.view_layer.update()
assert max(matrixerr(o.matrix_world,base[o.name]) for o in bpy.context.scene.objects)<1e-6
pts=[v for o in bpy.context.scene.objects if o.type=='MESH' for v in worldverts(o)];lo,hi=bounds(pts)
tri={}
for o in bpy.context.scene.objects:
 if o.type=='MESH':o.data.calc_loop_triangles();tri[o.name]=len(o.data.loop_triangles)
assert sum(tri.values())==sum(tri_before.values())
r={'asset':'LV_Kubelwagen','source':str(src),'source_sha256':hashes[str(src)],'source_reason':'Only completed current original v01; preserves authored proportions and four wheel hub centers','outputs':{'blend':str(blend),'glb':str(glb),'glb_bytes':glb.stat().st_size,'neutral_previews':neutral},'changes':'Merged fixed parts including evaluated license text into HULL; wheel components into four wheel meshes; added two steer empties. No decimation or geometric redesign. Source materials and corner normals retained.','counts':{'nodes':8,'meshes':5,'triangles':sum(tri.values()),'triangles_by_mesh':tri,'materials':len(doc['materials']),'textures':0,'primitives':sum(len(m['primitives']) for m in doc['meshes'])},'source_parts':source_map,'neutral_geometry_max_vertex_error_m':maxerr,'hierarchy':{n:d['parent'] for n,d in after.items()},'glb_world_positions':positions,'axis':'meters; GLB +X forward/+Y up; left -Z/right +Z; steer local Y; wheel roll local Z; positive unit scales and identity neutral rotations','dimensions_length_width_height_m':[hi[i]-lo[i] for i in range(3)],'roundtrip':{'empty_scene':True,'location_error_m':locerr,'dimension_error_m':dimerr,'names_and_parents_match':True},'glass':glass,'motion_tests':motion,'neutral_restore_error':restore,'intersection_diagnostics':collisions,'intersection_method':'BVH surface triangle intersection against original fixed fender and lip surfaces; no full suspension or collision simulation','technical':'PASS','visual':'PENDING','protected_files':[{'path':str(p),'unchanged':sha(p)==hashes[str(p)],'sha256':sha(p)} for p in protected],'limitations':['No implemented steering/driving logic or animation','Steer tests +/-25 degrees are not approved game steering limits','No full articulation/physics/runtime performance validation']}
assert all(x['unchanged'] for x in r['protected_files'])
bpy.ops.wm.open_mainfile(filepath=str(blend));assert len(bpy.context.scene.objects)==8
assert all(max(abs(v) for v in o.rotation_euler)<1e-6 for o in bpy.context.scene.objects)
r['saved_blend_reopen_neutral']='PASS'
(D/'notes/asset_validation_v01.json').write_text(json.dumps(r,indent=2),encoding='utf-8')
result={k:r[k] for k in ['outputs','counts','intersection_diagnostics','glass','roundtrip','saved_blend_reopen_neutral']}

