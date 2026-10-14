const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'Docs/global-lookdev');fs.mkdirSync(out,{recursive:true});
const url='http://127.0.0.1:8765/lookdev/';
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1600,height:960},deviceScaleFactor:1});
  const errors=[],consoleErrors=[],checks={},samples=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  await page.goto(url);await page.waitForFunction(()=>['READY','DEGRADED','FAILED'].includes(window.lookdev?.status),null,{timeout:90000});
  const loaded=await page.evaluate(()=>{
    const a=lookdev;return {status:a.status,errors:a.errors,environment:a.environment.status,coverage:a.environment.coverage,
      assets:a.assets.map(r=>({id:r.id,label:r.label,status:r.status,hashVerified:r.hashVerified,gpuPrepared:r.gpuPrepared,
        scale:r.scale,groundOffset:r.groundOffset,validation:r.validation,mainlineReference:r.mainlineReference})),
      renderer:{revision:a.threeRevision,pixelRatio:a.renderer.getPixelRatio(),colorSpace:a.renderer.outputColorSpace,tone:a.renderer.toneMapping,
        exposure:a.renderer.toneMappingExposure,shadowSize:a.scene.children.find(n=>n.isDirectionalLight).shadow.mapSize.x,
        context:a.renderer.getContext().getContextAttributes()},
      lights:a.scene.children.filter(n=>n.isLight).map(n=>({type:n.type,color:n.color.getHexString(),ground:n.groundColor?.getHexString(),intensity:n.intensity})),
      contexts:document.querySelectorAll('canvas').length,prewarmDraws:a.prewarmDraws,envTransform:a.environment.root.matrix.elements};
  });
  checks.ready=loaded.status==='READY';checks.environment=loaded.environment==='READY'&&loaded.coverage?.covered;
  checks.allAssets=loaded.assets.length>0&&loaded.assets.every(a=>a.status==='READY'&&a.hashVerified&&a.gpuPrepared);
  checks.rendererBaseline=loaded.renderer.revision==='160'&&loaded.renderer.pixelRatio===1&&loaded.renderer.colorSpace==='srgb'&&loaded.renderer.tone===0&&loaded.renderer.exposure===1&&loaded.renderer.shadowSize===2048&&loaded.renderer.context.antialias&&loaded.renderer.context.alpha;
  checks.lightingBaseline=loaded.lights.some(l=>l.type==='HemisphereLight'&&l.color==='cbdcf0'&&l.ground==='82734e'&&l.intensity===.85)&&loaded.lights.some(l=>l.type==='DirectionalLight'&&l.color==='ffefd4'&&l.intensity===2.3);
  checks.oneCanvas=loaded.contexts===1;checks.envIdentity=JSON.stringify(loaded.envTransform)===JSON.stringify([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  if(!checks.ready)throw Error('Startup failed: '+JSON.stringify(loaded.errors));
  const within=async label=>{
    const data=await page.evaluate(()=>({field:lookdev.manifest.field,footprint:lookdev.footprint(),zoom:lookdev.camera.zoom,center:{...lookdev.center}}));
    const f=data.field;data.inside=data.footprint.every(p=>p.x>=f.minX-1e-5&&p.x<=f.maxX+1e-5&&p.z>=f.minZ-1e-5&&p.z<=f.maxZ+1e-5);
    samples.push({label,...data});return data.inside;
  };
  checks.initialBoundary=await within('initial');
  await page.screenshot({path:path.join(out,'baseline.png')});
  const before=await page.evaluate(()=>({...lookdev.center}));
  await page.mouse.click(900,600);await page.keyboard.down('d');await page.waitForTimeout(200);await page.keyboard.up('d');
  checks.keyboardPan=await page.evaluate(before=>lookdev.center.x>before.x,before);
  await page.mouse.move(900,600);await page.mouse.down();await page.mouse.move(1070,700,{steps:5});await page.mouse.up();
  checks.dragPan=await page.evaluate(before=>Math.abs(lookdev.center.z-before.z)>1,before);
  const zoomBefore=await page.evaluate(()=>lookdev.camera.zoom);await page.mouse.wheel(0,-80);await page.waitForTimeout(100);
  checks.wheelZoom=(await page.evaluate(()=>lookdev.camera.zoom))>zoomBefore;
  checks.panZoomBoundary=await within('real inputs');
  for(const [width,height] of [[800,1200],[2200,450],[640,480],[1600,960]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(100);
    for(const elevation of [45,75,90])for(const zoom of [0.0001,100]){
      await page.evaluate(({elevation,zoom})=>{lookdev.setElevation(elevation);lookdev.setZoom(zoom);lookdev.pan(1e5,-1e5);},{elevation,zoom});
      checks['boundary_'+width+'_'+height+'_'+elevation+'_'+zoom]=await within('resize / zoom / elevation');
    }
  }
  await page.locator('#baseline').click();await page.locator('#home').click();
  await page.locator('#shadows').uncheck();checks.shadowOff=await page.evaluate(()=>!lookdev.renderer.shadowMap.enabled&&!lookdev.scene.children.find(n=>n.isDirectionalLight).castShadow);
  await page.locator('#shadows').check();checks.shadowOn=await page.evaluate(()=>lookdev.renderer.shadowMap.enabled&&lookdev.assets.filter(a=>a.root.visible).every(a=>a.validation.cast>0));
  await page.locator('#tone').selectOption('ACES');await page.locator('#sun').fill('1.2');await page.locator('#sun').dispatchEvent('input');
  await page.locator('#baseline').click();checks.reset=await page.evaluate(()=>lookdev.settings.sunIntensity===2.3&&lookdev.settings.elevation===75&&lookdev.renderer.toneMapping===0&&document.getElementById('baselineState').textContent==='MAINLINE BASELINE');
  const id=await page.evaluate(()=>lookdev.assets.find(a=>a.mainlineReference?.includes('Stage1Boss')).id);
  await page.locator('#assetSelect').selectOption(id);await page.locator('#solo').click();
  checks.solo=await page.evaluate(()=>lookdev.assets.filter(a=>a.root.visible).length===1);checks.focusBoundary=await within('solo focus');
  await page.waitForTimeout(350); // Let the sampled HUD reflect the new camera/roster.
  await page.screenshot({path:path.join(out,'actor-shadow.png')});
  await page.locator('#roster').click();await page.locator('#home').click();
  checks.roster=await page.evaluate(()=>lookdev.assets.filter(a=>a.root.visible).length===lookdev.manifest.actors.filter(a=>a.visible).length);
  await page.waitForTimeout(350);
  await page.screenshot({path:path.join(out,'baseline-final.png')});
  const lifecycle=await page.evaluate(()=>{const a=lookdev,stats={before:a.renderer.info.memory.geometries,frames:a.frames};a.dispose();return {...stats,status:a.status,roots:a.assets.filter(a=>a.root).length,after:a.renderer.info.memory.geometries};});
  checks.dispose=lifecycle.status==='DISPOSED'&&lifecycle.roots===0&&lifecycle.after===0;
  const missing=await browser.newPage({viewport:{width:1280,height:720}});
  await missing.route('**/lookdev/assets/*.glb',async route=>{
    const isEnv=route.request().url().includes('8eb88f8312e183e1');if(isEnv)await route.fulfill({status:404,body:'missing test'});else await route.continue();
  });
  await missing.goto(url);await missing.waitForFunction(()=>['READY','DEGRADED','FAILED'].includes(window.lookdev?.status),null,{timeout:90000});
  checks.missingEnvSoft=await missing.evaluate(()=>lookdev.status==='DEGRADED'&&lookdev.environment.fallback&&lookdev.assets.some(a=>a.status==='READY'));
  await missing.close();
  const nav=await browser.newPage({viewport:{width:1280,height:720}});await nav.goto(url);
  await nav.waitForFunction(()=>lookdev.status==='READY',null,{timeout:90000});
  await nav.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');await nav.goBack();
  await nav.waitForFunction(()=>window.lookdev?.status==='READY'&&!lookdev.disposed&&!lookdev.suspended,null,{timeout:90000});
  const frames=await nav.evaluate(()=>lookdev.frames);await nav.waitForTimeout(100);
  checks.navigationReturn=await nav.evaluate(before=>lookdev.frames>before,frames);await nav.close();
  const lost=await browser.newPage({viewport:{width:1280,height:720}});await lost.goto(url);
  await lost.waitForFunction(()=>lookdev.status==='READY',null,{timeout:90000});
  checks.contextFailure=await lost.evaluate(()=>{lookdev.renderer.getContext().getExtension('WEBGL_lose_context').loseContext();return true;});
  await lost.waitForFunction(()=>lookdev.status==='FAILED');checks.contextFailure=await lost.locator('#fatal').isVisible();await lost.close();
  checks.noErrors=errors.length===0&&consoleErrors.length===0;
  const result={checks,errors,consoleErrors,loaded,samples,lifecycle,pass:Object.values(checks).every(Boolean)};
  fs.writeFileSync(path.join(out,'browser-validation.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({pass:result.pass,checks,errors,consoleErrors,assets:loaded.assets.length,coverage:loaded.coverage},null,2));
  await browser.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1);});
