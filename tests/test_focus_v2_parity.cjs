const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto'),root=path.resolve(__dirname,'..');
(async()=>{
const b=await chromium.launch({channel:'chrome',headless:true}),pages={},errors=[],checks={},states={},pixels={};
for(const [name,file]of Object.entries({before:'RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.before_focus_v2.html',after:'RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html'})){
const p=await b.newPage({viewport:{width:1280,height:720}});pages[name]=p;
p.on('pageerror',e=>errors.push(name+': '+e.message));await p.addInitScript(()=>window.requestAnimationFrame=()=>0);
await p.goto('http://127.0.0.1:8765/spike/'+file);await p.waitForFunction(()=>window.rendererSpike&&rendererSpike.glb&&rendererSpike.roleTemplates.size===5,{},{polling:100});
await p.evaluate(()=>{
let seed=777;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
resetGame();input.keys={};input.fire=false;input.contourPointerInside=true;input.mouseScreenX=955;input.mouseScreenY=360;updateTargetContourSelection();render();
});
pixels[name]=crypto.createHash('sha256').update(await p.screenshot({clip:{x:0,y:0,width:1280,height:550}})).digest('hex');
states[name]=await p.evaluate(()=>{
game.obstacles=[];game.player.hp=100;const trace=[];
for(let i=0;i<600;i++){
 input.keys={w:i<120,d:i>=120&&i<170,shift:i>=200&&i<280};input.fire=i%90<20;
 if(i===300){game.timeMode='SKILL_TARGETING';confirmGeneralSkillTarget();}
 if(i===410){game.timeMode='BULLET_TIME';game.bulletTime.remaining=1;}
 rndStep(1/60);render();trace.push(JSON.stringify(game));
}
return trace;
});
}
checks.normal_pixels_exact=pixels.before===pixels.after;
checks.gameplay_600_frames_exact=states.before.every((v,i)=>v===states.after[i]);
const after=pages.after;
checks.material_array_restore=await after.evaluate(async()=>{
const {createFocusMaterial}=await import('./rnd_focus_material.js'),THREE=await import('./vendor/three.module.js');
const f=createFocusMaterial(),r=new THREE.Group(),a=new THREE.MeshStandardMaterial(),b=new THREE.MeshStandardMaterial({opacity:.23,transparent:true,depthWrite:false}),arr=[a,b],m=new THREE.Mesh(new THREE.BoxGeometry(),arr);r.add(m);
f.update('test',r,1);const ok=m.material.length===2&&m.material[0]!==a&&m.material[1].opacity===.23;f.restore();const restore=m.material===arr;
f.releaseRoot(r);const disposed=f.state.variantsCreated===f.state.variantsDisposed&&f.cachedRoots===0;m.geometry.dispose();a.dispose();b.dispose();return ok&&restore&&disposed;
});
checks.repeated_cleanup=await after.evaluate(()=>{
const f=rendererSpike.focusMaterial;
for(let i=0;i<20;i++){
resetGame();input.keys.shift=true;updateTimeModeTimers(.35);input.contourPointerInside=true;input.mouseScreenX=955;input.mouseScreenY=360;updateTargetContourSelection();render();
game.boss.alive=false;updateTargetContourSelection();render();
}
return f.state.variantsCreated-f.state.variantsDisposed<=12&&f.cachedRoots<=3&&f.state.targetId===null;
});
const result={checks,pixels,errors,pass:Object.values(checks).every(Boolean)&&!errors.length};
fs.writeFileSync(path.join(root,'Docs/focus_v2_parity.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();if(!result.pass)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});