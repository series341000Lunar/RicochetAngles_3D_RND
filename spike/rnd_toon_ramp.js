import * as THREE from './vendor/three.module.js';
import {ShaderPass} from './vendor/postprocessing/ShaderPass.js';

// Tone-mapped input, BEFORE creative grade. Artist PNG is scalar ramp data.
export function createToonRamp(){
 const config={enabled:false,mode:'Numeric 4',strength:.6,filter:'Nearest'};
 const numeric={
  'Numeric 3':{thresholds:[.33,.66],levels:[.16,.55,.95]},
  'Numeric 4':{thresholds:[.28,.52,.78],levels:[.16,.38,.66,1]},
  'Numeric 5':{thresholds:[.2,.4,.6,.8],levels:[.12,.3,.49,.72,.95]}
 };
 const state={loaded:false,error:null,width:0,height:0};
 const uniforms={tDiffuse:{value:null},ramp:{value:null},strength:{value:.6},useRamp:{value:0},count:{value:4},thresholds:{value:new Float32Array(4)},levels:{value:new Float32Array(5)}};
 const pass=new ShaderPass({
 uniforms,
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
 fragmentShader:
 'uniform sampler2D tDiffuse,ramp;uniform float strength;uniform int useRamp,count;uniform float thresholds[4],levels[5];varying vec2 vUv;'+
 'vec3 decodeRGB(vec3 c){return mix(c/12.92,pow(max((c+.055)/1.055,vec3(0.0)),vec3(2.4)),step(vec3(.04045),c));}'+
 'vec3 encodeRGB(vec3 c){return mix(c*12.92,1.055*pow(max(c,vec3(0.0)),vec3(1.0/2.4))-.055,step(vec3(.0031308),c));}'+
 'void main(){vec4 src=texture2D(tDiffuse,vUv);vec3 linear=decodeRGB(src.rgb);float y=dot(linear,vec3(.2126,.7152,.0722));'+
 'float axis=clamp(encodeRGB(vec3(y)).r,0.0,1.0);float q=levels[0];'+
 'if(useRamp==1){q=dot(texture2D(ramp,vec2(axis,.5)).rgb,vec3(.2126,.7152,.0722));}'+
 'else{for(int i=0;i<4;i++){if(i<count-1&&axis>=thresholds[i])q=levels[i+1];}}'+
 'float target=decodeRGB(vec3(q)).r;vec3 toon=y>0.00001?linear*(target/y):vec3(target);'+
 'toon/=max(1.0,max(toon.r,max(toon.g,toon.b)));'+
 'gl_FragColor=vec4(encodeRGB(mix(linear,toon,strength)),src.a);}'
 });
 pass.material.toneMapped=false;pass.enabled=false;
 let texture=null,filter=null,statusNode=null;
 // Bitmap experiment retained in shader only; no startup download or primary UI.
 const ready=Promise.resolve();
 function sync(){
  pass.enabled=config.enabled&&config.strength>0;
  const data=numeric[config.mode]||numeric['Numeric 4'];
  pass.uniforms.count.value=data.levels.length;
  pass.uniforms.thresholds.value.fill(1);pass.uniforms.thresholds.value.set(data.thresholds);
  pass.uniforms.levels.value.fill(1);pass.uniforms.levels.value.set(data.levels);
  pass.uniforms.strength.value=config.strength;
  pass.uniforms.useRamp.value=config.mode==='T_Lut_03'&&state.loaded?1:0;
  if(texture&&filter!==config.filter){filter=config.filter;texture.minFilter=texture.magFilter=filter==='Linear'?THREE.LinearFilter:THREE.NearestFilter;texture.needsUpdate=true;}
 }
 function attach(panel){
  const box=document.createElement('div');box.id='toonControls';box.style.cssText='border-top:1px solid #596151;margin-top:6px;padding-top:5px';
  box.innerHTML='<div class="controlRow"><label><input id="toonEnabled" type="checkbox">Toon</label>'+
  '<label>Mode <select id="toonMode"><option>Numeric 3</option><option selected>Numeric 4</option><option>Numeric 5</option></select></label>'+
  '<label hidden>Filter <select id="toonFilter"><option>Nearest</option><option>Linear</option></select></label></div>'+
  '<label>Toon Strength <input id="toonStrength" type="range" min="0" max="1" step=".01" value=".6" style="width:180px"><output>0.60</output></label>'+
  '<div style="font-size:11px">Color Grading과 독립적으로 작동합니다. 둘 다 켜면 Tone → Toon → Grade 순서입니다.</div>'+
  '<div id="toonRampStatus" style="font-size:11px">Numeric 4 · preferred candidate</div>'+
  '<details><summary>Numeric ramp values</summary><label>Thresholds <input id="toonThresholds" size="24"></label> '+
  '<label>Output levels <input id="toonLevels" size="28"></label> <button id="toonApply" type="button">Apply</button><span id="toonEditStatus"></span></details>';
  panel.append(box);statusNode=box.querySelector('#toonRampStatus');
  if(state.loaded)statusNode.textContent='T_Lut_03 · '+state.width+'×'+state.height+' · U=luminance, V=0.5';
  if(state.error)statusNode.textContent='Ramp load failed — Numeric 4 fallback';
  const refresh=()=>{
   const data=numeric[config.mode],enabled=!!data;
   for(const id of ['toonThresholds','toonLevels','toonApply'])box.querySelector('#'+id).disabled=!enabled;
   box.querySelector('#toonThresholds').value=data?.thresholds.join(', ')||'Select a Numeric mode';
   box.querySelector('#toonLevels').value=data?.levels.join(', ')||'';
   box.querySelector('#toonEditStatus').textContent='';
   box.querySelector('#toonFilter').disabled=enabled;
  };
  box.querySelector('#toonEnabled').onchange=e=>{config.enabled=e.target.checked;};
  box.querySelector('#toonMode').onchange=e=>{config.mode=e.target.value;refresh();};
  box.querySelector('#toonFilter').onchange=e=>{config.filter=e.target.value;};
  box.querySelector('#toonStrength').oninput=e=>{config.strength=Number(e.target.value);e.target.nextElementSibling.textContent=config.strength.toFixed(2);};
  box.querySelector('#toonApply').onclick=()=>{
   const data=numeric[config.mode];if(!data)return;
   const parse=id=>box.querySelector('#'+id).value.trim().split(/[,\s]+/).map(Number);
   const t=parse('toonThresholds'),l=parse('toonLevels');
   const valid=(a,n,interior)=>a.length===n&&a.every((v,i)=>Number.isFinite(v)&&v>=(interior?.00001:0)&&v<=(interior?.99999:1)&&(i===0||v>a[i-1]));
   if(!valid(t,data.thresholds.length,true)||!valid(l,data.levels.length,false)){box.querySelector('#toonEditStatus').textContent=' Invalid: ascending 0..1 values required';return;}
   data.thresholds=t;data.levels=l;box.querySelector('#toonEditStatus').textContent=' Applied';
  };
  refresh();
 }
 return {config,numeric,state,pass,ready,sync,attach,dispose(){texture?.dispose();pass.dispose();}};
}
