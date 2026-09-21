const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:720}}),errors=[],checks={};
p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
await p.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&rendererSpike.roleTemplates.size===5);
await p.keyboard.press('r');await p.mouse.move(955,360);await p.keyboard.down('Shift');await p.waitForTimeout(400);
checks.real_shift_focus=await p.evaluate(()=>game.precisionAim.ready&&rendererSpike.focusMaterial.state.strength===1&&rendererSpike.focusMaterial.state.targetId==='boss');
await p.keyboard.up('Shift');await p.waitForTimeout(50);checks.release=await p.evaluate(()=>rendererSpike.focusMaterial.state.strength===0);
await p.locator('#focusMaterial').uncheck();checks.toggle_off=await p.evaluate(()=>!rendererSpike.focusMaterial.config.enabled);
await p.locator('#focusMaterial').check();
await p.evaluate(()=>{window.rndStep=()=>{};});
const perf=[];
for(const [name,id,on]of [['OFF_Panzer','panzer',false],['ON_Panzer','panzer',true],['OFF_Tiger2','boss',false],['ON_Tiger2','boss',true]]){
await p.evaluate(({id,on})=>{
resetGame();const a=id==='boss'?game.boss:game.rndActors.find(a=>a.id===id);
input.keys.shift=on;updateTimeModeTimers(.35);input.contourPointerInside=true;input.mouseScreenX=a.x-camera.x;input.mouseScreenY=a.y-camera.y;updateTargetContourSelection();updatePrecisionXray();render();
},{id,on});
await p.waitForTimeout(500);
const sample=await p.evaluate(async()=>{
const f=rendererSpike.focusMaterial,s=f.state.compiles,a=f.state.variantsCreated,frames=[];
await new Promise(resolve=>{let start;function tick(now){start??=now;frames.push(now);if(now-start>=1500)resolve();else requestAnimationFrame(tick);}requestAnimationFrame(tick);});
const gl=rendererSpike.renderer.getContext();
return {fps:(frames.length-1)*1000/(frames.at(-1)-frames[0]),calls:rendererSpike.renderer.info.render.calls,triangles:rendererSpike.renderer.info.render.triangles,programs:rendererSpike.renderer.info.programs.length,noCompile:f.state.compiles===s,noAllocation:f.state.variantsCreated===a,gpu:gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL)};
});perf.push({name,...sample});
}
const result={checks,perf,errors,pass:Object.values(checks).every(Boolean)&&perf.every(p=>p.noCompile&&p.noAllocation)&&!errors.length};
fs.writeFileSync(path.join(root,'Docs/focus_v2_live.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
