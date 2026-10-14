import * as THREE from '../spike/vendor/three.module.js';

// Selective adaptation of spike/rnd_target_contour.js (Shift target V1).
// One shared silhouette mask + one black dilation composite. No NPR stack.
// Mask copies borrow source geometry; this module never disposes that geometry.
export function createContourOnly(environment,actors){
  const target=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true,stencilBuffer:false});
  target.texture.minFilter=target.texture.magFilter=THREE.LinearFilter;target.texture.generateMipmaps=false;
  const maskScene=new THREE.Scene();maskScene.background=new THREE.Color(0);
  const white=new THREE.MeshBasicMaterial({name:'CONTOUR_WHITE_MASK',color:0xffffff,side:THREE.DoubleSide,toneMapped:false});
  const screenScene=new THREE.Scene(),screenCamera=new THREE.Camera();
  const shader=new THREE.ShaderMaterial({name:'BLACK_OUTLINE_CONTOUR_ONLY',
    uniforms:{mask:{value:target.texture},texel:{value:new THREE.Vector2(1,1)},widthPixels:{value:1.15}},
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
    fragmentShader:`uniform sampler2D mask; uniform vec2 texel; uniform float widthPixels; varying vec2 vUv;
      void main(){float center=texture2D(mask,vUv).r;float edge=0.0;
        for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++)
          edge=max(edge,texture2D(mask,vUv+vec2(float(x),float(y))*texel*widthPixels).r);
        float alpha=edge*(1.0-center);if(alpha<0.01)discard;
        gl_FragColor=vec4(0.0,0.0,0.0,alpha);
      }`,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),shader);quad.frustumCulled=false;screenScene.add(quad);
  const entries=actors.filter(a=>a.root).map(a=>({root:a.root,id:a.id,environment:false}));
  for(const name of ['ENC_Infantry_Cover_Position_001','ENC_Infantry_Cover_Position_002']){
    const root=environment?.root?.getObjectByName(name);if(root)entries.push({root,id:name,environment:true});
  }
  const pairs=[];
  for(const entry of entries)entry.root.traverse(source=>{
    if(!source.isMesh||source.userData.lookdevOutline||source.isSkinnedMesh||source.morphTargetInfluences)return;
    const materials=Array.isArray(source.material)?source.material:[source.material];
    if(!materials.length||materials.some(m=>!m||m.transparent||m.opacity<1||m.wireframe))return;
    const copy=new THREE.Mesh(source.geometry,white);copy.name='CONTOUR_MASK_'+source.name;
    copy.matrixAutoUpdate=false;copy.castShadow=copy.receiveShadow=false;maskScene.add(copy);pairs.push({source,copy,entry});
  });
  const state={scope:'all',maskMeshes:pairs.length,width:1,height:1,disposed:false,last:null};
  const visible=source=>{for(let n=source;n;n=n.parent)if(!n.visible)return false;return true;};
  return {state,
    resize(w,h){w=Math.max(1,w);h=Math.max(1,h);if(w!==state.width||h!==state.height){target.setSize(w,h);state.width=w;state.height=h;}
      shader.uniforms.texel.value.set(1/w,1/h);},
    setWidth(width){shader.uniforms.widthPixels.value=width;},
    render(renderer,camera,selectedId){
      let active=0;
      for(const p of pairs){
        p.copy.visible=(state.scope==='all'||p.entry.id===selectedId)&&visible(p.source);
        if(p.copy.visible){p.copy.matrix.copy(p.source.matrixWorld);p.copy.layers.mask=p.source.layers.mask;active++;}
      }
      const stats={scope:state.scope,activeMaskMeshes:active,maskCalls:0,maskTriangles:0,compositeCalls:0,compositeTriangles:0};
      if(!active){state.last=stats;return stats;}
      const oldTarget=renderer.getRenderTarget(),oldClear=renderer.autoClear,oldShadow=renderer.shadowMap.enabled;
      const color=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha();
      try{
        renderer.autoClear=true;renderer.shadowMap.enabled=false;renderer.setRenderTarget(target);renderer.setClearColor(0,1);
        renderer.render(maskScene,camera);stats.maskCalls=renderer.info.render.calls;stats.maskTriangles=renderer.info.render.triangles;
        renderer.setRenderTarget(oldTarget);renderer.autoClear=false;renderer.shadowMap.enabled=oldShadow;
        renderer.render(screenScene,screenCamera);stats.compositeCalls=renderer.info.render.calls;stats.compositeTriangles=renderer.info.render.triangles;
      }finally{
        renderer.setRenderTarget(oldTarget);renderer.autoClear=oldClear;renderer.shadowMap.enabled=oldShadow;renderer.setClearColor(color,alpha);
      }
      state.last=stats;return stats;
    },
    metrics(){return {...state,geometryCopies:0,materials:2,renderTargetBytes:state.width*state.height*8};},
    dispose(){if(state.disposed)return;state.disposed=true;for(const p of pairs)maskScene.remove(p.copy);pairs.length=0;
      target.dispose();white.dispose();quad.geometry.dispose();shader.dispose();}
  };
}
