"use strict";
// Three explicit R&D roles. Hitboxes/tuning are gameplay constants, never measured from render meshes.
function spawnRndActors(){
  var y=game.player.y;
  game.rndActors=[
    {id:"panzer",type:"lightTank",label:"PANZER III",x:600,y:y-165,angle:Math.PI,turretAngle:Math.PI,
      hp:3,maxHp:3,hitW:65,hitH:46,radius:34,collisionRadius:34,alive:true,state:"aim",timer:0,hitFlash:0,muzzlePivotX:1.68,muzzleReach:30.387},
    {id:"truck",type:"truck",label:"KUBELWAGEN",x:420,y:y+165,angle:0,turretAngle:0,
      hp:1,maxHp:1,hitW:49,hitH:28,radius:25,collisionRadius:25,alive:true,state:"drive",timer:0,hitFlash:0,
      waypoint:0,route:[{x:690,y:y+210},{x:410,y:y+210}]},
    {id:"pak",type:"antiTankGun",label:"PAK 40",x:830,y:y+165,angle:Math.PI,turretAngle:Math.PI,
      hp:2,maxHp:2,hitW:60,hitH:36,radius:32,collisionRadius:32,alive:true,state:"idle",timer:0,hitFlash:0,muzzlePivotX:-2.1,muzzleReach:44.38}
  ];
  // Avoid existing obstacles without changing Legacy obstacle generation or boss/player placement.
  game.rndActors.forEach(function(a){
    var baseY=a.y;
    for(var i=0;i<12&&game.obstacles.some(function(o){return !o.destroyed&&Math.hypot(a.x-o.x,a.y-o.y)<a.radius+o.radius+15;});i++){
      a.y=baseY+(i%2?1:-1)*(25+Math.floor(i/2)*25);
    }
  });
}
spawnRndActors();
function getRndGameplayMuzzle(tank){
  return {x:tank.x+Math.cos(tank.angle)*tank.muzzlePivotX+Math.cos(tank.turretAngle)*tank.muzzleReach,
    y:tank.y+Math.sin(tank.angle)*tank.muzzlePivotX+Math.sin(tank.turretAngle)*tank.muzzleReach};
}
function getShellHitWithRndActor(s,a){
  if(!a.alive)return null;
  var hit=segmentVsTankRect(s.prevX,s.prevY,s.x,s.y,a,{x:0,y:0,w:a.hitW,h:a.hitH});
  if(!hit)return null;
  hit.armor=a.type==="lightTank"?(hit.localNormalX>.5?50:hit.localNormalX<-.5?25:30):a.type==="antiTankGun"?12:6;
  hit.zone=a.label+" "+(hit.localNormalX>.5?"FRONT":hit.localNormalX<-.5?"REAR":"SIDE");hit.target=a;return hit;
}
function damageRndActor(a,amount){
  if(!a.alive)return;
  a.hp=Math.max(0,a.hp-amount);a.hitFlash=.2;
  if(a.hp===0){a.alive=false;a.state="destroyed";spawnExplosion(a.x,a.y,a.type==="lightTank"?30:20);addText(a.x,a.y-35,a.label+" DESTROYED","#ffd48d",1.3,16);}
}
var rndOldPenetration=applyPenetration;
applyPenetration=function(target,hit){
  if(game.rndActors.includes(target)){damageRndActor(target,1);return;}
  rndOldPenetration(target,hit);
};
function separateRndVehicles(a){
  [game.player,game.boss].concat(game.rndActors).forEach(function(b){
    if(a===b||!b.alive)return;
    var dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy),min=a.collisionRadius+b.collisionRadius;
    if(d<min){var n=d>1e-5?{x:dx/d,y:dy/d}:{x:0,y:1};a.x=b.x+n.x*min;a.y=b.y+n.y*min;}
  });
  resolveTankObstacleCollisions(a);
  a.x=clamp(a.x,a.radius,WORLD.width-a.radius);a.y=clamp(a.y,a.radius,WORLD.height-a.radius);
}
function updateRndActors(dt){
  if(game.state!=="playing")return;
  var p=game.player;
  game.rndActors.forEach(function(a){
    a.hitFlash=Math.max(0,a.hitFlash-dt);if(!a.alive)return;
    if(a.type==="truck"){
      var waypoint=a.route[a.waypoint],dx=waypoint.x-a.x,dy=waypoint.y-a.y;
      if(Math.hypot(dx,dy)<22){a.waypoint=(a.waypoint+1)%a.route.length;return;}
      a.angle=rotateToward(a.angle,Math.atan2(dy,dx),1.25*dt);
      a.x+=Math.cos(a.angle)*42*dt;a.y+=Math.sin(a.angle)*42*dt;
      a.turretAngle=a.angle;separateRndVehicles(a);return;
    }
    var distance=Math.hypot(p.x-a.x,p.y-a.y),aim=Math.atan2(p.y-a.y,p.x-a.x);
    if(a.type==="lightTank"){
      if(distance>320){
        a.angle=rotateToward(a.angle,aim,.75*dt);a.x+=Math.cos(a.angle)*28*dt;a.y+=Math.sin(a.angle)*28*dt;
        separateRndVehicles(a);
      }
    }
    a.turretAngle=rotateToward(a.turretAngle,aim,(a.type==="antiTankGun"?.85:1.1)*dt);
    if(a.state==="reload"){a.timer-=dt;if(a.timer<=0){a.state="idle";a.timer=0;}return;}
    var los=distance<850&&!getEarliestObstacleHit(a.x,a.y,p.x,p.y);
    if(!los){a.state="idle";a.timer=0;return;}
    if(a.state==="idle"){a.state="aim";a.timer=0;}
    if(a.state==="aim"){
      a.timer+=dt;
      if(a.timer>=.8&&Math.abs(angleDelta(a.turretAngle,aim))<.08){a.state="warning";a.timer=0;}
    }else if(a.state==="warning"){
      a.timer+=dt;
      if(a.timer>=.8){
        fireShell(a,"boss");game.rndShots[a.id]++;a.state="reload";a.timer=a.type==="antiTankGun"?3.2:3.8;
      }
    }
  });
  // Player-to-role contact uses only 2D circles. Pak HULL never moves.
  game.rndActors.forEach(function(a){
    if(!a.alive)return;var dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy),min=p.collisionRadius+a.collisionRadius;
    if(d<min){var n=d>1e-5?{x:dx/d,y:dy/d}:{x:0,y:1};p.x=a.x+n.x*min;p.y=a.y+n.y*min;p.currentForwardSpeed=0;}
  });
}
function drawRndActors(use3d){
  game.rndActors.forEach(function(a){
    if(!a.alive)return;
    var loaded=use3d&&rendererSpike.roleVisuals&&rendererSpike.roleVisuals.has(a.id);
    if(!loaded){
      ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.angle);
      ctx.fillStyle=a.type==="truck"?"#8a9678":a.type==="antiTankGun"?"#a28c61":"#9d966e";
      ctx.fillRect(-a.hitW/2,-a.hitH/2,a.hitW,a.hitH);ctx.strokeStyle="#ddd9ad";ctx.strokeRect(-a.hitW/2,-a.hitH/2,a.hitW,a.hitH);
      ctx.restore();
      if(a.type!=="truck"){ctx.strokeStyle="#c2baa0";ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(a.x,a.y);var muzzle=getRndGameplayMuzzle(a);ctx.lineTo(muzzle.x,muzzle.y);ctx.stroke();}
    }
    ctx.fillStyle="#e0dfc6";ctx.font="12px monospace";ctx.textAlign="center";ctx.fillText(a.label+" "+a.hp+"/"+a.maxHp,a.x,a.y-a.radius-16);
    if(a.state==="warning"){
      ctx.strokeStyle="#ffae63";ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+Math.cos(a.turretAngle)*850,a.y+Math.sin(a.turretAngle)*850);ctx.stroke();ctx.setLineDash([]);
    }
  });
}
