const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:720}}),errors=[],checks={},perf=[];
p.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR: '+e.message);});p.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});
await p.addInitScript(()=>{window.nativeRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;});
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
await p.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&rendererSpike.roleTemplates.size===5,{},{polling:100});
console.log('assets ready');
Object.assign(checks,await p.evaluate(()=>{
const c={},g=rendererSpike.worldGrade;resetGame();input.keys={shift:true};input.contourPointerInside=true;input.mouseScreenX=955;input.mouseScreenY=360;updateTimeModeTimers(.35);updateTargetContourSelection();updatePrecisionXray();render();
const hud=canvas.toDataURL();for(const tone of ['None','ACES','Cineon','Reinhard']){g.config.tone=tone;render();if(canvas.toDataURL()!==hud)c.HUD_identical=false;}c.HUD_identical??=true;
for(const [id,val]of [['exposure',1.2],['contrast',1.1],['saturation',.7],['shadow',.9],['mid',1.04],['highlight',.95],['tint',.05]]){const el=document.getElementById('post_'+id);el.value=val;el.dispatchEvent(new Event('input'));c['UI_'+id]=g.config[id]===val;}
g.preset('Neutral');g.config.tone='None';g.config.exposure=.5;render();const low=rendererSpike.renderer.domElement.toDataURL();g.config.exposure=2;render();c.None_exposure_works=low!==rendererSpike.renderer.domElement.toDataURL();
const a=game.rndActors[0];a.alive=false;render();c.actor_cleanup=!rendererSpike.roleVisuals.has(a.id);
return c;
}));
console.log('UI checks done');
await p.setViewportSize({width:1024,height:768});await p.evaluate(()=>render());checks.viewport=await p.evaluate(()=>rendererSpike.enabled&&rendererSpike.renderer.getRenderTarget()===null);await p.setViewportSize({width:1280,height:720});
for(const name of ['Neutral','Cinematic A','Cinematic B']){
 await p.evaluate(name=>{resetGame();input.keys={};rendererSpike.worldGrade.preset(name);render();},name);
 await p.screenshot({path:path.join(root,'Docs/tone_v4a/preset_'+name.replaceAll(' ','_')+'.png')});
}
console.log('preset captures done');
for(const stress of [0,100]){
for(const preset of ['V3 bypass','Neutral','Cinematic A','Cinematic B']){
console.log('perf '+stress+' '+preset);
const result=await p.evaluate(async({stress,preset})=>{
resetGame();input.keys={};input.fire=false;input.contourPointerInside=false;updateTargetContourSelection();document.getElementById('clearStress').click();
for(let i=0;i<stress;i++)rendererSpike.addStressTank();
const g=rendererSpike.worldGrade;g.preset(preset==='V3 bypass'?'Neutral':preset);g.config.enabled=preset!=='V3 bypass';
for(let i=0;i<4;i++)render();const stamps=[];await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('RAF performance sample timeout')),10000);function tick(t){render();stamps.push(t);if(stamps.length>=60){clearTimeout(timeout);resolve();}else nativeRAF(tick);}nativeRAF(tick);});
return {fps:59000/(stamps.at(-1)-stamps[0]),calls:rendererSpike.renderer.info.render.calls,triangles:rendererSpike.renderer.info.render.triangles,post:g.info,programs:rendererSpike.renderer.info.programs.length};
},{stress,preset});perf.push({stress,preset,...result});
}
}
console.log('perf complete');
const p2=await b.newPage({viewport:{width:1280,height:720},deviceScaleFactor:2});await p2.addInitScript(()=>requestAnimationFrame=()=>0);
await p2.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');await p2.waitForFunction(()=>window.rendererSpike&&rendererSpike.worldGrade,{},{polling:100});
checks.initial_DPR2=await p2.evaluate(()=>{render();return rendererSpike.renderer.getPixelRatio()===1.5&&rendererSpike.worldGrade.info.width===1920;});
const result={checks,perf,errors,pass:Object.values(checks).every(Boolean)&&!errors.length};fs.writeFileSync(path.join(root,'Docs/tone_v4a_live.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
