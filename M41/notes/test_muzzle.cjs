const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const R='\\\\192.168.87.201\\Projects\\RicochetAngles\\01_RND\\ThreeJSDEV';
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
const page=await browser.newPage({viewport:{width:1280,height:720}});
await page.addInitScript(()=>{window.requestAnimationFrame=cb=>0});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_GLBSPIKE.html');
await page.waitForFunction(()=>rendererSpike?.glb,null,{polling:100});
const report={deltas:[],bridge:[]};
for(const [angle,on,label] of [[90,true,'A_90_fire'],[75,false,'B_75_bridge_off'],[75,true,'C_75_bridge_on'],[60,true,'D_60_reference']]){
 await page.evaluate(a=>{const e=document.getElementById('spikeAngle');e.value=String(a);e.dispatchEvent(new Event('change'));},angle);
 await page.evaluate(on=>{const e=document.getElementById('bridgeEnabled');e.checked=on;e.dispatchEvent(new Event('change'));},on);
 await page.evaluate(()=>{const e=document.getElementById('muzzleDebug');e.checked=true;e.dispatchEvent(new Event('change'));});
 const result=await page.evaluate(()=>{
  Math.random=()=>.5;resetGame();const p=game.player;
  p.angle=Math.PI/6;p.turretAngle=-Math.PI/6;
  camera.x=p.x-W/2;camera.y=p.y-H/2;
  rendererSpike.render(0,0);
  fireShell(p,'player');const shell=game.shells[game.shells.length-1];
  updateShells(1/60);game.shake=0;
  const before=JSON.stringify(game);render();
  const bridge=rendererSpike.muzzleBridge,m=bridge.shells.get(shell),origin=bridge.states.get(shell).start;
  return {angle:rendererSpike.config.cameraElevation,on:bridge.config.enabled,delta:{...bridge.metrics},origin:origin.toArray(),visual:m.position.toArray(),target:[shell.x,8,shell.y],flash:bridge.flash.position.toArray(),smoke:bridge.smoke.position.toArray(),gameUnchanged:before===JSON.stringify(game)};
 });
 report.deltas.push(result);assert(result.gameUnchanged);
 if(on)assert(Math.hypot(...result.visual.map((v,i)=>v-result.origin[i]))<1e-7);
 assert.deepStrictEqual(result.flash,result.origin);assert.deepStrictEqual(result.smoke,result.origin);
 await page.screenshot({path:path.join(R,'M41/preview/'+label+'.png')});
 if(angle===75&&on){
  for(const age of [.016,.0375,.075,.1]){
   const sample=await page.evaluate(age=>{
    const b=rendererSpike.muzzleBridge,s=[...b.states.keys()][0];
    game.time=age;updateShells(age===.016?.016:age===.0375?.0215:age===.075?.0375:.025);
    const before=JSON.stringify(s);rendererSpike.render(0,0);
    const v=b.shells.get(s).position.toArray();
    return {age,visual:v,target:[s.x,8,s.y],unchanged:before===JSON.stringify(s)};
   },age);
   report.bridge.push(sample);assert(sample.unchanged);
   if(age>=.075)assert.deepStrictEqual(sample.visual,sample.target);
  }
 }
}
report.ricochet=await page.evaluate(()=>{
 resetGame();rendererSpike.render(0,0);fireShell(game.player,'player');
 const s=game.shells.at(-1);s.ricochetCount=1;s.x+=2;s.y+=3;rendererSpike.render(0,0);
 const b=rendererSpike.muzzleBridge,v=b.shells.get(s).position.toArray();
 const result={visual:v,target:[s.x,8,s.y],enabled:b.states.get(s).bridge};
 s.dead=true;const hit=[s.x,s.y];game.shells=[];rendererSpike.render(0,0);
 return {...result,removal:b.metrics.lastRemoval,mapSize:b.states.size,hit};
});
assert.deepStrictEqual(report.ricochet.visual,report.ricochet.target);assert(!report.ricochet.enabled);assert(report.ricochet.mapSize===0);
report.stress=await page.evaluate(()=>{
 const before=JSON.stringify(game);for(let i=0;i<20;i++)rendererSpike.addStressTank();
 rendererSpike.render(0,0);const count=rendererSpike.stressTanks.length;
 const fx=rendererSpike.stressTanks.map(t=>{let n=0;t.traverse(o=>{if(o.name.includes('FLASH')||o.name.includes('SMOKE'))n++});return n});
 resetGame();rendererSpike.render(0,0);return {count,fx,retained:rendererSpike.stressTanks.length,bridgeStates:rendererSpike.muzzleBridge.states.size,flash:rendererSpike.muzzleBridge.flash.visible,smoke:rendererSpike.muzzleBridge.smoke.visible};
});
assert(report.stress.count===20&&report.stress.retained===20&&report.stress.fx.every(n=>n===0)&&!report.stress.flash&&!report.stress.smoke);
report.pose=await page.evaluate(()=>{
 const out=[];
 for(const [h,t] of [[0,0],[1,.4],[-.7,2]]){
 game.player.angle=h;game.player.turretAngle=t;rendererSpike.render(0,0);
 const m=rendererSpike.glb.player.getObjectByName('MUZZLE'),v=m.position.clone().set(1,0,0).transformDirection(m.matrixWorld);
 out.push({h,t,direction:[v.x,v.z],expected:[Math.cos(t),Math.sin(t)]});
 }return out;
});
for(const v of report.pose)assert(Math.hypot(...v.direction.map((x,i)=>x-v.expected[i]))<1e-6);
// Compare unmodified baseline versus current with identical seed and input for a controlled update sequence.
const baseline=await browser.newPage();
await baseline.addInitScript(()=>{window.requestAnimationFrame=()=>0});
await baseline.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_GLBSPIKE.before_muzzle.html');
await baseline.waitForFunction(()=>rendererSpike?.glb,null,{polling:100});
const simulate=()=>{
 let seed=123;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 resetGame();lastTime=0;input.keys={w:true,d:true};input.fire=true;input.mouseScreenX=950;input.mouseScreenY=290;
 const snapshots=[];
 for(let i=1;i<=180;i++){if(i===60)input.keys={};if(i===100)input.fire=false;frame(i*1000/60);if(i%30===0)snapshots.push(JSON.stringify(game));}
 return snapshots;
};
const a=await baseline.evaluate(simulate),b=await page.evaluate(simulate);
report.deterministic={frames:180,snapshots:a.length,equal:JSON.stringify(a)===JSON.stringify(b)};
assert(report.deterministic.equal);
report.errors=errors;assert(!errors.length);
fs.writeFileSync(path.join(R,'M41/notes/muzzle_browser_validation.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});


