const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1280,height:720}});
await p.addInitScript(()=>requestAnimationFrame=()=>0);await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');await p.waitForFunction(()=>window.rndStartup?.state==='READY',{}, {polling:100});await p.locator('#startupStart').click();
const result=await p.evaluate(()=>{
const rows=[],checks={};
for(const preset of ['LEGACY','TIGER_REMAP']){
tigerWeakpoints.setPreset(preset);
for(const side of [-1,1]){
Math.random=()=>.5;resetGame();game.obstacles=[];game.rndActors=[];const boss=game.boss;boss.angle=0;boss.turretAngle=0;boss.activeTriggerWeakpoint='cupola';
game.player.x=boss.x+200+TUNING.playerShellMuzzleDistance;game.player.y=boss.y+side*70;game.player.turretAngle=Math.PI;
fireShell(game.player,'player');for(let i=0;i<200&&game.shells.length;i++)updateShells(1/240);
rows.push({preset,side,left:boss.leftTrack.hp,right:boss.rightTrack.hp,hp:boss.hp,zone:game.lastHit?.zone});
}
resetGame();game.boss.activeTriggerWeakpoint='cupola';const t=getWeakpointTransform(game.boss,WEAKPOINT_DEFS.cupola),hp=game.boss.hp,barrage={id:1,bossTriggerApplied:false};
detonateRndHE({x:t.x,y:t.y,barrageId:1,pointIndex:0},barrage);
checks['Q_'+preset]=game.boss.weakpointState==='engineExposed'&&game.boss.hp===hp&&barrage.bossTriggerApplied;
}
checks.tracks=rows.every(v=>v.hp===10&&(v.side<0?v.left===1&&v.right===2:v.right===1&&v.left===2));
return {rows,checks};
});
await p.locator('#g1Preset').selectOption('LEGACY');await p.locator('#g1Debug').selectOption('OVERLAY');await p.locator('#g1Labels').uncheck();
result.checks.UI=await p.evaluate(()=>tigerWeakpoints.preset==='LEGACY'&&tigerWeakpoints.debug==='OVERLAY'&&!tigerWeakpoints.labels3D);
await p.locator('#g1Preset').selectOption('TIGER_REMAP');await p.keyboard.press('r');
result.checks.restart=await p.evaluate(()=>{render();return tigerWeakpoints.preset==='TIGER_REMAP'&&game.boss.hp===10&&rndStartup.prewarmRuns===1;});
result.pass=Object.values(result.checks).every(Boolean);fs.writeFileSync(path.join(root,'Docs/G1_interactions.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
