const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'Docs/polish_20260920');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true});const pages={},errors=[];
 for(const [id,file] of Object.entries({before:'RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.before_polish.html',after:'RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html'})){
  const p=await b.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(id+': '+e.message));
  await p.addInitScript(()=>window.requestAnimationFrame=()=>0);
  await p.goto('http://127.0.0.1:8765/spike/'+file);
  await p.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&rendererSpike.roleTemplates.size===5,{},{polling:100,timeout:30000});
  pages[id]=p;
  await p.evaluate(()=>{
    window.fixture=()=>{
      let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      resetGame();input.keys={};input.fire=false;
      rendererSpike.config.cameraElevation=75;
      rendererSpike.roleConfig.bossAsset='tiger2';rendererSpike.roleConfig.bossScale=2;rendererSpike.roleConfig.bossShape='uniform';
      rendererSpike.roleConfig.debug=false;
      document.getElementById('spikeAngle').value='75';document.getElementById('bossAsset').value='tiger2';
      document.getElementById('bossScale').value='2';document.getElementById('bossShape').value='uniform';
      document.getElementById('roleDebug').checked=false;
      game.shake=0;game.boss.turretAngle=Math.PI;
      input.mouseScreenX=955;input.mouseScreenY=360;render();
    };
  });
 }
 const checks=await pages.after.evaluate(()=>{
  const c={};function check(k,v){c[k]=!!v;}
  check('default_camera_75',rendererSpike.config.cameraElevation===75&&document.getElementById('spikeAngle').value==='75');
  check('default_TigerII_Uniform_2',rendererSpike.roleConfig.bossAsset==='tiger2'&&rendererSpike.roleConfig.bossShape==='uniform'&&rendererSpike.roleConfig.bossScale===2&&document.getElementById('bossScale').value==='2');
  fixture();fireShell(game.boss,'boss');render();
  const shell=game.shells[0],bridge=rendererSpike.muzzleBridge.states.get(shell),v=rendererSpike.muzzleBridge.shells.get(shell),fx=rendererSpike.bossMuzzlePolish;
  check('three_puffs',fx.puffs.length===3&&fx.group.visible&&fx.group.name==='MUZZLE_SMOKE_GROUP');
  check('authored_MUZZLE_smoke_origin',fx.group.position.distanceTo(bridge.start)<1e-8);
  check('boss_alpha_at_birth',Math.abs(v.material.opacity-.12)<1e-8);
  check('boss_gameplay_origin_unchanged',Math.abs(shell.x-(game.boss.x-88))<1e-8);
  const firstSize=fx.puffs[0].mesh.scale.x,firstAlpha=fx.puffs[0].mesh.material.opacity,firstX=fx.puffs[0].mesh.position.x;
  game.time+=.03;updateShells(.03);render();
  check('boss_alpha_30ms',v.material.opacity>=.5&&v.material.opacity<=.7);
  check('smoke_expands_solid_then_drifts',fx.puffs[0].mesh.scale.x>firstSize&&fx.puffs[0].mesh.material.opacity===1&&fx.puffs[0].mesh.position.x>firstX&&fx.puffs[0].mesh.position.y>0);
  check('flash_shorter_than_smoke',!fx.enemyFX.get('boss').mesh.visible&&fx.group.visible);
  // Second fresh shot / ordinary enemy must not share a changing opacity material.
  fireShell(game.rndActors[2],'boss');fireShell(game.player,'player');render();
  const pak=game.shells[1],player=game.shells[2];
  check('other_shell_materials_opaque',rendererSpike.muzzleBridge.shells.get(pak).material.opacity===1&&rendererSpike.muzzleBridge.shells.get(player).material.opacity===1);
  game.time+=.045;updateShells(.045);render();
  check('boss_fully_visible_75ms',v.material.opacity===1);
  check('bridge_preserved_75ms',Math.abs(v.position.x-shell.x)<1e-8&&v.position.y===8);
  const before=JSON.stringify(game);render();check('render_state_isolation',before===JSON.stringify(game));
  game.time+=.2;render();check('smoke_expires',!fx.group.visible);
  fixture();fireShell(game.boss,'boss');render();game.shells[0].ricochetCount++;render();
  check('ricochet_cancels_fade',rendererSpike.muzzleBridge.shells.get(game.shells[0]).material.opacity===1);
  game.shells[0].dead=true;game.shells=[];render();
  check('collision_removes_shell',rendererSpike.muzzleBridge.shells.size===0);
  fireShell(game.boss,'boss');render();resetGame();render();check('restart_clears_smoke',!fx.group.visible);
  // Reused shell mesh must return to opaque when assigned an ordinary shot.
  fireShell(game.rndActors[0],'boss');render();
  check('pool_reuse_opacity_reset',rendererSpike.muzzleBridge.shells.get(game.shells[0]).material.opacity===1);
  fixture();fireShell(game.boss,'boss');render();game.time+=.003;render();
  check('BT_sim_clock_smoke',fx.group.visible&&rendererSpike.muzzleBridge.shells.get(game.shells[0]).material.opacity<.2);
  const alpha=rendererSpike.muzzleBridge.shells.get(game.shells[0]).material.opacity;
  for(let i=0;i<5;i++)render();
  check('render_does_not_advance_FX_time',rendererSpike.muzzleBridge.shells.get(game.shells[0]).material.opacity===alpha);
  fixture();game.timeMode='SKILL_TARGETING';confirmGeneralSkillTarget();render();
  check('Q_six_visuals',rendererSpike.qVisuals.size===6);
  const marker=game.playerArtillery[0],q=rendererSpike.qVisuals.get(marker);
  check('Q_readability_size',q.geometry.parameters.radius===4.5&&q.geometry.parameters.height===22);
  game.time+=.25;updatePlayerArtillery(.25);render();
  check('Q_descends_marker_authority',q.position.y===130&&game.qImpacts.length===0);
  game.time+=.25;updatePlayerArtillery(.25);render();
  check('Q_six_exact_impacts',game.qImpacts.length===6&&rendererSpike.qVisuals.size===0);
  return c;
 });
 // Exact gameplay parity between pre-polish and new renderers, including randomness and inputs.
 const states={};
 for(const [id,p] of Object.entries(pages)){
  states[id]=await p.evaluate(()=>{
    fixture();game.obstacles=[];game.player.hp=100;
    for(let i=0;i<420;i++){
      input.keys={w:i<120,d:i>=120&&i<170,shift:i>=200&&i<230};
      input.fire=i%90<20;
      if(i===250){game.timeMode='SKILL_TARGETING';confirmGeneralSkillTarget();}
      rndStep(1/60);render();
    }return JSON.stringify(game);
  });
 }
 checks.before_after_gameplay_identical=states.before===states.after;
 async function shot(p,name,clip){
   await p.evaluate(()=>{document.getElementById('spikeStatus').textContent='Paused comparison fixture · gameplay unchanged';});
   await p.screenshot({path:path.join(out,name+'.png'),...(clip?{clip}: {})});
 }
 const p=pages.after;
 await p.evaluate(()=>fixture());await shot(p,'01_75_baseline');
 await p.evaluate(()=>{rendererSpike.config.cameraElevation=90;document.getElementById('spikeAngle').value='90';render();});await shot(p,'02_90_reference');
 await p.evaluate(()=>{rendererSpike.config.cameraElevation=45;document.getElementById('spikeAngle').value='45';render();});await shot(p,'03_45_diagnostic');
 const timeline=[];
 for(const [id,pg] of Object.entries(pages)){
  await pg.evaluate(()=>{fixture();fireShell(game.boss,'boss');game.shake=0;render();});
  let last=0;
  for(const t of [0,.015,.03,.06,.075,.16,.26]){
   const metrics=await pg.evaluate(dt=>{
    game.time+=dt;updateShells(dt);render();
    const s=game.shells[0],m=s?rendererSpike.muzzleBridge.shells.get(s):null;
    return {gameplayX:s?.x,visualX:m?.position.x,alpha:m?.material.opacity,smokeVisible:rendererSpike.bossMuzzlePolish?.group.visible||false};
   },t-last);last=t;timeline.push({id,time:t,...metrics});
   await shot(pg,'06_'+id+'_'+Math.round(t*1000)+'ms_closeup',{x:650,y:225,width:550,height:250});
   if(t===.03)await shot(pg,id==='before'?'04_Boss_before':'05_Boss_after');
  }
 }
 await p.evaluate(()=>{fixture();input.mouseScreenX=660;input.mouseScreenY=365;game.timeMode='SKILL_TARGETING';updateRndTargetPoints();render();});await shot(p,'07_Q_targeting');
 await p.evaluate(()=>{confirmGeneralSkillTarget();game.time+=.2;updatePlayerArtillery(.2);render();});await shot(p,'08_Q_descending');
 await p.evaluate(()=>{game.time+=.3;updatePlayerArtillery(.3);updateEffects(.06);render();});await shot(p,'09_Q_impact');
 await p.evaluate(()=>fixture());
 for(const [name,clip] of [['10_PanzerIII',{x:490,y:110,width:230,height:180}],['11_Kubelwagen',{x:320,y:440,width:240,height:150}],['12_Pak40',{x:720,y:445,width:230,height:100}],['13_TigerII',{x:690,y:235,width:450,height:240}]]){
  await shot(p,name,clip);
 }
 await p.evaluate(()=>{rendererSpike.roleConfig.debug=true;fireShell(game.boss,'boss');game.time+=.03;updateShells(.03);render();});await shot(p,'14_Boss_debug_bridge');
 const result={checks,errors,timeline,pass:Object.values(checks).every(Boolean)&&!errors.length};
 fs.writeFileSync(path.join(root,'Docs/polish_validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
