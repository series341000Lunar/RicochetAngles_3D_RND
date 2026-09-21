import bpy,json,math,urllib.request,urllib.error
from . import core,properties,preview,presentation
URL='http://127.0.0.1:8766/api/workspace'
def request(method='GET',document=None,revision=None):
    headers={'Content-Type':'application/json'}
    if revision: headers['If-Match']=revision
    req=urllib.request.Request(URL,data=None if document is None else json.dumps(document,allow_nan=False).encode(),headers=headers,method=method)
    try:
        with urllib.request.urlopen(req,timeout=15) as response: return json.load(response)
    except urllib.error.HTTPError as exc: raise ValueError(exc.read().decode()) from exc

def collection(scene):
    c=bpy.data.collections.get('DCC-00 Authoring')
    if not c: c=bpy.data.collections.new('DCC-00 Authoring');scene.collection.children.link(c)
    elif c.name not in scene.collection.children: scene.collection.children.link(c)
    return c

def create_actor(scene,record):
    obj=bpy.data.objects.new(record['class'],None);collection(scene).objects.link(obj);obj['dcc_anchor']=True;obj['dcc_record']=json.dumps(record)
    properties.SUSPEND=True
    try:
        p=obj.dcc_actor;p.class_id=record['class'];p.ra_id=record.get('ra_id','')
        for key in core.CLASSES.get(p.class_id,{}).get('fields',{}):
            if key in record: setattr(p,key,record[key])
        t=record['transform'];obj.location=(t['x']/14,-t['y']/14,t['z']/14);obj.rotation_euler.z=-math.radians(record.get('facing',t['yaw']))
    finally: properties.SUSPEND=False
    preview.rebuild(obj)
    for item in bpy.context.selected_objects:item.select_set(False)
    obj.select_set(True);bpy.context.view_layer.objects.active=obj
    return obj

def create_path(scene,record):
    curve=bpy.data.curves.new(record['id'],'CURVE');curve.dimensions='3D';curve.bevel_depth=.05
    spline=curve.splines.new('POLY');spline.points.add(len(record['points'])-1)
    for point,v in zip(spline.points,record['points']):point.co=(v['x']/14,-v['y']/14,v['z']/14,1)
    obj=bpy.data.objects.new(record['id'],curve);collection(scene).objects.link(obj);obj['dcc_path_id']=record['id'];obj['dcc_record']=json.dumps(record);obj.show_in_front=True
    return obj

def load_document(scene,doc,revision=''):
    issues=core.validate(doc)
    if any(i['level']=='BLOCK' for i in issues): raise ValueError(json.dumps(issues))
    # Only tool-owned objects are refreshed. Other scene work is untouched.
    for name in [o.name for o in scene.objects]:
        obj=scene.objects.get(name)
        if obj is None: continue
        if obj.get('dcc_anchor'):
            preview.clear(obj);bpy.data.objects.remove(obj,do_unlink=True)
        elif obj.get('dcc_path_id'): bpy.data.objects.remove(obj,do_unlink=True)
    scene.dcc_settings.source_json=json.dumps(doc);scene.dcc_settings.revision=revision;scene.dcc_settings.deleted_json='[]'
    for record in doc['actors']+doc['decorations']:create_actor(scene,record)
    for record in doc['paths']:create_path(scene,record)
    build_world_guide(scene)
    scene.frame_start=0;scene.frame_end=600;scene.render.fps=30
    presentation.frame_change(scene)
    scene.dcc_settings.validation_json=json.dumps(issues);scene.dcc_settings.status='Workspace loaded — SAVE → RELOAD, no live sync'

def collect(scene):
    preview.cleanup_orphans(scene)
    source=json.loads(scene.dcc_settings.source_json) if scene.dcc_settings.source_json else json.loads((core.ROOT/'fixtures/seed.authoring.json').read_text())
    actors=[];decorations=[];ids=[]
    for obj in scene.objects:
        if not obj.get('dcc_anchor'):continue
        p=obj.dcc_actor;record=json.loads(obj.get('dcc_record','{}'));record['class']=p.class_id
        if p.class_id!='Decoration': record['ra_id']=p.ra_id;ids.append(p.ra_id)
        else: record.pop('ra_id',None)
        for key in core.CLASSES.get(p.class_id,{}).get('fields',{}):record[key]=getattr(p,key)
        record['transform']={**record.get('transform',{}),'x':obj.location.x*14,'y':-obj.location.y*14,'z':obj.location.z*14,'yaw':-math.degrees(obj.rotation_euler.z)}
        (decorations if p.class_id=='Decoration' else actors).append(record)
    doc=core.reconcile(source,actors,decorations,presentation.path_records(scene),json.loads(scene.dcc_settings.deleted_json))
    issues=core.validate(doc,ids)
    for obj in scene.objects:
        if obj.get('dcc_anchor') and (obj.parent or any(abs(v-1)>1e-5 for v in obj.scale) or abs(obj.rotation_euler.x)>1e-5 or abs(obj.rotation_euler.y)>1e-5):
            issues.append({'level':'BLOCK','code':'UNSUPPORTED_TRANSFORM','where':obj.name,'message':'DCC-00 supports unparented XYZ/yaw anchors at unit scale; preview geometry remains independent'})
    return doc,issues

def save(scene):
    doc,issues=collect(scene);scene.dcc_settings.validation_json=json.dumps(issues)
    if any(i['level']=='BLOCK' for i in issues): raise ValueError('BLOCK — inspect validation; source has not been overwritten')
    result=request('PUT',doc,scene.dcc_settings.revision)
    scene.dcc_settings.source_json=json.dumps(doc);scene.dcc_settings.revision=result['revision'];scene.dcc_settings.deleted_json='[]';scene.dcc_settings.status='Saved authoring JSON — Reload HTML / testbed'
    return result


def build_world_guide(scene):
    if any(o.get('dcc_world_guide') for o in scene.objects): return
    # Same 1280 x 3600 existing testbed bounds and 230-unit road; no gameplay data.
    curve=bpy.data.curves.new('Existing testbed bounds','CURVE');curve.dimensions='3D';curve.bevel_depth=.04
    points=[(0,0),(1280,0),(1280,3600),(0,3600),(0,0)]
    spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
    for p,(x,y) in zip(spline.points,points):p.co=(x/14,-y/14,0,1)
    obj=bpy.data.objects.new('Existing testbed 1280 x 3600',curve);collection(scene).objects.link(obj);obj['dcc_world_guide']=True;obj.hide_select=True
    for x in [525,755]:
        curve=bpy.data.curves.new('Existing road edge','CURVE');curve.dimensions='3D';curve.bevel_depth=.025;spline=curve.splines.new('POLY');spline.points.add(1)
        spline.points[0].co=(x/14,0,0,1);spline.points[1].co=(x/14,-3600/14,0,1)
        obj=bpy.data.objects.new('Existing road edge',curve);collection(scene).objects.link(obj);obj['dcc_world_guide']=True;obj.hide_select=True
