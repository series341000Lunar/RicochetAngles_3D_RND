// Asset injection only: never writes Mainline or the NAS source packages.
import fs from 'node:fs';
import path from 'node:path';
import {repo, assetRoot, mainline, filesUnder, inspectGlb, sha256} from './audit-lookdev-assets.mjs';

const output = path.join(repo,'Docs/global-lookdev'), target = path.join(repo,'lookdev/assets');
fs.mkdirSync(output,{recursive:true}); fs.mkdirSync(target,{recursive:true});
const mapFile = 'maps/H5E_PILOT_MAP_PASS2_14W_v0.1.json';
const map = JSON.parse(fs.readFileSync(path.join(mainline,mapFile),'utf8'));
const enc = map.zones.find(z=>z.id==='ENC_01'), ppm = 14;
const mainlineAssets = filesUnder(path.join(mainline,'assets'),'.glb').map(file=>({file,sha256:sha256(fs.readFileSync(file))}));
const scales = {
  'M4A3E8_RND_v01.glb':[1,0], 'Panzer3_RND_v02.glb':[1,-0.145], 'Panzer4_BASE.glb':[1.25,0],
  '75mm_PAK_40_RND_v01.glb':[1.25,0], '88mm_PAK_43_RND_v01.glb':[20/14,-0.0005001389072276652*20/14],
  'ATGun_Traverse_RND_v02.glb':[16/14,0], 'LV_Kubelwagen_RND_v01.glb':[1,0],
  'LV_GEHalfTrack_RND_v01.glb':[1,-0.006999969482421875],
  'Panzer6B_Tiger2_Stage1Boss_RND_v01.glb':[24/14,0],
  'CoastalBattery_SHARED.glb':[220/14.31999945640564/14,0],
  'CoastalBattery_COUPLER_N.glb':[220/14.31999945640564/14,0],
  'CoastalBattery_COUPLER_S.glb':[220/14.31999945640564/14,0]
};
const all = JSON.parse(fs.readFileSync(path.join(output,'asset-audit.json'),'utf8'));
const selected = all.filter(a=>!a.error && a.file.includes('GLB_Export') && !/\\(?:validation|backup_pre_[^\\]+)\\/.test(a.file));
const unique = [...new Map(selected.map(a=>[a.sha256,a])).values()];
function inject(a) {
  const name = a.sha256.slice(0,16)+'.glb', file = path.join(target,name);
  if (fs.existsSync(file) && sha256(fs.readFileSync(file)) !== a.sha256) throw Error('Existing derivative differs: '+file);
  if (!fs.existsSync(file)) fs.copyFileSync(a.file,file,fs.constants.COPYFILE_EXCL);
  const same = mainlineAssets.find(m=>m.sha256===a.sha256), preset = same && scales[path.basename(same.file)];
  const coastal = a.nodes.some(n=>n.name==='COASTAL_BATTERY_ROOT' || /^COUPLER_(?:ROOT|ASSEMBLY)/.test(n.name));
  return {id:a.sha256.slice(0,16), label:a.file.slice(a.file.indexOf('GLB_Export')+11).replaceAll('\\',' / '),
    url:'./assets/'+name, source:a.file, bytes:a.bytes, sha256:a.sha256, sourceBounds:a.bounds,
    mainlineReference:same ? path.relative(mainline,same.file).replaceAll('\\','/') : null,
    scale:preset?.[0] ?? 1, groundOffset:preset?.[1] ?? -a.bounds.min[1],
    transformBasis:preset ? 'MAINLINE_DESCRIPTOR / 14px per metre' : 'SOURCE_SCALE_1 / measured minimum-Y grounding',
    sourceRole:same ? (preset ? 'MAINLINE_DESCRIPTOR_EXACT_BYTES' : 'MAINLINE_FILE_EXACT_BYTES / no active descriptor') :
      'RND_COMPARISON_SOURCE / approval not inferred',
    coastal, animations:a.animations, visible:!!preset && !coastal,
    aliases:all.filter(b=>b.sha256===a.sha256).map(b=>b.file)};
}
const actors = unique.map(inject);
// Additional contemporary source models are displayed at source scale, explicitly R&D-only.
for (const a of actors) if (/M41_RND_v02|M4A3E2|Panzer6_Tiger1.*v02|Panzer6B_Tiger2\\export|schurzen_variants\\armored/.test(a.source)) a.visible=true;
const visible = actors.filter(a=>a.visible), alternate = actors.filter(a=>!a.visible);
visible.forEach((a,i)=>{a.position=[enc.startX/ppm+12+(i%5)*16,0,30+Math.floor(i/5)*16];a.yaw=(i%3)*25;});
// Measured ENV dragon's-teeth span X712.55–718.88 / Z36.24–58.57m.
// Move this one bay south of it; visual placement never changes collision data.
for(const a of visible)if(a.source.includes('schurzen_variants\\armored'))a.position[2]=66;
alternate.forEach((a,i)=>{
  const index = i%visible.length;
  // Comparison versions share a parking bay and start hidden. Show Solo avoids overlap.
  a.position=[...visible[index].position]; a.yaw=visible[index].yaw;
  if(a.coastal || /SHIP_LCT/.test(a.source)){a.position=[enc.startX/ppm+48,0,65];a.yaw=0;}
});
const env = inject(all.find(a=>a.file===path.join(assetRoot,'ENV/Stage1/glb/Stage1_StaticWorld_RND_v01.glb')));
env.label='Stage 1 static world'; env.position=[0,0,0];env.scale=1;env.groundOffset=0;
env.sourceRole='CURRENT_MAINLINE_ENV_EXACT_BYTES';
const manifest = {schema:'ra-global-lookdev-v1',referenceDate:'2026-10-14',pixelsPerMeter:ppm,
  reference:{root:mainline,map:mapFile,renderer:'src/unified-world.js',lighting:'src/hybrid-environment.js',actors:'src/hybrid-player.js'},
  field:{minX:enc.startX/ppm,maxX:enc.endX/ppm,minZ:0,maxZ:map.world.height/ppm,sourceZone:enc.id},
  environment:env,actors};
fs.writeFileSync(path.join(repo,'lookdev/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
// Protect observed local work and all reference content. Check later without rewriting this baseline.
const snapshotFile=path.join(output,'preservation-before.json');
function collect(dir,skip=[]) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>skip.includes(e.name)?[]:
    e.isDirectory()?collect(path.join(dir,e.name),skip):[path.join(dir,e.name)]);
}
if (!fs.existsSync(snapshotFile)) {
  const referenceFiles = ['src','assets','maps','docs'].flatMap(d=>collect(path.join(mainline,d)));
  referenceFiles.push(...['AGENTS.md','index.html'].map(d=>path.join(mainline,d)));
  const existing = ['spike','dcc00','tests','M41','Panzer3','Panzer4','Stage1_CostalBattery'].filter(d=>fs.existsSync(path.join(repo,d)))
    .flatMap(d=>collect(path.join(repo,d),['__pycache__','test-output']));
  existing.push(...fs.readdirSync(repo).filter(n=>/^(Launch_|Export_)|^RicochetAngles.*\.html$/.test(n)).map(n=>path.join(repo,n)));
  const entries = [...referenceFiles,...existing,...all.map(a=>a.file)].map(file=>({file,sha256:sha256(fs.readFileSync(file))}));
  fs.writeFileSync(snapshotFile,JSON.stringify(entries,null,2)+'\n');
}
console.log(JSON.stringify({environment:env.sha256,actors:actors.length,visible:visible.length,
  exactMainline:actors.filter(a=>a.mainlineReference).length,field:manifest.field},null,2));
