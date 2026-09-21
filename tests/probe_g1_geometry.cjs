const {chromium}=require('C:/Users/LunarGagarin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage();await p.addInitScript(()=>requestAnimationFrame=()=>0);
await p.goto('http://127.0.0.1:8765/spike/RicochetAngles_Legacy_ThreeJS_MULTI_ASSET_RND.html');await p.waitForFunction(()=>window.rndStartup?.state==='READY',{}, {polling:100});
const result=await p.evaluate(async()=>{
const THREE=await import('./vendor/three.module.js');
const model=rendererSpike.roleTemplates.get('tiger2'),owner=model.getObjectByName('TURRET'),pivot=model.getObjectByName('TURRET_PIVOT');model.updateMatrixWorld(true);
const points={gunPort:[2.4062328338623047,0],visionSlit:[.6396937966346741,-.41334056854248047],cupola:[-.3050847351551056,-.5215964913368225]};
const anchors={};
for(const [id,[x,z]]of Object.entries(points)){
const origin=owner.localToWorld(new THREE.Vector3(x,10,z)),ray=new THREE.Raycaster(origin,new THREE.Vector3(0,-1,0));
const hit=ray.intersectObject(owner,true)[0];if(!hit)throw Error('No surface '+id);
const local=owner.worldToLocal(hit.point.clone()),rootPoint=model.worldToLocal(hit.point.clone());
anchors[id]={ownerNode:'TURRET',visualAnchorLocal3D:{x:local.x,y:local.y,z:local.z},rootNeutralLocal3D:{x:rootPoint.x,y:rootPoint.y,z:rootPoint.z},gameplayAnchorLocal2D:{x:local.x*28,y:local.z*28},neutralRootGameplay2D:{x:rootPoint.x*28,y:rootPoint.z*28},hitMesh:hit.object.name,triangle:hit.faceIndex,normal:hit.face.normal.toArray()};
}
return {unitsPerMeter:14,bossVisualScale:2,canonicalScale:28,pivotLocal3D:pivot.position.toArray(),pivotLocal2D:{x:pivot.position.x*28,y:pivot.position.z*28},anchors};
});
fs.writeFileSync(path.join(root,'Docs/G1_surface_probes.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await b.close();})().catch(e=>{console.error(e);process.exit(1)});
