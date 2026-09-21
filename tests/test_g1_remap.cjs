const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..'),out=path.join(root,'Docs/g1');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),p=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});
await p.addInitScript(()=>requestAnimationFrame=()=>0);
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');await p.waitForFunction(()=>window.rndStartup?.state==='READY'||rndStartup.error,{}, {polling:100});await p.locator('#startupStart').click();
const result=await p.evaluate(()=>{
const checks={},rotations=[],shots=[],broad=[];
const cfg=tigerWeakpoints,angles=[0,45,90,135],originalRandom=Math.random;
function fixture(h=0,t=0){Math.random=()=>.5;resetGame();game.obstacles=[];game.rndActors=[];game.boss.x=650;game.boss.y=1800;game.boss.angle=h*Math.PI/180;game.boss.turretAngle=t*Math.PI/180;input.keys={};input.fire=false;game.shake=0;cfg.setPreset('TIGER_REMAP');cfg.debug='OFF';}
for(const hull of angles)for(const turret of angles){
fixture(hull,turret);rendererSpike.config.cameraElevation=90;render();
for(const name of Object.keys(cfg.descriptors)){
const item=rendererSpike.tigerAnchors.data[name],p=item.screen,g=item.gameplay,q={x:g.x-camera.x,y:g.y-camera.y},delta=Math.hypot(p.x-q.x,p.y-q.y);
rotations.push({hull,turret,name,delta,worldXZDelta:Math.hypot(item.world.x-g.x,item.world.z-g.y)});
const def=WEAKPOINT_DEFS[name],corners=[[-def.w/2,-def.h/2],[def.w/2,-def.h/2],[def.w/2,def.h/2],[-def.w/2,def.h/2]].map(([x,y])=>{const w=localToWorld(g,x,y);return worldToLocal(game.boss,w.x,w.y);});
const center=worldToLocal(game.boss,g.x,g.y);
broad.push({hull,turret,name,center,centerOutsideHull:Math.abs(center.x)>95||Math.abs(center.y)>56,shapeOutsideHull:corners.some(v=>Math.abs(v.x)>95||Math.abs(v.y)>56)});
}
}
checks.projection90=rotations.every(r=>r.delta<1e-6&&r.worldXZDelta<1e-6);
const originalHit=getShellHitWithBoss;let observed=null;
getShellHitWithBoss=function(s){const hit=originalHit(s);if(hit)observed={name:hit.weakpointName||null,zone:hit.zone,armor:hit.armor,module:!!hit.module};return hit;};
function shot(name,hull,turret,offset){
fixture(hull,turret);const boss=game.boss;boss.activeTriggerWeakpoint=name;boss.weakpointState=name==='engine'?'engineExposed':'triggerWeakpoint';boss.engineExposureTimer=2;
const def=WEAKPOINT_DEFS[name],t=getWeakpointTransform(boss,def),start=localToWorld(t,140,offset),angle=t.angle+Math.PI,m=TUNING.playerShellMuzzleDistance;
game.player.x=start.x-Math.cos(angle)*m;game.player.y=start.y-Math.sin(angle)*m;game.player.turretAngle=angle;
const hp=boss.hp;observed=null;fireShell(game.player,'player');
for(let i=0;i<180&&game.shells.length;i++)updateShells(1/240);
return {hull,turret,name,offset,hit:observed,state:boss.weakpointState,hpBefore:hp,hpAfter:boss.hp,phase:boss.phase,remaining:game.shells.length};
}
for(const hull of angles)for(const turret of angles)for(const name of Object.keys(cfg.descriptors)){
const h=WEAKPOINT_DEFS[name].h/2;
for(const [edge,offset]of [['center',0],['inside+',h-.25],['inside-',-h+.25],['outside+',h+.25],['outside-',-h-.25]]){
const row=shot(name,hull,turret,offset);row.edge=edge;row.pass=edge.startsWith('outside')?row.hit?.name!==name&&row.state==='triggerWeakpoint':row.hit?.name===name&&row.state==='engineExposed'&&row.hpBefore===row.hpAfter;shots.push(row);
}}
checks.shells=shots.every(s=>s.pass);
const engine=shot('engine',0,0,0);checks.engine=engine.hit?.name==='engine'&&engine.hpAfter===engine.hpBefore-1;
getShellHitWithBoss=originalHit;
checks.shapesAndArmor=JSON.stringify(WEAKPOINT_DEFS)===JSON.stringify(cfg.legacy);
fixture();cfg.setPreset('LEGACY');checks.legacyRestored=Object.keys(cfg.legacy).every(name=>JSON.stringify(getWeakpointTransform(game.boss,WEAKPOINT_DEFS[name]))===JSON.stringify(cfg.legacyTransform(game.boss,cfg.legacy[name])));
cfg.setPreset('TIGER_REMAP');const before=getWeakpointTransform(game.boss,WEAKPOINT_DEFS.gunPort);
rendererSpike.roleConfig.bossScale=1;rendererSpike.config.cameraElevation=45;render();checks.visualScaleNotAuthority=JSON.stringify(before)===JSON.stringify(getWeakpointTransform(game.boss,WEAKPOINT_DEFS.gunPort));checks.noncanonicalNotice=!rendererSpike.tigerAnchors.valid;
rendererSpike.roleConfig.bossScale=2;rendererSpike.config.cameraElevation=75;render();const snapshot=JSON.stringify(game);render();checks.renderReadOnly=JSON.stringify(game)===snapshot;
checks.offset75=Object.values(rendererSpike.tigerAnchors.data).every(v=>Math.abs((v.screen.y-(v.gameplay.y-camera.y))+v.world.y/Math.tan(75*Math.PI/180))<1e-6);
Math.random=originalRandom;
return {checks,rotations,broad,shots,engine,max90Delta:Math.max(...rotations.map(r=>r.delta)),failedShots:shots.filter(s=>!s.pass),descriptor:cfg.descriptors};
});
await p.evaluate(()=>{
window.g1fixture=(angle,preset,debug,labels,focus=false)=>{
let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};resetGame();game.boss.x=700;game.boss.y=1800;game.boss.angle=Math.PI;game.boss.turretAngle=Math.PI;game.shake=0;
input.keys={};input.fire=false;input.contourPointerInside=true;input.mouseScreenX=700;input.mouseScreenY=360;
tigerWeakpoints.setPreset(preset);tigerWeakpoints.debug=debug;tigerWeakpoints.labels3D=labels;game.boss.activeTriggerWeakpoint='cupola';rendererSpike.config.cameraElevation=angle;rendererSpike.roleConfig.bossScale=2;
updateTargetContourSelection();if(focus)game.precisionAim.charge=.35;render();document.getElementById('spikePanel').style.visibility='hidden';
};
});
for(const [name,angle,preset,debug,labels,focus]of [
['A_90_old_weakpoints',90,'LEGACY','LEGACY',false,false],
['B_90_3D_anchors',90,'TIGER_REMAP','3D',true,false],
['C_90_new_2D_anchors',90,'TIGER_REMAP','2D',false,false],
['D_90_overlay_compare',90,'TIGER_REMAP','OVERLAY',true,false],
['E_75_old_labels',75,'LEGACY','LEGACY',false,false],
['F_75_new_3D_anchor_labels',75,'TIGER_REMAP','3D',true,false],
['G_75_focus_target',75,'TIGER_REMAP','OFF',true,true],
['H_broadphase_mismatch',90,'TIGER_REMAP','BOUNDS',false,false]]){
await p.evaluate(args=>{g1fixture(...args);},[angle,preset,debug,labels,focus]);
if(name.startsWith('H'))await p.evaluate(()=>{game.boss.angle=0;game.boss.turretAngle=Math.PI/2;render();});
await p.screenshot({path:path.join(out,'G1_'+name+'.png')});
}
result.errors=errors;result.pass=Object.values(result.checks).every(Boolean)&&!errors.length;
fs.writeFileSync(path.join(root,'Docs/G1_validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({checks:result.checks,max90Delta:result.max90Delta,shots:result.shots.length,failed:result.failedShots.slice(0,12),broadOutside:result.broad.filter(v=>v.centerOutsideHull).length,errors,pass:result.pass}));await browser.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
