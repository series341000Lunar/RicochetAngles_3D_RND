import bpy,json,uuid
from . import core,io_authoring,preview,presentation
def semantic_object(context):
    obj=context.object or context.view_layer.objects.active
    while obj and not obj.get('dcc_anchor'):obj=obj.parent
    return obj

class DCC_OT_reload(bpy.types.Operator):
    @classmethod
    def poll(cls,context): return not context.scene.get('h5e_source_json')
    bl_idname='dcc00.reload';bl_label='Reload Workspace';bl_description='Replace DCC-00 scene edits with saved workspace; unrelated objects are preserved'
    def invoke(self,context,event):return context.window_manager.invoke_confirm(self,event)
    def execute(self,context):
        try:
            result=io_authoring.request();io_authoring.load_document(context.scene,result['document'],result['revision']);return {'FINISHED'}
        except Exception as exc:self.report({'ERROR'},str(exc));context.scene.dcc_settings.status=str(exc);return {'CANCELLED'}
class DCC_OT_create(bpy.types.Operator):
    @classmethod
    def poll(cls,context): return not context.scene.get('h5e_source_json')
    bl_idname='dcc00.create';bl_label='Create Actor';bl_options={'REGISTER','UNDO'}
    def execute(self,context):
        if not context.scene.dcc_settings.source_json:self.report({'ERROR'},'Reload workspace first');return {'CANCELLED'}
        c=context.scene.cursor.location
        obj=io_authoring.create_actor(context.scene,core.new_actor(context.scene.dcc_settings.class_to_create,c.x*14,-c.y*14))
        obj.location.z=c.z;return {'FINISHED'}
class DCC_OT_save(bpy.types.Operator):
    @classmethod
    def poll(cls,context): return not context.scene.get('h5e_source_json')
    bl_idname='dcc00.save';bl_label='Save Authoring JSON'
    def execute(self,context):
        try:io_authoring.save(context.scene);return {'FINISHED'}
        except Exception as exc:self.report({'ERROR'},str(exc));context.scene.dcc_settings.status=str(exc);return {'CANCELLED'}
class DCC_OT_validate(bpy.types.Operator):
    @classmethod
    def poll(cls,context): return not context.scene.get('h5e_source_json')
    bl_idname='dcc00.validate';bl_label='Validate'
    def execute(self,context):
        try:
            _,issues=io_authoring.collect(context.scene);context.scene.dcc_settings.validation_json=json.dumps(issues);context.scene.dcc_settings.status=core.validation_summary(issues);return {'FINISHED'}
        except Exception as exc:self.report({'ERROR'},str(exc));return {'CANCELLED'}
class DCC_OT_delete(bpy.types.Operator):
    @classmethod
    def poll(cls,context): return not context.scene.get('h5e_source_json')
    bl_idname='dcc00.delete';bl_label='Delete Semantic Actor';bl_options={'REGISTER','UNDO'}
    def invoke(self,context,event):return context.window_manager.invoke_confirm(self,event)
    def execute(self,context):
        obj=semantic_object(context)
        if not obj or not obj.get('dcc_anchor'):return {'CANCELLED'}
        if obj.dcc_actor.class_id!='Decoration':
            ident=obj.dcc_actor.ra_id
            if not ident or sum(o.get('dcc_anchor',False) and o.dcc_actor.ra_id==ident for o in context.scene.objects)!=1:self.report({'ERROR'},'Resolve missing/duplicate ID first');return {'CANCELLED'}
            deleted=json.loads(context.scene.dcc_settings.deleted_json);deleted.append(ident);context.scene.dcc_settings.deleted_json=json.dumps(deleted)
        preview.clear(obj);bpy.data.objects.remove(obj,do_unlink=True);return {'FINISHED'}
class DCC_OT_new_id(bpy.types.Operator):
    @classmethod
    def poll(cls,context): return not context.scene.get('h5e_source_json')
    bl_idname='dcc00.new_id';bl_label='Assign New ID to Duplicate';bl_options={'REGISTER','UNDO'}
    def execute(self,context):
        obj=semantic_object(context)
        if not obj or not obj.get('dcc_anchor') or obj.dcc_actor.class_id=='Decoration':return {'CANCELLED'}
        ident=obj.dcc_actor.ra_id
        if ident and sum(o.get('dcc_anchor',False) and o.dcc_actor.ra_id==ident for o in context.scene.objects)<2:self.report({'ERROR'},'Stable unique IDs must not be replaced');return {'CANCELLED'}
        obj.dcc_actor.ra_id=str(uuid.uuid4());return {'FINISHED'}
class DCC_OT_preview(bpy.types.Operator):
    @classmethod
    def poll(cls,context): return not context.scene.get('h5e_source_json')
    bl_idname='dcc00.preview';bl_label='Rebuild Preview'
    def execute(self,context):
        obj=semantic_object(context)
        if obj:preview.rebuild(obj);presentation.frame_change(context.scene);return {'FINISHED'}
        return {'CANCELLED'}
class DCC_OT_bind(bpy.types.Operator):
    @classmethod
    def poll(cls,context): return not context.scene.get('h5e_source_json')
    bl_idname='dcc00.bind';bl_label='Bind Selected Asset'
    def execute(self,context):
        obj=semantic_object(context)
        if obj:obj.dcc_actor.asset=context.scene.dcc_settings.asset_choice;return {'FINISHED'}
        return {'CANCELLED'}
class DCC_OT_path(bpy.types.Operator):
    @classmethod
    def poll(cls,context): return not context.scene.get('h5e_source_json')
    bl_idname='dcc00.path';bl_label='Add Presentation Path';bl_options={'REGISTER','UNDO'}
    def execute(self,context):
        pid='path-'+uuid.uuid4().hex[:8];c=context.scene.cursor.location;x=c.x*14;y=-c.y*14
        obj=io_authoring.create_path(context.scene,{'id':pid,'points':[{'x':x,'y':y,'z':0},{'x':x+350,'y':y,'z':0},{'x':x+350,'y':y+300,'z':0}]})
        actor=semantic_object(context)
        if actor and actor.dcc_actor.class_id=='PresentationActor':actor.dcc_actor.path=pid
        for o in context.selected_objects:o.select_set(False)
        obj.select_set(True);context.view_layer.objects.active=obj;return {'FINISHED'}
class DCC_OT_bind_path(bpy.types.Operator):
    @classmethod
    def poll(cls,context): return not context.scene.get('h5e_source_json')
    bl_idname='dcc00.bind_path';bl_label='Bind Selected Curve to Actor'
    def execute(self,context):
        actor=next((o for o in context.selected_objects if o.get('dcc_anchor') and o.dcc_actor.class_id=='PresentationActor'),None)
        curve=next((o for o in context.selected_objects if o.get('dcc_path_id')),None)
        if not actor or not curve:self.report({'ERROR'},'Select one presentation anchor and one DCC path curve');return {'CANCELLED'}
        actor.dcc_actor.path=curve['dcc_path_id'];return {'FINISHED'}
class DCC_OT_blend(bpy.types.Operator):
    @classmethod
    def poll(cls,context): return not context.scene.get('h5e_source_json')
    bl_idname='dcc00.save_blend';bl_label='Save Review .blend'
    def execute(self,context):
        target=core.ROOT/'workspace/dcc00.review.blend';target.parent.mkdir(exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=str(target));return {'FINISHED'}
CLASSES=[DCC_OT_reload,DCC_OT_create,DCC_OT_save,DCC_OT_validate,DCC_OT_delete,DCC_OT_new_id,DCC_OT_preview,DCC_OT_bind,DCC_OT_path,DCC_OT_bind_path,DCC_OT_blend]
