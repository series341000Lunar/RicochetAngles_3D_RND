"use strict";
// Minimal gameplay adaptation from 675a959. No stage, entitlement, ammo economy or Hero dependencies.
var RND_TUNING = { simulationScale:.1, movementScale:.2, turnScale:1, bulletSeconds:3,
  focusCharge:.35, focusDispersion:.5, threatHorizon:1.25, heRadius:95, qSeconds:.5 };
var rndActions = {space:false,q:false,cancel:false,confirm:false};
function initRndGameplay() {
  game.targetContourTargetId=null;
  game.timeMode="NORMAL"; game.realTime=0; game.nextProjectileId=1;
  game.bulletTime={primaryThreat:null,trackedProjectileId:null,outcome:"NONE",remaining:0,preview:null};
  game.precisionAim={charge:0,ready:false}; game.precisionXray={analysis:null};
  game.generalSkill={points:[],seed:1,targetingRemaining:0,nextBarrageId:1};
  game.playerArtillery=[]; game.friendlyBarrages=[]; game.qImpacts=[];
  game.rndActors=[]; game.rndShots={panzer:0,pak:0};
  input.fire=false; rndActions={space:false,q:false,cancel:false,confirm:false};
}
var rndLegacyReset=resetGame;
resetGame=function(){rndLegacyReset();initRndGameplay();if(typeof spawnRndActors==="function")spawnRndActors();};
initRndGameplay();
window.addEventListener("keydown",function(e){
  if(/INPUT|SELECT|BUTTON|TEXTAREA/.test(e.target.tagName))return;
  if(["Space","KeyQ","Escape","ShiftLeft","ShiftRight"].includes(e.code))e.preventDefault();
  if(e.repeat)return;
  if(e.code==="Space")rndActions.space=true;
  if(e.code==="KeyQ")rndActions.q=true;
  if(e.code==="Escape")rndActions.cancel=true;
},true);
canvas.addEventListener("mousedown",function(e){
  if(game.timeMode==="SKILL_TARGETING"){
    e.preventDefault();e.stopImmediatePropagation();input.fire=false;
    if(e.button===0)rndActions.confirm=true;
    if(e.button===2)rndActions.cancel=true;
  }
},true);
window.addEventListener("mouseup",function(){input.fire=false;});
window.addEventListener("blur",function(){rndActions={space:false,q:false,cancel:false,confirm:false};});

function rndPrediction(shell) {
  // Predict against the current 2D player motion; obstacles can invalidate the threat.
  // This is intentionally a single-motion R&D reduction of mainline's probabilistic samples.
  var elapsed=0, sx=shell.x, sy=shell.y, p=game.player;
  var ghost={x:p.x,y:p.y,angle:p.angle}, path=[{x:sx,y:sy}];
  var horizon=Math.min(RND_TUNING.threatHorizon,shell.life);
  while(elapsed<horizon){
    var dt=Math.min(1/60,horizon-elapsed), nx=sx+shell.vx*dt,ny=sy+shell.vy*dt;
    ghost.x+=p.actualVx*dt;ghost.y+=p.actualVy*dt;
    var hit=segmentVsTankRect(sx,sy,nx,ny,ghost,{x:0,y:0,w:66,h:46});
    var obstacle=getEarliestObstacleHit(sx,sy,nx,ny);
    var first=chooseEarliest([hit,obstacle]);
    if(first){
      path.push({x:first.x,y:first.y});
      if(first.obstacle)return null;
      var armor=first.localNormalX>.5?TUNING.playerFrontArmor:first.localNormalX<-.5?TUNING.playerRearArmor:TUNING.playerSideArmor;
      var info=calculatePenetration({velocityX:shell.vx,velocityY:shell.vy,normalX:first.nx,normalY:first.ny,
        armor:armor,basePenetration:shell.basePen,distance:shell.traveled+Math.hypot(shell.vx,shell.vy)*elapsed,
        penetrationLoss:shell.penLoss,ricochetAngle:TUNING.ricochetAngleDegrees});
      return {projectileId:shell.id,timeToImpact:elapsed+dt*first.t,path:path,hit:first,result:info.result};
    }
    sx=nx;sy=ny;elapsed+=dt;
  }
  return null;
}
function updateThreatAssessment(){
  var bt=game.bulletTime;
  if(bt.trackedProjectileId!==null){
    var tracked=game.shells.find(function(s){return s.id===bt.trackedProjectileId;});
    if(tracked&&!tracked.dead)bt.preview=rndPrediction(tracked);
    else finishRndTracked("EXPIRED");
  }
  bt.primaryThreat=null;
  if(game.timeMode!=="NORMAL"||game.state!=="playing"||bt.trackedProjectileId!==null)return;
  game.shells.forEach(function(s){
    if(s.dead||s.ownerFaction==="player"||s.weaponType!=="mainCannon"||s.usedForBulletTime)return;
    var prediction=rndPrediction(s);
    if(prediction&&prediction.timeToImpact>=.15&&(!bt.primaryThreat||prediction.timeToImpact<bt.primaryThreat.timeToImpact))bt.primaryThreat=prediction;
  });
}
function finishRndTracked(outcome){
  var bt=game.bulletTime;
  if(bt.trackedProjectileId===null)return;
  bt.outcome=outcome;bt.trackedProjectileId=null;bt.preview=null;
  if(game.timeMode==="BULLET_TIME")game.timeMode="NORMAL";
  bt.remaining=0;
}
function activateBulletTime(){
  var bt=game.bulletTime,threat=bt.primaryThreat;
  if(game.state!=="playing"||game.timeMode!=="NORMAL"||!threat)return false;
  var shell=game.shells.find(function(s){return s.id===threat.projectileId&&!s.dead;});
  if(!shell)return false;
  shell.usedForBulletTime=true;
  game.timeMode="BULLET_TIME";bt.trackedProjectileId=shell.id;bt.outcome="PENDING";
  bt.remaining=RND_TUNING.bulletSeconds;bt.preview=threat;bt.primaryThreat=null;return true;
}
function getFrameDts(realDt){
  var slow=game.timeMode==="BULLET_TIME";
  return {realDt:realDt,simDt:realDt*(slow?.1:1),playerMoveDt:realDt*(slow?.2:1),playerTurnDt:realDt};
}
function handleTimeModeInputs(){
  if(game.timeMode==="SKILL_TARGETING"){
    if(rndActions.cancel||rndActions.q)game.timeMode="NORMAL";
    else if(rndActions.confirm)confirmGeneralSkillTarget();
  }else if(game.state==="playing"){
    if(rndActions.space){
      if(game.timeMode==="BULLET_TIME"){game.timeMode="NORMAL";game.bulletTime.remaining=0;}
      else activateBulletTime();
    }
    if(rndActions.q&&game.timeMode==="NORMAL"){
      game.timeMode="SKILL_TARGETING";game.generalSkill.targetingRemaining=5;
      game.generalSkill.seed++;input.fire=false;updateRndTargetPoints();
    }
  }
  rndActions={space:false,q:false,cancel:false,confirm:false};
}
function updateRndTargetPoints(){
  var mouse=screenToWorld(input.mouseScreenX,input.mouseScreenY);
  game.generalSkill.points=generateGeneralSkillPoints(mouse,game.generalSkill.seed);
}
function updateTimeModeTimers(realDt){
  game.realTime+=realDt;
  if(game.timeMode==="BULLET_TIME"){
    game.bulletTime.remaining=Math.max(0,game.bulletTime.remaining-realDt);
    if(game.bulletTime.remaining<=0)game.timeMode="NORMAL";
  }
  if(game.timeMode==="SKILL_TARGETING"){
    updateRndTargetPoints();
    game.generalSkill.targetingRemaining-=realDt;
    if(game.generalSkill.targetingRemaining<=0)game.timeMode="NORMAL";
  }
  if(game.state!=="playing"){game.timeMode="NORMAL";finishRndTracked("COMBAT_ENDED");game.playerArtillery=[];game.friendlyBarrages=[];}
  var focus=game.precisionAim;
  if(input.keys.shift&&game.timeMode==="NORMAL"&&game.state==="playing")focus.charge=Math.min(.35,focus.charge+realDt);
  else focus.charge=0;
  focus.ready=focus.charge>=.35;
}
var rndOriginalDispersion=getPlayerDispersion;
getPlayerDispersion=function(p){
  var d=rndOriginalDispersion(p);
  if(game.precisionAim&&game.precisionAim.ready)d.total*=RND_TUNING.focusDispersion;
  return d;
};
function findPrecisionXrayTarget(){
  var mouse=screenToWorld(input.mouseScreenX,input.mouseScreenY);
  var candidates=[game.boss].concat(game.rndActors||[]), best=null,dist=Infinity;
  candidates.forEach(function(a){
    var d=Math.hypot(a.x-mouse.x,a.y-mouse.y);
    if(a.alive&&d<(a.boundingRadius||a.radius)+34&&d<dist){best=a;dist=d;}
  });
  return best;
}
function buildPrecisionXrayAnalysis(target){
  var p=game.player,a=p.turretAngle,m=TUNING.playerShellMuzzleDistance;
  var distance=Math.max(460,Math.hypot(target.x-p.x,target.y-p.y)+160);
  var s={prevX:p.x+Math.cos(a)*m,prevY:p.y+Math.sin(a)*m,x:p.x+Math.cos(a)*distance,y:p.y+Math.sin(a)*distance,
    vx:Math.cos(a)*TUNING.playerShellSpeed,vy:Math.sin(a)*TUNING.playerShellSpeed};
  var hit=target===game.boss?getShellHitWithBoss(s):getShellHitWithRndActor(s,target);
  var obstacle=getEarliestObstacleHit(s.prevX,s.prevY,s.x,s.y);
  var otherHits=game.rndActors.filter(function(a){return a!==target;}).map(function(a){return getShellHitWithRndActor(s,a);});
  if(target!==game.boss&&game.boss.alive)otherHits.push(getShellHitWithBoss(s));
  var first=chooseEarliest([hit,obstacle].concat(otherHits));
  var info=hit?calculatePenetration({velocityX:s.vx,velocityY:s.vy,normalX:hit.nx,normalY:hit.ny,armor:hit.armor,
    basePenetration:TUNING.playerShellPenetration,distance:Math.hypot(hit.x-s.prevX,hit.y-s.prevY),
    penetrationLoss:TUNING.playerShellPenetrationLoss,ricochetAngle:TUNING.ricochetAngleDegrees}):null;
  var hull=target===game.boss&&window.tigerSpatial?.active()?tigerSpatial.transform(target,"hull"):null;
  return {targetId:target.id||"boss",name:target.label||"TIGER / LEGACY BOSS",x:hull?hull.x:target.x,y:hull?hull.y:target.y,angle:target.angle,
    w:hull?hull.w:(target.hitW||190),h:hull?hull.h:(target.hitH||112),hit:hit?{x:hit.x,y:hit.y,zone:hit.zone}:null,
    armor:info?info.armor:null,effectiveArmor:info?info.effectiveArmor:null,
    result:first&&first.obstacle?"OBSTACLE BLOCKED":first&&first.target!==target?"OTHER ACTOR BLOCKED":info?info.result:"NO PLATE INTERSECTION",
    weakpoint:target===game.boss?WEAKPOINT_DEFS[getActiveWeakpointName(target)].label:"Hull armor / no special weakpoint"};
}
function updatePrecisionXray(){
  var target=game.precisionAim.ready?findPrecisionXrayTarget():null;
  game.precisionXray.analysis=target?buildPrecisionXrayAnalysis(target):null;
}
function generateGeneralSkillPoints(center,seed){
  // Exact six-point deterministic sampling algorithm from reference combat.js.
  var points=[],margin=RND_TUNING.heRadius+18;
  function noise(index){return seededNoise(seed*97+index*131+17);}
  function valid(point){return points.every(function(p){return Math.hypot(point.x-p.x,point.y-p.y)>=32;});}
  for(var shot=0;shot<6;shot++){
    var accepted=null;
    for(var attempt=0;attempt<240&&!accepted;attempt++){
      var index=shot*240+attempt,angle=noise(index*2)*TAU,radius=Math.pow(noise(index*2+1),1.6)*150;
      var point={x:clamp(center.x+Math.cos(angle)*radius,margin,WORLD.width-margin),
        y:clamp(center.y+Math.sin(angle)*radius,margin,WORLD.height-margin)};
      if(valid(point))accepted=point;
    }
    points.push(accepted||{x:clamp(center.x,margin,WORLD.width-margin),y:clamp(center.y,margin,WORLD.height-margin)});
  }return points;
}
function confirmGeneralSkillTarget(){
  if(game.timeMode!=="SKILL_TARGETING"||game.state!=="playing")return false;
  updateRndTargetPoints();
  var barrage={id:game.generalSkill.nextBarrageId++,bossTriggerApplied:false,activeShellCount:6};
  game.friendlyBarrages.push(barrage);
  game.generalSkill.points.forEach(function(p,i){
    game.playerArtillery.push({x:p.x,y:p.y,remaining:.5,total:.5,barrageId:barrage.id,pointIndex:i});
  });
  game.timeMode="NORMAL";input.fire=false;return true;
}
function rndCircleRect(x,y,r,t,rect){
  var q=worldToLocal(t,x,y),cx=clamp(q.x,rect.x-rect.w/2,rect.x+rect.w/2),cy=clamp(q.y,rect.y-rect.h/2,rect.y+rect.h/2);
  return Math.hypot(q.x-cx,q.y-cy)<=r;
}
function detonateRndHE(marker,barrage){
  // Gameplay resolver only. Six independent blasts, no normal-target barrage deduplication.
  var x=marker.x,y=marker.y,r=RND_TUNING.heRadius,b=game.boss;
  spawnExplosion(x,y,45);game.shake=Math.max(game.shake,4);
  game.qImpacts.push({x:x,y:y,time:game.time,barrageId:marker.barrageId,pointIndex:marker.pointIndex});
  if(game.qImpacts.length>120)game.qImpacts.shift();
  (game.rndActors||[]).forEach(function(a){
    if(a.alive&&rndCircleRect(x,y,r,a,{x:0,y:0,w:a.hitW,h:a.hitH}))damageRndActor(a,a.type==="antiTankGun"?2:a.maxHp);
  });
  game.obstacles.forEach(function(o){
    if(!o.destroyed&&Math.hypot(x-o.x,y-o.y)<=r+o.radius){o.hp=Math.max(0,o.hp-2);if(!o.hp){o.destroyed=true;spawnObstacleDestruction(o);}}
  });
  if(b.alive){
    [b.leftTrack,b.rightTrack].forEach(function(track,i){
      var trackName=i?'rightTrack':'leftTrack',sync=window.tigerSpatial?.active();
      var trackTransform=sync?tigerSpatial.transform(b,trackName):b;
      var trackRect=sync?{x:0,y:0,w:trackTransform.w,h:trackTransform.h}:{x:0,y:i?70:-70,w:174,h:25};
      if(!track.destroyed&&rndCircleRect(x,y,r,trackTransform,trackRect)){
        track.hp=0;track.destroyed=true;track.repairRemaining=b.rage?TUNING.rageTrackRepairSeconds:TUNING.normalTrackRepairSeconds;
      }
    });
    var name=getActiveWeakpointName(b),def=WEAKPOINT_DEFS[name],t=getWeakpointTransform(b,def);
    if(b.weakpointState==="triggerWeakpoint"&&!barrage.bossTriggerApplied&&rndCircleRect(x,y,r,t,{x:0,y:0,...getWeakpointShape(def)})){
      exposeEngineWeakpoint();barrage.bossTriggerApplied=true;
    }
    // Mainline Q policy: may expose engine, never directly damage Boss HP.
  }
}
function updatePlayerArtillery(dt){
  if(game.state!=="playing")return;
  for(var i=game.playerArtillery.length-1;i>=0;i--){
    var m=game.playerArtillery[i];m.remaining-=dt;
    if(m.remaining>1e-9)continue;
    var barrage=game.friendlyBarrages.find(function(b){return b.id===m.barrageId;});
    game.playerArtillery.splice(i,1);detonateRndHE(m,barrage);barrage.activeShellCount--;
  }
  game.friendlyBarrages=game.friendlyBarrages.filter(function(b){return b.activeShellCount>0;});
}
var rndArmorResolver=resolveArmorHit;
resolveArmorHit=function(shell,hit,target){
  rndArmorResolver(shell,hit,target);
  if(shell.id===game.bulletTime.trackedProjectileId)finishRndTracked(game.lastHit.result);
};
var rndObstacleResolver=resolveObstacleShellHit;
resolveObstacleShellHit=function(shell,hit){
  rndObstacleResolver(shell,hit);
  if(shell.id===game.bulletTime.trackedProjectileId)finishRndTracked("BLOCKED_BY_OBSTACLE");
};
function drawRndWorld(use3d){
  ctx.save();
  var bt=game.bulletTime,preview=bt.preview||bt.primaryThreat;
  if(preview){
    ctx.strokeStyle="#72efff";ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.beginPath();
    preview.path.forEach(function(p,i){if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.stroke();ctx.setLineDash([]);
  }
  if(game.precisionAim.charge>0){
    var p=game.player,a=p.turretAngle;
    ctx.strokeStyle=game.precisionAim.ready?"#8affca":"#9caea7";ctx.setLineDash([10,5]);ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(p.x+Math.cos(a)*43,p.y+Math.sin(a)*43);ctx.lineTo(p.x+Math.cos(a)*1000,p.y+Math.sin(a)*1000);ctx.stroke();ctx.setLineDash([]);
    var analysis=game.precisionXray.analysis;
    if(analysis){
      // Bounds/analysis box is optional debug presentation; keep the hit marker below.
      if(document.getElementById('roleDebug')?.checked){ctx.save();ctx.translate(analysis.x,analysis.y);ctx.rotate(analysis.angle);
      ctx.fillStyle="rgba(71,255,176,.12)";ctx.fillRect(-analysis.w/2,-analysis.h/2,analysis.w,analysis.h);
      ctx.strokeStyle="#7bffc3";ctx.lineWidth=2;ctx.strokeRect(-analysis.w/2,-analysis.h/2,analysis.w,analysis.h);ctx.restore();}
      if(analysis.hit){ctx.fillStyle="#fff29a";ctx.beginPath();ctx.arc(analysis.hit.x,analysis.hit.y,5,0,TAU);ctx.fill();}
    }
  }
  var points=game.timeMode==="SKILL_TARGETING"?game.generalSkill.points:game.playerArtillery;
  points.forEach(function(p,i){
    ctx.strokeStyle="#93e9ff";ctx.fillStyle="rgba(43,173,235,.09)";ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(p.x,p.y,32,0,TAU);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(p.x-8,p.y);ctx.lineTo(p.x+8,p.y);ctx.moveTo(p.x,p.y-8);ctx.lineTo(p.x,p.y+8);ctx.stroke();
    ctx.font="12px monospace";ctx.fillStyle="#b8f2ff";ctx.fillText(p.remaining===undefined?String(i+1):p.remaining.toFixed(2),p.x+12,p.y-12);
  });
  if(typeof drawRndActors==="function")drawRndActors(use3d);
  ctx.restore();
}
function drawRndHUD(){
  ctx.save();ctx.textAlign="left";ctx.font="14px monospace";ctx.fillStyle="rgba(8,16,20,.85)";ctx.fillRect(20,142,348,91);
  ctx.fillStyle="#b1eaff";ctx.fillText("SPACE: "+(game.timeMode==="BULLET_TIME"?"BULLET TIME "+game.bulletTime.remaining.toFixed(1)+"s":game.bulletTime.primaryThreat?"THREAT READY":"incoming threat required"),30,162);
  ctx.fillStyle="#a3ffd0";ctx.fillText("SHIFT: "+(game.precisionAim.ready?"FOCUS READY":Math.round(game.precisionAim.charge/.35*100)+"%")+" | no ammo cost",30,183);
  ctx.fillStyle="#b1eaff";ctx.fillText("Q: "+(game.timeMode==="SKILL_TARGETING"?"LMB confirm / Q RMB Esc cancel":"6 HE / unlimited R&D"),30,204);
  ctx.fillStyle="#b6bcb5";ctx.fillText("Tracked outcome: "+game.bulletTime.outcome,30,224);
  var a=game.precisionXray.analysis;
  if(a){ctx.fillStyle="rgba(9,27,23,.92)";ctx.fillRect(20,245,360,110);ctx.fillStyle="#a3ffd0";
    [a.name,a.weakpoint,"Plate: "+(a.hit?a.hit.zone:"-"),
      "Armor "+(a.armor===null?"-":a.armor)+" / effective "+(a.effectiveArmor===null?"-":a.effectiveArmor.toFixed(1)),
      a.result].forEach(function(t,i){ctx.fillText(t,30,264+i*20);});
  }
  ctx.restore();
}
function rndStep(realDt){
  var mouse=screenToWorld(input.mouseScreenX,input.mouseScreenY);input.mouseWorldX=mouse.x;input.mouseWorldY=mouse.y;
  updateThreatAssessment();handleTimeModeInputs();var d=getFrameDts(realDt);
  updateTimeModeTimers(realDt);game.time+=d.simDt;
  game.weakpointEventThisFrame=null;game.artilleryFiredThisFrame=false;game.smokeStartedThisFrame=false;
  updateCamera(realDt);updatePlayer(d.simDt,d.playerMoveDt,d.playerTurnDt);
  updateSmokeDefense(d.simDt);updateBoss(d.simDt);
  if(typeof updateRndActors==="function")updateRndActors(d.simDt);
  updateShells(d.simDt);finalizeWeakpointRotation();updateMachineGun(d.simDt);
  updateLongRangeArtilleryMode();updateBossOffscreen(d.simDt);updateArtillery(d.simDt);updatePlayerArtillery(d.simDt);
  updateEffects(d.simDt);updatePrecisionXray();updateThreatAssessment();updateTargetContourSelection();
  return d;
}

// V1 selection is owned by gameplay. No Three.js mesh/raycast participates.
function updateTargetContourSelection(){
  game.targetContourTargetId=null;
  if(!input.contourPointerInside||game.state!=="playing"||!game.player.alive||game.timeMode==="SKILL_TARGETING")return;
  var point=screenToWorld(input.mouseScreenX,input.mouseScreenY),best=null,bestDistance=Infinity;
  [game.boss].concat(game.rndActors).forEach(function(a){
    if(!a.alive)return;
    var q=worldToLocal(a,point.x,point.y),inside;
    if(a===game.boss){
      inside=window.tigerSpatial?.active()?tigerSpatial.hitTestPoint(a,point.x,point.y):
        (Math.abs(q.x)<=95&&Math.abs(q.y)<=56)||
        (Math.abs(q.x)<=87&&(Math.abs(q.y-70)<=12.5||Math.abs(q.y+70)<=12.5));
    }else inside=Math.abs(q.x)<=a.hitW/2&&Math.abs(q.y)<=a.hitH/2;
    var distance=Math.hypot(q.x,q.y);
    if(inside&&distance<bestDistance){best=a;bestDistance=distance;}
  });
  game.targetContourTargetId=best?(best===game.boss?"boss":best.id):null;
}
input.contourPointerInside=false;
canvas.addEventListener("mouseenter",function(){input.contourPointerInside=true;});
canvas.addEventListener("mousemove",function(){input.contourPointerInside=true;});
canvas.addEventListener("mouseleave",function(){input.contourPointerInside=false;});
window.addEventListener("blur",function(){input.contourPointerInside=false;});
