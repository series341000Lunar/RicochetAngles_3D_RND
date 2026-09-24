const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/dcc-map-01');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1600,height:950}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:18767/dcc00/html/testbed.html');
 await page.waitForFunction(()=>window.dccPreview?.entries?.length>0,null,{timeout:60000});
 const defaultMode=await page.evaluate(()=>({count:dccPreview.entries.length,actual:dccPreview.actual,state:dccPreview.world.rndStartup.state}));
 assert.equal(defaultMode.state,'READY');assert(defaultMode.actual>0);
 await page.goto('http://127.0.0.1:18767/dcc00/html/testbed.html?mode=canonical');
 await page.waitForFunction(()=>window.h5ePreview?.entries?.length===197,null,{timeout:60000});
 const initial=await page.evaluate(()=>JSON.stringify(h5ePreview.world.game));
 const before=await page.evaluate(()=>{
  const p=h5ePreview,e=p.entries.find(v=>v.record.id===p.target);
  return {record:e.record,position:e.root.position.toArray(),count:p.entries.length,state:p.world.rndStartup.state,
   canvas:getComputedStyle(p.world.document.getElementById('world3d')).visibility};
 });
 assert.equal(before.state,'READY');assert.equal(before.canvas,'visible');
 await page.waitForTimeout(400);await page.screenshot({path:path.join(out,'canonical-entire-map.png')});
 await page.click('#mapFocus');await page.waitForTimeout(200);
 await page.screenshot({path:path.join(out,'canonical-before.png')});
 await page.click('#mapAfter');await page.waitForFunction(()=>h5ePreview.version==='edited');
 await page.waitForTimeout(200);
 const after=await page.evaluate(()=>{
  const p=h5ePreview,e=p.entries.find(v=>v.record.id===p.target);
  return {record:e.record,position:e.root.position.toArray(),game:JSON.stringify(p.world.game)};
 });
 assert.equal(initial,after.game);delete after.game;
 const expected=JSON.parse(fs.readFileSync(path.join(root,'workspace/dcc-map-01/edited.json'),'utf8'));
 const loaded=await page.evaluate(()=>h5ePreview.document);assert.deepStrictEqual(loaded,expected);
 assert(Math.abs(after.position[0]-before.position[0]-40)<.002);
 assert.equal(after.position[2],before.position[2]);
 assert.deepStrictEqual({...after.record,geometry:before.record.geometry},before.record);
 await page.screenshot({path:path.join(out,'canonical-after.png')});
 assert.deepStrictEqual(errors,[]);
 fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify({pass:true,defaultMode,before,after,
  canonicalPayloadEquality:true,gameplayUnchanged:true,errors},null,2));
 await browser.close();console.log('DCC_MAP_01_BROWSER_PASS');
})().catch(e=>{console.error(e);process.exit(1)});