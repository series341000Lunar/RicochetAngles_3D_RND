import {appendMapReferences} from './map_reference.js';
// Same renderer/context/scene/camera. Only a paused visual review, never a gameplay loop.
export async function environmentPreview(world,THREE,Loader){
 const $=s=>document.querySelector(s),r=world.rendererSpike,scene=r.scene;
 const base='/dcc00/workspace/env01/',envGroup=new THREE.Group();
 envGroup.name='ENV01_STATIC_VISUAL_ONLY';
 for(const child of scene.children)if(!child.isLight)child.visible=false;
 scene.add(envGroup);
 const lights=scene.children.filter(c=>c.isLight);
 for(const light of lights)light.visible=true;
 let overlay=new THREE.Group(),bounds=new THREE.Group(),doc,entries=[],asset=null,selected='H5E_P1_TUT_COVER_01';
 let elevation=75,whole=false,focusSelected=false,revision=0,busy=false;
 scene.add(overlay,bounds);
 document.body.classList.add('env01-review');
 $('h1').textContent='ENV-01 · Stage layout + static environment';
 $('.timebar').innerHTML='<button id="envReload">Reload map + GLB</button><button id="envFit">Whole stage</button><button id="envSlice">Environment slice</button><button id="view90">90° alignment</button><button id="view75">75° review</button><label><input id="showMap" type="checkbox" checked>Map bounds</label><label><input id="showSemantic" type="checkbox" checked>Semantic reference</label><label><input id="showEnv" type="checkbox" checked>Static ENV</label><input id="envId" list="envIds" aria-label="Stable ID" value="H5E_P1_TUT_COVER_01" style="width:240px"><datalist id="envIds"></datalist><button id="envSelect">Highlight ID</button><button id="envFocusId">Focus ID</button>';
 $('#reload').textContent='Reload stage';
 function dispose(group){
  group.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])m.dispose();});
 }
 function syncVisibility(){
  overlay.visible=$('#showSemantic').checked;bounds.visible=$('#showMap').checked;envGroup.visible=$('#showEnv').checked;
 }
 function highlight(id){
  const entry=entries.find(e=>e.record.id===id);
  if(!entry){$('#status').textContent='Unknown stable ID; selection retained';return false;}
  selected=id;$('#envId').value=id;
  for(const e of entries)e.root.traverse(o=>{if(o.material)o.material.color.setHex(e.record.id===id?0xffd85e:e.collection==='objects'?0x8ac4da:e.collection==='markers'?0x64e9be:0xe8c8ef);});
  window.env01.selected=id;return true;
 }
 async function reload(){
  if(busy)return false;busy=true;const started=performance.now();
  try{
   const response=await fetch(base+'map.json?v='+Date.now(),{cache:'no-store'});
   if(!response.ok)throw Error('Stage working map unavailable; previous stage retained');
   const next=await response.json();
   if(next.schemaVersion!=='h5e-map-v0.2'||!next.world?.width)throw Error('Invalid stage working map');
   const fresh=new THREE.Group(),list=[];appendMapReferences(THREE,next,fresh,list,selected);
   if(new Set(list.map(e=>e.record.id)).size!==list.length)throw Error('Duplicate map stable ID');
   fresh.traverse(o=>{if(o.material){o.material.depthTest=false;o.material.transparent=true;o.material.opacity=.7;}o.renderOrder=100;});
   const outline=new THREE.Group(),w=next.world;
   outline.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([[0,0],[w.width,0],[w.width,w.height],[0,w.height],[0,0]].map(([x,z])=>new THREE.Vector3(x,1,z))),new THREE.LineBasicMaterial({color:0xa8c694})));
   let gltf=null,warning='';
   try{
    // Native Blender glTF axes already produce (X, height, H5E Y).
    // The ONLY runtime conversion is one positive uniform scale of 14.
    gltf=await new Loader().loadAsync(base+'geometry.glb?v='+Date.now());
    gltf.scene.scale.setScalar(14);
    gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
   }catch(e){warning='STATIC ENV missing/invalid; map retained, no stale geometry shown';}
   scene.remove(overlay,bounds);dispose(overlay);dispose(bounds);
   overlay=fresh;bounds=outline;scene.add(overlay,bounds);doc=next;entries=list;
   if(asset){envGroup.remove(asset);dispose(asset);}asset=gltf?.scene||null;if(asset)envGroup.add(asset);
   delete window.env01.error;revision++;$('#envIds').replaceChildren(...entries.map(e=>Object.assign(document.createElement('option'),{value:e.record.id})));
   Object.assign(window.env01,{document:doc,entries,asset,overlay,bounds,revision,warning,reloadMilliseconds:performance.now()-started});
   if(!entries.some(e=>e.record.id===selected)){selected=entries[0]?.record.id||'';focusSelected=false;}
   highlight(selected);syncVisibility();
   $('#status').textContent=(warning?warning+' · ':'')+entries.length+' map records · '+w.width+' × '+w.height+' · visual review only · USER VISUAL REVIEW PENDING';
   return true;
  }catch(e){$('#status').textContent='BLOCK: '+e.message;window.env01.error=e.message;return false;}
  finally{busy=false;}
 }
 function measurements(){
  if(!doc||!asset)return [];
  scene.updateMatrixWorld(true);
  const a=doc.objects.find(v=>v.id==='H5E_P1_TUT_COVER_01').geometry;
  const b=doc.objects.find(v=>v.id==='H5E_P1_TUT_COVER_02').geometry;
  const c=doc.objects.find(v=>v.id==='H5E_P1_GUIDE_ROUTE_TUT').geometry.points[3];
  return [['ENV_ANCHOR_A',a],['ENV_ANCHOR_B',b],['ENV_ANCHOR_C',c]].map(([name,p])=>{
   const obj=asset.getObjectByName(name);if(!obj)throw Error('Missing GLB anchor '+name);
   const q=obj.getWorldPosition(new THREE.Vector3());
   return {name,expectedH5E:[p.x,p.y,0],three:[q.x,q.z,q.y],error:Math.hypot(q.x-p.x,q.z-p.y,q.y)};
  });
 }
 function stats(){
  let meshes=0,triangles=0;const materials=new Set();
  asset?.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m.uuid);}});
  return {meshes,triangles,materials:materials.size,drawCalls:r.renderer.info.render.calls,renderTriangles:r.renderer.info.render.triangles};
 }
 window.env01={world,envGroup,reload,highlight,measurements,stats,selected};
 $('#reload').onclick=reload;$('#envReload').onclick=reload;
 $('#envFit').onclick=()=>{whole=true;focusSelected=false;};$('#envSlice').onclick=()=>{whole=false;focusSelected=false;};
 $('#view90').onclick=()=>{elevation=90;};$('#view75').onclick=()=>{elevation=75;};
 for(const id of ['showMap','showSemantic','showEnv'])$('#'+id).onchange=syncVisibility;
 $('#envSelect').onclick=()=>highlight($('#envId').value);
 $('#envFocusId').onclick=()=>{if(highlight($('#envId').value)){whole=false;focusSelected=true;}};
 function tick(){
  if(doc){
   const canvas=r.renderer.domElement,aspect=canvas.clientWidth/Math.max(1,canvas.clientHeight);
   let x=3075,z=700,width=1800;
   if(asset){const box=new THREE.Box3().setFromObject(asset);x=(box.min.x+box.max.x)/2;z=(box.min.z+box.max.z)/2;width=Math.max(1800,box.max.x-box.min.x+160);}
   if(whole){x=doc.world.width/2;z=doc.world.height/2;width=doc.world.width*1.04;}
   if(focusSelected){const g=entries.find(e=>e.record.id===selected).record.geometry;const p=g.points?g.points[Math.floor(g.points.length/2)]:g;x=p.x;z=p.y;width=1100;}
   const height=Math.max(width/aspect,whole?doc.world.height*1.1:1350);
   width=Math.max(width,height*aspect);
   const angle=elevation*Math.PI/180,distance=20000;
   Object.assign(r.view,{left:-width/2,right:width/2,top:height/2,bottom:-height/2,near:1,far:50000});
   r.view.position.set(x,distance*Math.sin(angle),z+distance*Math.cos(angle));r.view.up.set(0,0,-1);r.view.lookAt(x,0,z);
   r.view.updateProjectionMatrix();r.view.updateMatrixWorld();
   for(const light of lights)if(light.isDirectionalLight){light.position.set(2500,1600,1300);light.target.position.set(3075,0,700);light.target.updateMatrixWorld();}
   r.renderer.info.reset();r.renderer.render(scene,r.view);
   window.env01.cameraElevation=elevation;
  }
  requestAnimationFrame(tick);
 }
 await reload();requestAnimationFrame(tick);
}