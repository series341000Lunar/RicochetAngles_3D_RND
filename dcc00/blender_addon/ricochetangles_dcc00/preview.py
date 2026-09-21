import bpy
from mathutils import Matrix
from .core import ASSETS,asset_path

def descendants(obj):
    return [child for c in list(obj.children) for child in [*descendants(c),c]]
def clear(obj):
    for child in descendants(obj):
        data=child.data
        bpy.data.objects.remove(child,do_unlink=True)
        if data and data.users==0:
            if isinstance(data,bpy.types.Mesh): bpy.data.meshes.remove(data)
            elif isinstance(data,bpy.types.Curve): bpy.data.curves.remove(data)

def rebuild(anchor):
    """Preview subtree never carries identity; replacements cannot delete the anchor."""
    active_obj=bpy.context.view_layer.objects.active;active_name=active_obj.name if active_obj else None;selected_names=[o.name for o in bpy.context.selected_objects]
    clear(anchor)
    motion=bpy.data.objects.new('Preview motion',None);anchor.users_collection[0].objects.link(motion);motion.parent=anchor;motion['dcc_preview']=True;motion['dcc_motion']=True
    p=anchor.dcc_actor;spec=ASSETS.get(p.asset,{});local=asset_path(p.asset);loaded=False
    if p.class_id in ('LightTank','PresentationActor','Decoration') and local and local.is_file():
        before=set(bpy.data.objects)
        try:
            bpy.ops.import_scene.gltf(filepath=str(local))
            created=set(bpy.data.objects)-before
            for obj in created:
                if obj.parent not in created: obj.parent=motion;obj.matrix_parent_inverse=Matrix.Identity(4)
                for collection in list(obj.users_collection): collection.objects.unlink(obj)
                anchor.users_collection[0].objects.link(obj);obj['dcc_preview']=True;obj.hide_select=True
            motion.scale=(spec.get('previewScale',1),)*3;loaded=True
        except Exception as exc:
            for obj in set(bpy.data.objects)-before: bpy.data.objects.remove(obj,do_unlink=True)
            anchor['dcc_preview_error']=str(exc)
    missing=p.class_id in ('LightTank','PresentationActor','Decoration') and not loaded and not spec.get('proxy')
    anchor['dcc_preview_state']='GLB' if loaded else 'MISSING_ASSET' if missing else 'PROXY'
    if not loaded:
        bpy.ops.mesh.primitive_cube_add(size=1)
        obj=bpy.context.object;obj.name='MISSING_ASSET proxy' if missing else p.class_id+' proxy'
        obj.parent=motion;obj.location=(0,0,.5);obj['dcc_preview']=True;obj.hide_select=True
        if p.class_id=='Trigger': obj.scale=(p.sizeX/14,p.sizeY/14,1);obj.display_type='WIRE';obj.color=(1,.55,.1,1)
        elif p.class_id=='Checkpoint': obj.scale=(1,1,2);obj.color=(.1,.8,1,1)
        elif p.class_id in ('LightTank','PresentationActor'): obj.scale=(3,1.5,1);obj.color=(1,.1,.3,1)
        else: obj.scale=(1.2,1.2,1);obj.color=(.5,.6,.3,1)
        mat=bpy.data.materials.get('DCC '+p.class_id) or bpy.data.materials.new('DCC '+p.class_id);mat.diffuse_color=obj.color;obj.data.materials.append(mat)
    anchor.show_name=True;anchor.empty_display_type='ARROWS';anchor.empty_display_size=2
    for obj in bpy.context.selected_objects: obj.select_set(False)
    for name in selected_names:
        obj=bpy.context.view_layer.objects.get(name)
        if obj: obj.select_set(True)
    active=bpy.context.view_layer.objects.get(active_name) if active_name else None
    if active: bpy.context.view_layer.objects.active=active
    motion.hide_render=not p.enabled if p.class_id!='Decoration' else False
    motion.hide_viewport=motion.hide_render
    return anchor['dcc_preview_state']


def cleanup_orphans(scene):
    # Ordinary deletion of an anonymous anchor must not leave ghost previews.
    for name in [o.name for o in scene.objects]:
        obj=scene.objects.get(name)
        if obj is None: continue
        if obj.get('dcc_motion') and obj.parent is None:
            clear(obj);bpy.data.objects.remove(obj,do_unlink=True)


_cleanup_scheduled=False
from bpy.app.handlers import persistent
@persistent
def schedule_cleanup(scene,*args):
    global _cleanup_scheduled
    if _cleanup_scheduled or not any(o.get('dcc_motion') and o.parent is None for o in scene.objects): return
    _cleanup_scheduled=True
    def run():
        global _cleanup_scheduled
        try: cleanup_orphans(bpy.context.scene)
        finally: _cleanup_scheduled=False
        return None
    bpy.app.timers.register(run,first_interval=.05)
