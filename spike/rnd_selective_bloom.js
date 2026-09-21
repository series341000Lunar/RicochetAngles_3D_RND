import * as THREE from './vendor/three.module.js';
import {ShaderPass} from './vendor/postprocessing/ShaderPass.js';
import {FullScreenQuad} from './vendor/postprocessing/Pass.js';

// V5: explicit presentation-only registry. Never infer eligibility from scene brightness.
export function createSelectiveBloom(renderer,camera){
 const config={enabled:false,strength:.6,radius:.25,threshold:.85};
 const scene=new THREE.Scene();scene.background=new THREE.Color(0);
 const registry=new Map(),state={activeSources:0,passes:0,width:1,height:1};
 const makeTarget=()=>new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false,stencilBuffer:false});
 const source=makeTarget(),horizontal=makeTarget(),glow=makeTarget();
 const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
 function register(mesh,kind,isActive=()=>true){
  if(registry.has(mesh))return;
  if(!['playerFlash','bossFlash','qShell'].includes(kind))throw Error('Unsupported bloom source');
  mesh.userData.bloomEligible=true;mesh.userData.bloomKind=kind;
  const material=new THREE.ShaderMaterial({
   uniforms:{color:{value:new THREE.Color()},energy:{value:kind==='qShell'?2:8},opacity:{value:1}},
   vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
   fragmentShader:'uniform vec3 color;uniform float energy,opacity;void main(){gl_FragColor=vec4(color*energy*opacity,1.0);}',
   transparent:true,blending:THREE.AdditiveBlending,depthTest:false,depthWrite:false,toneMapped:false
  });
  const proxy=new THREE.Mesh(mesh.geometry,material);proxy.matrixAutoUpdate=false;proxy.frustumCulled=false;scene.add(proxy);registry.set(mesh,{proxy,kind,isActive});
 }
 const blur=new THREE.ShaderMaterial({uniforms:{inputTexture:{value:null},direction:{value:new THREE.Vector2()},radius:{value:.25},threshold:{value:.85},extract:{value:0}},
 vertexShader:vertex,fragmentShader:
 'uniform sampler2D inputTexture;uniform vec2 direction;uniform float radius,threshold,extract;varying vec2 vUv;'+
 'void main(){vec3 total=vec3(0.0);float weightSum=0.0;for(int i=-4;i<=4;i++){float x=float(i);float w=exp(-x*x/8.0);vec3 c=texture2D(inputTexture,vUv+direction*x*(1.0+radius*3.0)).rgb;'+
 'if(extract>0.5){float l=dot(c,vec3(.2126,.7152,.0722));c*=max(l-threshold,0.0)/max(l,.00001);}total+=c*w;weightSum+=w;}gl_FragColor=vec4(total/weightSum,1.0);}',
 depthTest:false,depthWrite:false,toneMapped:false});
 const quad=new FullScreenQuad(blur);
 const composite=new ShaderPass({uniforms:{tDiffuse:{value:null},bloomTexture:{value:null},strength:{value:.6}},
 vertexShader:vertex,fragmentShader:
 'uniform sampler2D tDiffuse,bloomTexture;uniform float strength;varying vec2 vUv;'+
 'vec3 decodeRGB(vec3 c){return mix(c/12.92,pow(max((c+.055)/1.055,vec3(0.0)),vec3(2.4)),step(vec3(.04045),c));}'+
 'vec3 encodeRGB(vec3 c){return mix(c*12.92,1.055*pow(max(c,vec3(0.0)),vec3(1.0/2.4))-.055,step(vec3(.0031308),c));}'+
 'void main(){vec4 c=texture2D(tDiffuse,vUv);vec3 light=texture2D(bloomTexture,vUv).rgb*strength;gl_FragColor=vec4(encodeRGB(decodeRGB(c.rgb)+light),c.a);}'
 });
 composite.uniforms.bloomTexture.value=glow.texture;
 composite.material.toneMapped=false;composite.enabled=false;
 function resize(w,h){
  w=Math.max(1,Math.ceil(w/2));h=Math.max(1,Math.ceil(h/2));
  if(state.width===w&&state.height===h)return;
  state.width=w;state.height=h;for(const t of [source,horizontal,glow])t.setSize(w,h);
 }
 function render(){
  composite.enabled=config.enabled;state.passes=0;state.activeSources=0;
  if(!config.enabled)return;
  const oldTarget=renderer.getRenderTarget(),oldTone=renderer.toneMapping,oldAuto=renderer.autoClear;
  try{
   for(const [mesh,{proxy,isActive}] of registry){
    let visible=mesh.visible&&mesh.material.opacity>0&&mesh.userData.bloomEligible===true;
    for(let p=mesh.parent;p;p=p.parent)visible=visible&&p.visible;
    visible=visible&&!!mesh.parent&&(state.prewarming||isActive());
    proxy.visible=visible;if(!visible)continue;
    mesh.updateWorldMatrix(true,false);proxy.matrix.copy(mesh.matrixWorld);proxy.matrixWorld.copy(mesh.matrixWorld);
    proxy.material.uniforms.color.value.copy(mesh.material.color);
    proxy.material.uniforms.opacity.value=mesh.material.opacity;
    state.activeSources++;
   }
   renderer.toneMapping=THREE.NoToneMapping;renderer.autoClear=true;
   renderer.setRenderTarget(source);renderer.render(scene,camera);
   if(state.activeSources){
    blur.uniforms.radius.value=config.radius;blur.uniforms.threshold.value=config.threshold;
    blur.uniforms.inputTexture.value=source.texture;blur.uniforms.direction.value.set(1/state.width,0);blur.uniforms.extract.value=1;
    renderer.setRenderTarget(horizontal);quad.render(renderer);
    blur.uniforms.inputTexture.value=horizontal.texture;blur.uniforms.direction.value.set(0,1/state.height);blur.uniforms.extract.value=0;
    renderer.setRenderTarget(glow);quad.render(renderer);state.passes=3;
   }else{
    // Clear to black via empty source scene; no previous-shot glow may survive.
    renderer.setRenderTarget(glow);renderer.render(scene,camera);state.passes=2;
   }
   composite.uniforms.strength.value=config.strength;
  }finally{renderer.setRenderTarget(oldTarget);renderer.toneMapping=oldTone;renderer.autoClear=oldAuto;}
 }
 function attach(panel){
  const box=document.createElement('div');box.id='bloomControls';box.style.cssText='border-top:1px solid #596151;margin-top:6px;padding-top:5px';
  box.innerHTML='<label><input id="bloomEnabled" type="checkbox">Bloom</label>';
  for(const [key,label,min,max]of [['strength','Strength',0,1.5],['radius','Radius',0,1],['threshold','Threshold',0,4]]){
   const el=document.createElement('label');el.style.cssText='display:inline-flex;gap:4px;margin:3px 8px';
   el.innerHTML=label+' <input id="bloom_'+key+'" type="range" min="'+min+'" max="'+max+'" step=".01" value="'+config[key]+'" style="width:110px"><output>'+config[key].toFixed(2)+'</output>';
   el.querySelector('input').oninput=e=>{config[key]=Number(e.target.value);el.querySelector('output').textContent=config[key].toFixed(2);};box.append(el);
  }
  box.querySelector('#bloomEnabled').onchange=e=>{config.enabled=e.target.checked;};panel.append(box);
 }
 return {config,state,register,registry,render,resize,composite,attach,source,glow,
  dispose(){for(const {proxy} of registry.values())proxy.material.dispose();registry.clear();for(const t of [source,horizontal,glow])t.dispose();quad.dispose();blur.dispose();composite.dispose();}
 };
}
