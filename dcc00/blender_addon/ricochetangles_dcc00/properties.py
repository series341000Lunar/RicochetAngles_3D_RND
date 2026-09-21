import bpy
from bpy.props import StringProperty, FloatProperty, BoolProperty, EnumProperty
from .core import CLASSES,ASSETS
SUSPEND=False
def changed(self,context):
    if SUSPEND: return
    obj=self.id_data
    if isinstance(obj,bpy.types.Object) and obj.get('dcc_anchor'):
        from .preview import rebuild
        rebuild(obj)
def get_facing(self):
    import math
    return -math.degrees(self.id_data.rotation_euler.z)
def set_facing(self,value):
    import math
    self.id_data.rotation_euler.z=-math.radians(value)

class DCCActorProperties(bpy.types.PropertyGroup):
    ra_id: StringProperty(name='Stable ID')
    class_id: StringProperty(name='Class')
    asset: StringProperty(name='Asset ID',update=changed)
    profile: EnumProperty(name='Profile',items=[(x,x,'DCC-00 authoring only') for x in ['SCOUT','GUARD']],default='SCOUT')
    facing: FloatProperty(name='Facing (degrees)',get=get_facing,set=set_facing)
    homeRadius: FloatProperty(name='Home radius',default=160,min=0)
    enabled: BoolProperty(name='Enabled',default=True,update=changed)
    sizeX: FloatProperty(name='Size X (testbed units)',default=120,min=.01,update=changed)
    sizeY: FloatProperty(name='Size Y (testbed units)',default=90,min=.01,update=changed)
    eventRef: StringProperty(name='Event reference')
    checkpointId: StringProperty(name='Checkpoint ID',default='checkpoint')
    path: StringProperty(name='Path ID',default='ambient-route')
    startSeconds: FloatProperty(name='Start (seconds)',default=0,min=0)
    durationSeconds: FloatProperty(name='Duration (seconds)',default=12,min=.01)
    loop: BoolProperty(name='Loop',default=True)
class DCCSettings(bpy.types.PropertyGroup):
    class_to_create: EnumProperty(name='Class',items=[(k,k,'Tier '+v['tier']) for k,v in CLASSES.items()])
    asset_choice: EnumProperty(name='Preview asset',items=[(k,k,v['role']) for k,v in ASSETS.items()])
    revision: StringProperty()
    source_json: StringProperty(default='')
    deleted_json: StringProperty(default='[]')
    validation_json: StringProperty(default='[]')
    status: StringProperty(default='Start the DCC-00 server, then Reload workspace')
