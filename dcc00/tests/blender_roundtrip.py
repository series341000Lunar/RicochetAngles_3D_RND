import bpy,sys,json,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'blender_addon'))
import ricochetangles_dcc00 as addon
addon.register()
from ricochetangles_dcc00 import core,io_authoring as io,preview,presentation
io.URL='http://127.0.0.1:18766/api/workspace'
phase=sys.argv[sys.argv.index('--')+1];out=ROOT/'test-output';out.mkdir(exist_ok=True)
def anchors():return [o for o in bpy.context.scene.objects if o.get('dcc_anchor')]
def find(ident):return next(o for o in anchors() if o.dcc_actor.ra_id==ident)
def activate(obj):
    for o in bpy.context.selected_objects:o.select_set(False)
    obj.select_set(True);bpy.context.view_layer.objects.active=obj
scene=bpy.context.scene
if phase=='create':
    result=io.request();io.load_document(scene,result['document'],result['revision'])
    scout=find('tank-scout');assert scout['dcc_preview_state']=='GLB'
    stable=scout.dcc_actor.ra_id;scout.name='Renamed test actor';scout.location.x+=1;scout.dcc_actor.homeRadius=275;scout.dcc_actor.profile='GUARD';preview.rebuild(scout);assert scout.dcc_actor.ra_id==stable
    scene.dcc_settings.class_to_create='LightTank';scene.cursor.location=(40,-140,0);assert bpy.ops.dcc00.create()=={'FINISHED'};created=bpy.context.object;newid=created.dcc_actor.ra_id;assert newid
    duplicate=scout.copy();io.collection(scene).objects.link(duplicate);_,issues=io.collect(scene);assert any(i['code']=='DUPLICATE_ID' for i in issues)
    activate(duplicate);assert bpy.ops.dcc00.new_id()=={'FINISHED'};assert duplicate.dcc_actor.ra_id!=stable;bpy.data.objects.remove(duplicate,do_unlink=True)
    trigger=find('trigger-entry');preview.clear(trigger);bpy.data.objects.remove(trigger,do_unlink=True);preserved,issues=io.collect(scene);assert any(i['code']=='MISSING_FROM_SCENE' for i in issues);assert any(a['ra_id']=='trigger-entry' for a in preserved['actors'])
    original=next(a for a in json.loads(scene.dcc_settings.source_json)['actors'] if a['ra_id']=='trigger-entry');io.create_actor(scene,original)
    activate(find('trigger-exit'));assert bpy.ops.dcc00.delete()=={'FINISHED'}
    decoration=next(o for o in anchors() if o.dcc_actor.class_id=='Decoration');assert not decoration.dcc_actor.ra_id
    # Ordinary DCC object deletion, without semantic delete operator.
    bpy.data.objects.remove(decoration,do_unlink=True)
    scout.dcc_actor.asset='missing-test-asset';assert scout['dcc_preview_state']=='MISSING_ASSET';assert scout.dcc_actor.ra_id==stable
    doc,issues=io.collect(scene);assert any(i['code']=='MISSING_ASSET' for i in issues);assert not any(i['level']=='BLOCK' for i in issues)
    assert io.save(scene)['document']['actors'][0]['asset']=='missing-test-asset'
    scout.dcc_actor.asset='m41';assert scout['dcc_preview_state']=='GLB'
    ambient=find('ambient-vehicle');scene.frame_set(0);before=ambient.children[0].matrix_world.translation.copy();scene.frame_set(180);bpy.context.view_layer.update();after=ambient.children[0].matrix_world.translation.copy();assert (after-before).length>1
    samples=[]
    for second in [0,3,6,12,15]:
        scene.frame_set(second*30);bpy.context.view_layer.update();v=ambient.children[0].matrix_world.translation
        actual={'x':v.x*14,'y':-v.y*14,'z':v.z*14};path=presentation.path_records(scene)[0]
        expected=core.sample_path(path['points'],second,ambient.dcc_actor.startSeconds,ambient.dcc_actor.durationSeconds,ambient.dcc_actor.loop)
        assert max(abs(actual[k]-expected[k]) for k in actual)<.001,(actual,expected)
        samples.append({'seconds':second,**actual})
    (out/'blender-path-samples.json').write_text(json.dumps(samples))
    scout.scale.x=2;assert any(i['code']=='UNSUPPORTED_TRANSFORM' for i in io.collect(scene)[1]);scout.scale.x=1
    assert not any(o.get('dcc_motion') and o.parent is None for o in scene.objects)
    curve=next(o for o in scene.objects if o.get('dcc_path_id'))
    raw=json.loads(curve['dcc_record']);raw['points'][0]['futurePointExtension']={'preserve':True};curve['dcc_record']=json.dumps(raw)
    assert presentation.path_records(scene)[0]['points'][0]['futurePointExtension']['preserve']
    curve.data.splines[0].points.add(1)
    try:presentation.path_records(scene);raise AssertionError('Unknown point topology change was not blocked')
    except ValueError:pass
    bpy.data.objects.remove(curve,do_unlink=True);io.create_path(scene,raw)
    saved=io.save(scene)['document'];assert saved['futureExtension']['preserveMe'];assert saved['actors'][0]['futureActorProperty']['value']==73;assert len(saved['decorations'])==3;assert {'ra_id':'trigger-exit','deleted':True} in saved['tombstones']
    (out/'created-id.json').write_text(json.dumps({'ra_id':newid}))
    bpy.ops.wm.save_as_mainfile(filepath=str(out/'roundtrip.blend'))
    (out/'blender-create.json').write_text(json.dumps({'pass':True,'actualGLB':True,'duplicateBlock':True,'missingSceneBlock':True,'missingAssetProxy':True,'missingAssetSave':True,'unknownPathPointPreserved':True,'unknownTopologyBlocked':True,'decorationDelete':True,'tombstone':True,'timelineMovement':(after-before).length,'stableID':stable,'newActor':newid}))
else:
    # This process starts from the .blend saved by the previous Blender process.
    assert scene.dcc_settings.source_json
    scout=find('tank-scout');assert scout.dcc_actor.homeRadius==275;assert scout['dcc_preview_state']=='GLB';assert scout.name.startswith('Renamed')
    newid=json.loads((out/'created-id.json').read_text())['ra_id'];assert find(newid).dcc_actor.class_id=='LightTank'
    result=io.request();io.load_document(scene,result['document'],result['revision']);assert find('tank-scout').dcc_actor.homeRadius==333
    doc,issues=io.collect(scene);assert doc['futureExtension']['preserveMe'];assert doc['actors'][0]['futureActorProperty']['value']==73;assert not any(i['level']=='BLOCK' for i in issues)
    io.save(scene)
    (out/'blender-reopen.json').write_text(json.dumps({'pass':True,'blendReopened':True,'htmlEditReceived':True,'unknownPreserved':True,'idPreserved':newid}))
print('DCC00_BLENDER_'+phase.upper()+'_PASS')
