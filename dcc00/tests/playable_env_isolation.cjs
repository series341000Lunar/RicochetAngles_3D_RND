const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'dcc00/test-output/playable-env-recovery-20260925');
const url='http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html';
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true}),results={};
 for(const version of ['before','after','missing']){
  const p=await b.newPage({viewport:{width:1600,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{requestAnimationFrame=()=>0;let s=991;window.auditRandomCalls=0;Math.random=()=>{auditRandomCalls++;s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};});
  if(version==='before')await p.route('**/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(out,'before/playable.html'))}));
  if(version==='missing')await p.route('**/workspace/playable-env/geometry.glb*',r=>r.fulfill({status:404,body:'Deliberately missing test asset'}));
  await p.goto(url);await p.waitForFunction(()=>rndStartup.state==='READY'||rndStartup.error,null,{timeout:60000,polling:100});
  const startup=await p.evaluate(()=>({state:rndStartup.state,error:rndStartup.error,randomCalls:auditRandomCalls,nextRandom:Math.random(),game:JSON.stringify(game),env:rendererSpike.staticEnvironment?.status}));
  assert.equal(startup.state,'READY');assert.equal(startup.error,null);
  await p.locator('#startupStart').click();
  const data=await p.evaluate(()=>{
   let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   resetGame();const states=[],flags={focus:false,q:false,bossActive:false,projectiles:false,restart:false};
   const initialBoss=game.boss.x;
   for(let i=0;i<600;i++){
    input.keys={w:i<80,s:i>=100&&i<130,a:i>=140&&i<160,d:i>=160&&i<180,shift:i>=200&&i<240};
    input.fire=i%90<12;input.mouseWorldX=955;input.mouseWorldY=1800;
    if(i===300)rndActions.q=true;
    if(i===310)rndActions.confirm=true;
    if(i===500){resetGame();flags.restart=game.player.hp===5&&game.boss.hp===10&&game.obstacles.length===9;}
    rndStep(1/60);render();
    flags.focus ||= game.precisionAim.ready;flags.q ||= game.playerArtillery.length>0||game.qImpacts.length>0;
    flags.bossActive ||= game.boss.x!==initialBoss||game.boss.timer>0;
    flags.projectiles ||= game.shells.length>0;
    states.push(JSON.stringify(game));
   }
   return {states,flags,world:WORLD,env:rendererSpike.staticEnvironment?.status};
  });
  results[version]={startup:{...startup,gameHash:hash(startup.game)},traceHash:hash(data.states.join('\n')),flags:data.flags,world:data.world,errors};
  delete results[version].startup.game;
  assert.deepEqual(errors,[]);
  if(version==='before'){results.initialGame=startup.game;results.trace=data.states;}
  else{
   assert.equal(startup.game,results.initialGame,version+' startup game');
   assert.equal(startup.nextRandom,results.before.startup.nextRandom,version+' random stream');
   assert.equal(startup.randomCalls,results.before.startup.randomCalls,version+' random consumption');
   assert.deepEqual(data.states,results.trace,version+' full gameplay trace');
  }
  if(version==='after')assert.equal(startup.env,'READY');
  if(version==='missing')assert.equal(startup.env,'MISSING');
  await p.close();
 }
 delete results.initialGame;delete results.trace;
 results.pass=true;results.frames=600;
 fs.writeFileSync(path.join(out,'isolation.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify(results));await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
