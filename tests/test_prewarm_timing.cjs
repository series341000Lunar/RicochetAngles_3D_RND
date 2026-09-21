const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),all=[];
for(const role of ['player','boss']){
const p=await browser.newPage({viewport:{width:1280,height:720}});await p.addInitScript(()=>{requestAnimationFrame=()=>0;});
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html'+(process.argv[2]==='disabled'?'?prewarm=0':''));
await p.waitForFunction(()=>window.rendererSpike?.glb&&rendererSpike.roleTemplates.size===5,{}, {polling:100});
if(await p.evaluate(()=>!!window.rndStartup)){await p.waitForFunction(()=>rndStartup.state==='READY',{}, {polling:100});await p.locator('#startupStart').click();}
const data=await p.evaluate(role=>{
const r=rendererSpike.renderer,gl=r.getContext(),rows=[];
function draw(label){const t=performance.now();render();gl.finish();rows.push({label,ms:performance.now()-t,programs:r.info.programs.length,calls:r.info.render.calls,triangles:r.info.render.triangles});}
draw('previous');const t=performance.now();fireShell(role==='player'?game.player:game.boss,role);const allocationMs=performance.now()-t;draw('first shot');draw('next');game.time+=.3;render();fireShell(role==='player'?game.player:game.boss,role);draw('second shot');
return {role,allocationMs,rows};
},role);all.push(data);await p.close();}
fs.writeFileSync(path.join(root,'Docs/V4C_'+(process.argv[2]||'before')+'_timings.json'),JSON.stringify(all,null,2));console.log(JSON.stringify(all));await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
