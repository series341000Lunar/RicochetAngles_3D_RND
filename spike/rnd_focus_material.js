// V2B contrast retune; renderer-only presentation. Target and progress are supplied by gameplay.
export function createFocusMaterial() {
  const config={enabled:true,interior:0.22,rim:1.0,power:2.0};
  const state={targetId:null,strength:0,variantsCreated:0,variantsDisposed:0,compiles:0};
  const cache=new Map();
  const linearOutput={value:0};
  let active=null;
  function restore(){
    if(active) for(const p of active.meshes) p.mesh.material=p.original;
    active=null;state.targetId=null;state.strength=0;
  }
  function entry(root){
    if(cache.has(root))return cache.get(root);
    const e={meshes:[],variants:new Map(),uniform:{value:0}};
    function variant(original){
      if(e.variants.has(original))return e.variants.get(original);
      const m=original.clone();
      const previous=original.onBeforeCompile;
      m.onBeforeCompile=(shader,renderer)=>{
        previous.call(m,shader,renderer);
        shader.uniforms.raFocus=e.uniform;
        shader.uniforms.raLinearOutput=linearOutput;
        shader.uniforms.raInterior={value:config.interior};
        shader.uniforms.raRim={value:config.rim};
        shader.uniforms.raPower={value:config.power};
        shader.fragmentShader='vec3 raToLinear(vec3 c){return mix(c/12.92,pow((c+0.055)/1.055,vec3(2.4)),step(vec3(0.04045),c));}\nuniform float raLinearOutput;\nuniform float raFocus;\nuniform float raInterior;\nuniform float raRim;\nuniform float raPower;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <colorspace_fragment>',
          '#include <colorspace_fragment>\n'+
          'if(raLinearOutput>0.5) gl_FragColor.rgb=sRGBTransferOETF(vec4(gl_FragColor.rgb,1.0)).rgb;\n'+
          'vec3 raView = isOrthographic ? vec3(0.0,0.0,1.0) : normalize(vViewPosition);\n'+
          'float raF = min(1.0,1.25 * pow(1.0-clamp(dot(normalize(normal),raView),0.0,1.0),raPower));\n'+
          'float raL = dot(gl_FragColor.rgb,vec3(0.2126,0.7152,0.0722));\n'+
          'float raGray = raInterior * clamp(raL / 0.5,0.55,1.25);\n'+
          'gl_FragColor.rgb = mix(gl_FragColor.rgb,vec3(mix(raGray,raRim,raF)),raFocus);\nif(raLinearOutput>0.5) gl_FragColor.rgb=raToLinear(gl_FragColor.rgb);');
        state.compiles++;
      };
      m.customProgramCacheKey=()=>original.customProgramCacheKey()+'|ra-focus-v2b';
      e.variants.set(original,m);state.variantsCreated++;return m;
    }
    root.traverse(mesh=>{
      if(!mesh.isMesh||!mesh.material)return;
      const original=mesh.material;
      const focused=Array.isArray(original)?original.map(variant):variant(original);
      e.meshes.push({mesh,original,focused});
    });
    cache.set(root,e);return e;
  }
  return {config,state,restore,
    update(targetId,root,progress){
      linearOutput.value=config.linearOutput?1:0;
      const strength=config.enabled?Math.max(0,Math.min(1,progress||0)):0;
      if(!root||!strength){restore();return;}
      const e=entry(root);
      if(active!==e){restore();active=e;for(const p of e.meshes)p.mesh.material=p.focused;}
      // Preserve the original hit-flash and any dynamic opacity without mutating originals.
      for(const [original,m] of e.variants){
        if(m.color&&original.color)m.color.copy(original.color);
        if(m.emissive&&original.emissive)m.emissive.copy(original.emissive);
        m.opacity=original.opacity;
      }
      e.uniform.value=strength;state.targetId=targetId;state.strength=strength;
    },
    releaseRoot(root){
      const e=cache.get(root);if(!e)return;
      if(active===e)restore();
      for(const m of e.variants.values()){m.dispose();state.variantsDisposed++;}
      cache.delete(root);
    },
    dispose(){restore();for(const root of [...cache.keys()])this.releaseRoot(root);},
    get cachedRoots(){return cache.size;}
  };
}
