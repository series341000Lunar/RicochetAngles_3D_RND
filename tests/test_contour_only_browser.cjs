const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
const out=path.resolve(__dirname,'../Docs/clean-lookdev');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1600,height:960},deviceScaleFactor:1});
 const errors=[],checks={},measurements=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:8765/lookdev/?look=contour-only');
 await page.waitForFunction(()=>window.lookdev?.status==='READY',null,{timeout:90000});
 checks.initialMode=await page.evaluate(()=>lookdev.lookMode==='BLACK_OUTLINE_CONTOUR_ONLY');
 const ids=await page.evaluate(()=>({tank:lookdev.assets.find(a=>a.root.visible&&a.label.includes('Panzer3')).id,boss:lookdev.assets.find(a=>a.label.includes('Stage1Boss')).id}));
 const colorSnapshot=()=>page.evaluate(()=>lookdev.assets.flatMap(a=>{const colors=[];a.root.traverse(n=>{if(n.isMesh&&!n.userData.lookdevOutline)for(const m of Array.isArray(n.material)?n.material:[n.material])colors.push([m.id,m.color?.toArray()]);});return colors;}));
 await page.evaluate(()=>lookdev.setLookMode('CLEAN_LOW_POLY'));const plainColors=await colorSnapshot();
 async function sample(name,mode,scope='all',id=ids.tank){
  await page.locator('#assetSelect').selectOption(id);
  await page.evaluate(({mode,scope})=>{lookdev.setLookMode(mode);lookdev.contourOnly.state.scope=scope;document.getElementById('contourScope').value=scope;},{mode,scope});
  await page.waitForTimeout(200);
  const result=await page.evaluate(({name,mode})=>{
   const a=lookdev,times=[];for(let i=0;i<10;i++)a.renderFrame();
   for(let i=0;i<40;i++){const start=performance.now();a.renderFrame();times.push(performance.now()-start);}times.sort((a,b)=>a-b);
   const frameStats={...a.frameStats},r=a.renderer,auto=r.info.autoReset;r.info.autoReset=false;r.info.reset();
   r.render(a.scene,a.camera);if(mode==='BLACK_OUTLINE_CONTOUR_ONLY')a.contourOnly.render(r,a.camera,document.getElementById('assetSelect').value);
   const totalFrameCallsIncludingShadows=r.info.render.calls,totalFrameTrianglesIncludingShadows=r.info.render.triangles;r.info.autoReset=auto;a.renderFrame();
   return {name,mode,...frameStats,totalFrameCallsIncludingShadows,totalFrameTrianglesIncludingShadows,shadowCalls:totalFrameCallsIncludingShadows-frameStats.totalCalls,
    cpuMedianMs:times[20],cpuP95Ms:times[38],contour:a.contourOnly.metrics(),shells:a.cleanLook.metrics().visibleOutlineMeshes,
    geometries:a.renderer.info.memory.geometries,programs:a.renderer.info.programs.length};
  },{name,mode});measurements.push(result);
  if(mode==='BLACK_OUTLINE_CONTOUR_ONLY'){await page.screenshot({path:path.join(out,name+'.png')});await page.locator('#world').screenshot({path:path.join(out,name+'-world.png')});}
 }
 await sample('A-reference','MAINLINE_REFERENCE');await sample('B-plain','CLEAN_LOW_POLY');await sample('C-shells','CLEAN_OUTLINE');
 await sample('D-contour-only-all','BLACK_OUTLINE_CONTOUR_ONLY');
 checks.noInternalShells=measurements.at(-1).shells===0;
 checks.sameCleanPalette=JSON.stringify(plainColors)===JSON.stringify(await colorSnapshot());
 await sample('E-contour-only-selected','BLACK_OUTLINE_CONTOUR_ONLY','selected');
 await sample('F-contour-only-boss','BLACK_OUTLINE_CONTOUR_ONLY','selected',ids.boss);
 checks.costAccounting=measurements.filter(m=>m.mode==='BLACK_OUTLINE_CONTOUR_ONLY').every(m=>m.totalCalls===m.worldCalls+m.maskCalls+1&&m.compositeCalls===1&&m.maskTriangles>0);
 checks.borrowedGeometry=await page.evaluate(()=>lookdev.contourOnly.metrics().geometryCopies===0);
 checks.rendererStateRestored=await page.evaluate(()=>{const a=lookdev,r=a.renderer,c=r.getClearColor({copy(c){this.hex=c.getHex();return this;}}).hex,alpha=r.getClearAlpha(),shadow=r.shadowMap.enabled,clear=r.autoClear,target=r.getRenderTarget();a.renderFrame();return c===r.getClearColor({copy(c){this.hex=c.getHex();return this;}}).hex&&alpha===r.getClearAlpha()&&shadow===r.shadowMap.enabled&&clear===r.autoClear&&target===r.getRenderTarget();});
 await page.locator('#contourScope').selectOption('all');
 for(const [width,height] of [[800,1100],[2200,450],[1600,960]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(150);
  for(const zoom of [.1,1,4,100]){await page.evaluate(z=>{lookdev.setZoom(z);lookdev.pan(10000,-10000);},zoom);
   checks['bounds_'+width+'_'+zoom]=await page.evaluate(()=>{const a=lookdev,f=a.manifest.field;return a.footprint().every(p=>p.x>=f.minX-1e-5&&p.x<=f.maxX+1e-5&&p.z>=f.minZ-1e-5&&p.z<=f.maxZ+1e-5)&&a.contourOnly.state.width===document.getElementById('viewport').clientWidth;});}
 }
 await page.locator('#home').click();
 await page.evaluate(()=>{document.querySelector('.topline').style.visibility='hidden';document.querySelector('.help').style.visibility='hidden';});
 const box=await page.locator('#world').boundingBox(),before=await page.screenshot({clip:box});
 await page.evaluate(()=>{lookdev.pan(4,2);lookdev.pan(-4,-2);});await page.waitForTimeout(120);
 checks.deterministicReturn=before.equals(await page.screenshot({clip:box}));
 await page.keyboard.down('d');await page.waitForTimeout(300);await page.keyboard.up('d');await page.mouse.move(650,420);await page.mouse.wheel(0,-160);await page.waitForTimeout(200);
 await page.screenshot({path:path.join(out,'contour-motion.png')});
 const cache=await page.evaluate(()=>({g:lookdev.renderer.info.memory.geometries,t:lookdev.renderer.info.memory.textures}));
 for(let i=0;i<20;i++)await page.evaluate(i=>lookdev.setLookMode(i%2?'BLACK_OUTLINE_CONTOUR_ONLY':'CLEAN_OUTLINE'),i);
 await page.waitForTimeout(100);checks.boundedCache=await page.evaluate(c=>c.g===lookdev.renderer.info.memory.geometries&&c.t===lookdev.renderer.info.memory.textures,cache);
 await page.locator('#shadows').uncheck();await page.waitForTimeout(100);checks.shadowOffPreserved=await page.evaluate(()=>{lookdev.renderFrame();return !lookdev.renderer.shadowMap.enabled;});
 await page.locator('#baseline').click();checks.referenceRestored=await page.evaluate(()=>lookdev.cleanLook.originalsRestored()&&lookdev.cleanLook.metrics().visibleOutlineMeshes===0&&lookdev.renderFrame().maskCalls===0);
 checks.noErrors=errors.length===0;
 const disposal=await page.evaluate(()=>{lookdev.dispose();return {g:lookdev.renderer.info.memory.geometries,t:lookdev.renderer.info.memory.textures,contour:lookdev.contourOnly.state.disposed};});
 checks.dispose=disposal.g===0&&disposal.t===0&&disposal.contour;
 const result={pass:Object.values(checks).every(Boolean),checks,errors,measurements,disposal};
 fs.writeFileSync(path.join(out,'contour-validation.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
 await browser.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1);});


