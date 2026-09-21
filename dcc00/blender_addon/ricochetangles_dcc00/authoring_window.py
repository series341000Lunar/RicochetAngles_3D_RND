"""Native same-instance authoring window. UI state only; no schema fields."""
import json
import bpy
from bpy.props import IntProperty
MARKER='ra_dcc00_authoring_window'
_syncing=False

def anchor(obj):
    while obj and not obj.get('dcc_anchor'): obj=obj.parent
    return obj

def is_authoring(window):
    return bool(window and window.screen and window.screen.get(MARKER))

def find_window(wm):
    return next((w for w in wm.windows if is_authoring(w)),None)

def scene_issues(scene):
    try:return json.loads(scene.dcc_settings.validation_json)
    except (ValueError,TypeError):return []

def select_index(self,context):
    if _syncing:return
    objects=context.scene.objects
    if not 0<=self.ra_actor_index<len(objects):return
    obj=objects[self.ra_actor_index]
    if not obj.get('dcc_anchor') or obj.dcc_actor.class_id=='Decoration':return
    if obj.name not in context.view_layer.objects or context.mode!='OBJECT':return
    for o in context.view_layer.objects:o.select_set(False)
    obj.select_set(True);context.view_layer.objects.active=obj
    for win in context.window_manager.windows:
        for area in win.screen.areas:area.tag_redraw()

def sync_selection():
    global _syncing
    try:
        wm=bpy.context.window_manager
        if not wm or not hasattr(wm,'ra_actor_index'):return None
        win=find_window(wm)
        if not win:return .25
        obj=anchor(win.view_layer.objects.active)
        if obj and obj.dcc_actor.class_id!='Decoration':
            idx=win.scene.objects.find(obj.name)
            if idx>=0 and wm.ra_actor_index!=idx:
                _syncing=True;wm.ra_actor_index=idx;_syncing=False
        for area in win.screen.areas:area.tag_redraw()
    except (ReferenceError,RuntimeError):_syncing=False
    return .25

class DCC_OT_open_authoring(bpy.types.Operator):
    bl_idname='dcc00.open_authoring';bl_label='Open RicochetAngles Authoring Editor'
    bl_description='Open the native floating editor; reuse an existing authoring window'
    bl_options={'REGISTER'}
    def execute(self,context):
        if bpy.app.background:self.report({'ERROR'},'A Blender graphical session is required');return {'CANCELLED'}
        if find_window(context.window_manager):
            self.report({'INFO'},'RA Authoring Editor is already open. Use the existing floating window.');return {'FINISHED'}
        before={w.as_pointer() for w in context.window_manager.windows};source=context.window
        area=next((a for a in source.screen.areas if a.type=='VIEW_3D'),context.area)
        if not area:self.report({'ERROR'},'No source editor; use N-panel fallback');return {'CANCELLED'}
        try:
            with context.temp_override(window=source,area=area):bpy.ops.screen.area_dupli('INVOKE_DEFAULT')
            new=next((w for w in context.window_manager.windows if w.as_pointer() not in before),None)
            if not new:raise RuntimeError('Blender did not create a floating window')
            new.scene=source.scene;new.view_layer=source.view_layer;new.screen[MARKER]=True
            editor=new.screen.areas[0];editor.type='PROPERTIES';editor.spaces.active.context='SCENE';editor.spaces.active.pin_id=None;editor.tag_redraw()
            self.report({'INFO'},'RA Authoring Editor opened; closing it keeps the main session intact');return {'FINISHED'}
        except Exception as exc:
            self.report({'ERROR'},f'Unable to open editor: {exc}. N-panel fallback remains available.');return {'CANCELLED'}

def cached_actor_issues(scene,obj):
    # Same order as reconcile, but never mutate/collect while drawing the interface.
    try:source=json.loads(scene.dcc_settings.source_json);deleted=set(json.loads(scene.dcc_settings.deleted_json))
    except (ValueError,TypeError):return []
    ids=[a.get('ra_id') for a in source.get('actors',[]) if a.get('ra_id') not in deleted]
    original=set(ids)
    scene_ids=[o.dcc_actor.ra_id for o in scene.objects if o.get('dcc_anchor') and o.dcc_actor.class_id!='Decoration']
    ids.extend(i for i in scene_ids if i not in original and i not in deleted)
    seen=set()
    for ident in scene_ids:
        if ident in seen:ids.append(ident)
        seen.add(ident)
    prefixes=[f'actors[{i}]' for i,value in enumerate(ids) if value==obj.dcc_actor.ra_id]
    return [i for i in scene_issues(scene) if i['where'] in (obj.name,obj.dcc_actor.ra_id) or any(i['where']==p or i['where'].startswith(p+'.') for p in prefixes)]

class DCC_UL_actors(bpy.types.UIList):
    def filter_items(self,context,data,propname):
        flags=[]
        for obj in getattr(data,propname):
            visible=obj.get('dcc_anchor') and obj.dcc_actor.class_id!='Decoration'
            if visible and self.filter_name:visible=self.filter_name.lower() in (obj.name+' '+obj.dcc_actor.class_id+' '+obj.dcc_actor.ra_id).lower()
            flags.append(self.bitflag_filter_item if visible else 0)
        return flags,[]
    def draw_item(self,context,layout,data,item,icon,active_data,active_propname,index):
        p=item.dcc_actor;issues=cached_actor_issues(context.scene,item)
        state='BLOCK' if any(i['level']=='BLOCK' for i in issues) else 'WARNING' if any(i['level']=='WARNING' for i in issues) else 'PASS'
        col=layout.column(align=True);row=col.row();row.label(text=p.class_id+' · '+item.name,icon='OUTLINER_OB_EMPTY');row.label(text=state,icon='ERROR' if state=='BLOCK' else 'INFO' if state=='WARNING' else 'CHECKMARK');col.label(text='ID: '+p.ra_id)

def draw_open_menu(self,context):
    self.layout.operator('dcc00.open_authoring',text='Open RicochetAngles Authoring Editor',icon='WINDOW')

def register_state():
    bpy.types.VIEW3D_MT_view.append(draw_open_menu)
    bpy.types.TOPBAR_MT_window.append(draw_open_menu)
    bpy.types.WindowManager.ra_actor_index=IntProperty(default=0,min=0,update=select_index,options={'SKIP_SAVE'})
    if not bpy.app.timers.is_registered(sync_selection):bpy.app.timers.register(sync_selection,first_interval=.25,persistent=True)

def unregister_state():
    bpy.types.VIEW3D_MT_view.remove(draw_open_menu)
    bpy.types.TOPBAR_MT_window.remove(draw_open_menu)
    if bpy.app.timers.is_registered(sync_selection):bpy.app.timers.unregister(sync_selection)
    del bpy.types.WindowManager.ra_actor_index
CLASSES=[DCC_OT_open_authoring,DCC_UL_actors]
