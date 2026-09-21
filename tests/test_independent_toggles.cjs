const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage(),errors=[],results=[];
p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{requestAnimationFrame=()=>0;});
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
await p.waitForFunction(()=>window.rendererSpike?.glb&&rendererSpike.roleTemplates.size===5,{}, {polling:100});
await p.evaluate(()=>rendererSpike.worldGrade.toon.ready);
for(const [grade,toon] of [[false,false],[false,true],[true,false],[true,true],[false,true],[false,false]]){
await p.locator('#postEnabled').setChecked(grade);
await p.locator('#toonEnabled').setChecked(toon);
results.push(await p.evaluate(({grade,toon})=>{
render();const g=rendererSpike.worldGrade;
return {grade,toon,active:g.active,passes:g.info.passes,pass: g.grade.enabled===grade&&g.toon.pass.enabled===toon&&g.active===(grade||toon)&&g.info.passes===(grade||toon?2+Number(grade)+Number(toon):0)};
},{grade,toon}));
}
const result={results,errors,pass:results.every(r=>r.pass)&&!errors.length};
fs.writeFileSync(path.resolve(__dirname,'../Docs/V4B_independent_toggles.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1);});