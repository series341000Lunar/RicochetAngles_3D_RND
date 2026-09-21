const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),results={};
for(const version of ['before','legacy','remap']){
const p=await browser.newPage({viewport:{width:1280,height:720}});
await p.addInitScript(()=>requestAnimationFrame=()=>0);
if(version==='before')await p.route('**/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.before_g1.html'),'utf8')}));
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');await p.waitForFunction(()=>window.rndStartup?.state==='READY',{}, {polling:100});await p.locator('#startupStart').click();
results[version]=await p.evaluate(version=>{
if(window.tigerWeakpoints)tigerWeakpoints.setPreset(version==='remap'?'TIGER_REMAP':'LEGACY');
const traces=[];
for(const useRenderer of [false,true]){
let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};resetGame();input.keys={};input.fire=false;
const frames=[];for(let i=0;i<600;i++){
input.keys={w:i<120,shift:i>=200&&i<280};input.fire=i%90<20;
if(i===300){game.timeMode='SKILL_TARGETING';confirmGeneralSkillTarget();}
if(i===410){game.timeMode='BULLET_TIME';game.bulletTime.remaining=1;}
rndStep(1/60);if(useRenderer)render();frames.push(JSON.stringify(game));
}traces.push(frames);
}
const functions={};for(const name of ['getShellHitWithBoss','updateShells','resolveArmorHit','applyPenetration','detonateRndHE','updatePlayerArtillery','updateBoss','updateTimeModeTimers'])functions[name]=window[name]?.toString()||null;
return {rendererEqual:traces[0].every((v,i)=>v===traces[1][i]),trace:traces[0],functions};
},version);await p.close();
}
const checks={legacyExact:results.before.trace.every((v,i)=>v===results.legacy.trace[i]),legacyRenderIsolation:results.legacy.rendererEqual,remapRenderIsolation:results.remap.rendererEqual,functionsUnchanged:JSON.stringify(results.before.functions)===JSON.stringify(results.remap.functions)};
const result={checks,frames:600,functions:Object.keys(results.before.functions),pass:Object.values(checks).every(Boolean)};
fs.writeFileSync(path.join(root,'Docs/G1_isolation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
