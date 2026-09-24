"""Explicitly authored bounded ENV-01 scene. Not a map generator.
init creates a new derivative; mesh/map iterations reopen the saved Blender source.
"""
import sys,json,math,hashlib,shutil,struct,time
from pathlib import Path
import bpy
from mathutils import Quaternion
DCC=Path(__file__).resolve().parents[1];sys.path.insert(0,str(DCC/'blender_addon'))
import ricochetangles_dcc00 as addon
addon.register()
from ricochetangles_dcc00 import h5e_map as h,env01 as e
OUT=DCC/'test-output/env01';OUT.mkdir(parents=True,exist_ok=True)
phase=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'init'
start=time.perf_counter()
def record_by_id(doc,ident):return next(r for _,r in h.records(doc) if r['id']==ident)
def snapshot(tag):
    for filename in ('map.json','geometry.glb'):
        shutil.copyfile(e.ROOT/filename,OUT/(tag+'-'+filename))
def material(name,color):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    bsdf=m.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=(*color,1);bsdf.inputs['Roughness'].default_value=.87
    return m
def move_collection(obj):
    for c in list(obj.users_collection):c.objects.unlink(obj)
    bpy.data.collections[e.COLLECTION].objects.link(obj);obj['visualOnly']=True
def box(name,x,y,z,w,d,height,mat,yaw=0,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x/14,-y/14,z/14))
    o=bpy.context.object;o.name=name;o.dimensions=(w/14,d/14,height/14)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    # Origin at ground/base; geometry rises in Blender +Z.
    for v in o.data.vertices:v.co.z+=height/28
    o.rotation_euler.z=-math.radians(yaw);o.data.materials.append(mat);move_collection(o)
    if bevel:
        mod=o.modifiers.new('Small concrete edge bevel','BEVEL');mod.width=bevel/14;mod.segments=1
        o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    return o
def cylinder(name,x,y,z,radius,depth,mat,vertices=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius/14,depth=depth/14,location=(x/14,-y/14,(z+depth/2)/14))
    o=bpy.context.object;o.name=name;o.data.materials.append(mat);move_collection(o);return o
def anchor(name,x,y,ref):
    o=bpy.data.objects.new(name,None);bpy.data.collections[e.COLLECTION].objects.link(o)
    o.location=(x/14,-y/14,0);o['visualOnly']=True;o['reference']=ref;return o
if phase=='init':
    if (e.ROOT/'authoring.blend').exists():raise RuntimeError('Existing ENV source preserved; use mesh/map iteration or a versioned directory')
    source=DCC/'workspace/dcc-map-01/edited.json'
    original=Path.home()/'Documents/Topdown Tank/maps/H5E_PILOT_MAP_PASS2_14W_v0.1.json'
    preservation={str(p):e.sha(p) for p in (source,original)}
    (OUT/'preservation.json').write_text(json.dumps(preservation,indent=2))
    scene=h.import_map(source);bpy.context.window.scene=scene
    scene['env01']=True;scene['env01_map_revision']='';scene['env01_glb_revision']=''
    coll=bpy.data.collections.new(e.COLLECTION);scene.collection.children.link(coll)
    doc=json.loads(scene['h5e_source_json'])
    cover=record_by_id(doc,'H5E_P1_TUT_COVER_01');c=cover['geometry']
    cover2=record_by_id(doc,'H5E_P1_TUT_COVER_02')['geometry']
    route=record_by_id(doc,'H5E_P1_GUIDE_ROUTE_TUT')['geometry']['points'][3]
    ground=material('ENV soil muted olive',(.20,.245,.14))
    road=material('ENV packed gravel',(.37,.32,.22))
    concrete=material('ENV weathered concrete',(.39,.41,.35))
    cap=material('ENV light edge concrete',(.48,.49,.42))
    roof=material('ENV roof charcoal',(.22,.25,.22))
    wood=material('ENV crate timber',(.39,.25,.12))
    metal=material('ENV barrel oxide',(.27,.16,.105))
    rock=material('ENV rock limestone',(.35,.35,.29))
    box('ENV_GROUND_01',3075,700,-8,1550,1200,8,ground)
    # Three deliberate stations along the existing authored traversal route.
    stations=[(2350,650),(route['x'],route['y']),(3800,600)]
    verts=[]
    for i,(x,y) in enumerate(stations):
        a=stations[max(0,i-1)];b=stations[min(2,i+1)];dx=b[0]-a[0];dy=b[1]-a[1];n=math.hypot(dx,dy)
        for sign in (-1,1):verts.append(((x-sign*dy/n*82)/14,-(y+sign*dx/n*82)/14,.15))
    mesh=bpy.data.meshes.new('ENV authored road strip');mesh.from_pydata(verts,[],[(0,1,3,2),(2,3,5,4)]);mesh.update()
    obj=bpy.data.objects.new('ENV_ROAD_01',mesh);coll.objects.link(obj);obj.data.materials.append(road);obj['visualOnly']=True
    # Visual counterparts only; collision payload stays exclusively in the map.
    wall=box('ENV_WALL_01',c['x'],c['y'],0,c['width'],c['height'],84,concrete,cover['rotationDegrees'],3)
    wall['referenceStableId']=cover['id']
    wall2=cylinder('ENV_WALL_02',cover2['x'],cover2['y'],0,cover2['radius'],45,concrete,16)
    wall2['referenceStableId']='H5E_P1_TUT_COVER_02'
    # Unoccupied landmark shell; no Pillbox/actor/spawn identity.
    box('ENV_BUNKER_FLOOR',3500,355,0,250,200,12,concrete)
    for name,x,y,w,d in [('BACK',3500,270,250,30),('LEFT',3390,355,30,170),('RIGHT',3610,355,30,170),('FRONT_L',3425,440,100,30),('FRONT_R',3575,440,100,30)]:
        box('ENV_BUNKER_'+name,x,y,12,w,d,104,concrete,bevel=2)
    box('ENV_BUNKER_LINTEL',3500,440,88,50,30,28,cap)
    box('ENV_BUNKER_ROOF',3500,355,116,266,216,18,roof,bevel=3)
    for i,(x,y) in enumerate([(3360,565),(3420,575),(3470,585)],1):
        box('ENV_PROP_CRATE_%02d'%i,x,y,0,42,42,40,wood,yaw=i*8,bevel=2)
    for i,(x,y) in enumerate([(3625,555),(3670,575)],1):cylinder('ENV_PROP_BARREL_%02d'%i,x,y,0,17,44,metal)
    for i,(x,y) in enumerate([(2540,400),(3720,1050)],1):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=(x/14,-y/14,20/14))
        o=bpy.context.object;o.name='ENV_PROP_ROCK_%02d'%i;o.scale=(48/14,32/14,30/14);o.data.materials.append(rock);move_collection(o)
    anchor('ENV_ANCHOR_A',c['x'],c['y'],'H5E_P1_TUT_COVER_01 center')
    anchor('ENV_ANCHOR_B',cover2['x'],cover2['y'],'H5E_P1_TUT_COVER_02 center')
    anchor('ENV_ANCHOR_C',route['x'],route['y'],'H5E_P1_GUIDE_ROUTE_TUT points[3]')
    e.write_map(scene);e.export_glb(scene);snapshot('initial')
elif phase in ('mesh','map','refresh'):
    bpy.ops.wm.open_mainfile(filepath=str(e.ROOT/'authoring.blend'));scene=bpy.context.scene
    if phase=='mesh':
        bpy.data.objects['ENV_PROP_CRATE_01'].location.x+=2  # +28 H5E units
        e.export_glb(scene);snapshot('mesh')
    elif phase=='map':
        obj=next(o for o in scene.objects if o.get('h5e_id')=='H5E_P1_TUT_COVER_01')
        obj.location.x+=2  # intentional semantic edit, no height change
        # Explicit authoring alignment, not runtime mesh->semantic authority.
        bpy.data.objects['ENV_WALL_01'].location.x+=2
        bpy.data.objects['ENV_ANCHOR_A'].location.x+=2
        e.write_map(scene);e.export_glb(scene);snapshot('map')
    else:
        e.export_glb(scene);snapshot('initial')
else:raise ValueError('init | mesh | map | refresh')
bpy.context.view_layer.update()
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            region=area.spaces.active.region_3d;region.view_location=(3075/14,-700/14,0);region.view_distance=125
            region.view_rotation=Quaternion((1,0,0,0));region.view_perspective='ORTHO';area.spaces.active.shading.color_type='MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=str(e.ROOT/'authoring.blend'))
objects=[]
for o in bpy.data.collections[e.COLLECTION].all_objects:
    objects.append(dict(name=o.name,type=o.type,blenderPosition=list(o.location),blenderScale=list(o.scale)))
result=dict(phase=phase,blender=bpy.app.version_string,seconds=time.perf_counter()-start,objects=objects,
 mapSHA256=e.sha(e.ROOT/'map.json'),glbSHA256=e.sha(e.ROOT/'geometry.glb'))
(OUT/(phase+'-blender.json')).write_text(json.dumps(result,indent=2))
for source,expected in json.loads((OUT/'preservation.json').read_text()).items():assert e.sha(source)==expected,source
print('ENV01_AUTHORING_PASS',phase)