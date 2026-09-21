const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage();const errors=[];
p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>window.requestAnimationFrame=()=>0);
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
await p.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&rendererSpike.roleTemplates.size===5,{},{polling:100});
const checks=await p.evaluate(()=>{
const c={};function check(k,v){c[k]=!!v;}
resetGame();game.obstacles=[];
const boss=game.boss,name=getActiveWeakpointName(boss),hp=boss.hp;
applyPenetration(boss,{x:boss.x,y:boss.y,weakpointName:name,isActiveWeakpoint:true});
check('boss_trigger_engine',boss.weakpointState==='engineExposed');
applyPenetration(boss,{x:boss.x,y:boss.y,weakpointName:'engine',isActiveWeakpoint:true});
check('boss_engine_hp',boss.hp===hp-1);
for(const id of ['panzer','truck','pak']){
 resetGame();game.obstacles=[];game.boss.y=3000;game.player.turretAngle=0;
 const a=game.rndActors.find(a=>a.id===id);
 game.rndActors.filter(v=>v!==a).forEach(v=>v.y=2800);
 a.x=game.player.x+100;a.y=game.player.y;a.angle=Math.PI;
 const before=a.hp;fireShell(game.player,'player');updateShells(.15);
 check(id+'_AP_damage',a.hp===before-1);
 while(a.alive){fireShell(game.player,'player');updateShells(.15);}
 rendererSpike.render(0,0);check(id+'_death_removed',!rendererSpike.roleVisuals.has(id));
}
resetGame();game.obstacles=[];
fireShell({x:game.player.x+500,y:game.player.y,turretAngle:Math.PI},'boss');
updateThreatAssessment();check('threat_clear',!!game.bulletTime.primaryThreat);
game.obstacles=[{x:game.player.x+150,y:game.player.y,radius:35,destroyed:false,hp:4,type:'rock'}];
updateThreatAssessment();check('obstacle_blocks_threat',!game.bulletTime.primaryThreat);
resetGame();render();const a=game.rndActors[2];
fireShell(a,'boss');render();
const s=game.shells[0],bridge=rendererSpike.muzzleBridge.states.get(s);
check('first_enemy_bridge_after_restart',!!bridge&&rendererSpike.muzzleBridge.shells.get(s).position.distanceTo(bridge.start)<1e-7);
const before=JSON.stringify(game);rendererSpike.roleConfig.bossShape='lowwide';rendererSpike.render(0,0);
check('lowwide_isolated',JSON.stringify(game)===before);
const v=rendererSpike.roleVisuals.get('boss');
check('lowwide_local_basis',v.root.rotation.y===-game.boss.angle&&v.hull.rotation.y===0&&v.root.scale.y===14*1.2);
rendererSpike.roleConfig.bossShape='uniform';
resetGame();game.timeMode='SKILL_TARGETING';confirmGeneralSkillTarget();render();resetGame();render();
check('restart_Q_cleanup',rendererSpike.qVisuals.size===0);
check('no_focus_ammo_economy',!('rounds' in game.precisionAim));
return c;
});
const result={checks,errors,pass:Object.values(checks).every(Boolean)&&!errors.length};
fs.writeFileSync(path.resolve(__dirname,'../Docs/final_regression.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
