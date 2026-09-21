const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:720}}),errors=[],checks={},perf=[];
p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{window.nativeRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;});
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
await p.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&rendererSpike.roleTemplates.size===5,{},{polling:100});await p.evaluate(()=>rendererSpike.worldGrade.toon.ready);
await p.locator('#postEnabled').check();await p.locator('#toonEnabled').check();
await p.locator('#toonStrength').fill('0.4');await p.locator('#toonMode').selectOption('Numeric 5');
checks.live_controls=await p.evaluate(()=>{render();return rendererSpike.worldGrade.toon.pass.enabled&&rendererSpike.worldGrade.toon.config.strength===.4&&rendererSpike.worldGrade.toon.config.mode==='Numeric 5';});
await p.locator('#toonMode').selectOption('T_Lut_03');await p.locator('#toonFilter').selectOption('Linear');
checks.filter=await p.evaluate(()=>{render();return rendererSpike.worldGrade.toon.config.filter==='Linear';});
await p.screenshot({path:path.join(root,'Docs/toon_v4b/V4B_controls.png')});
for(const name of ['Post OFF','Post ON / Toon OFF','Toon T_Lut_03','Toon Numeric 5']){
const result=await p.evaluate(async name=>{
resetGame();input.keys={};input.fire=false;input.contourPointerInside=false;updateTargetContourSelection();
const g=rendererSpike.worldGrade;g.preset('Cinematic A');g.config.enabled=name!=='Post OFF';
g.toon.config.enabled=name.startsWith('Toon');g.toon.config.mode=name==='Toon Numeric 5'?'Numeric 5':'T_Lut_03';g.toon.config.strength=.6;
for(let i=0;i<4;i++)render();const programs=rendererSpike.renderer.info.programs.length,stamps=[];
await new Promise((resolve,reject)=>{const deadline=setTimeout(()=>reject(Error('RAF timeout')),10000);function tick(t){render();stamps.push(t);if(stamps.length>=90){clearTimeout(deadline);resolve();}else nativeRAF(tick);}nativeRAF(tick);});
return {fps:89000/(stamps.at(-1)-stamps[0]),calls:rendererSpike.renderer.info.render.calls,triangles:rendererSpike.renderer.info.render.triangles,post:g.info,programs:rendererSpike.renderer.info.programs.length,stablePrograms:programs===rendererSpike.renderer.info.programs.length};
},name);perf.push({name,...result});
}
const missing=await b.newPage({viewport:{width:1280,height:720}});
await missing.route('**/textures/T_Lut_03.png',r=>r.fulfill({status:404,body:'test: intentionally missing ramp'}));
await missing.addInitScript(()=>requestAnimationFrame=()=>0);
await missing.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');await missing.waitForFunction(()=>window.rendererSpike?.worldGrade,{},{polling:100});await missing.evaluate(()=>rendererSpike.worldGrade.toon.ready);
checks.numeric_fallback=await missing.evaluate(()=>{const g=rendererSpike.worldGrade;g.config.enabled=true;g.toon.config.enabled=true;render();return !g.toon.state.loaded&&!!g.toon.state.error&&g.toon.pass.uniforms.useRamp.value===0&&g.toon.pass.uniforms.count.value===4&&rendererSpike.enabled;});
const result={checks,perf,errors,pass:Object.values(checks).every(Boolean)&&perf.every(p=>p.stablePrograms)&&!errors.length};
fs.writeFileSync(path.join(root,'Docs/toon_v4b_live.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
