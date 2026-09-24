"""Isolated GUI test of canonical import in the existing DCC floating editor."""
import bpy,sys,json,traceback
from pathlib import Path
from mathutils import Quaternion
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'test-output/dcc-map-01'
sys.path.insert(0,str(ROOT/'blender_addon'))
import ricochetangles_dcc00 as addon
addon.register()
from ricochetangles_dcc00 import h5e_map as h,authoring_window as ui
main=bpy.context.window;area=next(a for a in main.screen.areas if a.type=='VIEW_3D')
stage=0;result={'pass':False,'blender':bpy.app.version_string}
def tick():
 global stage
 try:
  if stage==0:
   main.event_simulate(type='ESC',value='PRESS');main.event_simulate(type='ESC',value='RELEASE')
  elif stage==1:
   with bpy.context.temp_override(window=main,area=area):assert bpy.ops.dcc00.open_authoring()=={'FINISHED'}
   win=ui.find_window(bpy.context.window_manager)
   with bpy.context.temp_override(window=win,area=win.screen.areas[0]):
    assert bpy.ops.dcc00.import_canonical(filepath=str(h.DEFAULT_SOURCE))=={'FINISHED'}
  elif stage==2:
   win=ui.find_window(bpy.context.window_manager)
   result['scenesAfterImport']=[(w.scene.name,bool(w.scene.get('h5e_source_json'))) for w in bpy.context.window_manager.windows]
   assert main.scene==win.scene
   with bpy.context.temp_override(window=win,area=win.screen.areas[0]):
    assert not bpy.ops.dcc00.reload.poll() and not bpy.ops.dcc00.save.poll(), str(result)
   obj=next(o for o in main.scene.objects if o.get('h5e_id')=='H5E_P1_TUT_COVER_01')
   with bpy.context.temp_override(window=win,area=win.screen.areas[0]):
    bpy.context.window_manager.ra_actor_index=main.scene.objects.find(obj.name)
   assert main.view_layer.objects.active==obj
   obj.location.x+=40/14
   with bpy.context.temp_override(window=win,area=win.screen.areas[0]):
    assert bpy.ops.dcc00.export_canonical()=={'FINISHED'}
   area.spaces.active.region_3d.view_rotation=Quaternion((1,0,0,0))
   area.spaces.active.region_3d.view_location=(3070/14,-390/14,0)
   area.spaces.active.region_3d.view_distance=100
   area.spaces.active.region_3d.view_perspective='ORTHO'
   result.update(sharedScene=True,canonicalSelection=True,exportOperator=True,testbedOperatorsBlocked=True)
  elif stage==3:
   win=ui.find_window(bpy.context.window_manager)
   with bpy.context.temp_override(window=win,area=win.screen.areas[0]):
    bpy.ops.screen.screenshot(filepath=str(OUT/'canonical-editor.png'))
   with bpy.context.temp_override(window=main,area=area):
    bpy.ops.screen.screenshot(filepath=str(OUT/'canonical-blender.png'))
   with bpy.context.temp_override(window=win):bpy.ops.wm.window_close()
   assert main.scene.get('h5e_source_json')
   result['pass']=True;(OUT/'native.json').write_text(json.dumps(result,indent=2))
   bpy.ops.wm.quit_blender();return None
  stage+=1;return 1.5
 except Exception:
  result['error']=traceback.format_exc();(OUT/'native.json').write_text(json.dumps(result,indent=2))
  bpy.ops.wm.quit_blender();return None
bpy.app.timers.register(tick,first_interval=2)