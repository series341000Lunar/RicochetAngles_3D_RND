"""One bounded art session on the existing Current Stage, not a map generator.
Run pass 'structure', inspect in the existing browser, then run 'refine'.
Keeps original objects, semantic data and map bytes; exports through existing addon.
"""
import bpy, sys, math, json, hashlib
from pathlib import Path
from mathutils import Vector
DCC=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(DCC/'blender_addon'))
import ricochetangles_dcc00 as addon
addon.register()
from ricochetangles_dcc00 import env01 as e
OUT=DCC/'test-output/art-production-20260924'
phase=sys.argv[sys.argv.index('--')+1]
bpy.ops.wm.open_mainfile(filepath=str(e.ROOT/'authoring.blend'))
scene=bpy.context.scene
coll=bpy.data.collections[e.COLLECTION]
digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
map_hash=digest(e.ROOT/'map.json')
assert map_hash==digest(OUT/'before/map.json')
# The preserved baseline GLB differs from its previous export only in float32 BIN
# values (max 5.96e-8); JSON topology/materials/transforms are identical.
if phase=='structure':
    assert digest(e.ROOT/'authoring.blend')==digest(OUT/'before/authoring.blend')
    assert digest(e.ROOT/'geometry.glb')==digest(OUT/'before/geometry.glb')
    scene['env01_glb_revision']=digest(e.ROOT/'geometry.glb')
assert not scene.get('current_stage_art_'+phase), 'Pass already applied; preserve current manual work'
def mat(name,c):
    m=bpy.data.materials.new('ENV Art '+name);m.diffuse_color=(*c,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=.94
    return m
def link(o,name,m):
    o.name='ENV_ART_'+name
    for c in list(o.users_collection):c.objects.unlink(o)
    coll.objects.link(o);o['visualOnly']=True
    o.data.materials.append(m);return o
def box(name,x,y,z,w,d,h,m,yaw=0,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x/14,-y/14,(z+h/2)/14))
    o=link(bpy.context.object,name,m);o.dimensions=(w/14,d/14,h/14)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.rotation_euler.z=-math.radians(yaw)
    if bevel:
        b=o.modifiers.new('Authored worn edge','BEVEL');b.width=bevel/14;b.segments=1
        o.modifiers.new('Face normals','WEIGHTED_NORMAL')
    return o
def cyl(name,x,y,z,r,h,m,n=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=n,radius=r/14,depth=h/14,location=(x/14,-y/14,(z+h/2)/14))
    return link(bpy.context.object,name,m)
def patch(name,points,m):
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata([(x/14,-y/14,z/14) for x,y,z in points],[],[tuple(range(len(points)))])
    mesh.update();o=bpy.data.objects.new('ENV_ART_'+name,mesh);coll.objects.link(o);o.data.materials.append(m);o['visualOnly']=True
    return o
def rock(name,x,y,z,sx,sy,sz,m):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=(x/14,-y/14,z/14))
    o=link(bpy.context.object,name,m);o.scale=(sx/14,sy/14,sz/14);return o
def setmat(name,m):
    o=bpy.data.objects[name];o.data.materials.clear();o.data.materials.append(m)
def localpart(parent,name,dx,dy,z,w,d,h,m):
    # Rotate details with the existing hand-positioned source object.
    o=bpy.data.objects[parent];p=o.matrix_world@Vector((dx/14,dy/14,z/14))
    return box(name,p.x*14,-p.y*14,p.z*14,w,d,h,m,-math.degrees(o.rotation_euler.z),1)
if phase=='structure':
    soil=mat('dry grass',(.25,.29,.15));earth=mat('exposed earth',(.30,.255,.17))
    gravel=mat('road gravel',(.46,.405,.29));shoulder=mat('road shoulder',(.34,.30,.205))
    concrete=mat('aged concrete',(.44,.46,.39));edge=mat('worn concrete edge',(.57,.56,.46))
    dark=mat('recess charcoal',(.105,.12,.105));wood=mat('timber honey',(.43,.31,.16))
    iron=mat('dark iron',(.16,.185,.17));sand=mat('sandbag canvas',(.48,.43,.28))
    rust=mat('muted oxide',(.32,.195,.12))
    setmat('ENV_GROUND_01',soil);setmat('ENV_ROAD_01',gravel)
    # Broad deliberate soil shapes retain a quiet travel lane.
    for name,pts in [
      ('soil_north',[(2330,140,1),(2830,140,1),(2920,300,1),(2690,485,1),(2420,500,1)]),
      ('bunker_apron',[(3270,240,1),(3740,240,1),(3780,590,1),(3610,720,1),(3280,630,1)]),
      ('emplacement_soil',[(3030,930,1),(3250,905,1),(3440,1010,1),(3390,1220,1),(3120,1250,1)]),
      ('south_earth',[(2340,980,1),(2640,945,1),(2860,1100,1),(2790,1280,1),(2340,1270,1)])]:
        patch(name,pts,earth)
    # Shoulders are derivatives of the existing six road stations, no route edit.
    road=bpy.data.objects['ENV_ROAD_01']
    points=[v.co.copy() for v in road.data.vertices]
    for side in (0,1):
        p=[]
        for i in range(0,6,2):
            v=points[i+side];other=points[i+1-side]
            outward=(v-other).normalized()
            p.append((v.x*14,-v.y*14,1.3))
        for i in reversed(range(0,6,2)):
            v=points[i+side];other=points[i+1-side];v=v+(v-other).normalized()*2.4
            p.append((v.x*14,-v.y*14,1.3))
        patch('road_shoulder_'+str(side),p,shoulder)
    # Main wall: cap slabs, vertical construction joints and foot buttresses.
    setmat('ENV_WALL_01',concrete)
    bpy.context.view_layer.update()
    for i,dx in enumerate((-136,-68,0,68,136)):
        localpart('ENV_WALL_01','wall_cap_'+str(i),dx,0,84,66,87,9,edge)
        if i<4:localpart('ENV_WALL_01','wall_joint_'+str(i),dx+34,-40.5,6,2,1,75,dark)
    for i,dx in enumerate((-145,-48,48,145)):
        localpart('ENV_WALL_01','wall_buttress_'+str(i),dx,-48,0,19,25,58,concrete)
    for name in ('FLOOR','BACK','LEFT','RIGHT','FRONT_L','FRONT_R','LINTEL'):
        setmat('ENV_BUNKER_'+name,concrete)
    setmat('ENV_BUNKER_ROOF',edge)
    box('bunker_roof_inset',3500,355,134,232,182,5,earth,bevel=3)
    box('bunker_roof_back_lip',3500,263,134,256,12,14,concrete)
    box('bunker_roof_left_lip',3376,355,134,12,185,14,concrete)
    box('bunker_roof_right_lip',3624,355,134,12,185,14,concrete)
    box('bunker_entrance_recess',3500,429,12,48,2,75,dark)
    box('bunker_apron_step',3500,486,0,94,68,6,edge,bevel=2)
    box('bunker_threshold',3500,456,6,62,18,6,concrete)
    for i,x in enumerate((3425,3575)):
        box('bunker_front_slit_'+str(i),x,456,68,58,2,15,dark)
        box('bunker_front_sill_'+str(i),x,459,63,66,9,5,edge)
    for i,y in enumerate((322,347,372,397)):
        box('roof_vent_'+str(i),3560,y,139,42,9,7,iron,bevel=1)
    # Existing large cylindrical cover becomes a sandbag-ring defensive landmark.
    setmat('ENV_WALL_02',earth)
    for row in range(2):
        for i in range(14):
            a=2*math.pi*(i+row*.5)/14
            box('sandbag_%d_%02d'%(row,i),3250+77*math.cos(a),1050+77*math.sin(a),45+row*13,32,19,13,sand,math.degrees(a)+90,4)
    # Re-space existing crates, retaining their editable originals.
    for i,(x,y) in enumerate(((3340,552),(3415,570),(3490,587)),1):
        o=bpy.data.objects['ENV_PROP_CRATE_%02d'%i];o.location.x=x/14;o.location.y=-y/14;o.data.materials.clear();o.data.materials.append(wood)
    bpy.context.view_layer.update()
    for i in range(1,4):
        parent='ENV_PROP_CRATE_%02d'%i
        for j,dx in enumerate((-15,15)):
            localpart(parent,'crate_%d_top_band_%d'%(i,j),dx,0,40,4,43,2,iron)
            localpart(parent,'crate_%d_front_band_%d'%(i,j),dx,-21.5,0,4,2,40,iron)
        for j,dx in enumerate((-7,7)):
            localpart(parent,'crate_%d_lid_seam_%d'%(i,j),dx,0,40.2,1,41,.5,dark)
    for i,(x,y) in enumerate(((3625,555),(3670,575)),1):
        setmat('ENV_PROP_BARREL_%02d'%i,rust)
        for j,z in enumerate((4,22,40)):cyl('barrel_%d_hoop_%d'%(i,j),x,y,z,17.8,2,iron)
        cyl('barrel_%d_bung'%i,x+5,y,44,3,1,dark,8)
    # Terrain knolls lie off the route and away from semantic reference anchors.
    for i,(x,y,sx,sy,h) in enumerate(((2470,260,130,85,27),(2720,240,100,65,20),(3720,1130,95,105,29),(2540,1150,145,82,22))):
        rock('terrain_knoll_'+str(i),x,y,-3,sx,sy,h,soil)
elif phase=='refine':
    assert scene.get('current_stage_art_structure'), 'Structure pass required'
    # Changes chosen after the first 75-degree render inspection.
    m=lambda n:bpy.data.materials['ENV Art '+n]
    soil=m('dry grass');dark=m('recess charcoal');iron=m('dark iron');rust=m('muted oxide')
    stone=mat('stone fragments',(.43,.43,.35));grass=mat('grass tufts',(.29,.33,.16))
    # Two quiet, broken wheel tracks give the flat road a readable direction.
    for side in (-1,1):
        for i,(x,y,w,yaw) in enumerate(((2490,697,150,18),(2670,757,160,18),(2980,764,170,-11),(3220,716,185,-11),(3450,670,170,-11),(3660,628,160,-11))):
            box('worn_track_%d_%d'%(side,i),x,y+side*36,2.15,w,8,.22,m('road shoulder'),yaw)
    # Low ruined masonry / debris group, away from the clear travel lane.
    for i,(x,y,w,d,h,yaw) in enumerate(((2770,1065,80,22,27,8),(2845,1078,45,22,17,-12),(2730,1120,24,42,18,27),(2875,1130,22,28,11,35))):
        box('ruin_stone_'+str(i),x,y,0,w,d,h,stone,yaw,3)
    # Small static collapsed utility cart: no asset/actor/gameplay identity.
    box('wreck_chassis',2600,915,12,100,49,11,iron,-12,2)
    box('wreck_rusted_bed',2600,915,24,82,42,5,rust,-12,2)
    for i,(x,y) in enumerate(((2565,883),(2628,870),(2578,942),(2640,929))):
        o=cyl('wreck_wheel_'+str(i),x,y,0,15,9,dark,10)
        o.rotation_euler.x=math.pi/2;o.location.z=16/14
    box('wreck_broken_board',2600,915,31,110,9,5,m('timber honey'),23)
    for i,(x,y,sx,sy,sz) in enumerate(((2500,420,16,12,10),(2575,440,12,17,9),(3010,290,12,8,8),(3150,305,17,12,10),(3730,1010,20,13,13),(3680,1090,12,9,9))):
        rock('rubble_'+str(i),x,y,sz/2,sx,sy,sz,stone)
    # Sparse hand-placed vegetation clusters, no generator/seed/system.
    for i,(x,y) in enumerate(((2390,230),(2430,250),(2720,190),(2790,230),(2390,1140),(2480,1200),(2580,1180),(3030,1190),(3110,1210),(3450,1140),(3660,1200),(3750,1120))):
        for j,(dx,dy,h) in enumerate(((-7,0,17),(3,5,25),(10,-4,15))):
            patch('grass_%d_%d_a'%(i,j),[(x+dx-5,y+dy,1),(x+dx+5,y+dy,1),(x+dx+1,y+dy,h)],grass)
            patch('grass_%d_%d_b'%(i,j),[(x+dx,y+dy-5,1),(x+dx,y+dy+5,1),(x+dx,y+dy+1,h)],grass)
    # Lower wall profile slightly so its foundation/road relationship reads at 75.
    for o in coll.objects:
        if o.name.startswith('ENV_ART_wall_buttress'):o.scale.z*=.85
    # Upward normals for horizontal soil/shoulder polygons; no renderer change.
    for o in coll.objects:
        if o.type=='MESH' and o.name.startswith('ENV_ART_'):
            for poly in o.data.polygons:
                if len(o.data.polygons)==1 and poly.normal.z < -.5: poly.flip()
            o.data.update()
else:raise ValueError(phase)
scene['current_stage_art_'+phase]=True
bpy.context.view_layer.update()
e.export_glb(scene)
bpy.ops.wm.save_as_mainfile(filepath=str(e.ROOT/'authoring.blend'))
assert digest(e.ROOT/'map.json')==map_hash
result={'pass':phase,'blender':bpy.app.version_string,'mapUnchanged':True,'mapSHA256':map_hash,'glbSHA256':digest(e.ROOT/'geometry.glb'),'blendSHA256':digest(e.ROOT/'authoring.blend'),'glbBytes':(e.ROOT/'geometry.glb').stat().st_size,'staticObjects':len(coll.objects)}
(OUT/(phase+'-blender.json')).write_text(json.dumps(result,indent=2))
print('CURRENT_STAGE_ART',json.dumps(result))
