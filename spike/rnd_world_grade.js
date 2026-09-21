import {createSelectiveBloom} from './rnd_selective_bloom.js';
import {createToonRamp} from './rnd_toon_ramp.js';
import * as THREE from './vendor/three.module.js';
import {EffectComposer} from './vendor/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/postprocessing/RenderPass.js';
import {ShaderPass} from './vendor/postprocessing/ShaderPass.js';
import {OutputPass} from './vendor/postprocessing/OutputPass.js';

export function createWorldGrade(renderer,scene,camera){
 const presets={
  Neutral:{tone:'None',exposure:1,contrast:1,saturation:1,shadow:1,mid:1,highlight:1,tint:0},
  'Cinematic A':{tone:'ACES',exposure:1,contrast:1.06,saturation:.94,shadow:.96,mid:1.02,highlight:1,tint:.035},
  'Cinematic B':{tone:'Cineon',exposure:1,contrast:1.03,saturation:.98,shadow:.98,mid:1,highlight:1,tint:.02}
 };
 const config={enabled:false,...presets.Neutral};
 const modes={None:THREE.NoToneMapping,ACES:THREE.ACESFilmicToneMapping,Cineon:THREE.CineonToneMapping,Reinhard:THREE.ReinhardToneMapping};
 const size=renderer.getSize(new THREE.Vector2()),dpr=renderer.getPixelRatio();
 const target=new THREE.WebGLRenderTarget(size.x*dpr,size.y*dpr,{type:THREE.HalfFloatType});
 target.samples=Math.min(4,renderer.capabilities.maxSamples||0);
 const composer=new EffectComposer(renderer,target);
 composer.setSize(size.x,size.y);
 const renderPass=new RenderPass(scene,camera);
 const originalRender=renderPass.render.bind(renderPass);
 renderPass.render=(r,...args)=>{const mode=r.toneMapping;r.toneMapping=THREE.NoToneMapping;try{originalRender(r,...args);}finally{r.toneMapping=mode;}};
 const output=new OutputPass();
 // r160 NONE skips exposure; apply exposure once only in that mode.
 output.material.fragmentShader=output.material.fragmentShader.replace('// tone mapping',
 '#if !defined(ACES_FILMIC_TONE_MAPPING) && !defined(CINEON_TONE_MAPPING) && !defined(REINHARD_TONE_MAPPING)\n gl_FragColor.rgb *= toneMappingExposure;\n#endif\n// tone mapping');
 const grade=new ShaderPass({
  uniforms:{tDiffuse:{value:null},contrast:{value:1},saturation:{value:1},gains:{value:new THREE.Vector3(1,1,1)},tint:{value:0}},
  vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:
  'uniform sampler2D tDiffuse;uniform float contrast,saturation,tint;uniform vec3 gains;varying vec2 vUv;'+
  'void main(){vec4 p=texture2D(tDiffuse,vUv);vec3 c=p.rgb;'+
  'float y=dot(c,vec3(.2126,.7152,.0722));float s=1.0-smoothstep(.12,.42,y);float h=smoothstep(.55,.9,y);float m=1.0-s-h;'+
  'c*=s*gains.x+m*gains.y+h*gains.z;'+
  'c*=vec3(1.0)+tint*(s*vec3(-.25,.08,.35)+h*vec3(.25,.08,-.25));'+
  'c=(c-vec3(.5))*contrast+vec3(.5);float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,saturation);'+
  'gl_FragColor=vec4(clamp(c,0.0,1.0),p.a);}'
 });
 grade.material.toneMapped=false;
 const toon=createToonRamp();
 const bloom=createSelectiveBloom(renderer,camera);bloom.resize(size.x*dpr,size.y*dpr);
 composer.addPass(renderPass);composer.addPass(output);composer.addPass(toon.pass);composer.addPass(grade);composer.addPass(bloom.composite);
 let width=size.x,height=size.y,pixelRatio=dpr;
 function preset(name){Object.assign(config,presets[name]||presets.Neutral);}
 function render(){
  const current=renderer.getSize(size),ratio=renderer.getPixelRatio();
  if(current.x!==width||current.y!==height||ratio!==pixelRatio){
   width=current.x;height=current.y;pixelRatio=ratio;composer.setPixelRatio(ratio);composer.setSize(width,height);bloom.resize(width*ratio,height*ratio);
  }
  toon.sync();bloom.render();
  grade.enabled=config.enabled;
  if(!config.enabled&&!toon.pass.enabled&&!bloom.config.enabled){renderer.toneMapping=THREE.NoToneMapping;renderer.toneMappingExposure=1;renderer.setRenderTarget(null);renderer.render(scene,camera);return;}
  renderer.toneMapping=config.enabled?(modes[config.tone]??THREE.NoToneMapping):THREE.NoToneMapping;renderer.toneMappingExposure=config.enabled?config.exposure:1;
  grade.uniforms.contrast.value=config.contrast;grade.uniforms.saturation.value=config.saturation;
  grade.uniforms.gains.value.set(config.shadow,config.mid,config.highlight);grade.uniforms.tint.value=config.tint;
  composer.render(0);
  // Contour and other independent presentation retain their existing color authority.
  renderer.toneMapping=THREE.NoToneMapping;renderer.toneMappingExposure=1;
 }
 const panel=document.createElement('details');panel.id='postControls';panel.open=true;panel.style.cssText='max-height:230px;overflow-y:auto';
 panel.innerHTML='<summary>Color Grading / Toon</summary><div class="controlRow">'+
 '<label><input id="postEnabled" type="checkbox">Color Grading</label>'+
 '<label>Preset <select id="postPreset"><option selected>Neutral</option><option>Cinematic A</option><option>Cinematic B</option></select></label>'+
 '<label>Tone Map <select id="postTone"><option selected>None</option><option>ACES</option><option>Cineon</option><option>Reinhard</option></select></label></div>';
 const sliders=[['exposure','Exposure',.5,2],['contrast','Contrast',.7,1.5],['saturation','Saturation',0,1.5],['shadow','Shadow',.7,1.2],['mid','Mid',.85,1.15],['highlight','Highlight',.8,1.15],['tint','Cool/Warm',0,.1]];
 const advanced=document.createElement('details');advanced.open=true;advanced.innerHTML='<summary>Advanced · Shadow / Mid / Highlight</summary>';
 for(const [key,label,min,max]of sliders){
  const el=document.createElement('label');el.style.cssText='display:inline-flex;align-items:center;gap:4px;margin:3px 8px 3px 0';
  el.innerHTML=label+' <input id="post_'+key+'" type="range" min="'+min+'" max="'+max+'" step=".01" value="'+config[key]+'" style="width:140px"><output>'+config[key].toFixed(2)+'</output>';
  el.querySelector('input').oninput=e=>{config[key]=Number(e.target.value);el.querySelector('output').textContent=config[key].toFixed(2);};
  (['exposure','contrast','saturation'].includes(key)?panel:advanced).append(el);
 }
 panel.append(advanced);toon.attach(panel);bloom.attach(panel);const host=document.getElementById('spikePanel');host.append(panel);host.style.maxHeight='min(38vh, 270px)';host.style.overflowY='auto';
 const refresh=()=>{document.getElementById('postTone').value=config.tone;for(const [key]of sliders){const el=document.getElementById('post_'+key);el.value=config[key];el.nextElementSibling.textContent=config[key].toFixed(2);}};
 document.getElementById('postEnabled').onchange=e=>{config.enabled=e.target.checked;};
 document.getElementById('postTone').onchange=e=>{config.tone=e.target.value;};
 document.getElementById('postPreset').onchange=e=>{preset(e.target.value);refresh();};
 return {config,presets,preset,render,composer,output,grade,toon,bloom,
  get active(){return config.enabled||(toon.config.enabled&&toon.config.strength>0)||bloom.config.enabled;},
  get info(){return {passes:(config.enabled||toon.pass.enabled||bloom.config.enabled)?2+Number(config.enabled)+Number(toon.pass.enabled)+Number(bloom.config.enabled)+bloom.state.passes:0,bloom:{...bloom.state},width:composer.renderTarget1.width,height:composer.renderTarget1.height,samples:target.samples};},
  dispose(){composer.dispose();output.dispose();grade.dispose();toon.dispose();bloom.dispose();}
 };
}
