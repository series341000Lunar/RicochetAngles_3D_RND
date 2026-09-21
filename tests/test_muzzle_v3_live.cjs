const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:720}}),errors=[],checks={},perf=[];
p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{window.nativeRAF=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>0;});
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
await p.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&rendererSpike.roleTemplates.size===5,{},{polling:100});
await p.evaluate(()=>{resetGame();render();game.timeMode='BULLET_TIME';game.bulletTime.remaining=2;fireShell(game.boss,'boss');render();});
checks.real_BT_on=await p.evaluate(()=>rendererSpike.muzzleLights.slots.boss.light.visible);
await p.waitForTimeout(120);
checks.real_BT_off=await p.evaluate(()=>{render();return !rendererSpike.muzzleLights.slots.boss.light.visible&&game.timeMode==='BULLET_TIME';});
for(const name of ['OFF_idle','ON_idle','Player_peak','Boss_peak']){
const sample=await p.evaluate(async name=>{
const realNow=performance.now.bind(performance);let fixed=realNow();performance.now=()=>fixed;
let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
resetGame();input.keys={};input.fire=false;game.player.x=500;game.player.turretAngle=0;
rendererSpike.muzzleLights.config.enabled=name!=='OFF_idle';render();
if(name==='Player_peak')fireShell(game.player,'player');if(name==='Boss_peak')fireShell(game.boss,'boss');
game.shake=0;for(let i=0;i<4;i++)render();
const programs=rendererSpike.renderer.info.programs.length;
const stamps=[];await new Promise(resolve=>{function tick(t){render();stamps.push(t);if(stamps.length>=90)resolve();else window.nativeRAF(tick);}window.nativeRAF(tick);});
const m=rendererSpike.muzzleLights,gl=rendererSpike.renderer.getContext();
const result={fps:89000/(stamps.at(-1)-stamps[0]),calls:rendererSpike.renderer.info.render.calls,triangles:rendererSpike.renderer.info.render.triangles,programs:rendererSpike.renderer.info.programs.length,stablePrograms:programs===rendererSpike.renderer.info.programs.length,activeMuzzleLights:Object.values(m.slots).filter(s=>s.light.visible).length,pooledLights:2,lightShadows:Object.values(m.slots).some(s=>s.light.castShadow),gpu:gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL)};
performance.now=realNow;return result;
},name);perf.push({name,...sample});}
const result={checks,perf,errors,pass:Object.values(checks).every(Boolean)&&perf.every(s=>s.stablePrograms&&!s.lightShadows)&&!errors.length};
fs.writeFileSync(path.join(root,'Docs/muzzle_v3_live.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
