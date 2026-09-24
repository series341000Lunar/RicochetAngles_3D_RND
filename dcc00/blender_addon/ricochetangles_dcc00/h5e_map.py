"""DCC-MAP-01 bounded H5E adapter. Only XY translation is editable.
Original JSON values are retained; unsupported scene edits block export.
"""
import hashlib, json, math, os, tempfile
from pathlib import Path
import bpy
from bpy.props import StringProperty
from mathutils import Quaternion
from . import core
GROUPS = ('objects', 'markers', 'annotations')
SCALE = 14.0
OUTPUT = core.ROOT / 'workspace/dcc-map-01'
DEFAULT_SOURCE = Path.home() / 'Documents/Topdown Tank/maps/H5E_PILOT_MAP_PASS2_14W_v0.1.json'

def digest(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def records(doc): return [(g, r) for g in GROUPS for r in doc[g]]

def validate_source(doc):
    if doc.get('schemaVersion') != 'h5e-map-v0.2': raise ValueError('Expected h5e-map-v0.2')
    w = doc['world']
    if (w['origin'], w['axes'], w['rotation']) != ('TOP_LEFT',
            {'xPositive': 'RIGHT', 'yPositive': 'DOWN'},
            {'unit': 'DEGREES', 'positiveDirection': 'CLOCKWISE'}):
        raise ValueError('Unsupported coordinate contract')
    seen = set()
    for group, r in records(doc):
        if not r.get('id') or r['id'] in seen: raise ValueError('Missing / duplicate stable ID')
        seen.add(r['id']); geo = r['geometry']
        if geo['type'] not in ('RECT', 'CIRCLE', 'POLYLINE', 'POLYGON'):
            raise ValueError('Unsupported geometry; original file retained')
        point_geometry=geo['type'] in ('POLYLINE','POLYGON')
        if r.get('pivot', 'WORLD_POINTS' if point_geometry else 'CENTER') != ('WORLD_POINTS' if point_geometry else 'CENTER'):
            raise ValueError('Unsupported pivot')
        if point_geometry and r.get('rotationDegrees',0)!=0:
            raise ValueError('Nonzero WORLD_POINTS rotation unsupported')
        xy = geo.get('points', [geo])
        if not xy or any(not isinstance(p[k], (int, float)) or not math.isfinite(p[k])
                         for p in xy for k in ('x', 'y')):
            raise ValueError('Invalid coordinates')

def mesh_state(obj):
    if obj.type == 'CURVE':
        return [[s.type, s.use_cyclic_u, [list(p.co) for p in s.points]] for s in obj.data.splines]
    return None

def shape_points(geo):
    if geo['type'] in ('POLYLINE', 'POLYGON'):
        return [(p['x']/SCALE, -p['y']/SCALE, 0) for p in geo['points']]
    if geo['type'] == 'RECT':
        w, h = geo['width']/SCALE/2, geo['height']/SCALE/2
        return [(-w,-h,0), (w,-h,0), (w,h,0), (-w,h,0)]
    radius = geo['radius']/SCALE
    return [(radius*math.cos(i*math.tau/48), radius*math.sin(i*math.tau/48), 0) for i in range(48)]

def import_map(source, scene=None):
    source = Path(source).resolve(); raw = source.read_bytes()
    doc = json.loads(raw.decode('utf-8-sig')); validate_source(doc)
    if scene is None: scene = bpy.data.scenes.new('DCC-MAP-01 · ' + doc['metadata']['mapId'])
    if scene.get('h5e_source_json'): raise ValueError('Import into a new review scene')
    collection = bpy.data.collections.new('Canonical semantic anchors')
    scene.collection.children.link(collection); baseline = {}
    for group, r in records(doc):
        geo = r['geometry']; points = geo['type'] in ('POLYLINE', 'POLYGON')
        anchor = bpy.data.objects.new(r.get('displayName', r['id']), None)
        collection.objects.link(anchor)
        anchor['h5e_id'] = r['id']; anchor['h5e_group'] = group
        anchor.empty_display_type = 'PLAIN_AXES'; anchor.empty_display_size = 1
        anchor.location = (0,0,0) if points else (geo['x']/SCALE, -geo['y']/SCALE, 0)
        # WORLD_POINTS are absolute already; never rotate them a second time.
        anchor.rotation_euler.z = 0 if points else -math.radians(r.get('rotationDegrees', 0))
        anchor.lock_rotation = (True,True,True); anchor.lock_scale = (True,True,True)
        locked = r.get('locked', False) or not r.get('editable', True) or any(l['id']==r.get('layerId') and l.get('locked',False) for l in doc['layers'])
        anchor.lock_location = (locked,locked,True)
        curve = bpy.data.curves.new(r['id'] + ' reference', 'CURVE'); curve.dimensions = '3D'
        spline = curve.splines.new('POLY'); coords = shape_points(geo); spline.points.add(len(coords)-1)
        for p, xyz in zip(spline.points, coords): p.co = (*xyz, 1)
        spline.use_cyclic_u = geo['type'] in ('RECT','CIRCLE','POLYGON') or geo.get('closed',False)
        visual = bpy.data.objects.new(r['id']+' shape', curve); collection.objects.link(visual)
        visual.parent = anchor; visual['h5e_preview'] = True; visual.hide_select = True
        visual.hide_render = not r.get('visible',True); visual.hide_viewport = not r.get('visible',True)
        baseline[r['id']] = dict(group=group, location=list(anchor.location),
            rotation=list(anchor.rotation_euler), shape=mesh_state(visual), locked=locked)
    scene['h5e_source_json'] = json.dumps(doc, ensure_ascii=False)
    scene['h5e_baseline'] = json.dumps(baseline)
    scene['h5e_source_path'] = str(source); scene['h5e_source_sha256'] = hashlib.sha256(raw).hexdigest()
    scene['h5e_status'] = 'Imported canonical map · FORMAT VALID · source read-only'
    OUTPUT.mkdir(parents=True, exist_ok=True)
    scene['h5e_output_revisions'] = json.dumps({p.name:digest(p) for p in OUTPUT.glob('*.json')})
    snapshot = OUTPUT / ('source-' + scene['h5e_source_sha256'] + '.json')
    if not snapshot.exists(): snapshot.write_bytes(raw)
    return scene

def export_document(scene):
    doc = json.loads(scene['h5e_source_json']); baseline = json.loads(scene['h5e_baseline'])
    anchors = [o for o in scene.objects if 'h5e_id' in o]; ids = [o['h5e_id'] for o in anchors]
    if len(ids)!=len(set(ids)): raise ValueError('Duplicate canonical ID; no automatic merge/new ID')
    if set(ids)!=set(baseline): raise ValueError('Missing or added canonical record; no implicit deletion/addition')
    byid = {o['h5e_id']:o for o in anchors}
    for group, record in records(doc):
        obj = byid[record['id']]; base = baseline[record['id']]
        if obj['h5e_group'] != group or obj.parent or obj.constraints or obj.animation_data:
            raise ValueError('Unsupported membership / parent / constrained or animated anchor')
        if list(obj.rotation_euler)!=base['rotation'] or list(obj.scale)!=[1,1,1] or obj.location.z!=base['location'][2]:
            raise ValueError('DCC-MAP-01 supports XY translation only; rotation/scale/Z retained')
        visuals = [v for v in obj.children if v.get('h5e_preview')]
        if len(visuals)!=1: raise ValueError('Missing/duplicate reference geometry')
        v=visuals[0]
        if (mesh_state(v)!=base['shape'] or list(v.location)!=[0,0,0]
                or list(v.rotation_euler)!=[0,0,0] or list(v.scale)!=[1,1,1] or v.modifiers or v.constraints or v.animation_data):
            raise ValueError('Reference geometry edit unsupported; original geometry retained')
        dx=(obj.location.x-base['location'][0])*SCALE
        dy=-(obj.location.y-base['location'][1])*SCALE
        if (dx or dy) and base['locked']: raise ValueError('Locked/noneditable canonical record moved')
        if dx or dy:
            geo=record['geometry']
            for p in geo.get('points', [geo]):
                if dx: p['x'] += dx
                if dy: p['y'] += dy
    validate_source(doc); return doc

def save_map(scene, filename='edited.json'):
    doc=export_document(scene)
    if digest(scene['h5e_source_path'])!=scene['h5e_source_sha256']:
        raise ValueError('STALE_CANONICAL_SOURCE: original changed; preserve scene before reimport')
    target=(OUTPUT/filename).resolve()
    if not target.is_relative_to(OUTPUT.resolve()) or target.suffix!='.json':
        raise ValueError('Only DCC-MAP-01 working JSON output is writable')
    if target==Path(scene['h5e_source_path']).resolve(): raise ValueError('Read-only source')
    revisions=json.loads(scene.get('h5e_output_revisions','{}'))
    current=digest(target) if target.exists() else None
    if current!=revisions.get(target.name):
        raise ValueError('STALE_WORKING_COPY: output changed externally; save review .blend and reimport')
    data=(json.dumps(doc,ensure_ascii=False,indent=2,allow_nan=False)+'\n').encode('utf-8')
    with tempfile.NamedTemporaryFile(dir=OUTPUT,suffix='.tmp',delete=False) as f:
        temporary=f.name;f.write(data);f.flush();os.fsync(f.fileno())
    try: os.replace(temporary,target)
    finally:
        if os.path.exists(temporary):os.unlink(temporary)
    revisions[target.name]=hashlib.sha256(data).hexdigest()
    scene['h5e_output_revisions']=json.dumps(revisions)
    scene['h5e_status']='Exported working copy: '+target.name; return doc

class H5E_OT_import(bpy.types.Operator):
    bl_idname='dcc00.import_canonical'; bl_label='Import Canonical H5E Map (Read Only)'
    filepath: StringProperty(name='Canonical source',subtype='FILE_PATH',default=str(DEFAULT_SOURCE))
    def invoke(self,context,event): context.window_manager.fileselect_add(self); return {'RUNNING_MODAL'}
    def execute(self,context):
        try:
            previous=context.scene;scene=import_map(self.filepath)
            for window in context.window_manager.windows:
                if window.scene==previous:
                    window.scene=scene
                    world=json.loads(scene['h5e_source_json'])['world']
                    for area in window.screen.areas:
                        if area.type=='VIEW_3D':
                            region=area.spaces.active.region_3d
                            region.view_rotation=Quaternion((1,0,0,0))
                            region.view_location=(world['width']/SCALE/2,-world['height']/SCALE/2,0)
                            region.view_distance=world['width']/SCALE
                            region.view_perspective='ORTHO'
            return {'FINISHED'}
        except Exception as exc: self.report({'ERROR'},str(exc)); return {'CANCELLED'}

class H5E_OT_export(bpy.types.Operator):
    bl_idname='dcc00.export_canonical'; bl_label='Export H5E Working Copy'
    def execute(self,context):
        try: save_map(context.scene); self.report({'INFO'},'Saved DCC-MAP-01 working copy'); return {'FINISHED'}
        except Exception as exc:
            context.scene['h5e_status']='BLOCK: '+str(exc)
            self.report({'ERROR'},str(exc)); return {'CANCELLED'}

class H5E_PT_access(bpy.types.Panel):
    bl_label='DCC-MAP-01 Canonical Review'; bl_idname='H5E_PT_access'
    bl_space_type='VIEW_3D'; bl_region_type='UI'; bl_category='RICOCHETANGLES R&D'
    def draw(self,context):
        l=self.layout;l.operator('dcc00.import_canonical')
        if context.scene.get('h5e_source_json'): draw_review(l,context)

class H5E_UL_records(bpy.types.UIList):
    def filter_items(self,context,data,propname):
        return [self.bitflag_filter_item if o.get('h5e_id') else 0 for o in getattr(data,propname)],[]
    def draw_item(self,context,layout,data,item,icon,active_data,active_propname,index):
        layout.label(text=item.get('h5e_id',item.name),icon='EMPTY_AXIS')

def draw_review(l,context):
    scene=context.scene
    l.label(text='Canonical H5E · original read-only / XY translation slice')
    l.label(text=scene.get('h5e_status',''))
    if scene.get('env01'):
        from .env01 import draw_actions
        draw_actions(l)
    else:l.operator('dcc00.export_canonical')
    split=l.split(factor=.5);browser=split.column();detail=split.column()
    browser.label(text='Canonical records · stable IDs')
    browser.template_list('H5E_UL_records','canonical',scene,'objects',
        context.window_manager,'ra_actor_index',rows=12)
    from .authoring_window import anchor
    obj=anchor(context.view_layer.objects.active)
    if obj and obj.get('h5e_id'):
        doc=json.loads(scene['h5e_source_json'])
        record=next(r for _,r in records(doc) if r['id']==obj['h5e_id'])
        detail.label(text=obj['h5e_id']);detail.label(text='Collection: '+obj['h5e_group'])
        detail.label(text=record.get('displayName',''))
        detail.label(text='Role: '+record.get('markerType',record.get('layerId','')))
        detail.prop(obj,'location');detail.label(text='14 H5E units = 1 Blender review unit')
        detail.label(text='Locked: '+str(record.get('locked',False)))
        detail.label(text='Geometry: '+record['geometry']['type'])
    l.label(text='Other payload retained; unsupported edits block export')
    l.label(text='Save review .blend with File > Save As; no canonical overwrite')

CLASSES=[H5E_OT_import,H5E_OT_export,H5E_UL_records,H5E_PT_access]
