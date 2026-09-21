const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert'),path=require('path');
const R='\\\\192.168.87.201\\Projects\\RicochetAngles\\01_RND\\ThreeJSDEV';
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
const p=await b.newPage({viewport:{width:1280,height:720}});await p.addInitScript(()=>window.requestAnimationFrame=()=>0);
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_GLBSPIKE.html');await p.waitForFunction(()=>rendererSpike?.glb,null,{polling:100});
const results=await p.evaluate(()=>{
const rows=[];rendererSpike.config.cameraElevation=75;
for(const degrees of [90,85,95,265,275,0,45,135,180,225,315]){
 for(const ease of [false,true]){
 Math.random=()=>.5;resetGame();const p=game.player;p.angle=.3;p.turretAngle=-degrees*Math.PI/180;
 camera.x=p.x-W/2;camera.y=p.y-H/2;
 const b=rendererSpike.muzzleBridge;b.config.easeOut=ease;rendererSpike.render(0,0);fireShell(p,'player');
 const s=game.shells.at(-1),start=b.states.get(s).start.clone(),samples=[];
 for(const age of [0,1/60,2/60,.05,.075,.1]){
 const dt=age-(samples.at(-1)?.age||0);game.time=age;updateShells(dt);
 const before=JSON.stringify(game);rendererSpike.render(0,0);
 const v=b.shells.get(s).position.clone(),target=v.clone().set(s.x,8,s.y);
 const vp=v.clone().project(rendererSpike.view),tp=target.clone().project(rendererSpike.view);
 samples.push({age,visual:v.toArray(),target:target.toArray(),gapPx:Math.hypot((vp.x-tp.x)*W/2,(vp.y-tp.y)*H/2),readOnly:before===JSON.stringify(game)});
 }rows.push({degrees,ease,start:start.toArray(),samples});
 }}return rows;
});
for(let i=0;i<results.length;i+=2){
const a=results[i],e=results[i+1];assert.deepStrictEqual(a.samples[0].visual,e.samples[0].visual);assert.deepStrictEqual(e.samples[0].visual,e.start);
for(let j=0;j<a.samples.length;j++){assert(a.samples[j].readOnly&&e.samples[j].readOnly);assert.deepStrictEqual(a.samples[j].target,e.samples[j].target);if(j>0&&j<4)assert(e.samples[j].gapPx<a.samples[j].gapPx+1e-7);if(j>=4)assert.deepStrictEqual(e.samples[j].visual,e.samples[j].target);}
}
const simulate=ease=>{let seed=123;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);resetGame();rendererSpike.muzzleBridge.config.easeOut=ease;lastTime=0;input.keys={w:true,d:true};input.fire=true;input.mouseScreenX=950;input.mouseScreenY=290;const out=[];for(let i=1;i<=180;i++){if(i===60)input.keys={};if(i===100)input.fire=false;frame(i*1000/60);if(i%30===0)out.push(JSON.stringify(game));}return out};
const a=await p.evaluate(simulate,false),e=await p.evaluate(simulate,true);assert.deepStrictEqual(a,e);
const report={headings:'CCW degrees converted to negative legacy clockwise angle',camera:75,duration:.075,defaultEase:await p.locator('#easeBridge').isChecked(),deterministic:{frames:180,snapshots:6,equal:true},results};
fs.writeFileSync(path.join(R,'M41/notes/ease_curve_validation.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({PASS:true,headings:11,deterministic:report.deterministic,example:results.filter(r=>r.degrees===90).map(r=>({ease:r.ease,gaps:r.samples.map(s=>({ms:Math.round(s.age*1000),px:s.gapPx}))}))}));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});

