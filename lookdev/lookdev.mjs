import * as THREE from '../spike/vendor/three.module.js';
import {GLTFLoader} from '../spike/vendor/GLTFLoader.js';
import {BASELINE,applyActorShadows} from './baseline.mjs';
import {syncCamera,clampGroundView,groundFootprint,groundAt,validateGroundRectangle} from './camera-boundary.mjs';

const $=id=>document.getElementById(id), viewport=$('viewport'),canvas=$('world');
const app={status:'LOADING',settings:{...BASELINE},assets:[],environment:null,frames:0,
  prewarmDraws:0,prewarmQueue:[],disposed:false,suspended:false,errors:[],raf:0,manifest:null,threeRevision:THREE.REVISION};
window.lookdev=app;
let renderer,scene,camera,fill,sun,center,clamp,drag=null,lastTime=0,resizeObserver;
const keys=new Set(),loader=new GLTFLoader();
const toneMap={None:THREE.NoToneMapping,ACES:THREE.ACESFilmicToneMapping,Reinhard:THREE.ReinhardToneMapping,Cineon:THREE.CineonToneMapping};

function disposeRoot(root){
  const geometries=new Set(),materials=new Set(),textures=new Set();
  root?.traverse(n=>{if(n.geometry)geometries.add(n.geometry);for(const m of n.material?(Array.isArray(n.material)?n.material:[n.material]):[]){
    materials.add(m);Object.values(m).forEach(v=>{if(v?.isTexture)textures.add(v);});}});
  textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());
}
function fail(message){
  app.status='FAILED';app.errors.push(message);$('controls').disabled=true;
  $('status').textContent='표시 환경을 준비할 수 없습니다.';
  $('fatal').hidden=false;$('fatal').replaceChildren(document.createTextNode(message));
  const retry=document.createElement('button');retry.textContent='다시 불러오기';retry.onclick=()=>location.reload();$('fatal').append(retry);
  if(app.raf)cancelAnimationFrame(app.raf);
}
function resize(){
  if(!renderer||app.disposed)return;
  const w=Math.max(1,viewport.clientWidth),h=Math.max(1,viewport.clientHeight);
  renderer.setPixelRatio(BASELINE.pixelRatio);renderer.setSize(w,h,false);updateCamera();
}
function updateCamera(){
  if(!camera||!app.manifest)return;
  syncCamera(camera,center,Math.max(1,viewport.clientWidth),Math.max(1,viewport.clientHeight),app.settings);
  clamp=clampGroundView(camera,center,app.manifest.field);
  $('zoom').min=clamp.minZoom.toFixed(6);$('zoom').max=Math.max(8,clamp.minZoom*8).toFixed(2);
  $('zoom').value=camera.zoom;$('zoomValue').value=camera.zoom.toFixed(2)+'×';
  // Same local sun region / constant light direction as Mainline.
  const texel=2*app.settings.shadowHalfSpan/app.settings.shadowMapSize;
  const x=Math.round(center.x/texel)*texel,z=Math.round(center.z/texel)*texel;
  sun.position.set(x+app.settings.sunX,app.settings.sunY,z+app.settings.sunZ);sun.target.position.set(x,0,z);
  sun.target.updateMatrixWorld(true);
}
function pan(dx,dz){center.x+=dx;center.z+=dz;updateCamera();}
function setZoom(zoom){camera.zoom=Number.isFinite(zoom)?Math.max(0.0001,zoom):camera.zoom;updateCamera();}
function home(){
  const f=app.manifest.field;center.x=(f.minX+f.maxX)/2;center.z=(f.minZ+f.maxZ)/2;camera.zoom=1;updateCamera();
}
function applySettings(){
  const s=app.settings;
  THREE.ColorManagement.enabled=true;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=toneMap[s.tone];renderer.toneMappingExposure=s.exposure;
  renderer.setClearColor(s.clearColor,1);renderer.autoClear=true;
  fill.color.setHex(s.hemisphereSky);fill.groundColor.setHex(s.hemisphereGround);fill.intensity=s.ambientIntensity;
  sun.color.setHex(s.sunColor);sun.intensity=s.sunIntensity;sun.castShadow=s.shadows;
  renderer.shadowMap.enabled=s.shadows;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const shadow=sun.shadow;
  if(shadow.mapSize.x!==s.shadowMapSize){
    shadow.dispose();shadow.map=null;shadow.mapPass=null;shadow.mapSize.set(s.shadowMapSize,s.shadowMapSize);
  }
  Object.assign(shadow.camera,{left:-s.shadowHalfSpan,right:s.shadowHalfSpan,top:s.shadowHalfSpan,bottom:-s.shadowHalfSpan,near:s.shadowNear,far:s.shadowFar});
  shadow.camera.updateProjectionMatrix();shadow.bias=s.shadowBias;shadow.normalBias=s.shadowNormalBias;
  renderer.shadowMap.needsUpdate=true;
  // ENV follows source Mainline policy (all ENV meshes cast+receive).
  app.environment?.root?.traverse(n=>{if(n.isMesh){n.castShadow=s.shadows;n.receiveShadow=s.shadows;}});
  for(const a of app.assets)if(a.root)applyActorShadows(a.root,s.shadows);
  $('ambient').value=s.ambientIntensity;$('ambientValue').value=s.ambientIntensity.toFixed(2);
  $('sun').value=s.sunIntensity;$('sunValue').value=s.sunIntensity.toFixed(2);
  $('exposure').value=s.exposure;$('exposureValue').value=s.exposure.toFixed(2);
  $('tone').value=s.tone;$('elevation').value=s.elevation;$('shadows').checked=s.shadows;
  $('bias').value=s.shadowBias;$('normalBias').value=s.shadowNormalBias;$('shadowSize').value=s.shadowMapSize;
  const baseline=Object.keys(BASELINE).every(k=>s[k]===BASELINE[k]);
  $('baselineState').textContent=baseline?'MAINLINE BASELINE':'LOOKDEV EXPERIMENT';
  updateCamera();inspectSelection();
}
function resetBaseline(){Object.assign(app.settings,BASELINE);applySettings();}
function validateModel(root){
  root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3());
  if(!Number.isFinite(box.min.length()+box.max.length())||size.length()===0)throw Error('Nonfinite or empty geometry');
  let meshes=0,normals=0,cast=0,receive=0;const materials=new Set(),nodes=[];
  root.traverse(n=>{
    nodes.push({name:n.name,parent:n.parent?.name||null,position:n.position.toArray(),quaternion:n.quaternion.toArray(),scale:n.scale.toArray()});
    if(!n.isMesh)return;meshes++;cast+=Number(n.castShadow);receive+=Number(n.receiveShadow);
    const p=n.geometry.attributes.position,normal=n.geometry.attributes.normal;
    if(!normal||normal.count!==p.count)throw Error('Missing/mismatched normals: '+n.name);
    for(const attribute of [p,normal])for(const value of attribute.array)if(!Number.isFinite(value))throw Error('Nonfinite vertex/normal: '+n.name);
    normals++;(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>materials.add(m));
  });
  return {meshes,normals,cast,receive,bounds:{min:box.min.toArray(),max:box.max.toArray(),size:size.toArray()},nodes,
    materials:[...materials].map(m=>({name:m.name,type:m.type,color:m.color?.getHexString(),roughness:m.roughness,metalness:m.metalness,
      transparent:m.transparent,opacity:m.opacity,mapColorSpace:m.map?.colorSpace||null}))};
}
async function load(descriptor,isEnvironment=false){
  const record={...descriptor,status:'LOADING',root:null};
  if(isEnvironment)app.environment=record;else app.assets.push(record);
  let parsed=null;
  try{
    const response=await fetch(descriptor.url);if(!response.ok)throw Error('HTTP '+response.status);
    const bytes=await response.arrayBuffer();if(bytes.byteLength!==descriptor.bytes)throw Error('Byte length mismatch');
    const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
    if(hash!==descriptor.sha256)throw Error('Derivative hash mismatch');
    parsed=await loader.parseAsync(bytes,new URL('./assets/',location.href).href);
    if(app.disposed){disposeRoot(parsed.scene);return record;}
    if(isEnvironment){
      record.root=parsed.scene;
      if(record.root.position.lengthSq()!==0||record.root.scale.toArray().some(v=>v!==1)||
        record.root.quaternion.toArray().some((v,i)=>v!==(i===3?1:0)))throw Error('ENV source root is not identity');
      record.root.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});
      record.coverage=validateGroundRectangle(record.root,app.manifest.field);
      if(!record.coverage.covered)throw Error('ENC rectangle crosses a ground hole: '+JSON.stringify(record.coverage));
    }else{
      const wrapper=new THREE.Group();wrapper.name='LOOKDEV_'+descriptor.id;wrapper.add(parsed.scene);
      wrapper.scale.setScalar(descriptor.scale);wrapper.position.fromArray(descriptor.position);wrapper.position.y+=descriptor.groundOffset;
      wrapper.rotation.y=-descriptor.yaw*Math.PI/180;wrapper.visible=descriptor.visible;
      record.root=wrapper;applyActorShadows(wrapper);
    }
    record.validation=validateModel(record.root);record.status='READY';scene.add(record.root);
    record.animationNames=parsed.animations.map(a=>a.name);record.hashVerified=true;
  }catch(error){
    if(parsed)disposeRoot(parsed.scene);record.root=null;record.status='MISSING';record.error=error.message;
    // Failure is visible in the panel, but other R&D models continue to load.
    app.errors.push(record.label+': '+error.message);
  }
  return record;
}
function selected(){return app.assets.find(a=>a.id===$('assetSelect').value);}
function inspectSelection(){
  const a=selected();if(!a)return;
  const flags={cast:0,receive:0};a.root?.traverse(n=>{if(n.isMesh){flags.cast+=Number(n.castShadow);flags.receive+=Number(n.receiveShadow);}});
  $('inspector').textContent=JSON.stringify({status:a.status,sourceRole:a.sourceRole,mainline:a.mainlineReference,
    scale:a.scale,groundOffset:a.groundOffset,basis:a.transformBasis,pivot:'authored local hierarchy retained',
    materials:a.validation?.materials,meshes:a.validation?.meshes,normalMeshes:a.validation?.normals,
    cast:flags.cast,receive:flags.receive,size:a.validation?.bounds.size,
    animationClips:a.animationNames,error:a.error},null,2);
}
function assetUI(){
  $('assetCount').textContent=app.assets.filter(a=>a.status==='READY').length+' / '+app.assets.length;
  $('assetSelect').replaceChildren();$('assetList').replaceChildren();
  for(const a of app.assets){
    const option=document.createElement('option');option.value=a.id;option.textContent=a.label;$('assetSelect').append(option);
    const row=document.createElement('label');row.className='assetRow';const check=document.createElement('input');check.type='checkbox';
    check.checked=!!a.root?.visible;check.disabled=!a.root;check.dataset.assetId=a.id;
    check.onchange=()=>{a.root.visible=check.checked;$('assetSelect').value=a.id;inspectSelection();};
    const text=document.createElement('span');text.textContent=a.label+' · '+a.status;row.append(check,text);$('assetList').append(row);
  }
  inspectSelection();
}
function roster(){for(const a of app.assets)if(a.root)a.root.visible=a.visible;assetUI();}
function solo(){const a=selected();for(const item of app.assets)if(item.root)item.root.visible=item===a;
  const id=a?.id;assetUI();if(id)$('assetSelect').value=id;inspectSelection();focus();}
function focus(){
  const a=selected();if(!a?.root)return;
  const box=new THREE.Box3().setFromObject(a.root),point=box.getCenter(new THREE.Vector3());
  center.x=point.x;center.z=point.z;updateCamera();
}
function prepareOne(){
  const a=app.prewarmQueue.shift(),visible=a.root.visible,meshes=[];
  a.root.visible=true;a.root.traverse(n=>{if(n.isMesh){meshes.push([n,n.frustumCulled]);n.frustumCulled=false;}});
  try{renderer.compile(scene,camera);renderer.render(scene,camera);if(app.status!=='FAILED'){a.gpuPrepared=true;app.prewarmDraws++;}}
  finally{a.root.visible=visible;meshes.forEach(([n,v])=>n.frustumCulled=v);}
  if(app.status==='FAILED')return;
  $('status').textContent='GPU 준비 '+app.prewarmDraws+' / '+(app.assets.filter(a=>a.root).length+Number(!!app.environment.root));
  if(!app.prewarmQueue.length){
    app.status=app.errors.length?'DEGRADED':'READY';$('controls').disabled=false;
    $('status').textContent=app.status==='READY'?'Mainline 기준 준비 완료 · ENC 필드':
      '일부 자산을 사용할 수 없습니다. 사용 가능한 모델은 계속 표시됩니다. '+app.errors.join(' / ');
    assetUI();
  }
}
function frame(time){
  if(app.disposed||app.suspended||app.status==='FAILED')return;
  app.frames++;const dt=Math.min(0.05,(time-(lastTime||time))/1000);lastTime=time;
  if(keys.size){const speed=35/camera.zoom*dt;pan(((keys.has('d')||keys.has('ArrowRight'))?speed:0)-((keys.has('a')||keys.has('ArrowLeft'))?speed:0),
    ((keys.has('s')||keys.has('ArrowDown'))?speed:0)-((keys.has('w')||keys.has('ArrowUp'))?speed:0));}
  try{
    if(app.status==='PREPARING')prepareOne();else renderer.render(scene,camera);
    if(app.frames%15===0)$('metrics').textContent='r'+THREE.REVISION+' · '+renderer.info.render.calls+' draws · '+
      Math.round(renderer.info.render.triangles/1000)+'k tris · '+camera.zoom.toFixed(2)+'×';
  }catch(e){fail(e.message);return;}
  if(app.status!=='FAILED')app.raf=requestAnimationFrame(frame);
}
function dispose(){
  if(app.disposed)return;app.disposed=true;cancelAnimationFrame(app.raf);resizeObserver?.disconnect();keys.clear();drag=null;
  for(const a of [app.environment,...app.assets])if(a?.root){scene.remove(a.root);disposeRoot(a.root);a.root=null;}
  sun?.shadow.dispose();renderer?.dispose();app.status='DISPOSED';
}
function controls(){
  $('baseline').onclick=resetBaseline;$('home').onclick=home;$('roster').onclick=roster;$('solo').onclick=solo;
  $('focus').onclick=focus;$('assetSelect').onchange=inspectSelection;
  $('zoom').oninput=e=>setZoom(Number(e.target.value));
  for(const [id,key] of [['ambient','ambientIntensity'],['sun','sunIntensity'],['exposure','exposure'],['bias','shadowBias'],['normalBias','shadowNormalBias'],['shadowSize','shadowMapSize'],['elevation','elevation']]){
    $(id).oninput=e=>{const n=Number(e.target.value);if(Number.isFinite(n)){app.settings[key]=n;applySettings();}};
  }
  $('tone').onchange=e=>{app.settings.tone=e.target.value;applySettings();};
  $('shadows').onchange=e=>{app.settings.shadows=e.target.checked;applySettings();};
  canvas.addEventListener('wheel',e=>{e.preventDefault();setZoom(camera.zoom*Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*0.001));},{passive:false});
  const ndc=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2];};
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;const p=groundAt(camera,...ndc(e));if(p){drag={point:p,id:e.pointerId};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';}});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=groundAt(camera,...ndc(e));if(p)pan(drag.point.x-p.x,drag.point.z-p.z);});
  const endDrag=()=>{drag=null;canvas.style.cursor='grab';};
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,endDrag);
  window.addEventListener('keydown',e=>{
    if(e.target.closest('input,select,textarea,button')||e.ctrlKey||e.altKey||e.metaKey)return;
    if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){keys.add(e.key);e.preventDefault();}
    if(e.key==='Home'){home();e.preventDefault();}
  });
  window.addEventListener('keyup',e=>keys.delete(e.key));window.addEventListener('blur',()=>{keys.clear();endDrag();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('WebGL context를 잃었습니다. 다시 불러와 주세요.');});
  window.addEventListener('pagehide',e=>{
    if(e.persisted){app.suspended=true;cancelAnimationFrame(app.raf);keys.clear();endDrag();}
    else dispose();
  });
  window.addEventListener('pageshow',e=>{
    if(e.persisted&&app.suspended&&!app.disposed){app.suspended=false;lastTime=0;app.raf=requestAnimationFrame(frame);}
  });
}

async function start(){
  try{
    const response=await fetch('./manifest.json');if(!response.ok)throw Error('Manifest HTTP '+response.status);app.manifest=await response.json();
    scene=new THREE.Scene();camera=new THREE.OrthographicCamera(-1,1,1,-1,0.1,BASELINE.cameraFar);
    center={x:0,z:0};fill=new THREE.HemisphereLight();sun=new THREE.DirectionalLight();scene.add(fill,sun,sun.target);
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
    renderer.debug.onShaderError=()=>fail('GLB shader 준비에 실패했습니다.');
    Object.assign(app,{renderer,scene,camera,center,pan,setZoom,resize,resetBaseline,focus,dispose,
      footprint:()=>groundFootprint(camera),setElevation:value=>{app.settings.elevation=value;applySettings();}});
    home();applySettings();resize();controls();resizeObserver=new ResizeObserver(resize);resizeObserver.observe(viewport);
    app.raf=requestAnimationFrame(frame);
    await load(app.manifest.environment,true);
    if(app.disposed)return;
    if(!app.environment.root){
      // Clearly labelled diagnostic floor. Never claimed as a successful ENV baseline.
      const f=app.manifest.field,geometry=new THREE.PlaneGeometry(f.maxX-f.minX,f.maxZ-f.minZ);
      const floor=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0x77796a}));floor.rotation.x=-Math.PI/2;
      floor.position.set((f.minX+f.maxX)/2,0,(f.minZ+f.maxZ)/2);floor.receiveShadow=true;
      app.environment.root=floor;scene.add(floor);app.environment.fallback=true;
    }
    // Small fixed batch prevents unbounded simultaneous decoding / GPU allocation.
    for(let i=0;i<app.manifest.actors.length;i+=4){
      await Promise.all(app.manifest.actors.slice(i,i+4).map(a=>load(a)));
      if(app.disposed||app.status==='FAILED')return;
      $('status').textContent='모델 로딩 '+app.assets.length+' / '+app.manifest.actors.length;
    }
    app.assets.sort((a,b)=>app.manifest.actors.findIndex(m=>m.id===a.id)-app.manifest.actors.findIndex(m=>m.id===b.id));
    assetUI();applySettings();app.prewarmQueue=[app.environment,...app.assets].filter(a=>a.root);app.status='PREPARING';
  }catch(e){fail(e.message);}
}
start();
