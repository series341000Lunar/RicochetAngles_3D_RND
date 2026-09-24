"""ENV-01 export actions; bounded static collection, same Blender session."""
import hashlib,json,os,tempfile
from pathlib import Path
import bpy
from . import core,h5e_map
ROOT=core.ROOT/'workspace/env01'
COLLECTION='ENV01_STATIC'
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def write_map(scene):
    target=ROOT/'map.json'
    if sha(scene['h5e_source_path'])!=scene['h5e_source_sha256']:
        raise ValueError('STALE_WORKING_SOURCE: preserve .blend before reimport')
    if (sha(target) if target.exists() else '')!=scene.get('env01_map_revision',''):
        raise ValueError('STALE_STAGE_MAP: output changed externally')
    doc=h5e_map.export_document(scene)
    raw=(json.dumps(doc,ensure_ascii=False,indent=2,allow_nan=False)+'\n').encode()
    ROOT.mkdir(parents=True,exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=ROOT,suffix='.tmp',delete=False) as f:
        name=f.name;f.write(raw);f.flush();os.fsync(f.fileno())
    try:os.replace(name,target)
    finally:
        if os.path.exists(name):os.unlink(name)
    scene['env01_map_revision']=sha(target)
    return target
def export_glb(scene):
    coll=bpy.data.collections.get(COLLECTION)
    if not scene.get('env01') or not coll:raise ValueError('Open the ENV-01 authoring .blend')
    objects=list(coll.all_objects)
    if not objects or any(o.type not in ('MESH','EMPTY') or not o.name.startswith('ENV_') or o.get('h5e_id') or o.get('dcc_anchor') or (o.parent and o.parent not in objects) for o in objects):
        raise ValueError('Only named static ENV meshes/anchors may be exported')
    target=ROOT/'geometry.glb'
    if (sha(target) if target.exists() else '')!=scene.get('env01_glb_revision',''):
        raise ValueError('STALE_ENV_GLB: derivative changed externally')
    with tempfile.NamedTemporaryFile(dir=ROOT,suffix='.glb',delete=False) as f: temporary=f.name
    selected=list(bpy.context.selected_objects);active=bpy.context.view_layer.objects.active
    try:
        for o in bpy.context.view_layer.objects:o.select_set(False)
        for o in objects:o.select_set(True)
        # Native glTF Y-up: Blender (X,Y,Z) -> glTF (X,Z,-Y).
        # No manual axis rotation. Runtime applies uniform review scale 14 once.
        result=bpy.ops.export_scene.gltf(filepath=temporary,export_format='GLB',
            use_selection=True,use_active_scene=True,export_yup=True,export_apply=True,export_extras=False,
            export_animations=False,export_cameras=False,export_lights=False,
            export_materials='EXPORT',export_draco_mesh_compression_enable=False)
        if result!={'FINISHED'}:raise ValueError('GLB export did not finish; prior derivative retained')
        os.replace(temporary,target)
    finally:
        if os.path.exists(temporary):os.unlink(temporary)
        for o in bpy.context.view_layer.objects:o.select_set(False)
        for o in selected:
            if o.name in bpy.context.view_layer.objects:o.select_set(True)
        bpy.context.view_layer.objects.active=active
    scene['env01_glb_revision']=sha(target)
    return target

class ENV_OT_map(bpy.types.Operator):
    bl_idname='dcc00.env01_map';bl_label='Export ENV-01 Stage Map'
    @classmethod
    def poll(cls,context):return bool(context.scene.get('env01'))
    def execute(self,context):
        try:write_map(context.scene);self.report({'INFO'},'ENV-01 map.json exported');return {'FINISHED'}
        except Exception as e:self.report({'ERROR'},str(e));return {'CANCELLED'}
class ENV_OT_glb(bpy.types.Operator):
    bl_idname='dcc00.env01_glb';bl_label='Export ENV-01 geometry.glb'
    @classmethod
    def poll(cls,context):return bool(context.scene.get('env01'))
    def execute(self,context):
        try:export_glb(context.scene);self.report({'INFO'},'ENV-01 static GLB exported');return {'FINISHED'}
        except Exception as e:self.report({'ERROR'},str(e));return {'CANCELLED'}
def draw_actions(layout):
    layout.label(text='ENV-01 · static visual derivative / USER VISUAL REVIEW PENDING')
    row=layout.row();row.operator('dcc00.env01_map');row.operator('dcc00.env01_glb')
CLASSES=[ENV_OT_map,ENV_OT_glb]