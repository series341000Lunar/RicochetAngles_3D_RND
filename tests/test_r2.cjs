const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await page.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
 await page.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&Object.values(rendererSpike.roleLoads).filter(v=>v==='ready').length===5, {},{polling:100,timeout:30000});
 const results=await page.evaluate(async()=>{
   const THREE=await import('./vendor/three.module.js');
   const checks={},measurements={};function check(k,v){checks[k]=!!v;}
   resetGame();game.obstacles=[];render();
   check('five_GLBS',rendererSpike.roleTemplates.size===5);
   check('four_gameplay_visuals',rendererSpike.roleVisuals.size===4);
   for(const [id,v] of rendererSpike.roleVisuals){
     const b=new THREE.Box3().setFromObject(v.root);
     measurements[id]={minY:b.min.y,scale:v.root.scale.toArray(),muzzle:v.root.getObjectByName('MUZZLE')?.getWorldPosition(new THREE.Vector3()).toArray()||null};
     check(id+'_ground',Math.abs(b.min.y)<1e-4);
     check(id+'_visible',v.root.visible&&v.root.parent===rendererSpike.scene);
     check(id+'_heading',Math.abs(v.hull.rotation.y+(id==='boss'?game.boss:game.rndActors.find(a=>a.id===id)).angle)<1e-8);
     if(id!=='truck')check(id+'_muzzle',!!measurements[id].muzzle);
   }
   const panzer=game.rndActors[0],truck=game.rndActors[1],pak=game.rndActors[2];
   const panzerX=panzer.x,truckX=truck.x,pakPose=[pak.x,pak.y,pak.angle];
   game.player.hp=100;
   for(let i=0;i<360;i++){game.time+=1/60;updateRndActors(1/60);updateShells(1/60);}
   check('panzer_moves',Math.abs(panzer.x-panzerX)>1);
   check('panzer_fires',game.rndShots.panzer>0);
   check('truck_moves',Math.abs(truck.x-truckX)>1);
   check('truck_no_gun',!game.shells.some(s=>s.sourceId==='truck'));
   check('pak_fires',game.rndShots.pak>0);
   check('pak_fixed',JSON.stringify([pak.x,pak.y,pak.angle])===JSON.stringify(pakPose));
   const gs=JSON.stringify(game);
   rendererSpike.roleConfig.bossScale=2;rendererSpike.render(0,0);
   check('boss_scale_gameplay_unchanged',JSON.stringify(game)===gs);
   check('boss_scale_visual',rendererSpike.roleVisuals.get('boss').root.scale.x===28);
   rendererSpike.roleConfig.bossAsset='tiger1';rendererSpike.render(0,0);
   check('tiger1_switch',rendererSpike.roleVisuals.get('boss').asset==='tiger1');
   rendererSpike.roleConfig.bossAsset='tiger2';rendererSpike.roleConfig.bossScale=1;
   // Player AP uses the same earliest hit, armor, penetration resolver for all added roles.
   resetGame();game.obstacles=[];game.boss.x=1100;game.boss.y=2400;
   game.rndActors[1].x=1000;game.rndActors[2].x=1000;
   const a=game.rndActors[0];a.x=game.player.x+100;a.y=game.player.y;a.angle=Math.PI;game.player.turretAngle=0;
   fireShell(game.player,'player');updateShells(.15);
   check('panzer_existing_AP_hit',a.hp===2);
   damageRndActor(a,9);rendererSpike.render(0,0);check('death_cleanup',!rendererSpike.roleVisuals.has('panzer'));
   game.rndActors=game.rndActors.filter(a=>a.id!=='truck');rendererSpike.render(0,0);check('remove_cleanup',!rendererSpike.roleVisuals.has('truck'));
   resetGame();rendererSpike.render(0,0);check('restart_roles',rendererSpike.roleVisuals.size===4);
   rendererSpike.addStressTank();check('stress_preserved',rendererSpike.stressTanks.length===1);
   const before=JSON.stringify(game);render();check('complete_render_isolation',JSON.stringify(game)===before);
   // Seeded gameplay must remain identical with the renderer run between steps.
   function sequence(withRender){
     let seed=12345;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
     resetGame();input.keys={w:true};input.fire=true;input.mouseScreenX=950;input.mouseScreenY=360;
     for(let i=0;i<180;i++){rndStep(1/60);if(withRender)render();}
     return JSON.stringify(game);
   }
   const original=Math.random,without=sequence(false),with3d=sequence(true);Math.random=original;
   check('180_frame_deterministic',without===with3d);
   resetGame();input.keys={};input.fire=false;render();
   return {checks,measurements};
 });
 const out={phase:'R2',...results,errors,pass:Object.values(results.checks).every(Boolean)&&!errors.length};
 fs.writeFileSync(path.resolve(__dirname,'../Docs/R2_validation.json'),JSON.stringify(out,null,2));
 await page.screenshot({path:path.resolve(__dirname,'../Docs/R2_initial.png')});
 console.log(JSON.stringify(out));await browser.close();if(!out.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
