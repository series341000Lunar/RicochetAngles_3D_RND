bl_info={'name':'RicochetAngles DCC-00','author':'RicochetAngles R&D','version':(0,2,0),'blender':(5,2,0),'location':'View3D > N > RICOCHETANGLES R&D','description':'Semantic authoring feasibility, no gameplay authority','category':'3D View'}
import bpy
from . import properties,operators,panels,presentation,preview,authoring_window,h5e_map
CLASSES=[properties.DCCActorProperties,properties.DCCSettings,*operators.CLASSES,*authoring_window.CLASSES,*panels.CLASSES,*h5e_map.CLASSES]
def register():
    for cls in CLASSES:bpy.utils.register_class(cls)
    bpy.types.Object.dcc_actor=bpy.props.PointerProperty(type=properties.DCCActorProperties)
    bpy.types.Scene.dcc_settings=bpy.props.PointerProperty(type=properties.DCCSettings)
    authoring_window.register_state()
    if preview.schedule_cleanup not in bpy.app.handlers.depsgraph_update_post:bpy.app.handlers.depsgraph_update_post.append(preview.schedule_cleanup)
    if presentation.frame_change not in bpy.app.handlers.frame_change_post:bpy.app.handlers.frame_change_post.append(presentation.frame_change)
def unregister():
    authoring_window.unregister_state()
    if preview.schedule_cleanup in bpy.app.handlers.depsgraph_update_post:bpy.app.handlers.depsgraph_update_post.remove(preview.schedule_cleanup)
    if presentation.frame_change in bpy.app.handlers.frame_change_post:bpy.app.handlers.frame_change_post.remove(presentation.frame_change)
    del bpy.types.Scene.dcc_settings;del bpy.types.Object.dcc_actor
    for cls in reversed(CLASSES):bpy.utils.unregister_class(cls)
