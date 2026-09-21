const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),root=path.resolve(__dirname,'..'),out=path.join(root,'Docs/bloom_v5');fs.mkdirSync(out,{recursive:true});
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:720}}),errors=[],checks={};
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});
await p.addInitScript(()=>{window.nativeRAF=requestAnimationFrame.bind(window);requestAnimationFrame=()=>0;});
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
await p.waitForFunction(()=>window.rndStartup?.state==='READY',{}, {polling:100});await p.locator('#startupStart').click();
await p.evaluate(()=>{
window.clock5=1000;performance.now=()=>clock5;
window.fixture5=(scenario='player',enabled=false,angle=75,toon=false)=>{
let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
resetGame();input.keys={};input.fire=false;game.player.x=500;game.player.turretAngle=0;game.boss.turretAngle=Math.PI;
rendererSpike.config.cameraElevation=angle;const g=rendererSpike.worldGrade;g.config.enabled=false;g.toon.config.enabled=toon;g.bloom.config.enabled=enabled;
input.contourPointerInside=true;input.mouseScreenX=955;input.mouseScreenY=360;updateTargetContourSelection();
if(scenario==='focus'||scenario==='focusIdle'){game.precisionAim.charge=.35;}
render();
if(scenario==='player')fireShell(game.player,'player');
if(scenario==='boss'||scenario==='focus')fireShell(game.boss,'boss');
if(scenario==='q'){game.timeMode='SKILL_TARGETING';confirmGeneralSkillTarget();}
if(['player','boss','focus'].includes(scenario)){clock5+=75;game.time+=.0075;}
render();document.getElementById('spikePanel').style.visibility='hidden';
};
});
const first=await p.evaluate(()=>{
const g=rendererSpike.worldGrade,r=rendererSpike.renderer,c={};c.defaults=!g.bloom.config.enabled;
const programs=r.info.programs.length,textures=r.info.memory.textures,rows=[];
for(const scenario of ['idle','player','boss','q','focus']){
fixture5(scenario,true);const t=performance.timeOrigin; // clock is fixed; real timing captured below separately.
rows.push({scenario,programs:r.info.programs.length,textures:r.info.memory.textures,active:g.bloom.state.activeSources});
}
c.firstUsePrograms=rows.every(x=>x.programs===programs);c.firstUseTextures=rows.every(x=>x.textures===textures);
c.glowTextureBound=g.bloom.composite.uniforms.bloomTexture.value===g.bloom.glow.texture;
c.explicitRegistry=g.bloom.registry.size===34&&[...g.bloom.registry.values()].every(e=>['playerFlash','bossFlash','qShell'].includes(e.kind));
c.idleEmpty=rows[0].active===0;c.qSix=rows[3].active===6;
return {checks:c,rows,programs,textures};});
Object.assign(checks,first.checks);
const cases=[['A_Player_Bloom_OFF','player',false,75,false],['B_Player_Bloom_ON','player',true,75,false],['C_Boss_Bloom_OFF','boss',false,75,false],['D_Boss_Bloom_ON','boss',true,75,false],['E_Q_Bloom_OFF','q',false,75,false],['F_Q_Bloom_ON','q',true,75,false],['G_Focus_Boss_Bloom','focus',true,75,true],['H_45_Bloom_diagnostic','focus',true,45,true],['I_90_Bloom','focus',true,90,true],['J_Toon_Player','player',true,75,true],['K_Focus_noFX','focusIdle',true,75,true],['L_Focus_noFX_OFF','focusIdle',false,75,true]];
const hud={};
for(const [name,scenario,on,angle,toon]of cases){await p.evaluate(v=>fixture5(...v),[scenario,on,angle,toon]);hud[name]=await p.evaluate(()=>document.getElementById('game').toDataURL());await p.screenshot({path:path.join(out,'V5_'+name+'.png')});}
await p.evaluate(()=>{fixture5('focusIdle',true,75,true);rendererSpike.worldGrade.bloom.config.strength=0;render();});
await p.screenshot({path:path.join(out,'V5_M_Zero_Strength.png')});
await p.evaluate(()=>{rendererSpike.worldGrade.bloom.config.strength=.6;render();});
await p.screenshot({path:path.join(out,'V5_N_No_Eligible_Source.png')});
await p.evaluate(()=>{fixture5('player',true);rendererSpike.worldGrade.bloom.config.strength=0;render();});
await p.screenshot({path:path.join(out,'V5_O_Player_Zero_Strength.png')});
const glowCenter=await p.evaluate(()=>{const mesh=rendererSpike.muzzleBridge.flash;const pos=mesh.getWorldPosition(mesh.position.clone()).project(rendererSpike.view);rendererSpike.worldGrade.bloom.config.strength=.6;render();return {x:(pos.x+1)*640,y:(1-pos.y)*360};});
await p.screenshot({path:path.join(out,'V5_P_Player_Active_Strength.png')});
fs.writeFileSync(path.join(out,'V5_glow_center.json'),JSON.stringify(glowCenter));
checks.hudExact=hud.A_Player_Bloom_OFF===hud.B_Player_Bloom_ON&&hud.C_Boss_Bloom_OFF===hud.D_Boss_Bloom_ON&&hud.E_Q_Bloom_OFF===hud.F_Q_Bloom_ON;
Object.assign(checks,await p.evaluate(()=>{
const c={},g=rendererSpike.worldGrade,b=g.bloom,r=rendererSpike.renderer;
fixture5('player',true);game.player.alive=false;render();c.playerDeath=b.state.activeSources===0;
fixture5('boss',true);game.boss.alive=false;render();c.bossDeath=b.state.activeSources===0;
fixture5('boss',true);game.time+=.3;clock5+=300;render();c.lifetime=b.state.activeSources===0;
fixture5('q',true);resetGame();render();c.restart=b.state.activeSources===0&&rndStartup.prewarmRuns===1;
const black=new Uint16Array(b.glow.width*b.glow.height*4);r.readRenderTargetPixels(b.glow,0,0,b.glow.width,b.glow.height,black);c.cleared=black.every((v,i)=>i%4===3||v===0);
fixture5('focus',true);input.mouseScreenX=600;input.mouseScreenY=195;updateTargetContourSelection();render();c.targetSwitch=game.targetContourTargetId==='panzer';
const before=JSON.stringify(game);render();c.readonly=JSON.stringify(game)===before;
document.getElementById('spikeMode').click();render();c.canvas=!rendererSpike.enabled;document.getElementById('spikeMode').click();resetGame();render();c.returnClean=b.state.activeSources===0;
r.setSize(1024,576,false);render();c.resize=b.state.width===512&&b.state.height===288;
r.setPixelRatio(1.5);render();c.DPR=b.state.width===768&&b.state.height===432;r.setPixelRatio(1);r.setSize(1280,720,false);render();
const traces=[];
for(const enabled of [false,true]){
fixture5('idle',enabled);const a=[];
for(let i=0;i<600;i++){input.keys={w:i<120,shift:i>=200&&i<280};input.fire=i%90<20;if(i===300){game.timeMode='SKILL_TARGETING';confirmGeneralSkillTarget();}if(i===410){game.timeMode='BULLET_TIME';game.bulletTime.remaining=1;}clock5+=1000/60;rndStep(1/60);render();a.push(JSON.stringify(game));}
traces.push(a);}
c.deterministic600=traces[0].every((v,i)=>v===traces[1][i]);
return c;
}));
await p.evaluate(()=>{document.getElementById('spikePanel').style.visibility='visible';resetGame();render();});
await p.locator('#bloomEnabled').check();await p.locator('#bloom_strength').fill('0.7');await p.locator('#bloom_radius').fill('0.3');await p.locator('#bloom_threshold').fill('1');
checks.UI=await p.evaluate(()=>{const c=rendererSpike.worldGrade.bloom.config;return c.enabled&&c.strength===.7&&c.radius===.3&&c.threshold===1;});
const result={checks,firstUse:first,errors,pass:Object.values(checks).every(Boolean)&&!errors.length};
fs.writeFileSync(path.join(root,'Docs/V5_validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
