const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;});
 await page.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');
 await page.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb, {},{polling:100,timeout:30000});
 const results=await page.evaluate(()=>{
   const checks={};function check(k,v){checks[k]=!!v;}
   resetGame();game.obstacles=[];game.boss.timer=-999;
   const p=game.player;
   p.turretAngle=0;fireShell(p,'player');check('main_gun',game.shells.length===1&&game.shells[0].id===1);
   const shell=game.shells[0];const x=shell.x;updateShells(.01);check('projectile_motion',shell.x>x);
   game.shells=[];const enemy={x:p.x+250,y:p.y,turretAngle:Math.PI};
   fireShell(enemy,'boss');updateThreatAssessment();check('valid_threat',!!game.bulletTime.primaryThreat);
   check('activate',activateBulletTime());const d=getFrameDts(.02);
   check('dt_channels',d.simDt===.002&&d.playerMoveDt===.004&&d.playerTurnDt===.02);
   const threat=game.shells[0], before=threat.x;updateShells(d.simDt);
   check('slowed_shell',Math.abs((threat.x-before)-threat.vx*d.simDt)<1e-8);
   const angle=p.angle;input.keys.d=true;updatePlayer(d.simDt,d.playerMoveDt,d.playerTurnDt);input.keys={};
   check('responsive_turn',Math.abs(p.angle-angle)>.02);
   // Exact tracked armor collision uses unchanged resolver.
   resolveArmorHit(threat,{x:p.x+33,y:p.y,nx:1,ny:0,armor:72,zone:'front',target:p},p);
   check('tracked_outcome',game.bulletTime.outcome!=='PENDING'&&game.timeMode==='NORMAL');
   resetGame();input.keys.shift=true;updateTimeModeTimers(.36);
   check('focus_ready',game.precisionAim.ready);
   const focused=getPlayerDispersion(game.player).total;input.keys.shift=false;updateTimeModeTimers(.01);
   check('focus_dispersion',Math.abs(getPlayerDispersion(game.player).total-focused*2)<1e-9);
   input.keys.shift=true;updateTimeModeTimers(.36);
   input.mouseScreenX=game.boss.x-camera.x;input.mouseScreenY=game.boss.y-camera.y;
   game.player.turretAngle=Math.atan2(game.boss.y-game.player.y,game.boss.x-game.player.x);
   updatePrecisionXray();check('xray_analysis',!!game.precisionXray.analysis);
   input.keys={};const wasEnabled=rendererSpike.enabled;rendererSpike.enabled=false;game.timeMode='SKILL_TARGETING';game.generalSkill.seed=7;updateRndTargetPoints();
   const points=JSON.stringify(game.generalSkill.points);check('q_six_preview',game.generalSkill.points.length===6);
   confirmGeneralSkillTarget();check('q_six_real_markers',game.playerArtillery.length===6);
   updatePlayerArtillery(.49);check('q_no_early_impact',game.qImpacts.length===0);
   const bossHp=game.boss.hp;updatePlayerArtillery(.01);
   check('q_six_impacts',game.qImpacts.length===6&&game.playerArtillery.length===0);
   check('q_boss_no_hp_damage',game.boss.hp===bossHp);
   check('q_works_in_2D',!rendererSpike.enabled&&game.qImpacts.length===6);rendererSpike.enabled=wasEnabled;
   const unchanged=JSON.stringify(game);rendererSpike.render(0,0);check('render_isolation',JSON.stringify(game)===unchanged);
   rendererSpike.addStressTank();check('stress',rendererSpike.stressTanks.length===1);
   resetGame();check('restart',game.qImpacts.length===0&&game.player.hp===5&&game.timeMode==='NORMAL');
   // Original penetration math and obstacle authority.
   check('ricochet_math',calculatePenetration({velocityX:100,velocityY:0,normalX:-.1,normalY:.995,armor:50,basePenetration:122,distance:0,penetrationLoss:0,ricochetAngle:70}).result==='도탄');
   fireShell(game.player,'player');const s=game.shells[0];
   const obstacle={x:s.x+10,y:s.y,radius:12,hp:2,maxHp:2,type:'rock',destroyed:false};
   resolveObstacleShellHit(s,{x:obstacle.x,y:obstacle.y,nx:-1,ny:0,obstacle});
   check('obstacle_collision',s.dead&&obstacle.hp===1);
   input.keys={w:true};let px=game.player.x;updatePlayer(.02);check('movement',game.player.x>px);input.keys={};
   render();return checks;
 });
 const out={phase:'R1',checks:results,errors,pass:Object.values(results).every(Boolean)&&!errors.length};
 fs.writeFileSync(path.join(root,'Docs/R1_final_regression.json'),JSON.stringify(out,null,2));
 console.log(JSON.stringify(out));await browser.close();if(!out.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
