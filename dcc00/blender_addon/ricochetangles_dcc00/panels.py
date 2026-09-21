import bpy,json
from .core import CLASSES as ACTOR_CLASSES,validation_summary
from . import authoring_window as ui

def common(layout,context):
    row=layout.row(align=True);row.operator('dcc00.reload');row.operator('dcc00.save');row.operator('dcc00.validate');row.operator('dcc00.save_blend')
    row=layout.row(align=True);row.prop(context.scene.dcc_settings,'class_to_create');row.operator('dcc00.create')

def inspector(layout,context):
    obj=ui.anchor(context.view_layer.objects.active)
    if not obj:
        layout.label(text='Select an actor in the browser or 3D View',icon='INFO');return
    layout.context_pointer_set('object',obj)
    p=obj.dcc_actor;box=layout.box();box.label(text='Identity',icon='OBJECT_DATA');box.prop(obj,'name',text='Name');box.label(text='Class: '+p.class_id)
    if p.class_id!='Decoration':box.label(text='ID: '+p.ra_id);box.operator('dcc00.new_id')
    else:box.label(text='Anonymous decoration · no persistent ID')
    if 'asset' in ACTOR_CLASSES.get(p.class_id,{}).get('fields',{}):
        box=layout.box();box.label(text='Preview');box.prop(p,'asset');box.prop(context.scene.dcc_settings,'asset_choice');row=box.row();row.operator('dcc00.bind');row.operator('dcc00.preview');box.label(text='State: '+obj.get('dcc_preview_state','UNKNOWN'))
    box=layout.box();box.label(text='Transform · meters');box.prop(obj,'location',text='Position')
    if p.class_id=='LightTank':box.prop(p,'facing')
    else:box.prop(obj,'rotation_euler',index=2,text='Facing')
    box=layout.box();box.label(text='Authoring');box.use_property_split=True
    for field in ACTOR_CLASSES.get(p.class_id,{}).get('fields',{}):
        if field not in ('asset','facing'):box.prop(p,field)
    if p.class_id=='PresentationActor':box.operator('dcc00.path');box.operator('dcc00.bind_path');box.label(text='Edit Curve in main 3D View; Space plays timeline')
    layout.operator('dcc00.delete',text='Delete Decoration' if p.class_id=='Decoration' else 'Delete Semantic Actor',icon='TRASH')

def validation(layout,context):
    issues=ui.scene_issues(context.scene);layout.label(text=validation_summary(issues));layout.label(text='Press Validate after edits',icon='INFO')
    selected=ui.anchor(context.view_layer.objects.active)
    if selected:
        box=layout.box();box.label(text='Selected: '+selected.name);local=ui.cached_actor_issues(context.scene,selected);box.label(text=validation_summary(local))
        for issue in local:box.label(text=issue['level']+' · '+issue['code']);box.label(text=issue['message'])
    layout.separator();layout.label(text='Workspace issues')
    if not issues:layout.label(text='None')
    for issue in issues:
        box=layout.box();box.label(text=issue['level']+' · '+issue['code'],icon='ERROR' if issue['level']=='BLOCK' else 'INFO');box.label(text=issue['where']);box.label(text=issue['message'])

class DCC_PT_authoring_window(bpy.types.Panel):
    bl_label='RicochetAngles Authoring Editor';bl_idname='DCC_PT_authoring_window';bl_space_type='PROPERTIES';bl_region_type='WINDOW';bl_context='scene';bl_order=0
    @classmethod
    def poll(cls,context):return ui.is_authoring(context.window)
    def draw(self,context):
        layout=self.layout;layout.label(text='DCC-00 · feasibility only · User UX Gate PENDING');common(layout,context);layout.label(text=context.scene.dcc_settings.status)
        split=layout.split(factor=.32);browser=split.column();rest=split.split(factor=.56);detail=rest.column();checks=rest.column()
        browser.label(text='Actor Browser · Tier A/B',icon='OUTLINER');browser.template_list('DCC_UL_actors','semantic',context.scene,'objects',context.window_manager,'ra_actor_index',rows=12);browser.label(text='Selection shared with main 3D View')
        detail.label(text='Selected Actor Inspector',icon='PROPERTIES');inspector(detail,context)
        checks.label(text='Validation',icon='CHECKMARK');validation(checks,context)

class DCC_PT_editor(bpy.types.Panel):
    bl_label='DCC-00 Quick Access';bl_idname='DCC_PT_editor';bl_space_type='VIEW_3D';bl_region_type='UI';bl_category='RICOCHETANGLES R&D'
    def draw(self,context):
        l=self.layout;l.label(text='Feasibility · UX Gate PENDING');obj=ui.anchor(context.view_layer.objects.active);l.label(text='Selected: '+(obj.name if obj else 'None'));l.label(text=validation_summary(ui.scene_issues(context.scene)))
        l.operator('dcc00.open_authoring',text='Open RA Authoring Editor',icon='WINDOW');row=l.row(align=True);row.operator('dcc00.validate');row.operator('dcc00.save',text='Save')

class DCC_PT_fallback(bpy.types.Panel):
    bl_label='Fallback Editing';bl_idname='DCC_PT_fallback';bl_parent_id='DCC_PT_editor';bl_space_type='VIEW_3D';bl_region_type='UI';bl_category='RICOCHETANGLES R&D';bl_options={'DEFAULT_CLOSED'}
    def draw(self,context):
        l=self.layout;l.label(text='Use if the dedicated window is unavailable');s=context.scene.dcc_settings;row=l.row();row.operator('dcc00.reload');row.operator('dcc00.save_blend');l.prop(s,'class_to_create');l.operator('dcc00.create');inspector(l,context);validation(l,context)
CLASSES=[DCC_PT_authoring_window,DCC_PT_editor,DCC_PT_fallback]
