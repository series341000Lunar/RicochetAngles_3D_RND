import bpy,json,hashlib,sys
from pathlib import Path
from mathutils import Vector
DCC=Path(__file__).resolve().parents[1];root=DCC.parent
out=DCC/'test-output/playable-env-recovery-20260925'
preserved=json.loads((out/'preservation.json').read_text(encoding='utf-8-sig'))
for p,h in preserved.items():
    assert hashlib.sha256((root/p).read_bytes()).hexdigest().upper()==h.upper(),p
bpy.ops.wm.open_mainfile(filepath=str(DCC/'workspace/playable-env/authoring.blend'))
s=bpy.context.scene;coll=bpy.data.collections['PLAYABLE_ENV_STATIC']
assert len(coll.objects)==212
assert not s.get('h5e_source_json')
assert not any(o.get('h5e_id') or o.get('dcc_anchor') for o in s.objects)
assert bpy.data.texts.get('Export Playable ENV')
points=[o.matrix_world@Vector(v) for o in coll.objects for v in o.bound_box]
bounds={'x':[min(p.x for p in points)*14,max(p.x for p in points)*14],'y':[min(-p.y for p in points)*14,max(-p.y for p in points)*14],'height':[min(p.z for p in points)*14,max(p.z for p in points)*14]}
result={'preservation':True,'savedDerivativeReload':True,'noH5ESemanticData':True,'staticObjects':len(coll.objects),'referenceOnlyObjects':[o.name for o in s.objects if o.name.startswith('REF ')],'nativeExportTextPresent':True,'bounds':bounds}
(out/'source-verification.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))
