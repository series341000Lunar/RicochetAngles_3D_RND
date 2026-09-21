const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..'),out=path.join(root,'Docs/focus_v2');
fs.mkdirSync(out,{recursive:true});
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:720}}),errors=[];
p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.location().url.endsWith('/favicon.ico'))errors.push(m.text());});
await p.addInitScript(()=>window.requestAnimationFrame=()=>0);
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
await p.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&rendererSpike.roleTemplates.size===5,{},{polling:100});
const checks=await p.evaluate(()=>{
const c={},check=(k,v)=>c[k]=!!v,F=rendererSpike.focusMaterial;
window.v2Aim=(id,charge=.35)=>{
const a=id==='boss'?game.boss:game.rndActors.find(a=>a.id===id);
input.contourPointerInside=true;input.mouseScreenX=a.x-camera.x;input.mouseScreenY=a.y-camera.y;
input.keys.shift=charge>0;game.precisionAim.charge=0;updateTimeModeTimers(charge);updateTargetContourSelection();updatePrecisionXray();render();
};
resetGame();render();
const refs=new Map();for(const [id,v]of rendererSpike.roleVisuals){const arr=[];v.root.traverse(m=>{if(m.isMesh)arr.push([m,m.material]);});refs.set(id,arr);}
const restored=id=>refs.get(id).every(([m,mat])=>m.material===mat);
v2Aim('panzer',.175);check('half_charge',Math.abs(F.state.strength-.5)<1e-6);
v2Aim('panzer');check('ready_full',game.precisionAim.ready&&F.state.strength===1);
check('all_panzer_meshes',refs.get('panzer').every(([m,mat])=>m.material!==mat));
check('V1_contour',rendererSpike.targetContour.state.targetId==='panzer');
v2Aim('pak');check('A_restored_B_focused',restored('panzer')&&F.state.targetId==='pak');
v2Aim('pak',0);check('shift_release_exact',restored('pak')&&F.state.strength===0);
v2Aim('boss');input.contourPointerInside=false;updateTargetContourSelection();render();check('target_lost_restore',restored('boss'));
v2Aim('boss');const before=JSON.stringify(game);for(let i=0;i<10;i++)render();check('renderer_game_state_unchanged',before===JSON.stringify(game));
const count=F.state.variantsCreated,compile=F.state.compiles;for(let i=0;i<30;i++)render();check('no_frame_allocation_or_compile',count===F.state.variantsCreated&&compile===F.state.compiles);
document.getElementById('spikeMode').click();check('canvas_restores',restored('boss')&&!rendererSpike.enabled);
render();document.getElementById('spikeMode').click();render();check('return_3D',rendererSpike.enabled&&F.state.targetId==='boss');
rendererSpike.enabled=false;render();check('disabled_restores',restored('boss'));rendererSpike.enabled=true;render();
game.timeMode='BULLET_TIME';game.bulletTime.remaining=2;updateTimeModeTimers(.1);render();check('BT_existing_focus_rule',F.state.strength===0);
game.timeMode='NORMAL';v2Aim('boss');game.timeMode='SKILL_TARGETING';updateTargetContourSelection();render();check('Q_clears',F.state.targetId===null);game.timeMode='NORMAL';
v2Aim('truck');check('glass_preserved',refs.get('truck').every(([m,o])=>m.material.opacity===o.opacity&&m.material.transparent===o.transparent&&m.material.depthWrite===o.depthWrite&&m.material.blending===o.blending&&m.material.side===o.side));v2Aim('truck',0);check('glass_restore',restored('truck'));
v2Aim('pak');game.rndActors.find(a=>a.id==='pak').alive=false;updateTargetContourSelection();render();check('death_restore_cleanup',restored('pak')&&!rendererSpike.roleVisuals.has('pak'));
v2Aim('panzer');game.rndActors=game.rndActors.filter(a=>a.id!=='panzer');updateTargetContourSelection();render();check('despawn_restore_cleanup',restored('panzer')&&!rendererSpike.roleVisuals.has('panzer'));
v2Aim('boss');resetGame();render();check('restart_clears',F.state.targetId===null);
v2Aim('boss');rendererSpike.roleConfig.bossScale=1;render();rendererSpike.roleConfig.bossScale=2;render();check('scale_change',F.state.targetId==='boss');
return c;
});
for(const [file,id,focus,angle]of [
['V2_A_75_Panzer_normal','panzer',false,75],['V2_B_75_Panzer_focus','panzer',true,75],
['V2_C_75_Pak_normal','pak',false,75],['V2_D_75_Pak_focus','pak',true,75],
['V2_E_75_Boss_normal','boss',false,75],['V2_F_75_Boss_focus','boss',true,75],
['V2_G_90_Boss_focus','boss',true,90],['V2_H_45_Boss_focus_diagnostic','boss',true,45],
['V2_I_60_Boss_focus','boss',true,60],['V2_J_75_Kubelwagen_focus','truck',true,75]]){
await p.evaluate(({id,focus,angle})=>{let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};resetGame();rendererSpike.config.cameraElevation=angle;document.getElementById('spikeAngle').value=String(angle);v2Aim(id,focus?.35:0);},{id,focus,angle});
await p.screenshot({path:path.join(out,file+'.png')});
}
const perf=[];
for(const [label,id,on]of [['OFF','boss',false],['ON_Panzer','panzer',true],['ON_Tiger2','boss',true]]){
await p.evaluate(({id,on})=>{resetGame();rendererSpike.config.cameraElevation=75;v2Aim(id,on?.35:0);},{id,on});
const r=await p.evaluate(async()=>{
const F=rendererSpike.focusMaterial;for(let i=0;i<10;i++)render();
const alloc=F.state.variantsCreated,comp=F.state.compiles,start=performance.now();
for(let i=0;i<120;i++){render();await new Promise(r=>setTimeout(r,0));}
return {fps:120000/(performance.now()-start),calls:rendererSpike.renderer.info.render.calls,triangles:rendererSpike.renderer.info.render.triangles,programs:rendererSpike.renderer.info.programs.length,noAlloc:F.state.variantsCreated===alloc,noCompile:F.state.compiles===comp};
});perf.push({label,...r});
}
const result={checks,perf,errors,pass:Object.values(checks).every(Boolean)&&!errors.length};
fs.writeFileSync(path.join(root,'Docs/focus_v2_validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
