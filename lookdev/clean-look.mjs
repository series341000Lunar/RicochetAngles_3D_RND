import * as THREE from '../spike/vendor/three.module.js';
import {BASELINE} from './baseline.mjs';

// Dated LookDev candidate, not a replacement for the preserved Mainline reference.
export const CLEAN_SETTINGS=Object.freeze({...BASELINE,
  name:'CLEAN LOW-POLY CANDIDATE',ambientIntensity:1.15,sunIntensity:2.05,
  hemisphereSky:0xdbe3e5,hemisphereGround:0x888576,sunColor:0xfff4df,
  sunX:-55,sunY:115,sunZ:40,shadowHalfSpan:90,
  shadowBias:-0.0003,shadowNormalBias:0.035,tone:'ACES',exposure:1.05
});
export const LOOK_MODES=Object.freeze(['MAINLINE_REFERENCE','CLEAN_LOW_POLY','CLEAN_OUTLINE','BLACK_OUTLINE_CONTOUR_ONLY']);
const actorParts=/^(?:HULL|TRACK_[LR]|TURRET|GUN|PROP|WHEEL_(?:FL|FR|RL|RR)|ADDON_(?:SIDE_[LR]|FRONT|REAR|TURRET)|AUX_TRACK_[LR]|GUNHOUSE|CONCRETE_CASEMATE|FORTIFICATION_BASE|COUPLER_(?:ASSEMBLY|CARRIAGE|FOUNDATION)_[NS])$/;
const envParts=/^ENC_Infantry_Cover_Position_00[12]$/;
const reserved=/energy|weak|critical|core|warning|signal/i;
export function outlinePartOf(mesh,isEnvironment=false,authoredNodes=null){
  const pattern=isEnvironment?envParts:actorParts;
  if(pattern.test(mesh.name))return mesh.name;
  // GLTFLoader expands multi-material semantic nodes into *_mesh primitives.
  // Match that immediate semantic parent, not every descendant under a Hull.
  const parent=mesh.parent;
  const primitive=parent&&((authoredNodes&&!authoredNodes.has(mesh.name))||mesh.name.startsWith(parent.name+'_mesh')||/^Mesh\d*(?:_\d+)?$/.test(mesh.name));
  return parent&&pattern.test(parent.name)&&primitive?parent.name:null;
}

// Weld only an outline normal attribute. Original position/index/normal data stay intact.
// Average distinct face normals at coincident positions to avoid hard-face cracks.
export function outlineGeometry(source){
  const p=source.attributes.position,n=source.attributes.normal,groups=new Map(),keys=[];
  for(let i=0;i<p.count;i++){
    const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*100000)).join(',');keys.push(key);
    if(!groups.has(key))groups.set(key,new Map());
    const normal=[n.getX(i),n.getY(i),n.getZ(i)];
    groups.get(key).set(normal.map(v=>Math.round(v*10000)).join(','),normal);
  }
  const directions=new Map(),unique=new Map(),positions=[];
  for(const [key,normals] of groups){
    const v=new THREE.Vector3();for(const normal of normals.values())v.add(new THREE.Vector3().fromArray(normal));
    directions.set(key,v.lengthSq()>1e-10?v.normalize():new THREE.Vector3().fromArray(normals.values().next().value));
  }
  for(let i=0;i<p.count;i++)if(!unique.has(keys[i])){
    unique.set(keys[i],unique.size);positions.push(p.getX(i),p.getY(i),p.getZ(i));
  }
  const smooth=new Float32Array(unique.size*3);
  for(const [key,index] of unique)directions.get(key).toArray(smooth,index*3);
  const indexCount=source.index?source.index.count:p.count;
  const indices=Array.from({length:indexCount},(_,i)=>unique.get(keys[source.index?source.index.getX(i):i]));
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('outlineNormal',new THREE.BufferAttribute(smooth,3));
  g.setIndex(indices);
  // Keep primitive groups so material-array models retain their authored draw ranges.
  for(const group of source.groups)g.addGroup(group.start,group.count,group.materialIndex);
  g.setDrawRange(source.drawRange.start,source.drawRange.count);
  g.boundingBox=source.boundingBox?.clone()||null;g.boundingSphere=source.boundingSphere?.clone()||null;
  return g;
}
export function makeOutlineMaterial(viewport,width){
  return new THREE.ShaderMaterial({name:'CLEAN_BLACK_OUTLINE',
    uniforms:{viewport:{value:viewport},widthPixels:{value:width}},
    vertexShader:`uniform vec2 viewport; uniform float widthPixels; attribute vec3 outlineNormal;
      void main(){
        vec4 clip=projectionMatrix*modelViewMatrix*vec4(position,1.0);
        vec3 viewNormal=normalize(normalMatrix*outlineNormal);
        vec2 direction=(projectionMatrix*vec4(viewNormal,0.0)).xy;
        float size=length(direction);
        if(size>0.00001)clip.xy+=(direction/size)*(2.0*widthPixels/viewport)*clip.w;
        gl_Position=clip;
      }`,
    fragmentShader:'void main(){gl_FragColor=vec4(0.0,0.0,0.0,1.0);}',
    side:THREE.BackSide,depthTest:true,depthWrite:false,toneMapped:false,
    polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1
  });
}
export function roleOf(record){
  if(record.mainlineReference?.includes('/US_M4A3E8/'))return 'player';
  if(record.mainlineReference?.includes('Stage1Boss'))return 'major';
  if(record.root?.getObjectByName('COASTAL_BATTERY_ROOT'))return 'major';
  if(record.root?.getObjectByName('PROP')||record.label?.includes('PAK_'))return 'at';
  return 'vehicle';
}
export function createCleanLook(environment,actors){
  const state={mode:'MAINLINE_REFERENCE',worldSaturation:0.48,outlinePixels:1.15,
    materials:0,outlineMeshes:0,geometryBytes:0,outlinedEnvironment:[],disposed:false};
  const viewport=new THREE.Vector2(1,1),palette=[],shells=[],geometries=new Map(),materials=new Map();
  const multiplier={player:1.15,major:1.1,vehicle:1,at:0.9,structure:0.7,wreck:0.72};
  const all=[{root:environment?.root,isEnvironment:true,record:environment},...actors.map(record=>({root:record.root,isEnvironment:false,record}))];
  function material(role){
    if(!materials.has(role))materials.set(role,makeOutlineMaterial(viewport,state.outlinePixels*multiplier[role]));
    return materials.get(role);
  }
  for(const item of all){
    if(!item.root)continue;
    const snapshots=new Map(),sourceMeshes=[];
    item.root.traverse(mesh=>{
      if(!mesh.isMesh||mesh.userData.lookdevOutline)return;sourceMeshes.push(mesh);
      for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
        if(!m?.color||snapshots.has(m))continue;
        snapshots.set(m,{material:m,color:m.color.clone(),emissive:m.emissive?.clone(),emissiveIntensity:m.emissiveIntensity,
          roughness:m.roughness,metalness:m.metalness,protected:reserved.test(m.name)});
      }
    });
    palette.push({...item,role:item.isEnvironment?'world':roleOf(item.record),snapshots:[...snapshots.values()],sourceMeshes});
    const role=item.isEnvironment?'structure':roleOf(item.record);
    const authoredNodes=item.record.authoredNodeNames?new Set(item.record.authoredNodeNames):null;
    for(const mesh of sourceMeshes){
      const ms=Array.isArray(mesh.material)?mesh.material:[mesh.material];
      const part=outlinePartOf(mesh,item.isEnvironment,authoredNodes);
      if(mesh.isSkinnedMesh||mesh.morphTargetInfluences||!mesh.geometry.attributes.normal||
        !ms.length||ms.some(m=>!m||m.transparent||m.opacity<1||m.wireframe)||
        ms.every(m=>reserved.test(m.name)||/small.?accent/i.test(m.name))||!part)continue;
      if(!geometries.has(mesh.geometry))geometries.set(mesh.geometry,outlineGeometry(mesh.geometry));
      const shell=new THREE.Mesh(geometries.get(mesh.geometry),material(role));
      shell.name='CLEAN_OUTLINE_'+mesh.name;shell.visible=false;shell.frustumCulled=false;
      shell.userData={lookdevOutline:true,unifiedNoShadow:true};shell.castShadow=false;shell.receiveShadow=false;
      // Child identity inherits the authored mesh transform/pivot; no per-frame copy.
      // Draw after opaque ground/actors so the floor cannot overwrite a non-depth-writing hull.
      shell.renderOrder=1;mesh.add(shell);shells.push({mesh,shell,record:item.record,role});
      if(item.isEnvironment&&!state.outlinedEnvironment.includes(part))state.outlinedEnvironment.push(part);
    }
  }
  // One shared shader material per semantic emphasis role, not one per mesh.
  material('wreck');state.materials=materials.size;state.outlineMeshes=shells.length;
  state.geometryBytes=[...geometries.values()].reduce((sum,g)=>sum+g.attributes.position.array.byteLength+g.attributes.outlineNormal.array.byteLength+(g.index?.array.byteLength||0),0);
  const gray=new THREE.Color();
  function apply(){
    const candidate=state.mode!=='MAINLINE_REFERENCE';
    for(const item of palette){
      const wreck=candidate&&!item.isEnvironment&&item.record.lookdevWreck;
      for(const p of item.snapshots){
        const m=p.material;m.color.copy(p.color);if(m.emissive&&p.emissive)m.emissive.copy(p.emissive);
        m.emissiveIntensity=p.emissiveIntensity;m.roughness=p.roughness;m.metalness=p.metalness;
        if(!candidate)continue;
        if(wreck){
          const value=(p.color.r*.2126+p.color.g*.7152+p.color.b*.0722)*.3+.008;
          m.color.setRGB(value*.94,value,value*.98);if(m.emissive)m.emissive.setRGB(0,0,0);m.emissiveIntensity=0;
          if(m.roughness!==undefined)m.roughness=1;if(m.metalness!==undefined)m.metalness=0;continue;
        }
        // Warning / energy / weakpoint palette is reserved, never globally recolored.
        if(p.protected)continue;
        const luminance=p.color.r*.2126+p.color.g*.7152+p.color.b*.0722;
        gray.setRGB(luminance,luminance,luminance);
        const saturation=item.isEnvironment?state.worldSaturation:item.role==='player'?.82:item.role==='major'?.65:.72;
        m.color.lerp(gray,1-saturation);
        const value=item.isEnvironment?1.12:item.role==='player'?1.17:item.role==='major'?1.08:1.02;
        m.color.multiplyScalar(value);
        if(item.isEnvironment){m.color.r=m.color.r*1.025+.004;m.color.g=m.color.g*1.035+.004;m.color.b+=.004;}
        if(m.roughness!==undefined)m.roughness=Math.max(p.roughness,item.isEnvironment?.85:.82);
        if(m.metalness!==undefined)m.metalness=Math.min(p.metalness,.16);
      }
    }
    for(const item of shells){
      item.shell.visible=state.mode==='CLEAN_OUTLINE';
      item.shell.material=material(item.record.lookdevWreck?'wreck':item.role);
      item.shell.castShadow=false;item.shell.receiveShadow=false;
    }
    for(const [role,m] of materials)m.uniforms.widthPixels.value=state.outlinePixels*multiplier[role];
  }
  return {state,apply,resize:(w,h)=>viewport.set(Math.max(w,1),Math.max(h,1)),
    setMode(mode){if(!LOOK_MODES.includes(mode))throw Error('Unknown LookDev mode');state.mode=mode;
      if(mode==='MAINLINE_REFERENCE')for(const a of actors)a.lookdevWreck=false;apply();},
    metrics(){return {mode:state.mode,outlineMeshes:state.outlineMeshes,visibleOutlineMeshes:shells.filter(s=>{
      for(let n=s.shell;n;n=n.parent)if(!n.visible)return false;return true;
    }).length,shaderMaterials:materials.size,geometryBytes:state.geometryBytes,outlinedEnvironment:state.outlinedEnvironment};},
    originalsRestored(){return palette.every(p=>p.snapshots.every(s=>s.material.color.equals(s.color)&&s.material.roughness===s.roughness&&
      s.material.metalness===s.metalness&&s.material.emissiveIntensity===s.emissiveIntensity&&(!s.emissive||s.material.emissive.equals(s.emissive))));},
    dispose(){if(state.disposed)return;state.mode='MAINLINE_REFERENCE';apply();state.disposed=true;
      for(const s of shells)s.mesh.remove(s.shell);for(const g of geometries.values())g.dispose();for(const m of materials.values())m.dispose();
      shells.length=0;geometries.clear();materials.clear();}
  };
}
