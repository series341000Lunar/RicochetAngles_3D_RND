const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..'),out=path.join(root,'Docs/tone_v4a');fs.mkdirSync(out,{recursive:true});
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:720}}),errors=[],checks={};
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});
await p.addInitScript(()=>window.requestAnimationFrame=()=>0);
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
await p.waitForFunction(()=>window.rendererSpike&&rendererSpike.worldGrade&&rendererSpike.glb&&rendererSpike.roleTemplates.size===5,{},{polling:100});
await p.evaluate(()=>{
window.clock4=1000;performance.now=()=>clock4;
window.fixture=(mode='None',scenario='normal',angle=75)=>{
let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
resetGame();input.keys={shift:scenario==='focus'};input.fire=false;game.player.x=500;game.player.hp=100;game.player.turretAngle=0;
rendererSpike.config.cameraElevation=angle;document.getElementById('spikeAngle').value=String(angle);
const g=rendererSpike.worldGrade;g.preset('Neutral');g.config.enabled=true;g.config.tone=mode;
input.contourPointerInside=scenario!=='normal';input.mouseScreenX=955;input.mouseScreenY=360;input.mouseWorldX=955;input.mouseWorldY=1800;
updateTimeModeTimers(.35);updateTargetContourSelection();updatePrecisionXray();render();
if(scenario==='player'||scenario==='boss')fireShell(scenario==='player'?game.player:game.boss,scenario==='player'?'player':'boss');
if(scenario==='q'||scenario==='impact'){game.timeMode='SKILL_TARGETING';input.mouseScreenX=700;input.mouseScreenY=330;updateRndTargetPoints();confirmGeneralSkillTarget();game.time+=scenario==='q'?.2:.5;updatePlayerArtillery(scenario==='q'?.2:.5);}
game.shake=0;render();document.getElementById('spikeStatus').textContent='Matched fixture — '+mode+' / '+scenario;
};
});
for(const [mode,letter]of [['None','A_Neutral'],['ACES','B_ACES'],['Cineon','C_Cineon'],['Reinhard','D_Reinhard']]){
for(const scenario of ['normal','contour','focus','player','boss','q','impact']){
await p.evaluate(({mode,scenario})=>fixture(mode,scenario),{mode,scenario});
await p.screenshot({path:path.join(out,scenario==='normal'?'V4A_'+letter+'.png':mode+'_'+scenario+'.png')});
}
}
for(const [scenario,name]of [['focus','V4A_E_ACES_Focus'],['player','V4A_F_ACES_PlayerMuzzle'],['boss','V4A_G_ACES_BossMuzzle'],['q','V4A_H_ACES_QShell']])
fs.copyFileSync(path.join(out,'ACES_'+scenario+'.png'),path.join(out,name+'.png'));
for(const angle of [75,90,45]){await p.evaluate(angle=>{fixture('ACES','focus',angle);rendererSpike.worldGrade.preset('Cinematic A');render();},angle);await p.screenshot({path:path.join(out,'ACES_focus_'+angle+'.png')});}
for(const focus of [false,true]){
await p.evaluate(focus=>{fixture('None',focus?'focus':'contour');rendererSpike.worldGrade.config.enabled=false;render();},focus);
await p.screenshot({path:path.join(out,'baseline_'+focus+'.png')});
await p.evaluate(()=>{rendererSpike.worldGrade.config.enabled=true;render();});
await p.screenshot({path:path.join(out,'neutral_'+focus+'.png')});
}
Object.assign(checks,await p.evaluate(()=>{
const c={},g=rendererSpike.worldGrade;fixture('ACES','focus');
const state=JSON.stringify(game),mats=[];rendererSpike.scene.traverse(o=>{if(o.material)mats.push([o,o.material]);});
for(const mode of ['None','ACES','Cineon','Reinhard']){g.config.tone=mode;render();}
for(const preset of Object.keys(g.presets)){g.preset(preset);render();}
c.switch_game_readonly=state===JSON.stringify(game);c.no_material_recreation=mats.every(([o,m])=>o.material===m);
c.focus_contour=rendererSpike.focusMaterial.state.targetId==='boss'&&rendererSpike.targetContour.state.targetId==='boss';
rendererSpike.renderer.setPixelRatio(1.5);render();c.dpr=g.info.width===1920&&g.info.height===1080;
rendererSpike.renderer.setSize(960,540,false);render();c.target_resize=g.info.width===1440&&g.info.height===810;
rendererSpike.renderer.setPixelRatio(1);rendererSpike.renderer.setSize(1280,720,false);render();
document.getElementById('spikeMode').click();render();c.canvas=!rendererSpike.enabled;
document.getElementById('spikeMode').click();render();c.return3d=rendererSpike.enabled&&rendererSpike.renderer.getRenderTarget()===null;
game.boss.alive=false;updateTargetContourSelection();render();c.death=rendererSpike.focusMaterial.state.targetId===null;
resetGame();render();c.restart=rendererSpike.enabled&&rendererSpike.roleVisuals.size===4;
const serial={};
for(const enabled of [false,true]){fixture();g.config.enabled=enabled;const trace=[];
for(let i=0;i<600;i++){input.keys={w:i<120,shift:i>=200&&i<280};input.fire=i%90<20;if(i===300){game.timeMode='SKILL_TARGETING';confirmGeneralSkillTarget();}if(i===410){game.timeMode='BULLET_TIME';game.bulletTime.remaining=1;}clock4+=1000/60;rndStep(1/60);render();trace.push(JSON.stringify(game));}
serial[enabled]=trace;}
c.deterministic600=serial.false.every((s,i)=>s===serial.true[i]);return c;
}));
const result={checks,errors,pass:Object.values(checks).every(Boolean)&&!errors.length};fs.writeFileSync(path.join(root,'Docs/tone_v4a_validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
