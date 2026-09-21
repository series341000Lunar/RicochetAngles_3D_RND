VEHICLE='Panzer6_Tiger1'
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
    views=[('isometric',Vector((9,-12,9)) if source else Vector((12,-10,9))),('top',Vector((0,0,20))),('side',Vector((20,0,0)) if source else Vector((0,-20,0)))]
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
def build(vehicle):
    vdir=R/vehicle
    for d in ['source','export','preview','notes']:(vdir/d).mkdir(parents=True,exist_ok=True)
    old=json.loads((vdir/'notes/asset_validation_v01.json').read_text())
    src=Path(old['source']['path'])
    outfile=vdir/'export'/f'{vehicle}_RND_v02.glb';blend=vdir/'source'/f'{vehicle}_RND_v02.blend'
    assert not outfile.exists() and not blend.exists(), 'Choose a new revision; existing outputs are protected'
    
    protected=[src,R/'M41/source/M41_RND_v02_muzzle.blend',R/'M41/export/M41_RND_v02_muzzle.glb',vdir/'source'/f'{vehicle}_RND_v01.blend',vdir/'export'/f'{vehicle}_RND_v01.glb']
    hashes={str(p):sha(p) for p in protected}
    bpy.ops.wm.open_mainfile(filepath=str(src));bpy.context.view_layer.update()
    assert abs(bpy.context.scene.unit_settings.scale_length-1)<1e-9
    roots={'Panzer3':('VEH_PANZER3_01','TurretYaw','GunPitch'),'Panzer6_Tiger1':('Panzer6_Tiger1_ROOT','Panzer6_Tiger1_TurretPivot','Panzer6_Tiger1_GunPivot')}
    rootname,tname,gname=roots[vehicle]
    rot=Matrix.Rotation(math.pi/2,4,'Z')
    rootpos=rot@bpy.data.objects[rootname].matrix_world.translation
    pivot=rot@bpy.data.objects[tname].matrix_world.translation
    gp=rot@bpy.data.objects[gname].matrix_world.translation
    all_geo=[o for o in bpy.context.scene.objects if o.type=='MESH' and not o.hide_render]
    orig_bounds=bounds([rot@v for o in all_geo for v in worldverts(o)])
    source_previews=preview(vehicle,'source_v02',True)
    # Reuse the audited part allowlist, but evaluate actual canonical/source geometry anew.
    groups=old['geometry']['kept_source_objects']
    baked={};kept={};omitted=[]
    for key,names in groups.items():
        objects=[bpy.data.objects[n] for n in names if 'FilterBolt' not in n]
        for o in objects:
            for mod in o.modifiers:
                if mod.type=='BEVEL':mod.segments=1
                if mod.type=='SUBSURF':mod.show_viewport=False
        bpy.context.view_layer.update()
        if key.startswith('TRACK'):
            mean=sum((rot@v).y for o in objects for v in worldverts(o))/sum(len(worldverts(o)) for o in objects)
            dest='TRACK_L' if mean>0 else 'TRACK_R'
        else:dest=key
        origin=pivot if dest=='TURRET' else gp if dest=='GUN' else rootpos
        vs=[];fs=[];mi=[];smooth=[]
        dg=bpy.context.evaluated_depsgraph_get()
        for o in objects:
            e=o.evaluated_get(dg);me=e.to_mesh();start=len(vs);vs.extend(tuple(rot@e.matrix_world@v.co-origin) for v in me.vertices)
            for p in me.polygons:
                fs.append(tuple(start+i for i in p.vertices));smooth.append(p.use_smooth)
                mat=me.materials[p.material_index] if len(me.materials)>p.material_index else None
                dark=mat and any(t in mat.name.lower() for t in ['rubber','track','recess','glass','cable'])
                # Preserve dark bores/vision slots and distinguish wheel discs within one static track mesh.
                mi.append(1 if dark else 2 if dest=='GUN' else 0)
            e.to_mesh_clear()
        baked[dest]=(vs,fs,mi,smooth,origin);kept[dest]=[o.name for o in objects]
    kept_flat={n for ns in kept.values() for n in ns};omitted=[o.name for o in all_geo if o.name not in kept_flat]
    # Compute MUZZLE directly from actual retained muzzle-lip geometry, not the gun pivot's height.
    lip=bpy.data.objects['MuzzleLip' if vehicle=='Panzer3' else 'Panzer6_Tiger1_MuzzleLip']
    lp=[rot@v for v in worldverts(lip)];mx=max(v.x for v in lp);front=[v for v in lp if mx-v.x<1e-4]
    muzzle=Vector((mx,(min(v.y for v in front)+max(v.y for v in front))/2,(min(v.z for v in front)+max(v.z for v in front))/2))
    root_shift=Vector((0,0,0))
    if vehicle=='Panzer6_Tiger1':
        bandpoints=[]
        for nm in ['Panzer6_Tiger1_L_TrackBand','Panzer6_Tiger1_R_TrackBand']:
            bandpoints.extend(rot@v for v in worldverts(bpy.data.objects[nm]))
        ground=min(v.z for v in bandpoints);contact=[v for v in bandpoints if v.z<ground+.02]
        root_shift=Vector(((min(v.x for v in contact)+max(v.x for v in contact))/2,(min(v.y for v in contact)+max(v.y for v in contact))/2,ground))
        for key,(vs,fs,mi,sm,origin) in list(baked.items()):
            if key in ['TURRET','GUN']:origin=origin-root_shift
            else:vs=[tuple(Vector(v)-root_shift) for v in vs]
            baked[key]=(vs,fs,mi,sm,origin)
        pivot-=root_shift;gp-=root_shift;muzzle-=root_shift
    bpy.ops.wm.read_homefile(use_empty=True, use_factory_startup=True)
    scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1;scene.unit_settings.length_unit='METERS'
    mats=[]
    for name,color in [('Armor_BaseColor',(.28,.30,.25)),('Mechanical_Dark',(.045,.052,.05)),('Gun_Accent',(.34,.36,.30))]:
        m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
        bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Metallic'].default_value=0;bs.inputs['Roughness'].default_value=.82;mats.append(m)
    def empty(n,origin):
        o=bpy.data.objects.new(n,None);scene.collection.objects.link(o);o.location=origin;return o
    root=empty(rootname,rootpos);tp=empty('TURRET_PIVOT',pivot);mu=empty('MUZZLE',muzzle);mu.empty_display_type='ARROWS';mu.empty_display_size=.15
    objs={}
    for key,(vs,fs,mi,sm,origin) in baked.items():
        me=bpy.data.meshes.new(key+'_Mesh');me.from_pydata(vs,[],fs);me.update()
        for m in mats:me.materials.append(m)
        for p,idx,s in zip(me.polygons,mi,sm):p.material_index=idx;p.use_smooth=s
        o=bpy.data.objects.new(key,me);scene.collection.objects.link(o);o.location=origin;objs[key]=o
    bpy.context.view_layer.update()
    def parent(o,p):
        w=o.matrix_world.copy();o.parent=p;o.matrix_parent_inverse=Matrix.Identity(4);o.matrix_world=w
    parent(objs['HULL'],root)
    for k in ['TRACK_L','TRACK_R']:parent(objs[k],objs['HULL'])
    parent(tp,objs['HULL']);parent(objs['TURRET'],tp);parent(objs['GUN'],objs['TURRET']);parent(mu,objs['GUN'])
    bpy.context.view_layer.update()
    before=state();motion=motion_check()
    # All stored node bases are neutral, positive unit scale; +X is MUZZLE forward.
    assert all(max(abs(s-1) for s in o.scale)<1e-5 for o in scene.objects)
    assert all(o.matrix_world.determinant()>0 for o in scene.objects)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend))
    window_op(bpy.ops.export_scene.gltf,filepath=str(outfile),export_format='GLB',export_yup=True,export_animations=False,export_skins=False,export_morph=False,export_cameras=False,export_lights=False,export_texcoords=False,export_tangents=False,export_normals=True,export_extras=False)
    gltf=parse_glb(outfile)
    assert len(gltf['meshes'])==5 and len(gltf['nodes'])==8
    assert all(not gltf.get(k) for k in ['animations','skins','textures','images'])
    assert len(gltf['materials'])<=3
    assert all('rotation' not in n and ('scale' not in n or all(abs(v-1)<1e-5 for v in n['scale'])) for n in gltf['nodes'])
    parents={child:i for i,n in enumerate(gltf['nodes']) for child in n.get('children',[])}
    def glb_world(i):
        node=gltf['nodes'][i];t=Vector(node.get('translation',[0,0,0]))
        return t+glb_world(parents[i]) if i in parents else t
    glb_positions={n['name']:list(glb_world(i)) for i,n in enumerate(gltf['nodes'])}
    for n,xyz in glb_positions.items():
        w=before[n]['world'];assert (Vector(xyz)-Vector((w[0],w[2],-w[1]))).length<1e-5
    bpy.ops.wm.read_homefile(use_empty=True, use_factory_startup=True)
    window_op(bpy.ops.import_scene.gltf,filepath=str(outfile))
    after=state();assert set(before)==set(after)
    location_error=max((Vector(before[n]['world'])-Vector(after[n]['world'])).length for n in before)
    dimension_error=max(abs(before[n]['dimensions'][i]-after[n]['dimensions'][i]) for n in before for i in range(3))
    assert location_error<1e-5 and dimension_error<1e-5
    assert all(before[n]['parent']==after[n]['parent'] for n in before)
    assert not bpy.data.actions and not any(o.type=='ARMATURE' for o in bpy.data.objects)
    assert all(o.matrix_world.determinant()>0 for o in bpy.context.scene.objects)
    motion_import=motion_check()
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];tri={}
    for o in meshes:o.data.calc_loop_triangles();tri[o.name]=len(o.data.loop_triangles)
    pts=[v for o in meshes for v in worldverts(o)];lo,hi=bounds(pts)
    means={n:sum(v.y for v in worldverts(bpy.data.objects[n]))/len(worldverts(bpy.data.objects[n])) for n in ['TRACK_L','TRACK_R']}
    assert means['TRACK_L']>0 and means['TRACK_R']<0
    gun=bpy.data.objects['GUN'];mu=bpy.data.objects['MUZZLE'];gv=worldverts(gun);mx=max(v.x for v in gv);tip=[v for v in gv if mx-v.x<1e-4]
    tipcenter=Vector((mx,(min(v.y for v in tip)+max(v.y for v in tip))/2,(min(v.z for v in tip)+max(v.z for v in tip))/2))
    muzzle_error=(tipcenter-mu.matrix_world.translation).length;assert muzzle_error<1e-4
    report={'vehicle':vehicle,'revision':'v02','technical_status':'PASS','visual_status':'PENDING actual image inspection','source':{'path':str(src),'sha256':hashes[str(src)],'units':'meters','forward':'-Y','up':'+Z','bounds_after_axis_conversion':orig_bounds,'root_policy':('Approved source root preserved without recentering' if vehicle=='Panzer3' else 'Existing root identity retained; candidate origin from retained static-track vertices within 2 cm of minimum Z; horizontal bounding midpoint; translate entire asset and pivots together; no scale change'),'root_shift_axis_converted_m':list(root_shift),'source_root':rootname},
    'outputs':{'blend':str(blend),'glb':str(outfile),'glb_bytes':outfile.stat().st_size},
    'geometry':{'meshes':5,'triangles':sum(tri.values()),'triangles_by_mesh':tri,'materials':len(gltf['materials']),'textures':len(gltf.get('textures',[])),'bounds_blender_m':[lo,hi],'dimensions_length_width_height_m':[hi[i]-lo[i] for i in range(3)],'kept':kept,'omitted':omitted},
    'hierarchy':{n:d['parent'] for n,d in after.items()},'pivots_blender_m':{n:after[n]['world'] for n in [rootname,'TURRET_PIVOT','GUN','MUZZLE']},'pivots_glb_m':glb_positions,
    'axis':{'blender':'+X forward / +Z up','glb':'+X forward / +Y up','geometry_and_pivots_same_rotation':'+90 degrees around source Blender Z','units':'meter; no normalization','muzzle_forward':[1,0,0],'tracks_blender_mean_y':means,'tracks_glb_left':'-Z','tracks_glb_right':'+Z'},
    'roundtrip':{'new_empty_scene':True,'parent_names_match':True,'max_location_error_m':location_error,'max_dimension_error_m':dimension_error,'muzzle_tip_center_error_m':muzzle_error,'motion':motion_import,'neutral_restored':True,'no_negative_scale':True,'animations':0,'skins':0,'armatures':0,'textures':0},
    'm41_reference':{'source':str(R/'M41/source/M41_RND_v02_muzzle.blend'),'glb':str(R/'M41/export/M41_RND_v02_muzzle.glb'),'policy':'Hierarchy, meters, axis and glTF export convention only; no shape or size copied'},
    'v01_corrections':['L/R labels assigned by physical side: Blender +Y left for +X forward, glTF -Z left','Bore and vision recesses retain dark color inside three-material budget','Tiny Panzer6_Tiger1 filter bolts omitted'],
    'limitations':[('Approved Panzer3 root retained; continuous tracks bottom +0.18 m, no unauthorized root/geometry height change' if vehicle=='Panzer3' else 'Panzer6_Tiger1 candidate root at simplified track contact footprint, not a claim of user-approved root'),'Motion test verifies transform relationships, not full motion-range collision clearance','No HTML/Three.js runtime integration, art-direction approval or gameplay validation']}
    report['outputs']['previews']=preview(vehicle,'RND_v02')
    report['outputs']['source_previews']=source_previews
    report['protected_files']=[{'path':str(p),'before':hashes[str(p)],'after':sha(p),'unchanged':hashes[str(p)]==sha(p)} for p in protected]
    assert all(x['unchanged'] for x in report['protected_files'])
    (vdir/'notes/asset_validation_v02.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    return {k:report[k] for k in ['vehicle','technical_status','outputs','pivots_glb_m','roundtrip']}|{'counts':{k:report['geometry'][k] for k in ['meshes','triangles','materials','textures','dimensions_length_width_height_m']}}
result=build(VEHICLE)
