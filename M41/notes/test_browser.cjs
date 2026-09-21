const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
const root='\\\\192.168.87.201\\Projects\\RicochetAngles\\01_RND\\ThreeJSDEV';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_GLBSPIKE.html');
 await page.waitForFunction(()=>window.rendererSpike?.glb,{timeout:30000});
 const report={environment:await page.evaluate(()=>{const gl=rendererSpike.renderer.getContext(),e=gl.getExtension('WEBGL_debug_renderer_info');return {ua:navigator.userAgent,gpu:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),dpr:devicePixelRatio}})};
 report.asset=await page.evaluate(()=>{const g=rendererSpike.glb,meshes=[];g.player.traverse(o=>{if(o.isMesh)meshes.push({name:o.name,parent:o.parent.name,triangles:o.geometry.index.count/3})});return {meshes,footprint:g.footprint}});
 report.pose=await page.evaluate(()=>{const p=game.player,a=p.angle,t=p.turretAngle;p.angle=.7;p.turretAngle=-1.1;const before=JSON.stringify(game);rendererSpike.render(0,0);const g=rendererSpike.glb,v=g.player.position.clone().set(1,0,0).transformDirection(g.turret.matrixWorld);const result={renderReadOnly:JSON.stringify(game)===before,hull:g.hull.rotation.y,turretLocal:g.turret.rotation.y,turretWorldDirection:[v.x,v.z],expected:[Math.cos(-1.1),Math.sin(-1.1)]};p.angle=a;p.turretAngle=t;return result});
 await page.keyboard.press('p');
 report.p=await page.evaluate(()=>({count:rendererSpike.stressTanks.length,keyP:input.keys.p??null}));
 report.readOnlyClone=await page.evaluate(()=>{const before=JSON.stringify(game);let n=0,random=Math.random;Math.random=()=>{n++;return .5};rendererSpike.addStressTank();Math.random=random;const a=rendererSpike.stressTanks[0].getObjectByName('HULL'),b=rendererSpike.stressTanks[1].getObjectByName('HULL');return {unchanged:before===JSON.stringify(game),randomCalls:n,geometryShared:a.geometry===b.geometry,materialShared:a.material===b.material,objectsSeparate:a!==b}});
 const before=await page.evaluate(()=>({x:game.player.x,y:game.player.y,angle:game.player.angle}));
 await page.mouse.move(1000,300);await page.keyboard.down('w');await page.keyboard.down('d');await page.waitForTimeout(500);await page.keyboard.up('w');await page.keyboard.up('d');
 report.movement={before,after:await page.evaluate(()=>({x:game.player.x,y:game.player.y,angle:game.player.angle,turretAngle:game.player.turretAngle}))};
 await page.mouse.move(900,300);await page.mouse.down();await page.waitForTimeout(130);await page.mouse.up();
 report.fire=await page.evaluate(()=>({shells:game.shells.length,reload:game.player.reload}));
 report.grid=await page.evaluate(()=>{rendererSpike.render(0,0);const t=rendererSpike.stressTanks[0],a=[t.position.x-camera.x,t.position.z-camera.y];const old={x:camera.x,y:camera.y};camera.x+=180;camera.y+=90;rendererSpike.render(0,0);const b=[t.position.x-camera.x,t.position.z-camera.y];camera.x=old.x;camera.y=old.y;return {a,b}});
 await page.keyboard.press('r');
 report.restart=await page.evaluate(()=>({hp:game.player.hp,bossHp:game.boss.hp,stressRetained:rendererSpike.stressTanks.length}));
 await page.locator('#clearStress').click();
 report.performance=[];
 for(const shadow of [true,false]){
   await page.locator('#spikeShadow').setChecked(shadow);
   await page.locator('#clearStress').click();
   for(const count of [0,10,20,40,80]){
     await page.evaluate(n=>{while(rendererSpike.stressTanks.length<n)rendererSpike.addStressTank()},count);
     await page.waitForTimeout(1800);
     const sample=await page.evaluate(()=>({...rendererSpike.stats,count:rendererSpike.stressTanks.length}));
     report.performance.push(sample);console.log('SAMPLE',JSON.stringify(sample));
     if(shadow&&[0,20,80].includes(count))await page.screenshot({path:path.join(root,'M41/preview/stress_'+count+'.png')});
   }
 }
 report.shadowOff=await page.evaluate(()=>{let ok=true;rendererSpike.stressGroup.traverse(o=>{if(o.isMesh&&(o.castShadow||o.receiveShadow))ok=false});return ok});
 await page.locator('#spikeShadow').check();
 report.shadowOn=await page.evaluate(()=>{let ok=true;rendererSpike.stressGroup.traverse(o=>{if(o.isMesh&&(!o.castShadow||!o.receiveShadow))ok=false});return ok});
 await page.setViewportSize({width:960,height:800});
 report.resize=await page.evaluate(()=>{rendererSpike.render(0,0);return [...document.querySelectorAll('canvas')].map(c=>({id:c.id,rect:c.getBoundingClientRect().toJSON()}))});
 report.errors=errors;
 fs.writeFileSync(path.join(root,'M41/notes/browser_validation.json'),JSON.stringify(report,null,2));
 await browser.close();console.log('DONE',JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1)});



