const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),outdir=path.join(root,'Docs/validation_20260920');
fs.mkdirSync(outdir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await page.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
 await page.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&Object.values(rendererSpike.roleLoads).filter(v=>v==='ready').length===5, {},{polling:100,timeout:30000});
 async function snapshot(name){await page.evaluate(()=>{document.getElementById('spikeStatus').textContent='PAUSED validation fixture · 1280×720 logical canvas · FPS sampled separately';});await page.screenshot({path:path.join(outdir,name+'.png')});}
 await page.evaluate(()=>{
   window.rndFixture=()=>{
     let seed=867;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
     resetGame();input.keys={};input.fire=false;
     rendererSpike.stressTanks.forEach(t=>rendererSpike.stressGroup.remove(t));rendererSpike.stressTanks.length=0;
     rendererSpike.roleConfig.bossScale=1;rendererSpike.roleConfig.bossShape='uniform';rendererSpike.roleConfig.debug=false;
     game.player.turretAngle=0;game.boss.turretAngle=Math.PI;
     input.mouseScreenX=game.boss.x-camera.x;input.mouseScreenY=game.boss.y-camera.y;
   };
   rndFixture();
   // Matched pose and actual gameplay shots; no simulation advance between cameras.
   fireShell(game.player,'player');fireShell(game.boss,'boss');
   game.time+=.035;updateShells(.035);
   rendererSpike.config.cameraElevation=90;render();
 });
 await snapshot('A_90_normal_combat');
 await page.evaluate(()=>{rendererSpike.config.cameraElevation=75;document.getElementById('spikeAngle').value='75';render();});
 await snapshot('B_75_normal_combat');
 await page.evaluate(()=>{
   rndFixture();game.obstacles=[];const p=game.player;
   fireShell({x:p.x+390,y:p.y,turretAngle:Math.PI},'boss');
   updateThreatAssessment();activateBulletTime();rndStep(.02);
   fireShell(p,'player');render();
 });
 await snapshot('C_75_bullet_time');
 await page.evaluate(()=>{
   rndFixture();input.keys.shift=true;updateTimeModeTimers(.36);
   game.player.turretAngle=Math.atan2(game.boss.y-game.player.y,game.boss.x-game.player.x);
   updatePrecisionXray();render();
 });
 await snapshot('D_75_focus_xray');
 await page.evaluate(()=>{
   const a=game.rndActors[0];input.mouseScreenX=a.x-camera.x;input.mouseScreenY=a.y-camera.y;
   game.player.turretAngle=Math.atan2(a.y-game.player.y,a.x-game.player.x);updatePrecisionXray();render();
 });
 await snapshot('D2_75_focus_Panzer3');
 await page.evaluate(()=>{
   rndFixture();input.mouseScreenX=680-camera.x;input.mouseScreenY=game.player.y+20-camera.y;
   rndActions.q=true;handleTimeModeInputs();render();
 });
 await snapshot('E_75_Q_targeting');
 await page.evaluate(()=>{confirmGeneralSkillTarget();game.time+=.2;updatePlayerArtillery(.2);render();});
 await snapshot('F_75_Q_descending');
 await page.evaluate(()=>{game.time+=.3;updatePlayerArtillery(.3);updateEffects(.06);render();});
 await snapshot('G_75_Q_impact');
 const scales=[];
 for(const [scale,name] of [[1,'H_Tiger_1x'],[1.5,'I_Tiger_1_5x'],[2,'J_Tiger_2x']]){
   const measurement=await page.evaluate(async scale=>{
     const THREE=await import('./vendor/three.module.js');
     rndFixture();rendererSpike.roleConfig.bossScale=scale;rendererSpike.roleConfig.debug=true;
     document.getElementById('bossScale').value=String(scale);document.getElementById('roleDebug').checked=true;
     input.keys.shift=true;updateTimeModeTimers(.36);updatePrecisionXray();render();
     const v=rendererSpike.roleVisuals.get('boss'),box=new THREE.Box3().setFromObject(v.root);
     const m=v.root.getObjectByName('MUZZLE').getWorldPosition(new THREE.Vector3()),screen=m.clone().project(rendererSpike.view);
     const gameplay={x:game.boss.x+Math.cos(game.boss.turretAngle)*88-camera.x,y:game.boss.y+Math.sin(game.boss.turretAngle)*88-camera.y};
     const delta=Math.hypot((screen.x+1)*W/2-gameplay.x,(1-screen.y)*H/2-gameplay.y);
     return {scale,height:box.max.y,muzzleHeight:m.y,muzzleDeltaLogicalPx:delta,bossHP:game.boss.hp,collisionRadius:game.boss.collisionRadius};
   },scale);scales.push(measurement);await snapshot(name);
 }
 await snapshot('K_uniform_large_Boss');
 const lowwide=await page.evaluate(async()=>{
   const THREE=await import('./vendor/three.module.js');
   rendererSpike.roleConfig.bossShape='lowwide';document.getElementById('bossShape').value='lowwide';render();
   const v=rendererSpike.roleVisuals.get('boss'),box=new THREE.Box3().setFromObject(v.root);
   const m=v.root.getObjectByName('MUZZLE').getWorldPosition(new THREE.Vector3()),screen=m.clone().project(rendererSpike.view);
   const gp={x:game.boss.x+Math.cos(game.boss.turretAngle)*88-camera.x,y:game.boss.y+Math.sin(game.boss.turretAngle)*88-camera.y};
   return {shape:'lowwide',scales:[1.7,1.2,1.9],height:box.max.y,muzzleHeight:m.y,muzzleDeltaLogicalPx:Math.hypot((screen.x+1)*W/2-gp.x,(1-screen.y)*H/2-gp.y)};
 });
 await snapshot('L_low_wide_Boss');
 await page.evaluate(()=>{rendererSpike.roleConfig.bossShape='uniform';document.getElementById('bossShape').value='uniform';});
 for(const angle of [60,45]){
   await page.evaluate(angle=>{rendererSpike.config.cameraElevation=angle;document.getElementById('spikeAngle').value=String(angle);render();},angle);
   await snapshot('Camera_'+angle+'_diagnostic');
 }
 const checks=await page.evaluate(()=>{
   const checks={};function check(k,v){checks[k]=!!v;}
   rndFixture();game.timeMode='SKILL_TARGETING';updateRndTargetPoints();confirmGeneralSkillTarget();render();
   check('six_3d_shells',rendererSpike.qVisuals.size===6);
   const m=game.playerArtillery[0],v=rendererSpike.qVisuals.get(m);
   check('Q_XZ_gameplay_target',v.position.x===m.x&&v.position.z===m.y);
   check('Q_starts_high',v.position.y===260);
   game.timeMode='BULLET_TIME';game.bulletTime.remaining=3;
   const d=getFrameDts(.1);game.time+=d.simDt;updatePlayerArtillery(d.simDt);render();
   check('Q_BulletTime_marker_follow',Math.abs(m.remaining-.49)<1e-8&&Math.abs(v.position.y-254.8)<1e-8);
   const before=JSON.stringify(game);for(let i=0;i<10;i++)render();
   check('Q_render_no_impact_or_state_write',JSON.stringify(game)===before&&game.qImpacts.length===0);
   game.time+=.49;updatePlayerArtillery(.49);render();
   check('Q_gameplay_removes_visual',game.qImpacts.length===6&&rendererSpike.qVisuals.size===0);
   check('Q_no_visual_damage_authority',!('collider' in v)&&!('damage' in v));
   // Short bridge follows simulation clock; collision / ricochet immediately terminates correction.
   rndFixture();game.obstacles=[];fireShell(game.player,'player');
   const s=game.shells[0],bridge=rendererSpike.muzzleBridge.states.get(s);render();
   const mesh=rendererSpike.muzzleBridge.shells.get(s);
   check('bridge_actual_muzzle_start',mesh.position.distanceTo(bridge.start)<1e-8);
   game.time+=.0075;updateShells(.0075);render();
   const expected=.271;const target=mesh.position.clone().set(s.x,8,s.y);
   const expect=bridge.start.clone().lerp(target,expected);
   check('bridge_75ms_sim_ease',mesh.position.distanceTo(expect)<1e-6);
   check('flash_BulletTime_alive',rendererSpike.muzzleBridge.flash.visible);
   game.time+=.0675;updateShells(.0675);render();
   check('bridge_exact_end',mesh.position.distanceTo(target.set(s.x,8,s.y))<1e-6);
   fireShell(game.player,'player');const s2=game.shells[1];s2.ricochetCount++;render();
   check('ricochet_ends_bridge',rendererSpike.muzzleBridge.states.get(s2).bridge===false);
   s2.dead=true;game.shells=game.shells.filter(s=>!s.dead);render();
   check('collision_removes_visual',!rendererSpike.muzzleBridge.states.has(s2)&&!rendererSpike.muzzleBridge.shells.has(s2));
   const fixed=JSON.stringify(game);rendererSpike.config.cameraElevation=45;rendererSpike.roleConfig.bossScale=2;render();
   check('camera_scale_no_gameplay_write',JSON.stringify(game)===fixed);
   check('angles_45_to_90',Array.from(document.getElementById('spikeAngle').options).map(o=>+o.value).join(',')==='45,50,55,60,65,70,75,80,85,90');
   return checks;
 });
 const output={phase:'R3',checks,scales,lowwide,errors,pass:Object.values(checks).every(Boolean)&&!errors.length};
 fs.writeFileSync(path.join(root,'Docs/R3_validation.json'),JSON.stringify(output,null,2));
 console.log(JSON.stringify(output));await browser.close();if(!output.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
