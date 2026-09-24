"""Bounded visual retarget of existing art. No map import/export or gameplay data.
Blender CLI: --python playable_environment.py -- retarget | refine | export
Save manual Blender changes before running export. Existing QA source is read-only.
"""
import bpy,sys,json,hashlib,math,re
from pathlib import Path
from mathutils import Matrix,Vector,Quaternion
DCC=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(DCC/'blender_addon'))
from ricochetangles_dcc00 import env01
ROOT=DCC/'workspace/playable-env'
OUT=DCC/'test-output/playable-env-recovery-20260925'
SOURCE=DCC/'workspace/env01/authoring.blend'
COLLECTION='PLAYABLE_ENV_STATIC'
phase=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'export'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
preserved={} if phase=='export' else json.loads((OUT/'preservation.json').read_text(encoding='utf-8-sig'))
def check_preserved():
    for p,h in preserved.items():
        assert sha(DCC.parent/p).upper()==h.upper(), 'Source changed since backup: '+p
def export(scene):
    # Reuse the unchanged bounded exporter, including revision/atomic-write checks.
    oldroot,oldcollection=env01.ROOT,env01.COLLECTION
    try:
        env01.ROOT=ROOT;env01.COLLECTION=COLLECTION
        env01.export_glb(scene)
    finally:env01.ROOT,env01.COLLECTION=oldroot,oldcollection
if phase!='export':check_preserved()
ROOT.mkdir(parents=True,exist_ok=True)
if phase=='retarget':
    assert not (ROOT/'authoring.blend').exists(),'Playable source already exists; preserve manual edits'
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    source=bpy.data.collections['ENV01_STATIC']
    meshes=[o for o in source.all_objects if o.type=='MESH']
    scene=bpy.data.scenes.new('Playable ENV Art')
    coll=bpy.data.collections.new(COLLECTION);scene.collection.children.link(coll)
    bpy.context.window.scene=scene
    # Same units and native Y-up, with a deliberate 90-degree ground-plane
    # composition rotation. Further authored groups are placed off spawn lanes.
    turn=Matrix.Rotation(math.pi/2,4,'Z')
    def converted(x,y):return Vector(((640+(y-700)*.7)/14,-(1800-(x-3075)*.7)/14,0))
    origin=converted(0,0)
    transform=Matrix.Translation(origin)@turn@Matrix.Scale(.7,4)
    copied=[]
    for original in meshes:
        o=original.copy();o.data=original.data.copy();o.parent=None
        o.matrix_world=transform@original.matrix_world.copy()
        for key in list(o.keys()):del o[key]
        o['visualOnly']=True
        coll.objects.link(o);copied.append((o,original.name))
    # Delete unused QA scenes only inside this unsaved derivative document.
    # No QA file is ever saved or rewritten.
    for other in list(bpy.data.scenes):
        if other!=scene:bpy.data.scenes.remove(other)
    keep={o.as_pointer() for o,_ in copied}
    for o in list(bpy.data.objects):
        if o.as_pointer() not in keep:bpy.data.objects.remove(o,do_unlink=True)
    for o,name in copied:o.name=name
    bpy.context.view_layer.update()
    def move_group(predicate,oldcenter,target):
        delta=Vector((target[0]/14,-target[1]/14,0))-converted(*oldcenter)
        for o,name in copied:
            if predicate(name):o.location+=delta
    move_group(lambda n:n=='ENV_WALL_01' or n.startswith('ENV_ART_wall_'),(3078,390),(220,1470))
    move_group(lambda n:n.startswith('ENV_BUNKER_') or n.startswith('ENV_ART_bunker_') or n.startswith('ENV_ART_roof_'),(3500,355),(1090,1480))
    move_group(lambda n:n=='ENV_WALL_02' or n.startswith('ENV_ART_sandbag_'),(3250,1050),(1060,2070))
    for i,(x,y) in enumerate(((970,1565),(1030,1590),(1090,1610)),1):
        name='ENV_PROP_CRATE_%02d'%i
        original=bpy.data.objects.get(name)
        group=[o for o,n in copied if n==name or n.startswith('ENV_ART_crate_%d_'%i)]
        base=next(o for o,n in copied if n==name)
        delta=Vector((x/14,-y/14,base.location.z))-base.location
        for o in group:o.location+=delta
    for i,(x,y) in enumerate(((1170,1620),(1205,1660)),1):
        group=[o for o,n in copied if n=='ENV_PROP_BARREL_%02d'%i or n.startswith('ENV_ART_barrel_%d_'%i)]
        base=next(o for o,n in copied if n=='ENV_PROP_BARREL_%02d'%i)
        delta=Vector((x/14,-y/14,base.location.z))-base.location
        for o in group:o.location+=delta
    move_group(lambda n:n.startswith('ENV_ART_wreck_'),(2600,915),(110,2110))
    # Keep the current ground object/material; reshape only this derivative mesh.
    ground=next(o for o,n in copied if n=='ENV_GROUND_01')
    ground.matrix_world=Matrix.Identity(4)
    for v in ground.data.vertices:
        v.co.x=(640+(1 if v.co.x>0 else -1)*620)/14
        v.co.y=-(1800+(1 if v.co.y>0 else -1)*700)/14
        v.co.z=(.4 if v.co.z>0 else -8)/14
    # Retain the source strip mesh topology/material; align to existing center road.
    road=next(o for o,n in copied if n=='ENV_ROAD_01');road.matrix_world=Matrix.Identity(4)
    for i,v in enumerate(road.data.vertices):
        v.co=((525 if i%2==0 else 755)/14,-(1120+(i//2)*680)/14,1/14)
    road.data.update()
    # Existing shoulders/track meshes would retain the old transverse lane:
    # reposition those same source mesh objects to the longitudinal road.
    for o,n in copied:
        if n.startswith('ENV_ART_road_shoulder_'):
            side=int(n[-1]);x0,x1=(505,525) if side==0 else (755,775)
            o.matrix_world=Matrix.Identity(4)
            pts=[(x0,1120),(x0,1800),(x0,2480),(x1,2480),(x1,1800),(x1,1120)]
            for v,(x,y) in zip(o.data.vertices,pts):v.co=(x/14,-y/14,.7/14)
            for p in o.data.polygons:
                if p.normal.z<0:p.flip()
        if n.startswith('ENV_ART_worn_track_'):
            parts=n.split('_');side=int(parts[-2]);i=int(parts[-1])
            o.location=( (640+side*48)/14,-(1230+i*220)/14,1.2/14)
            o.rotation_euler=(0,0,math.pi/2);o.scale=(.9,.7,.7)
    # Reference-only helpers for the existing code-owned world and spawns.
    guides=bpy.data.collections.new('REFERENCE_ONLY_NOT_EXPORTED');scene.collection.children.link(guides)
    for name,x,y,size in [('Player spawn',220,1800,33),('Boss spawn',955,1800,105),('Panzer spawn',600,1635,34),('Truck spawn',420,1965,25),('Pak spawn',830,1965,32)]:
        o=bpy.data.objects.new('REF '+name,None);guides.objects.link(o)
        o.location=(x/14,-y/14,0);o.empty_display_type='CIRCLE';o.empty_display_size=size/14
        o.show_name=True;o.hide_render=True
    scene['env01']=True
    scene['playable_env_visual_only']=True
    scene['env01_glb_revision']=''
    scene['source_art_sha256']=sha(SOURCE)
    scene['source_note']='Current manual ENV art retained; visual derivative only; Legacy world unchanged'
    scene['art_pass']='retarget'
elif phase in ('refine','export'):
    if bpy.app.background:
        bpy.ops.wm.open_mainfile(filepath=str(ROOT/'authoring.blend'))
    else:
        assert Path(bpy.data.filepath).resolve()==(ROOT/'authoring.blend').resolve(), 'Open the playable ENV derivative first'
    scene=bpy.context.scene
    assert scene.get('playable_env_visual_only')
    if phase=='refine':
        assert scene.get('art_pass')=='retarget','Refine already applied'
        # Normalize the copied object names from the initial retarget document.
        coll=bpy.data.collections[COLLECTION]
        for o in list(bpy.data.objects):
            if o.name not in coll.objects and not o.name.startswith('REF '):bpy.data.objects.remove(o,do_unlink=True)
        for o in coll.objects:
            o.name=re.sub(r'\.\d{3}$','',o.name)
        # Deliberate second pass after playable inspection: lower and reposition
        # the wall/bunker into the spawn camera while keeping the travel lane clear.
        for o in coll.objects:
            if o.name=='ENV_WALL_01' or o.name.startswith('ENV_ART_wall_'):
                o.location.y-=130/14
            if o.name.startswith('ENV_BUNKER_') or o.name.startswith('ENV_ART_bunker_') or o.name.startswith('ENV_ART_roof_'):
                o.location.y-=80/14
        for i,(x,y) in enumerate(((900,1530),(940,1530),(980,1530)),1):
            base=next(o for o in coll.objects if o.name=='ENV_PROP_CRATE_%02d'%i)
            delta=Vector((x/14,-y/14,base.location.z))-base.location
            for o in coll.objects:
                if o==base or o.name.startswith('ENV_ART_crate_%d_'%i):o.location+=delta
        for o in coll.objects:
            if len(o.data.polygons)==1 or o.name=='ENV_ROAD_01':
                o.data.update()
                for poly in o.data.polygons:
                    if poly.normal.z<-.5:poly.flip()
        for o in bpy.data.collections[COLLECTION].objects:
            if o.name=='ENV_WALL_01' or o.name.startswith('ENV_ART_wall_'):
                o.location.z*=.8;o.scale.z*=.8
        bpy.data.objects['ENV_ART_bunker_apron'].location.x-=90/14
        scene['art_pass']='refined'
else:raise ValueError(phase)
bpy.context.view_layer.update()
export(scene)
for screen in ([] if phase=='export' else bpy.data.screens):
    for area in screen.areas:
        if area.type=='VIEW_3D':
            v=area.spaces.active.region_3d;v.view_location=(640/14,-1800/14,0)
            v.view_distance=110;v.view_rotation=Quaternion((1,0,0,0));v.view_perspective='ORTHO'
            area.spaces.active.shading.color_type='MATERIAL'
# A native Blender Text entry calls the same export in the active session.
# No addon/editor/preferences/keymap change is needed.
text=bpy.data.texts.get('Export Playable ENV') or bpy.data.texts.new('Export Playable ENV')
text.clear()
text.write("# Run in Blender Text Editor (Alt+P) while this playable derivative is open.\nimport runpy\nrunpy.run_path("+repr(str(Path(__file__).resolve()))+", run_name='__main__')\n")
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'authoring.blend'))
if phase!='export':check_preserved()
result={'phase':phase,'blender':bpy.app.version_string,'glbSHA256':sha(ROOT/'geometry.glb'),'blendSHA256':sha(ROOT/'authoring.blend'),'objects':len(bpy.data.collections[COLLECTION].objects),'sourcePreserved':True}
OUT.mkdir(parents=True,exist_ok=True)
(OUT/(phase+'-blender.json')).write_text(json.dumps(result,indent=2))
print('PLAYABLE_ENV',json.dumps(result))
