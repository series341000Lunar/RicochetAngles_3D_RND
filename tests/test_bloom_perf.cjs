const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:720}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{window.nativeRAF=requestAnimationFrame.bind(window);requestAnimationFrame=()=>0;});
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');await p.waitForFunction(()=>window.rndStartup?.state==='READY',{}, {polling:100});await p.locator('#startupStart').click();
const result=await p.evaluate(async()=>{
const g=rendererSpike.worldGrade,r=rendererSpike.renderer,gl=r.getContext(),wall=performance.now.bind(performance);
let clock=1000;performance.now=()=>clock;
const rows=[],first=[];
function fixture(scenario,on){resetGame();input.keys={};input.fire=false;g.config.enabled=false;g.toon.config.enabled=false;g.bloom.config.enabled=on;render();
if(scenario==='player')fireShell(game.player,'player');
if(scenario==='boss')fireShell(game.boss,'boss');
if(scenario==='Q'){game.timeMode='SKILL_TARGETING';confirmGeneralSkillTarget();}
}
for(const scenario of ['idle','player','boss','Q']){
fixture(scenario,false);g.bloom.config.enabled=true;const programs=r.info.programs.length,textures=r.info.memory.textures,t=wall();render();gl.finish();first.push({scenario,ms:wall()-t,programsBefore:programs,programsAfter:r.info.programs.length,texturesBefore:textures,texturesAfter:r.info.memory.textures});
}
for(const [name,scenario,on,stress]of [['OFF','idle',false,0],['ON idle','idle',true,0],['Player','player',true,0],['Boss','boss',true,0],['Q','Q',true,0],['Stress100 OFF','idle',false,100],['Stress100 ON','idle',true,100]]){
if(stress&&rendererSpike.stressTanks.length===0)for(let i=0;i<100;i++)rendererSpike.addStressTank();
fixture(scenario,on);for(let i=0;i<4;i++)render();gl.finish();
const stamps=[],cpu=[];
await new Promise(resolve=>{function tick(t){const st=wall();render();cpu.push(wall()-st);stamps.push(t);if(stamps.length===90)resolve();else nativeRAF(tick);}nativeRAF(tick);});
const diffs=stamps.slice(1).map((v,i)=>v-stamps[i]).sort((a,b)=>a-b);
rows.push({name,stress,fps:89000/(stamps.at(-1)-stamps[0]),medianFrameMs:diffs[Math.floor(diffs.length/2)],p95FrameMs:diffs[Math.floor(diffs.length*.95)],meanSubmitMs:cpu.reduce((a,b)=>a+b)/cpu.length,drawCalls:r.info.render.calls,triangles:r.info.render.triangles,post:g.info,programs:r.info.programs.length,textures:r.info.memory.textures});
}
return {first,rows,pass:first.every(v=>v.programsBefore===v.programsAfter&&v.texturesBefore===v.texturesAfter)};
});result.errors=errors;result.pass=result.pass&&!errors.length;fs.writeFileSync(path.join(root,'Docs/V5_performance.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();})().catch(e=>{console.error(e);process.exit(1)});
