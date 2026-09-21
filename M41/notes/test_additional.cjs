const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const root='\\\\192.168.87.201\\Projects\\RicochetAngles\\01_RND\\ThreeJSDEV';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome',args:['--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_GLBSPIKE.html');
 await page.waitForFunction(()=>window.rendererSpike?.glb);
 await page.keyboard.press('r');await page.mouse.move(500,260);await page.mouse.down();await page.waitForTimeout(130);await page.mouse.up();
 const r={};
 r.fire=await page.evaluate(()=>({shells:game.shells.length,reload:game.player.reload,traveled:game.shells.filter(s=>s.owner==='player').map(s=>s.traveled)}));
 assert(r.fire.reload>0);
 r.scenarios=await page.evaluate(()=>{
   resetGame();
   const p=game.player,o=game.obstacles[0];p.x=o.x+1;p.y=o.y;
   const collided=resolveTankObstacleCollisions(p),distance=Math.hypot(p.x-o.x,p.y-o.y);
   const hp=o.hp;
   game.shells=[{x:o.x-o.radius-20,y:o.y,prevX:o.x-o.radius-20,prevY:o.y,vx:500,vy:0,owner:'player',ownerFaction:'player',weaponType:'mainCannon',basePen:100,penLoss:0,traveled:0,life:5,ricochetCount:0,trail:[],dead:false}];
   updateShells(.1);const obstacleDamage=o.hp===hp-1;
   const ricochet=calculatePenetration({velocityX:1,velocityY:100,normalX:-1,normalY:0,armor:100,basePenetration:100,distance:0,penetrationLoss:0,ricochetAngle:TUNING.ricochetAngleDegrees}).result;
   const penetration=calculatePenetration({velocityX:100,velocityY:0,normalX:-1,normalY:0,armor:1,basePenetration:1000,distance:0,penetrationLoss:0,ricochetAngle:TUNING.ricochetAngleDegrees}).result;
   resetGame();
   const b=game.boss;let count=0;
   while(b.alive&&count++<20){
     applyPenetration(b,{x:b.x,y:b.y,weakpointName:getActiveWeakpointName(b),isActiveWeakpoint:true});
     applyPenetration(b,{x:b.x,y:b.y,weakpointName:'engine',isActiveWeakpoint:true});
   }
   const boss={hp:b.hp,state:game.state,alive:b.alive};
   resetGame();const shell={vx:100,vy:0,basePen:1000,penLoss:0,traveled:0,ownerFaction:'boss',weaponType:'mainCannon',ricochetCount:0,trail:[],dead:false};
   resolveArmorHit(shell,{nx:-1,ny:0,armor:1,x:game.player.x,y:game.player.y,zone:'test'},game.player);
   const playerHp=game.player.hp;resetGame();
   return {collided,distance,obstacleDamage,ricochet,penetration,boss,playerHp};
 });
 assert(r.scenarios.obstacleDamage&&r.scenarios.collided&&r.scenarios.boss.state==='won'&&r.scenarios.playerHp===4);
 // GLTFLoader async allocation must not consume game RNG.
 r.loaderRng=await page.evaluate(async()=>{
   const {GLTFLoader}=await import('./vendor/GLTFLoader.js');
   const data=await fetch('../M41/export/M41_RND_v01.glb').then(r=>r.arrayBuffer());
   let calls=0;const orig=Math.random;
   // Suspend the scheduled next gameplay frame during this single parse measurement.
   const oldFrame=window.frame;window.frame=()=>{};
   const raf=window.requestAnimationFrame;window.requestAnimationFrame=()=>0;
   Math.random=()=>{calls++;return .5};
   await new GLTFLoader().parseAsync(data,'');
   Math.random=orig;window.frame=oldFrame;window.requestAnimationFrame=raf;
   return {calls};
 });
 // An isolated actual WebGL view of the exported model, not a mock render.
 await page.evaluate(async()=>{
   const THREE=await import('./vendor/three.module.js'),a=rendererSpike;
   a.enabled=false;document.getElementById('game').style.display='none';document.getElementById('spikePanel').style.display='none';
   const scene=new THREE.Scene();scene.background=new THREE.Color('#242a2d');
   const model=a.glb.template.clone(true);model.scale.setScalar(1);scene.add(model);
   scene.add(new THREE.HemisphereLight(0xddeaff,0x303025,2));
   const light=new THREE.DirectionalLight(0xffefd5,3);light.position.set(3,6,5);scene.add(light);
   const camera=new THREE.OrthographicCamera(-4.8,4.8,2.7,-2.7,.1,100);camera.position.set(8,7,9);camera.lookAt(.5,1,0);
   window.review={scene,model,camera,renderer:a.renderer};a.renderer.render(scene,camera);
 });
 await page.screenshot({path:path.join(root,'M41/preview/GLB_isometric.png')});
 await page.evaluate(()=>{const r=review;r.camera.position.set(0,15,0);r.camera.up.set(0,0,-1);r.camera.lookAt(.5,0,0);r.renderer.render(r.scene,r.camera)});
 await page.screenshot({path:path.join(root,'M41/preview/GLB_top.png')});
 await page.evaluate(()=>{const r=review;r.camera.position.set(0,3,14);r.camera.up.set(0,1,0);r.camera.lookAt(.5,1,0);r.renderer.render(r.scene,r.camera)});
 await page.screenshot({path:path.join(root,'M41/preview/GLB_side.png')});
 const fallback=await browser.newPage();await fallback.route('**/M41_RND_v01.glb',route=>route.abort());
 await fallback.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_GLBSPIKE.html');
 await fallback.waitForFunction(()=>document.getElementById('glbStatus').textContent.includes('failed'));
 r.fallback=await fallback.evaluate(()=>({text:document.getElementById('glbStatus').textContent,primitive:rendererSpike.playerVisual.root.parent===rendererSpike.scene,state:game.state,enabled:rendererSpike.enabled}));
 assert(r.fallback.primitive&&r.fallback.enabled);
 r.errors=errors;
 fs.writeFileSync(path.join(root,'M41/notes/browser_additional_validation.json'),JSON.stringify(r,null,2));
 console.log(JSON.stringify(r));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

