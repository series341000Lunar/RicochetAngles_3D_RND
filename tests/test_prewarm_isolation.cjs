const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage();
await p.addInitScript(()=>{const random=Math.random;window.rngCalls=0;Math.random=()=>{rngCalls++;return random();};});
await p.route('**/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html',async route=>{
const response=await route.fetch();let body=await response.text();
body=body.replace('gate.before=JSON.stringify(game);','gate.before=JSON.stringify(game);gate.rngStart=window.rngCalls;')
.replace('gate.isolation=gate.before===JSON.stringify(game);','gate.rngDelta=window.rngCalls-gate.rngStart;gate.isolation=gate.before===JSON.stringify(game);');
await route.fulfill({response,body});});
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
await p.waitForFunction(()=>rndStartup.state==='READY',{}, {polling:100});
const random=await p.evaluate(()=>({calls:rndStartup.rngDelta,pass:rndStartup.rngDelta===0}));
await p.close();const missing=await b.newPage();
await missing.route('**/Panzer3_RND_v02.glb',r=>r.fulfill({status:404,body:'deliberate test failure'}));
await missing.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
await missing.waitForFunction(()=>!!rndStartup.error,{}, {polling:100});
const failedAsset=await missing.evaluate(()=>({state:rndStartup.state,disabled:document.getElementById('startupStart').disabled,time:game.time,pass:rndStartup.state==='LOADING'&&document.getElementById('startupStart').disabled&&game.time===0}));
const result={random,failedAsset,pass:random.pass&&failedAsset.pass};fs.writeFileSync(path.join(root,'Docs/V4C_isolation_failure.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
