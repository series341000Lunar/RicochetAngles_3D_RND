
import bpy,json,hashlib
from pathlib import Path
from datetime import datetime,timezone,timedelta
B=Path(r'\\192.168.87.201\Projects\RicochetAngles')
D=B/'01_RND/ThreeJSDEV/LV_Kubelwagen'
bpy.ops.wm.open_mainfile(filepath=str(D/'source/LV_Kubelwagen_RND_v01.blend'))
assert len(bpy.context.scene.objects)==8
assert all(max(abs(v) for v in o.rotation_euler)<1e-6 for o in bpy.context.scene.objects)
assert all(max(abs(v-1) for v in o.scale)<1e-6 for o in bpy.context.scene.objects)
p=D/'notes/asset_validation_v01.json';r=json.loads(p.read_text())
for f in r['protected_files']:
    assert hashlib.sha256(Path(f['path']).read_bytes()).hexdigest()==f['sha256']
r['visual']='PASS within inspected Blender views; no runtime approval'
r['visual_notes']='Neutral top/side/isometric and steered views inspected. Source silhouette, cabin, seats, folded canvas and transparent windshield retained. No visible tire/fender penetration in inspected views.'
r['preview_method']='Fresh GLB import; Workbench multi-view renders with shadows disabled to avoid preview shadow artifacts.'
r['recovery']='Interactive Blender terminated during optional preview refresh. Single background Blender regenerated all nine previews. Saved derivative reopened with 8 nodes, neutral rotations and unit scales. First recovery assertion used invalid Euler.length API; corrected component-wise check passed.'
r['saved_blend_reopen_neutral']='PASS, repeated in background after preview recovery'
r['finished']=datetime.now(timezone(timedelta(hours=9))).isoformat()
p.write_text(json.dumps(r,ensure_ascii=False,indent=2),encoding='utf-8')
md=f"""# LV_Kubelwagen GLB derivative v01

## Source and protection
Source: {r['source']}
Reason: only completed current original v01; authored proportions, wheel locations and root retained.
SHA-256 before/after: {r['source_sha256']} (identical).
M41 reference blend/GLB hashes also unchanged.

## Changes
Fixed body, fenders, interior, lamps and canvas merged into HULL. Evaluated license text converted to geometry.
Four wheel assemblies merged separately; two steering empties added.
No decimation or silhouette redesign. Geometry maximum vertex deviation: {r['neutral_geometry_max_vertex_error_m']} m.
Five original materials retained to preserve body, rubber, seats/canvas, transparent glass and light/marking distinctions.
Glass: BLEND, alpha 0.23, double-sided; no textures.

## Deliverables
- source/LV_Kubelwagen_RND_v01.blend
- export/LV_Kubelwagen_RND_v01.glb
- preview/: neutral and +/-25-degree steering, each isometric/top/side (9 PNGs)
- notes/asset_validation_v01.json: detailed numerical evidence
- notes/execution_request.txt: exact user execution request

## Statistics
GLB: 946436 bytes; 8 nodes; 5 meshes; 23076 triangles; 13 material primitives; 5 materials; 0 textures.
HULL 14884 triangles; each wheel 2048 triangles.
Overall neutral length/width/height: 3.525 / 2.016 / 1.856 m, all model geometry included.

## Technical verification: PASS
Requested hierarchy, names, original root and wheel centers retained.
GLB meters, +X forward, +Y up, left -Z/right +Z.
All neutral local rotations identity, scales positive unit; no animation/skin/skeleton.
Front steer local Y; wheel spin local Z. Front wheel local translations zero.
Fresh empty-scene GLB reimport: names/parents/positions/dimensions match.
Each front wheel independently tested at -25 and +25 degrees; other wheels and HULL remained fixed.
Wheel spin +60 degrees tested after steering; center drift 0 m. Rear wheel spins passed.
Neutral pose restored; derivative saved and reopened. Repeated reopen after recovery passed.
Original and M41 SHA-256 protected.

## Visual verification: PASS within inspected views
Actual neutral top/side/isometric and steering previews inspected.
Hood, fenders, windshield, open cabin, seats, folded canvas and four wheel locations retained.
Windshield transparency preserved; through-glass cabin remains visible.
No visible tire/fender penetration in inspected views.
BVH surface intersection checks against front fender/lip geometry: 0 intersecting pairs at 0/-25/+25 for both front wheels.

## Limitations
No continuous-angle clearance, whole-vehicle collision, suspension or physics validation.
The tested +/-25 degrees are not approved gameplay steering limits.
No steering/driving logic or animation implemented; no HTML/Unity runtime integration.
Runtime transparency sorting, performance and game appearance remain UNVERIFIED.

## Execution issue and recovery
{r['recovery']}
Final previews use Workbench with shadows disabled; original geometry and exported GLB were unchanged.
Finished: {r['finished']}
"""
(D/'notes/BUILD_AND_VALIDATION_v01.md').write_text(md,encoding='utf-8')
log=B/'00_Asset/MODEL/LV_Kubelwagen/RUN_LOG.md'
old=log.read_text(encoding='utf-8')
assert '## Run 002' not in old
prompt=(D/'notes/execution_request.txt').read_text(encoding='utf-8-sig')
with log.open('a',encoding='utf-8') as f:
    f.write('\n\n## Run 002\n\n### Execution\n- Status: Completed (GLB derivative)\n- Started: 미확인 — 시작 시각 미확보\n- Finished: '+r['finished']+'\n- Elapsed: 미확인\n- Agent: Codex\n\n### Execution Prompt\n'+prompt+'\n\n### Result and Verification\n'+md)
print('FINAL_REOPEN_NEUTRAL_HASH_REPORT_PASS')

