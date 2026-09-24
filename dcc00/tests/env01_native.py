"""GUI smoke of the saved ENV authoring source and existing floating editor."""
import bpy,sys,json,traceback,hashlib,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'test-output/env01'
sys.path.insert(0,str(ROOT/'blender_addon'))
import ricochetangles_dcc00 as addon
addon.register()
from ricochetangles_dcc00 import env01 as env,authoring_window as ui
main=bpy.context.window;area=next(a for a in main.screen.areas if a.type=='VIEW_3D')
stage=0;result={'pass':False,'blender':bpy.app.version_string}
def decode_glb(raw):
    n=struct.unpack_from('<I',raw,12)[0]
    return json.loads(raw[20:20+n]),raw[28+n:]
before_glb=(env.ROOT/'geometry.glb').read_bytes()
before={p.name:env.sha(p) for p in (env.ROOT/'map.json',env.ROOT/'geometry.glb')}
def tick():
 global stage
 try:
  if stage==0:
   assert main.scene.get('env01')
   main.event_simulate(type='ESC',value='PRESS');main.event_simulate(type='ESC',value='RELEASE')
   with bpy.context.temp_override(window=main,area=area):assert bpy.ops.dcc00.open_authoring()=={'FINISHED'}
  elif stage==1:
   win=ui.find_window(bpy.context.window_manager)
   with bpy.context.temp_override(window=win,area=win.screen.areas[0]):
    assert bpy.ops.dcc00.env01_map()=={'FINISHED'}
    assert bpy.ops.dcc00.env01_glb()=={'FINISHED'}
   assert env.sha(env.ROOT/'map.json')==before['map.json']
   a,ab=decode_glb(before_glb);b,bb=decode_glb((env.ROOT/'geometry.glb').read_bytes())
   assert a==b,'GLB structural drift'
   max_delta=0
   for accessor in a['accessors']:
    view=a['bufferViews'][accessor['bufferView']]
    size={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[accessor['type']]
    code={5126:'f',5125:'I',5123:'H',5121:'B'}[accessor['componentType']]
    width=struct.calcsize(code)*size
    for i in range(accessor['count']):
     offset=view.get('byteOffset',0)+accessor.get('byteOffset',0)+i*view.get('byteStride',width)
     left=struct.unpack_from('<'+code*size,ab,offset);right=struct.unpack_from('<'+code*size,bb,offset)
     if code!='f':assert left==right
     else:max_delta=max(max_delta,max(abs(x-y) for x,y in zip(left,right)))
   assert max_delta*14<.002
   result['maxFloatAccessorDelta']=max_delta
   result.update(sharedScene=win.scene==main.scene,mapExport=True,glbExport=True,mapHashEqual=True,glbStructureEqual=True,glbNumericTolerance=True)
  elif stage==2:
   win=ui.find_window(bpy.context.window_manager)
   with bpy.context.temp_override(window=win,area=win.screen.areas[0]):
    bpy.ops.screen.screenshot(filepath=str(OUT/'blender-editor.png'))
   with bpy.context.temp_override(window=main,area=area):
    bpy.ops.screen.screenshot(filepath=str(OUT/'blender-environment.png'))
   with bpy.context.temp_override(window=win):bpy.ops.wm.window_close()
   with bpy.context.temp_override(window=main,area=area):bpy.ops.wm.save_as_mainfile(filepath=str(env.ROOT/'authoring.blend'))
   result['pass']=True;(OUT/'native.json').write_text(json.dumps(result,indent=2))
   bpy.ops.wm.quit_blender();return None
  stage+=1;return 1.5
 except Exception:
  result['error']=traceback.format_exc();(OUT/'native.json').write_text(json.dumps(result,indent=2))
  bpy.ops.wm.quit_blender();return None
bpy.app.timers.register(tick,first_interval=2)