"""Run in an isolated foreground Blender 5.2 instance with --enable-event-simulate."""
import bpy,sys,json,traceback,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=Path(os.environ.get('DCC00_TEST_OUTPUT',str(ROOT/'test-output/ux52')));OUT.mkdir(parents=True,exist_ok=True)
sys.path.insert(0,str(ROOT/'blender_addon'))
import ricochetangles_dcc00 as addon
addon.register()
from ricochetangles_dcc00 import io_authoring as io,authoring_window as ui
io.URL='http://127.0.0.1:18766/api/workspace'
loaded=io.request();io.load_document(bpy.context.scene,loaded['document'],loaded['revision'])
main=bpy.context.window;scene=main.scene;wm=bpy.context.window_manager
area=next(a for a in main.screen.areas if a.type=='VIEW_3D');area.spaces.active.show_region_ui=True
results={'blender':bpy.app.version_string,'steps':[]};stage=-1

def record(s):
    results['steps'].append(s);(OUT/'native-window-progress.json').write_text(json.dumps(results,indent=2))
def snap(win,name):
    with bpy.context.temp_override(window=win,area=win.screen.areas[0]):bpy.ops.screen.screenshot(filepath=str(OUT/name))
def open_from_main():
    with bpy.context.temp_override(window=main,area=area):assert bpy.ops.dcc00.open_authoring()=={'FINISHED'}
def close_editor():
    win=ui.find_window(wm)
    with bpy.context.temp_override(window=win):bpy.ops.wm.window_close()
def tick():
    global stage
    try:
        if stage==-1:
            sidebar=next(r for r in area.regions if r.type=='UI');sidebar.active_panel_category='RICOCHETANGLES R&D'
            main.event_simulate(type='ESC',value='PRESS');main.event_simulate(type='ESC',value='RELEASE')
        elif stage==0:
            open_from_main();assert len(wm.windows)==2;assert ui.find_window(wm).scene==scene;record('open_native_same_scene')
        elif stage==1:
            win=ui.find_window(wm);assert len(win.screen.areas)==1;assert win.screen.areas[0].type=='PROPERTIES'
            with bpy.context.temp_override(window=win,area=win.screen.areas[0]):
                idx=scene.objects.find(next(o.name for o in scene.objects if o.get('dcc_anchor') and o.dcc_actor.ra_id=='tank-scout'));wm.ra_actor_index=idx
            assert main.view_layer.objects.active.dcc_actor.ra_id=='tank-scout'
            main.view_layer.objects.active.dcc_actor.homeRadius=289
            with bpy.context.temp_override(window=win,area=win.screen.areas[0]):assert bpy.ops.dcc00.validate()=={'FINISHED'}
            assert scene.dcc_settings.status.startswith('PASS');record('browser_selection_typed_edit_validation')
            with bpy.context.temp_override(window=win,area=win.screen.areas[0]):
                assert bpy.ops.dcc00.save()=={'FINISHED'}
                assert bpy.ops.dcc00.reload()=={'FINISHED'}
                from ricochetangles_dcc00 import core
                original_root=core.ROOT
                try:
                    core.ROOT=OUT
                    assert bpy.ops.dcc00.save_blend()=={'FINISHED'}
                finally:core.ROOT=original_root
            assert next(o for o in scene.objects if o.get('dcc_anchor') and o.dcc_actor.ra_id=='tank-scout').dcc_actor.homeRadius==289
            record('dedicated_window_save_reload_review_blend')
            with bpy.context.temp_override(window=win,area=win.screen.areas[0]):wm.ra_actor_index=scene.objects.find(next(o.name for o in scene.objects if o.get('dcc_anchor') and o.dcc_actor.ra_id=='tank-scout'))
        elif stage==2:
            snap(ui.find_window(wm),'authoring-window.png');open_from_main();assert len(wm.windows)==2;record('duplicate_open_reused')
        elif stage==3:
            close_editor();assert len(wm.windows)==1;assert main.scene==scene;assert any(o.get('dcc_anchor') for o in scene.objects);record('close_preserves_main_scene');snap(main,'compact-npanel.png')
        elif stage==4:
            open_from_main();assert len(wm.windows)==2;record('recall_from_npanel_operator')
        elif stage==5:
            obj=next(o for o in scene.objects if o.get('dcc_anchor') and o.dcc_actor.class_id=='Trigger')
            with bpy.context.temp_override(window=main,area=area):
                for o in main.view_layer.objects:o.select_set(False)
                obj.select_set(True);main.view_layer.objects.active=obj
            ui.sync_selection();assert scene.objects[wm.ra_actor_index]==obj;record('main_selection_syncs_inspector')
            snap(ui.find_window(wm),'trigger-inspector.png');close_editor()
        elif stage==6:
            # Native events target this test window only, never another Blender session.
            main.event_simulate(type='MOUSEMOVE',value='NOTHING',x=area.x+200,y=area.y+200)
            main.event_simulate(type='F3',value='PRESS',x=area.x+300,y=area.y+400);main.event_simulate(type='F3',value='RELEASE',x=area.x+300,y=area.y+400)
        elif stage==7:
            for c in 'Open RicochetAngles Authoring Editor':
                key=c.upper() if c.isalpha() else 'SPACE'
                main.event_simulate(type=key,value='PRESS',unicode=c,x=area.x+300,y=area.y+400);main.event_simulate(type=key,value='RELEASE',x=area.x+300,y=area.y+400)
        elif stage==8:
            snap(main,'f3-search.png');main.event_simulate(type='RET',value='PRESS',x=area.x+300,y=area.y+400);main.event_simulate(type='RET',value='RELEASE',x=area.x+300,y=area.y+400)
        elif stage==9:
            assert ui.find_window(wm) is not None,'F3 search did not reopen editor';assert len(wm.windows)==2;record('actual_f3_search_recall')
            snap(ui.find_window(wm),'f3-recalled-window.png')
            results['pass']=True;(OUT/'native-window.json').write_text(json.dumps(results,indent=2));bpy.ops.wm.quit_blender();return None
        stage+=1;return 1.0
    except Exception:
        results['pass']=False;results['error']=traceback.format_exc();(OUT/'native-window.json').write_text(json.dumps(results,indent=2));print(results['error']);bpy.ops.wm.quit_blender();return None
bpy.app.timers.register(tick,first_interval=2.0)
