const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const R='\\\\192.168.87.201\\Projects\\RicochetAngles\\01_RND\\ThreeJSDEV';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const p=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_GLBSPIKE.html');
 await p.waitForFunction(()=>rendererSpike?.glb);await p.selectOption('#spikeAngle','75');
 const report={performance:[]};
 for(const count of [0,80]){
  await p.evaluate(n=>{while(rendererSpike.stressTanks.length<n)rendererSpike.addStressTank()},count);
  await p.keyboard.press('r');await p.mouse.move(650,280);await p.mouse.down();await p.waitForTimeout(1900);await p.mouse.up();
  report.performance.push(await p.evaluate(()=>({...rendererSpike.stats,stress:rendererSpike.stressTanks.length})));
 }
 report.collision=await p.evaluate(()=>{
  resetGame();rendererSpike.render(0,0);fireShell(game.player,'player');const s=game.shells.at(-1);
  const o=game.obstacles[0];s.x=o.x-o.radius-2;s.y=o.y;s.vx=690;s.vy=0;
  rendererSpike.render(0,0);const hp=o.hp;updateShells(.01);
  const before=JSON.stringify(game);rendererSpike.render(0,0);
  return {hpBefore:hp,hpAfter:o.hp,shellRemoved:!game.shells.includes(s),mapRemoved:!rendererSpike.muzzleBridge.states.has(s),hit:{x:s.x,y:s.y},visualTermination:rendererSpike.muzzleBridge.metrics.lastRemoval,renderUnchanged:before===JSON.stringify(game)};
 });
 assert(report.collision.shellRemoved&&report.collision.mapRemoved&&report.collision.renderUnchanged);
 report.ricochet=await p.evaluate(()=>{
  resetGame();rendererSpike.render(0,0);fireShell(game.player,'player');const s=game.shells.at(-1);
  s.vx=1;s.vy=100;s.basePen=100;s.traveled=0;
  resolveArmorHit(s,{nx:-1,ny:0,armor:100,x:s.x,y:s.y,zone:'test'},game.boss);
  const before=JSON.stringify(s);rendererSpike.render(0,0);
  const v=rendererSpike.muzzleBridge.shells.get(s);
  return {result:game.lastHit.result,count:s.ricochetCount,visual:v?.position.toArray(),target:[s.x,8,s.y],unchanged:before===JSON.stringify(s)};
 });
 assert(report.ricochet.count===1&&report.ricochet.unchanged);assert.deepStrictEqual(report.ricochet.visual,report.ricochet.target);
 report.boss=await p.evaluate(()=>{
  resetGame();const b=game.boss;let n=0;while(b.alive&&n++<20){
   applyPenetration(b,{x:b.x,y:b.y,weakpointName:getActiveWeakpointName(b),isActiveWeakpoint:true});
   applyPenetration(b,{x:b.x,y:b.y,weakpointName:'engine',isActiveWeakpoint:true});
  }rendererSpike.render(0,0);return {hp:b.hp,state:game.state};
 });assert(report.boss.state==='won');
 await p.keyboard.press('r');
 await p.keyboard.press('p');
 report.restartP=await p.evaluate(()=>({hp:game.player.hp,bossHp:game.boss.hp,stress:rendererSpike.stressTanks.length}));
 await p.locator('#spikeShadow').uncheck();await p.locator('#spikeShadow').check();
 for(const a of ['45','60','75','80','90'])await p.selectOption('#spikeAngle',a);
 report.errors=errors;assert(!errors.length);
 // Controlled render count and close-up comparison at identical pose/time.
 const q=await browser.newPage({viewport:{width:1280,height:720}});await q.addInitScript(()=>window.requestAnimationFrame=()=>0);
 await q.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_GLBSPIKE.html');await q.waitForFunction(()=>rendererSpike?.glb,null,{polling:100});
 for(const on of [false,true]){
  await q.evaluate(on=>{
   Math.random=()=>.5;resetGame();game.player.angle=Math.PI/6;game.player.turretAngle=-Math.PI/6;
   camera.x=game.player.x-W/2;camera.y=game.player.y-H/2;
   rendererSpike.config.cameraElevation=75;rendererSpike.muzzleBridge.config.enabled=on;
   rendererSpike.render(0,0);window.idleCalls=rendererSpike.renderer.info.render.calls;
   fireShell(game.player,'player');updateShells(1/60);game.time=.025;game.shake=0;render();
  },on);
  await q.screenshot({path:path.join(R,'M41/preview/ease_75_detail_'+(on?'ON':'OFF')+'.png'),clip:{x:585,y:275,width:170,height:145}});
 }
 report.cost=await q.evaluate(()=>({idle:idleCalls,firing:rendererSpike.renderer.info.render.calls,fxMeshes:2}));
 fs.writeFileSync(path.join(R,'M41/notes/ease_regression.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});


