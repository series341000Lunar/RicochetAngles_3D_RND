const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:18766/dcc00/html/editor.html');await page.waitForFunction(()=>window.dccEditor?.document);
 assert(['275','333'].includes(await page.locator('#field-homeRadius').inputValue()));await page.locator('#field-homeRadius').fill('333');await page.locator('#field-homeRadius').dispatchEvent('change');await page.locator('#save').click();await page.waitForFunction(()=>document.querySelector('#status').textContent.startsWith('Saved'));
 await page.locator('#reload').click();assert.equal(await page.locator('#field-homeRadius').inputValue(),'333');const edited=await page.evaluate(()=>dccEditor.document);assert.equal(edited.futureExtension.preserveMe,true);assert.equal(edited.actors[0].futureActorProperty.value,73);await page.screenshot({path:path.join(out,'html-editor.png'),fullPage:true});
 await page.goto('http://127.0.0.1:18766/dcc00/html/testbed.html');await page.waitForFunction(()=>window.dccPreview?.entries?.length>0,null,{timeout:60000});
 const before=await page.evaluate(()=>JSON.stringify(dccPreview.world.game));const initial=await page.evaluate(()=>{const p=dccPreview.entries.find(v=>v.a.class==='PresentationActor').root.position;return{x:p.x,y:p.y,z:p.z};});
 await page.locator('#seconds').fill('6');await page.waitForTimeout(150);const moved=await page.evaluate(()=>{const p=dccPreview.entries.find(v=>v.a.class==='PresentationActor').root.position;return{x:p.x,y:p.y,z:p.z};});assert.notDeepEqual(initial,moved);
 const samples=JSON.parse(fs.readFileSync(path.join(out,'blender-path-samples.json'),'utf8'));
 for(const sample of samples){await page.locator('#seconds').fill(String(sample.seconds));await page.waitForTimeout(50);const pos=await page.evaluate(()=>{const p=dccPreview.entries.find(v=>v.a.class==='PresentationActor').root.position;return{x:p.x,y:p.z,z:p.y};});for(const k of ['x','y','z'])assert(Math.abs(pos[k]-sample[k])<.001);}
 await page.locator('#seconds').fill('6');await page.waitForTimeout(60);
 const after=await page.evaluate(()=>JSON.stringify(dccPreview.world.game));assert.equal(before,after);const state=await page.evaluate(()=>({actual:dccPreview.actual,missing:dccPreview.missing,actors:dccPreview.entries.length,world:{width:dccPreview.world.WORLD.width,height:dccPreview.world.WORLD.height},startup:dccPreview.world.rndStartup.state}));assert(state.actual>=3);assert.equal(state.world.height,3600);assert.equal(state.startup,'READY');
 assert.equal(await page.evaluate(()=>getComputedStyle(dccPreview.world.document.getElementById('world3d')).visibility),'visible');
 await page.screenshot({path:path.join(out,'three-testbed.png'),fullPage:true});assert.deepEqual(errors,[]);
 await page.route('**/M41/export/**',route=>route.abort());await page.reload();await page.waitForFunction(()=>window.dccPreview?.entries?.length>0,null,{timeout:60000});
 const fallback=await page.evaluate(()=>({missing:dccPreview.missing,ids:dccPreview.entries.filter(e=>e.a.ra_id).map(e=>e.a.ra_id),proxy:dccPreview.entries.filter(e=>e.a.class==='LightTank').every(e=>e.root.userData.preview==='MISSING_ASSET')}));assert(fallback.missing>=2&&fallback.proxy);assert(fallback.ids.includes('tank-scout'));
 await page.screenshot({path:path.join(out,'missing-asset-testbed.png'),fullPage:true});
 fs.writeFileSync(path.join(out,'browser-roundtrip.json'),JSON.stringify({pass:true,htmlEditReload:true,unknownPreserved:true,gameplayUnchanged:true,presentationMoved:true,blenderPathParity:true,canvasVisible:true,missingAssetFallback:fallback,...state,errors},null,2));await browser.close();console.log('DCC00_BROWSER_PASS',JSON.stringify(state));
})().catch(e=>{console.error(e);process.exit(1)});
