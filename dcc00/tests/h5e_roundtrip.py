"""Run with Blender 5.2 --background --factory-startup --python-exit-code 1 --python this.py."""
import copy, json, math, sys
from pathlib import Path
import bpy
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'blender_addon'))
import ricochetangles_dcc00 as addon
addon.register()
from ricochetangles_dcc00 import h5e_map as h
OUT=ROOT/'test-output/dcc-map-01';OUT.mkdir(parents=True,exist_ok=True)
source=h.DEFAULT_SOURCE
before=h.digest(source);original=json.loads(source.read_text(encoding='utf-8-sig'))
scene=h.import_map(source);bpy.context.window.scene=scene
baseline=json.loads(scene['h5e_baseline'])
assert len(baseline)==sum(len(original[g]) for g in h.GROUPS)
def differences(a,b,path=''):
    if isinstance(a,dict) and isinstance(b,dict):
        if a.keys()!=b.keys():return [path+':keys']
        return sum((differences(a[k],b[k],path+'/'+k) for k in a),[])
    if isinstance(a,list) and isinstance(b,list):
        if len(a)!=len(b):return [path+':length']
        return sum((differences(x,y,path+'/'+str(i)) for i,(x,y) in enumerate(zip(a,b))),[])
    return [] if a==b else [path]
noedit=h.save_map(scene,'no-edit.json')
assert differences(original,noedit)==[]
# Independently audit Blender float projection, not merely the stored JSON.
errors=[]
for group,r in h.records(original):
    obj=next(o for o in scene.objects if o.get('h5e_id')==r['id'])
    geo=r['geometry']
    if 'points' not in geo:
        errors.extend([abs(obj.location.x*14-geo['x']),abs(-obj.location.y*14-geo['y'])])
    else:
        for p,q in zip(obj.children[0].data.splines[0].points,geo['points']):
            errors.extend([abs(p.co.x*14-q['x']),abs(-p.co.y*14-q['y'])])
assert max(errors)<.002
target='H5E_P1_TUT_COVER_01'
obj=next(o for o in scene.objects if o.get('h5e_id')==target)
obj.name='Review rename preserves canonical ID'
obj.location.x += 40/14
edited=h.save_map(scene,'edited.json')
idx=next(i for i,r in enumerate(original['objects']) if r['id']==target)
expected=f'/objects/{idx}/geometry/x'
diff=differences(original,edited);assert diff==[expected],diff
delta=edited['objects'][idx]['geometry']['x']-original['objects'][idx]['geometry']['x']
assert abs(delta-40)<.002
# Failure-path safety checks never write canonical or exported evidence.
checks={}
def blocked(name,fn):
    try:fn()
    except ValueError as e:checks[name]=str(e);return
    raise AssertionError('Did not block '+name)
duplicate=obj.copy();scene.collection.objects.link(duplicate)
blocked('duplicate_id',lambda:h.export_document(scene));bpy.data.objects.remove(duplicate,do_unlink=True)
oldid=obj['h5e_id'];obj['h5e_id']='changed-id'
blocked('identity_change',lambda:h.export_document(scene));obj['h5e_id']=oldid
collection=obj.users_collection[0];collection.objects.unlink(obj)
blocked('missing_is_not_deletion',lambda:h.export_document(scene));collection.objects.link(obj)
oldscale=obj.scale.copy();obj.scale.x=2
blocked('unsupported_scale',lambda:h.export_document(scene));obj.scale=oldscale
visual=obj.children[0];oldpoint=visual.data.splines[0].points[0].co.copy()
visual.data.splines[0].points[0].co.x+=1
blocked('unsupported_curve_edit',lambda:h.export_document(scene));visual.data.splines[0].points[0].co=oldpoint
locked=next(o for o in scene.objects if o.get('h5e_id') and baseline[o['h5e_id']]['locked'])
oldloc=locked.location.copy();locked.location.x+=1
blocked('locked_record_move',lambda:h.export_document(scene));locked.location=oldloc
blocked('source_write_path',lambda:h.save_map(scene,str(source)))
revisions=scene['h5e_output_revisions'];scene['h5e_output_revisions']='{}'
blocked('stale_working_copy',lambda:h.save_map(scene,'edited.json'))
scene['h5e_output_revisions']=revisions
sha=scene['h5e_source_sha256'];scene['h5e_source_sha256']='stale'
blocked('stale_source',lambda:h.save_map(scene,'must-not-write.json'));scene['h5e_source_sha256']=sha
# Unknown top-level, record, geometry and point payloads survive the same adapter.
stored=scene['h5e_source_json'];future=json.loads(stored)
future['future']={'nested':[1,{'keep':True}]}
future['objects'][0]['future']={'keep':'record'}
future['objects'][0]['geometry']['points'][0]['future']=['point',7]
scene['h5e_source_json']=json.dumps(future)
out=h.export_document(scene)
assert out['future']==future['future']
assert out['objects'][0]==future['objects'][0]
scene['h5e_source_json']=stored
# Save/reopen persistence and exported JSON -> Blender reimport.
bpy.context.view_layer.objects.active=obj;obj.select_set(True)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'canonical-review.blend'))
bpy.ops.wm.open_mainfile(filepath=str(OUT/'canonical-review.blend'))
assert h.export_document(bpy.context.scene)==edited
reimport=h.import_map(h.OUTPUT/'edited.json')
assert h.export_document(reimport)==edited
assert h.digest(source)==before
result=dict(pass_=True,blender=bpy.app.version_string,source=str(source),sourceSHA256=before,
 sourceUnchanged=True,counts={g:len(original[g]) for g in h.GROUPS},zones=len(original['zones']),
 layers=len(original['layers']),noEditExactEquality=True,noEditToleranceEquality=True,
 noEditExportDrift=0,maxBlenderProjectionDrift=max(errors),tolerance=.002,
 target=target,targetOriginal=original['objects'][idx],targetEdited=edited['objects'][idx],
 expectedDeltaX=40,actualDeltaX=delta,editDeltaError=abs(delta-40),
 changedPaths=diff,add=0,remove=0,identityChanges=0,unknownPreserved=True,
 saveReopen=True,jsonReimport=True,blockedCases=checks)
(OUT/'blender.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print('DCC_MAP_01_BLENDER_PASS',json.dumps(result,ensure_ascii=True))