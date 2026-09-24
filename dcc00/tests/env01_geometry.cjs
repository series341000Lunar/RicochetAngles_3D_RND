const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/env01');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:8766/dcc00/html/testbed.html?mode=env01');
 await page.waitForFunction(()=>window.env01?.asset);
 const measured=await page.evaluate(()=>{
  const a=env01.asset;env01.world.rendererSpike.scene.updateMatrixWorld(true);
  const record=id=>env01.document.objects.find(r=>r.id===id);
  const point=o=>o.getWorldPosition(o.position.clone());
  const wa=point(a.getObjectByName('ENV_WALL_01')),wb=point(a.getObjectByName('ENV_WALL_02'));
  const ga=record('H5E_P1_TUT_COVER_01').geometry,gb=record('H5E_P1_TUT_COVER_02').geometry;
  const route=record('H5E_P1_GUIDE_ROUTE_TUT').geometry.points[3],road=a.getObjectByName('ENV_ROAD_01');
  const vertices=[];for(let i=0;i<road.geometry.attributes.position.count;i++)vertices.push(road.position.clone().fromBufferAttribute(road.geometry.attributes.position,i).applyMatrix4(road.matrixWorld));
  let best={error:Infinity};for(let i=0;i<vertices.length;i++)for(let j=i+1;j<vertices.length;j++){
   const p=vertices[i].clone().add(vertices[j]).multiplyScalar(.5),error=Math.hypot(p.x-route.x,p.z-route.y);
   if(error<best.error)best={error,position:p.toArray()};
  }
  return {wall:{expected:[ga.x,ga.y],actual:[wa.x,wa.z],error:Math.hypot(wa.x-ga.x,wa.z-ga.y)},
   circularWall:{expected:[gb.x,gb.y],actual:[wb.x,wb.z],height:wb.y,error:Math.hypot(wb.x-gb.x,wb.z-gb.y)},
   roadCrossSection:{expected:[route.x,route.y],...best}};
 });
 for(const v of Object.values(measured))assert(v.error<.002);
 await page.locator('#showSemantic').uncheck();await page.waitForTimeout(150);
 await page.screenshot({path:path.join(out,'review-75.png')});
 await page.click('#view90');await page.waitForTimeout(150);await page.screenshot({path:path.join(out,'review-90.png')});
 const cleanStats=await page.evaluate(()=>env01.stats());
 await page.locator('#showSemantic').check();await page.screenshot({path:path.join(out,'review-90-overlay.png')});
 // Shared converter regression, current canonical and original DCC default modes.
 const modes={};
 for(const mode of ['canonical','default']){
  await page.goto('http://127.0.0.1:8766/dcc00/html/testbed.html'+(mode==='canonical'?'?mode=canonical':''));
  await page.waitForFunction(m=>m==='canonical'?window.h5ePreview?.entries?.length===197:window.dccPreview?.entries?.length>0,mode);
  modes[mode]=await page.evaluate(m=>m==='canonical'?{records:h5ePreview.entries.length}:{records:dccPreview.entries.length,actualGLB:dccPreview.actual},mode);
 }
 assert.deepStrictEqual(errors,[]);
 fs.writeFileSync(path.join(out,'geometry-and-regression.json'),JSON.stringify({pass:true,measured,cleanStats,modes,errors},null,2));
 await browser.close();console.log(JSON.stringify({measured,cleanStats,modes}));
})().catch(e=>{console.error(e);process.exit(1)});