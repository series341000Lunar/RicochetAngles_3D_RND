const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'Docs/focus_v2b');fs.mkdirSync(out,{recursive:true});
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks={},pages={};
for(const name of ['V2','A','B','C']){
 const p=await b.newPage({viewport:{width:1280,height:720}});pages[name]=p;
 p.on('pageerror',e=>errors.push(name+': '+e.message));
 p.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(name+': '+m.text());});
 await p.addInitScript(()=>window.requestAnimationFrame=()=>0);
 await p.route('**/rnd_focus_material.js',route=>{
  let s=fs.readFileSync(path.join(root,'spike',name==='V2'?'rnd_focus_material.before_v2b.js':'rnd_focus_material.js'),'utf8');
  if(name==='A')s=s.replace('interior:0.22,rim:1.0,power:2.0','interior:0.25,rim:1.0,power:2.4').replace('1.25 * pow','1.15 * pow');
  if(name==='C')s=s.replace('interior:0.22,rim:1.0,power:2.0','interior:0.18,rim:1.0,power:2.8');
  return route.fulfill({contentType:'text/javascript',body:s});
 });
 if(name==='V2')await p.route('**/rnd_gameplay.js',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,'spike/rnd_gameplay.before_v2b.js'),'utf8')}));
 await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
 await p.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&rendererSpike.roleTemplates.size===5,{},{polling:100});
 await p.evaluate(()=>{
  window.fixture=(id='boss',angle=75,focus=true)=>{
   let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
   resetGame();input.fire=false;input.keys={shift:focus};rendererSpike.config.cameraElevation=angle;
   document.getElementById('spikeAngle').value=String(angle);
   const a=id==='boss'?game.boss:game.rndActors.find(a=>a.id===id);
   input.mouseWorldX=a.x;input.mouseWorldY=a.y;input.contourPointerInside=true;input.mouseScreenX=a.x-camera.x;input.mouseScreenY=a.y-camera.y;
   updateTimeModeTimers(.35);updateTargetContourSelection();updatePrecisionXray();render();
   document.getElementById('spikeStatus').textContent='Paused matched-pose comparison';
  };
 });
 for(const id of ['boss','panzer','pak']){
  await p.evaluate(id=>fixture(id),id);await p.screenshot({path:path.join(out,name+'_'+id+'_75.png')});
 }
}
const p=pages.B;
for(const [file,id,angle] of [['V2B_A_75_Panzer_focus','panzer',75],['V2B_B_75_Pak_focus','pak',75],['V2B_C_75_Boss_focus','boss',75],['V2B_E_90_Boss_focus','boss',90],['V2B_F_45_Boss_focus','boss',45]]){
 await p.evaluate(({id,angle})=>fixture(id,angle),{id,angle});await p.screenshot({path:path.join(out,file+'.png')});
}
await p.evaluate(()=>{fixture();document.getElementById('spikePanel')?.style.setProperty('display','none');});
const panels=await p.evaluate(()=>[...document.querySelectorAll('body > div')].map(d=>({id:d.id,class:d.className})));
await p.screenshot({path:path.join(out,'V2B_D_75_Boss_focus_cleanUI.png')});
fs.copyFileSync(path.join(out,'V2_boss_75.png'),path.join(out,'V2_compare_before.png'));
fs.copyFileSync(path.join(out,'B_boss_75.png'),path.join(out,'V2_compare_after.png'));
Object.assign(checks,await p.evaluate(()=>{
 fixture();const c={},oldStroke=ctx.strokeRect;let boxes=0;
 ctx.strokeRect=function(...a){if(this.strokeStyle==='#7bffc3')boxes++;return oldStroke.apply(this,a);};
 render();c.green_box_default_OFF=boxes===0;
 const checkbox=document.getElementById('roleDebug');checkbox.checked=true;checkbox.dispatchEvent(new Event('change'));render();c.green_box_debug_available=boxes>0;
 checkbox.checked=false;checkbox.dispatchEvent(new Event('change'));ctx.strokeRect=oldStroke;
 const state=JSON.stringify(game);render();c.render_read_only=JSON.stringify(game)===state;
 c.contour_and_focus_same_target=rendererSpike.targetContour.state.targetId==='boss'&&rendererSpike.focusMaterial.state.targetId==='boss';
 c.weakpoint_analysis_retained=!!game.precisionXray.analysis;return c;
}));
const states={},normal={};
for(const name of ['V2','B']){
 const page=pages[name];await page.evaluate(()=>{document.getElementById('spikePanel').style.display='';fixture('boss',75,false);});
 await page.screenshot({path:path.join(out,'normal_'+name+'.png')});
 normal[name]=crypto.createHash('sha256').update(await page.screenshot({clip:{x:0,y:0,width:1280,height:550}})).digest('hex');
 states[name]=await page.evaluate(()=>{
 fixture();game.obstacles=[];game.player.hp=100;
 const trace=[];for(let i=0;i<600;i++){
 input.keys={w:i<120,d:i>=120&&i<170,shift:i>=200&&i<280};input.fire=i%90<20;
 if(i===300){game.timeMode='SKILL_TARGETING';confirmGeneralSkillTarget();}
 if(i===410){game.timeMode='BULLET_TIME';game.bulletTime.remaining=1;}
 rndStep(1/60);render();trace.push(JSON.stringify(game));
 }return trace;
 });
}
checks.gameplay600_exact=states.V2.every((s,i)=>s===states.B[i]);checks.normal_pixels_exact=normal.V2===normal.B;
const result={checks,errors,panels,normal,pass:Object.values(checks).every(Boolean)&&!errors.length};
fs.writeFileSync(path.join(root,'Docs/focus_v2b_validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});