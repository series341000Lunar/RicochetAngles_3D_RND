import bpy,json
from .core import CLASSES
class DCC_PT_editor(bpy.types.Panel):
    bl_label='DCC-00 Semantic Authoring';bl_idname='DCC_PT_editor';bl_space_type='VIEW_3D';bl_region_type='UI';bl_category='RICOCHETANGLES R&D'
    def draw(self,context):
        l=self.layout;s=context.scene.dcc_settings
        l.label(text='Feasibility only · no gameplay authority')
        row=l.row();row.operator('dcc00.reload');row.operator('dcc00.save')
        row=l.row();row.operator('dcc00.validate');row.operator('dcc00.save_blend')
        l.label(text=s.status[:85]);l.separator();l.label(text='Add Actor');l.prop(s,'class_to_create');l.operator('dcc00.create')
        obj=context.object
        if obj and obj.get('dcc_path_id'):
            l.label(text='Path: '+obj['dcc_path_id']);l.label(text='Tab → edit POLY control points');l.label(text='Timeline uses seconds = frame / FPS')
        if obj and obj.get('dcc_anchor'):
            p=obj.dcc_actor;box=l.box();box.label(text='Identity');box.label(text='Class: '+p.class_id)
            if p.class_id!='Decoration':box.label(text='ID: '+p.ra_id);box.operator('dcc00.new_id')
            else:box.label(text='Anonymous decoration · no persistent ID')
            if 'asset' in CLASSES.get(p.class_id,{}).get('fields',{}):
                box.prop(p,'asset');box.prop(s,'asset_choice');box.operator('dcc00.bind');box.label(text='Preview: '+obj.get('dcc_preview_state','UNKNOWN'));box.operator('dcc00.preview')
            box=l.box();box.label(text='Transform · meters, Blender Y = -world Y');box.prop(obj,'location',text='Position')
            if p.class_id=='LightTank':box.prop(p,'facing')
            else:box.prop(obj,'rotation_euler',index=2,text='Facing')
            box=l.box();box.label(text='Authoring')
            for field in CLASSES.get(p.class_id,{}).get('fields',{}):
                if field not in ('asset','facing'):box.prop(p,field)
            if p.class_id=='PresentationActor':box.operator('dcc00.path');box.operator('dcc00.bind_path');box.label(text='Space: timeline playback; curve points editable')
            l.operator('dcc00.delete',text='Delete Decoration' if p.class_id=='Decoration' else 'Delete Semantic Actor',icon='TRASH')
        l.separator();l.label(text='Validation (press Validate after edits)')
        issues=json.loads(s.validation_json)
        if not issues:l.label(text='PASS')
        for issue in issues[:12]:
            l.label(text=issue['level']+' · '+issue['code'],icon='ERROR' if issue['level']=='BLOCK' else 'INFO');l.label(text=issue['where'][:70]);l.label(text=issue['message'][:85])
