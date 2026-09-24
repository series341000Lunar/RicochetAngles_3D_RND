const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const out=path.resolve(__dirname,'../test-output/playable-env-recovery-20260925');
const url='http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html';
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:1600,height:900}});
const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>requestAnimationFrame=()=>0);
await p.goto(url);await p.waitForFunction(()=>rndStartup.state==='READY',null,{timeout:60000,polling:100});await p.locator('#startupStart').click();
await p.evaluate(()=>document.activeElement.blur());
const step=n=>p.evaluate(n=>{for(let i=0;i<n;i++){rndStep(1/60);render();}},n);
const snap=()=>p.evaluate(()=>({x:game.player.x,y:game.player.y,angle:game.player.angle,turret:game.player.turretAngle}));
const checks={};let a=await snap();
await p.keyboard.down('w');await step(40);await p.keyboard.up('w');let c=await snap();checks.W=c.x>a.x;
await p.keyboard.down('s');await step(100);await p.keyboard.up('s');a=await snap();checks.S=a.x<c.x;
// Reset the reverse coasting speed; Legacy deliberately reverses steering while backing up.
await p.keyboard.press('r');await step(1);a=await snap();
await p.keyboard.down('a');await step(20);await p.keyboard.up('a');c=await snap();checks.A=Math.atan2(Math.sin(c.angle-a.angle),Math.cos(c.angle-a.angle))<0;
await p.keyboard.down('d');await step(20);await p.keyboard.up('d');a=await snap();checks.D=Math.atan2(Math.sin(a.angle-c.angle),Math.cos(a.angle-c.angle))>0;
await p.mouse.move(700,280);await step(30);c=await snap();checks.mouseAim=c.turret!==a.turret;
await p.mouse.down();await step(1);checks.fire=await p.evaluate(()=>game.shells.some(s=>s.ownerFaction==='player'));await p.mouse.up();
await p.keyboard.down('Shift');await step(25);checks.Focus=await p.evaluate(()=>game.precisionAim.ready);await p.keyboard.up('Shift');
await p.keyboard.press('q');await step(1);checks.QTargeting=await p.evaluate(()=>game.timeMode==='SKILL_TARGETING');
await p.mouse.click(700,280);await step(1);checks.QConfirm=await p.evaluate(()=>game.playerArtillery.length>0||game.friendlyBarrages.length>0);
await step(110);checks.enemyBoss=await p.evaluate(()=>game.boss.timer>0||game.rndShots.panzer>0||game.rndShots.pak>0||game.boss.x!==955);
await p.keyboard.press('r');await step(1);
checks.restart=await p.evaluate(()=>game.player.hp===5&&game.boss.hp===10&&game.obstacles.length===9&&rendererSpike.staticEnvironment.root.parent===rendererSpike.scene);
// Existing collision resolver remains authoritative, regardless of ENV shape.
checks.obstacleCollision=await p.evaluate(()=>{const o=game.obstacles[0],old={x:game.player.x,y:game.player.y};game.player.x=o.x+1;game.player.y=o.y;resolveTankObstacleCollisions(game.player);const separated=Math.hypot(game.player.x-o.x,game.player.y-o.y)>=game.player.collisionRadius+o.radius-.001;Object.assign(game.player,old);return separated;});
checks.environmentAndVehicles=await p.evaluate(()=>rendererSpike.staticEnvironment.status==='READY'&&!!rendererSpike.glb.player&&rendererSpike.roleVisuals.size>=4&&rndStartup.state==='PLAYING');
assert(Object.values(checks).every(Boolean),JSON.stringify(checks));assert.deepEqual(errors,[]);
await p.close();
// Actual real-time render loop for final user review screenshots, not stepped QA.
const live=await b.newPage({viewport:{width:1600,height:900}});
await live.goto(url);await live.waitForFunction(()=>rndStartup.state==='READY',null,{timeout:60000,polling:100});
await live.locator('#startupStart').click();await live.waitForTimeout(250);
const time1=await live.evaluate(()=>game.time);
await live.screenshot({path:path.join(out,'playable-75.png')});
await live.locator('#spikeAngle').selectOption('90');await live.waitForTimeout(150);
await live.screenshot({path:path.join(out,'playable-90.png')});
const runtime=await live.evaluate(()=>({time:game.time,state:rndStartup.state,env:rendererSpike.staticEnvironment.status,world:WORLD,meshes:rendererSpike.staticEnvironment.root.children.length,playerHP:game.player.hp,bossHP:game.boss.hp}));
assert(runtime.time>time1);assert.equal(runtime.state,'PLAYING');assert.equal(runtime.env,'READY');
// Browser reload follows the second Blender export, then START again.
await live.reload();await live.waitForFunction(()=>rndStartup.state==='READY',null,{timeout:60000,polling:100});await live.locator('#startupStart').click();
checks.reloadStart=await live.evaluate(()=>rndStartup.state==='PLAYING'&&rendererSpike.staticEnvironment.status==='READY');
const result={checks,errors,runtime,realTimeLoop:true,pass:Object.values(checks).every(Boolean)};
fs.writeFileSync(path.join(out,'playable-controls.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
