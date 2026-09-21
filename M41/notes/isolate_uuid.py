from pathlib import Path
import json,hashlib
v=Path(r"\\192.168.87.201\Projects\RicochetAngles\01_RND\ThreeJSDEV\spike\vendor")
p=v/'three.module.js'; s=p.read_text(encoding='utf-8')
old='\n'.join('\tconst d%d = Math.random() * 0xffffffff | 0;'%i for i in range(4))
new='\t// R&D isolation: UUID allocation must not consume the Legacy gameplay RNG, including async GLTFLoader work.\n\tconst [ d0, d1, d2, d3 ] = crypto.getRandomValues( new Uint32Array( 4 ) );'
assert s.count(old)==1
s=s.replace(old,new,1);p.write_text(s,encoding='utf-8')
meta=json.loads((v/'provenance.json').read_text())
for e in meta:
 if e['file']=='three.module.js':
  e['upstream_sha256']=e['sha256'];e['sha256']=hashlib.sha256(p.read_bytes()).hexdigest();e['patch']='generateUUID: four Math.random words replaced by crypto.getRandomValues; no rendering or loader algorithm changes'
(v/'provenance.json').write_text(json.dumps(meta,indent=2))

