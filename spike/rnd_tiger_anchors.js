// G1 authoring presentation adapter only. No raycast or collision authority here.
export function createTigerAnchors(THREE,scene,view,roleVisuals,roleConfig){
 const cfg=window.tigerWeakpoints,colors={gunPort:0xff5555,visionSlit:0x40eeff,cupola:0xff66dd};
 const markers={},data={};
 for(const name of Object.keys(cfg.descriptors)){
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(2.4,8,6),new THREE.MeshBasicMaterial({color:colors[name],depthTest:false,depthWrite:false,toneMapped:false}));
  mesh.name='G1_AUTHORING_'+name;mesh.visible=false;mesh.renderOrder=30;scene.add(mesh);markers[name]=mesh;
 }
 let valid=false;
 function update(){
  const v=roleVisuals.get('boss');valid=!!v&&v.asset==='tiger2'&&roleConfig.bossScale===2&&roleConfig.bossShape==='uniform'&&game.boss.alive;
  for(const [name,d]of Object.entries(cfg.descriptors)){
   const mesh=markers[name];mesh.visible=false;delete data[name];if(!valid)continue;
   const owner=v.root.getObjectByName(d.ownerNode);if(!owner)continue;
   const a=d.visualAnchorLocal3D,world=owner.localToWorld(new THREE.Vector3(a.x,a.y,a.z)),p=world.clone().project(view);
   const gameplay=cfg.remapTransform(game.boss,name);
   data[name]={world:{x:world.x,y:world.y,z:world.z},screen:{x:(p.x+1)*W/2,y:(1-p.y)*H/2},gameplay};
   mesh.position.copy(world);mesh.visible=['3D','OVERLAY','BOUNDS'].includes(cfg.debug);
  }
  document.getElementById('g1Status').textContent=valid?'Tiger II ×2 · fixed 28 units/m · '+cfg.preset:'G1 canonical visual mismatch: requires Tiger II / Uniform ×2. Gameplay preset stays fixed.';
 }
 function project(name){return valid?data[name]?.screen:null;}
 function drawDebug(sx=0,sy=0){
  if(cfg.debug==='OFF'||!valid)return;
  const screen=p=>({x:p.x-camera.x+sx,y:p.y-camera.y+sy});
  ctx.save();ctx.font='12px monospace';ctx.lineWidth=1.5;
  if(cfg.debug==='BOUNDS'){
   const poly=(corners,color,dash=[])=>{ctx.strokeStyle=color;ctx.setLineDash(dash);ctx.beginPath();corners.forEach((p,i)=>{const q=screen(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();ctx.stroke();ctx.setLineDash([]);};
   poly([[-95,-56],[95,-56],[95,56],[-95,56]].map(([x,y])=>localToWorld(game.boss,x,y)),'#ff9933');
   const h=cfg.hullBoundsLocal3D;
   poly([[h.minX,h.minZ],[h.maxX,h.minZ],[h.maxX,h.maxZ],[h.minX,h.maxZ]].map(([x,z])=>localToWorld(game.boss,x*28,z*28)),'#eeeeee',[5,4]);
   const box=new THREE.Box3().setFromObject(roleVisuals.get('boss').root);
   poly([{x:box.min.x,y:box.min.z},{x:box.max.x,y:box.min.z},{x:box.max.x,y:box.max.z},{x:box.min.x,y:box.max.z}],'#8888ff',[3,4]);
  }
  let row=0;
  for(const [name,d]of Object.entries(cfg.descriptors)){
   const item=data[name];if(!item)continue;
   const t=cfg.debug==='LEGACY'?cfg.legacyTransform(game.boss,cfg.legacy[name]):item.gameplay;
   const q=screen(t),p=item.screen,col='#'+colors[name].toString(16).padStart(6,'0'),def=WEAKPOINT_DEFS[name];
   const delta=Math.hypot(p.x-q.x,p.y-q.y);
   ctx.strokeStyle=col;ctx.fillStyle=col;
   if(['3D','OVERLAY','BOUNDS'].includes(cfg.debug)){ctx.beginPath();ctx.arc(p.x,p.y,5,0,TAU);ctx.stroke();}
   if(cfg.debug!=='3D'){ctx.beginPath();ctx.moveTo(q.x-6,q.y);ctx.lineTo(q.x+6,q.y);ctx.moveTo(q.x,q.y-6);ctx.lineTo(q.x,q.y+6);ctx.stroke();}
   if(['2D','BOUNDS','LEGACY'].includes(cfg.debug)){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(t.angle);ctx.strokeRect(-def.w/2,-def.h/2,def.w,def.h);ctx.restore();}
   const end=cfg.debug==='3D'?p:q,offset=[[-110,42],[-120,-44],[50,-40]][row];
   ctx.beginPath();ctx.moveTo(end.x,end.y);ctx.lineTo(end.x+offset[0],end.y+offset[1]);ctx.stroke();
   ctx.textAlign=offset[0]<0?'right':'left';ctx.fillText(def.label,end.x+offset[0],end.y+offset[1]-5);
   ctx.textAlign='left';ctx.fillText(def.label+'  delta '+delta.toFixed(4)+' px',24,290+row*20);row++;
  }
  ctx.fillStyle='#fff';ctx.fillText('G1 '+cfg.debug+' | circle=3D surface / cross=2D hit',24,255);
  if(cfg.debug==='BOUNDS'){
   ctx.fillText('orange=legacy hull 190×112; white=GLB hull',24,375);
   ctx.fillText('violet=full GLB ground AABB incl. barrel',24,395);
  }
  ctx.restore();
 }
 const row=document.createElement('div');row.className='controlRow';
 row.innerHTML='<label>G1 Weakpoints <select id="g1Preset"><option>LEGACY</option><option selected>TIGER_REMAP</option></select></label> <label>Debug <select id="g1Debug"><option>OFF</option><option>LEGACY</option><option>3D</option><option>2D</option><option>OVERLAY</option><option>BOUNDS</option></select></label> <label><input id="g1Labels" type="checkbox" checked>3D anchor labels</label><div id="g1Status" style="font-size:11px"></div>';
 document.getElementById('spikePanel').append(row);
 row.querySelector('#g1Preset').onchange=e=>cfg.setPreset(e.target.value);
 row.querySelector('#g1Debug').onchange=e=>{cfg.debug=e.target.value;};
 row.querySelector('#g1Labels').onchange=e=>{cfg.labels3D=e.target.checked;};
 return {update,project,drawDebug,data,markers,get valid(){return valid;}};
}
