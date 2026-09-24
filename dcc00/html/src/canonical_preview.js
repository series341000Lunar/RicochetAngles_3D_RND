// DCC-MAP-01 opt-in layer inside the existing paused Three.js testbed.
// Canonical payload is inspection data only; no gameplay arrays are populated.
export async function canonicalPreview(world,THREE){
 const $=s=>document.querySelector(s),scene=world.rendererSpike.scene;
 const target='H5E_P1_TUT_COVER_01',base='/dcc00/workspace/dcc-map-01/';
 const group=new THREE.Group();group.name='DCC_MAP_01_CANONICAL_REFERENCE';
 for(const child of scene.children)child.visible=false;
 scene.add(group);
 $('h1').textContent='DCC-MAP-01 · Canonical H5E validation';
 $('.timebar').innerHTML='<button id="mapBefore">Original / no-edit</button><button id="mapAfter">Blender edit</button><button id="mapFit">Entire map</button><button id="mapFocus">Focus edited cover</button><span id="mapInfo"></span>';
 $('#reload').textContent='Reload canonical export';
 let doc,entries=[],version='no-edit',focus=false;
 function clear(){
  for(const child of [...group.children]){
   child.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});group.remove(child);
  }
 }
 async function load(next=version){
  const response=await fetch(base+next+'.json',{cache:'no-store'});
  if(!response.ok)throw Error('Run canonical Blender import/export first');
  const data=await response.json();
  if(data.schemaVersion!=='h5e-map-v0.2')throw Error('Expected canonical h5e-map-v0.2');
  clear();doc=data;version=next;entries=[];
  for(const collection of ['objects','markers','annotations']){
   for(const record of data[collection]){
    const g=record.geometry,root=new THREE.Group(),points=[];
    root.name=record.id;root.userData={collection,record:structuredClone(record)};
    if(g.points){
     for(const p of g.points)points.push(new THREE.Vector3(p.x,2,p.y));
     if(g.closed||g.type==='POLYGON')points.push(points[0].clone());
    }else{
     root.position.set(g.x,0,g.y);root.rotation.y=-(record.rotationDegrees||0)*Math.PI/180;
     if(g.type==='RECT'){
      for(const [x,y]of[[-1,-1],[1,-1],[1,1],[-1,1],[-1,-1]])
       points.push(new THREE.Vector3(x*g.width/2,2,y*g.height/2));
     }else if(g.type==='CIRCLE'){
      for(let i=0;i<=48;i++)points.push(new THREE.Vector3(Math.cos(i*Math.PI/24)*g.radius,2,Math.sin(i*Math.PI/24)*g.radius));
     }else throw Error('Unsupported canonical geometry');
    }
    root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),
     new THREE.LineBasicMaterial({color:record.id===target?0xffd34d:collection==='objects'?0x89b1bd:collection==='markers'?0x60dfae:0xeacbfe})));
    root.visible=record.visible!==false;group.add(root);entries.push({collection,record,root});
   }
  }
  const api=window.h5ePreview;
  Object.assign(api,{document:doc,entries,version});
  $('#mapInfo').textContent=version+' · '+doc.world.width+' × '+doc.world.height+' · '+entries.length+' records';
  $('#status').textContent='Canonical reference layer · IDs and payload retained · gameplay paused / untouched';
  return api;
 }
 window.h5ePreview={world,group,target,load,setFocus:value=>{focus=value;}};
 $('#mapBefore').onclick=()=>load('no-edit').catch(fail);
 $('#mapAfter').onclick=()=>load('edited').catch(fail);
 $('#mapFit').onclick=()=>{focus=false;};$('#mapFocus').onclick=()=>{focus=true;};
 $('#reload').onclick=()=>load().catch(fail);
 function fail(e){$('#status').textContent='BLOCK: '+e.message;}
 function tick(){
  const r=world.rendererSpike;
  if(doc){
   const canvas=r.renderer.domElement,aspect=canvas.clientWidth/Math.max(1,canvas.clientHeight);
   const width=focus?1100:doc.world.width*1.05,height=Math.max(width/aspect,focus?700:doc.world.height*1.2);
   const x=focus?3070:doc.world.width/2,z=focus?390:doc.world.height/2;
   r.view.left=-width/2;r.view.right=width/2;r.view.top=height/2;r.view.bottom=-height/2;
   r.view.position.set(x,20000,z);r.view.up.set(0,0,-1);r.view.lookAt(x,0,z);
   r.view.far=50000;r.view.updateProjectionMatrix();r.view.updateMatrixWorld();
   r.renderer.render(r.scene,r.view);
  }
  requestAnimationFrame(tick);
 }
 await load();requestAnimationFrame(tick);
}