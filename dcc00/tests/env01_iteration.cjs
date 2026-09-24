const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert'),cp=require('child_process'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/env01');
const blender='C:/Program Files/Blender Foundation/Blender 5.2/blender.exe';
function phase(name){
 const r=cp.spawnSync(blender,['--background','--factory-startup','--python-exit-code','1','--python',path.join(root,'env01/author_scene.py'),'--',name],{encoding:'utf8',timeout:60000});
 fs.writeFileSync(path.join(out,name+'-export.log'),r.stdout+'\n'+r.stderr);
 assert.equal(r.status,0,r.stderr+r.stdout);
}
function glbInfo(file){
 const b=fs.readFileSync(file);assert.equal(b.toString('ascii',0,4),'glTF');
 const n=b.readUInt32LE(12),g=JSON.parse(b.toString('utf8',20,20+n));
 assert((g.buffers||[]).every(b=>!b.uri));assert((g.images||[]).every(i=>!i.uri));
 assert(!JSON.stringify(g).match(/[A-Z]:\\|\\\\192\.168|file:\/\//));
 assert(!(g.extensionsUsed||[]).some(e=>/draco|meshopt/i.test(e)));
 assert(g.nodes.every(n=>n.name.startsWith('ENV_')));
 return {bytes:b.length,meshes:g.meshes.length,materials:g.materials.length,
  triangles:g.meshes.reduce((n,m)=>n+m.primitives.reduce((v,p)=>v+(p.indices!==undefined?g.accessors[p.indices].count:g.accessors[p.attributes.POSITION].count)/3,0),0),
  externalDependencies:0,nodeNames:g.nodes.map(n=>n.name),sha256:crypto.createHash('sha256').update(b).digest('hex')};
}
function diff(a,b,p=''){
 if(a&&b&&typeof a==='object'&&typeof b==='object'){
  assert.deepStrictEqual(Object.keys(a),Object.keys(b),'key set '+p);
  return Object.keys(a).flatMap(k=>diff(a[k],b[k],p+'/'+k));
 }
 return a===b?[]:[p];
}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8766/dcc00/html/testbed.html?mode=env01');
 await page.waitForFunction(()=>window.env01?.asset,null,{timeout:60000});
 await page.waitForTimeout(200);
 const game=await page.evaluate(()=>JSON.stringify(env01.world.game));
 async function capture(tag){
  const v=await page.evaluate(()=>{
   env01.world.rendererSpike.scene.updateMatrixWorld(true);
   const positions={};env01.asset.traverse(o=>{if(o.name.startsWith('ENV_')){const v=o.getWorldPosition(o.position.clone());positions[o.name]=v.toArray();}});
   return {anchors:env01.measurements(),stats:env01.stats(),positions,map:env01.document,revision:env01.revision,reloadMilliseconds:env01.reloadMilliseconds};
  });
  for(const a of v.anchors)assert(a.error<.002,JSON.stringify(a));
  await page.click('#view90');await page.waitForTimeout(120);await page.screenshot({path:path.join(out,tag+'-90-overlay.png')});
  await page.locator('#showSemantic').uncheck();await page.click('#view75');await page.waitForTimeout(120);
  await page.screenshot({path:path.join(out,tag+'-75.png')});
  await page.locator('#showSemantic').check();return v;
 }
 const initial=await capture('initial'),initialGlb=glbInfo(path.join(root,'workspace/env01/geometry.glb'));
 phase('mesh');
 await page.click('#envReload');await page.waitForFunction(n=>env01.revision>n,initial.revision);await page.waitForTimeout(120);
 const mesh=await capture('mesh');
 assert.deepStrictEqual(diff(initial.map,mesh.map),[]);
 const moved=Object.keys(initial.positions).filter(k=>JSON.stringify(initial.positions[k])!==JSON.stringify(mesh.positions[k]));
 assert.deepStrictEqual(moved,['ENV_PROP_CRATE_01']);
 assert(Math.abs(mesh.positions[moved[0]][0]-initial.positions[moved[0]][0]-28)<.002);
 phase('map');
 await page.click('#envReload');await page.waitForFunction(n=>env01.revision>n,mesh.revision);await page.waitForTimeout(120);
 const final=await capture('final');
 assert.deepStrictEqual(diff(mesh.map,final.map),['/objects/15/geometry/x']);
 assert(Math.abs(final.map.objects[15].geometry.x-mesh.map.objects[15].geometry.x-28)<.002);
 const mapMoved=Object.keys(mesh.positions).filter(k=>JSON.stringify(mesh.positions[k])!==JSON.stringify(final.positions[k]));
 assert.deepStrictEqual(mapMoved.sort(),['ENV_ANCHOR_A','ENV_WALL_01']);
 // Rendered wall footprint, not only exported empty-marker positions.
 const footprint=await page.evaluate(()=>{
  const o=env01.asset.getObjectByName('ENV_WALL_01'),v=o.getWorldPosition(o.position.clone());
  const size=o.geometry.boundingBox||null;return {position:v.toArray(),rotation:o.rotation.toArray()};
 });
 assert(Math.abs(footprint.position[0]-final.map.objects[15].geometry.x)<.002);
 for(const [input,prop]of[['showSemantic','overlay'],['showMap','bounds'],['showEnv','envGroup']]){
  await page.locator('#'+input).uncheck();assert.equal(await page.evaluate(p=>env01[p].visible,prop),false);await page.locator('#'+input).check();
 }
 await page.fill('#envId','H5E_P1_TUT_COVER_02');await page.click('#envSelect');assert.equal(await page.evaluate(()=>env01.selected),'H5E_P1_TUT_COVER_02');
 await page.fill('#envId','NOT_AN_ID');await page.click('#envSelect');assert.equal(await page.evaluate(()=>env01.selected),'H5E_P1_TUT_COVER_02');
 await page.click('#envFit');await page.waitForTimeout(100);await page.screenshot({path:path.join(out,'whole-stage.png')});
 await page.click('#envSlice');
 // Missing GLB must retain map/IDs without ghost geometry.
 await page.route('**/geometry.glb?*',route=>route.abort());
 let rev=final.revision;await page.click('#envReload');await page.waitForFunction(n=>env01.revision>n,rev);
 assert.equal(await page.evaluate(()=>env01.asset),null);assert.equal(await page.evaluate(()=>env01.entries.length),197);
 await page.screenshot({path:path.join(out,'missing-env.png')});await page.unroute('**/geometry.glb?*');
 rev=await page.evaluate(()=>env01.revision);await page.click('#envReload');await page.waitForFunction(n=>env01.revision>n,rev);
 assert(await page.evaluate(()=>!!env01.asset));
 // Bad map preserves previous coherent display and shows BLOCK.
 await page.route('**/map.json?*',route=>route.fulfill({status:200,contentType:'application/json',body:'{}'}));
 rev=await page.evaluate(()=>env01.revision);await page.click('#envReload');await page.waitForFunction(()=>!!env01.error);
 assert.equal(await page.evaluate(()=>env01.revision),rev);await page.unroute('**/map.json?*');
 await page.click('#envReload');await page.waitForFunction(n=>env01.revision>n,rev);
 assert.equal(await page.evaluate(()=>JSON.stringify(env01.world.game)),game);assert.deepStrictEqual(errors,[]);
 const compact=v=>({...v,map:undefined});
 const result={pass:true,tolerance:.002,initial:compact(initial),mesh:compact(mesh),final:compact(final),
  initialGlb,finalGlb:glbInfo(path.join(root,'workspace/env01/geometry.glb')),meshChangedOnly:moved,mapChangedOnly:diff(mesh.map,final.map),
  mapAlignmentMeshesChanged:mapMoved,wallFootprint:footprint,missingAssetFailSoft:true,badMapRetainsStage:true,
  toggles:true,stableIdSelection:true,gameplayUnchanged:true,errors};
 fs.writeFileSync(path.join(out,'runtime.json'),JSON.stringify(result,null,2));await browser.close();console.log('ENV01_ITERATION_PASS');
})().catch(e=>{console.error(e);process.exit(1)});