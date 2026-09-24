"""Session-local source add-on activation. Does not modify Blender preferences."""
import sys
from pathlib import Path
import bpy
from mathutils import Quaternion
sys.path.insert(0,str(Path(__file__).resolve().parent))
import ricochetangles_dcc00 as addon
addon.register()
if not bpy.context.scene.dcc_settings.source_json and not bpy.context.scene.get('h5e_source_json'):
    result=addon.operators.io_authoring.request()
    addon.operators.io_authoring.load_document(bpy.context.scene,result['document'],result['revision'])
scene=bpy.context.scene;scene.cursor.location=(640/14,-1800/14,0)
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.show_region_ui=True
            area.spaces.active.region_3d.view_distance=125 if scene.get('env01') else 110
            area.spaces.active.region_3d.view_location=(3075/14,-700/14,0) if scene.get('env01') else (640/14,-1800/14,0)
            area.spaces.active.region_3d.view_rotation=Quaternion((1,0,0,0))
            area.spaces.active.region_3d.view_perspective='ORTHO'
            area.spaces.active.shading.color_type='MATERIAL'


# Session-local native editor; no preferences or keymaps change.
if not bpy.app.background:
    def open_editor():
        bpy.ops.dcc00.open_authoring()
        return None
    bpy.app.timers.register(open_editor,first_interval=1.0)
