// G3 presentation only: fixed Tiger II top-down primitives sized from the G2 contract.
// No visual polygon is used by projectile, armor, collision, or weakpoint hit tests.
(function(){
  const HULL=[[-.5,-.31],[-.46,-.40],[-.25,-.43],[.27,-.43],[.43,-.36],[.5,-.24],[.5,.24],[.43,.36],[.27,.43],[-.25,.43],[-.46,.40],[-.5,.31]];
  const DECK=[[-.47,-.29],[-.16,-.32],[-.13,-.24],[-.13,.24],[-.16,.32],[-.47,.29]];
  const GLACIS=[[.29,-.37],[.43,-.36],[.5,-.24],[.5,.24],[.43,.36],[.29,.37]];
  const TURRET=[[-.5,-.27],[-.42,-.40],[-.08,-.5],[.26,-.46],[.43,-.35],[.5,-.21],[.5,.21],[.43,.35],[.26,.46],[-.08,.5],[-.42,.40],[-.5,.27]];
  function path(ctx,points,r){
    ctx.beginPath();
    for(let i=0;i<points.length;i++){
      const x=r.x+points[i][0]*r.w,y=r.y+points[i][1]*r.h;
      if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);
    }
    ctx.closePath();
  }
  function localRect(r){return {x:0,y:0,w:r.w,h:r.h};}
  function track(ctx,r,module){
    const x=r.x-r.w/2,y=r.y-r.h/2;
    ctx.fillStyle=module.destroyed?'#383633':'#424942';
    ctx.fillRect(x,y,r.w,r.h);
    ctx.strokeStyle=module.destroyed?'#925242':'#777e71';ctx.lineWidth=1.5;
    ctx.strokeRect(x+1,y+1,r.w-2,r.h-2);
    ctx.strokeStyle=module.destroyed?'#604339':'#29352d';ctx.lineWidth=2;
    ctx.beginPath();for(let i=1;i<12;i++){
      const px=x+r.w*i/12;ctx.moveTo(px,y+2);ctx.lineTo(px-2,y+r.h-2);
    }ctx.stroke();
    ctx.strokeStyle='#80877a';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x+5,r.y);ctx.lineTo(x+r.w-5,r.y);ctx.stroke();
    if(module.destroyed){
      ctx.strokeStyle='#e2724e';ctx.lineWidth=3;ctx.beginPath();
      ctx.moveTo(x+r.w*.3,y);ctx.lineTo(x+r.w*.48,y+r.h);ctx.lineTo(x+r.w*.6,y+3);ctx.stroke();
      ctx.fillStyle='#ffcc9c';ctx.font='bold 12px Arial';ctx.textAlign='center';
      ctx.fillText(module.repairRemaining.toFixed(1)+'s',r.x,r.y+4);
    }
  }
  function drawHull(ctx,b,sp){
    const h=sp.visualRects.hull,lt=sp.rects.leftTrack,rt=sp.rects.rightTrack;
    track(ctx,lt,b.leftTrack);track(ctx,rt,b.rightTrack);
    path(ctx,HULL,h);ctx.fillStyle=!b.alive?'#55574f':b.hitFlash>0?'#e5e2cd':'#adb2a6';ctx.fill();
    ctx.strokeStyle='#4b554c';ctx.lineWidth=2;ctx.stroke();
    path(ctx,DECK,h);ctx.fillStyle='#929b90';ctx.fill();ctx.strokeStyle='#59645a';ctx.lineWidth=1.4;ctx.stroke();
    // Rear engine deck: the G2 ENGINE interaction envelope stays underneath this drawing.
    const e=sp.rects.engine;
    ctx.fillStyle='#555e55';
    ctx.fillRect(e.x-e.w*.42,-h.h*.23,e.w*.8,h.h*.13);
    ctx.fillRect(e.x-e.w*.42,h.h*.10,e.w*.8,h.h*.13);
    ctx.strokeStyle='#303b34';ctx.lineWidth=1;
    for(let i=1;i<5;i++){
      const vx=e.x-e.w*.42+i*e.w*.8/5;
      ctx.beginPath();ctx.moveTo(vx,-h.h*.23);ctx.lineTo(vx,-h.h*.10);
      ctx.moveTo(vx,h.h*.10);ctx.lineTo(vx,h.h*.23);ctx.stroke();
    }
    path(ctx,GLACIS,h);ctx.fillStyle='#c5c9bb';ctx.fill();ctx.strokeStyle='#758073';ctx.stroke();
    // Side skirts sit just inside the G2 track bands, leaving both tracks legible.
    ctx.fillStyle='#bfc5b9';
    ctx.fillRect(h.x-h.w*.44,-h.h*.43,h.w*.76,h.h*.09);
    ctx.fillRect(h.x-h.w*.44,h.h*.34,h.w*.76,h.h*.09);
    ctx.strokeStyle='#657065';ctx.lineWidth=1.2;
    ctx.strokeRect(h.x-h.w*.44,-h.h*.43,h.w*.76,h.h*.09);
    ctx.strokeRect(h.x-h.w*.44,h.h*.34,h.w*.76,h.h*.09);
    // Sloped front seam and rear deck seam remain visual lines only.
    ctx.beginPath();ctx.moveTo(h.x+h.w*.29,-h.h*.36);ctx.lineTo(h.x+h.w*.29,h.h*.36);
    ctx.moveTo(h.x-h.w*.15,-h.h*.31);ctx.lineTo(h.x-h.w*.15,h.h*.31);ctx.stroke();
    if(b.rage){path(ctx,HULL,h);ctx.fillStyle='rgba(220,48,30,.28)';ctx.fill();}
  }
  function drawTurret(ctx,b,sp,anchors){
    const r=sp.rects.turret,g=sp.visualRects.gun;
    const barrelStart=g.x-r.x-g.w/2,barrelEnd=g.x-r.x+g.w/2;
    // A long visual barrel follows the turret; gameplay muzzle remains unchanged.
    ctx.fillStyle=b.alive?'#69746b':'#4b4d48';
    ctx.fillRect(barrelStart,-5.5,barrelEnd-barrelStart-7,11);
    ctx.fillStyle='#aeb5a9';ctx.fillRect(barrelStart+5,-3.8,barrelEnd-barrelStart-20,7.6);
    ctx.fillStyle='#58625b';ctx.fillRect(barrelEnd-12,-8,12,16);
    ctx.fillStyle='#313a34';ctx.fillRect(barrelEnd-10,-5,8,10);
    path(ctx,TURRET,localRect(r));
    ctx.fillStyle=!b.alive?'#55574f':b.hitFlash>0?'#e5e2cd':'#c2c7bb';ctx.fill();
    ctx.strokeStyle='#546057';ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle='#899589';ctx.lineWidth=1.4;
    ctx.beginPath();ctx.moveTo(-r.w*.36,-r.h*.27);ctx.lineTo(r.w*.24,-r.h*.34);
    ctx.moveTo(-r.w*.36,r.h*.27);ctx.lineTo(r.w*.24,r.h*.34);ctx.stroke();
    // G1/G2 semantic positions are used for visible fittings, not hit testing.
    const cup=anchors.cupola.gameplayAnchorLocal2D,slit=anchors.visionSlit.gameplayAnchorLocal2D,port=anchors.gunPort.gameplayAnchorLocal2D;
    ctx.fillStyle='#8d968b';ctx.strokeStyle='#4c584f';ctx.lineWidth=1.8;
    ctx.beginPath();ctx.arc(cup.x-r.x,cup.y-r.y,10,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#535d54';ctx.fillRect(slit.x-r.x-8,slit.y-r.y-2,16,4);
    ctx.fillStyle='#778479';ctx.beginPath();ctx.arc(port.x-r.x,port.y-r.y,9,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#747f75';ctx.beginPath();ctx.arc(-r.w*.24,r.h*.16,5,0,Math.PI*2);ctx.fill();
    if(b.rage){path(ctx,TURRET,localRect(r));ctx.fillStyle='rgba(228,42,29,.3)';ctx.fill();}
  }
  function presentationAnchor(b,name,sp){
    const a=sp.presentation[name];if(!a)return null;
    const x=a.x*sp.unitsPerMeter,y=a.z*sp.unitsPerMeter,c=Math.cos(b.angle),s=Math.sin(b.angle);
    return {x:b.x+x*c-y*s,y:b.y+x*s+y*c,angle:b.angle};
  }
  function outline(ctx,b,sp,offsetX,offsetY,component){
    const h=sp.visualRects.hull,lt=sp.rects.leftTrack,rt=sp.rects.rightTrack;
    ctx.save();ctx.strokeStyle='#ffe47f';ctx.lineWidth=2.2;ctx.setLineDash([]);
    if(['ALL','HULL','TRACKS','ENGINE_CORE'].includes(component)){
      ctx.save();ctx.translate(b.x+offsetX,b.y+offsetY);ctx.rotate(b.angle);
      if(component==='ALL'||component==='HULL'){path(ctx,HULL,h);ctx.stroke();}
      if(component==='ALL'||component==='TRACKS')for(const r of [lt,rt])ctx.strokeRect(r.x-r.w/2,r.y-r.h/2,r.w,r.h);
      if(component==='ENGINE_CORE'){path(ctx,DECK,h);ctx.stroke();}
      ctx.restore();
    }
    if(component==='ALL'||component==='TURRET'){
      const pose=sp.transform(b,'turret'),r=sp.rects.turret,g=sp.visualRects.gun;
      ctx.save();ctx.translate(pose.x+offsetX,pose.y+offsetY);ctx.rotate(pose.angle);
      path(ctx,TURRET,localRect(r));ctx.stroke();
      ctx.strokeRect(g.x-r.x-g.w/2,-5.5,g.w,11);
      ctx.restore();
    }
    ctx.restore();
  }
  window.tigerCanvas={HULL,DECK,GLACIS,TURRET,drawHull,drawTurret,presentationAnchor,outline};
})();