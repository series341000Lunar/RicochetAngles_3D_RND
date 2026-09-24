const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),out=path.join(root,'test-output/env01');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1600,height:1000}});
 await page.goto('http://127.0.0.1:8766/dcc00/html/testbed.html?mode=env01');
 await page.waitForFunction(()=>window.env01?.asset,null,{timeout:60000});
 await page.waitForTimeout(400);
 const result=await page.evaluate(()=>({anchors:env01.measurements(),stats:env01.stats(),state:env01.world.rndStartup.state}));
 assert.equal(result.state,'READY');for(const a of result.anchors)assert(a.error<.002,JSON.stringify(a));
 await page.click('#showSemantic');await page.screenshot({path:path.join(out,'initial-75.png')});
 await page.click('#view90');await page.waitForTimeout(100);await page.screenshot({path:path.join(out,'initial-90.png')});
 fs.writeFileSync(path.join(out,'initial-runtime.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});