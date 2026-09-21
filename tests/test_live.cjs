const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),shots=path.join(root,'Docs/validation_20260920');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
 await page.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&rendererSpike.roleTemplates.size===5);
 const checks={};
 await page.keyboard.press('r');
 await page.evaluate(()=>{game.obstacles=[];game.player.hp=100;game.player.maxHp=100;rendererSpike.config.cameraElevation=75;});
 const p0=await page.evaluate(()=>({x:game.player.x,angle:game.player.angle}));
 await page.keyboard.down('w');await page.waitForTimeout(350);await page.keyboard.up('w');
 await page.keyboard.down('d');await page.waitForTimeout(150);await page.keyboard.up('d');
 const p1=await page.evaluate(()=>({x:game.player.x,angle:game.player.angle}));
 checks.keyboardMovement=p1.x>p0.x;checks.keyboardTurn=p1.angle!==p0.angle;
 await page.mouse.move(955,360);await page.keyboard.down('Shift');await page.waitForTimeout(410);
 checks.shiftFocus=await page.evaluate(()=>game.precisionAim.ready&&!!game.precisionXray.analysis);
 await page.keyboard.up('Shift');await page.waitForTimeout(50);
 checks.shiftRelease=await page.evaluate(()=>!game.precisionAim.ready);
 await page.mouse.move(600,360);await page.keyboard.press('q');await page.waitForTimeout(50);
 checks.qTargetInput=await page.evaluate(()=>game.timeMode==='SKILL_TARGETING'&&game.generalSkill.points.length===6);
 await page.mouse.click(600,360,{button:'right'});await page.waitForTimeout(50);
 checks.qRightCancel=await page.evaluate(()=>game.timeMode==='NORMAL');
 await page.keyboard.press('q');await page.waitForTimeout(30);await page.keyboard.press('Escape');await page.waitForTimeout(30);
 checks.qEscCancel=await page.evaluate(()=>game.timeMode==='NORMAL');
 await page.keyboard.press('q');await page.waitForTimeout(30);await page.keyboard.press('q');await page.waitForTimeout(30);
 checks.qQCancel=await page.evaluate(()=>game.timeMode==='NORMAL');
 const playerShots=await page.evaluate(()=>game.shells.filter(s=>s.owner==='player').length);
 await page.keyboard.press('q');await page.waitForTimeout(50);await page.mouse.click(600,360);
 await page.waitForTimeout(80);
 checks.qClickConfirm=await page.evaluate(()=>game.playerArtillery.length===6);
 checks.qConfirmNotMainGun=(await page.evaluate(()=>game.shells.filter(s=>s.owner==='player').length))===playerShots;
 await page.waitForTimeout(600);checks.qSixGameplay=await page.evaluate(()=>game.qImpacts.length===6);
 // Threat fixture only seeds an ordinary enemy projectile; activation uses the real keyboard path.
 await page.evaluate(()=>{
   resetGame();game.obstacles=[];game.player.hp=100;game.player.maxHp=100;
   fireShell({x:game.player.x+500,y:game.player.y,turretAngle:Math.PI},'boss');
 });
 await page.waitForTimeout(50);await page.keyboard.press('Space');await page.waitForTimeout(50);
 checks.spaceActivation=await page.evaluate(()=>game.timeMode==='BULLET_TIME'&&game.bulletTime.trackedProjectileId!==null);
 await page.keyboard.press('p');await page.waitForTimeout(50);
 checks.stressKey=await page.evaluate(()=>rendererSpike.stressTanks.length===1);
 await page.locator('#spikeMode').click();checks.canvasFallback=await page.evaluate(()=>!rendererSpike.enabled);
 await page.locator('#spikeMode').click();checks.threeReturn=await page.evaluate(()=>rendererSpike.enabled);
 await page.locator('#spikeShadow').uncheck();checks.shadowOff=await page.evaluate(()=>!rendererSpike.renderer.shadowMap.enabled);
 await page.locator('#spikeShadow').check();checks.shadowOn=await page.evaluate(()=>rendererSpike.renderer.shadowMap.enabled);
 await page.setViewportSize({width:1024,height:768});await page.waitForTimeout(100);
 checks.resize=await page.evaluate(()=>rendererSpike.enabled&&Number.isFinite(game.player.x));
 await page.setViewportSize({width:1280,height:720});
 await page.keyboard.press('r');await page.waitForTimeout(100);
 checks.restart=await page.evaluate(()=>game.rndActors.length===3&&game.player.hp===5&&game.qImpacts.length===0);
 const performanceSamples=[];
 for(const [count,shadow] of [[0,true],[25,true],[100,true],[100,false]]){
   await page.evaluate(({count,shadow})=>{
     resetGame();game.player.hp=10000;game.player.maxHp=10000;game.obstacles=[];
     document.getElementById('clearStress').click();
     for(let i=0;i<count;i++)rendererSpike.addStressTank();
     const box=document.getElementById('spikeShadow');box.checked=shadow;box.dispatchEvent(new Event('change'));
     rendererSpike.config.cameraElevation=75;
   },{count,shadow});
   await page.waitForTimeout(1800);
   const sample=await page.evaluate(()=>({
     ...rendererSpike.stats,stress:rendererSpike.stressTanks.length,
     gpu:rendererSpike.renderer.getContext().getParameter(rendererSpike.renderer.getContext().getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL),
     viewport:[innerWidth,innerHeight],devicePixelRatio
   }));performanceSamples.push(sample);
 }
 await page.evaluate(()=>{document.getElementById('clearStress').click();resetGame();});
 const result={checks,errors,performanceSamples,pass:Object.values(checks).every(Boolean)&&!errors.length};
 fs.writeFileSync(path.join(root,'Docs/live_browser_validation.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));await browser.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
