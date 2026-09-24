const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const out=path.resolve(__dirname,'../test-output/art-production-20260924');
(async()=>{
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1100}});
const iteration=process.argv.includes('--iteration'); const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:8766/dcc00/html/testbed.html?mode=env01');
await page.waitForFunction(()=>window.env01?.asset,null,{timeout:60000});
await page.uncheck('#showSemantic');await page.uncheck('#showMap');
await page.waitForTimeout(500);
const first=await page.evaluate(()=>({stats:env01.stats(),revision:env01.revision,game:JSON.stringify(env01.world.game)}));
if(iteration) await page.screenshot({path:path.join(out,'iteration-first-75.png')});
if(iteration) fs.writeFileSync(path.join(out,'first-browser-ready.json'),JSON.stringify(first,null,2));
console.log('FIRST_BROWSER_READY');
const deadline=Date.now()+600000;
while(iteration && !fs.existsSync(path.join(out,'refine-blender.json'))){if(Date.now()>deadline)throw Error('Refine wait timed out');await page.waitForTimeout(1000);}
await page.click('#envReload');
await page.waitForFunction(r=>env01.revision>r&&env01.asset,first.revision);
await page.waitForTimeout(700);
const final=await page.evaluate(()=>({stats:env01.stats(),revision:env01.revision,anchors:env01.measurements(),state:env01.world.rndStartup.state,game:JSON.stringify(env01.world.game),warning:env01.warning}));
assert.equal(final.state,'READY');assert.equal(final.game,first.game);if(iteration) assert(final.stats.triangles>first.stats.triangles);
for(const a of final.anchors)assert(a.error<.002);
assert.deepEqual(errors,[]);assert.equal(final.warning,'');
await page.screenshot({path:path.join(out,'current-stage-75.png')});
await page.click('#view90');await page.check('#showSemantic');await page.waitForTimeout(300);
await page.screenshot({path:path.join(out,'current-stage-90-reference.png')});
await page.click('#envFit');await page.check('#showMap');await page.waitForTimeout(300);
await page.screenshot({path:path.join(out,'current-stage-overview.png')});
await page.click('#envSlice');await page.click('#view75');await page.uncheck('#showSemantic');await page.uncheck('#showMap');await page.waitForTimeout(300);
// A cropped capture of the same existing camera, not a new camera/UI.
await page.screenshot({path:path.join(out,'current-stage-art-close.png'),clip:{x:710,y:210,width:760,height:620}});
delete first.game;delete final.game;
fs.writeFileSync(path.join(out,iteration?'browser-review.json':'final-smoke.json'),JSON.stringify({first,final,errors,liveReload:true,gameplayUnchanged:true,userVisualReview:'REQUIRED'},null,2));
console.log(JSON.stringify({first,final,errors,liveReload:true}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
