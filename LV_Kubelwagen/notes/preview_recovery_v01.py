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
    shading=scene.display.shading;shading.light='STUDIO';shading.color_type='MATERIAL';shading.show_shadows=False;shading.show_cavity=True;shading.cavity_type='BOTH';shading.background_type='WORLD';scene.world.color=(.075,.075,.075)
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
        if False:
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

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(R/'LV_Kubelwagen/export/LV_Kubelwagen_RND_v01.glb'))
preview('LV_Kubelwagen','RND_v01')
for angle,tag in [(-25,'steer_minus25'),(25,'steer_plus25')]:
    for name in ['STEER_FL','STEER_FR']:
        o=bpy.data.objects[name];o.rotation_mode='XYZ';o.rotation_euler.z=math.radians(angle)
    bpy.context.view_layer.update()
    preview('LV_Kubelwagen',tag)
bpy.ops.wm.open_mainfile(filepath=str(R/'LV_Kubelwagen/source/LV_Kubelwagen_RND_v01.blend'))
assert len(bpy.context.scene.objects)==8
assert all(abs(o.rotation_euler.length)<1e-6 for o in bpy.context.scene.objects)
print('RECOVERY_REOPEN_NEUTRAL_PASS')

