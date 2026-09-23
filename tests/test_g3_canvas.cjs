const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'Docs/g3_canvas');fs.mkdirSync(out,{recursive:true});
const url='http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html';
const baseline=JSON.parse(fs.readFileSync(path.join(root,'Docs/g2_spatial/validation.json'),'utf8'));
function hash(v){return crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');}
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  async function open(before=false){
    const p=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
    const errors=[];p.on('pageerror',e=>errors.push(e.message));
    p.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});
    if(before)await p.route('**/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.before_g3_canvas.html'))}));
    await p.goto(url);await p.waitForFunction(()=>window.rndStartup?.state==='READY'||window.rndStartup?.error,null,{timeout:60000});
    await p.locator('#startupStart').click();return {p,errors};
  }
  async function trace(before,visualOn){
    const {p,errors}=await open(before);
    const data=await p.evaluate(on=>{
      let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      resetGame();tigerWeakpoints.setPreset('TIGER_SPATIAL');rendererSpike.enabled=false;
      document.getElementById('world3d').style.visibility='hidden';
      const toggle=document.getElementById('g3CanvasVisual');if(toggle)toggle.checked=on;
      const frames=[],flags={focus:false,bulletTime:false,bossFire:false,restart:false,toggleCount:0,renderReadOnly:true};
      for(let i=0;i<240;i++){
        if([40,80,120,160].includes(i)){document.getElementById('spikeMode').click();flags.toggleCount++;}
        if(i===105){game.timeMode='BULLET_TIME';game.bulletTime.remaining=1;flags.bulletTime=true;}
        if(i===140){fireShell(game.boss,'boss');flags.bossFire=true;}
        if(i===200){window.dispatchEvent(new KeyboardEvent('keydown',{key:'r'}));window.dispatchEvent(new KeyboardEvent('keyup',{key:'r'}));flags.restart=game.time===0;}
        input.keys={w:i<25,shift:i>=12&&i<57};input.fire=i%65<10;
        input.contourPointerInside=true;input.mouseScreenX=game.boss.x-camera.x;input.mouseScreenY=game.boss.y-camera.y;
        input.mouseWorldX=game.boss.x;input.mouseWorldY=game.boss.y;
        rndStep(1/60);flags.focus ||= !!game.precisionAim.ready;
        if(i%16===0){const state=JSON.stringify(game);render();flags.renderReadOnly&&=JSON.stringify(game)===state;}
        frames.push(JSON.stringify(game));
      }
      return {frames,flags,last:{hp:game.boss.hp,collisionRadius:game.boss.collisionRadius,state:game.state}};
    },visualOn);
    await p.close();return {...data,errors};
  }
  const oldTrace=await trace(true,false),offTrace=await trace(false,false),onTrace=await trace(false,true);
  const {p,errors}=await open(false);
  const checks={},details=await p.evaluate(g2=>{
    const sp=tigerSpatial,cv=tigerCanvas,b=game.boss,near=(a,c,e=1e-6)=>Math.abs(a-c)<=e;
    const bounds=pts=>({minX:Math.min(...pts.map(v=>v[0])),maxX:Math.max(...pts.map(v=>v[0])),minY:Math.min(...pts.map(v=>v[1])),maxY:Math.max(...pts.map(v=>v[1]))});
    const hb=bounds(cv.HULL),tb=bounds(cv.TURRET),h=sp.visualRects.hull,t=sp.rects.turret,lt=sp.rects.leftTrack,rt=sp.rects.rightTrack,g=sp.visualRects.gun;
    const c={};
    c.moduleLoaded=!!cv&&document.getElementById('g3CanvasVisual').checked;
    c.g2ProxyUnchanged=JSON.stringify(sp.rects)===JSON.stringify(g2.rects)&&JSON.stringify(sp.visualRects)===JSON.stringify(g2.visualRects);
    c.hullExtent=near((hb.maxX-hb.minX)*h.w,h.w)&&Math.abs((hb.maxY-hb.minY)*h.h-sp.rects.hull.h)<11;
    c.tracksUseG2Bands=near(lt.y,-rt.y)&&near(lt.w,rt.w)&&lt.y+lt.h/2<0&&rt.y-rt.h/2>0;
    c.turretExtent=near((tb.maxX-tb.minX)*t.w,t.w)&&near((tb.maxY-tb.minY)*t.h,t.h);
    c.gunLength=near(g.w,sp.visualRects.gun.w)&&g.w>100;
    const eng=cv.presentationAnchor(b,'engine',sp),core=cv.presentationAnchor(b,'core',sp),hr=sp.transform(b,'hull');
    c.engineCoreDeck=[eng,core].every(v=>Math.abs(v.x-hr.x)<hr.w/2&&Math.abs(v.y-hr.y)<h.h*.29);
    c.enginePresentationSeparate=Math.hypot(eng.x-sp.transform(b,'engine').x,eng.y-sp.transform(b,'engine').y)>1;
    c.coreReferenceOnly=!WEAKPOINT_DEFS.core&&!WEAKPOINT_NAMES.includes('core');
    c.vehicleCollisionUnchanged=b.collisionRadius===105;
    // At 90 degrees, the two presentation paths share the same authored semantic points.
    b.x=700;b.y=1800;b.angle=Math.PI;b.turretAngle=Math.PI;
    camera.x=b.x-W/2;camera.y=b.y-H/2;rendererSpike.config.cameraElevation=90;rendererSpike.enabled=true;render();
    const engine3D=rendererSpike.projectSpatialAnchor('engine'),engine2D=cv.presentationAnchor(b,'engine',sp);
    c.threeCanvasEngineAnchor90=!!engine3D&&near(engine3D.x,engine2D.x-camera.x,1e-3)&&near(engine3D.y,engine2D.y-camera.y,1e-3);
    c.threeCanvasWeakpoints90=['gunPort','visionSlit','cupola'].every(name=>{
      const projected=rendererSpike.tigerAnchors.project(name),gameplay=getWeakpointTransform(b,WEAKPOINT_DEFS[name]);
      return projected&&near(projected.x,gameplay.x-camera.x,1e-3)&&near(projected.y,gameplay.y-camera.y,1e-3);
    });
    rendererSpike.config.cameraElevation=75;render();const engine75=rendererSpike.projectSpatialAnchor('engine');
    c.threePresentation75=!!engine75&&Number.isFinite(engine75.x)&&Number.isFinite(engine75.y)&&engine75.y<engine3D.y;
    rendererSpike.config.cameraElevation=90;
    // Inspect the live Canvas transform at the module entry point for several independent hull/turret angles.
    rendererSpike.enabled=false;tigerWeakpoints.setPreset('TIGER_SPATIAL');
    document.getElementById('g3CanvasVisual').checked=true;
    game.obstacles=[];game.rndActors=[];b.x=700;b.y=1800;camera.x=b.x-W/2;camera.y=b.y-H/2;
    const matrices=[],matrixDiagnostics=[],original=cv.drawTurret;
    cv.drawTurret=function(context,...args){const m=context.getTransform();matrices.push({e:m.e,f:m.f,angle:Math.atan2(m.b,m.a)});return original(context,...args);};
    for(const [a,z] of [[0,0],[Math.PI/2,0],[Math.PI/2,Math.PI],[Math.PI,Math.PI/4]]){
      b.angle=a;b.turretAngle=z;render();const m=matrices.at(-1),pose=sp.transform(b,'turret');
      matrixDiagnostics.push({hull:a,turret:z,m,pose,expectedX:pose.x-camera.x,expectedY:pose.y-camera.y});
      if(!m||!near(m.e,pose.x-camera.x,1e-3)||!near(m.f,pose.y-camera.y,1e-3)||!near(Math.sin(m.angle),Math.sin(pose.angle)))c.turretTransform=false;
    }cv.drawTurret=original;if(c.turretTransform!==false)c.turretTransform=matrices.length===4;
    b.angle=Math.PI;b.turretAngle=Math.PI;b.weakpointState='engineExposed';b.activeTriggerWeakpoint=null;
    const labels=[],fill=ctx.fillText;ctx.fillText=function(text,x,y,...rest){if(text==='ENGINE')labels.push({x,y});return fill.call(this,text,x,y,...rest);};render();ctx.fillText=fill;
    const anchor=cv.presentationAnchor(b,'engine',sp);
    c.engineLabelOnDeck=labels.length>0&&near(labels[0].x,anchor.x)&&near(labels[0].y,anchor.y-sp.rects.engine.h/2-7);
    const bc=document.createElement('canvas');bc.width=500;bc.height=300;const c2=bc.getContext('2d');
    const n=1000,start=performance.now();for(let i=0;i<n;i++){c2.save();c2.translate(200,150);cv.drawHull(c2,b,sp);cv.drawTurret(c2,b,sp,tigerWeakpoints.descriptors);c2.restore();}const millis=performance.now()-start;
    return {checks:c,diagnostics:{matrixDiagnostics,labels,engineExpected:{x:anchor.x,y:anchor.y-sp.rects.engine.h/2-7}},geometry:{hullNormalized:hb,turretNormalized:tb,hullVisual:h,tracks:[lt,rt],turret:t,gun:g,enginePresentation:eng,corePresentation:core},performance:{iterations:n,milliseconds:millis,msPerBoss:millis/n}};
  },{rects:baseline.measurements.rects,visualRects:baseline.measurements.visualRects});
  Object.assign(checks,details.checks);
  checks.traceOnOff=onTrace.frames.every((v,i)=>v===offTrace.frames[i]);
  checks.traceG2Baseline=onTrace.frames.every((v,i)=>v===oldTrace.frames[i]);
  checks.renderReadOnly=[onTrace,offTrace,oldTrace].every(x=>x.flags.renderReadOnly);
  checks.focusBulletBossRestart=[onTrace,offTrace,oldTrace].every(x=>x.flags.focus&&x.flags.bulletTime&&x.flags.bossFire&&x.flags.restart&&x.flags.toggleCount===4);
  checks.threeCanvasToggle=onTrace.flags.toggleCount===4;
  checks.noPageErrors=[...errors,...onTrace.errors,...offTrace.errors,...oldTrace.errors].length===0;
  const hits=await p.evaluate(()=>{
    const shots=[];Math.random=()=>.5;resetGame();game.obstacles=[];game.rndActors=[];
    Object.assign(game.boss,{x:700,y:1800,angle:0,turretAngle:0,activeTriggerWeakpoint:'cupola',weakpointState:'triggerWeakpoint'});
    function sample(name,a,z){const b=game.boss,u=localToWorld(b,...a),v=localToWorld(b,...z),hit=getShellHitWithBoss({prevX:u.x,prevY:u.y,x:v.x,y:v.y,vx:v.x-u.x,vy:v.y-u.y});shots.push({name,zone:hit?.zone||null,armor:hit?.armor||null,module:hit?.module===b.leftTrack?'leftTrack':hit?.module===b.rightTrack?'rightTrack':null});}
    sample('front',[190,20],[0,20]);sample('side',[35,120],[35,0]);sample('rear',[-190,25],[0,25]);sample('leftTrack',[0,-110],[0,0]);sample('rightTrack',[0,110],[0,0]);
    const b=game.boss;b.weakpointState='engineExposed';b.activeTriggerWeakpoint=null;b.engineExposureTimer=2;
    const t=getWeakpointTransform(b,WEAKPOINT_DEFS.engine),start=localToWorld(t,140,0),a=t.angle+Math.PI,m=TUNING.playerShellMuzzleDistance;
    game.player.x=start.x-Math.cos(a)*m;game.player.y=start.y-Math.sin(a)*m;game.player.turretAngle=a;
    const hp=b.hp;fireShell(game.player,'player');for(let i=0;i<180&&game.shells.length;i++)updateShells(1/240);
    return {shots,hpBefore:hp,hpAfter:b.hp,collisionRadius:b.collisionRadius};
  });
  checks.g2HitResults=hits.shots.every((v,i)=>v.zone===baseline.measurements.samples[i].zone&&v.armor===baseline.measurements.samples[i].armor&&v.module===baseline.measurements.samples[i].module);
  checks.engineDamage=hits.hpBefore===10&&hits.hpAfter===9;
  async function capture(name,s){
    const state=await p.evaluate(o=>{
      for(const id of ['world3d','game']){const el=document.getElementById(id);el.style.width='100vw';el.style.height='100vh';el.style.left='0';el.style.top='0';}
      let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      resetGame();game.obstacles=[];game.rndActors=[];game.boss.x=700;game.boss.y=1800;game.boss.angle=o.heading;game.boss.turretAngle=o.turret;
      game.boss.state='aim';game.boss.activeTriggerWeakpoint=o.active||'visionSlit';game.boss.weakpointState=o.active==='engine'?'engineExposed':'triggerWeakpoint';game.boss.engineExposureTimer=2;
      game.player.x=460;game.player.y=1950;game.shake=0;game.timeMode='NORMAL';input.keys={};input.fire=false;
      camera.x=game.boss.x-W/2;camera.y=game.boss.y-H/2;rendererSpike.enabled=o.three;document.getElementById('world3d').style.visibility=o.three?'visible':'hidden';
      rendererSpike.config.cameraElevation=o.elevation||90;rendererSpike.roleConfig.bossAsset='tiger2';rendererSpike.roleConfig.bossScale=2;rendererSpike.roleConfig.bossShape='uniform';
      tigerWeakpoints.setPreset('TIGER_SPATIAL');tigerWeakpoints.labels3D=true;
      document.getElementById('spikePanel').style.visibility='hidden';document.getElementById('g3CanvasVisual').checked=o.canvasOn!==false;
      document.getElementById('spatialComponent').value=o.component||'ALL';document.getElementById('spatialLabels').checked=!!o.labels;
      for(const [id,key] of [['spatialOld','old'],['spatialNew','fresh'],['spatialVisual','visual'],['spatialCanvasVisual','canvasOutline'],['spatialCollision','collision'],['spatialAnchors','anchors']])document.getElementById(id).checked=!!o[key];
      render();const z=o.zoom||2.35;for(const id of ['world3d','game']){const el=document.getElementById(id);el.style.width=W*z+'px';el.style.height=H*z+'px';el.style.left=-W*(z-1)/2+'px';el.style.top=-H*(z-1)/2+'px';}
      return {three:o.three,heading:o.heading,active:o.active||'visionSlit',engine:tigerCanvas.presentationAnchor(game.boss,'engine',tigerSpatial)};
    },s);
    await p.screenshot({path:path.join(out,name+'.png'),animations:'disabled'});return {file:name+'.png',...state};
  }
  await p.evaluate(()=>{rndStep=()=>{};}); // freeze camera/gameplay while producing matched visual comparisons
  const back={heading:Math.PI,turret:Math.PI};
  const previews=[];
  previews.push(await capture('00_G2_Canvas_before',{...back,three:false,canvasOn:false}));
  previews.push(await capture('G3_A_90_Three',{...back,three:true}));
  previews.push(await capture('G3_B_90_Canvas',{...back,three:false}));
  previews.push(await capture('G3_C_90_overlay',{...back,three:false,fresh:true,visual:true,canvasOutline:true}));
  previews.push(await capture('G3_D_Canvas_front',{heading:0,turret:0,three:false,fresh:true}));
  previews.push(await capture('G3_E_Canvas_side',{heading:Math.PI/2,turret:Math.PI/2,three:false,fresh:true}));
  previews.push(await capture('G3_F_Canvas_rear',{...back,three:false,fresh:true}));
  previews.push(await capture('G3_G_Engine_Core',{...back,three:false,active:'engine',component:'ENGINE_CORE',fresh:true,canvasOutline:true,anchors:true,zoom:3}));
  previews.push(await capture('G3_H_weakpoints',{...back,three:false,active:'gunPort',component:'WEAKPOINTS',fresh:true,anchors:true,labels:true,zoom:1.8}));
  previews.push(await capture('G3_I_75_Three',{...back,three:true,elevation:75}));
  const result={schema:'G3_TIGER_CANVAS_V1',timestamp:new Date().toISOString(),pass:Object.values(checks).every(Boolean),checks,details:{geometry:details.geometry,performance:details.performance,hits,trace:{frames:240,onHash:hash(onTrace.frames),offHash:hash(offTrace.frames),g2Hash:hash(oldTrace.frames),flags:onTrace.flags,last:onTrace.last}},errors:[...errors,...onTrace.errors,...offTrace.errors,...oldTrace.errors],previews};
  fs.writeFileSync(path.join(out,'validation.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({pass:result.pass,checks,performance:details.performance,diagnostics:details.diagnostics,hits,errors:result.errors,previews:previews.map(x=>x.file)},null,2));
  await p.close();await browser.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});