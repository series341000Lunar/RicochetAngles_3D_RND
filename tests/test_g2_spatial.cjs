const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..'),out=path.join(root,'Docs/g2_spatial');
fs.mkdirSync(out,{recursive:true});
const url='http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html';
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});
  await page.goto(url);
  await page.waitForFunction(()=>window.rndStartup?.state==='READY'||window.rndStartup?.error,null,{timeout:60000});
  await page.locator('#startupStart').click();
  const data=await page.evaluate(()=>{
    const checks={}, samples=[],sp=tigerSpatial,b=game.boss;
    const near=(a,c)=>Math.abs(a-c)<1e-6;
    checks.ready=rndStartup.state==='PLAYING'&&rendererSpike.enabled;
    checks.defaultSpatial=tigerWeakpoints.preset==='TIGER_SPATIAL';
    checks.measuredHull=near(sp.visualRects.hull.w,(2.809216022491455+2.9721157550811768)*28)&&near(sp.visualRects.hull.h,2*1.7862221002578735*28);
    checks.projectileTrackSeparation=sp.rects.hull.h<sp.visualRects.hull.h&&sp.rects.leftTrack.y+sp.rects.leftTrack.h/2<0&&sp.rects.rightTrack.y-sp.rects.rightTrack.h/2>0;
    checks.collisionPreserved=b.collisionRadius===105;
    const engine=sp.transform(b,'engine'),core=sp.transform(b,'core'),hull=sp.transform(b,'hull');
    checks.engineAndCoreInsideHull=[engine,core].every(r=>Math.abs(r.x-hull.x)+r.w/2<=hull.w/2+1e-6&&Math.abs(r.y-hull.y)+r.h/2<=sp.visualRects.hull.h/2+1e-6);
    checks.coreReferenceOnly=!WEAKPOINT_DEFS.core&&!WEAKPOINT_NAMES.includes('core');
    checks.engineGameplayShape=near(getWeakpointShape(WEAKPOINT_DEFS.engine).w,sp.rects.engine.w);
    const old=tigerWeakpoints.preset;
    tigerWeakpoints.setPreset('LEGACY');
    checks.legacyTransforms=Object.keys(tigerWeakpoints.legacy).every(n=>JSON.stringify(getWeakpointTransform(b,WEAKPOINT_DEFS[n]))===JSON.stringify(tigerWeakpoints.legacyTransform(b,tigerWeakpoints.legacy[n])));
    tigerWeakpoints.setPreset('TIGER_REMAP');
    checks.g1Transforms=Object.keys(tigerWeakpoints.descriptors).every(n=>JSON.stringify(getWeakpointTransform(b,WEAKPOINT_DEFS[n]))===JSON.stringify(tigerWeakpoints.remapTransform(b,n)));
    tigerWeakpoints.setPreset(old);
    const fixed=JSON.stringify(sp.transform(b,'hull'));rendererSpike.roleConfig.bossScale=1;render();
    checks.visualScaleNotAuthority=JSON.stringify(sp.transform(b,'hull'))===fixed&&document.getElementById('spatialStatus').textContent.includes('NONCANONICAL');
    rendererSpike.roleConfig.bossScale=2;render();
    Math.random=()=>.5;resetGame();game.obstacles=[];game.rndActors=[];
    Object.assign(game.boss,{x:700,y:1800,angle:0,turretAngle:0,activeTriggerWeakpoint:'cupola',weakpointState:'triggerWeakpoint'});
    function shot(name,from,to){const boss=game.boss,a=localToWorld(boss,...from),z=localToWorld(boss,...to);const hit=getShellHitWithBoss({prevX:a.x,prevY:a.y,x:z.x,y:z.y,vx:z.x-a.x,vy:z.y-a.y});samples.push({name,from,to,zone:hit?.zone||null,armor:hit?.armor||null,weakpoint:hit?.weakpointName||null,module:hit?.module===boss.leftTrack?'leftTrack':hit?.module===boss.rightTrack?'rightTrack':null});}
    shot('front',[190,20],[0,20]);shot('side',[35,120],[35,0]);shot('rear',[-190,25],[0,25]);shot('leftTrack',[0,-110],[0,0]);shot('rightTrack',[0,110],[0,0]);
    checks.frontSideRear=samples.slice(0,3).every(v=>!!v.zone&&!!v.armor);
    checks.trackModules=samples[3].module==='leftTrack'&&samples[4].module==='rightTrack';
    // Actual shell resolution through the existing 2D damage path.
    const boss=game.boss;boss.weakpointState='engineExposed';boss.activeTriggerWeakpoint=null;boss.engineExposureTimer=2;
    const t=getWeakpointTransform(boss,WEAKPOINT_DEFS.engine),start=localToWorld(t,140,0),a=t.angle+Math.PI,m=TUNING.playerShellMuzzleDistance;
    game.player.x=start.x-Math.cos(a)*m;game.player.y=start.y-Math.sin(a)*m;game.player.turretAngle=a;
    const hp=boss.hp;fireShell(game.player,'player');for(let i=0;i<180&&game.shells.length;i++)updateShells(1/240);
    checks.engineDamage=boss.hp===hp-1;
    const snapshot=JSON.stringify(game);render();checks.renderReadOnly=JSON.stringify(game)===snapshot;
    for(let i=0;i<120;i++)rndStep(1/60);checks.gameplaySmoke=game.state==='playing'&&game.boss.alive&&game.boss.hp===hp-1;
    const model=rendererSpike.roleModels?.boss||rendererSpike.roleMeshes?.boss||null;
    return {checks,samples,engineDamage:{before:hp,after:boss.hp},rects:sp.rects,visualRects:sp.visualRects,legacy:sp.legacy,source:sp.source,unitsPerMeter:sp.unitsPerMeter,modelReady:!!model};
  });
  async function capture(name,settings){
    const state=await page.evaluate(s=>{
      let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      for(const cn of ['world3d','game']){const el=document.getElementById(cn);el.style.width='100vw';el.style.height='100vh';el.style.left='0';el.style.top='0';}
      resetGame();game.obstacles=[];game.rndActors=[];game.boss.x=700;game.boss.y=1800;game.boss.angle=s.heading;game.boss.turretAngle=s.turret;
      game.boss.state='aim';game.boss.activeTriggerWeakpoint=s.activeWeakpoint||'visionSlit';game.boss.weakpointState=s.activeWeakpoint==='engine'?'engineExposed':'triggerWeakpoint';
      game.boss.engineExposureTimer=2;game.player.x=460;game.player.y=1950;game.shake=0;
      input.keys={};input.fire=false;game.state='playing';game.timeMode='NORMAL';
      camera.x=game.boss.x-W/2;camera.y=game.boss.y-H/2;
      rendererSpike.config.cameraElevation=s.elevation;rendererSpike.roleConfig.bossScale=2;
      tigerWeakpoints.setPreset('TIGER_SPATIAL');tigerWeakpoints.labels3D=s.labels3D;
      document.getElementById('spikePanel').style.visibility=s.panel?'visible':'hidden';
      document.getElementById('spatialPanel').open=!!s.panel;
      document.getElementById('spatialComponent').value=s.component;
      document.getElementById('spatialLabels').checked=!!s.overlayLabels;
      for(const [id,key] of [['spatialOld','old'],['spatialNew','fresh'],['spatialVisual','visual'],['spatialCollision','collision'],['spatialAnchors','anchors']])document.getElementById(id).checked=!!s[key];
      render();
      const z=s.zoom||1;for(const cn of ['world3d','game']){const el=document.getElementById(cn);el.style.width=(W*z)+'px';el.style.height=(H*z)+'px';el.style.left=(-W*(z-1)/2)+'px';el.style.top=(-H*(z-1)/2)+'px';}
      const ep=rendererSpike.projectSpatialAnchor('engine'),cp=rendererSpike.projectSpatialAnchor('core');
      return {elevation:s.elevation,component:s.component,engineScreen:ep,coreScreen:cp,bossScreen:{x:game.boss.x-camera.x,y:game.boss.y-camera.y},weakpoint:getWeakpointTransform(game.boss,WEAKPOINT_DEFS.engine)};
    },settings);
    await page.screenshot({path:path.join(out,name+'.png'),animations:'disabled'});
    return {file:name+'.png',...state};
  }
  const previews=[];
  previews.push(await capture('01_90_old_new_overlay',{elevation:90,zoom:2.35,heading:Math.PI,turret:Math.PI,component:'ALL',old:true,fresh:true,visual:true,collision:true,anchors:true,labels3D:true,panel:false}));
  previews.push(await capture('02_75_play_scene',{elevation:75,zoom:2.35,heading:Math.PI,turret:Math.PI,component:'ALL',old:false,fresh:false,visual:false,collision:false,anchors:false,labels3D:true,panel:false}));
  previews.push(await capture('03_90_weakpoint_labels',{elevation:90,zoom:2.35,heading:Math.PI,turret:Math.PI,component:'WEAKPOINTS',old:true,fresh:true,visual:false,collision:false,anchors:true,labels3D:true,panel:false}));
  previews.push(await capture('04_90_engine_core',{elevation:90,zoom:3,heading:Math.PI,turret:Math.PI,component:'ENGINE_CORE',old:true,fresh:true,visual:true,collision:false,anchors:true,labels3D:true,panel:false,activeWeakpoint:'engine'}));
  previews.push(await capture('05_90_front',{elevation:90,zoom:2.35,heading:0,turret:0,component:'ALL',old:false,fresh:true,visual:false,collision:false,anchors:false,labels3D:false,panel:false}));
  previews.push(await capture('06_90_side',{elevation:90,zoom:2.35,heading:Math.PI/2,turret:Math.PI/2,component:'ALL',old:false,fresh:true,visual:false,collision:false,anchors:false,labels3D:false,panel:false}));
  previews.push(await capture('07_90_rear',{elevation:90,zoom:2.35,heading:Math.PI,turret:Math.PI,component:'ALL',old:false,fresh:true,visual:false,collision:false,anchors:false,labels3D:false,panel:false}));
  previews.push(await capture('08_75_old_new_overlay',{elevation:75,zoom:2.35,heading:Math.PI,turret:Math.PI,component:'ALL',old:true,fresh:true,visual:false,collision:true,anchors:true,labels3D:true,panel:false}));
  async function legacyTrace(before){
    const q=await browser.newPage({viewport:{width:1280,height:720}});
    if(before){
      const files={
        'RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html':'RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.before_spatial_sync.html',
        'rnd_gameplay.js':'rnd_gameplay.before_spatial_sync.js',
        'rnd_tiger_weakpoints.js':'rnd_tiger_weakpoints.before_spatial_sync.js',
        'rnd_tiger_anchors.js':'rnd_tiger_anchors.before_spatial_sync.js'
      };
      for(const [name,backup] of Object.entries(files))await q.route('**/'+name,r=>r.fulfill({contentType:name.endsWith('.html')?'text/html':'application/javascript',body:fs.readFileSync(path.join(root,'spike',backup))}));
    }
    await q.goto(url);await q.waitForFunction(()=>window.rndStartup?.state==='READY',null,{timeout:60000});await q.locator('#startupStart').click();
    const trace=await q.evaluate(()=>{
      let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      resetGame();tigerWeakpoints.setPreset('LEGACY');input.keys={};input.fire=false;
      const frames=[];for(let i=0;i<180;i++){input.keys={w:i<60,shift:i>=90&&i<110};input.fire=i%45<10;rndStep(1/60);frames.push(JSON.stringify(game));}
      return frames;
    });await q.close();return trace;
  }
  const checks=data.checks;
  const legacyBefore=await legacyTrace(true),legacyCurrent=await legacyTrace(false);
  checks.legacyCombatTrace=legacyBefore.every((v,i)=>v===legacyCurrent[i]);
  checks.engineDeckProjection=previews.every(p=>p.engineScreen&&Number.isFinite(p.engineScreen.x)&&Number.isFinite(p.engineScreen.y));
  checks.noPageErrors=errors.length===0;
  const result={schema:'G2_TIGER_SPATIAL_V1',timestamp:new Date().toISOString(),pass:Object.values(checks).every(Boolean),checks,errors,measurements:data,previews};
  fs.writeFileSync(path.join(out,'validation.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({pass:result.pass,checks,samples:data.samples,errors,previews:previews.map(x=>x.file)},null,2));
  await browser.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});