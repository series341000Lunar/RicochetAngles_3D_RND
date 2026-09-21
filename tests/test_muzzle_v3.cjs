const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..'),out=path.join(root,'Docs/muzzle_v3');fs.mkdirSync(out,{recursive:true});
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:720}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});
await p.addInitScript(()=>window.requestAnimationFrame=()=>0);
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
await p.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&rendererSpike.roleTemplates.size===5,{},{polling:100});
await p.evaluate(()=>{
 window.v3Clock=1000;performance.now=()=>window.v3Clock;
 window.fixture=(angle=75,focus=false)=>{
 let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 resetGame();input.keys={shift:focus};input.fire=false;game.player.x=500;game.player.hp=100;game.player.turretAngle=0;game.boss.turretAngle=Math.PI;
 rendererSpike.config.cameraElevation=angle;document.getElementById('spikeAngle').value=String(angle);
 input.contourPointerInside=true;input.mouseScreenX=955;input.mouseScreenY=360;input.mouseWorldX=955;input.mouseWorldY=1800;
 updateTimeModeTimers(.35);updateTargetContourSelection();updatePrecisionXray();render();
 document.getElementById('spikeStatus').textContent='V3 deterministic capture — 75 / shadows ON';
 };
 window.shot=role=>{fireShell(role==='player'?game.player:game.boss,role==='player'?'player':'boss');game.shake=0;render();};
 window.advance=(ms,sim=ms)=>{window.v3Clock+=ms;game.time+=sim/1000;updateShells(sim/1000);render();};
});
for(const [role,prefix]of [['player','Player'],['boss','Boss']]){
 await p.evaluate(()=>fixture());await p.screenshot({path:path.join(out,role==='player'?'V3_A_Player_before_fire.png':'V3_D_Boss_before_fire.png')});
 await p.evaluate(role=>shot(role),role);await p.screenshot({path:path.join(out,role==='player'?'V3_B_Player_muzzle_light.png':'V3_E_Boss_muzzle_light.png')});
 await p.evaluate(()=>advance(100));await p.screenshot({path:path.join(out,role==='player'?'V3_C_Player_smoke_after.png':'V3_F_Boss_smoke_after.png')});
}
for(const [angle,file]of [[90,'V3_G_Boss_90_light'],[45,'V3_H_Boss_45_light']]){
 await p.evaluate(angle=>{fixture(angle);shot('boss');},angle);await p.screenshot({path:path.join(out,file+'.png')});
}
await p.evaluate(()=>{fixture(75,true);shot('boss');});await p.screenshot({path:path.join(out,'V3_I_Boss_focus_light.png')});
const result=await p.evaluate(async()=>{
 const c={},m=rendererSpike.muzzleLights;fixture();const playerLight=m.slots.player.light,bossLight=m.slots.boss.light;
 shot('player');c.player_on=m.slots.player.light.visible&&m.slots.player.light.intensity>0;c.only_player=!m.slots.boss.light.visible;
 const THREE=await import('./vendor/three.module.js');
 const node=rendererSpike.glb.player.getObjectByName('MUZZLE'),expected=node.getWorldPosition(new THREE.Vector3()).addScaledVector(new THREE.Vector3(1,0,0).transformDirection(node.matrixWorld),1.4);
 c.actual_muzzle=m.slots.player.light.position.distanceTo(expected)<1e-6;
 const peak=playerLight.intensity;advance(25);c.early_bright=playerLight.intensity>peak*.8;advance(45);c.nearly_off=playerLight.intensity<peak*.1;advance(20);c.off90=!playerLight.visible&&playerLight.intensity===0;
 shot('boss');advance(40);shot('boss');c.reuse_restart=bossLight===m.slots.boss.light&&bossLight.intensity===m.slots.boss.peak;
 game.boss.alive=false;render();c.death_off=!bossLight.visible;
 fixture();shot('player');resetGame();render();c.reset_off=!playerLight.visible;
 fixture();shot('boss');document.getElementById('spikeMode').click();c.canvas_off=!bossLight.visible;document.getElementById('spikeMode').click();render();c.return_clean=!bossLight.visible;
 fixture();game.timeMode='BULLET_TIME';game.bulletTime.remaining=2;shot('boss');advance(90,9);c.BT_real90_off=!bossLight.visible;
 fixture();shot('player');game.player.alive=false;render();c.player_death_off=!playerLight.visible;
 fixture();const count=m.slots.boss.pulses+m.slots.player.pulses;
 for(const a of game.rndActors.filter(a=>a.id!=='truck'))fireShell(a,'boss');
 c.no_general_enemy=m.slots.boss.pulses+m.slots.player.pulses===count;
 fixture(75,true);shot('boss');const state=JSON.stringify(game);render();c.readonly=state===JSON.stringify(game);
 c.focus_contour=rendererSpike.focusMaterial.state.targetId==='boss'&&rendererSpike.targetContour.state.targetId==='boss';
 c.no_light_shadows=!bossLight.castShadow&&!playerLight.castShadow;
 const n=rendererSpike.scene.children.filter(o=>o.isPointLight&&o.name.startsWith('V3_')).length;c.two_pooled=n===2;
 const serial={};for(const enabled of [false,true]){
 fixture();m.config.enabled=enabled;const trace=[];for(let i=0;i<600;i++){
 input.keys={w:i<120,shift:i>=200&&i<280};input.fire=i%90<20;
 if(i===300){game.timeMode='SKILL_TARGETING';confirmGeneralSkillTarget();}
 if(i===410){game.timeMode='BULLET_TIME';game.bulletTime.remaining=1;}
 window.v3Clock+=1000/60;rndStep(1/60);render();trace.push(JSON.stringify(game));}
 serial[enabled]=trace;
 }c.gameplay600_on_off=serial.false.every((s,i)=>s===serial.true[i]);
 m.config.enabled=true;return {checks:c,config:m.config,lights:{player:{range:playerLight.distance,peak:m.slots.player.peak},boss:{range:bossLight.distance,peak:m.slots.boss.peak}}};
});
result.errors=errors;result.pass=Object.values(result.checks).every(Boolean)&&!errors.length;
fs.writeFileSync(path.join(root,'Docs/muzzle_v3_validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
