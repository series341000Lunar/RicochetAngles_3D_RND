const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:720}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>window.requestAnimationFrame=()=>0);await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');await p.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&rendererSpike.roleTemplates.size===5,{},{polling:100});
const checks=await p.evaluate(()=>{
const c={};const check=(k,v)=>c[k]=!!v;resetGame();
function aim(a){input.contourPointerInside=true;input.mouseScreenX=a.x-camera.x;input.mouseScreenY=a.y-camera.y;updateTargetContourSelection();render();}
for(const a of [game.boss,...game.rndActors]){aim(a);const id=a===game.boss?'boss':a.id;check(id+'_selected',game.targetContourTargetId===id&&rendererSpike.targetContour.state.targetId===id&&rendererSpike.targetContour.state.meshCount>0);}
aim(game.player);check('player_excluded',game.targetContourTargetId===null);
input.mouseScreenX=1100;input.mouseScreenY=150;updateTargetContourSelection();render();check('empty_clears',game.targetContourTargetId===null&&rendererSpike.targetContour.state.meshCount===0);
aim(game.boss);const state=JSON.stringify(game);for(let i=0;i<5;i++)render();check('renderer_read_only',state===JSON.stringify(game));
rendererSpike.roleConfig.bossScale=1;rendererSpike.config.cameraElevation=45;render();check('visual_scale_angle_do_not_pick',game.targetContourTargetId==='boss'&&state===JSON.stringify(game));
game.boss.alive=false;updateTargetContourSelection();render();check('death_clears',game.targetContourTargetId===null&&rendererSpike.targetContour.state.targetId===null);
resetGame();aim(game.rndActors[0]);game.rndActors=[];updateTargetContourSelection();render();check('removal_clears',game.targetContourTargetId===null);
resetGame();aim(game.boss);input.contourPointerInside=false;updateTargetContourSelection();render();check('pointer_exit_clears',game.targetContourTargetId===null);
aim(game.boss);game.timeMode='SKILL_TARGETING';updateTargetContourSelection();check('Q_targeting_excluded',game.targetContourTargetId===null);
game.timeMode='BULLET_TIME';updateTargetContourSelection();check('BT_allowed',game.targetContourTargetId==='boss');
game.timeMode='NORMAL';input.keys.shift=true;updateTimeModeTimers(.36);updatePrecisionXray();check('focus_preserved',game.precisionAim.ready&&!!game.precisionXray.analysis);
resetGame();check('restart_clears',game.targetContourTargetId===null);
rendererSpike.roleConfig.bossScale=2;rendererSpike.config.cameraElevation=75;
aim(game.boss);return c;
});
const dir=path.join(root,'Docs/contour_v1');fs.mkdirSync(dir,{recursive:true});
await p.screenshot({path:path.join(dir,'Boss_75.png')});
for(const id of ['panzer','truck','pak']){await p.evaluate(id=>{const a=game.rndActors.find(a=>a.id===id);input.contourPointerInside=true;input.mouseScreenX=a.x-camera.x;input.mouseScreenY=a.y-camera.y;updateTargetContourSelection();render();},id);await p.screenshot({path:path.join(dir,id+'_75.png')});}
await p.mouse.move(955,360);await p.evaluate(()=>{updateTargetContourSelection();render();});
checks.real_mouse_input=await p.evaluate(()=>game.targetContourTargetId==='boss');
await p.mouse.move(1250,690);await p.evaluate(()=>{updateTargetContourSelection();render();});
checks.panel_hover_clears=await p.evaluate(()=>game.targetContourTargetId===null);
await p.evaluate(()=>{input.contourPointerInside=true;input.mouseScreenX=955;input.mouseScreenY=360;updateTargetContourSelection();rendererSpike.config.cameraElevation=90;render();});
await p.screenshot({path:path.join(dir,'Boss_90.png')});
const result={checks,errors,pass:Object.values(checks).every(Boolean)&&!errors.length};
fs.writeFileSync(path.join(root,'Docs/contour_v1_validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
