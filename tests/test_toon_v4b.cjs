const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),out=path.join(root,'Docs/toon_v4b');fs.mkdirSync(out,{recursive:true});
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true}),errors=[],checks={},pages={};
for(const baseline of [false,true]){
const p=await b.newPage({viewport:{width:1280,height:720}});pages[baseline?'before':'after']=p;
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});
await p.addInitScript(()=>window.requestAnimationFrame=()=>0);
if(baseline)await p.route('**/rnd_world_grade.js',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,'spike/rnd_world_grade.before_v4b.js'),'utf8')}));
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
await p.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&rendererSpike.roleTemplates.size===5,{},{polling:100});
if(!baseline){await p.evaluate(()=>rendererSpike.worldGrade.toon.ready);checks.default_off=await p.evaluate(()=>!rendererSpike.worldGrade.config.enabled&&!rendererSpike.worldGrade.toon.config.enabled&&!document.getElementById('postEnabled').checked&&!document.getElementById('toonEnabled').checked);}
await p.evaluate(()=>{
window.clock4=1000;performance.now=()=>clock4;
window.fixture=(mode='T_Lut_03',strength=.6,scenario='contour',tone='ACES',angle=75)=>{
let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
resetGame();input.keys={shift:scenario==='focus'};input.fire=false;game.player.x=500;game.player.hp=100;game.player.turretAngle=0;
rendererSpike.config.cameraElevation=angle;
const g=rendererSpike.worldGrade;g.preset('Neutral');g.config.enabled=true;g.config.tone=tone;
if(g.toon)Object.assign(g.toon.config,{enabled:true,mode,strength,filter:'Nearest'});
input.contourPointerInside=true;input.mouseScreenX=955;input.mouseScreenY=360;input.mouseWorldX=955;input.mouseWorldY=1800;
updateTimeModeTimers(.35);updateTargetContourSelection();updatePrecisionXray();render();
if(scenario==='player'||scenario==='boss')fireShell(scenario==='player'?game.player:game.boss,scenario==='player'?'player':'boss');
if(scenario==='q'){game.timeMode='SKILL_TARGETING';input.mouseScreenX=700;input.mouseScreenY=330;updateRndTargetPoints();confirmGeneralSkillTarget();game.time+=.2;updatePlayerArtillery(.2);}
game.shake=0;document.getElementById('spikePanel').style.display='none';render();
};
});
}
const p=pages.after;
const capture=async(file,mode,strength,scenario='contour',tone='ACES',angle=75)=>{
await p.evaluate(args=>fixture(...args),[mode,strength,scenario,tone,angle]);await p.screenshot({path:path.join(out,file+'.png')});
};
for(const [file,mode,strength]of [
['V4B_A_Toon_OFF','T_Lut_03',0],['V4B_B_T_Lut_03_100','T_Lut_03',1],['V4B_C_T_Lut_03_60','T_Lut_03',.6],
['V4B_D_Numeric3','Numeric 3',1],['V4B_E_Numeric4','Numeric 4',1],['V4B_F_Numeric5','Numeric 5',1]])await capture(file,mode,strength);
for(const [scenario,letter]of [['focus','G_Focus'],['player','H_PlayerMuzzle'],['boss','I_BossMuzzle'],['q','J_QShell']])await capture('V4B_'+letter,'T_Lut_03',.6,scenario);
for(const tone of ['None','ACES','Cineon','Reinhard'])await capture('tone_'+tone,'T_Lut_03',.6,'contour',tone);
for(const angle of [90,45])await capture('camera_'+angle,'T_Lut_03',.6,'focus','ACES',angle);
for(const strength of [.4,.8])await capture('ramp_'+strength,'T_Lut_03',strength);
await capture('numeric5_60','Numeric 5',.6);
await p.evaluate(()=>{fixture();rendererSpike.worldGrade.toon.config.filter='Linear';render();});await p.screenshot({path:path.join(out,'ramp_linear_60.png')});
const hashes={};
for(const [name,page]of Object.entries(pages)){
for(const enabled of [false,true]){
await page.evaluate(enabled=>{fixture('T_Lut_03',0);rendererSpike.worldGrade.config.enabled=enabled;render();},enabled);
const png=await page.screenshot();fs.writeFileSync(path.join(out,name+'_'+enabled+'.png'),png);
hashes[name+'_'+enabled]=crypto.createHash('sha256').update(png).digest('hex');
}
}
checks.V4A_off_exact=hashes.before_false===hashes.after_false;checks.V4A_on_toon_zero_exact=hashes.before_true===hashes.after_true;
Object.assign(checks,await p.evaluate(()=>{
fixture();const g=rendererSpike.worldGrade,t=g.toon,c={};c.ramp_loaded=t.state.loaded&&t.state.width===256&&t.state.height===32;
c.pass_order=g.composer.passes.indexOf(g.output)<g.composer.passes.indexOf(t.pass)&&g.composer.passes.indexOf(t.pass)<g.composer.passes.indexOf(g.grade);
const state=JSON.stringify(game),hud=canvas.toDataURL();
for(const mode of ['T_Lut_03','Numeric 3','Numeric 4','Numeric 5']){t.config.mode=mode;render();}
c.render_readonly=state===JSON.stringify(game);c.HUD_identical=canvas.toDataURL()===hud;
document.getElementById('toonMode').value='Numeric 4';document.getElementById('toonMode').dispatchEvent(new Event('change'));
document.getElementById('toonThresholds').value='.25,.5,.75';document.getElementById('toonLevels').value='.15,.4,.7,1';document.getElementById('toonApply').click();
c.numeric_edit=t.numeric['Numeric 4'].thresholds[0]===.25;
document.getElementById('toonThresholds').value='.8,.2';document.getElementById('toonApply').click();c.invalid_edit_rejected=t.numeric['Numeric 4'].thresholds[0]===.25;
const slider=document.getElementById('toonStrength');slider.value=.4;slider.dispatchEvent(new Event('input'));c.strength_UI=t.config.strength===.4;
rendererSpike.renderer.setPixelRatio(1.5);render();c.DPR=g.info.width===1920&&g.info.height===1080;
rendererSpike.renderer.setSize(960,540,false);render();c.resize=g.info.width===1440&&g.info.height===810;
rendererSpike.renderer.setPixelRatio(1);rendererSpike.renderer.setSize(1280,720,false);render();
document.getElementById('spikeMode').click();render();c.canvas=!rendererSpike.enabled;document.getElementById('spikeMode').click();render();c.three_return=rendererSpike.enabled&&rendererSpike.renderer.getRenderTarget()===null;
resetGame();render();c.restart=rendererSpike.roleVisuals.size===4;
const traces={};for(const mode of ['bypass','post','toon']){fixture();g.config.enabled=mode!=='bypass';t.config.enabled=mode==='toon';const a=[];
for(let i=0;i<600;i++){input.keys={w:i<120,shift:i>=200&&i<280};input.fire=i%90<20;if(i===300){game.timeMode='SKILL_TARGETING';confirmGeneralSkillTarget();}if(i===410){game.timeMode='BULLET_TIME';game.bulletTime.remaining=1;}clock4+=1000/60;rndStep(1/60);render();a.push(JSON.stringify(game));}traces[mode]=a;}
c.deterministic600=traces.bypass.every((s,i)=>s===traces.post[i]&&s===traces.toon[i]);
return c;
}));
const result={checks,hashes,errors,pass:Object.values(checks).every(Boolean)&&!errors.length};
fs.writeFileSync(path.join(root,'Docs/toon_v4b_validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
