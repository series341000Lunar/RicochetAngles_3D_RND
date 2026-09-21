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
    hull_error=max(abs(obs[n].matrix_world[i][j]-before[n][i][j]) for n in ['HULL'] for i in range(4) for j in range(4))
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

vehicle='75mm_PAK_40';D=R/vehicle
src=B/'00_Asset/MODEL/75mm_PAK_40/75mm_PAK_40_v02.blend'
protected=[src,R/'M41/source/M41_RND_v02_muzzle.blend',R/'M41/export/M41_RND_v02_muzzle.glb']
hashes={str(p):sha(p) for p in protected}
for sub in ['source','export','preview','notes']:(D/sub).mkdir(parents=True,exist_ok=True)
blend=D/'source/75mm_PAK_40_RND_v01.blend';glb=D/'export/75mm_PAK_40_RND_v01.glb'
assert not blend.exists() and not glb.exists()
bpy.ops.wm.open_mainfile(filepath=str(src))
assert len(bpy.context.scene.objects)==6
before=state();motion=motion_check()
assert bpy.context.scene.unit_settings.scale_length==1
assert all(all(abs(v-1)<1e-6 for v in o.scale) for o in bpy.context.scene.objects)
assert len([o for o in bpy.context.scene.objects if o.type=='MESH'])==3
bpy.ops.wm.save_as_mainfile(filepath=str(blend))
window_op(bpy.ops.export_scene.gltf,filepath=str(glb),export_format='GLB',export_yup=True,export_animations=False,export_skins=False,export_morph=False,export_cameras=False,export_lights=False,export_texcoords=False,export_tangents=False,export_normals=True,export_extras=False)
doc=parse_glb(glb)
assert len(doc['meshes'])==3 and len(doc['nodes'])==6 and len(doc['materials'])==3
assert all(not doc.get(k) for k in ['images','textures','skins','animations'])
assert all('rotation' not in n and 'matrix' not in n and all(abs(v-1)<1e-6 for v in n.get('scale',[1,1,1])) for n in doc['nodes'])
parents={c:i for i,n in enumerate(doc['nodes']) for c in n.get('children',[])}
def pos(i):
 t=Vector(doc['nodes'][i].get('translation',[0,0,0]))
 return t+pos(parents[i]) if i in parents else t
positions={n['name']:list(pos(i)) for i,n in enumerate(doc['nodes'])}
for n,p in positions.items():
 w=before[n]['world'];assert (Vector(p)-Vector((w[0],w[2],-w[1]))).length<1e-5
bpy.ops.wm.read_homefile(use_empty=True,use_factory_startup=True)
window_op(bpy.ops.import_scene.gltf,filepath=str(glb))
after=state();assert set(after)==set(before)
assert all(after[n]['parent']==before[n]['parent'] for n in before)
locerr=max((Vector(before[n]['world'])-Vector(after[n]['world'])).length for n in before)
dimerr=max(abs(before[n]['dimensions'][i]-after[n]['dimensions'][i]) for n in before for i in range(3))
assert max(locerr,dimerr)<1e-5
motion2=motion_check()
pts=[v for o in bpy.context.scene.objects if o.type=='MESH' for v in worldverts(o)]
lo,hi=bounds(pts);tri={}
for o in bpy.context.scene.objects:
 if o.type=='MESH':o.data.calc_loop_triangles();tri[o.name]=len(o.data.loop_triangles)
gv=worldverts(bpy.data.objects['GUN']);mx=max(v.x for v in gv);tip=[v for v in gv if mx-v.x<1e-5]
center=Vector((mx,(min(v.y for v in tip)+max(v.y for v in tip))/2,(min(v.z for v in tip)+max(v.z for v in tip))/2))
mu=bpy.data.objects['MUZZLE']
merr=(center-mu.matrix_world.translation).length
assert merr<1e-5 and (mu.matrix_world.to_3x3()@Vector((1,0,0))-Vector((1,0,0))).length<1e-5
assert not bpy.data.actions and not any(o.type=='ARMATURE' for o in bpy.context.scene.objects)
assert all(o.matrix_world.determinant()>0 for o in bpy.context.scene.objects)
r={'asset':vehicle,'revision':'RND_v01','source':str(src),'source_reason':'v02 is latest source containing explicitly user-authorized tank-like three-mesh hierarchy','source_sha256':hashes[str(src)],'interpretation':'User confirmed omit TRACK_L/R; wheels and trails remain HULL; preserve existing ROOT and TURRET_PIVOT','simplification':'None required. Three existing source meshes and 3 base-color materials retained; no shape or scale changes. No textures added.','outputs':{'blend':str(blend),'glb':str(glb),'glb_bytes':glb.stat().st_size},'counts':{'nodes':6,'meshes':3,'triangles':sum(tri.values()),'triangles_by_mesh':tri,'materials':len(doc['materials']),'textures':0,'primitives':sum(len(m['primitives']) for m in doc['meshes'])},'dimensions_length_width_height_m':[hi[i]-lo[i] for i in range(3)],'hierarchy':{n:v['parent'] for n,v in after.items()},'glb_positions':positions,'axis':'GLB +X forward, +Y up; source Blender +X forward/+Z up; standard export_yup conversion; meters; no normalization','roundtrip':{'fresh_empty_scene':True,'hierarchy_match':True,'location_error_m':locerr,'dimension_error_m':dimerr,'muzzle_tip_error_m':merr,'motion':motion2,'neutral_restored':True,'negative_scale':False,'skins':0,'animations':0,'armatures':0},'technical':'PASS','visual':'PENDING','limitations':['Physical intersections during aiming accepted by user; no mechanical motion-range clearance claim','Root and pivot preserved from v02 per user confirmation, not historical turret-ring geometry','No HTML/Three.js gameplay integration, performance stress test or final art-direction approval']}
r['outputs']['previews']=preview(vehicle,'RND_v01')
r['protected_files']=[{'path':str(p),'before':hashes[str(p)],'after':sha(p),'unchanged':hashes[str(p)]==sha(p)} for p in protected]
assert all(x['unchanged'] for x in r['protected_files'])
bpy.ops.wm.open_mainfile(filepath=str(blend))
assert len(bpy.context.scene.objects)==6
assert all(max(abs(v) for v in o.rotation_euler)<1e-6 for o in bpy.context.scene.objects)
r['saved_blend_reopen']='PASS'
(D/'notes/asset_validation_v01.json').write_text(json.dumps(r,indent=2),encoding='utf-8')
result={k:r[k] for k in ['outputs','counts','dimensions_length_width_height_m','roundtrip','saved_blend_reopen']}
