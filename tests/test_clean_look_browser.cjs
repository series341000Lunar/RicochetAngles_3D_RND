const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'Docs/clean-lookdev');fs.mkdirSync(out,{recursive:true});
const url='http://127.0.0.1:8765/lookdev/';
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1600,height:960},deviceScaleFactor:1});
  const errors=[],checks={},samples=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(url);await page.waitForFunction(()=>['READY','DEGRADED','FAILED'].includes(window.lookdev?.status),null,{timeout:90000});
  checks.loaded=await page.evaluate(()=>lookdev.status==='READY'&&lookdev.assets.length===30&&lookdev.assets.every(a=>a.hashVerified));
  if(!checks.loaded)throw Error(await page.evaluate(()=>JSON.stringify(lookdev.errors)));
  const sourceSnapshot=()=>page.evaluate(async()=>{
    const geometries=new Map(),materials=new Map();
    for(const a of [lookdev.environment,...lookdev.assets])a.root.traverse(n=>{
      if(!n.isMesh||n.userData.lookdevOutline)return;geometries.set(n.geometry.id,n.geometry);
      for(const m of Array.isArray(n.material)?n.material:[n.material])materials.set(m.id,m);
    });
    const hashes=[];
    for(const [id,g] of geometries){
      const attrs=[g.attributes.position,g.attributes.normal,g.index].filter(Boolean),buffers=attrs.map(a=>a.array);
      const all=new Uint8Array(buffers.reduce((s,b)=>s+b.byteLength,0));let offset=0;
      for(const b of buffers){all.set(new Uint8Array(b.buffer,b.byteOffset,b.byteLength),offset);offset+=b.byteLength;}
      hashes.push([id,[...new Uint8Array(await crypto.subtle.digest('SHA-256',all))].join(',')]);
    }
    return {hashes,materials:[...materials].map(([id,m])=>({id,color:m.color?.toArray(),emissive:m.emissive?.toArray(),
      emissiveIntensity:m.emissiveIntensity,roughness:m.roughness,metalness:m.metalness,opacity:m.opacity}))};
  });
  const before=await sourceSnapshot();
  const worldStats=()=>page.evaluate(()=>{
    const materials=new Map();lookdev.environment.root.traverse(n=>{if(n.isMesh&&!n.userData.lookdevOutline)
      for(const m of Array.isArray(n.material)?n.material:[n.material])if(m.color)materials.set(m.id,m.color);});
    const values=[...materials.values()].map(c=>{const max=Math.max(c.r,c.g,c.b),min=Math.min(c.r,c.g,c.b);return (max-min)/Math.max(max,1e-6);});
    return {materials:values.length,meanSaturation:values.reduce((a,b)=>a+b,0)/values.length};
  });
  const baselineWorld=await worldStats();
  async function capture(name,mode){
    await page.evaluate(mode=>lookdev.setLookMode(mode),mode);await page.waitForTimeout(350);
    await page.screenshot({path:path.join(out,name+'.png')});
    await page.locator('#world').screenshot({path:path.join(out,name+'-world.png')});
    samples.push(await page.evaluate(name=>({name,settings:{...lookdev.settings},effects:lookdev.cleanLook.metrics(),
      draws:lookdev.renderer.info.render.calls,triangles:lookdev.renderer.info.render.triangles,
      geometries:lookdev.renderer.info.memory.geometries,programs:lookdev.renderer.info.programs.length,
      footprint:lookdev.footprint()}),name));
  }
  await capture('A-mainline-reference','MAINLINE_REFERENCE');
  await capture('B-clean-low-poly','CLEAN_LOW_POLY');
  const candidateWorld=await worldStats();checks.worldPaletteChanged=candidateWorld.meanSaturation<baselineWorld.meanSaturation*.75;
  await capture('C-clean-black-outline','CLEAN_OUTLINE');
  const stats=await page.evaluate(()=>{
    const outlines=[];for(const a of [lookdev.environment,...lookdev.assets])a.root.traverse(n=>{if(n.userData.lookdevOutline)outlines.push({name:n.name,cast:n.castShadow,receive:n.receiveShadow,side:n.material.side,depth:n.material.depthTest,write:n.material.depthWrite,width:n.material.uniforms.widthPixels.value});});
    const energy=lookdev.assets.find(a=>a.label.includes('Stage1Boss'));let protectedColor=null;
    energy.root.traverse(n=>{for(const m of n.material?(Array.isArray(n.material)?n.material:[n.material]):[])if(m.name==='EnergyAccent')protectedColor=m.color.getHexString();});
    return {outlines,metrics:lookdev.cleanLook.metrics(),protectedColor};
  });
  checks.selective=stats.metrics.outlinedEnvironment.length===2&&!stats.outlines.some(n=>/ENV_GROUND|Rock|Dragons/.test(n.name));
  checks.noOutlineShadow=stats.outlines.every(n=>!n.cast&&!n.receive&&n.side===1&&n.depth&&!n.write);
  checks.widthPixels=stats.outlines.every(n=>n.width>=.6&&n.width<=1.4);
  checks.rosterOutlineCoverage=await page.evaluate(()=>lookdev.assets.filter(a=>a.root.visible).every(a=>{
    const hull=a.root.getObjectByName('HULL');let covered=false;(hull||a.root).traverse(n=>{if(n.userData.lookdevOutline)covered=true;});return covered;
  }));
  const boss=await page.evaluate(()=>lookdev.assets.find(a=>a.label.includes('Stage1Boss')).id);
  await page.locator('#assetSelect').selectOption(boss);await page.locator('#solo').click();
  await page.evaluate(()=>lookdev.setZoom(1.8));await capture('D-major-target','CLEAN_OUTLINE');
  await page.locator('#wreck').check();await page.waitForTimeout(250);await page.screenshot({path:path.join(out,'E-wreck-comparison.png')});
  checks.wreckDifference=await page.evaluate(()=>lookdev.assets.find(a=>a.id===document.getElementById('assetSelect').value).lookdevWreck);
  await page.locator('#baseline').click();checks.referenceRestores=await page.evaluate(()=>lookdev.cleanLook.originalsRestored()&&!lookdev.assets.some(a=>a.lookdevWreck)&&lookdev.cleanLook.metrics().visibleOutlineMeshes===0);
  const restored=await sourceSnapshot();checks.sourceGeometryPreserved=JSON.stringify(before.hashes)===JSON.stringify(restored.hashes);
  checks.materialsRestored=JSON.stringify(before.materials)===JSON.stringify(restored.materials);
  await page.locator('#roster').click();await page.locator('#home').click();await page.locator('#candidateOutline').click();
  for(const [width,height] of [[800,1100],[2200,450],[1600,960]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(150);
    for(const zoom of [.1,1,4,100]){
      await page.evaluate(z=>{lookdev.setZoom(z);lookdev.pan(1e4,-1e4);},zoom);await page.waitForTimeout(30);
      checks['boundary_'+width+'_'+zoom]=await page.evaluate(()=>{const f=lookdev.manifest.field;return lookdev.footprint().every(p=>p.x>=f.minX-1e-5&&p.x<=f.maxX+1e-5&&p.z>=f.minZ-1e-5&&p.z<=f.maxZ+1e-5);});
    }
  }
  await page.locator('#home').click();await page.setViewportSize({width:1600,height:960});
  // Panning to the same position must reproduce the same image, not a noisy outline.
  const box=await page.locator('#world').boundingBox();
  await page.evaluate(()=>{document.querySelector('.topline').style.visibility='hidden';document.querySelector('.help').style.visibility='hidden';});
  const imageBefore=await page.screenshot({clip:box});
  await page.evaluate(()=>{lookdev.pan(4.5,2.25);lookdev.pan(-4.5,-2.25);});await page.waitForTimeout(100);
  const imageAfter=await page.screenshot({clip:box});checks.deterministicReturn=imageBefore.equals(imageAfter);
  await page.evaluate(()=>{document.querySelector('.topline').style.visibility='';document.querySelector('.help').style.visibility='';});
  await page.locator('#shadows').uncheck();await page.waitForTimeout(100);checks.shadowOff=await page.evaluate(()=>!lookdev.renderer.shadowMap.enabled);
  await page.locator('#shadows').check();
  await page.waitForTimeout(250);const cache=await page.evaluate(()=>({g:lookdev.renderer.info.memory.geometries,p:lookdev.renderer.info.programs.length,effects:lookdev.cleanLook.metrics()}));
  for(let i=0;i<20;i++)await page.evaluate(i=>lookdev.setLookMode(i%2?'CLEAN_OUTLINE':'MAINLINE_REFERENCE'),i);
  await page.waitForTimeout(250);const afterCache=await page.evaluate(()=>({g:lookdev.renderer.info.memory.geometries,p:lookdev.renderer.info.programs.length,effects:lookdev.cleanLook.metrics()}));
  checks.boundedCache=afterCache.g===cache.g&&afterCache.effects.geometryBytes===cache.effects.geometryBytes&&afterCache.effects.shaderMaterials===cache.effects.shaderMaterials;
  const performance=[];
  for(const mode of ['MAINLINE_REFERENCE','CLEAN_LOW_POLY','CLEAN_OUTLINE']){
    await page.evaluate(mode=>lookdev.setLookMode(mode),mode);await page.waitForTimeout(250);
    performance.push(await page.evaluate(mode=>{
      const a=lookdev,times=[];for(let i=0;i<40;i++){const start=performance.now();a.renderer.render(a.scene,a.camera);times.push(performance.now()-start);}
      times.sort((a,b)=>a-b);return {mode,cpuMedianMs:times[20],cpuP95Ms:times[38],draws:a.renderer.info.render.calls,triangles:a.renderer.info.render.triangles,effects:a.cleanLook.metrics()};
    },mode));
  }
  checks.noErrors=errors.length===0;
  const disposal=await page.evaluate(()=>{lookdev.dispose();return {status:lookdev.status,geometries:lookdev.renderer.info.memory.geometries,disposed:lookdev.cleanLook.state.disposed};});
  checks.dispose=disposal.status==='DISPOSED'&&disposal.geometries===0&&disposal.disposed;
  const result={pass:Object.values(checks).every(Boolean),checks,errors,samples,outline:stats,cache,afterCache,performance,disposal,palette:{baselineWorld,candidateWorld}};
  fs.writeFileSync(path.join(out,'validation.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({pass:result.pass,checks,errors,outline:stats.metrics,performance},null,2));
  await browser.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1);});
