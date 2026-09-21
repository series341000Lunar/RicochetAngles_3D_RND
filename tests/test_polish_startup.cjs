const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const results=[];
for(const delay of [0,1000]){
 const p=await b.newPage({viewport:{width:1280,height:720}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 if(delay)await p.route(/rnd_(gameplay|actors)\.js/,async r=>{await new Promise(done=>setTimeout(done,delay));await r.continue();});
 await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html?polish='+Date.now());
 await p.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&rendererSpike.roleTemplates.size===5);
 await p.waitForTimeout(1300);
 const checks=await p.evaluate(()=>{
  const c={time_advancing:game.time>1,default75:rendererSpike.config.cameraElevation===75};
  function change(id,value){const e=document.getElementById(id);e.value=value;e.dispatchEvent(new Event('change'));render();}
  const before=JSON.stringify(game);change('bossScale','1.5');c.scale_selector=rendererSpike.roleVisuals.get('boss').root.scale.x===21;
  change('bossShape','lowwide');c.shape_selector=rendererSpike.roleVisuals.get('boss').root.scale.y===16.8;
  change('bossShape','uniform');change('bossScale','2');change('spikeAngle','90');c.camera_selector=rendererSpike.config.cameraElevation===90;
  change('spikeAngle','75');
  c.controls_no_gameplay_write=JSON.stringify(game)===before;
  const cb=document.getElementById('bossPolish');cb.checked=false;cb.dispatchEvent(new Event('change'));c.polish_compare=rendererSpike.bossMuzzlePolish.config.enabled===false;
  cb.checked=true;cb.dispatchEvent(new Event('change'));
  return c;
 });
 results.push({delay,checks,errors,pass:Object.values(checks).every(Boolean)&&!errors.length});await p.close();
}
fs.writeFileSync(path.resolve(__dirname,'../Docs/polish_startup_validation.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify(results));await b.close();if(results.some(r=>!r.pass))process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
