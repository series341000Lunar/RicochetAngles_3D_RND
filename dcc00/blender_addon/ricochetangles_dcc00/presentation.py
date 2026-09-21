import bpy,math
from mathutils import Vector
from bpy.app.handlers import persistent
from .core import sample_path

def path_records(scene):
    import json
    records=[]
    for obj in scene.objects:
        if not obj.get('dcc_path_id') or obj.type!='CURVE': continue
        record=json.loads(obj.get('dcc_record','{}'));record['id']=obj['dcc_path_id']
        points=[]
        for spline in obj.data.splines:
            # POLY curves are intentionally the sole DCC-00 path form.
            if spline.type!='POLY': raise ValueError('DCC-00 paths require a single POLY spline')
            for point in spline.points:
                v=obj.matrix_world @ Vector(point.co[:3]);points.append({'x':v.x*14,'y':-v.y*14,'z':v.z*14})
        if len(obj.data.splines)!=1: raise ValueError('DCC-00 path requires one POLY spline')
        # Keep unknown per-point fields when topology is unchanged.
        old=record.get('points',[])
        if len(old)!=len(points) and any(set(p)-{'x','y','z'} for p in old):
            raise ValueError('Unknown path-point fields require preserved topology; source retained')
        record['points']=[{**(old[i] if len(old)==len(points) else {}),**p} for i,p in enumerate(points)]
        records.append(record)
    return records

@persistent
def frame_change(scene,*args):
    try: paths={p['id']:p for p in path_records(scene)}
    except (ValueError,KeyError): return
    seconds=scene.frame_current/(scene.render.fps/scene.render.fps_base)
    for obj in scene.objects:
        if not obj.get('dcc_anchor'): continue
        prop=obj.dcc_actor
        if prop.class_id!='PresentationActor': continue
        p=paths.get(prop.path)
        if not p or len(p['points'])<2 or prop.durationSeconds<=0: continue
        xyz=sample_path(p['points'],seconds,prop.startSeconds,prop.durationSeconds,prop.loop)
        for motion in obj.children:
            if motion.get('dcc_preview'):
                motion.location=obj.matrix_world.inverted() @ Vector((xyz['x']/14,-xyz['y']/14,xyz['z']/14))
                motion.hide_viewport=not prop.enabled
