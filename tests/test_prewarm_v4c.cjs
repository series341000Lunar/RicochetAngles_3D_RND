const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:720}}),errors=[],checks={};
p.on('pageerror',e=>errors.push(e.message));
p.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});
await p.route('**/*.glb',async route=>{await new Promise(r=>setTimeout(r,400));await route.continue();});
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
const initial=await p.evaluate(()=>JSON.stringify(game));
checks.loading=await p.evaluate(()=>rndStartup.state==='LOADING'&&document.getElementById('startupStart').disabled);
await p.keyboard.press('q');await p.keyboard.press('r');await p.keyboard.down('w');
await p.waitForFunction(()=>rndStartup.state==='READY'||rndStartup.error,{}, {polling:100});
checks.ready=await p.evaluate(()=>rndStartup.state==='READY'&&rndStartup.isolation&&rendererSpike.roleTemplates.size===5&&!!rendererSpike.glb);
checks.unchanged=initial===await p.evaluate(()=>JSON.stringify(game));
await p.screenshot({path:path.join(root,'Docs/V4C_READY.png')});
checks.hidden=await p.evaluate(()=>getComputedStyle(document.getElementById('game')).visibility==='hidden'&&getComputedStyle(document.getElementById('world3d')).visibility==='hidden');
await p.locator('#startupStart').focus();await p.keyboard.press('r');await p.keyboard.press('Tab');
checks.menuKeyboardIsolation=initial===await p.evaluate(()=>JSON.stringify(game));
await p.locator('#startupStart').click();await p.keyboard.up('w');await p.waitForTimeout(100);
checks.playing=await p.evaluate(()=>rndStartup.state==='PLAYING'&&game.time>0&&getComputedStyle(document.getElementById('startupGate')).display==='none');
await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await p.waitForTimeout(40);
const details=await p.evaluate(()=>{
const g=rendererSpike.worldGrade,r=rendererSpike.renderer,c={};
c.defaults=!g.config.enabled&&!g.toon.config.enabled&&g.config.tone==='None'&&g.toon.config.mode==='Numeric 4';
c.camera=rendererSpike.config.cameraElevation===75&&r.shadowMap.enabled;
const programs=r.info.programs.length,random=Math.random;let randomCalls=0;Math.random=()=>{randomCalls++;return random();};
render();c.renderRandomUntouched=randomCalls===0;Math.random=random;
const uses=[];
function measure(label,fn){const st=performance.now();fn();render();r.getContext().finish();uses.push({label,ms:performance.now()-st,programs:r.info.programs.length});}
measure('player',()=>fireShell(game.player,'player'));
measure('boss',()=>fireShell(game.boss,'boss'));
measure('contour',()=>{input.contourPointerInside=true;input.mouseScreenX=955;input.mouseScreenY=360;updateTargetContourSelection();});
measure('focus',()=>{game.precisionAim.charge=.35;});
measure('Q',()=>{game.timeMode='SKILL_TARGETING';confirmGeneralSkillTarget();});
c.qShells=game.playerArtillery.length===6&&rendererSpike.qVisuals.size===6;
measure('numeric4',()=>{g.toon.config.enabled=true;});
measure('grade',()=>{g.config.enabled=true;});
c.noNewPrograms=uses.every(v=>v.programs===programs);
const runs=rndStartup.prewarmRuns;resetGame();render();c.restart=rndStartup.prewarmRuns===runs&&rndStartup.state==='PLAYING'&&game.shells.length===0;
const traces=[];
for(const post of [false,true]){
let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};resetGame();g.config.enabled=post;g.toon.config.enabled=post;const a=[];
for(let i=0;i<600;i++){input.keys={w:i<120,shift:i>=200&&i<280};input.fire=i%90<20;rndStep(1/60);render();a.push(JSON.stringify(game));}traces.push(a);
}
Math.random=random;c.deterministic600=traces[0].every((v,i)=>v===traces[1][i]);
return {checks:c,uses,startup:rndStartup};
});
Object.assign(checks,details.checks);
await p.evaluate(()=>{resetGame();rendererSpike.worldGrade.config.enabled=false;rendererSpike.worldGrade.toon.config.enabled=false;render();});
await p.screenshot({path:path.join(root,'Docs/V4C_PLAYING.png')});
const result={checks,uses:details.uses,startup:details.startup,errors,pass:Object.values(checks).every(Boolean)&&!errors.length};
fs.writeFileSync(path.join(root,'Docs/V4C_validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
