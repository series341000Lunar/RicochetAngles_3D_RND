import {samplePath} from './path.js';
const $=s=>document.querySelector(s),frame=$('#testbed');let world,THREE,Loader,layer,doc,entries=[],playing=false,last=performance.now(),assets;
const status=t=>$('#status').textContent=t;
const ready=new Promise(resolve=>{const timer=setInterval(()=>{const w=frame.contentWindow;if(w?.rendererSpike?.scene&&(w.rndStartup?.state==='READY'||w.rndStartup?.error)){clearInterval(timer);resolve(w);}},100);setTimeout(()=>{clearInterval(timer);if(!world)status('BLOCK: existing renderer did not finish startup; inspect local assets / WebGL');},45000);});
function dispose(group){group.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}});}
async function reload(){
 try{
 const response=await fetch('/api/workspace');const data=await response.json();if(!response.ok)throw Error(data.error);if(data.validation.some(v=>v.level==='BLOCK'))throw Error('Workspace validation BLOCK');
 const next=new THREE.Group();next.name='DCC00_PRESENTATION_ONLY';const fresh=[];let missing=0,actual=0;
 for(const a of [...data.document.actors,...data.document.decorations]){
 const root=new THREE.Group();root.name=a.ra_id||'Anonymous decoration';root.userData.class=a.class;root.userData.ra_id=a.ra_id;const spec=assets[a.asset];let visual;
 if(spec?.path){try{const gltf=await new Loader().loadAsync('/'+spec.path);visual=gltf.scene;visual.scale.setScalar(14*(spec.previewScale||1));actual++;root.userData.preview='GLB';}catch{missing++;}}
 else if(a.asset&&!spec?.proxy)missing++;
 if(!visual){const trigger=a.class==='Trigger',checkpoint=a.class==='Checkpoint';visual=new THREE.Mesh(new THREE.BoxGeometry(trigger?a.sizeX:checkpoint?18:36,trigger?18:checkpoint?42:18,trigger?a.sizeY:24),new THREE.MeshBasicMaterial({color:trigger?0xffc15c:checkpoint?0x5ad7ff:0x85c9ad,wireframe:trigger}));visual.position.y=trigger?9:checkpoint?21:9;root.userData.preview=spec?.proxy||trigger||checkpoint?'PROXY':'MISSING_ASSET';}
 root.add(visual);root.position.set(a.transform.x,a.transform.z,a.transform.y);root.rotation.y=-(a.facing??a.transform.yaw)*Math.PI/180;root.visible=a.enabled!==false;next.add(root);fresh.push({a,root});
 }
 for(const p of data.document.paths){const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(p.points.map(v=>new THREE.Vector3(v.x,v.z+3,v.y))),new THREE.LineBasicMaterial({color:0xd7bc73}));next.add(line);}
 if(layer){world.rendererSpike.scene.remove(layer);dispose(layer);}layer=next;entries=fresh;doc=data.document;world.rendererSpike.scene.add(layer);window.dccPreview={document:doc,entries,layer,world,actual,missing,samplePath};status(`Loaded ${entries.length} previews · ${actual} actual GLB · ${missing} missing asset proxies · gameplay data untouched`);
 }catch(e){status('BLOCK: '+e.message);}
}
world=await ready;
// Import through the iframe realm: reuse the exact vendor/loader module instances.
THREE=await world.eval("import('/spike/vendor/three.module.js')");({GLTFLoader:Loader}=await world.eval("import('/spike/vendor/GLTFLoader.js')"));
assets=await (await fetch('/dcc00/registry/assets.json')).json();
world.document.getElementById('world3d').style.visibility='visible';world.document.getElementById('startupGate').style.display='none';world.document.getElementById('spikePanel').style.display='none';world.document.getElementById('game').style.display='none';
// Leave rndStartup READY: existing simulation remains paused. No game state binding.
if(new URLSearchParams(location.search).get('mode')==='env01'){
 const {environmentPreview}=await import('./env01_preview.js');await environmentPreview(world,THREE,Loader);
}else if(new URLSearchParams(location.search).get('mode')==='canonical'){
 const {canonicalPreview}=await import('./canonical_preview.js');await canonicalPreview(world,THREE);
}else{
await reload();$('#reload').onclick=reload;$('#play').onclick=()=>{playing=!playing;$('#play').textContent=playing?'Pause presentation':'Play presentation';};
function tick(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(playing)$('#seconds').value=(Number($('#seconds').value)+dt).toFixed(3);const seconds=Number($('#seconds').value)||0;
 if(doc){for(const {a,root} of entries){if(a.class!=='PresentationActor')continue;const path=doc.paths.find(p=>p.id===a.path);if(path){const p=samplePath(path.points,seconds,a.startSeconds,a.durationSeconds,a.loop);root.position.set(p.x,p.z,p.y);}}}
 const r=world.rendererSpike,angle=r.config.cameraElevation*Math.PI/180,y=Number($('#worldY').value);r.view.position.set(640,1800*Math.sin(angle),y+1800*Math.cos(angle));r.view.lookAt(640,0,y);r.view.updateMatrixWorld();r.renderer.render(r.scene,r.view);requestAnimationFrame(tick);
}requestAnimationFrame(tick);

}
